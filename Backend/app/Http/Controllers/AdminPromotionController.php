<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Student;
use App\Models\SchoolClass;
use App\Models\StudentScore;
use Illuminate\Support\Facades\DB;

class AdminPromotionController extends Controller
{
    // Preview students in a class with calculated annual result (Pass/Fail)
    public function preview(Request $request)
    {
        $classId = $request->query('class_id');
        if (!$classId) {
            return response()->json([
                'students' => []
            ]);
        }

        $class = SchoolClass::find($classId);
        $students = Student::with(['user', 'schoolClass'])
            ->where('class_id', $classId)
            ->get();

        $previewData = $students->map(function($student) {
            $scores = StudentScore::where('student_id', $student->id)->get();
            $average = 0;
            $scoreOn50 = 0;
            $finalScore50 = 0;
            $isPassed = false;
            $statusLabel = 'N/A';

            if ($scores->count() > 0) {
                $average = round($scores->avg('percentage'), 2);
                $scoreOn50 = round($average / 2, 2);
                $finalScore50 = (int)round($scoreOn50);
                $isPassed = $finalScore50 >= 25;
                $statusLabel = $isPassed ? 'ជាប់ (PASS)' : 'ធ្លាក់ (FAIL)';
            }

            return [
                'id' => $student->id,
                'student_code' => $student->student_code,
                'name' => $student->user?->name ?? 'Unknown',
                'gender' => $student->gender ?? 'N/A',
                'photo' => $student->photo,
                'class_name' => $student->schoolClass?->name ?? 'N/A',
                'average' => $average,
                'score_on_50' => $scoreOn50,
                'final_score_50' => $finalScore50,
                'is_passed' => $isPassed,
                'status_label' => $statusLabel
            ];
        });

        return response()->json([
            'class' => $class ? [
                'id' => $class->id,
                'name' => $class->name,
                'grade_level' => $class->grade_level
            ] : null,
            'students' => $previewData
        ]);
    }

    // Execute promotion, retention, or graduation for selected students
    public function execute(Request $request)
    {
        $request->validate([
            'student_ids' => 'required|array|min:1',
            'student_ids.*' => 'exists:students,id',
            'action' => 'required|in:promote,repeat,graduate',
            'target_class_id' => 'required_if:action,promote,repeat|nullable|exists:school_classes,id',
            'academic_year' => 'nullable|string'
        ]);

        $studentIds = $request->student_ids;
        $action = $request->action;
        $targetClassId = $request->target_class_id;

        DB::beginTransaction();
        try {
            if ($action === 'graduate') {
                Student::whereIn('id', $studentIds)->update([
                    'class_id' => null,
                    'class_position' => 'Member'
                ]);
                $message = "សិស្សចំនួន " . count($studentIds) . " នាក់ត្រូវបានប្តូរទៅជា «បញ្ចប់ការសិក្សា (Graduated)» ដោយជោគជ័យ!";
            } else {
                $targetClass = SchoolClass::find($targetClassId);
                Student::whereIn('id', $studentIds)->update([
                    'class_id' => $targetClassId
                ]);
                $actionText = $action === 'promote' ? 'ដំឡើងថ្នាក់' : 'រក្សាទុកថ្នាក់ដដែល';
                $message = "សិស្សចំនួន " . count($studentIds) . " នាក់ត្រូវបាន{$actionText}ទៅថ្នាក់ «" . ($targetClass?->name ?? 'ថ្មី') . "» ដោយជោគជ័យ!";
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => $message,
                'affected_count' => count($studentIds)
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'មានបញ្ហាក្នុងការដំឡើងថ្នាក់សិស្ស៖ ' . $e->getMessage()
            ], 500);
        }
    }
}
