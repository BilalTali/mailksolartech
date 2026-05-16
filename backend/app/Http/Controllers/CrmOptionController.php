<?php

namespace App\Http\Controllers;

use App\Models\CrmOption;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class CrmOptionController extends Controller
{
    /**
     * Public endpoint to fetch all active options grouped by category.
     */
    public function getPublicOptions()
    {
        $options = Cache::rememberForever('active_crm_options', function () {
            return CrmOption::active()
                ->orderBy('sort_order', 'asc')
                ->orderBy('label', 'asc')
                ->get()
                ->groupBy('category');
        });

        return response()->json([
            'success' => true,
            'data' => $options
        ]);
    }

    /**
     * Admin functionality below
     */
    public function index(Request $request)
    {
        $category = $request->query('category');
        $query = CrmOption::query();
        
        if ($category) {
            $query->where('category', $category);
        }

        return response()->json([
            'success' => true,
            'data' => $query->orderBy('category')->orderBy('sort_order')->get()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category' => 'required|string|max:100',
            'label' => 'required|string|max:255',
            'value' => 'required|string|max:255|unique:crm_options,value,NULL,id,category,' . $request->category,
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ]);

        $option = CrmOption::create($validated);
        $this->clearCache();

        return response()->json([
            'success' => true,
            'message' => 'CRM Option created successfully.',
            'data' => $option
        ], 201);
    }

    public function update(Request $request, CrmOption $crmOption)
    {
        $validated = $request->validate([
            'category' => 'sometimes|required|string|max:100',
            'label' => 'sometimes|required|string|max:255',
            'value' => 'sometimes|required|string|max:255|unique:crm_options,value,' . $crmOption->id . ',id,category,' . ($request->category ?? $crmOption->category),
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ]);

        $crmOption->update($validated);
        $this->clearCache();

        return response()->json([
            'success' => true,
            'message' => 'CRM Option updated successfully.',
            'data' => $crmOption
        ]);
    }

    public function destroy(CrmOption $crmOption)
    {
        $crmOption->delete();
        $this->clearCache();

        return response()->json([
            'success' => true,
            'message' => 'CRM Option deleted successfully.'
        ]);
    }

    private function clearCache()
    {
        Cache::forget('active_crm_options');
    }
}
