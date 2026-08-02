<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Subject;
use App\Models\StudentScore;
class StudentScoreController extends Controller
{
    public function store(Request $request)
{

    $data = $request->validate([

        'student_id'=>'required|exists:students,id',

        'subject_id'=>'required|exists:subjects,id',

        'assessment_id'=>'required|exists:assessments,id',

        'score'=>'required|numeric|min:0'

    ]);



    // Get Subject Max Score

    $subject = Subject::find(
        $data['subject_id']
    );


    $maxScore = $subject->max_score;



    // Calculate Percentage

    $percentage =
        ($data['score'] / $maxScore) * 100;



    // Calculate Grade

    $grade = $this->calculateGrade(
        $percentage
    );



    $studentScore = StudentScore::create([

        'student_id'=>$data['student_id'],

        'subject_id'=>$data['subject_id'],

        'assessment_id'=>$data['assessment_id'],

        'score'=>$data['score'],

        'max_score'=>$maxScore,

        'percentage'=>$percentage,

        'grade'=>$grade

    ]);



    return response()->json([

        'message'=>'Score saved successfully',

        'score'=>$studentScore

    ],201);

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
