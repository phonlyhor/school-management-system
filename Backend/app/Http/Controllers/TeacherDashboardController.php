<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\TeacherClassAssignment;
use App\Models\TeacherSubjectAssignment;
use App\Models\Schedule;
use App\Models\Attendance;
use App\Models\StudentScore;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class TeacherDashboardController extends Controller
{
    public function dashboard(Request $request)
    {
        try {
            $teacher = $request->user();

            // 1. Get all assigned Class IDs for this teacher
            $classIdsFromClass = TeacherClassAssignment::where('teacher_id', $teacher->id)->pluck('class_id')->toArray();
            $classIdsFromSubject = TeacherSubjectAssignment::where('teacher_id', $teacher->id)->pluck('class_id')->toArray();
            $classIdsFromSchedule = Schedule::where('teacher_id', $teacher->id)->pluck('class_id')->toArray();

            $allClassIds = array_values(array_unique(array_filter(array_merge($classIdsFromClass, $classIdsFromSubject, $classIdsFromSchedule))));

            // 2. Get assigned classes details with student counts
            $assignedClasses = [];
            if (!empty($allClassIds)) {
                $assignedClasses = \App\Models\SchoolClass::withCount('students')
                    ->whereIn('id', $allClassIds)
                    ->get();
            }

            // 3. Total Students Taught
            $totalStudentsCount = !empty($allClassIds) ? Student::whereIn('class_id', $allClassIds)->count() : 0;

            // 4. Get assigned subjects
            $subjects = TeacherSubjectAssignment::with('subject')
                ->where('teacher_id', $teacher->id)
                ->get()
                ->map(function ($item) {
                    return $item->subject;
                })->filter()->unique('id')->values();

            // 5. Today's Schedule (Day of Week e.g. Monday, Tuesday...)
            $todayName = Carbon::now()->format('l'); // e.g. "Monday"
            $todaySchedules = Schedule::with(['schoolClass', 'subject'])
                ->where('teacher_id', $teacher->id)
                ->whereRaw('LOWER(day) = ?', [strtolower($todayName)])
                ->orderBy('start_time', 'asc')
                ->get();

            // 6. Today's Attendance summary
            $todayDate = Carbon::today()->toDateString();
            $todayAttendanceCount = Attendance::where('teacher_id', $teacher->id)
                ->where('date', $todayDate)
                ->count();

            $todayPresentCount = Attendance::where('teacher_id', $teacher->id)
                ->where('date', $todayDate)
                ->whereRaw('LOWER(status) = ?', ['present'])
                ->count();

            $todayAttendanceRate = $todayAttendanceCount > 0 
                ? round(($todayPresentCount / $todayAttendanceCount) * 100) . '%' 
                : '0%';

            // 7. Recent Student Performance / Scores entered
            $recentScores = collect([]);
            if (!empty($allClassIds)) {
                $recentScores = StudentScore::with(['student.user', 'student.schoolClass', 'subject', 'assessment'])
                    ->whereHas('student', function ($query) use ($allClassIds) {
                        $query->whereIn('class_id', $allClassIds);
                    })
                    ->latest('id')
                    ->take(10)
                    ->get()
                    ->map(function ($s) {
                        return [
                            'id' => $s->id,
                            'student_name' => $s->student?->user?->name ?? 'Student',
                            'student_code' => $s->student?->student_code ?? 'N/A',
                            'class_name' => $s->student?->schoolClass?->name ?? 'Unassigned',
                            'subject_name' => $s->subject?->name ?? 'Subject',
                            'assessment_name' => $s->assessment?->name ?? 'Quiz/Exam',
                            'score' => $s->score,
                            'max_score' => $s->max_score,
                            'percentage' => $s->percentage,
                            'grade' => $s->grade
                        ];
                    });
            }

            return response()->json([
                'teacher' => [
                    'id' => $teacher->id,
                    'name' => $teacher->name,
                    'email' => $teacher->email,
                ],
                'stats' => [
                    'total_classes' => count($allClassIds),
                    'total_subjects' => count($subjects),
                    'total_students' => $totalStudentsCount,
                    'today_attendance_count' => $todayAttendanceCount,
                    'today_attendance_rate' => $todayAttendanceRate,
                ],
                'classes' => collect($assignedClasses)->map(function ($c) {
                    return [
                        'id' => $c->id,
                        'name' => $c->name,
                        'grade_level' => $c->grade_level,
                        'students_count' => $c->students_count ?? 0,
                    ];
                }),
                'subjects' => $subjects->map(function ($s) {
                    return [
                        'id' => $s->id,
                        'name' => $s->name,
                        'code' => $s->code,
                    ];
                }),
                'today_schedules' => $todaySchedules->map(function ($sch) {
                    return [
                        'id' => $sch->id,
                        'day_of_week' => $sch->day_of_week,
                        'class_name' => $sch->schoolClass?->name ?? 'Class',
                        'subject_name' => $sch->subject?->name ?? 'Subject',
                        'start_time' => $sch->start_time,
                        'end_time' => $sch->end_time,
                        'room' => $sch->room ?? 'N/A'
                    ];
                }),
                'recent_scores' => $recentScores
            ]);

        } catch (\Exception $e) {
            Log::error('Teacher Dashboard Error: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
            
            // Fallback safe response if any query fails
            $teacher = $request->user();
            return response()->json([
                'teacher' => [
                    'id' => $teacher->id ?? 0,
                    'name' => $teacher->name ?? 'Teacher',
                    'email' => $teacher->email ?? '',
                ],
                'stats' => [
                    'total_classes' => 0,
                    'total_subjects' => 0,
                    'total_students' => 0,
                    'today_attendance_count' => 0,
                    'today_attendance_rate' => '0%',
                ],
                'classes' => [],
                'subjects' => [],
                'today_schedules' => [],
                'recent_scores' => []
            ]);
        }
    }
}