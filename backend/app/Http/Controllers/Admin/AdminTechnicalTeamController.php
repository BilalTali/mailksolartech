<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminTechnicalTeamController extends Controller
{
    /**
     * List all field technicians.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $adminId = $user->isOperator() && $user->parent_id ? $user->parent_id : $user->id;
        $query = User::roleFieldTechnicalTeam();

        if (!$user->isSuperAdmin()) {
            $query->where('parent_id', $adminId);
        }

        $technicians = $query->select(['id', 'name', 'email', 'mobile', 'status', 'technician_type', 'created_at'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['success' => true, 'data' => $technicians]);
    }

    /**
     * Create a new field technician
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'            => 'required|string|max:100',
            'email'           => 'required|email|unique:users,email',
            'mobile'          => 'required|string|unique:users,mobile',
            'password'        => 'required|string|min:8',
            'technician_type' => 'required|in:surveyor,installer',
        ]);

        $user = $request->user();
        $adminId = $user->isOperator() && $user->parent_id ? $user->parent_id : $user->id;

        $technician = User::create([
            'name'            => $request->name,
            'email'           => $request->email,
            'mobile'          => $request->mobile,
            'technician_type' => $request->technician_type,
            'parent_id'       => $adminId,
        ]);

        $technician->role     = 'field_technical_team';
        $technician->status   = 'active';
        $technician->password = Hash::make($request->password);
        $technician->save();

        return response()->json([
            'success' => true,
            'message' => 'Technician account created successfully.',
            'data'    => $technician->only(['id', 'name', 'email', 'mobile', 'role', 'status', 'technician_type']),
        ], 201);
    }

    /**
     * Toggle status (active/inactive).
     */
    public function updateStatus(Request $request, int $id)
    {
        $request->validate(['status' => 'required|in:active,inactive']);

        $user = $request->user();
        $adminId = $user->isOperator() && $user->parent_id ? $user->parent_id : $user->id;
        $query = User::roleFieldTechnicalTeam();

        if (!$user->isSuperAdmin()) {
            $query->where('parent_id', $adminId);
        }

        $technician = $query->findOrFail($id);
        $technician->status = $request->status;
        $technician->save();

        return response()->json([
            'success' => true,
            'message' => 'Technician status updated.',
            'data'    => $technician->only(['id', 'name', 'status', 'technician_type']),
        ]);
    }

    /**
     * Soft-delete a technician account.
     */
    public function destroy(Request $request, int $id)
    {
        $user = $request->user();
        $adminId = $user->isOperator() && $user->parent_id ? $user->parent_id : $user->id;
        $query = User::roleFieldTechnicalTeam();

        if (!$user->isSuperAdmin()) {
            $query->where('parent_id', $adminId);
        }

        $technician = $query->findOrFail($id);
        $technician->delete();

        return response()->json(['success' => true, 'message' => 'Technician removed.']);
    }
}
