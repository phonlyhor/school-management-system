<?php

namespace App\Http\Controllers;

use App\Models\TeacherClassAssignment;
use Illuminate\Http\Request;

class AdminHomeroomController extends Controller
{
    // View all homeroom assignments
    public function index()
    {
        $assignments = TeacherClassAssignment::with([
            'teacher',
            'schoolClass'
        ])->get();

        return response()->json([
            'assignments' => $assignments
        ]);
    }

    // Create assignment
    public function store(Request $request)
    {
        $request->validate([
            'teacher_id' => 'required|exists:users,id',
            'class_id' => 'required|exists:school_classes,id',
            'academic_year' => 'required|string',
        ]);

        // Check if this class already has a homeroom teacher for this academic year
        $existing = TeacherClassAssignment::where('class_id', $request->class_id)
                                          ->where('academic_year', $request->academic_year)
                                          ->first();
                                          
        if ($existing) {
            return response()->json([
                'message' => 'This class already has a homeroom teacher for the selected academic year.'
            ], 422);
        }

        $assignment = TeacherClassAssignment::create([
            'teacher_id' => $request->teacher_id,
            'class_id' => $request->class_id,
            'academic_year' => $request->academic_year
        ]);

        // Send notification to assigned teacher
        try {
            $schoolClass = \App\Models\SchoolClass::find($request->class_id);
            $className = $schoolClass ? $schoolClass->name : 'N/A';
            \App\Models\Notification::create([
                'user_id' => $request->teacher_id,
                'title' => '🏫 អ្នកត្រូវបានចាត់តាំងជាគ្រូបន្ទុកថ្នាក់ (Homeroom Teacher)',
                'message' => "អ្នកត្រូវបានចាត់តាំងជាគ្រូបន្ទុកថ្នាក់ {$className} សម្រាប់ឆ្នាំសិក្សា {$request->academic_year}។",
                'type' => 'homeroom_assignment',
                'data' => [
                    'class_id' => $request->class_id,
                    'class_name' => $className,
                    'academic_year' => $request->academic_year,
                ],
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('Homeroom notification failed: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Homeroom teacher assigned successfully',
            'assignment' => $assignment->load(['teacher', 'schoolClass'])
        ], 201);
    }

    // Show one assignment
    public function show($id)
    {
        $assignment = TeacherClassAssignment::findOrFail($id);
        return response()->json([
            'assignment' => $assignment->load(['teacher', 'schoolClass'])
        ]);
    }

    // Update assignment
    public function update(Request $request, $id)
    {
        $assignment = TeacherClassAssignment::findOrFail($id);

        $request->validate([
            'teacher_id' => 'required|exists:users,id',
            'class_id' => 'required|exists:school_classes,id',
            'academic_year' => 'required|string',
        ]);

        // Check if changing to a class that already has a homeroom teacher (excluding current record)
        $existing = TeacherClassAssignment::where('class_id', $request->class_id)
                                          ->where('academic_year', $request->academic_year)
                                          ->where('id', '!=', $id)
                                          ->first();
                                          
        if ($existing) {
            return response()->json([
                'message' => 'This class already has a homeroom teacher for the selected academic year.'
            ], 422);
        }

        $assignment->update([
            'teacher_id' => $request->teacher_id,
            'class_id' => $request->class_id,
            'academic_year' => $request->academic_year
        ]);

        // Send notification to updated teacher
        try {
            $schoolClass = \App\Models\SchoolClass::find($request->class_id);
            $className = $schoolClass ? $schoolClass->name : 'N/A';
            \App\Models\Notification::create([
                'user_id' => $request->teacher_id,
                'title' => '🏫 ព័ត៌មានគ្រូបន្ទុកថ្នាក់ត្រូវបានធ្វើបច្ចុប្បន្នភាព (Homeroom Updated)',
                'message' => "ការចាត់តាំងជាគ្រូបន្ទុកថ្នាក់ {$className} សម្រាប់ឆ្នាំសិក្សា {$request->academic_year} ត្រូវបានធ្វើបច្ចុប្បន្នភាព។",
                'type' => 'homeroom_assignment',
                'data' => [
                    'class_id' => $request->class_id,
                    'class_name' => $className,
                    'academic_year' => $request->academic_year,
                ],
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('Homeroom notification failed: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Homeroom assignment updated successfully',
            'assignment' => $assignment->load(['teacher', 'schoolClass'])
        ]);
    }

    // Delete assignment
    public function destroy($id)
    {
        $assignment = TeacherClassAssignment::findOrFail($id);
        $assignment->delete();

        return response()->json([
            'message' => 'Homeroom assignment deleted successfully'
        ]);
    }
}
