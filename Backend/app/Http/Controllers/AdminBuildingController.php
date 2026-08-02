<?php

namespace App\Http\Controllers;

use App\Models\Building;
use Illuminate\Http\Request;

class AdminBuildingController extends Controller
{
    public function index()
    {
        $buildings = Building::orderBy('type')->orderBy('name')->get();

        $totalBuildings = Building::where('type', 'Building')->count();
        $totalAdminOffices = Building::where('type', 'Admin Office')->count();
        $totalRooms = Building::sum('total_rooms');

        return response()->json([
            'buildings' => $buildings,
            'summary' => [
                'total_buildings' => $totalBuildings,
                'total_admin_offices' => $totalAdminOffices,
                'total_rooms' => $totalRooms,
                'total_records' => $buildings->count()
            ]
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|unique:buildings,code',
            'type' => 'required|string',
            'total_rooms' => 'nullable|integer|min:1',
            'floors' => 'nullable|integer|min:1',
            'description' => 'nullable|string'
        ]);

        $building = Building::create([
            'name' => $request->name,
            'code' => $request->code,
            'type' => $request->type ?? 'Building',
            'total_rooms' => $request->total_rooms ?? 1,
            'floors' => $request->floors ?? 1,
            'description' => $request->description
        ]);

        return response()->json([
            'message' => 'Building/Office created successfully',
            'building' => $building
        ], 201);
    }

    public function show(Building $building)
    {
        return response()->json([
            'building' => $building
        ]);
    }

    public function update(Request $request, Building $building)
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'code' => 'sometimes|string|unique:buildings,code,' . $building->id,
            'type' => 'sometimes|string',
            'total_rooms' => 'sometimes|integer|min:1',
            'floors' => 'sometimes|integer|min:1',
            'description' => 'nullable|string'
        ]);

        $building->update($request->only([
            'name',
            'code',
            'type',
            'total_rooms',
            'floors',
            'description'
        ]));

        return response()->json([
            'message' => 'Building/Office updated successfully',
            'building' => $building
        ]);
    }

    public function destroy(Building $building)
    {
        $building->delete();

        return response()->json([
            'message' => 'Building/Office deleted successfully'
        ]);
    }
}
