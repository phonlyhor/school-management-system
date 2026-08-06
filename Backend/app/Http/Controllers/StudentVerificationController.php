<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Student;
use App\Models\Attendance;

class StudentVerificationController extends Controller
{
    public function verify($code)
    {
        try {
            $query = Student::with([
                'user',
                'schoolClass.teacherAssignments.teacher',
                'studentParent.user',
                'parents.user'
            ]);

            if (is_numeric($code)) {
                $query->where(function ($q) use ($code) {
                    $q->where('id', (int)$code)
                      ->orWhere('student_code', (string)$code);
                });
            } else {
                $query->where('student_code', (string)$code);
            }

            $student = $query->first();

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

            $homeroomTeacher = 'N/A';
            if ($student->schoolClass && $student->schoolClass->teacherAssignments) {
                $homeroomTeacher = $student->schoolClass->teacherAssignments
                    ->map(fn($a) => $a->teacher?->name)
                    ->filter()
                    ->first() ?? 'N/A';
            }

            $parentInfo = $student->studentParent ?? ($student->parents ? $student->parents->first() : null);

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
                    'student_code' => $student->student_code ?? ('STU-' . str_pad($student->id, 4, '0', STR_PAD_LEFT)),
                    'name' => $student->user?->name ?? 'N/A',
                    'email' => $student->user?->email ?? 'N/A',
                    'photo' => $student->photo,
                    'gender' => $student->gender ?? 'N/A',
                    'dob' => $student->date_of_birth ?? $student->dob ?? 'N/A',
                    'age' => $student->age ?? 'N/A',
                    'phone' => $student->phone ?? 'N/A',
                    'address' => $student->address ?? 'N/A',
                    'class' => [
                        'id' => $student->schoolClass?->id,
                        'name' => $student->schoolClass?->name ?? 'N/A',
                        'grade_level' => $student->schoolClass?->grade_level ?? 'N/A',
                        'homeroom_teacher' => $homeroomTeacher
                    ],
                    'parent' => $parentInfo ? [
                        'name' => $parentInfo->user?->name ?? $student->father_name ?? $student->mother_name ?? 'N/A',
                        'phone' => $parentInfo->phone ?? $student->father_phone ?? $student->mother_phone ?? 'N/A',
                        'relationship' => $parentInfo->relationship ?? 'Parent'
                    ] : null,
                    'attendance_rate' => $rate
                ]
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Student Verification Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'មានបញ្ហាបច្ចេកទេសលើ Server (Server Error: ' . $e->getMessage() . ')',
                'student' => null
            ], 500);
        }
    }

    public function verifyTeacher($code)
    {
        try {
            $query = \App\Models\Teacher::with(['user', 'teacherAssignments.schoolClass']);

            $cleanCode = (string)$code;
            $numericId = null;
            if (preg_match('/^TCH-(\d+)$/i', $cleanCode, $matches)) {
                $numericId = (int)$matches[1];
            } elseif (is_numeric($cleanCode)) {
                $numericId = (int)$cleanCode;
            }

            $query->where(function ($q) use ($cleanCode, $numericId) {
                $q->where('civil_servant_id', $cleanCode);
                if ($numericId !== null) {
                    $q->orWhere('id', $numericId);
                }
            });

            $teacher = $query->first();

            if (!$teacher) {
                return response()->json([
                    'success' => false,
                    'message' => 'រកមិនឃើញទិន្នន័យគ្រូបង្រៀនដែលមានអត្តលេខនេះឡើយ (Teacher record not found)',
                    'teacher' => null
                ], 404);
            }

            $classes = $teacher->teacherAssignments ? $teacher->teacherAssignments->map(function($a) {
                return $a->schoolClass?->name;
            })->filter()->unique()->values() : [];

            return response()->json([
                'success' => true,
                'verification_status' => 'VERIFIED_OFFICIAL_TEACHER',
                'school' => [
                    'name_kh' => 'វិទ្យាល័យ ហ៊ុន សែន ចំការលើ',
                    'name_en' => 'HUN SEN CHAMKAR LOE HIGH SCHOOL',
                    'code' => 'HS-CL-2026'
                ],
                'teacher' => [
                    'id' => $teacher->id,
                    'civil_servant_id' => $teacher->civil_servant_id ?? ('TCH-' . str_pad($teacher->id, 4, '0', STR_PAD_LEFT)),
                    'name' => $teacher->user?->name ?? 'N/A',
                    'email' => $teacher->user?->email ?? 'N/A',
                    'gender' => $teacher->gender ?? 'N/A',
                    'photo' => $teacher->photo,
                    'phone' => $teacher->phone ?? 'N/A',
                    'position' => $teacher->position ?? 'គ្រូបង្រៀន (Teacher)',
                    'civil_service_framework' => $teacher->civil_service_framework ?? 'គ្រូបង្រៀនកម្រិតខ្ពស់',
                    'specialization_1' => $teacher->specialization_1 ?? $teacher->specialization ?? 'N/A',
                    'specialization_2' => $teacher->specialization_2 ?? 'N/A',
                    'degree_level' => $teacher->degree_level ?? 'បរិញ្ញាបត្រ',
                    'assigned_classes' => $classes
                ]
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Teacher Verification Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'មានបញ្ហាបច្ចេកទេសលើ Server (Server Error: ' . $e->getMessage() . ')',
                'teacher' => null
            ], 500);
        }
    }
}
