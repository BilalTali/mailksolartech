<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class AdminManagementController extends Controller
{
    /** List all admins (role=admin) */
    public function index(Request $request): JsonResponse
    {
        $admins = User::roleAdmin()
            ->where('role', '=', User::ROLE_ADMIN)
            ->when($request->search, function ($q) use ($request) {
                $search = "%{$request->search}%";
                $q->where(fn($sub) => $sub->where('name', 'like', $search)->orWhere('email', 'like', $search));
            })
            ->latest()
            ->paginate($request->per_page ?? 20);

        return response()->json(['success' => true, 'data' => $admins]);
    }

    /** Create a new admin */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'mobile' => 'required|string|size:10|unique:users,mobile',
            'password' => 'required|string|min:8',
            'permissions' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors()
            ], 422);
        }

        $admin = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'mobile' => $request->mobile,
            'password' => Hash::make($request->password),
            'role' => User::ROLE_ADMIN,
            'status' => 'active',
            'permissions' => $request->permissions ?? ['*'],
            'email_verified_at' => now(),
        ]);

        return response()->json(['success' => true, 'data' => $admin, 'message' => 'Admin created successfully.'], 201);
    }

    /** Update an existing admin */
    public function update(Request $request, int $id): JsonResponse
    {
        $admin = User::roleAdmin()->where('id', '=', $id)->firstOrFail();

        $validator = Validator::make($request->all(), [
            'name' => 'string|max:255',
            'email' => ['email', Rule::unique('users')->ignore($admin->id)],
            'mobile' => ['string', 'size:10', Rule::unique('users')->ignore($admin->id)],
            'password' => 'nullable|string|min:8',
            'status' => 'in:active,inactive',
            'permissions' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $request->only(['name', 'email', 'mobile', 'status', 'permissions']);
        if ($request->password) {
            $data['password'] = Hash::make($request->password);
        }

        $admin->update($data);

        return response()->json(['success' => true, 'data' => $admin->fresh(), 'message' => 'Admin updated successfully.']);
    }

    /** Toggle Admin Status */
    public function toggleStatus(int $id): JsonResponse
    {
        $admin = User::roleAdmin()->where('id', '=', $id)->firstOrFail();
        $admin->status = $admin->status === 'active' ? 'inactive' : 'active';
        $admin->save();

        return response()->json(['success' => true, 'message' => "Admin status changed to {$admin->status}."]);
    }

    /** Delete (soft-delete) an admin */
    public function destroy(int $id): JsonResponse
    {
        $admin = User::roleAdmin()->where('id', '=', $id)->firstOrFail();
        $admin->delete();

        return response()->json(['success' => true, 'message' => 'Admin account deleted.']);
    }
}
