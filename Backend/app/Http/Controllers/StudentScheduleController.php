<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Student;
use App\Models\Schedule;

class StudentScheduleController extends Controller
{

    public function index(Request $request)
    {

        // Current login user
        $user = $request->user();


        // Find student profile
        $student = Student::where(
            'user_id',
            $user->id
        )
        ->with('schoolClass')
        ->firstOrFail();



        // Get class schedule safely
        $schedules = $student->class_id ? Schedule::with([
            'subject',
            'teacher'
        ])
        ->where(
            'class_id',
            $student->class_id
        )
        ->get() : collect([]);

        return response()->json([
            'student' => [
                'id' => $student->id,
                'name' => $user->name,
                'student_code' => $student->student_code,
                'class' => $student->schoolClass ? [
                    'id' => $student->schoolClass->id,
                    'name' => $student->schoolClass->name,
                    'grade_level' => $student->schoolClass->grade_level
                ] : [
                    'id' => null,
                    'name' => 'Unassigned',
                    'grade_level' => 'N/A'
                ]
            ],
            'schedule' => $schedules->map(function($item){
                return [
                    'id' => $item->id,
                    'day' => $item->day,
                    'start_time' => $item->start_time,
                    'end_time' => $item->end_time,
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

}