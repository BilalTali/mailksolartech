<?php

namespace App\Http\Controllers\Solar;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\LeadDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Filesystem\FilesystemAdapter;

class LeadDocumentController extends Controller
{
    public function index(Request $request, string $ulid): \Illuminate\Http\JsonResponse
    {
        $lead = Lead::query()
            ->where('ulid', $ulid)
            ->with(['documents' => function ($query) {
                $query->where('document_type', '!=', 'consumer_signature');
            }])
            ->firstOrFail();
            
        $this->authorizeDocument($request->user(), $lead);

        /** @var array<int, array<string, mixed>> $finalData */
        $finalData = [];

        foreach ($lead->documents as $doc) {
            $finalData[] = [
                'id' => $doc->id,
                'document_type' => $doc->document_type,
                'original_filename' => $doc->original_filename,
                'created_at' => $doc->created_at,
                'download_url' => $doc->download_url,
                'is_virtual' => false,
                'source' => 'creator'
            ];
        }

        $latestSubmission = \App\Models\InstallationSubmission::where('lead_id', $lead->id)->latest('id')->first();
        if ($latestSubmission) {
            $installationDocuments = \App\Models\InstallationDocument::where('installation_submission_id', $latestSubmission->id)->get();
            foreach ($installationDocuments as $doc) {
                $url = URL::temporarySignedRoute(
                    'leads.installation-documents.signed-view',
                    now()->addMinutes(120),
                    ['ulid' => $lead->ulid, 'id' => $doc->id, 'v' => time()]
                );
                
                if (str_starts_with($url, 'http://') && env('APP_ENV') === 'production') {
                    $url = str_replace('http://', 'https://', $url);
                }

                $finalData[] = [
                    'id' => 'install-' . $doc->id,
                    'document_type' => $doc->document_key,
                    'original_filename' => $doc->original_filename,
                    'created_at' => $doc->created_at,
                    'download_url' => $url,
                    'is_virtual' => false,
                    'source' => 'installer',
                    'metadata' => [
                        'make' => $doc->model_make,
                        'serial' => $doc->serial_number
                    ]
                ];
            }
        }

        $annexureBStatuses = ['INSTALLATION_VERIFIED', 'POD_INSPECTION_INITIATED', 'POD_SUCCESSFUL', 'PROJECT_COMMISSIONING', 'SUBSIDY_REQUEST', 'SUBSIDY_APPLIED', 'SUBSIDY_DISBURSED', 'COMPLETED', 'LEAD_COMPLETED'];
        
        $finalData[] = [
            'id' => 'virtual-quotation',
            'document_type' => 'Pro Forma Quotation',
            'original_filename' => 'Quotation-'.($lead->quotation_serial ?: '119').'.pdf',
            'created_at' => $lead->bill_date ?? $lead->created_at,
            'download_url' => url('/api/v1/leads/'.$ulid.'/pdf/quotation'),
            'is_virtual' => true,
            'source' => 'system'
        ];
        $finalData[] = [
            'id' => 'virtual-receipt',
            'document_type' => 'Payment Receipt',
            'original_filename' => 'Receipt-'.($lead->receipt_serial ?: '299').'.pdf',
            'created_at' => $lead->bill_date ?? $lead->created_at,
            'download_url' => url('/api/v1/leads/'.$ulid.'/pdf/receipt'),
            'is_virtual' => true,
            'source' => 'system'
        ];
        $finalData[] = [
            'id' => 'virtual-agreement',
            'document_type' => 'Agreement (Annexure 2)',
            'original_filename' => 'Agreement-'.$lead->ulid.'.html',
            'created_at' => $lead->updated_at,
            'download_url' => URL::temporarySignedRoute(
                'leads.agreement', now()->addMinutes(60), ['ulid' => $lead->ulid]
            ),
            'is_virtual' => true,
            'source' => 'system'
        ];

        if (in_array($lead->status, $annexureBStatuses)) {
            $finalData[] = [
                'id' => 'virtual-annexure-b',
                'document_type' => 'Annexure B',
                'original_filename' => 'Annexure-B-'.$lead->ulid.'.html',
                'created_at' => $lead->updated_at,
                'download_url' => URL::temporarySignedRoute(
                    'leads.annexure_b', now()->addMinutes(60), ['ulid' => $lead->ulid]
                ),
                'is_virtual' => true,
                'source' => 'system'
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $finalData
        ]);
    }

    /**
     * Download a lead document with authorization check.
     */
    public function download(Request $request, string $ulid, int $documentId)
    {
        $lead = Lead::query()->where(fn ($q) => $q->where('ulid', $ulid))->firstOrFail();
        $this->authorizeDocument($request->user(), $lead);

        $document = LeadDocument::query()
            ->where(fn ($q) => $q->where('id', $documentId))
            ->where(fn ($q) => $q->where('lead_id', $lead->id))
            ->firstOrFail();
        $path = $document->file_path;

        // Try 'local' disk first (new secure storage), fallback to 'public' (legacy storage)
        /** @var \Illuminate\Filesystem\FilesystemAdapter $local */
        $local = Storage::disk('local');
        if ($local->exists($path)) {
            return $local->download($path, $document->original_filename);
        }

        /** @var \Illuminate\Filesystem\FilesystemAdapter $public */
        $public = Storage::disk('public');
        if ($public->exists($path)) {
            return $public->download($path, $document->original_filename);
        }

        abort(404, 'File not found on any disk.');
    }

