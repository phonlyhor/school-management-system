<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\StudentParent;
use App\Models\Attendance;
use App\Models\Schedule;

class ParentDashboardController extends Controller
{
    public function dashboard(Request $request)
    {
        $user = $request->user();
        $studentId = $request->query('student_id');

        $parentRecords = StudentParent::with([
            'student.user',
            'student.schoolClass'
        ])->where('user_id', $user->id)->get();

        if ($parentRecords->isEmpty()) {
            return response()->json([
                'parent' => ['id' => $user->id, 'name' => $user->name],
                'student' => ['id' => null, 'name' => 'Not Assigned', 'student_code' => 'N/A'],
                'class' => ['id' => null, 'name' => 'Not Assigned', 'grade_level' => 'N/A'],
                'attendance' => ['total' => 0, 'present' => 0, 'absent' => 0, 'late' => 0, 'percentage' => '0%'],
                'total_children' => 0
            ]);
        }

        if ($studentId && $studentId !== 'all') {
            $parent = $parentRecords->where('student_id', $studentId)->first();
        } else {
            $parent = $parentRecords->first();
        }

        $student = $parent ? $parent->student : null;
        $allStudentIds = $parentRecords->pluck('student_id')->filter();

        if ($studentId === 'all') {
            $attendances = Attendance::whereIn('student_id', $allStudentIds)->get();
        } else {
            $attendances = $student ? Attendance::where('student_id', $student->id)->get() : collect();
        }

        $total = $attendances->count();
        $present = $attendances->where('status', 'present')->count();
        $absent = $attendances->where('status', 'absent')->count();
        $late = $attendances->where('status', 'late')->count();

        $percentage = $total > 0 ? round(($present / $total) * 100, 2) : 0;

        return response()->json([
            'parent' => [
                'id' => $user->id,
                'name' => $user->name
            ],
            'student' => $student ? [
                'id' => $student->id,
                'name' => $student->user->name,
                'student_code' => $student->student_code
            ] : ['id' => null, 'name' => 'All Children', 'student_code' => 'N/A'],
            'class' => $student && $student->schoolClass ? [
                'id' => $student->schoolClass->id,
                'name' => $student->schoolClass->name,
                'grade_level' => $student->schoolClass->grade_level
            ] : ['id' => null, 'name' => 'All Classes', 'grade_level' => 'N/A'],
            'attendance' => [
                'total' => $total,
                'present' => $present,
                'absent' => $absent,
                'late' => $late,
                'percentage' => $percentage . '%'
            ],
            'total_children' => $parentRecords->count()
        ]);
    }

    public function schedule(Request $request)
    {
        $user = $request->user();
        $studentId = $request->query('student_id');

        $parentRecords = StudentParent::where('user_id', $user->id)
            ->with(['student.user', 'student.schoolClass'])
            ->get();

        if ($parentRecords->isEmpty()) {
            return response()->json([
                'parent' => ['id' => $user->id, 'name' => $user->name],
                'student' => ['id' => null, 'name' => 'N/A'],
                'schedule' => []
            ]);
        }

        if ($studentId && $studentId !== 'all') {
            $filteredRecords = $parentRecords->where('student_id', $studentId);
        } else {
            $filteredRecords = $parentRecords;
        }

        $classIds = $filteredRecords->map(fn($r) => $r->student->class_id ?? null)->filter()->toArray();

        $schedules = Schedule::with(['subject', 'teacher', 'schoolClass'])
            ->whereIn('class_id', $classIds)
            ->get();

        return response()->json([
            'parent' => [
                'id' => $user->id,
                'name' => $user->name
            ],
            'student' => [
                'id' => $studentId === 'all' ? 'all' : ($filteredRecords->first()->student->id ?? null),
                'name' => $studentId === 'all' ? 'All Children' : ($filteredRecords->first()->student->user->name ?? 'N/A'),
            ],
            'schedule' => $schedules->map(function ($item) {
                return [
                    'id' => $item->id,
                    'day' => $item->day,
                    'start_time' => $item->start_time,
                    'end_time' => $item->end_time,
                    'class' => [
                        'id' => $item->schoolClass->id ?? null,
                        'name' => $item->schoolClass->name ?? 'N/A'
                    ],
                    'subject' => $item->subject ? [
                        'id' => $item->subject->id,
                        'name' => $item->subject->name,
                        'code' => $item->subject->code
                    ] : null,
                    'teacher' => $item->teacher ? [
                        'id' => $item->teacher->id,
                        'name' => $item->teacher->name
                    ] : null,
                    'room' => $item->room,
                    'academic_year' => $item->academic_year
                ];
            })
        ]);
    }

    public function children(Request $request)
    {
        $user = $request->user();

        $parentRecords = StudentParent::with([
            'student.user',
            'student.schoolClass.teacherAssignments.teacher'
        ])
        ->where('user_id', $user->id)
        ->get();

        $students = $parentRecords->map(function ($record) {
            return $record->student;
        })->filter();

        return response()->json([
            'children' => $students->values()
        ]);
    }

    public function attendance(Request $request)
    {
        $user = $request->user();
        $studentId = $request->query('student_id');

        $parentRecords = StudentParent::where('user_id', $user->id)->get();

        if ($parentRecords->isEmpty()) {
            return response()->json([
                'attendances' => [],
                'summary' => ['total' => 0, 'present' => 0, 'absent' => 0, 'late' => 0, 'percentage' => '0%']
            ]);
        }

        if ($studentId && $studentId !== 'all') {
            $studentIds = [$studentId];
        } else {
            $studentIds = $parentRecords->pluck('student_id')->filter()->toArray();
        }

        $attendances = Attendance::with(['subject', 'schoolClass', 'student.user'])
            ->whereIn('student_id', $studentIds)
            ->orderBy('date', 'desc')
            ->get();

        $total = $attendances->count();
        $present = $attendances->where('status', 'present')->count();
        $absent = $attendances->where('status', 'absent')->count();
        $late = $attendances->where('status', 'late')->count();
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