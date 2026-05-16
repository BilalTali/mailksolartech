<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\FAQ;
use Illuminate\Http\Request;

class FAQController extends Controller
{
    public function index()
    {
        $faqs = FAQ::orderBy('sort_order')->get();
        return response()->json(['data' => $faqs]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'question' => 'required|string|max:255',
            'answer' => 'required|string',
            'category' => 'nullable|string|max:100',
            'sort_order' => 'nullable|integer',
            'is_published' => 'nullable|boolean',
        ]);

        $faq = FAQ::create($validated);

        return response()->json([
            'message' => 'FAQ created successfully',
            'data' => $faq
        ], 201);
    }

    public function update(Request $request, FAQ $faq)
    {
        $validated = $request->validate([
            'question' => 'sometimes|required|string|max:255',
            'answer' => 'sometimes|required|string',
            'category' => 'nullable|string|max:100',
            'sort_order' => 'nullable|integer',
            'is_published' => 'nullable|boolean',
        ]);

        $faq->update($validated);

        return response()->json([
            'message' => 'FAQ updated successfully',
            'data' => $faq
        ]);
    }

    public function destroy(FAQ $faq)
    {
        $faq->delete();
        return response()->json(['message' => 'FAQ deleted successfully']);
    }

    public function toggleStatus(FAQ $faq)
    {
        $faq->update(['is_published' => !$faq->is_published]);
        return response()->json([
            'message' => 'FAQ status updated',
            'is_published' => $faq->is_published
        ]);
    }
}
