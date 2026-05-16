<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SuperAgentNotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $notifications = Notification::query()->where(fn ($q) => $q->where('user_id', $request->user()->id))
            ->latest()->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $notifications,
            'unread_count' => $request->user()->notifications()->whereNull('read_at')->count(),
        ]);
    }

    public function markRead(Request $request, int $id): JsonResponse
    {
        $notification = Notification::query()->where(fn ($q) => $q->where('id', $id))
            ->where(fn ($q) => $q->where('user_id', $request->user()->id))->firstOrFail();
        $notification->update(['read_at' => now()]);

        return response()->json(['success' => true, 'message' => 'Marked as read.']);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        Notification::query()->where(fn ($q) => $q->where('user_id', $request->user()->id))
            ->whereNull('read_at')->update(['read_at' => now()]);

        return response()->json(['success' => true, 'message' => 'All notifications marked as read.']);
    }
}
