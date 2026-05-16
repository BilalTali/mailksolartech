<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminLedger;
use App\Models\User;
use Illuminate\Http\Request;

class AdminLedgerController extends Controller
{
    /**
     * Get ledger records for an admin.
     * If user is super_admin, they can view any admin's ledger by passing admin_id.
     * If user is admin, they can only view their own.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = AdminLedger::with(['createdBy:id,name,role', 'admin:id,name']);

        if ($user->isSuperAdmin()) {
            if ($request->has('admin_id')) {
                $query->where('admin_id', $request->admin_id);
            }
            if ($request->has('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }
            $ledgers = $query->orderBy('created_at', 'desc')->paginate($request->per_page ?? 20);
            return response()->json($ledgers);
        }

        // For Admin
        $ledgers = $query->where('admin_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $ledgers
        ]);
    }

    /**
     * Admin logs a self-expense (Debit).
     */
    public function storeExpense(Request $request)
    {
        $request->validate([
            'category' => 'required|string',
            'amount' => 'required|numeric|min:0',
            'description' => 'required|string|max:500',
            'receipt' => 'nullable|image|max:5120', // Max 5MB
        ]);

        $receiptPath = null;
        if ($request->hasFile('receipt')) {
            $receiptPath = $request->file('receipt')->store('ledger_receipts', 'public');
        }

        $ledger = AdminLedger::create([
            'admin_id' => $request->user()->id,
            'transaction_type' => 'debit',
            'category' => $request->category,
            'amount' => $request->amount,
            'description' => $request->description,
            'created_by' => $request->user()->id,
            'receipt_path' => $receiptPath,
            'status' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Expense submitted for approval.',
            'data' => $ledger
        ], 201);
    }

    /**
     * Super Admin grants an allowance/credit to an Admin.
     */
    public function storeAllowance(Request $request)
    {
        if (!$request->user()->isSuperAdmin()) {
            abort(403, 'Only Super Admins can grant allowances.');
        }

        $request->validate([
            'admin_id' => 'required|exists:users,id',
            'category' => 'required|string',
            'amount' => 'required|numeric|min:0',
            'description' => 'required|string|max:500',
        ]);

        // Ensure user is an admin
        $admin = User::where('id', $request->admin_id)->where('role', 'admin')->firstOrFail();

        $ledger = AdminLedger::create([
            'admin_id' => $admin->id,
            'transaction_type' => 'credit',
            'category' => $request->category,
            'amount' => $request->amount,
            'description' => $request->description,
            'created_by' => $request->user()->id,
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Allowance credited successfully.',
            'data' => $ledger
        ], 201);
    }

    /**
     * Approve a pending expense.
     */
    public function approve(Request $request, int $id)
    {
        if (!$request->user()->isSuperAdmin()) {
            abort(403, 'Unauthorized.');
        }

        $ledger = AdminLedger::findOrFail($id);
        if ($ledger->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Only pending expenses can be approved.'], 422);
        }

        $ledger->update(['status' => 'approved']);

        return response()->json([
            'success' => true,
            'message' => 'Expense approved.',
            'data' => $ledger
        ]);
    }

    /**
     * Reject a pending expense.
     */
    public function reject(Request $request, int $id)
    {
        if (!$request->user()->isSuperAdmin()) {
            abort(403, 'Unauthorized.');
        }

        $request->validate(['rejection_reason' => 'required|string|max:500']);

        $ledger = AdminLedger::findOrFail($id);
        if ($ledger->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Only pending expenses can be rejected.'], 422);
        }

        $ledger->update([
            'status' => 'rejected',
            'rejection_reason' => $request->rejection_reason
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Expense rejected.',
            'data' => $ledger
        ]);
    }

    /**
     * Mark an approved expense as paid.
     */
    public function markPaid(Request $request, int $id)
    {
        if (!$request->user()->isSuperAdmin()) {
            abort(403, 'Unauthorized.');
        }

        $request->validate([
            'payment_method' => 'required|string',
            'payment_reference' => 'nullable|string',
        ]);

        $ledger = AdminLedger::findOrFail($id);
        if ($ledger->status !== 'approved' && $ledger->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Invalid status for payment.'], 422);
        }

        $ledger->update([
            'status' => 'paid',
            'payment_method' => $request->payment_method,
            'payment_reference' => $request->payment_reference,
            'paid_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Expense marked as paid.',
            'data' => $ledger
        ]);
    }
}
