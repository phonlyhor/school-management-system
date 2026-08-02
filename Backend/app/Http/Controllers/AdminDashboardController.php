<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Student;
use App\Models\StudentParent;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\Attendance;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class AdminDashboardController extends Controller
{
    public function index(Request $request)
    {
        try {
            // Count Users by Role
            $teachersCount = User::where('role_id', 2)->count();
            $studentsCount = Student::count();
            $parentsCount = StudentParent::count();

            // Count Classes, Subjects, Buildings & Offices
            $classesCount = SchoolClass::count();
            $subjectsCount = Subject::count();
            $buildingsCount = \App\Models\Building::where('type', 'Building')->count();
            $adminOfficesCount = \App\Models\Building::where('type', 'Admin Office')->count();
            $totalRoomsCount = \App\Models\Building::sum('total_rooms');

            // Attendance Overview (Filter by selected date if provided, default to today)
            $selectedDateStr = $request->query('date');
            if ($selectedDateStr) {
                try {
                    $selectedDate = Carbon::parse($selectedDateStr);
                } catch (\Exception $e) {
                    $selectedDate = Carbon::today();
                }
            } else {
                $selectedDate = Carbon::today();
            }

            $attendanceRecords = Attendance::whereDate('date', $selectedDate->format('Y-m-d'))->get();

            $present = $attendanceRecords->filter(fn($a) => strtolower($a->status) === 'present')->count();
            $absent = $attendanceRecords->filter(fn($a) => strtolower($a->status) === 'absent')->count();
            $late = $attendanceRecords->filter(fn($a) => strtolower($a->status) === 'late')->count();
            $permission = $attendanceRecords->filter(fn($a) => strtolower($a->status) === 'permission')->count();

            // Schedules (Smart fallback to class timetables if today has 0)
            $todayDayName = Carbon::now()->format('l');
            $schedulesQuery = \App\Models\Schedule::with(['schoolClass', 'subject', 'teacher'])
                ->whereRaw('LOWER(day) = ?', [strtolower($todayDayName)])
                ->orderBy('start_time', 'asc')
                ->get();

            if ($schedulesQuery->count() === 0) {
                $schedulesQuery = \App\Models\Schedule::with(['schoolClass', 'subject', 'teacher'])
                    ->orderBy('id', 'desc')
                    ->take(10)
                    ->get();
            }

            $todaySchedules = $schedulesQuery->map(function ($sch) {
                return [
                    'id' => $sch->id,
                    'day_of_week' => $sch->day,
                    'class_name' => $sch->schoolClass?->name ?? 'Class',
                    'subject_name' => $sch->subject?->name ?? 'Subject',
                    'teacher_name' => $sch->teacher?->name ?? 'Instructor',
                    'start_time' => $sch->start_time,
                    'end_time' => $sch->end_time,
                    'room' => $sch->room ?? 'N/A'
                ];
            });

            // Recent Enrolled Students (Top 5)
            $recentStudents = Student::with(['user', 'schoolClass'])
                ->latest('id')
                ->take(5)
                ->get()
                ->map(function ($s) {
                    return [
                        'id' => $s->id,
                        'student_code' => $s->student_code,
                        'name' => $s->user?->name ?? 'Student',
                        'email' => $s->user?->email ?? 'N/A',
                        'class_name' => $s->schoolClass ? $s->schoolClass->name : 'Unassigned',
                        'gender' => $s->gender ?? 'N/A',
                        'photo' => $s->photo,
                        'created_at' => $s->created_at ? $s->created_at->format('Y-m-d') : 'N/A'
                    ];
                });

            // Recent Teachers (Top 5)
            $recentTeachers = User::where('role_id', 2)
                ->latest('id')
                ->take(5)
                ->get()
                ->map(function ($t) {
                    return [
                        'id' => $t->id,
                        'name' => $t->name,
                        'email' => $t->email,
                        'photo' => $t->photo,
                        'created_at' => $t->created_at ? $t->created_at->format('Y-m-d') : 'N/A'
                    ];
                });

            // Classes list with enrolled student count
            $classList = SchoolClass::withCount('students')
                ->orderBy('name')
                ->take(6)
                ->get()
                ->map(function ($c) {
                    return [
                        'id' => $c->id,
                        'name' => $c->name,
                        'grade_level' => $c->grade_level,
                        'students_count' => $c->students_count
                    ];
                });

            return response()->json([
                'users' => [
                    'teachers' => $teachersCount,
                    'students' => $studentsCount,
                    'parents' => $parentsCount,
                ],
                'classes' => $classesCount,
                'subjects' => $subjectsCount,
                'buildings' => $buildingsCount,
                'admin_offices' => $adminOfficesCount,
                'total_rooms' => $totalRoomsCount,
                'attendance_today' => [
                    'date' => $selectedDate->format('Y-m-d'),
                    'is_today' => $selectedDate->isToday(),
                    'present' => $present,
                    'absent' => $absent,
                    'late' => $late,
                    'permission' => $permission,
                    'total' => $attendanceRecords->count()
                ],
                'recent_students' => $recentStudents,
                'recent_teachers' => $recentTeachers,
                'class_distribution' => $classList,
                'today_schedules' => $todaySchedules
            ]);

        } catch (\Exception $e) {
            Log::error('Admin Dashboard Error: ' . $e->getMessage() . "\n" . $e->getTraceAsString());

            return response()->json([
                'users' => ['teachers' => 0, 'students' => 0, 'parents' => 0],
                'classes' => 0,
                'subjects' => 0,
                'attendance_today' => ['present' => 0, 'absent' => 0, 'late' => 0, 'permission' => 0, 'total' => 0],
                'recent_students' => [],
                'recent_teachers' => [],
                'class_distribution' => []
            ]);
        }
    }

    public function orgStructure()
    {
        try {
            // Level 1: School Director / Principal (Main Admin user)
            $adminUsers = User::where('role_id', 1)->get();
            $mainPrincipal = $adminUsers->first();

            $principals = [
                [
                    'id' => $mainPrincipal?->id ?? 1,
                    'name' => $mainPrincipal?->name ?? 'លោកនាយកសាលា (School Director)',
                    'email' => $mainPrincipal?->email ?? 'principal@school.edu.kh',
                    'title' => '👑 នាយកសាលា (School Principal / Director)',
                    'level' => 1
                ]
            ];

            // Level 2: Vice Principals (School Administrators & Management staff, NOT teachers!)
            $otherAdmins = $adminUsers->slice(1)->values();
            if ($otherAdmins->count() > 0) {
                $vicePrincipals = $otherAdmins->map(function ($u, $idx) {
                    return [
                        'id' => $u->id,
                        'name' => $u->name,
                        'email' => $u->email,
                        'title' => $idx === 0 ? '⭐ នាយករងកិច្ចការសិក្សា (Vice Principal - Academic)' : '⭐ នាយករងរដ្ឋបាល/វិន័យ (Vice Principal - Administration)',
                        'level' => 2
                    ];
                });
            } else {
                $vicePrincipals = collect([
                    [
                        'id' => 'vp1',
                        'name' => 'លោកនាយករង ទទួលបន្ទុករដ្ឋបាល & កិច្ចការសិក្សា',
                        'email' => 'vice.principal.academic@school.edu.kh',
                        'title' => '⭐ នាយករងកិច្ចការសិក្សា (Vice Principal - Academic)',
                        'level' => 2
                    ],
                    [
                        'id' => 'vp2',
                        'name' => 'លោកនាយករង ទទួលបន្ទុកវិន័យ & សិក្សាធិការ',
                        'email' => 'vice.principal.admin@school.edu.kh',
                        'title' => '⭐ នាយករងរដ្ឋបាល & វិន័យ (Vice Principal - Administration)',
                        'level' => 2
                    ]
                ]);
            }

            // Level 3: All Teachers (role_id = 2)
            $allTeachers = User::where('role_id', 2)->with(['teacherClassAssignments.schoolClass'])->get();

            // Level 3: Homeroom Teachers (គ្រូបន្ទុកថ្នាក់)
            $homeroomTeachers = $allTeachers->filter(function ($t) {
                return $t->teacherClassAssignments && $t->teacherClassAssignments->count() > 0;
            })->values()->map(function ($t) {
                $classes = $t->teacherClassAssignments->map(fn($a) => $a->schoolClass?->name)->filter()->join(', ');
                return [
                    'id' => $t->id,
                    'name' => $t->name,
                    'email' => $t->email,
                    'photo' => $t->photo,
                    'title' => '👑 គ្រូបន្ទុកថ្នាក់ (' . ($classes ?: 'Homeroom Teacher') . ')',
                    'classes' => $classes,
                    'level' => 3
                ];
            });

            // Level 3: Subject Teachers (គ្រូបង្រៀនតាមមុខវិជ្ជា)
            $subjectTeachers = $allTeachers->filter(function ($t) {
                return !$t->teacherClassAssignments || $t->teacherClassAssignments->count() == 0;
            })->values()->map(function ($t) {
                return [
                    'id' => $t->id,
                    'name' => $t->name,
                    'email' => $t->email,
                    'photo' => $t->photo,
                    'title' => '💻 គ្រូបង្រៀនតាមមុខវិជ្ជា (Subject Teacher)',
                    'level' => 3
                ];
            });

            // Level 4: Class Monitors & Student Leaders (👑 ប្រធានថ្នាក់, ⭐ អនុប្រធានថ្នាក់)
            $studentLeaders = Student::with(['user', 'schoolClass'])
                ->whereIn('class_position', ['Class Monitor', 'Vice Monitor'])
                ->get()
                ->map(function ($s) {
                    return [
                        'id' => $s->id,
                        'name' => $s->user?->name ?? 'Student',
                        'student_code' => $s->student_code,
                        'class_name' => $s->schoolClass?->name ?? 'Class',
                        'class_position' => $s->class_position,
                        'title' => $s->class_position === 'Class Monitor' ? '👑 ប្រធានថ្នាក់ (Class Monitor)' : '⭐ អនុប្រធានថ្នាក់ (Vice Monitor)',
                        'level' => 4
                    ];
                });

            // Total stats
            $totalStudents = Student::count();
            $totalClasses = SchoolClass::count();

            return response()->json([
                'principals' => $principals,
                'vice_principals' => $vicePrincipals,
                'homeroom_teachers' => $homeroomTeachers,
                'subject_teachers' => $subjectTeachers,
                'student_leaders' => $studentLeaders,
                'summary' => [
                    'total_principals' => is_countable($principals) ? count($principals) : 0,
                    'total_vice_principals' => is_countable($vicePrincipals) ? count($vicePrincipals) : 0,
                    'total_homeroom_teachers' => is_countable($homeroomTeachers) ? count($homeroomTeachers) : 0,
                    'total_subject_teachers' => is_countable($subjectTeachers) ? count($subjectTeachers) : 0,
                    'total_student_leaders' => is_countable($studentLeaders) ? count($studentLeaders) : 0,
                    'total_students' => $totalStudents,
                    'total_classes' => $totalClasses
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Org Structure Error: ' . $e->getMessage());
            return response()->json([
                'principals' => [],
                'vice_principals' => [],
                'homeroom_teachers' => [],
                'subject_teachers' => [],
                'student_leaders' => [],
                'summary' => ['total_principals' => 0, 'total_vice_principals' => 0, 'total_homeroom_teachers' => 0, 'total_subject_teachers' => 0, 'total_student_leaders' => 0, 'total_students' => 0, 'total_classes' => 0]
            ]);
        }
    }
}