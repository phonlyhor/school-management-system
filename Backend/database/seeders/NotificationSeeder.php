<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\LeaveRequest;
use App\Models\User;
use App\Models\Notification;
use App\Models\TeacherClassAssignment;
use App\Models\TeacherSubjectAssignment;

class NotificationSeeder extends Seeder
{
    public function run(): void
    {
        // Truncate notifications table to clean up unassigned teacher notifications
        Notification::truncate();

        $requests = LeaveRequest::with(['student.user', 'student.schoolClass'])->get();
        $adminUsers = User::where('role_id', 1)->get();

        foreach ($requests as $lr) {
            $studentName = $lr->student?->user?->name ?? 'សិស្ស (Student)';
            $className = $lr->student?->schoolClass?->name ?? 'N/A';

            // 1. Notify Admins
            foreach ($adminUsers as $a) {
                Notification::create([
                    'user_id' => $a->id,
                    'title' => '📝 ពាក្យសុំច្បាប់ថ្មីពីសិស្ស (New Leave Request)',
                    'message' => "សិស្ស {$studentName} (ថ្នាក់ {$className}) បានផ្ញើពាក្យសុំច្បាប់ ពីថ្ងៃ {$lr->start_date} ដល់ {$lr->end_date} (មូលហេតុ: {$lr->reason})។",
                    'type' => 'leave_request',
                    'data' => [
                        'leave_request_id' => $lr->id,
                        'student_id' => $lr->student_id,
                        'student_name' => $studentName,
                        'class_name' => $className,
                    ],
                    'is_read' => false,
                ]);
            }

            // 2. Notify ONLY teachers assigned to this student's class
            if ($lr->student?->class_id) {
                $homeroomTeacherIds = TeacherClassAssignment::where('class_id', $lr->student->class_id)->pluck('teacher_id')->toArray();
                $subjectTeacherIds = TeacherSubjectAssignment::where('class_id', $lr->student->class_id)->pluck('teacher_id')->toArray();
                $assignedTeacherIds = array_unique(array_filter(array_map('intval', array_merge($homeroomTeacherIds, $subjectTeacherIds))));

                $classTeachers = User::whereIn('id', $assignedTeacherIds)->get();
                foreach ($classTeachers as $t) {
                    Notification::create([
                        'user_id' => $t->id,
                        'title' => '🔔 សិស្សក្នុងថ្នាក់សុំច្បាប់ (Student Leave Request)',
                        'message' => "សិស្ស {$studentName} (ថ្នាក់ {$className}) បានផ្ញើពាក្យសុំច្បាប់ ពីថ្ងៃ {$lr->start_date} ដល់ {$lr->end_date} (មូលហេតុ: {$lr->reason})។ សូមពិនិត្យមើល និង សម្រេច (Approve/Reject)។",
                        'type' => 'leave_request',
                        'data' => [
                            'leave_request_id' => $lr->id,
                            'student_id' => $lr->student_id,
                            'student_name' => $studentName,
                            'class_name' => $className,
                        ],
                        'is_read' => false,
                    ]);
                }
            }
        }
    }
}
