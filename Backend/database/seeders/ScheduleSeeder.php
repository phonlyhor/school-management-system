<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Schedule;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\User;
use App\Models\TeacherSubjectAssignment;

class ScheduleSeeder extends Seeder
{
    public function run(): void
    {
        // Clear old schedules and assignments
        Schedule::truncate();
        TeacherSubjectAssignment::truncate();

        $classes = SchoolClass::all();
        $subjects = Subject::all();
        $teachers = User::where('role_id', 2)->get();

        if ($classes->isEmpty() || $subjects->isEmpty() || $teachers->isEmpty()) {
            return;
        }

        $days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

        // Realistic periods for Morning session
        $morningSlots = [
            ['start' => '07:15:00', 'end' => '08:30:00', 'session' => 'morning'],
            ['start' => '08:30:00', 'end' => '09:45:00', 'session' => 'morning'],
            ['start' => '09:45:00', 'end' => '11:00:00', 'session' => 'morning'],
        ];

        // Realistic periods for Afternoon session
        $afternoonSlots = [
            ['start' => '13:00:00', 'end' => '14:30:00', 'session' => 'afternoon'],
            ['start' => '14:30:00', 'end' => '16:00:00', 'session' => 'afternoon'],
        ];

        foreach ($classes as $classIndex => $class) {
            foreach ($days as $dayIndex => $day) {
                // Seed Morning subjects & teachers
                foreach ($morningSlots as $slotIndex => $slot) {
                    $subj = $subjects[($classIndex + $dayIndex + $slotIndex) % $subjects->count()];
                    $teacher = $teachers[($slotIndex + $dayIndex) % $teachers->count()];

                    Schedule::create([
                        'class_id' => $class->id,
                        'subject_id' => $subj->id,
                        'teacher_id' => $teacher->id,
                        'day' => $day,
                        'session' => $slot['session'],
                        'start_time' => $slot['start'],
                        'end_time' => $slot['end'],
                        'room' => "Room {$class->name}",
                        'academic_year' => $class->academic_year ?? '2026-2027'
                    ]);

                    TeacherSubjectAssignment::updateOrCreate([
                        'class_id' => $class->id,
                        'subject_id' => $subj->id,
                        'teacher_id' => $teacher->id,
                    ], [
                        'academic_year' => $class->academic_year ?? '2026-2027'
                    ]);
                }

                // Seed Afternoon subjects & teachers
                foreach ($afternoonSlots as $slotIndex => $slot) {
                    $subj = $subjects[($classIndex + $dayIndex + $slotIndex + 3) % $subjects->count()];
                    $teacher = $teachers[($slotIndex + $dayIndex + 2) % $teachers->count()];

                    Schedule::create([
                        'class_id' => $class->id,
                        'subject_id' => $subj->id,
                        'teacher_id' => $teacher->id,
                        'day' => $day,
                        'session' => $slot['session'],
                        'start_time' => $slot['start'],
                        'end_time' => $slot['end'],
                        'room' => "Room {$class->name}",
                        'academic_year' => $class->academic_year ?? '2026-2027'
                    ]);

                    TeacherSubjectAssignment::updateOrCreate([
                        'class_id' => $class->id,
                        'subject_id' => $subj->id,
                        'teacher_id' => $teacher->id,
                    ], [
                        'academic_year' => $class->academic_year ?? '2026-2027'
                    ]);
                }
            }
        }
    }
}
