<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class EnumeratorLeadController extends Controller
{
    public function __construct(private \App\Services\LeadService $leadService) {}

    public function index(Request $request)
    {
        $enumeratorId = $request->user()->id;
        $query = \App\Models\Lead::query()->where(fn ($q) => $q->where('submitted_by_enumerator_id', $enumeratorId))
            ->with(['documents']);

        // Check common filters just like agent
        if ($request->has('status')) {
            $query->where(fn ($q) => $q->where('status', $request->status));
        }

        if ($request->has('search')) {
            $search = str_replace(['%', '_'], ['\%', '\_'], $request->search);
            $query->where(function ($q) use ($search) {
                $q->where(fn ($q2) => $q2->where('beneficiary_name', 'like', "%{$search}%"))
                  ->orWhere(fn ($q2) => $q2->where('beneficiary_mobile', 'like', "%{$search}%"));
            });
        }

        $leads = $query->orderBy('created_at', 'desc')->paginate($request->input('per_page', 15));

        // Count reverted leads for banner
        $revertedCount = \App\Models\Lead::query()
            ->where('submitted_by_enumerator_id', $enumeratorId)
            ->where('verification_status', 'reverted_to_enumerator')
            ->count();

        return response()->json([
            'success' => true,
            'data' => $leads,
            'meta' => ['reverted_count' => $revertedCount],
        ]);
    }

    public function store(\App\Http\Requests\StoreAgentLeadRequest $request)
    {
        $data = $request->validated();
        $data['ulid'] = \Illuminate\Support\Str::ulid()->toBase32();

        $lead = \Illuminate\Support\Facades\DB::transaction(function () use ($data, $request) {
            $lead = $this->leadService->createFromEnumerator($data, $request->user());

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

    public function show(Request $request, $ulid)
    {
        $enumeratorId = $request->user()->id;
        $lead = \App\Models\Lead::query()
            ->where(fn ($q) => $q->where('submitted_by_enumerator_id', $enumeratorId))
            ->with([
                'statusLogs.changedBy',
                'documents'
            ])
            ->where(fn ($q) => $q->where('ulid', $ulid))
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $lead,
        ]);
    }

    public function uploadDocument(Request $request, $ulid)
    {
        $request->validate([
            'document' => 'required|file|max:5120|mimes:jpg,png,pdf',
            'type' => 'required|string',
        ]);

        $lead = \App\Models\Lead::query()
            ->where(fn ($q) => $q->where('submitted_by_enumerator_id', $request->user()->id))
            ->where(fn ($q) => $q->where('ulid', $ulid))
            ->firstOrFail();

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

    /** Enumerator corrects and resubmits a reverted lead */
    public function resubmit(\App\Http\Requests\StoreAgentLeadRequest $request, $ulid)
    {
        $enumeratorId = $request->user()->id;
        $lead = \App\Models\Lead::query()
            ->where(fn ($q) => $q->where('submitted_by_enumerator_id', $enumeratorId))
            ->where(fn ($q) => $q->where('ulid', $ulid))
            ->firstOrFail();

        $correctedData = $request->validated();

        try {
            $lead = $this->leadService->resubmitLeadByEnumerator($lead, $correctedData, $request->user());
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Lead corrected and resubmitted successfully!',
            'data' => $lead,
        ]);
    }
}
