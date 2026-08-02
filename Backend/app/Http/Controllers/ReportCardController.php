<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\StudentScore;


class ReportCardController extends Controller
{


    public function show($student_id)
    {


        // Get Student (by Student ID or User ID)
        $student = Student::with([
            'user',
            'schoolClass'
        ])
        ->where('id', $student_id)
        ->orWhere('user_id', $student_id)
        ->first();

        if (!$student) {
            return response()->json([
                'message' => 'Student record not found.',
                'student' => null,
                'subjects' => [],
                'average' => 0,
                'overall_grade' => 'N/A',
                'rank' => null,
                'total_students' => 0
            ], 404);
        }

        // Get Scores
        $scores = StudentScore::with([
            'subject',
            'assessment.semester.academicYear'
        ])
        ->where('student_id', $student->id)
        ->get();

        // Calculate Average
        $average = 0;
        if($scores->count() > 0)
        {
            $average = round(
                $scores->avg('percentage'),
                2
            );
        }

        // Calculate Grade
        $grade = $this->calculateGrade(
            $average
        );

        // Calculate Rank
        $rankData = $this->calculateRank(
            $student->id,
            $student->class_id
        );





        return response()->json([

            "student"=>[

                "id"=>$student->id,

                "name"=>$student->user?->name ?? 'Unknown Student',

                "student_code"=>$student->student_code ?? '',

                "class"=>[

                    "name"=>$student->schoolClass?->name ?? 'Unassigned',

                    "grade_level"=>$student->schoolClass?->grade_level ?? 'N/A'

                ]

            ],





            "academic_year" =>

                $scores->first()
                ?->assessment
                ?->semester
                ?->academicYear
                ?->name,






            "semester" =>

                $scores->first()
                ?->assessment
                ?->semester
                ?->name,







            "subjects"=>$scores->map(function($score){


                return [

                    "subject"=>$score->subject?->name ?? 'N/A',

                    "score"=>$score->score,

                    "max_score"=>$score->max_score,

                    "percentage"=>$score->percentage,

                    "grade"=>$score->grade

                ];


            }),







            "average"=>$average,


            "overall_grade"=>$grade,



            "rank"=>$rankData['rank'] ?? null,


            "total_students"=>$rankData['total_students'] ?? 0



        ]);

    }







    /*
    |--------------------------------------------------------------------------
    | Calculate Grade
    |--------------------------------------------------------------------------
    */


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









    /*
    |--------------------------------------------------------------------------
    | Calculate Rank
    |--------------------------------------------------------------------------
    */


    private function calculateRank($student_id, $class_id)
    {
        if (!$class_id) {
            return [
                "rank" => null,
                "total_students" => 0
            ];
        }

        // Get all students in same class

        $students = Student::where(
            'class_id',
            $class_id
        )
        ->get();




        $ranking = [];





        foreach($students as $student)
        {


            $scores = StudentScore::where(
                'student_id',
                $student->id
            )
            ->get();





            $average = 0;



            if($scores->count() > 0)
            {

                $average = $scores->avg(
                    'percentage'
                );

            }





            $ranking[]=[


                "student_id"=>$student->id,


                "average"=>$average


            ];



        }








        // Sort highest average first

        usort($ranking,function($a,$b){


            return $b['average'] <=> $a['average'];


        });







        // Find student rank

        $rank = 1;



        foreach($ranking as $item)
        {


            if($item['student_id'] == $student_id)
            {

                return [

                    "rank"=>$rank,

                    "total_students"=>count($ranking)

                ];

            }



            $rank++;


        }

        return [

            "rank"=>null, 

            "total_students"=>count($ranking)

        ];



    }



}