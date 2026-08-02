<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Student;
use App\Models\Attendance;

class StudentVerificationController extends Controller
{
    public function verify($code)
    {
        $student = Student::with([
            'user',
            'schoolClass.teacherAssignments.teacher',
            'parents.user'
        ])
        ->where('student_code', $code)
        ->orWhere('id', $code)
        ->first();

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'រកមិនឃើញទិន្នន័យសិស្សឡើយ (Student record not found)',
                'student' => null
            ], 404);
        }

        // Calculate attendance summary
        $attendances = Attendance::where('student_id', $student->id)->get();
        $total = $attendances->count();
        $present = $attendances->where('status', 'present')->count();
        $rate = $total > 0 ? round(($present / $total) * 100, 1) . '%' : '100%';

        $homeroomTeacher = $student->schoolClass?->teacherAssignments
            ? $student->schoolClass->teacherAssignments->map(fn($a) => $a->teacher?->name)->filter()->first()
            : 'N/A';

        $parentInfo = $student->parents->first();

        return response()->json([
            'success' => true,
            'verification_status' => 'VERIFIED_OFFICIAL_STUDENT',
            'school' => [
                'name_kh' => 'វិទ្យាល័យ ហ៊ុន សែន ចំការលើ',
                'name_en' => 'HUN SEN CHAMKAR LOE HIGH SCHOOL',
                'code' => 'HS-CL-2026'
            ],
            'student' => [
                'id' => $student->id,
                'student_code' => $student->student_code,
                'name' => $student->user?->name ?? 'N/A',
                'email' => $student->user?->email ?? 'N/A',
                'photo' => $student->photo,
                'gender' => $student->gender ?? 'N/A',
                'dob' => $student->dob ?? 'N/A',
                'age' => $student->age,
                'phone' => $student->phone ?? 'N/A',
                'address' => $student->address ?? 'N/A',
                'class' => [
                    'id' => $student->schoolClass?->id,
                    'name' => $student->schoolClass?->name ?? 'N/A',
                    'grade_level' => $student->schoolClass?->grade_level ?? 'N/A',
                    'homeroom_teacher' => $homeroomTeacher ?? 'N/A'
                ],
                'parent' => $parentInfo ? [
                    'name' => $parentInfo->user?->name ?? 'N/A',
                    'phone' => $parentInfo->phone ?? 'N/A',
                    'relationship' => $parentInfo->relationship ?? 'Parent'
                ] : null,
                'attendance_rate' => $rate
            ]
        ]);
    }
}
