<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\SchoolClass;

class TeacherStudentController extends Controller
{
    public function index(Request $request, $class_id)
    {
        $teacher = $request->user();


        // Admin can view any class roster
        if ($teacher->role_id == 1) {
            $allowed = true;
        } else {
            $allowed = \App\Models\TeacherClassAssignment::where('teacher_id', $teacher->id)
                ->where('class_id', $class_id)
                ->exists();

            if (!$allowed) {
                $allowed = \App\Models\TeacherSubjectAssignment::where('teacher_id', $teacher->id)
                    ->where('class_id', $class_id)
                    ->exists();
            }

            if (!$allowed) {
                $allowed = \App\Models\TeacherAssignment::where('teacher_id', $teacher->id)
                    ->where('class_id', $class_id)
                    ->exists();
            }

            if (!$allowed) {
                $allowed = \App\Models\Schedule::where('class_id', $class_id)
                    ->where(function($q) use ($teacher) {
                        $q->where('teacher_id', $teacher->id)
                          ->orWhere('secondary_teacher_id', $teacher->id);
                    })
                    ->exists();
            }
        }

        if (!$allowed) {
            return response()->json([
                'message' => 'You cannot access this class'
            ], 403);
        }


        $class = SchoolClass::with([
            'students.user',
            'students.studentParent.user',
            'students.schoolClass'
        ])
        ->findOrFail($class_id);



        $isHomeroom = ($teacher->role_id == 1) || \App\Models\TeacherClassAssignment::where('teacher_id', $teacher->id)
            ->where('class_id', $class_id)
            ->exists();

        $today = date('Y-m-d');
        $todayAttendances = \App\Models\Attendance::with(['teacher', 'subject', 'student.user'])
            ->where('class_id', $class_id)
            ->whereDate('date', $today)
            ->get();

        $hrAssignment = \App\Models\TeacherClassAssignment::with('teacher')
            ->where('class_id', $class_id)
            ->first();
        $hrTeacherName = $hrAssignment ? $hrAssignment->teacher?->name : null;

        return response()->json([
            'class' => [
                'id' => $class->id,
                'name' => $class->name,
                'grade_level' => $class->grade_level,
                'homeroom_teacher_name' => $hrTeacherName
            ],
            'is_homeroom' => $isHomeroom,
            'today_attendances' => $todayAttendances,
            'students' => $class->students
        ]);
    }

    public function updatePosition(Request $request, $student_id)
    {
        $request->validate([
            'class_position' => 'required|string'
        ]);

        $student = \App\Models\Student::findOrFail($student_id);
        $teacher = $request->user();

        // ONLY Admin (role_id == 1) or Homeroom Teacher (TeacherClassAssignment) can assign class positions
        if ($teacher->role_id != 1) {
            $isHomeroom = \App\Models\TeacherClassAssignment::where('teacher_id', $teacher->id)
                ->where('class_id', $student->class_id)
                ->exists();

            if (!$isHomeroom) {
                return response()->json([
                    'message' => 'លោកគ្រូ/អ្នកគ្រូបង្រៀនតាមមុខវិជ្ជា មិនអាចចាត់តាំងប្រធានថ្នាក់ ឬ តួនាទីសិស្សបានឡើយ! មានតែ គ្រូបន្ទុកថ្នាក់ (Homeroom Teacher) ឬ Admin ប៉ុណ្ណោះដែលមានសិទ្ធិ។'
                ], 403);
            }
        }

        $student->update([
            'class_position' => $request->class_position
        ]);

        return response()->json([
            'message' => 'Student class position updated successfully',
            'student' => $student->load('user')
        ]);
    }
}