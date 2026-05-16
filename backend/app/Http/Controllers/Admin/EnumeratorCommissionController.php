<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Lead;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EnumeratorCommissionController extends Controller
{
    public function index(Request $request)
    {
        $enumeratorId = $request->user()->id;

        $commissions = \App\Models\Commission::query()
            ->with(['lead:id,ulid,beneficiary_name'])
            ->where(fn($q) => $q->where('payee_role', 'enumerator')
                                 ->where('payee_id', $enumeratorId))
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $commissions,
        ]);
    }

    public function profitLedger(Request $request): JsonResponse
    {
        $enumerator = $request->user();
        $startDate = $request->input('start_date');
        $endDate   = $request->input('end_date');

        $query = Lead::query()
            ->whereHas('commissions', function ($q) use ($enumerator) {
                $q->where('payee_id', $enumerator->id);
            })
            ->with(['commissions.payee:id,name,role']);

        if ($startDate) {
            $query->whereDate('created_at', '>=', $startDate);
        }
        if ($endDate) {
            $query->whereDate('created_at', '<=', $endDate);
        }

        $leadRows = $query->get()->map(function (Lead $lead) use ($enumerator) {
            $inflowComm = $lead->commissions->where('payee_id', $enumerator->id)->first();
            $inflow = $inflowComm ? (float) $inflowComm->amount : 0;
            
            return [
                'row_type'           => 'lead',
                'date'               => $lead->created_at->toDateString(),
                'lead_ulid'          => $lead->ulid,
                'consumer_name'      => $lead->beneficiary_name,
                'consumer_mobile'    => $lead->beneficiary_mobile,
                'system_capacity'    => $lead->system_capacity,
                'received_from_sa'   => $inflow, // Represents received amount
                'ledger_credit'      => 0,
                'downlines'          => [],
                'tech_payouts'       => [],
                'enterprise_expense' => 0,
                'total_outflows'     => 0,
                'row_net'            => $inflow,
                'payment_status'     => $inflowComm?->payment_status ?? 'unpaid',
            ];
        });

        $sorted = $leadRows->sortBy('date')->values();
        $runningBalance = 0;
        $sorted = $sorted->map(function($item) use (&$runningBalance) {
            $runningBalance += $item['row_net'];
            $item['running_balance'] = $runningBalance;
            return $item;
        });

        $sortedDesc = $sorted->sortByDesc('date')->values();

        $totalReceived = $sorted->sum('received_from_sa');
        $grandNetProfit = $totalReceived;

        $perPage = 20;
        $page    = max(1, (int) $request->input('page', 1));
        $total   = $sortedDesc->count();
        $items   = $sortedDesc->slice(($page - 1) * $perPage, $perPage)->values();

        return response()->json([
            'success' => true,
            'data'    => $items,
            'meta'    => [
                'current_page' => $page,
                'last_page'    => (int) ceil($total / $perPage),
                'total'        => $total,
            ],
            'totals'  => [
                'total_received_from_sa' => (float) $totalReceived,
                'total_ledger_credits'   => 0,
                'total_downlines'        => 0,
                'total_tech'             => 0,
                'total_enterprise_exp'   => 0,
                'grand_net_profit'       => (float) $grandNetProfit,
            ],
        ]);
    }

    public function exportProfitLedger(Request $request): StreamedResponse
    {
        $enumerator = $request->user();
        $startDate = $request->input('start_date');
        $endDate   = $request->input('end_date');

        $query = Lead::query()
            ->whereHas('commissions', function ($q) use ($enumerator) {
                $q->where('payee_id', $enumerator->id);
            })
            ->with(['commissions.payee:id,name,role']);

        if ($startDate) {
            $query->whereDate('created_at', '>=', $startDate);
        }
        if ($endDate) {
            $query->whereDate('created_at', '<=', $endDate);
        }

        $leadRows = $query->get()->map(function (Lead $lead) use ($enumerator) {
            $inflowComm = $lead->commissions->where('payee_id', $enumerator->id)->first();
            $inflow = $inflowComm ? (float) $inflowComm->amount : 0;
            
            return [
                'row_type'           => 'lead',
                'date'               => $lead->created_at->toDateString(),
                'lead_ulid'          => $lead->ulid,
                'consumer_name'      => $lead->beneficiary_name,
                'consumer_mobile'    => $lead->beneficiary_mobile,
                'system_capacity'    => $lead->system_capacity,
                'received_from_sa'   => $inflow,
                'total_outflows'     => 0,
                'row_net'            => $inflow,
                'payment_status'     => $inflowComm?->payment_status ?? 'unpaid',
            ];
        });

        $sorted = $leadRows->sortBy('date')->values();
        $runningBalance = 0;
        $sorted = $sorted->map(function($item) use (&$runningBalance) {
            $runningBalance += $item['row_net'];
            $item['running_balance'] = $runningBalance;
            return $item;
        });

        $filename = 'enumerator_profit_ledger_' . now()->format('Y-m-d') . '.csv';

        return response()->streamDownload(function () use ($sorted) {
            $handle = fopen('php://output', 'w');
            fputs($handle, "\xEF\xBB\xBF");

            fputcsv($handle, [
                'Date',
                'Consumer Name',
                'Mobile',
                'System Capacity (kW)',
                'Received (₹)',
                'Row Net (₹)',
                'Balance (₹)',
                'Status'
            ]);

            foreach ($sorted as $row) {
                fputcsv($handle, [
                    $row['date'],
                    $row['consumer_name']  ?? '—',
                    $row['consumer_mobile'] ?? '—',
                    $row['system_capacity'] ?? '—',
                    number_format((float) $row['received_from_sa'], 2, '.', ''),
                    number_format((float) $row['row_net'], 2, '.', ''),
                    number_format((float) $row['running_balance'], 2, '.', ''),
                    $row['payment_status']
                ]);
            }
            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
