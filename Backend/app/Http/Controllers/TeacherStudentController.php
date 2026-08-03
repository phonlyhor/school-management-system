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

        $targetDate = $request->query('date', date('Y-m-d'));
        $todayAttendances = \App\Models\Attendance::with(['teacher', 'subject', 'student.user'])
            ->where('class_id', $class_id)
            ->whereDate('date', $targetDate)
            ->get();

        $hrAssignment = \App\Models\TeacherClassAssignment::with('teacher')
            ->where('class_id', $class_id)
            ->first();
        $hrTeacherName = $hrAssignment ? $hrAssignment->teacher?->name : null;

        // Fetch subject teachers teaching this class & their study times
        $subjectTeachersMap = [];
        $schedules = \App\Models\Schedule::with(['subject', 'teacher', 'secondaryTeacher'])
            ->where('class_id', $class_id)
            ->get();

        $dayKhmerMap = [
            'Monday' => 'ច័ន្ទ', 'Tuesday' => 'អង្គារ', 'Wednesday' => 'ពុធ',
            'Thursday' => 'ព្រហស្បតិ៍', 'Friday' => 'សុក្រ', 'Saturday' => 'សៅរ៍', 'Sunday' => 'អាទិត្យ'
        ];

        foreach ($schedules as $sched) {
            if ($sched->subject_id) {
                $subjId = $sched->subject_id;
                if (!isset($subjectTeachersMap[$subjId])) {
                    $subjectTeachersMap[$subjId] = [
                        'subject_id' => $sched->subject_id,
                        'subject_name' => $sched->subject?->name,
                        'subject_code' => $sched->subject?->code,
                        'max_score' => $sched->subject?->max_score ?? 100,
                        'teacher_id' => $sched->teacher_id,
                        'teacher_name' => $sched->teacher?->name ?? 'មិនទាន់កំណត់',
                        'secondary_teacher_name' => $sched->secondaryTeacher?->name,
                        'study_times' => []
                    ];
                }

                $dayLabel = $dayKhmerMap[$sched->day] ?? $sched->day;
                $startTime = substr($sched->start_time, 0, 5);
                $endTime = substr($sched->end_time, 0, 5);
                $timeSlot = "{$dayLabel} ({$startTime} - {$endTime})";

                if (!in_array($timeSlot, $subjectTeachersMap[$subjId]['study_times'])) {
                    $subjectTeachersMap[$subjId]['study_times'][] = $timeSlot;
                }
            }
        }

        $tsAssignments = \App\Models\TeacherSubjectAssignment::with(['subject', 'teacher'])
            ->where('class_id', $class_id)
            ->get();

        foreach ($tsAssignments as $tsa) {
            if ($tsa->subject_id && !isset($subjectTeachersMap[$tsa->subject_id])) {
                $subjectTeachersMap[$tsa->subject_id] = [
                    'subject_id' => $tsa->subject_id,
                    'subject_name' => $tsa->subject?->name,
                    'subject_code' => $tsa->subject?->code,
                    'max_score' => $tsa->subject?->max_score ?? 100,
                    'teacher_id' => $tsa->teacher_id,
                    'teacher_name' => $tsa->teacher?->name ?? 'មិនទាន់កំណត់',
                    'secondary_teacher_name' => null,
                    'study_times' => []
                ];
            }
        }

        // Fetch student scores for all students in this class
        $studentIds = $class->students->pluck('id');
        $scores = \App\Models\StudentScore::with(['subject', 'assessment'])
            ->whereIn('student_id', $studentIds)
            ->get()
            ->groupBy('student_id');

        $studentsFormatted = $class->students->map(function($st) use ($scores, $subjectTeachersMap) {
            $stArr = $st->toArray();
            $stScores = $scores->get($st->id, collect([]));
            $stArr['scores'] = $stScores->map(function($sc) use ($subjectTeachersMap) {
                $teacherInfo = $subjectTeachersMap[$sc->subject_id] ?? null;
                return [
                    'id' => $sc->id,
                    'subject_id' => $sc->subject_id,
                    'subject_name' => $sc->subject?->name,
                    'subject_code' => $sc->subject?->code,
                    'assessment_id' => $sc->assessment_id,
                    'assessment_name' => $sc->assessment?->name,
                    'teacher_name' => $teacherInfo ? $teacherInfo['teacher_name'] : 'មិនទាន់កំណត់',
                    'score' => (float)$sc->score,
                    'max_score' => (float)($sc->max_score ?? $sc->subject?->max_score ?? 100),
                    'percentage' => (float)$sc->percentage,
                    'grade' => $sc->grade,
                    'remark' => $sc->remark
                ];
            });
            return $stArr;
        });

        return response()->json([
            'class' => [
                'id' => $class->id,
                'name' => $class->name,
                'grade_level' => $class->grade_level,
                'homeroom_teacher_name' => $hrTeacherName
            ],
            'is_homeroom' => $isHomeroom,
            'today_attendances' => $todayAttendances,
            'subject_teachers' => array_values($subjectTeachersMap),
            'students' => $studentsFormatted
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