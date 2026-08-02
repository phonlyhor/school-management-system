<?php

namespace App\Http\Controllers;

use App\Models\Assessment;
use Illuminate\Http\Request;

class AssessmentController extends Controller
{


    public function index()
    {

        return response()->json([

            'assessments'=>Assessment::with(
                'semester.academicYear'
            )->get()

        ]);

    }





    public function store(Request $request)
    {


        $data = $request->validate([


            'semester_id'=>'required|exists:semesters,id',

            'name'=>'required',

            'type'=>'required|in:monthly,midterm,final',

            'month'=>'nullable',

            'max_score'=>'nullable',

            'date'=>'nullable|date'


        ]);



        $assessment = Assessment::create($data);



        return response()->json([

            'message'=>'Assessment created successfully',

            'assessment'=>$assessment

        ],201);


    }
    public function show(Assessment $assessment)
{

    return response()->json([

        'assessment'=>$assessment->load(
            'semester.academicYear'
        )

    ]);

}
public function update(Request $request, Assessment $assessment)
{

    $data = $request->validate([

        'name'=>'required',

        'type'=>'required|in:monthly,midterm,final',

        'month'=>'nullable',

        'max_score'=>'required|integer',

        'date'=>'nullable|date'

    ]);


    $assessment->update($data);


    return response()->json([

        'message'=>'Assessment updated successfully',

        'assessment'=>$assessment

    ]);

}
public function destroy(Assessment $assessment)
{

    $assessment->delete();


    return response()->json([

        'message'=>'Assessment deleted successfully'

    ]);

}

}