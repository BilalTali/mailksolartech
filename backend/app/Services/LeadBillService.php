<?php

namespace App\Services;

use App\Models\Lead;
use App\Models\Setting;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class LeadBillService
{
    public function generateQuotation(Lead $lead): Response
    {
        $data = $this->buildViewData($lead);
        $html = view('pdf.quotation', $data)->render();
        $filename = 'Quotation-' . Str::slug($lead->beneficiary_name) . '-' . $lead->quotation_serial . '.pdf';

        return $this->streamPdf($html, $filename);
    }

    public function generateReceipt(Lead $lead): Response
    {
        $data = $this->buildViewData($lead);
        $html = view('pdf.receipt', $data)->render();
        $filename = 'Receipt-' . Str::slug($lead->beneficiary_name) . '-' . $lead->receipt_serial . '.pdf';

        return $this->streamPdf($html, $filename);
    }

    private function streamPdf(string $html, string $filename): Response
    {
        $options = new Options();
        $options->set('isRemoteEnabled', true);
        $options->set('isHtml5ParserEnabled', true);
        $options->set('chroot', [base_path(), public_path(), storage_path()]);

        $dompdf = new Dompdf($options);
        $dompdf->setPaper('A4', 'portrait');
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
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            ]
        );
    }

    private function buildViewData(Lead $lead): array
    {
        // Force Global/SuperAdmin settings for company branding
        $directFetch = function ($key) {
            return Setting::query()->where('key', $key)->whereNull('user_id')->first()?->value;
        };

        $companyLogoPath = $directFetch('company_logo');
        $companySignaturePath = $directFetch('official_signature') ?: $directFetch('company_signature');

        $logoBase64 = $this->getBase64Image($companyLogoPath);
        $sigBase64 = $this->getBase64Image($companySignaturePath);

        $companyName = $directFetch('company_name') ?: 'Malik Solar Tech Agency';
        $companyAddress = $directFetch('company_address') ?: 'Srinagar, Jammu & Kashmir';
        $companyEmail = $directFetch('company_email') ?: 'info@andleebsurya.in';
        $companyPhone = $directFetch('company_phone') ?: '9596596963';
        $companyRegNo = $directFetch('company_registration_no') ?: 'GSTIN:01BTHPM7743P1Z7';
        $companyAffiliated = $directFetch('company_affiliated_with') ?: 'Government Authorized Vendor for Solar Installation under PM Surya Ghar Yojana';

        $bankAccountName = $directFetch('company_bank_account_name') ?: 'ANDLEEB SURYA TECH';
        $bankAccountNumber = $directFetch('company_bank_account_number') ?: '0656010100000025';
        $bankIfsc = $directFetch('company_bank_ifsc') ?: 'JAKA0TUNNEL';
        $bankBranch = $directFetch('company_bank_branch') ?: 'JK Bank Banihal';

        // Extract system details
        $kw = filter_var($lead->system_capacity, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION) ?: '5';

        $quotationSerial = $lead->quotation_serial ?? '119';
        $quotationDate = $lead->bill_date ? $lead->bill_date->format('d/m/Y') : date('d/m/Y');

        $receiptSerial = $lead->receipt_serial ?? '299';

        $baseAmount = $lead->quotation_base_amount ?? 294500;
        $gstAmount = $lead->quotation_gst_amount ?? 15500;
        $totalAmount = $lead->quotation_total_amount ?? 310000;

        $receiptAmount = $lead->receipt_amount ?? 31000;

        $gstPercentage = $lead->billing_gst_percentage ?? 5;
        $billingItems = $lead->billing_items;

        // Populate legacy if empty
        if (empty($billingItems)) {
            $billingItems = [
                [
                    'description' => $lead->system_item ?: 'Monocrystalline DCR Module 550 Watt',
                    'make' => $lead->system_make ?: 'Luminous/Exide/ServoTech',
                    'rate' => $baseAmount
                ]
            ];
        }

        $address = collect([$lead->beneficiary_address, $lead->beneficiary_district, $lead->beneficiary_state])
            ->filter()
            ->implode(' ');

        if (empty($address))
            $address = "No Address Provided";

        return compact(
            'lead',
            'companyName',
            'companyAddress',
            'companyEmail',
            'companyPhone',
            'companyRegNo',
            'companyAffiliated',
            'bankAccountName',
            'bankAccountNumber',
            'bankIfsc',
            'bankBranch',
            'logoBase64',
            'sigBase64',
            'kw',
            'quotationSerial',
            'quotationDate',
            'receiptSerial',
            'baseAmount',
            'gstAmount',
            'totalAmount',
            'receiptAmount',
            'address',
            'billingItems',
            'gstPercentage'
        );
    }

    private function getBase64Image(?string $path): ?string
    {
        if (!$path)
            return null;

        if (str_starts_with($path, 'http')) {
            $storageUrl = asset('storage/');
            if (str_starts_with($path, $storageUrl)) {
                $path = str_replace($storageUrl, '', $path);
            } else {
                try {
                    $content = file_get_contents($path);
                    if ($content) {
                        $finfo = new \finfo(FILEINFO_MIME_TYPE);
                        $mimeType = $finfo->buffer($content);
                        return 'data:' . $mimeType . ';base64,' . base64_encode($content);
                    }
                } catch (\Throwable $e) {
                }
            }
        }

        $fullPath = public_path($path);
        if (file_exists($fullPath) && !is_dir($fullPath)) {
            $type = pathinfo($fullPath, PATHINFO_EXTENSION);
            return 'data:image/' . $type . ';base64,' . base64_encode(file_get_contents($fullPath));
        }

        if (Storage::disk('public')->exists($path)) {
            $content = Storage::disk('public')->get($path);
            $type = pathinfo($path, PATHINFO_EXTENSION);
            return 'data:image/' . $type . ';base64,' . base64_encode($content);
        }

        return null;
    }
}
