<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Services\LeadBillService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class LeadBillController extends Controller
{
    public function __construct(private LeadBillService $leadBillService) {}

    public function downloadQuotation(Request $request, string $ulid): Response
    {
        $lead = clone $this->getAuthorizedLead($ulid);
        $this->ensureLeadIsEligibleForDocuments($lead);
        
        return $this->leadBillService->generateQuotation($lead);
    }

    public function downloadReceipt(Request $request, string $ulid): Response
    {
        $lead = clone $this->getAuthorizedLead($ulid);
        $this->ensureLeadIsEligibleForDocuments($lead);
        
        return $this->leadBillService->generateReceipt($lead);
    }

    private function getAuthorizedLead(string $ulid): Lead
    {
        $lead = Lead::where('ulid', $ulid)->firstOrFail();
        
        $user = auth()->user();
        
        // Admins can view anything
        if ($user->isAdmin() || $user->isSuperAdmin() || $user->role === 'operator') {
            return $lead;
        }

        // Super agents can only view their own
        if ($user->isSuperAgent()) {
            $visible = Lead::visibleToSuperAgent($user->id)->where('ulid', $ulid)->exists();
            if (!$visible) {
                 abort(403, 'Unauthorized access to this document.');
            }
            return $lead;
        }

        // Agents can view their own
        if ($user->isAgent()) {
            $visible = Lead::visibleToAgent($user->id)->where('ulid', $ulid)->exists();
            if (!$visible) {
                 abort(403, 'Unauthorized access to this document.');
            }
            return $lead;
        }
        
        // Enumerators
        if ($user->isEnumerator()) {
            if ($lead->submitted_by_enumerator_id !== $user->id) {
                abort(403, 'Unauthorized access to this document.');
            }
            return $lead;
        }

        abort(403, 'Unauthorized action.');
    }

    private function ensureLeadIsEligibleForDocuments(Lead $lead): void
    {
        $eligibleStatuses = ['COMPLETED', 'REGISTERED', 'SITE_SURVEY', 'AT_BANK', 'PROJECT_COMMISSIONING', 'SUBSIDY_REQUEST', 'SUBSIDY_APPLIED', 'SUBSIDY_DISBURSED'];
        
        if (!in_array($lead->status, $eligibleStatuses)) {
            abort(403, 'Document is only available after the lead is registered.');
        }
    }
}
