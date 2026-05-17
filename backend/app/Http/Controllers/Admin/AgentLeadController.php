<?php

namespace App\Http\Controllers\Admin;

use App\Exceptions\InvalidLeadOperationException;
use App\Exceptions\LeadAccessDeniedException;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAgentLeadRequest;
use App\Models\Lead;
use App\Services\LeadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AgentLeadController extends Controller
{
    public function __construct(private LeadService $leadService) {}

    public function index(Request $request)
    {
        $user = $request->user();
        $query = Lead::visibleToAgent($user->id)->with([
            'documents' => function ($q) use ($user) {
                // Agent sees: documents they uploaded OR documents marked visible_to_downline
                $q->where('visible_to_downline', true)
                  ->orWhere('uploaded_by', $user->id);
            },
            'commissions'
        ]);

        if ($request->has('status')) {
            $query->where(fn($q) => $q->where('status', (string) $request->status));
        }

        if ($request->has('verification_status')) {
            $query->where(fn($q) => $q->where('verification_status', (string) $request->verification_status));
        }

        if ($request->has('search')) {
            $search = str_replace(['%', '_'], ['\%', '\_'], $request->search);
            $query->where(function ($q) use ($search) {
                $q->where(fn($q2) => $q2->where('beneficiary_name', 'like', "%{$search}%"))
                    ->orWhere(fn($q2) => $q2->where('beneficiary_mobile', 'like', "%{$search}%"));
            });
        }

        $leads = $query->orderBy('created_at', 'desc')->paginate($request->input('per_page', 15));

        // Count reverted leads for banner
        $revertedCount = Lead::query()->visibleToAgent($user->id)
            ->where(fn($q) => $q->where('verification_status', 'reverted_to_agent'))
            ->count();

        return response()->json([
            'success' => true,
            'data' => $leads,
            'meta' => ['reverted_count' => $revertedCount],
        ]);
    }

    public function show(Request $request, $ulid)
    {
        $user = $request->user();
        $lead = Lead::query()->visibleToAgent($user->id)
            ->with([
                'statusLogs.changedBy',
                'documents' => function ($q) use ($user) {
                    $q->where('visible_to_downline', true)
                      ->orWhere('uploaded_by', $user->id);
                },
                'commissions',
                'verifications.performedBy'
            ])
            ->where(fn($q) => $q->where('ulid', (string) $ulid))
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $lead,
        ]);
    }

    /** Submit a new lead — routes to SA or directly to admin */
    public function store(StoreAgentLeadRequest $request)
    {
        $data = $request->validated();
        $data['ulid'] = Str::ulid()->toBase32();

        $lead = DB::transaction(function () use ($data, $request) {
            $lead = $this->leadService->createFromAgent($data, $request->user());

            // Upload documents
            foreach (['aadhaar_front', 'aadhaar_back', 'electricity_bill', 'photo', 'solar_roof_photo', 'bank_passbook'] as $docKey) {
                if ($request->hasFile($docKey)) {
                    $this->leadService->uploadDocument($lead, $request->file($docKey), $docKey, $request->user()->id);
                }
            }

            return $lead;
        });

        return response()->json([
            'success' => true,
            'message' => 'Lead submitted successfully!',
            'data' => $lead,
        ], 201);
    }

    /** Agent corrects and resubmits a reverted lead */
    public function resubmit(StoreAgentLeadRequest $request, $ulid)
    {
        $lead = Lead::query()->where(fn($q) => $q->where('ulid', (string) $ulid))->firstOrFail();

        try {
            $correctedData = $request->validated();
            $lead = $this->leadService->resubmitLead($lead, $correctedData, $request->user());
        } catch (InvalidLeadOperationException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        } catch (LeadAccessDeniedException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 403);
        }

        return response()->json([
            'success' => true,
            'message' => 'Lead resubmitted for verification.',
            'data' => $lead,
        ]);
    }

    public function verify(Request $request, $ulid)
    {
        $lead = Lead::query()->visibleToAgent($request->user()->id)->where(fn($q) => $q->where('ulid', (string) $ulid))->firstOrFail();
        
        try {
            $lead = $this->leadService->verifyLeadByAgent($lead, $request->user(), $request->input('notes'));
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Lead verified successfully.',
            'data' => $lead,
        ]);
    }

    public function revert(Request $request, $ulid)
    {
        $request->validate(['reason' => 'required|string']);
        $lead = Lead::query()->visibleToAgent($request->user()->id)->where(fn($q) => $q->where('ulid', (string) $ulid))->firstOrFail();

        try {
            $lead = $this->leadService->revertLeadByAgent($lead, $request->user(), $request->reason);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Lead reverted successfully.',
            'data' => $lead,
        ]);
    }

    /** Get verification history for this lead */
    public function verificationHistory(Request $request, $ulid)
    {
        $lead = Lead::query()->visibleToAgent($request->user()->id)->where(fn($q) => $q->where('ulid', (string) $ulid))->firstOrFail();
        $history = $lead->verifications()->with('performedBy:id,name,role,agent_id,super_agent_code')->get();

        return response()->json(['success' => true, 'data' => $history]);
    }

    public function uploadDocument(Request $request, $ulid)
    {
        $request->validate([
            'document' => 'required|file|max:5120|mimes:jpg,png,pdf',
            'type' => 'required|string',
        ]);

        $lead = Lead::query()->visibleToAgent($request->user()->id)->where(fn($q) => $q->where('ulid', (string) $ulid))->firstOrFail();

        $document = $this->leadService->uploadDocument(
            $lead,
            $request->file('document'),
            $request->type,
            $request->user()->id
        );

        return response()->json([
            'success' => true,
            'message' => 'Document uploaded successfully',
            'data' => $document,
        ], 201);
    }
}
