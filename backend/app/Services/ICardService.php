<?php

namespace App\Services;

use App\Models\LeadDocument;
use App\Models\Setting;
use App\Models\User;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class ICardService
{
    /**
     * Build all view data for the icard Blade template.
     */
    public function buildViewData(User $user, string $photoShape = 'hexagon'): array
    {
        // ── Card Number ───────────────────────────────────────────
        // ── Card Number ───────────────────────────────────────────
        $cardNumber = match ($user->role) {
            'admin' => $user->agent_id ?? ('ADM-'.str_pad($user->id, 4, '0', STR_PAD_LEFT)),
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

        // ── Initials (for avatar fallback) ────────────────────────
        $nameParts = explode(' ', trim($user->name));
        $initials = strtoupper(
            (isset($nameParts[0]) ? substr($nameParts[0], 0, 1) : '').
            (isset($nameParts[1]) ? substr($nameParts[1], 0, 1) : '')
        );

        $adminId = $user->getRootAdminId();

        // ── Admin-Specific Branding (Front Side) ──────────────────
        $adminLogoPath = Setting::getValue('company_logo_2', null, $adminId, false);
        $adminSignaturePath = Setting::getValue('company_signature', null, $adminId, false);
        $adminSealPath = Setting::getValue('company_seal', null, $adminId, false);
        
        $logoBase64 = $this->getBase64Image($adminLogoPath);
        $sigBase64 = $this->getBase64Image($adminSignaturePath);
        $sealBase64 = $this->getBase64Image($adminSealPath);

        // ── Global/Super Admin Branding (Back Side) ───────────────
        $fetchGlobal = fn($key) => Setting::query()->where('key', $key)->whereNull('user_id')->first()?->value;

        // Custom direct fetch helper to bypass Cache::rememberForever during ICard generation
        $directFetch = function($key, $userId = null) {
            $val = Setting::query()->where('key', $key)->where('user_id', $userId)->first()?->value;
            if ($val === null && $userId !== null) {
                // Fallback to global
                $val = Setting::query()->where('key', $key)->whereNull('user_id')->first()?->value;
            }
            return $val;
        };

        $globalLogoPath = $fetchGlobal('company_logo');
        $globalSignaturePath = $fetchGlobal('company_signature');
        $globalAffiliatedPartner = $fetchGlobal('company_affiliated_with');
        $globalRegNo = $fetchGlobal('company_registration_no');
        $globalName = $fetchGlobal('company_name');

        // Clean up empty strings to ensure fallbacks work correctly
        if (empty($globalAffiliatedPartner)) $globalAffiliatedPartner = null;
        if (empty($globalName)) $globalName = null;
        if (empty($globalRegNo)) $globalRegNo = null;

        $globalLogoBase64 = $this->getBase64Image($globalLogoPath);
        $globalSigBase64 = $this->getBase64Image($globalSignaturePath);

        // ── Company Settings (Direct Fetch to Bypass Cache) ───────
        $companyName = $directFetch('company_name', $adminId);
        $companyAddress = $directFetch('company_address', $adminId);
        $companyEmail = $directFetch('company_email', $adminId);
        $companyRegNo = $directFetch('company_registration_no', $adminId);
        $websiteUrl = $directFetch('company_website', $adminId);
        $companyWebsite = preg_replace('#^https?://#', '', $websiteUrl ?? '');
        $companyPhone = $directFetch('company_phone', $adminId);

        $companyAffiliatedWith = $directFetch('company_affiliated_with', $adminId);
        $authorizedSignatory = $directFetch('authorized_signatory', $adminId) ?? 'Authorized Signatory';

        // ── Card Content Settings (Dynamic) ────────────────────────
        $icardClearance = $directFetch('icard_clearance', $adminId);
        $companyEmergency = $directFetch('company_emergency', $adminId);
        $icardVerifiedBy = $directFetch('icard_verified_by', $adminId);

        $icardWarningText = $directFetch('icard_warning_text', $adminId);

        // ── QR Code & Verification (New Phase 30) ──────────────────
        $frontendUrl = config('app.frontend_url') ?? env('APP_FRONTEND_URL', 'https://andleebsurya.in');
        $verifyUrl = $user->qr_token ? rtrim($frontendUrl, '/').'/verify/'.$user->qr_token : null;


        // ── Dynamic Dynamic Content ──
        $barcodeBase64 = $this->generateBarcode($cardNumber);
        $qrCodeBase64 = $this->generateQrCodeLegacy($user);
        $qrBase64 = $this->generateQrCode($user);


        // ── Joining Date ───────────────────────────────────────────
        $joiningDate = ($user->approved_at ?? $user->joining_date)
            ? ($user->approved_at ?? $user->joining_date)->format('d-m-Y')
            : date('d-m-Y');

        $dob = $user->dob ? $user->dob->format('d-m-Y') : 'N/A';
        $mobile = $user->mobile ?? '—';
        $rawAddress = $user->permanent_address ?? $user->current_address;
        $fullAddress = collect([$rawAddress, $user->district, $user->state])
            ->filter()
            ->join(', ');
        $address = $fullAddress ? Str::limit($fullAddress, 65) : null;

        $photoPath = $user->profile_photo;

        // ── Fallback: Lead Document Photo ──────────────────────────
        // Some users might have a photo uploaded during lead stage but not in the user profile photo field.
        if (!$photoPath) {
            /** @var \App\Models\Lead|null $lead */
            $lead = \App\Models\Lead::query()
                ->where(fn($q) => $q->where('submitted_by_enumerator_id', $user->id)
                    ->orWhere('submitted_by_agent_id', $user->id)
                    ->orWhere('beneficiary_mobile', $user->mobile))
                ->first();
            
            if ($lead) {
                $leadPhoto = $lead->documents()->where('document_type', 'photo')->first();
                if ($leadPhoto && $leadPhoto->file_path) {
                    $photoPath = $leadPhoto->file_path;
                }
            }
        }

        $profilePhotoBase64 = $this->getProcessedProfilePhoto($photoPath, $photoShape);
        
        $validUntil = ($user->approved_at ?? $user->joining_date)
            ? ($user->approved_at ?? $user->joining_date)->addYear()->format('d M Y')
            : now()->addYear()->format('d M Y');
        $issuedDate = ($user->approved_at ?? $user->joining_date)
            ? ($user->approved_at ?? $user->joining_date)->format('d M Y')
            : now()->format('d M Y');

        $affiliatedPartner = $directFetch('company_affiliated_with', $adminId)
                             ?: ($globalAffiliatedPartner ?: $globalName);

        return compact(
            'user',
            'cardNumber',
            'designation',
            'initials',
            'joiningDate',
            'dob',
            'mobile',
            'address',
            'companyName',
            'companyAddress',
            'companyEmail',
            'companyWebsite',
            'companyPhone',
            'companyRegNo',
            'companyAffiliatedWith',
            'companyEmergency',
            'authorizedSignatory',
            'icardClearance',
            'icardVerifiedBy',
            'icardWarningText',
            'logoBase64',
            'sigBase64',
            'sealBase64',
            'globalLogoBase64',
            'globalSigBase64',
            'globalAffiliatedPartner',
            'globalRegNo',
            'globalName',
            'barcodeBase64',
            'qrCodeBase64',
            'qrBase64',
            'verifyUrl',
            'profilePhotoBase64',
            'validUntil',
            'issuedDate',
            'affiliatedPartner'
        );





    }

    /**
     * Generate barcode image and return its temp file path.
     */
    private function generateBarcode(string $cardNumber): ?string
    {
        try {
            $generator = new \Picqer\Barcode\BarcodeGeneratorPNG;
            $barcodeData = $generator->getBarcode(
                $cardNumber,
                \Picqer\Barcode\BarcodeGenerator::TYPE_CODE_128,
                2,   // width factor
                50   // height in pixels
            );

            return 'data:image/png;base64,'.base64_encode($barcodeData);
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Generate a QR code for the user's verification token.
     */
    private function generateQrCode(User $user): ?string
    {
        if (! $user->qr_token) {
            $user->qr_token = bin2hex(random_bytes(16));
            $user->save();
        }

        $frontendUrl = config('app.frontend_url') ?? env('APP_FRONTEND_URL', 'https://andleebsurya.in');
        $url = rtrim($frontendUrl, '/').'/verify/'.$user->qr_token;

        return $this->generatePremiumQr($url);
    }


    /**
     * Generate a premium styled QR code with fallbacks.
     */
    private function generatePremiumQr(string $data): ?string
    {
        try {
            // Use SVG format as it doesn't require imagick
            $qrData = QrCode::format('svg')
                ->size(300)
                ->margin(2)
                ->errorCorrection('H')
                ->color(10, 25, 49)
                ->generate($data);

            return 'data:image/svg+xml;base64,'.base64_encode($qrData);
        } catch (\Throwable $e) {

            try {
                // Fallback 1: Simpler style (often works with standard GD)
                $qrData = QrCode::format('png')
                    ->size(300)
                    ->margin(1)
                    ->errorCorrection('H')
                    ->color(10, 25, 49)
                    ->generate($data);

                return 'data:image/png;base64,'.base64_encode($qrData);
            } catch (\Throwable $e2) {
                // Fallback 2: Basic PNG
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
     * Generate a legacy QR code with detailed user information.
     */
    private function generateQrCodeLegacy(User $user): ?string
    {
        if (! $user->qr_token) {
            $user->qr_token = bin2hex(random_bytes(16));
            $user->save();
        }

        $frontendUrl = env('FRONTEND_URL', config('app.url'));
        $url = rtrim($frontendUrl, '/').'/verify/'.$user->qr_token;

        return $this->generatePremiumQr($url);
    }

    /**
     * Generate PDF for iCard 2 and return as download response.
     */
    public function generateAndDownload2(User $user): Response
    {
        $data = $this->buildViewData($user, 'circle');
        $html = view('icard.icard2', $data)->render();
        $filename = 'SuryaMitra-iCard2-'.Str::slug($user->name).'-'.$data['cardNumber'].'.pdf';

        $options = new Options;
        $options->set('isRemoteEnabled', true);
        $options->set('isHtml5ParserEnabled', true);
        $options->set('chroot', [base_path(), public_path(), storage_path()]);

        $dompdf = new Dompdf($options);
        
        // landscape paper for side-by-side cards (approx 760px x 653px)
        $dompdf->setPaper([0, 0, 570, 500]); 

        $dompdf->loadHtml($html);
        $dompdf->render();

        while (ob_get_level()) {
            ob_end_clean();
        }

        return response(
            $dompdf->output(),
            200,
            [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="'.$filename.'"',
            ]
        );
    }

    /**
     * Get base64 encoded image string for DOMPDF.
     */
    private function getBase64Image(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        // Handle full URLs if they were passed through (strip prefix to get relative path)
        if (str_starts_with($path, 'http')) {
            $storageUrl = asset('storage/');
            if (str_starts_with($path, $storageUrl)) {
                $path = str_replace($storageUrl, '', $path);
            } else {
                // External URL: try to download or fallback to placeholder
                try {
                    $content = @file_get_contents($path);
                    if ($content) {
                        $finfo = new \finfo(FILEINFO_MIME_TYPE);
                        $mimeType = $finfo->buffer($content);
                        return 'data:' . $mimeType . ';base64,' . base64_encode($content);
                    }
                } catch (\Throwable $e) {
                    // Fallback to placeholder if download fails
                }
            }
        }

        // 1. Try public path first (for assets/images)
        $fullPath = public_path($path);
        if (file_exists($fullPath) && ! is_dir($fullPath)) {
            $type = pathinfo($fullPath, PATHINFO_EXTENSION);

            return 'data:image/'.$type.';base64,'.base64_encode(file_get_contents($fullPath));
        }

        // 2. Try storage disk (for user uploads)
        if (Storage::disk('public')->exists($path)) {
            $content = Storage::disk('public')->get($path);
            $type = pathinfo($path, PATHINFO_EXTENSION);

            return 'data:image/'.$type.';base64,'.base64_encode($content);
        }

        // Fallback placeholder logo (Simple SVG Circle with initials if file missing)
        return 'data:image/svg+xml;base64,'.base64_encode('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#0A1931"/><text x="50" y="65" font-family="Arial" font-size="40" font-weight="bold" fill="#F7B100" text-anchor="middle">AS</text></svg>');
    }

    /**
     * Process profile photo: Crop to square, resize, and apply hexagon mask if possible.
     */
    private function getProcessedProfilePhoto(?string $path, string $shape = 'hexagon'): ?string
    {
        if (!$path) return null;

        $content = null;
        $mimeType = 'image/png';

        // 1. Handle external URLs or Full Storage URLs
        if (filter_var($path, FILTER_VALIDATE_URL)) {
            $storageUrl = asset('storage/');
            if (str_starts_with($path, $storageUrl)) {
                // It's a local storage URL, convert to path
                $path = str_replace($storageUrl, '', $path);
            } else {
                // It's a truly external URL, try to download it
                try {
                    $response = Http::timeout(5)->get($path);
                    if ($response->successful()) {
                        $content = $response->body();
                        $mimeType = $response->header('Content-Type') ?? 'image/png';
                    }
                } catch (\Throwable $e) {
                    return null;
                }
            }
        }

        // 2. Resolve local path if not downloaded yet
        if (!$content) {
            // Check public path first
            $fullPath = public_path($path);
            if (file_exists($fullPath) && !is_dir($fullPath)) {
                $content = file_get_contents($fullPath);
                $mimeType = 'image/' . pathinfo($fullPath, PATHINFO_EXTENSION);
            } 
            // Check storage/app/public
            elseif (Storage::disk('public')->exists($path)) {
                $content = Storage::disk('public')->get($path);
                $mimeType = 'image/' . pathinfo($path, PATHINFO_EXTENSION);
            }
            // Check local disk (for Lead Documents usually stored on local)
            elseif (Storage::disk('local')->exists($path)) {
                $content = Storage::disk('local')->get($path);
                $mimeType = 'image/' . pathinfo($path, PATHINFO_EXTENSION);
            }
        }

        if (!$content) return null;

        try {
            if (!function_exists('imagecreatefromstring')) {
                return 'data:' . $mimeType . ';base64,' . base64_encode($content);
            }

            $img = @imagecreatefromstring($content);
            if (!$img) return 'data:' . $mimeType . ';base64,' . base64_encode($content);

            $w = imagesx($img);
            $h = imagesy($img);
            $size = min($w, $h);
            
            // 1. Crop to square
            $cropped = imagecrop($img, ['x' => ($w - $size) / 2, 'y' => ($h - $size) / 2, 'width' => $size, 'height' => $size]);
            if (!$cropped) $cropped = $img;

            // 2. Resize
            $finalSize = 250;
            $resized = imagecreatetruecolor($finalSize, $finalSize);
            imagealphablending($resized, false);
            imagesavealpha($resized, true);
            imagecopyresampled($resized, $cropped, 0, 0, 0, 0, $finalSize, $finalSize, imagesx($cropped), imagesy($cropped));

            // 3. Apply Mask
            $mask = imagecreatetruecolor($finalSize, $finalSize);
            $magenta = imagecolorallocate($mask, 255, 0, 255);
            $white = imagecolorallocate($mask, 255, 255, 255);
            imagefill($mask, 0, 0, $magenta);
            
            $points = [125, 5, 242, 65, 242, 185, 125, 245, 8, 185, 8, 65];
            
            if ($shape === 'hexagon') {
                imagefilledpolygon($mask, $points, 6, $white);
            } else {
                imagefilledellipse($mask, 125, 125, 246, 246, $white);
            }

            for ($x = 0; $x < $finalSize; $x++) {
                for ($y = 0; $y < $finalSize; $y++) {
                    if (imagecolorat($mask, $x, $y) == $magenta) {
                        imagesetpixel($resized, $x, $y, imagecolorallocatealpha($resized, 0, 0, 0, 127));
                    }
                }
            }

            // 4. Draw Border
            $navy = imagecolorallocate($resized, 4, 17, 31);
            imagesetthickness($resized, 4);
            
            if ($shape === 'hexagon') {
                imagepolygon($resized, $points, 6, $navy);
            } else {
                imagearc($resized, 125, 125, 246, 246, 0, 360, $navy);
            }

            ob_start();
            imagepng($resized);
            $base64 = 'data:image/png;base64,' . base64_encode(ob_get_clean());

            // Image objects are automatically destroyed in PHP 8.4+, imagedestroy is deprecated
            // imagedestroy($img);
            // if ($cropped !== $img) imagedestroy($cropped);
            // imagedestroy($resized);
            // imagedestroy($mask);

            return $base64;
        } catch (\Throwable $e) {
            return 'data:' . $mimeType . ';base64,' . base64_encode($content);
        }
    }
}