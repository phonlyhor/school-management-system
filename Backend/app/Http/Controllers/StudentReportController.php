<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\StudentScore;
use App\Models\TeacherSubjectAssignment;
use Illuminate\Http\Request;


class StudentReportController extends Controller
{

    public function show(Request $request, $student_id)
    {

        $user = $request->user();



        /*
        |--------------------------------------------------------------------------
        | Permission Check
        |--------------------------------------------------------------------------
        */


        // ADMIN
        // role_id = 1
        // Can view all reports

        if($user->role_id == 1)
        {

        }



        // TEACHER
        // role_id = 2
        // Can view students in assigned class

        elseif($user->role_id == 2)
        {

            $student = Student::find($student_id);


            if(!$student)
            {
                return response()->json([
                    'message'=>'Student not found'
                ],404);
            }



            $hasClass = TeacherSubjectAssignment::where(
                'teacher_id',
                $user->id
            )
            ->where(
                'class_id',
                $student->class_id
            )
            ->exists();



            if(!$hasClass)
            {
                return response()->json([
                    'message'=>'You cannot view this student report'
                ],403);
            }

        }




        // STUDENT
        // role_id = 3
        // Only view own report

        elseif($user->role_id == 3)
        {

            $student = Student::where(
                'user_id',
                $user->id
            )->first();



            if(!$student || $student->id != $student_id)
            {
                return response()->json([
                    'message'=>'You cannot view this report'
                ],403);
            }

        }





        // PARENT
        // role_id = 4
        // View child report

        elseif($user->role_id == 4)
        {

            $student = Student::where(
                'parent_id',
                $user->id
            )->first();



            if(!$student || $student->id != $student_id)
            {
                return response()->json([
                    'message'=>'You cannot view this report'
                ],403);
            }

        }




        /*
        |--------------------------------------------------------------------------
        | Get Student Report
        |--------------------------------------------------------------------------
        */


        $student = Student::with([
            'user',
            'schoolClass'
        ])
        ->findOrFail($student_id);




        $scores = StudentScore::with([
            'subject',
            'assessment'
        ])
        ->where(
            'student_id',
            $student_id
        )
        ->get();





        $average = 0;


        if($scores->count() > 0)
        {

            $average = round(
                $scores->avg('percentage'),
                2
            );

        }





        return response()->json([


            'student'=>[

                'id'=>$student->id,

                'name'=>$student->user->name,

                'student_code'=>$student->student_code,


                'class'=>[

                    'id'=>$student->schoolClass->id,

                    'name'=>$student->schoolClass->name,

                    'grade_level'=>$student->schoolClass->grade_level

                ]

            ],




            'scores'=>$scores->map(function($score){

                return [

                    'subject'=>$score->subject->name,

                    'assessment'=>$score->assessment->name,

                    'score'=>$score->score,

                    'max_score'=>$score->max_score,

                    'percentage'=>$score->percentage,

                    'grade'=>$score->grade

                ];

            }),




            'average'=>$average,

            'overall_grade'=>$this->calculateGrade($average)



        ]);

    }







    private function calculateGrade($percentage)
    {

        if($percentage >= 90)
        {
            return "A";
        }


        if($percentage >= 80)
        {
            return "B";
        }


        if($percentage >= 70)
        {
            return "C";
        }


        if($percentage >= 60)
        {
            return "D";
        }


        return "F";

    }


}