<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    // View attendance list
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Attendance::with([
            'student.user',
            'teacher',
            'subject',
            'schoolClass'
        ]);

        if ($user && intval($user->role_id) !== 1) {
            $homeroomClassIds = \App\Models\TeacherClassAssignment::where('teacher_id', $user->id)
                ->pluck('class_id')
                ->toArray();

            $query->where(function ($q) use ($user, $homeroomClassIds) {
                $q->where('teacher_id', $user->id);
                if (!empty($homeroomClassIds)) {
                    $q->orWhereIn('class_id', $homeroomClassIds);
                }
            });
        }

        $attendances = $query->orderBy('date', 'desc')->get();

        return response()->json([
            'attendances' => $attendances
        ]);
    }


    // Create attendance
    // Create attendance
    public function store(Request $request)
    {
        $request->validate([
            'student_id' => 'required',
            'class_id' => 'required',
            'date' => 'required|date',
            'status' => 'required'
        ]);

        $user = auth()->user();
        $subjectId = $request->subject_id;

        $isHomeroomAttempt = (empty($subjectId) || $subjectId == '0' || $subjectId == 'homeroom');

        $isHomeroom = \App\Models\TeacherClassAssignment::where('teacher_id', $user->id)
            ->where('class_id', $request->class_id)
            ->exists();

        if ($isHomeroomAttempt) {
            if ($isHomeroom || $user->role_id == 1) {
                $hrSubject = \App\Models\Subject::firstOrCreate(
                    ['code' => 'HR-ATTENDANCE'],
                    ['name' => 'វត្តមានប្រចាំថ្ងៃ (Homeroom Daily Attendance)', 'description' => 'Homeroom Daily Attendance']
                );
                $subjectId = $hrSubject->id;
            } else {
                // If not homeroom teacher, find the subject this teacher teaches in this class
                $assignedSub = \App\Models\TeacherSubjectAssignment::where('teacher_id', $user->id)
                    ->where('class_id', $request->class_id)
                    ->first();

                if (!$assignedSub) {
                    $sched = \App\Models\Schedule::where('class_id', $request->class_id)
                        ->where(function($q) use ($user) {
                            $q->where('teacher_id', $user->id)
                              ->orWhere('secondary_teacher_id', $user->id);
                        })
                        ->first();
                    if ($sched) {
                        $subjectId = $sched->subject_id;
                    }
                } else {
                    $subjectId = $assignedSub->subject_id;
                }

                // If still empty, grab any valid subject for this class or fallback to first subject
                if (empty($subjectId)) {
                    $firstSub = \App\Models\Subject::first();
                    $subjectId = $firstSub ? $firstSub->id : 1;
                }
            }
        } else if (!is_numeric($subjectId)) {
            $subModel = \App\Models\Subject::where('code', $subjectId)->first();
            if ($subModel) {
                $subjectId = $subModel->id;
            } else {
                $firstSub = \App\Models\Subject::first();
                $subjectId = $firstSub ? $firstSub->id : 1;
            }
        }

        $attendance = Attendance::updateOrCreate(
            [
                'student_id' => $request->student_id,
                'subject_id' => $subjectId,
                'date' => $request->date,
            ],
            [
                'teacher_id' => $user->id,
                'class_id' => $request->class_id,
                'status' => $request->status,
                'note' => $request->note,
            ]
        );

        $this->notifyHomeroomTeacher($request->class_id, $request->student_id, $request->status, $subjectId, $user, $request->date);

        return response()->json([
            'message' => 'Attendance saved successfully',
            'attendance' => $attendance
        ]);
    }

    // View one attendance
    public function show(Attendance $attendance)
    {
        return response()->json([
            'attendance' => $attendance->load([
                'student',
                'teacher',
                'subject',
                'schoolClass'
            ])
        ]);
    }

    // Bulk store attendance
    public function bulkStore(Request $request)
    {
        $request->validate([
            'class_id' => 'required',
            'date' => 'required|date',
            'students' => 'required|array',
            'students.*.student_id' => 'required',
            'students.*.status' => 'required'
        ]);

        $teacher = $request->user();
        $subjectId = $request->subject_id;
        $isHomeroomAttempt = (empty($subjectId) || $subjectId == '0' || $subjectId == 'homeroom');

        $isHomeroom = \App\Models\TeacherClassAssignment::where('teacher_id', $teacher->id)
            ->where('class_id', $request->class_id)
            ->exists();

        if ($isHomeroomAttempt) {
            if ($isHomeroom) {
                $hrSubject = \App\Models\Subject::firstOrCreate(
                    ['code' => 'HR-ATTENDANCE'],
                    ['name' => 'វត្តមានប្រចាំថ្ងៃ (Homeroom Daily Attendance)', 'description' => 'Homeroom Daily Attendance']
                );
                $subjectId = $hrSubject->id;
            } else {
                // If not homeroom teacher, find the subject this teacher teaches in this class
                $assignedSub = \App\Models\TeacherSubjectAssignment::where('teacher_id', $teacher->id)
                    ->where('class_id', $request->class_id)
                    ->first();

                if (!$assignedSub) {
                    $sched = \App\Models\Schedule::where('class_id', $request->class_id)
                        ->where(function($q) use ($teacher) {
                            $q->where('teacher_id', $teacher->id)
                              ->orWhere('secondary_teacher_id', $teacher->id);
                        })
                        ->first();
                    if ($sched) {
                        $subjectId = $sched->subject_id;
                    }
                } else {
                    $subjectId = $assignedSub->subject_id;
                }

                if (empty($subjectId)) {
                    $firstSub = \App\Models\Subject::first();
                    $subjectId = $firstSub ? $firstSub->id : 1;
                }
            }
        } else if (!is_numeric($subjectId)) {
            $subModel = \App\Models\Subject::where('code', $subjectId)->first();
            if ($subModel) {
                $subjectId = $subModel->id;
            } else {
                $firstSub = \App\Models\Subject::first();
                $subjectId = $firstSub ? $firstSub->id : 1;
            }
        }

        foreach ($request->students as $student) {
            Attendance::updateOrCreate(
                [
                    'student_id' => $student['student_id'],
                    'subject_id' => $subjectId,
                    'date' => $request->date
                ],
                [
                    'teacher_id' => $teacher->id,
                    'class_id' => $request->class_id,
                    'status' => $student['status'],
                    'note' => $student['note'] ?? null
                ]
            );

            $this->notifyHomeroomTeacher($request->class_id, $student['student_id'], $student['status'], $subjectId, $teacher, $request->date);
        }

        return response()->json([
            'message' => 'Attendance saved successfully'
        ]);
    }

    private function notifyHomeroomTeacher($classId, $studentId, $status, $subjectId, $teacher, $date)
    {
        if (!in_array($status, ['absent', 'late', 'permission'])) {
            return;
        }

        $homeroomAssignments = \App\Models\TeacherClassAssignment::where('class_id', $classId)->get();
        if ($homeroomAssignments->isEmpty()) return;

        $className = \App\Models\SchoolClass::find($classId)?->name ?? 'ថ្នាក់រៀន';
        $subjectObj = \App\Models\Subject::find($subjectId);
        $subjectName = $subjectObj?->name ?? 'មុខវិជ្ជា';
        $studentUser = \App\Models\Student::with('user')->find($studentId)?->user;
        $stName = $studentUser?->name ?? 'សិស្ស';

        $statusKh = [
            'absent' => 'អវត្តមាន (Absent)',
            'late' => 'មកយឺត (Late)',
            'permission' => 'សុំច្បាប់ (Permission)'
        ][$status] ?? $status;

        foreach ($homeroomAssignments as $ha) {
            if ($ha->teacher_id != $teacher->id) {
                \App\Models\Notification::create([
                    'user_id' => $ha->teacher_id,
                    'title' => "⚠️ របាយការណ៍វត្តមានថ្នាក់បន្ទុក ({$className})",
                    'message' => "លោកគ្រូ/អ្នកគ្រូ {$teacher->name} បានស្រង់វត្តមានសិស្ស «{$stName}» ជា «{$statusKh}» ក្នុងមុខវិជ្ជា «{$subjectName}» ថ្ងៃនេះ ({$date})។",
                    'type' => 'attendance_alert',
                    'data' => [
                        'class_id' => $classId,
                        'student_id' => $studentId,
                        'teacher_id' => $teacher->id,
                        'status' => $status,
                        'date' => $date
                    ]
                ]);
            }
        }
    }
