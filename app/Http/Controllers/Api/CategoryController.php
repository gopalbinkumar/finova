<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = $request->user()
            ->categories()
            ->latest();

        if ($request->filled('type') && in_array($request->type, ['income', 'expense'])) {
            $query->where('type', $request->type);
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        return response()->json([
            'data' => $query->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('categories', 'name')
                    ->where(fn ($query) => $query
                        ->where('user_id', $request->user()->id)
                        ->where('type', $request->type)
                    ),
            ],
            'type' => ['required', Rule::in(['income', 'expense'])],
            'icon' => ['nullable', 'string', 'max:20'],
            'color' => ['nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ]);

        $category = $request->user()->categories()->create([
            'name' => trim($validated['name']),
            'type' => $validated['type'],
            'icon' => $validated['icon'] ?? '🍔',
            'color' => $validated['color'] ?? '#F59E0B',
        ]);

        return response()->json([
            'message' => 'Category created successfully',
            'data' => $category,
        ], 201);
    }

    public function update(Request $request, Category $category)
    {
        abort_unless($category->user_id === $request->user()->id, 403);

        $typeForUnique = $request->input('type', $category->type);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('categories', 'name')
                    ->where(fn ($query) => $query
                        ->where('user_id', $request->user()->id)
                        ->where('type', $typeForUnique)
                    )
                    ->ignore($category->id),
            ],
            'type' => ['required', Rule::in(['income', 'expense'])],
            'icon' => ['nullable', 'string', 'max:20'],
            'color' => ['nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ]);

        $category->update([
            'name' => trim($validated['name']),
            'type' => $validated['type'],
            'icon' => $validated['icon'] ?? $category->icon,
            'color' => $validated['color'] ?? $category->color,
        ]);

        return response()->json([
            'message' => 'Category updated successfully',
            'data' => $category,
        ]);
    }

    public function destroy(Request $request, Category $category)
    {
        abort_unless($category->user_id === $request->user()->id, 403);

        $category->delete();

        return response()->json([
            'message' => 'Category deleted successfully',
        ]);
    }
}