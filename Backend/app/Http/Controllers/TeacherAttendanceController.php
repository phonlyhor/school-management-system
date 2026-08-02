<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\SchoolClass;
use App\Models\Student;


class TeacherAttendanceController extends Controller
{

    public function students($class_id)
    {

        $class = SchoolClass::findOrFail($class_id);


        $students = Student::with('user')
            ->where(
                'class_id',
                $class_id
            )
            ->get();


        return response()->json([

            'class'=>[
                'id'=>$class->id,
                'name'=>$class->name,
                'grade_level'=>$class->grade_level
            ],


            'students'=>$students->map(function($student){

                return [

                    'id'=>$student->id,

                    'name'=>$student->user->name,

                    'student_code'=>$student->student_code

                ];

            })

        ]);

    }

}