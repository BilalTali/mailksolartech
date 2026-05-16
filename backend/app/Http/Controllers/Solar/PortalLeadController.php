<?php

namespace App\Http\Controllers\Solar;

use App\Http\Controllers\Controller;
use App\Http\Requests\AgentRegistrationRequest;
use App\Http\Requests\StorePublicLeadRequest;
use App\Mail\NewPublicLeadMail;
use App\Models\User;
use App\Services\AgentService;
use App\Services\ConsumerService;
use App\Services\LeadService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class PortalLeadController extends Controller
{
    public function __construct(
        private NotificationService $notificationService,
        private LeadService $leadService,
        private AgentService $agentService,
        private ConsumerService $consumerService,
    ) {}

    public function store(StorePublicLeadRequest $request)
    {
        $data = $request->validated();
        $data['ulid'] = Str::ulid()->toBase32();

        $lead = DB::transaction(function () use ($data, $request) {
            $lead = $this->leadService->createFromPublicForm($data);

            // Handle file uploads
            $documentTypes = ['aadhaar_front', 'aadhaar_back', 'electricity_bill', 'photo', 'other', 'solar_roof_photo', 'bank_passbook'];
            foreach ($documentTypes as $type) {
                if ($request->hasFile($type)) {
                    $this->leadService->uploadDocument($lead, $request->file($type), $type);
                }
            }

            return $lead;
        });

        // Create consumer portal account for the beneficiary
        try {
            $this->consumerService->createForLead($lead);
        } catch (\Throwable $e) {
            Log::warning('ConsumerService::createForLead failed for lead ' . $lead->ulid . ': ' . $e->getMessage());
        }

        // Dispatch queued admin notification email
        try {
            $adminEmail = config('mail.admin_notification_address', config('mail.from.address'));
            Mail::to($adminEmail)->queue(new NewPublicLeadMail($lead));
        } catch (\Throwable $e) {
            Log::warning('Failed to queue lead notification email: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Query submitted successfully',
            'data' => ['reference' => $lead->ulid],
        ], 201);
    }

    public function track(Request $request)
    {
        $request->validate([
            'id' => 'required|string|min:4',
        ]);

        $search = $request->id;

        $lead = \App\Models\Lead::query()->where(fn($q) => $q->where('ulid', $search)
            ->orWhere('beneficiary_mobile', $search))
            ->first();

        /** @var \App\Models\Lead $lead */
        if (! $lead) {
            return response()->json([
                'success' => false,
                'message' => 'No application found with these details.',
            ], 404);
        }

        // Map status to user-friendly messaging
        $statusMap = [
            'NEW' => [
                'status' => 'Application Received',
                'meaning' => 'Your solar query has been successfully received by our team.',
                'next_step' => 'Wait — an official agent will contact you within 24 hours for documents.',
                'index' => 1
            ],
            'REGISTERED' => [
                'status' => 'Portal Registered',
                'meaning' => 'Your application has been successfully uploaded to the MNRE PM-Surya Ghar portal.',
                'next_step' => 'Our technical team is preparing for your site survey.',
                'index' => 2
            ],
            'SITE_SURVEY' => [
                'status' => 'Site Survey Done',
                'meaning' => 'The technical survey for your roof and solar capacity has been completed.',
                'next_step' => 'We are processing the financing and bank formalities.',
                'index' => 3
            ],
            'AT_BANK' => [
                'status' => 'Financing in Progress',
                'meaning' => 'Your application is currently at the bank for loan/financing approval.',
                'next_step' => 'Installation will begin as soon as the financial clearance is received.',
                'index' => 4
            ],
            'COMPLETED' => [
                'status' => 'Installation Completed',
                'meaning' => 'The solar panels and inverter have been successfully installed at your site.',
                'next_step' => 'We are now proceeding with project commissioning and testing.',
                'index' => 5
            ],
            'PROJECT_COMMISSIONING' => [
                'status' => 'Project Commissioned',
                'meaning' => 'Your solar system has been tested and officially commissioned with the DISCOM.',
                'next_step' => 'MNRE subsidy request is being filed by our team.',
                'index' => 6
            ],
            'SUBSIDY_REQUEST' => [
                'status' => 'Subsidy Request Filed',
                'meaning' => 'The formal request for your MNRE subsidy has been submitted.',
                'next_step' => 'Waiting for MNRE inspection and approval.',
                'index' => 7
            ],
            'SUBSIDY_APPLIED' => [
                'status' => 'Subsidy Applied',
                'meaning' => 'Your subsidy application is in the final stages of approval.',
                'next_step' => 'Approval and disbursement expected soon.',
                'index' => 8
            ],
            'SUBSIDY_DISBURSED' => [
                'status' => 'Subsidy Disbursed',
                'meaning' => 'The subsidy amount has been disbursed by MNRE.',
                'next_step' => 'Enjoy your free solar electricity. Your journey is complete!',
                'index' => 9
            ],
        ];

        // Handle "Terminal/Pause" states gracefully
        $specialMap = [
            'ON_HOLD' => ['status' => 'Paused', 'meaning' => 'Your application is currently on hold.', 'next_step' => 'Please contact support for more details.'],
            'INVALID' => ['status' => 'Stopped', 'meaning' => 'Your application was found to be invalid.', 'next_step' => 'Contact the assigned agent for clarification.'],
            'DUPLICATE' => ['status' => 'Duplicate', 'meaning' => 'A duplicate application with your details exists.', 'next_step' => 'Our team is merging the records.'],
            'REJECTED' => ['status' => 'Rejected', 'meaning' => 'Your application was not approved.', 'next_step' => 'Please contact the support team for more information.'],
        ];

        $currentStep = $statusMap[$lead->status] ?? $statusMap['NEW'];
        
        // Override for verification phase if not yet REGISTERED
        if (in_array($lead->status, ['NEW', 'ON_HOLD']) && $lead->verification_status === 'pending_super_agent_verification') {
            $currentStep['status'] = 'Document Verification';
            $currentStep['meaning'] = 'Your documents are being verified by our management team.';
            $currentStep['next_step'] = 'Portal registration will begin once verified.';
        }

        if ($lead->verification_status === 'reverted_to_agent') {
            $currentStep['status'] = 'Correction Required';
            $currentStep['meaning'] = 'There is an issue with your submitted documents.';
            $currentStep['next_step'] = 'Your agent will contact you for mandatory corrections.';
        }

        return response()->json([
            'success' => true,
            'data' => [
                'reference' => $lead->ulid,
                'beneficiary' => $lead->beneficiary_name,
                'status' => $currentStep['status'],
                'meaning' => $currentStep['meaning'],
                'next_step' => $currentStep['next_step'],
                'step_index' => $currentStep['index'] ?? 1,
                'updated_at' => $lead->updated_at->toISOString(),
                'district' => $lead->beneficiary_district,
            ],
        ]);

    }

    public function registerAgent(AgentRegistrationRequest $request)
    {
        $agent = $this->agentService->createAgent($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Registration received successfully. We will contact you soon.',
            'data' => ['reference' => substr($agent->mobile, -4).'_'.time()],
        ], 201);
    }

    public function registerEnumerator(\App\Http\Requests\EnumeratorRegistrationRequest $request)
    {
        $enumerator = $this->agentService->createEnumeratorPublic($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Enumerator registration received successfully. We will contact you soon.',
            'data' => ['reference' => substr($enumerator->mobile, -4).'_'.time()],
        ], 201);
    }
}
