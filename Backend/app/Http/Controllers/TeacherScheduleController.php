<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Schedule;

class TeacherScheduleController extends Controller
{
    // My Teaching Schedule (Only periods taught by this teacher)
    public function index(Request $request)
    {
        $teacher = $request->user();

        $homeroomClassIds = \App\Models\TeacherClassAssignment::where('teacher_id', $teacher->id)
            ->pluck('class_id')
            ->toArray();

        $schedules = Schedule::with([
            'subject',
            'schoolClass',
            'teacher',
            'secondaryTeacher'
        ])
        ->where(function($q) use ($teacher) {
            $q->where('teacher_id', $teacher->id)
              ->orWhere('secondary_teacher_id', $teacher->id);
        })
        ->get();

        $allClassIds = $schedules->pluck('class_id')->filter()->unique();
        $allHomeroomTeacherAssignments = \App\Models\TeacherClassAssignment::with('teacher')
            ->whereIn('class_id', $allClassIds)
            ->get()
            ->keyBy('class_id');

        $formatted = collect($schedules->map(function($item) use ($homeroomClassIds, $allHomeroomTeacherAssignments, $teacher) {
            $isHr = ($teacher->role_id == 1) || in_array($item->class_id, $homeroomClassIds);
            $hrTeacherObj = $allHomeroomTeacherAssignments->get($item->class_id)?->teacher;
            return [
                'id' => $item->id,
                'day' => $item->day,
                'start_time' => $item->start_time,
                'end_time' => $item->end_time,
                'session' => $item->session,
                'subject' => [
                    'id' => $item->subject?->id,
                    'name' => $item->subject?->name,
                    'code' => $item->subject?->code
                ],
                'class' => [
                    'id' => $item->schoolClass?->id,
                    'name' => $item->schoolClass?->name,
                    'grade_level' => $item->schoolClass?->grade_level,
                    'is_homeroom' => $isHr,
                    'homeroom_teacher_name' => $hrTeacherObj ? $hrTeacherObj->name : null
                ],
                'teacher' => $item->teacher ? [
                    'id' => $item->teacher->id,
                    'name' => $item->teacher->name
                ] : null,
                'secondary_teacher' => $item->secondaryTeacher ? [
                    'id' => $item->secondaryTeacher->id,
                    'name' => $item->secondaryTeacher->name
                ] : null,
                'room' => $item->room,
                'academic_year' => $item->academic_year
            ];
        }));

        // Also fetch homeroom classes that might not have subject schedule entries yet for this teacher
        $homeroomAssignments = \App\Models\TeacherClassAssignment::with(['schoolClass', 'teacher'])
            ->where('teacher_id', $teacher->id)
            ->get();

        foreach ($homeroomAssignments as $ha) {
            if ($ha->schoolClass && !$schedules->pluck('class_id')->contains($ha->class_id)) {
                $formatted->push([
                    'id' => 'hr_' . $ha->id,
                    'day' => 'N/A',
                    'start_time' => '07:15',
                    'end_time' => '11:00',
                    'session' => 'morning',
                    'subject' => [
                        'id' => 0,
                        'name' => 'គ្រូបន្ទុកថ្នាក់ (Homeroom)',
                        'code' => 'HR'
                    ],
                    'class' => [
                        'id' => $ha->schoolClass->id,
                        'name' => $ha->schoolClass->name,
                        'grade_level' => $ha->schoolClass->grade_level,
                        'is_homeroom' => true,
                        'homeroom_teacher_name' => $ha->teacher?->name ?? $teacher->name
                    ],
                    'teacher' => [
                        'id' => $teacher->id,
                        'name' => $teacher->name
                    ],
                    'room' => 'Classroom',
                    'academic_year' => $ha->academic_year ?? '2026-2027'
                ]);
            }
        }

        return response()->json([
            'teacher' => [
                'id' => $teacher->id,
                'name' => $teacher->name
            ],
            'schedule' => $formatted
        ]);
    }

    // Homeroom Class Schedule (Full timetable of assigned homeroom class with all subject teachers)
    public function homeroomSchedule(Request $request)
    {
        $teacher = $request->user();

        $homeroomClassIds = \App\Models\TeacherClassAssignment::where('teacher_id', $teacher->id)
            ->pluck('class_id')
            ->toArray();

        if (empty($homeroomClassIds) && $teacher->role_id != 1) {
            return response()->json([
                'teacher' => [
                    'id' => $teacher->id,
                    'name' => $teacher->name
                ],
                'schedule' => [],
                'is_homeroom' => false
            ]);
        }

        $query = Schedule::with([
            'subject',
            'schoolClass',
            'teacher',
            'secondaryTeacher'
        ]);

        if ($teacher->role_id != 1) {
            $query->whereIn('class_id', $homeroomClassIds);
        } else if ($request->class_id) {
            $query->where('class_id', $request->class_id);
        }

        $schedules = $query->get();

        $allClassIds = $schedules->pluck('class_id')->filter()->unique();
        $allHomeroomTeacherAssignments = \App\Models\TeacherClassAssignment::with('teacher')
            ->whereIn('class_id', $allClassIds)
            ->get()
            ->keyBy('class_id');

        $formatted = collect($schedules->map(function($item) use ($homeroomClassIds, $allHomeroomTeacherAssignments, $teacher) {
            $hrTeacherObj = $allHomeroomTeacherAssignments->get($item->class_id)?->teacher;
            return [
                'id' => $item->id,
                'day' => $item->day,
                'start_time' => $item->start_time,
                'end_time' => $item->end_time,
                'session' => $item->session,
                'subject' => [
                    'id' => $item->subject?->id,
                    'name' => $item->subject?->name,
                    'code' => $item->subject?->code
                ],
                'class' => [
                    'id' => $item->schoolClass?->id,
                    'name' => $item->schoolClass?->name,
                    'grade_level' => $item->schoolClass?->grade_level,
                    'is_homeroom' => true,
                    'homeroom_teacher_name' => $hrTeacherObj ? $hrTeacherObj->name : null
                ],
                'teacher' => $item->teacher ? [
                    'id' => $item->teacher->id,
                    'name' => $item->teacher->name
                ] : null,
                'secondary_teacher' => $item->secondaryTeacher ? [
                    'id' => $item->secondaryTeacher->id,
                    'name' => $item->secondaryTeacher->name
                ] : null,
                'room' => $item->room,
                'academic_year' => $item->academic_year
            ];
        }));

        return response()->json([
            'teacher' => [
                'id' => $teacher->id,
                'name' => $teacher->name
            ],
            'schedule' => $formatted,
            'is_homeroom' => true
        ]);
    }
}