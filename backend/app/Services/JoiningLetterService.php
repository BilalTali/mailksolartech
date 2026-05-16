<?php

namespace App\Services;

use App\Models\Setting;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class JoiningLetterService
{
    /**
     * Generate unique letter number
     */
    public function generateLetterNumber(User $user): string
    {
        $prefix = match($user->role) {
            'super_agent' => 'SMS/BDM/',
            'enumerator' => 'SMS/ENM/',
            default => 'SMS/BDE/',
        };
        $year = date('Y');
        $lastLetter = User::query()->where(fn ($q) => $q->where('letter_number', 'like', "{$prefix}{$year}/%"))
            ->orderBy('letter_number', 'desc')
            ->first();

        $sequence = 1;
        if ($lastLetter) {
            /** @var User $lastLetter */
            $parts = explode('/', (string)$lastLetter->letter_number);
            $sequence = (int) end($parts) + 1;
        }

        return $prefix.$year.'/'.str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Build view data for the joining letter
     */
    public function buildLetterData(User $user): array
    {
        // ── Card/Letter Number ───────────────────────────────────
        $letterNumber = match ($user->role) {
            'admin' => 'ADM-'.str_pad($user->id, 4, '0', STR_PAD_LEFT),
            'super_agent' => $user->super_agent_code ?? ('SSM-'.str_pad($user->id, 4, '0', STR_PAD_LEFT)),
            'agent' => $user->agent_id ?? ('SM-'.str_pad($user->id, 4, '0', STR_PAD_LEFT)),
            'enumerator' => $user->enumerator_id ?? ('ENM-'.str_pad($user->id, 4, '0', STR_PAD_LEFT)),
            default => 'SMS-'.str_pad($user->id, 4, '0', STR_PAD_LEFT),
        };

        // ── Designation ───────────────────────────────────────────
        $designation = match ($user->role) {
            'admin' => 'ADMINISTRATOR',
            'super_agent' => 'BUSINESS DEVELOPMENT MANAGER',
            'agent' => 'BUSINESS DEVELOPMENT EXECUTIVE',
            'enumerator' => 'FIELD ENUMERATOR',
            default => 'MEMBER',
        };

        $adminId = $user->getRootAdminId();

        // ── Company Settings (Shared with ICard) ──────────────────
        $companyName = Setting::getValue('company_name', 'SURYAMITRA SOLAR NETWORK', $adminId);
        $companyAddress = Setting::getValue('company_address', 'Srinagar, Jammu & Kashmir', $adminId);
        $companyEmail = Setting::getValue('company_email', 'info@suryamitra.in', $adminId);
        $companyWebsite = Setting::getValue('company_website', 'https://suryamitra.in', $adminId);
        $companyPhone = Setting::getValue('company_phone', '', $adminId);
        $companyRegNo = Setting::getValue('company_registration_no', null, $adminId);
        $companyAffiliatedWith = Setting::getValue('company_affiliated_with', '', $adminId);
        $companyTagline = Setting::getValue('company_tagline', 'Empowering India with Free Solar Energy', $adminId);

        // Global branding fallbacks - prioritizing affiliation partner, then platform name
        $globalAffiliated = Setting::query()->where('key', 'company_affiliated_with')->whereNull('user_id')->first()?->value;
        $globalSiteName = Setting::query()->where('key', 'company_name')->whereNull('user_id')->first()?->value;
        $globalRegNumber = Setting::query()->where('key', 'company_registration_no')->whereNull('user_id')->first()?->value;

        $globalName = $globalAffiliated ?: ($globalSiteName ?: 'ANDLEEB SURYA');

        // ── Branding Assets (Dynamic) ─────────────────────────────
        // Logo 1: Admin's specialized team logo
        $logoPath = Setting::getValue('company_logo_2', null, $adminId, false);
        // Logo 2: Global Platform Logo (Affiliate Partner)
        $logoPath2 = Setting::query()->where('key', 'company_logo')->whereNull('user_id')->first()?->value;

        $signaturePath = Setting::getValue('company_signature', null, $adminId, false);
        $sealPath = Setting::getValue('company_seal', null, $adminId, false);

        $logoBase64 = $this->getBase64Image($logoPath, true);
        $logoBase64_2 = $this->getBase64Image($logoPath2, true);
        $sigBase64 = $this->getBase64Image($signaturePath, false);
        $sealBase64 = $this->getBase64Image($sealPath, false);

        // ── Legacy Setting Fetch for Other Text ────────────────────
        $settings = Setting::getMergedSettings($adminId)
            ->whereIn('group', ['company', 'signatory', 'letter'])
            ->pluck('value', 'key')
            ->toArray();

        // ── Process Body Placeholders ─────────────────────────────
        $bodyTemplate = $user->role === 'super_agent'
            ? ($settings['letter_super_agent_body'] ?? '')
            : ($settings['letter_agent_body'] ?? '');

        // Basic mask for bank and PAN
        $maskedBank = $user->bank_account_number ? str_repeat('*', max(0, strlen($user->bank_account_number) - 4)).substr($user->bank_account_number, -4) : 'N/A';
        $maskedPan = $user->pan_number ? substr($user->pan_number, 0, 2).str_repeat('*', max(0, strlen($user->pan_number) - 5)).substr($user->pan_number, -3) : 'N/A';

        $placeholders = [
            '{name}' => $user->name,
            '{agent_id}' => $user->agent_id,
            '{super_agent_code}' => $user->super_agent_code,
            '{joining_date}' => $user->joining_date ? date('d-m-Y', strtotime($user->joining_date)) : date('d-m-Y'),
            '{territory}' => $user->territory ?? 'Assigned Regions',
            '{pan}' => $maskedPan,
            '{bank_account}' => $maskedBank,
            '{bank_ifsc}' => $user->bank_ifsc ?? 'N/A',
            '{website}' => $companyWebsite,
            '{company_name}' => $companyName,
        ];

        $body = str_replace(array_keys($placeholders), array_values($placeholders), $bodyTemplate);

        // ── Process Terms ─────────────────────────────────────────
        $termsString = $settings['letter_terms'] ?? '';
        $terms = array_filter(explode("\n", $termsString));

        return [
            'user' => $user,
            'companyName' => $companyName,
            'companyAddress' => $companyAddress,
            'companyEmail' => $companyEmail,
            'companyWebsite' => $companyWebsite,
            'companyPhone' => $companyPhone,
            'companyRegNo' => $companyRegNo,
            'companyAffiliatedWith' => $companyAffiliatedWith,
            'companyTagline' => $companyTagline,
            'logoBase64' => $logoBase64,
            'logoBase64_2' => $logoBase64_2,
            'sigBase64' => $sigBase64,
            'sealBase64' => $sealBase64,
            'designation' => $designation,
            'letterNumber' => $letterNumber,
            'body' => $body,
            'terms' => $terms,
            'settings' => $settings,
            'affiliatedPartner' => $globalName,
            'globalName' => $globalName,
            'globalRegNo' => $globalRegNumber,
            'authorizedSignatory' => Setting::getValue('authorized_signatory', 'Authorized Signatory', $adminId),
            'signatoryTitle' => Setting::getValue('icard_verified_by', 'CHIEF OPERATIONS OFFICER', $adminId),
            'barcodeBase64' => $this->generateBarcode($letterNumber),
            'qrBase64' => $this->generateQrCode($user),
            'verifyUrl' => $user->qr_token ? (rtrim(config('app.frontend_url') ?? env('APP_FRONTEND_URL', 'https://andleebsurya.in'), '/').'/verify/'.$user->qr_token) : null,
            'profilePhotoBase64' => $this->getBase64Image($user->profile_photo),
        ];



    }

    /**
     * Generate PDF and return either content or download response
     */
    public function generatePdf(User $user, bool $download = true)
    {
        $data = $this->buildLetterData($user);

        $pdf = Pdf::loadView('joining-letter.index', $data)
            ->setPaper('a4', 'portrait')
            ->setOptions([
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => true,
                'defaultFont' => 'helvetica',
            ]);

        $fileName = 'Joining_Letter_'.Str::slug($user->name).'_'.date('Ymd').'.pdf';

        if ($download) {
            while (ob_get_level()) {
                ob_end_clean();
            }
            return $pdf->download($fileName);
        }

        while (ob_get_level()) {
            ob_end_clean();
        }
        return $pdf->output();
    }

    /**
     * Generate barcode image for the letter.
     */
    private function generateBarcode(string $cardNumber): ?string
    {
        try {
            $generator = new \Picqer\Barcode\BarcodeGeneratorPNG;
            $barcodeData = $generator->getBarcode(
                $cardNumber,
                \Picqer\Barcode\BarcodeGenerator::TYPE_CODE_128,
                2,
                50
            );

            return 'data:image/png;base64,'.base64_encode($barcodeData);
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Generate a QR code for the user.
     * Uses verification URL if qr_token exists, otherwise falls back to legacy text.
     */
    private function generateQrCode(User $user): ?string
    {
        $icardClearance = Setting::getValue('icard_clearance', 'Level-V (Elite)');
        $companyName = Setting::getValue('company_name', 'SURYAMITRA SOLAR NETWORK', null);
        $cardNumber = $user->agent_id ?? $user->super_agent_code ?? 'ADM-PENDING';

        if ($user->qr_token) {
            $frontendUrl = config('app.frontend_url') ?? env('APP_FRONTEND_URL', 'https://andleebsurya.in');
            $qrString = rtrim($frontendUrl, '/').'/verify/'.$user->qr_token;
        } else {

            $qrString = "NAME: {$user->name}\n"
                      ."ID: {$cardNumber}\n"
                      .'FATHER: '.($user->father_name ?? 'N/A')."\n"
                      .'DOB: '.($user->dob ? $user->dob->format('d-m-Y') : 'N/A')."\n"
                      .'BLOOD: '.($user->blood_group ?? 'N/A')."\n"
                      .'CONTACT: '.($user->mobile ?? 'N/A')."\n"
                      ."CLEARANCE: {$icardClearance}\n"
                      ."COMPANY: {$companyName}";
        }

        return $this->generatePremiumQr($qrString);
    }

    /**
     * Generate a premium styled QR code with fallbacks.
     */
    private function generatePremiumQr(string $data): ?string
    {
        try {
            $qrData = QrCode::format('svg')
                ->size(300)
                ->margin(2)
                ->errorCorrection('H')
                ->color(10, 25, 49)
                ->generate($data);

            return 'data:image/svg+xml;base64,'.base64_encode($qrData);
        } catch (\Throwable $e) {

            try {
                $qrData = QrCode::format('png')
                    ->size(300)
                    ->margin(1)
                    ->errorCorrection('H')
                    ->color(10, 25, 49)
                    ->generate($data);

                return 'data:image/png;base64,'.base64_encode($qrData);
            } catch (\Throwable $e2) {
                try {
                    $qrData = QrCode::format('svg')
                        ->size(300)
                        ->generate($data);

                    return 'data:image/svg+xml;base64,'.base64_encode($qrData);

                } catch (\Throwable $e3) {
                    return null;
                }


            }
        }
    }

    /**
     * Helper to get base64 image (Robust sync with ICardService)
     */
    private function getBase64Image(?string $path, bool $useFallback = true): ?string
    {
        if (! $path) {
            return $useFallback ? $this->getFallbackLogo() : null;
        }

        // Handle full URLs
        if (filter_var($path, FILTER_VALIDATE_URL)) {
            $storageUrl = asset('storage/');
            if (str_starts_with($path, $storageUrl)) {
                $path = str_replace($storageUrl, '', $path);
            } else {
                try {
                    $content = @file_get_contents($path);
                    if ($content) {
                        $finfo = new \finfo(FILEINFO_MIME_TYPE);
                        $mimeType = $finfo->buffer($content);
                        return 'data:' . $mimeType . ';base64,' . base64_encode($content);
                    }
                } catch (\Throwable $e) {}
                return $useFallback ? $this->getFallbackLogo() : null;
            }
        }

        // 1. Try public path
        $fullPath = public_path($path);
        if (file_exists($fullPath) && ! is_dir($fullPath)) {
            $type = pathinfo($fullPath, PATHINFO_EXTENSION);
            return 'data:image/'.$type.';base64,'.base64_encode(file_get_contents($fullPath));
        }

        // 2. Try storage disk
        if (Storage::disk('public')->exists($path)) {
            $content = Storage::disk('public')->get($path);
            $type = pathinfo($path, PATHINFO_EXTENSION);
            return 'data:image/'.$type.';base64,'.base64_encode($content);
        }

        return $useFallback ? $this->getFallbackLogo() : null;
    }

    private function getFallbackLogo(): string
    {
        return 'data:image/svg+xml;base64,'.base64_encode('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#0A1931"/><text x="50" y="65" font-family="Arial" font-size="40" font-weight="bold" fill="#F7B100" text-anchor="middle">AS</text></svg>');
    }
}
