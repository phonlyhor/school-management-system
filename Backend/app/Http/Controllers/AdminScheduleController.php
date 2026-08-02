<?php

namespace App\Http\Controllers;

use App\Models\Schedule;
use App\Models\TeacherSubjectAssignment;
use Illuminate\Http\Request;

class AdminScheduleController extends Controller
{
    // View all schedules
    public function index()
    {
        $schedules = Schedule::with([
            'teacher',
            'secondaryTeacher',
            'subject',
            'schoolClass'
        ])->get()->map(function ($item) {
            $itemArray = $item->toArray();
            if (empty($itemArray['session'])) {
                $startHour = intval(explode(':', $item->start_time ?? '07:00')[0]);
                $itemArray['session'] = $startHour < 12 ? 'morning' : 'afternoon';
            }
            return $itemArray;
        });

        return response()->json([
            'schedules' => $schedules
        ]);
    }

    // Create/update batch weekly schedule for a class in one step
    public function batchStore(Request $request)
    {
        $request->validate([
            'class_id' => 'required',
            'schedules' => 'required|array',
        ]);

        $classId = $request->class_id;
        $academicYear = $request->academic_year ?? '2026-2027';

        // 1. Validate for teacher time overlap conflicts across other classes
        foreach ($request->schedules as $item) {
            if (!empty($item['subject_id']) && !empty($item['teacher_id'])) {
                $startTime = $item['start_time'];
                $endTime = $item['end_time'] ?? '08:30';
                $day = $item['day'];
                $teacherId = $item['teacher_id'];

                $teacherConflict = Schedule::where('class_id', '!=', $classId)
                    ->where(function ($q) use ($teacherId) {
                        $q->where('teacher_id', $teacherId)
                          ->orWhere('secondary_teacher_id', $teacherId);
                    })
                    ->where('day', $day)
                    ->where('start_time', '<', $endTime)
                    ->where('end_time', '>', $startTime)
                    ->first();

                if ($teacherConflict) {
                    $teacher = \App\Models\User::find($teacherId);
                    $teacherName = $teacher?->name ?? 'គ្រូបង្រៀន';
                    $conflictClass = $teacherConflict->schoolClass?->name ?? 'ថ្នាក់ផ្សេង';
                    $dayKh = [
                        'Monday' => 'ច័ន្ទ', 'Tuesday' => 'អង្គារ', 'Wednesday' => 'ពុធ',
                        'Thursday' => 'ព្រហស្បតិ៍', 'Friday' => 'សុក្រ', 'Saturday' => 'សៅរ៍'
                    ][$day] ?? $day;

                    return response()->json([
                        'message' => "⚠️ ស្ទួនម៉ោងបង្រៀន (Teacher Conflict): លោកគ្រូ/អ្នកគ្រូ {$teacherName} មានម៉ោងបង្រៀនស្ទួនគ្នានៅថ្ងៃ{$dayKh} ជាមួយថ្នាក់ {$conflictClass} (ម៉ោង: {$teacherConflict->start_time} - {$teacherConflict->end_time})!"
                    ], 422);
                }
            }
        }

        // Delete existing schedules for this class to overwrite cleanly
        Schedule::where('class_id', $classId)->delete();

        foreach ($request->schedules as $item) {
            if (!empty($item['subject_id']) && !empty($item['teacher_id'])) {
                $startHour = intval(explode(':', $item['start_time'] ?? '07:15')[0]);
                $session = $item['session'] ?? ($startHour < 12 ? 'morning' : 'afternoon');

                Schedule::create([
                    'class_id' => $classId,
                    'subject_id' => $item['subject_id'],
                    'teacher_id' => $item['teacher_id'],
                    'secondary_teacher_id' => !empty($item['secondary_teacher_id']) ? $item['secondary_teacher_id'] : null,
                    'day' => $item['day'],
                    'session' => $session,
                    'start_time' => $item['start_time'],
                    'end_time' => $item['end_time'] ?? '08:30',
                    'room' => !empty($item['room']) ? $item['room'] : "Room",
                    'academic_year' => $academicYear
                ]);

                TeacherSubjectAssignment::updateOrCreate([
                    'class_id' => $classId,
                    'subject_id' => $item['subject_id'],
                    'teacher_id' => $item['teacher_id'],
                ], [
                    'academic_year' => $academicYear
                ]);
            }
        }

        // Notify all assigned teachers in this batch
        try {
            $schoolClass = \App\Models\SchoolClass::find($classId);
            $className = $schoolClass ? $schoolClass->name : 'N/A';

            $teacherIds = [];
            foreach ($request->schedules as $item) {
                if (!empty($item['teacher_id'])) $teacherIds[] = $item['teacher_id'];
                if (!empty($item['secondary_teacher_id'])) $teacherIds[] = $item['secondary_teacher_id'];
            }
            $teacherIds = array_unique(array_filter($teacherIds));

            foreach ($teacherIds as $tid) {
                \App\Models\Notification::create([
                    'user_id' => $tid,
                    'title' => '🗓️ កាលវិភាគបង្រៀនប្រចាំសប្តាហ៍ត្រូវបានធ្វើបច្ចុប្បន្នភាព (Timetable Updated)',
                    'message' => "កាលវិភាគបង្រៀនប្រចាំសប្តាហ៍សម្រាប់ថ្នាក់ {$className} ត្រូវបានរៀបចំ និងធ្វើបច្ចុប្បន្នភាពរួចរាល់។ សូមពិនិត្យមើលកាលវិភាគរបស់អ្នក។",
                    'type' => 'schedule_assignment',
                    'data' => [
                        'class_id' => $classId,
                        'class_name' => $className,
                        'academic_year' => $academicYear,
                    ],
                ]);
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('Batch schedule notification failed: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Class weekly timetable saved successfully in one step!'
        ]);
    }

    // Create schedule & sync BOTH primary and secondary teacher assignments
    public function store(Request $request)
    {
        $request->validate([
            'teacher_id' => 'required',
            'class_id' => 'required',
            'subject_id' => 'required',
            'day' => 'required',
            'start_time' => 'required',
            'end_time' => 'required',
            'academic_year' => 'required'
        ]);

        if ($request->end_time <= $request->start_time) {
            return response()->json([
                'message' => 'ម៉ោងបញ្ចប់ (End Time) ត្រូវតែធំជាង ម៉ោងចាប់ផ្ដើម (Start Time)!'
            ], 422);
        }

        $session = $request->session;
        if (empty($session)) {
            $startHour = intval(explode(':', $request->start_time)[0]);
            $session = $startHour < 12 ? 'morning' : 'afternoon';
        }

        // 1. Check if Primary Teacher has time overlap conflict on the same day
        $teacherConflict = Schedule::where(function ($q) use ($request) {
                $q->where('teacher_id', $request->teacher_id)
                  ->orWhere('secondary_teacher_id', $request->teacher_id);
            })
            ->where('day', $request->day)
            ->where('start_time', '<', $request->end_time)
            ->where('end_time', '>', $request->start_time)
            ->first();

        if ($teacherConflict) {
            $conflictClass = $teacherConflict->schoolClass?->name ?? 'ថ្នាក់ផ្សេង';
            return response()->json([
                'message' => "លោកគ្រូ/អ្នកគ្រូដើមរូបនេះ មានម៉ោងបង្រៀនស្ទួនគ្នានៅថ្ងៃ {$request->day} ជាមួយថ្នាក់ {$conflictClass} (ម៉ោង: {$teacherConflict->start_time} - {$teacherConflict->end_time})។"
            ], 422);
        }

        // Check Secondary Teacher conflict if provided
        if ($request->filled('secondary_teacher_id')) {
            $secConflict = Schedule::where(function ($q) use ($request) {
                    $q->where('teacher_id', $request->secondary_teacher_id)
                      ->orWhere('secondary_teacher_id', $request->secondary_teacher_id);
                })
                ->where('day', $request->day)
                ->where('start_time', '<', $request->end_time)
                ->where('end_time', '>', $request->start_time)
                ->first();

            if ($secConflict) {
                $conflictClass = $secConflict->schoolClass?->name ?? 'ថ្នាក់ផ្សេង';
                return response()->json([
                    'message' => "គ្រូជំនួយ/គ្រូទី២ រូបនេះ មានម៉ោងបង្រៀនស្ទួនគ្នានៅថ្ងៃ {$request->day} ជាមួយថ្នាក់ {$conflictClass} (ម៉ោង: {$secConflict->start_time} - {$secConflict->end_time})។"
                ], 422);
            }
        }

        // 2. Check if Class has time overlap conflict on the same day
        $classConflict = Schedule::where('class_id', $request->class_id)
            ->where('day', $request->day)
            ->where('start_time', '<', $request->end_time)
            ->where('end_time', '>', $request->start_time)
            ->first();

        if ($classConflict) {
            $conflictSubject = $classConflict->subject?->name ?? 'មុខវិជ្ជាផ្សេង';
            return response()->json([
                'message' => "ថ្នាក់រៀននេះ មានម៉ោងសិក្សាស្ទួនគ្នានៅថ្ងៃ {$request->day} ជាមួយមុខវិជ្ជា {$conflictSubject} (ម៉ោង: {$classConflict->start_time} - {$classConflict->end_time})។"
            ], 422);
        }

        $schedule = Schedule::create([
            'teacher_id' => $request->teacher_id,
            'secondary_teacher_id' => $request->secondary_teacher_id ?: null,
            'class_id' => $request->class_id,
            'subject_id' => $request->subject_id,
            'day' => $request->day,
            'session' => $session,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'room' => $request->room,
            'academic_year' => $request->academic_year
        ]);

        // Auto sync Primary Teacher with TeacherSubjectAssignment
        TeacherSubjectAssignment::updateOrCreate([
            'class_id' => $request->class_id,
            'subject_id' => $request->subject_id,
            'teacher_id' => $request->teacher_id,
        ], [
            'academic_year' => $request->academic_year,
        ]);

        // Auto sync Secondary Teacher with TeacherSubjectAssignment if provided
        if ($request->filled('secondary_teacher_id')) {
            TeacherSubjectAssignment::updateOrCreate([
                'class_id' => $request->class_id,
                'subject_id' => $request->subject_id,
                'teacher_id' => $request->secondary_teacher_id,
            ], [
                'academic_year' => $request->academic_year,
            ]);
        }

        // Notify assigned teachers for single schedule creation
        try {
            $subject = \App\Models\Subject::find($request->subject_id);
            $schoolClass = \App\Models\SchoolClass::find($request->class_id);
            $subjectName = $subject ? $subject->name : 'N/A';
            $className = $schoolClass ? $schoolClass->name : 'N/A';
            $dayKh = [
                'Monday' => 'ច័ន្ទ', 'Tuesday' => 'អង្គារ', 'Wednesday' => 'ពុធ',
                'Thursday' => 'ព្រហស្បតិ៍', 'Friday' => 'សុក្រ', 'Saturday' => 'សៅរ៍'
            ][$request->day] ?? $request->day;

            $teachersToNotify = array_unique(array_filter([$request->teacher_id, $request->secondary_teacher_id]));
            foreach ($teachersToNotify as $tid) {
                \App\Models\Notification::create([
                    'user_id' => $tid,
                    'title' => '🗓️ កាលវិភាគបង្រៀនថ្មី (New Schedule Assignment)',
                    'message' => "អ្នកទទួលបានកាលវិភាគបង្រៀនថ្មីនៅថ្នាក់ {$className} មុខវិជ្ជា {$subjectName} (ថ្ងៃ{$dayKh} ម៉ោង {$request->start_time} - {$request->end_time})។",
                    'type' => 'schedule_assignment',
                    'data' => [
                        'class_id' => $request->class_id,
                        'subject_id' => $request->subject_id,
                        'day' => $request->day,
                        'start_time' => $request->start_time,
                        'end_time' => $request->end_time,
                    ],
                ]);
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('Single schedule notification failed: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Schedule created & both teachers assigned successfully',
            'schedule' => $schedule->load(['teacher', 'secondaryTeacher', 'subject', 'schoolClass'])
        ], 201);
    }

    // Show one schedule
    public function show(Schedule $schedule)
    {
        return response()->json([
            'schedule' => $schedule->load([
                'teacher',
                'secondaryTeacher',
                'subject',
                'schoolClass'
            ])
        ]);
    }

    // Update schedule & sync BOTH primary and secondary teacher assignments
    public function update(Request $request, Schedule $schedule)
    {
        $targetTeacherId = $request->filled('teacher_id') ? $request->teacher_id : $schedule->teacher_id;
        $targetSecTeacherId = $request->has('secondary_teacher_id') ? ($request->secondary_teacher_id ?: null) : $schedule->secondary_teacher_id;
        $targetClassId = $request->filled('class_id') ? $request->class_id : $schedule->class_id;
        $targetDay = $request->filled('day') ? $request->day : $schedule->day;
        $targetStart = $request->filled('start_time') ? $request->start_time : $schedule->start_time;
        $targetEnd = $request->filled('end_time') ? $request->end_time : $schedule->end_time;
        $targetSubjectId = $request->filled('subject_id') ? $request->subject_id : $schedule->subject_id;
        $targetAcademicYear = $request->filled('academic_year') ? $request->academic_year : $schedule->academic_year;

        if ($targetEnd <= $targetStart) {
            return response()->json([
                'message' => 'ម៉ោងបញ្ចប់ (End Time) ត្រូវតែធំជាង ម៉ោងចាប់ផ្ដើម (Start Time)!'
            ], 422);
        }

        $session = $request->session;
        if (empty($session)) {
            $startHour = intval(explode(':', $targetStart)[0]);
            $session = $startHour < 12 ? 'morning' : 'afternoon';
        }

        // Check teacher conflict excluding current record
        $teacherConflict = Schedule::where('id', '!=', $schedule->id)
            ->where(function ($q) use ($targetTeacherId) {
                $q->where('teacher_id', $targetTeacherId)
                  ->orWhere('secondary_teacher_id', $targetTeacherId);
            })
            ->where('day', $targetDay)
            ->where('start_time', '<', $targetEnd)
            ->where('end_time', '>', $targetStart)
            ->first();

        if ($teacherConflict) {
            $conflictClass = $teacherConflict->schoolClass?->name ?? 'ថ្នាក់ផ្សេង';
            return response()->json([
                'message' => "លោកគ្រូ/អ្នកគ្រូរូបនេះ មានម៉ោងបង្រៀនស្ទួនគ្នានៅថ្ងៃ {$targetDay} ជាមួយថ្នាក់ {$conflictClass} (ម៉ោង: {$teacherConflict->start_time} - {$teacherConflict->end_time})។"
            ], 422);
        }

        // Check class conflict excluding current record
        $classConflict = Schedule::where('class_id', $targetClassId)
            ->where('id', '!=', $schedule->id)
            ->where('day', $targetDay)
            ->where('start_time', '<', $targetEnd)
            ->where('end_time', '>', $targetStart)
            ->first();

        if ($classConflict) {
            $conflictSubject = $classConflict->subject?->name ?? 'មុខវិជ្ជាផ្សេង';
            return response()->json([
                'message' => "ថ្នាក់រៀននេះ មានម៉ោងសិក្សាស្ទួនគ្នានៅថ្ងៃ {$targetDay} ជាមួយមុខវិជ្ជា {$conflictSubject} (ម៉ោង: {$classConflict->start_time} - {$classConflict->end_time})។"
            ], 422);
        }

        $schedule->update([
            'teacher_id' => $targetTeacherId,
            'secondary_teacher_id' => $targetSecTeacherId,
            'class_id' => $targetClassId,
            'subject_id' => $targetSubjectId,
            'day' => $targetDay,
            'session' => $session,
            'start_time' => $targetStart,
            'end_time' => $targetEnd,
            'room' => $request->filled('room') ? $request->room : $schedule->room,
            'academic_year' => $targetAcademicYear
        ]);

        // Auto sync Primary Teacher with TeacherSubjectAssignment
        TeacherSubjectAssignment::updateOrCreate([
            'class_id' => $targetClassId,
            'subject_id' => $targetSubjectId,
            'teacher_id' => $targetTeacherId,
        ], [
            'academic_year' => $targetAcademicYear,
        ]);

        // Auto sync Secondary Teacher with TeacherSubjectAssignment if provided
        if (!empty($targetSecTeacherId)) {
            TeacherSubjectAssignment::updateOrCreate([
                'class_id' => $targetClassId,
                'subject_id' => $targetSubjectId,
                'teacher_id' => $targetSecTeacherId,
            ], [
                'academic_year' => $targetAcademicYear,
            ]);
        }

        // Notify assigned teachers for schedule update
        try {
            $subject = \App\Models\Subject::find($targetSubjectId);
            $schoolClass = \App\Models\SchoolClass::find($targetClassId);
            $subjectName = $subject ? $subject->name : 'N/A';
            $className = $schoolClass ? $schoolClass->name : 'N/A';
            $dayKh = [
                'Monday' => 'ច័ន្ទ', 'Tuesday' => 'អង្គារ', 'Wednesday' => 'ពុធ',
                'Thursday' => 'ព្រហស្បតិ៍', 'Friday' => 'សុក្រ', 'Saturday' => 'សៅរ៍'
            ][$targetDay] ?? $targetDay;

            $teachersToNotify = array_unique(array_filter([$targetTeacherId, $targetSecTeacherId]));
            foreach ($teachersToNotify as $tid) {
                \App\Models\Notification::create([
                    'user_id' => $tid,
                    'title' => '🗓️ កាលវិភាគបង្រៀនត្រូវបានធ្វើបច្ចុប្បន្នភាព (Schedule Updated)',
                    'message' => "កាលវិភាគបង្រៀនរបស់អ្នកនៅថ្នាក់ {$className} មុខវិជ្ជា {$subjectName} (ថ្ងៃ{$dayKh} ម៉ោង {$targetStart} - {$targetEnd}) ត្រូវបានធ្វើបច្ចុប្បន្នភាព។",
                    'type' => 'schedule_assignment',
                    'data' => [
                        'class_id' => $targetClassId,
                        'subject_id' => $targetSubjectId,
                        'day' => $targetDay,
                        'start_time' => $targetStart,
                        'end_time' => $targetEnd,
                    ],
                ]);
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('Schedule update notification failed: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Schedule updated & both teachers assigned successfully',
            'schedule' => $schedule->load(['teacher', 'secondaryTeacher', 'subject', 'schoolClass'])
        ]);
    }

    // Delete schedule
    public function destroy(Schedule $schedule)
    {
        $schedule->delete();

        return response()->json([
            'message' => 'Schedule deleted successfully'
        ]);
    }
}