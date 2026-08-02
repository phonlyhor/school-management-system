<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Student;
use App\Models\Attendance;

class AttendanceReportController extends Controller
{
    //student attendance report
   public function studentReport(Request $request, $student_id)
{

    $student = Student::with('user')
        ->findOrFail($student_id);


    $query = Attendance::where(
        'student_id',
        $student_id
    );


    // Filter Month
    if($request->month){

        $query->whereMonth(
            'date',
            $request->month
        );

    }


    // Filter Year
    if($request->year){

        $query->whereYear(
            'date',
            $request->year
        );

    }


    $attendances = $query->get();



    $total = $attendances->count();


    $present = $attendances
        ->where('status','present')
        ->count();


    $absent = $attendances
        ->where('status','absent')
        ->count();


    $late = $attendances
        ->where('status','late')
        ->count();



    $percentage = 0;


    if($total > 0){

        $percentage = round(
            ($present / $total) * 100,
            2
        );

    }



    return response()->json([

        'student'=>[
            'id'=>$student->id,
            'name'=>$student->user->name,
            'student_code'=>$student->student_code
        ],


        'filter'=>[
            'month'=>$request->month,
            'year'=>$request->year
        ],


        'attendance'=>[
            'total'=>$total,
            'present'=>$present,
            'absent'=>$absent,
            'late'=>$late,
            'percentage'=>$percentage.'%'
        ]

    ]);

}
// Student attendance report by subject
public function subjectReport($student_id)
{
    $student = Student::with('user')
        ->findOrFail($student_id);


    $attendances = Attendance::with('subject')
        ->where('student_id', $student_id)
        ->get();


    $reports = [];


    $groups = $attendances->groupBy('subject_id');


    foreach($groups as $subject_id => $items)
    {

        $subject = $items->first()->subject;


        $total = $items->count();


        $present = $items
            ->where('status','present')
            ->count();


        $absent = $items
            ->where('status','absent')
            ->count();


        $late = $items
            ->where('status','late')
            ->count();



        $percentage = 0;


        if($total > 0){

            $percentage = round(
                ($present / $total) * 100,
                2
            );

        }



        $reports[] = [

            'subject'=>[
                'id'=>$subject->id,
                'name'=>$subject->name,
                'code'=>$subject->code
            ],


            'attendance'=>[
                'total'=>$total,
                'present'=>$present,
                'absent'=>$absent,
                'late'=>$late,
                'percentage'=>$percentage.'%'
            ]

        ];

    }



    return response()->json([

        'student'=>[
            'id'=>$student->id,
            'name'=>$student->user->name,
            'student_code'=>$student->student_code
        ],


        'subjects'=>$reports

    ]);
}

    // Class & Homeroom Attendance Summary Report
    public function classReport(Request $request, $class_id)
    {
        $schoolClass = \App\Models\SchoolClass::with([
            'students.user',
            'students.studentParent.user'
        ])->findOrFail($class_id);

        $homeroomAssignment = \App\Models\TeacherClassAssignment::with('teacher')
            ->where('class_id', $class_id)
            ->first();

        $homeroomTeacher = $homeroomAssignment ? [
            'id' => $homeroomAssignment->teacher?->id,
            'name' => $homeroomAssignment->teacher?->name,
            'email' => $homeroomAssignment->teacher?->email,
        ] : null;

        $query = Attendance::where('class_id', $class_id);

        if ($request->month) {
            $query->whereMonth('date', $request->month);
        }
        if ($request->year) {
            $query->whereYear('date', $request->year);
        }

        $attendances = $query->get();

        $studentReports = [];
        foreach ($schoolClass->students as $st) {
            $stAtt = $attendances->where('student_id', $st->id);
            $total = $stAtt->count();
            $present = $stAtt->where('status', 'present')->count();
            $absent = $stAtt->where('status', 'absent')->count();
            $late = $stAtt->where('status', 'late')->count();
            $permission = $stAtt->where('status', 'permission')->count();

            $rate = $total > 0 ? round(($present / $total) * 100, 1) : 100;

            $studentReports[] = [
                'id' => $st->id,
                'student_code' => $st->student_code,
                'name' => $st->user?->name ?? 'N/A',
                'gender' => $st->gender,
                'class_position' => $st->class_position ?? 'Member',
                'parent_name' => $st->studentParent?->user?->name ?? $st->father_name ?? $st->mother_name ?? 'N/A',
                'parent_phone' => $st->studentParent?->phone ?? $st->phone ?? 'N/A',
                'attendance' => [
                    'total' => $total,
                    'present' => $present,
                    'absent' => $absent,
                    'late' => $late,
                    'permission' => $permission,
                    'rate' => $rate . '%',
                    'raw_rate' => $rate,
                    'status_warning' => $rate < 85 && $total > 0
                ]
            ];
        }

        $totalClassRecord = $attendances->count();
        $totalPresent = $attendances->where('status', 'present')->count();
        $totalAbsent = $attendances->where('status', 'absent')->count();
        $totalLate = $attendances->where('status', 'late')->count();
        $totalPermission = $attendances->where('status', 'permission')->count();
        $overallRate = $totalClassRecord > 0 ? round(($totalPresent / $totalClassRecord) * 100, 1) : 100;

        return response()->json([
            'class' => [
                'id' => $schoolClass->id,
                'name' => $schoolClass->name,
                'grade_level' => $schoolClass->grade_level,
                'homeroom_teacher' => $homeroomTeacher
            ],
            'summary' => [
                'total_students' => $schoolClass->students->count(),
                'total_records' => $totalClassRecord,
                'present' => $totalPresent,
                'absent' => $totalAbsent,
                'late' => $totalLate,
                'permission' => $totalPermission,
                'overall_rate' => $overallRate . '%'
            ],
            'students' => $studentReports
        ]);
    }

}