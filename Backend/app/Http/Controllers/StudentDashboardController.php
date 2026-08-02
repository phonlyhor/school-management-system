<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Attendance;
use App\Models\Student;
use App\Models\Schedule;
use App\Models\StudentScore;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class StudentDashboardController extends Controller
{
    public function dashboard(Request $request)
    {
        try {
            $user = $request->user();

            $student = Student::with([
                'schoolClass.teacherAssignments.teacher',
                'studentParent.user'
            ])
            ->where('user_id', $user->id)
            ->first();

            if (!$student) {
                return response()->json([
                    'student' => [
                        'id' => null, 
                        'name' => $user->name, 
                        'student_code' => 'N/A', 
                        'photo' => null,
                        'class_position' => 'Member'
                    ],
                    'class' => ['id' => null, 'name' => 'Not Assigned', 'grade_level' => 'N/A', 'homeroom_teacher' => 'N/A'],
                    'attendance' => ['total' => 0, 'present' => 0, 'absent' => 0, 'late' => 0, 'percentage' => '0%'],
                    'summary' => ['average_percentage' => 0, 'gpa' => '0.00', 'total_scores' => 0],
                    'today_schedules' => [],
                    'recent_scores' => []
                ]);
            }

            // 1. Attendance Metrics
            $attendances = Attendance::where('student_id', $student->id)->get();
            $totalAttendance = $attendances->count();
            $presentCount = $attendances->where('status', 'present')->count();
            $absentCount = $attendances->where('status', 'absent')->count();
            $lateCount = $attendances->whereIn('status', ['late', 'permission'])->count();

            $attendancePercentage = $totalAttendance > 0 
                ? round(($presentCount / $totalAttendance) * 100, 1) . '%' 
                : '0%';

            // 2. Today's Schedule for Student's Class
            $todayName = Carbon::now()->format('l'); // e.g. "Monday"
            $todaySchedules = [];
            if ($student->class_id) {
                $todaySchedules = Schedule::with(['subject', 'teacher'])
                    ->where('class_id', $student->class_id)
                    ->whereRaw('LOWER(day) = ?', [strtolower($todayName)])
                    ->orderBy('start_time', 'asc')
                    ->get()
                    ->map(function ($sch) {
                        return [
                            'id' => $sch->id,
                            'subject_name' => $sch->subject?->name ?? 'Subject',
                            'teacher_name' => $sch->teacher?->name ?? 'Instructor',
                            'start_time' => $sch->start_time,
                            'end_time' => $sch->end_time,
                            'room' => $sch->room ?? 'N/A'
                        ];
                    });
            }

            // 3. Scores & GPA Summary
            $studentScores = StudentScore::with(['subject', 'assessment'])
                ->where('student_id', $student->id)
                ->latest('id')
                ->get();

            $totalScoresCount = $studentScores->count();
            $avgPercentage = $totalScoresCount > 0 ? round($studentScores->avg('percentage'), 1) : 0;
            
            // Calculate GPA (4.0 scale estimation)
            $gpa = '0.00';
            if ($avgPercentage >= 90) $gpa = '4.00';
            else if ($avgPercentage >= 80) $gpa = '3.50';
            else if ($avgPercentage >= 70) $gpa = '3.00';
            else if ($avgPercentage >= 60) $gpa = '2.50';
            else if ($avgPercentage >= 50) $gpa = '2.00';
            else if ($totalScoresCount > 0) $gpa = '1.00';

            $recentScores = $studentScores->take(5)->map(function ($s) {
                return [
                    'id' => $s->id,
                    'subject_name' => $s->subject?->name ?? 'Subject',
                    'assessment_name' => $s->assessment?->name ?? 'Assessment',
                    'score' => $s->score,
                    'max_score' => $s->max_score,
                    'percentage' => $s->percentage,
                    'grade' => $s->grade
                ];
            });

            // Homeroom teacher name
            $homeroomTeachers = $student->schoolClass?->teacherAssignments
                ? $student->schoolClass->teacherAssignments->map(fn($a) => $a->teacher?->name)->filter()->join(', ')
                : 'Not Assigned';

            return response()->json([
                'student' => [
                    'id' => $student->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'student_code' => $student->student_code,
                    'photo' => $student->photo,
                    'age' => $student->age,
                    'gender' => $student->gender,
                    'class_position' => $student->class_position ?? 'Member'
                ],
                'class' => [
                    'id' => $student->schoolClass?->id,
                    'name' => $student->schoolClass?->name ?? 'Not Assigned',
                    'grade_level' => $student->schoolClass?->grade_level ?? 'N/A',
                    'homeroom_teacher' => $homeroomTeachers ?: 'Not Assigned'
                ],
                'attendance' => [
                    'total' => $totalAttendance,
                    'present' => $presentCount,
                    'absent' => $absentCount,
                    'late' => $lateCount,
                    'percentage' => $attendancePercentage
                ],
                'summary' => [
                    'average_percentage' => $avgPercentage,
                    'gpa' => $gpa,
                    'total_scores' => $totalScoresCount
                ],
                'today_schedules' => $todaySchedules,
                'recent_scores' => $recentScores
            ]);

        } catch (\Exception $e) {
            Log::error('Student Dashboard Error: ' . $e->getMessage() . "\n" . $e->getTraceAsString());

            return response()->json([
                'student' => ['id' => null, 'name' => $request->user()?->name ?? 'Student', 'student_code' => 'N/A', 'photo' => null, 'class_position' => 'Member'],
                'class' => ['id' => null, 'name' => 'Not Assigned', 'grade_level' => 'N/A', 'homeroom_teacher' => 'N/A'],
                'attendance' => ['total' => 0, 'present' => 0, 'absent' => 0, 'late' => 0, 'percentage' => '0%'],
                'summary' => ['average_percentage' => 0, 'gpa' => '0.00', 'total_scores' => 0],
                'today_schedules' => [],
                'recent_scores' => []
            ]);
        }
    }

    public function attendance(Request $request)
    {
        $user = $request->user();

        $student = Student::where('user_id', $user->id)->first();
        if (!$student) {
            return response()->json([
                'attendances' => [],
                'summary' => ['total' => 0, 'present' => 0, 'absent' => 0, 'late' => 0, 'percentage' => '0%']
            ]);
        }

        $attendances = Attendance::with(['subject', 'schoolClass'])
            ->where('student_id', $student->id)
            ->orderBy('date', 'desc')
            ->get();

        $total = $attendances->count();
        $present = $attendances->where('status', 'present')->count();
        $absent = $attendances->where('status', 'absent')->count();
        $late = $attendances->whereIn('status', ['late', 'permission'])->count();
        $percentage = $total > 0 ? round(($present / $total) * 100, 1) . '%' : '0%';

        return response()->json([
            'attendances' => $attendances,
            'summary' => [
                'total' => $total,
                'present' => $present,
                'absent' => $absent,
                'late' => $late,
                'percentage' => $percentage
            ]
        ]);
    }
}