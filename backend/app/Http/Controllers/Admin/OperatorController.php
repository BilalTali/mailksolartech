<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class OperatorController extends Controller
{
    /**
     * List all operators.
     */
    public function index(Request $request)
    {
        $operators = User::operators()
            ->select(['id', 'name', 'email', 'mobile', 'status', 'created_at'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['success' => true, 'data' => $operators]);
    }

    /**
     * Create a new operator account — only admin can do this.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:100',
            'email'    => 'required|email|unique:users,email',
            'mobile'   => 'required|string|unique:users,mobile',
            'password' => 'required|string|min:8',
        ]);

        $operator = User::create([
            'name'      => $request->name,
            'email'     => $request->email,
            'mobile'    => $request->mobile,
            'parent_id' => $request->user()->id,
        ]);

        $operator->role     = 'operator';
        $operator->status   = 'active';
        $operator->password = Hash::make($request->password);
        $operator->save();

        return response()->json([
            'success' => true,
            'message' => 'Operator account created successfully.',
            'data'    => $operator->only(['id', 'name', 'email', 'mobile', 'role', 'status']),
        ], 201);
    }

    /**
     * Toggle operator status (active/inactive).
     */
    public function updateStatus(Request $request, int $id)
    {
        $request->validate(['status' => 'required|in:active,inactive']);

        $operator = User::operators()->findOrFail($id);
        $operator->status = $request->status;
        $operator->save();

        return response()->json([
            'success' => true,
            'message' => 'Operator status updated.',
            'data'    => $operator->only(['id', 'name', 'status']),
        ]);
    }

    /**
     * Soft-delete an operator account.
     */
    public function destroy(int $id)
    {
        $operator = User::operators()->findOrFail($id);
        $operator->delete();

        return response()->json(['success' => true, 'message' => 'Operator removed.']);
    }
}