    /**
     * Generate a temporary signed URL for viewing a document.
     */
    public function getSignedUrl(Request $request, string $ulid, int $id)
    {
        $lead = Lead::query()->where(fn ($q) => $q->where('ulid', $ulid))->firstOrFail();
        $this->authorizeDocument($request->user(), $lead);

        $url = URL::temporarySignedRoute(
            'api.v1.leads.documents.signed-view',
            now()->addMinutes(120),
            ['ulid' => $ulid, 'id' => $id]
        );

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json(['url' => $url]);
        }

        return redirect($url);
    }

    /**
     * View a document via a signed URL (no auth header needed).
     */
    public function viewSigned(Request $request, string $ulid, int $id)
    {
        \Illuminate\Support\Facades\Log::info('SIGNED_VIEW_HIT', [
            'ulid' => $ulid,
            'id' => $id,
            'query' => $request->query(),
            'url' => $request->fullUrl()
        ]);

        // Manual signature verification (better for production error handling)
        if (! $request->hasValidSignature()) {
            \Illuminate\Support\Facades\Log::warning('INVALID_SIGNATURE', [
                'ulid' => $ulid,
                'id' => $id,
                'full_url' => $request->fullUrl(),
                'ip' => $request->ip()
            ]);
            abort(403, 'Invalid or expired signature.');
        }

        $lead = Lead::query()->where(fn ($q) => $q->where('ulid', $ulid))->firstOrFail();
        $document = LeadDocument::query()
            ->where(fn ($q) => $q->where('id', $id))
            ->where(fn ($q) => $q->where('lead_id', $lead->id))
            ->firstOrFail();
        $path = $document->file_path;

        $isDownload = $request->query('disposition') === 'attachment';
        $filename = $document->original_filename ?: basename($path);

        \Illuminate\Support\Facades\Log::info('FILE_PATH_RESOLVED', [
            'path' => $path,
            'is_download' => $isDownload
        ]);

        /** @var \Illuminate\Filesystem\FilesystemAdapter $local */
        $local = Storage::disk('local');
        if ($local->exists($path)) {
            while (ob_get_level()) {
                ob_end_clean();
            }
            return $isDownload 
                ? $local->download($path, $filename)
                : $local->response($path);
        }

        /** @var \Illuminate\Filesystem\FilesystemAdapter $public */
        $public = Storage::disk('public');
        if ($public->exists($path)) {
            while (ob_get_level()) {
                ob_end_clean();
            }
            return $isDownload 
                ? $public->download($path, $filename)
                : $public->response($path);
        }

        abort(404, 'File not found');
    }

    public function viewSignedInstallation(Request $request, string $ulid, int $id)
    {
        if (! $request->hasValidSignature()) {
            abort(403, 'Invalid or expired signature.');
        }

        $lead = Lead::query()->where('ulid', $ulid)->firstOrFail();
        $document = \App\Models\InstallationDocument::query()
            ->where('id', $id)
            ->where('lead_id', $lead->id)
            ->firstOrFail();
        
        $path = $document->file_path;
        $isDownload = $request->query('disposition') === 'attachment';
        $filename = $document->original_filename ?: basename($path);

        /** @var \Illuminate\Filesystem\FilesystemAdapter $local */
        $local = Storage::disk('local');
        if ($local->exists($path)) {
            while (ob_get_level()) { ob_end_clean(); }
            return $isDownload ? $local->download($path, $filename) : $local->response($path);
        }

        abort(404, 'File not found');
    }

    private function authorizeDocument($user, $lead)
    {
        $isAuthorized = $user->isAdmin() ||
                        $user->isOperator() ||
                        ($user->id === (int) $lead->assigned_agent_id) ||
                        ($user->id === (int) $lead->assigned_super_agent_id) ||
                        ($user->id === (int) $lead->submitted_by_agent_id) ||
                        ($user->id === (int) $lead->submitted_by_enumerator_id) ||
                        ($user->id === (int) $lead->created_by_super_agent_id) ||
                        ($user->id === (int) $lead->assigned_surveyor_id) ||
                        ($user->id === (int) $lead->assigned_installer_id);

        if (! $isAuthorized) {
            abort(403, 'Unauthorized access to this document.');
        }
    }

    public function showAnnexureB(Request $request, string $ulid)
    {
        $lead = Lead::query()->where('ulid', $ulid)->firstOrFail();

        // CRIT-04: Always enforce access — both for authenticated API requests
        // and for signed-URL (no Sanctum token) requests.
        if ($request->user()) {
            $this->authorizeDocument($request->user(), $lead);
        } else {
            // If accessed without auth (public signed URL), require a valid signature.
            // The signature alone is not enough — anyone with the link would have access.
            // We gate it: the signed URL must have been generated by an authorized user
            // (the signed URL generator in getSignedUrl() already enforces auth).
            // However as an extra safety net: if no user AND no valid signature, abort.
            if (! $request->hasValidSignature()) {
                abort(403, 'Unauthorized access to this document.');
            }
        }

        $vendor = (object) [
            'name' => \App\Models\Setting::getValue('company_name', 'Andleeb Solar'),
            'registered_address' => \App\Models\Setting::getValue('company_address', 'Registered Office'),
            'signature' => \App\Models\Setting::getValue('company_signature')
        ];

        $latestSubmission = \Illuminate\Support\Facades\DB::table('installation_submissions')
            ->where('lead_id', $lead->id)
            ->latest('id')
            ->first();

        $installData = [];
        if ($latestSubmission) {
            $docs = \Illuminate\Support\Facades\DB::table('installation_documents')
                ->where('installation_submission_id', $latestSubmission->id)
                ->get()
                ->keyBy('document_key');

            if (isset($docs['geo_panel_serial'])) {
                $installData['solar_module_make'] = $docs['geo_panel_serial']->model_make;
                $installData['solar_module_sno'] = $docs['geo_panel_serial']->serial_number;
            }
            if (isset($docs['geo_inverter_serial'])) {
                $installData['inverter_make'] = $docs['geo_inverter_serial']->model_make;
                $installData['inverter_sno'] = $docs['geo_inverter_serial']->serial_number;
            }
            $installData['installation_date'] = $latestSubmission->created_at;
        }

        $survey = \App\Models\LeadSurveyRequirement::where('lead_id', $lead->id)->first();
        if ($survey) {
            $installData['inverter_rating'] = $survey->inverter_rating;
            $installData['remote_monitoring_configured'] = $survey->remote_monitoring_configured ? 'Yes' : 'No';
            $installData['dcdb_rating'] = $survey->dcdb_rating;
            $installData['acdb_rating'] = $survey->acdb_rating;
            $installData['dc_wire_type'] = $survey->dc_wire_type;
            $installData['dc_wire_size'] = $survey->dc_wire_size;
            $installData['ac_wire_type'] = $survey->ac_wire_type;
            $installData['ac_wire_size'] = $survey->ac_wire_size;
            $installData['earth_wire_type'] = $survey->earth_wire_type;
            $installData['earth_wire_size'] = $survey->earth_wire_size;
        }

        $installData['consumer_cid'] = $lead->consumer_number;

        $leadSignature = $this->getSignatureBase64($lead->consumer_signature_path);
        $vendorSignature = $this->getSignatureBase64($vendor->signature);

        return view('leads.documents.annexure_b', compact('lead', 'vendor', 'leadSignature', 'vendorSignature', 'installData'));
    }

    public function showAgreement(Request $request, string $ulid)
    {
        $lead = Lead::where('ulid', $ulid)->firstOrFail();

        // CRIT-04: Always enforce access.
        if ($request->user()) {
            $this->authorizeDocument($request->user(), $lead);
        } else {
            if (! $request->hasValidSignature()) {
                abort(403, 'Unauthorized access to this document.');
            }
        }
        
        $vendor = (object) [
            'name' => \App\Models\Setting::getValue('company_name', 'Andleeb Solar'),
            'registered_address' => \App\Models\Setting::getValue('company_address', 'Registered Office'),
            'signature' => \App\Models\Setting::getValue('company_signature')
        ];

        $leadSignature = $this->getSignatureBase64($lead->consumer_signature_path);
        $vendorSignature = $this->getSignatureBase64($vendor->signature);

        return view('leads.documents.agreement', compact('lead', 'vendor', 'leadSignature', 'vendorSignature'));
    }

    private function getSignatureBase64(?string $pathOrUrl): ?string
    {
        if (empty($pathOrUrl)) return null;
        if (\Illuminate\Support\Str::startsWith($pathOrUrl, 'data:image')) return $pathOrUrl;

        $relativePath = $pathOrUrl;
        $disk = 'local';

        if (\Illuminate\Support\Str::startsWith($pathOrUrl, 'http')) {
            $parsedUrl = parse_url($pathOrUrl, PHP_URL_PATH);
            if ($parsedUrl) {
                $relativePath = preg_replace('#^/storage/#', '', $parsedUrl);
                $disk = 'public';
            }
        }

        /** @var \Illuminate\Filesystem\FilesystemAdapter $primaryDisk */
        $primaryDisk = Storage::disk($disk);
        if ($primaryDisk->exists($relativePath)) {
            $mime = $primaryDisk->mimeType($relativePath);
            $content = $primaryDisk->get($relativePath);
            return 'data:' . $mime . ';base64,' . base64_encode($content);
        }

        $fallbackDiskName = $disk === 'local' ? 'public' : 'local';
        /** @var \Illuminate\Filesystem\FilesystemAdapter $fallbackDisk */
        $fallbackDisk = Storage::disk($fallbackDiskName);
        if ($fallbackDisk->exists($relativePath)) {
            $mime = $fallbackDisk->mimeType($relativePath);
            $content = $fallbackDisk->get($relativePath);
            return 'data:' . $mime . ';base64,' . base64_encode($content);
        }

        return null;
    }
}
