<?php

namespace App\Http\Controllers\Solar;

use App\Http\Controllers\Controller;
use App\Models\Feedback;
use Illuminate\Http\Request;

class FeedbackController extends Controller
{
    // Public — submit feedback (no auth)
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'message' => 'required|string|max:2000',
            'rating' => 'sometimes|integer|min:1|max:5',
        ]);

        $feedback = Feedback::query()->create($data);

        return response()->json(['success' => true, 'message' => 'Thank you for your feedback!', 'data' => ['id' => $feedback->id]], 201);
    }

    // Admin — list all feedbacks
    public function index(Request $request)
    {
        $feedbacks = Feedback::latest()
            ->get()
            ->map(fn ($f) => $this->format($f));

        return response()->json(['success' => true, 'data' => $feedbacks]);
    }

    // Admin — reply to feedback
    public function reply(Request $request, Feedback $feedback)
    {
        $data = $request->validate(['reply' => 'required|string|max:2000']);
        $feedback->update([
            'admin_reply' => $data['reply'],
            'replied_at' => now(),
        ]);

        return response()->json(['success' => true, 'data' => $this->format($feedback->fresh())]);
    }

    // Admin — toggle publish
    public function togglePublish(Feedback $feedback)
    {
        $feedback->update(['is_published' => ! $feedback->is_published]);

        return response()->json(['success' => true, 'data' => $this->format($feedback->fresh())]);
    }

    // Admin — delete
    public function destroy(Feedback $feedback)
    {
        $feedback->delete();

        return response()->json(['success' => true]);
    }

    private function format(Feedback $f): array
    {
        return [
            'id' => $f->id,
            'name' => $f->name,
            'email' => $f->email,
            'phone' => $f->phone,
            'message' => $f->message,
            'rating' => $f->rating,
            'admin_reply' => $f->admin_reply,
            'replied_at' => $f->replied_at,
            'is_published' => $f->is_published,
            'created_at' => $f->created_at,
        ];
    }
}