//history of attendance
public function history(Request $request)
{
    $teacher = $request->user();
    $isAdmin = strtolower($teacher->role?->name ?? '') === 'admin';

    $query = Attendance::with([
        'student.user',
        'subject',
        'schoolClass'
    ]);

    $hrSubject = \App\Models\Subject::where('code', 'HR-ATTENDANCE')->first();
    $hrSubjectId = $hrSubject ? $hrSubject->id : null;

    if (!$isAdmin) {
        // Get classes where this teacher is assigned specifically as HOMEROOM TEACHER (គ្រូបន្ទុកថ្នាក់)
        $homeroomClassIds = \App\Models\TeacherClassAssignment::where('teacher_id', $teacher->id)->pluck('class_id')->toArray();

        // If the teacher is not a homeroom teacher for any class, deny viewing attendance history
        if (empty($homeroomClassIds)) {
            return response()->json([
                'message' => 'លោកគ្រូ/អ្នកគ្រូមុខវិជ្ជាគ្មានសិទ្ធិមើលរបាយការណ៍ប្រវត្តិវត្តមានឡើយ! (សម្រាប់តែគ្រូបន្ទុកថ្នាក់/Admin)',
                'attendance' => [],
                'is_homeroom' => false
            ]);
        }

        if ($request->class_id) {
            $classIdInt = (int)$request->class_id;

            // Check if teacher is the homeroom teacher for the requested class
            if (!in_array($classIdInt, array_map('intval', $homeroomClassIds))) {
                return response()->json([
                    'message' => 'លោកគ្រូ/អ្នកគ្រូ មិនមែនជាគ្រូបន្ទុកថ្នាក់សម្រាប់ថ្នាក់នេះទេ មិនអាចមើលរបាយការណ៍បានឡើយ!',
                    'attendance' => [],
                    'is_homeroom' => false
                ]);
            }

            $query->where('class_id', $request->class_id);
        } else {
            // No specific class selected: limit to their assigned homeroom classes only
            $query->whereIn('class_id', $homeroomClassIds);
        }
    } else {
        // Admin can view any class
        if ($request->class_id) {
            $query->where('class_id', $request->class_id);
        }
    }

    // Filter subject
    if ($request->subject_id) {
        $query->where('subject_id', $request->subject_id);
    }

    // Filter date
    if ($request->date) {
        $query->whereDate('date', $request->date);
    }



    $attendances = $query->get();



    return response()->json([

        'attendance'=>$attendances->map(function($item){

            return [

                'id'=>$item->id,

                'student'=>[
                    'id'=>$item->student->id,
                    'name'=>$item->student->user->name,
                    'student_code'=>$item->student->student_code
                ],


                'class'=>[
                    'id'=>$item->schoolClass->id,
                    'name'=>$item->schoolClass->name
                ],


                'subject'=>[
                    'id'=>$item->subject->id,
                    'name'=>$item->subject->name
                ],


                'date'=>$item->date,

                'status'=>$item->status,

                'note'=>$item->note

            ];

        })

    ]);

}
// Update attendance
public function update(Request $request, $id)
{

    $request->validate([

        'status'=>'required|in:present,absent,late',
        'note'=>'nullable|string'

    ]);


    $teacher = $request->user();


    $attendance = Attendance::where(
        'id',
        $id
    )
    ->where(
        'teacher_id',
        $teacher->id
    )
    ->first();



    if(!$attendance){

        return response()->json([
            'message'=>'Attendance not found'
        ],404);

    }



    $attendance->update([

        'status'=>$request->status,

        'note'=>$request->note

    ]);



    return response()->json([

        'message'=>'Attendance updated successfully',

        'attendance'=>$attendance

    ]);

}

}