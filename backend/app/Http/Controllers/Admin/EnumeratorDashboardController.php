<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class EnumeratorDashboardController extends Controller
{
    public function stats(Request $request)
    {
        $user = $request->user();
        
        $totalLeads = \App\Models\Lead::query()->where(fn($q) => $q->where('submitted_by_enumerator_id', $user->id))->count();
        $leadsInstalled = \App\Models\Lead::query()->where(fn($q) => $q->where('submitted_by_enumerator_id', $user->id))
            ->where(fn($q) => $q->whereIn('status', ['REGISTERED', 'SITE_SURVEY', 'AT_BANK', 'COMPLETED', 'PROJECT_COMMISSIONING', 'SUBSIDY_REQUEST', 'SUBSIDY_APPLIED', 'SUBSIDY_DISBURSED']))->count();
        
        $approvedLeads = \App\Models\Lead::query()->where(fn($q) => $q->where('submitted_by_enumerator_id', $user->id))
            ->where(fn($q) => $q->whereIn('verification_status', ['super_agent_verified', 'admin_override', 'not_required']))->count();
        $pendingLeads = \App\Models\Lead::query()->where(fn($q) => $q->where('submitted_by_enumerator_id', $user->id))
            ->where(fn($q) => $q->where('verification_status', 'pending_super_agent_verification'))->count();
        $revertedLeads = \App\Models\Lead::query()->where(fn($q) => $q->where('submitted_by_enumerator_id', $user->id))
            ->where(fn($q) => $q->where('verification_status', 'reverted_to_agent'))->count();

        // Commission Stats
        $commStats = $user->enumeratorCommissions()
            ->selectRaw('payment_status, SUM(amount) as total')
            ->groupBy('payment_status')
            ->pluck('total', 'payment_status');

        $pendingCommission = (float) ($commStats['unpaid'] ?? 0);
        $totalEarned = (float) ($commStats['paid'] ?? 0);

        $thisMonthEarned = $user->enumeratorCommissions()
            ->where('payment_status', 'paid')
            ->whereMonth('paid_at', now()->month)
            ->whereYear('paid_at', now()->year)
            ->sum('amount');

        $lastMonth = now()->subMonth();
        $lastMonthEarned = $user->enumeratorCommissions()
            ->where('payment_status', 'paid')
            ->whereMonth('paid_at', $lastMonth->month)
            ->whereYear('paid_at', $lastMonth->year)
            ->sum('amount');

        return response()->json([
            'success' => true,
            'data' => [
                'total_leads' => $totalLeads,
                'leads_installed' => $leadsInstalled,
                'approved_leads' => $approvedLeads,
                'pending_leads' => $pendingLeads,
                'reverted_leads' => $revertedLeads,
                'pending_commission' => $pendingCommission,
                'total_earned' => $totalEarned,
                'this_month_earned' => (float) $thisMonthEarned,
                'last_month_earned' => (float) $lastMonthEarned,
                'recent_leads' => \App\Models\Lead::query()->where(fn($q) => $q->where('submitted_by_enumerator_id', $user->id))
                    ->with(['documents', 'commissions'])
                    ->orderBy('created_at', 'desc')
                    ->take(5)
                    ->get(),
            ]
        ]);
    }
}
