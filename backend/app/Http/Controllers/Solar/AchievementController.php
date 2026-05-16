<?php

namespace App\Http\Controllers\Solar;

use App\Http\Controllers\Controller;
use App\Models\Achievement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AchievementController extends Controller
{
    public function index()
    {
        $achievements = Achievement::query()->orderBy('sort_order')->orderBy('date', 'desc')->get()
            ->map(fn (Achievement $a) => $this->format($a));

        return response()->json(['success' => true, 'data' => $achievements]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'winner_name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'date' => 'nullable|date',
            'is_published' => 'sometimes|boolean',
            'sort_order' => 'sometimes|integer',
            'image' => 'nullable|file|image|max:5120',
        ]);

        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('achievements', 'public');
        }
        unset($data['image']);

        $achievement = Achievement::query()->create($data);

        return response()->json(['success' => true, 'data' => $this->format($achievement)], 201);
    }

    public function update(Request $request, Achievement $achievement)
    {
        $data = $request->validate([
            'title' => 'sometimes|string|max:255',
            'winner_name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'date' => 'nullable|date',
            'is_published' => 'sometimes|boolean',
            'sort_order' => 'sometimes|integer',
            'image' => 'nullable|file|image|max:5120',
        ]);

        if ($request->hasFile('image')) {
            if ($achievement->image_path) {
                Storage::disk('public')->delete($achievement->image_path);
            }
            $data['image_path'] = $request->file('image')->store('achievements', 'public');
        }
        unset($data['image']);

        $achievement->update($data);

        return response()->json(['success' => true, 'data' => $this->format($achievement)]);
    }

    public function destroy(Achievement $achievement)
    {
        if ($achievement->image_path) {
            Storage::disk('public')->delete($achievement->image_path);
        }
        $achievement->delete();

        return response()->json(['success' => true]);
    }

    private function format(Achievement $a): array
    {
        return [
            'id' => $a->id,
            'title' => $a->title,
            'winner_name' => $a->winner_name,
            'description' => $a->description,
            'image_url' => $a->image_path ? asset('storage/'.$a->image_path) : null,
            'date' => $a->date?->format('Y-m-d'),
            'is_published' => $a->is_published,
            'sort_order' => $a->sort_order,
            'created_at' => $a->created_at,
        ];
    }
}
