<?php

namespace App\Http\Controllers;

use App\Models\TeacherSubjectAssignment;
use Illuminate\Http\Request;

class AdminTeacherAssignmentController extends Controller
{


    // View all assignments
    public function index()
    {

        $assignments = TeacherSubjectAssignment::with([
            'teacher',
            'subject',
            'schoolClass'
        ])->get();



        return response()->json([
            'assignments'=>$assignments
        ]);

    }




    // Create assignment
    public function store(Request $request)
    {
        $request->validate([
            'teacher_id' => 'required',
            'subject_id' => 'required',
            'class_id' => 'required',
            'academic_year' => 'required'
        ]);

        try {
            $existing = TeacherSubjectAssignment::where('teacher_id', $request->teacher_id)
                ->where('subject_id', $request->subject_id)
                ->where('class_id', $request->class_id)
                ->where('academic_year', $request->academic_year)
                ->first();

            if ($existing) {
                return response()->json([
                    'message' => 'គ្រូបង្រៀនរូបនេះត្រូវបានចាត់តាំងមុខវិជ្ជានិងថ្នាក់នេះរួចរាល់ហើយ',
                    'assignment' => $existing
                ], 200);
            }

            $assignment = TeacherSubjectAssignment::create([
                'teacher_id' => $request->teacher_id,
                'subject_id' => $request->subject_id,
                'class_id' => $request->class_id,
                'academic_year' => $request->academic_year
            ]);

            // Send notification to teacher
            try {
                $subject = \App\Models\Subject::find($request->subject_id);
                $schoolClass = \App\Models\SchoolClass::find($request->class_id);
                $subjectName = $subject ? $subject->name : 'N/A';
                $className = $schoolClass ? $schoolClass->name : 'N/A';

                \App\Models\Notification::create([
                    'user_id' => $request->teacher_id,
                    'title' => '📚 ការចាត់តាំងបង្រៀនមុខវិជ្ជាថ្មី (Subject Assignment)',
                    'message' => "អ្នកត្រូវបានចាត់តាំងឱ្យបង្រៀនមុខវិជ្ជា {$subjectName} នៅថ្នាក់ {$className} សម្រាប់ឆ្នាំសិក្សា {$request->academic_year}។",
                    'type' => 'teacher_assignment',
                    'data' => [
                        'class_id' => $request->class_id,
                        'subject_id' => $request->subject_id,
                        'class_name' => $className,
                        'subject_name' => $subjectName,
                        'academic_year' => $request->academic_year,
                    ],
                ]);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning('Teacher assignment notification failed: ' . $e->getMessage());
            }

            return response()->json([
                'message' => 'Teacher assigned successfully',
                'assignment' => $assignment
            ], 201);
        } catch (\Illuminate\Database\QueryException $e) {
            $existing = TeacherSubjectAssignment::where('teacher_id', $request->teacher_id)
                ->where('subject_id', $request->subject_id)
                ->where('class_id', $request->class_id)
                ->first();

            if ($existing) {
                return response()->json([
                    'message' => 'គ្រូបង្រៀនរូបនេះត្រូវបានចាត់តាំងមុខវិជ្ជានិងថ្នាក់នេះរួចរាល់ហើយ',
                    'assignment' => $existing
                ], 200);
            }

            return response()->json(['message' => ' Duplicate assignment violation: ' . $e->getMessage()], 400);
        }
    }

    // Show one assignment
    public function show($id)
    {
        $assignment = TeacherSubjectAssignment::findOrFail($id);

        return response()->json([
            'assignment' => $assignment->load([
                'teacher',
                'subject',
                'schoolClass'
            ])
        ]);
    }

    // Update assignment
    public function update(Request $request, $id)
    {
        $assignment = TeacherSubjectAssignment::findOrFail($id);

        try {
            $existing = TeacherSubjectAssignment::where('teacher_id', $request->teacher_id ?? $assignment->teacher_id)
                ->where('subject_id', $request->subject_id ?? $assignment->subject_id)
                ->where('class_id', $request->class_id ?? $assignment->class_id)
                ->where('academic_year', $request->academic_year ?? $assignment->academic_year)
                ->where('id', '!=', $id)
                ->first();

            if ($existing) {
                $assignment->delete();
                return response()->json([
                    'message' => 'ការចាត់តាំងនេះមានរួចរាល់ហើយ',
                    'assignment' => $existing
                ], 200);
            }

            $assignment->update([
                'teacher_id' => $request->teacher_id ?? $assignment->teacher_id,
                'subject_id' => $request->subject_id ?? $assignment->subject_id,
                'class_id' => $request->class_id ?? $assignment->class_id,
                'academic_year' => $request->academic_year ?? $assignment->academic_year
            ]);

            // Send notification to teacher
            try {
                $targetTeacherId = $request->teacher_id ?? $assignment->teacher_id;
                $targetSubjectId = $request->subject_id ?? $assignment->subject_id;
                $targetClassId = $request->class_id ?? $assignment->class_id;
                $targetYear = $request->academic_year ?? $assignment->academic_year;

                $subject = \App\Models\Subject::find($targetSubjectId);
                $schoolClass = \App\Models\SchoolClass::find($targetClassId);
                $subjectName = $subject ? $subject->name : 'N/A';
                $className = $schoolClass ? $schoolClass->name : 'N/A';

                \App\Models\Notification::create([
                    'user_id' => $targetTeacherId,
                    'title' => '📚 ការចាត់តាំងបង្រៀនមុខវិជ្ជាត្រូវបានធ្វើបច្ចុប្បន្នភាព (Assignment Updated)',
                    'message' => "ការចាត់តាំងបង្រៀនមុខវិជ្ជា {$subjectName} នៅថ្នាក់ {$className} សម្រាប់ឆ្នាំសិក្សា {$targetYear} ត្រូវបានធ្វើបច្ចុប្បន្នភាព។",
                    'type' => 'teacher_assignment',
                    'data' => [
                        'class_id' => $targetClassId,
                        'subject_id' => $targetSubjectId,
                        'class_name' => $className,
                        'subject_name' => $subjectName,
                        'academic_year' => $targetYear,
                    ],
                ]);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning('Teacher assignment notification failed: ' . $e->getMessage());
            }

            return response()->json([
                'message' => 'Assignment updated successfully',
                'assignment' => $assignment
            ]);
        } catch (\Illuminate\Database\QueryException $e) {
            return response()->json([
                'message' => 'ការចាត់តាំងនេះមានរួចរាល់ក្នុងប្រព័ន្ធហើយ',
                'assignment' => $assignment
            ], 200);
        }
    }





    // Delete assignment
    public function destroy($id)
    {
        $assignment = TeacherSubjectAssignment::findOrFail($id);

        $assignment->delete();



        return response()->json([

            'message'=>'Assignment deleted successfully'

        ]);

    }


}