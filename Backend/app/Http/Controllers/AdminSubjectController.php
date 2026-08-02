<?php

namespace App\Http\Controllers;

use App\Models\Subject;
use Illuminate\Http\Request;

class AdminSubjectController extends Controller
{


    // View all subjects
    public function index()
    {

        $subjects = Subject::all();


        return response()->json([
            'subjects'=>$subjects
        ]);

    }





    // Create subject
    public function store(Request $request)
    {

        $request->validate([

            'name'=>'required',
            'code'=>'required|unique:subjects,code',
            'description'=>'nullable'

        ]);



        $subject = Subject::create([

            'name'=>$request->name,

            'code'=>$request->code,

            'description'=>$request->description

        ]);



        return response()->json([

            'message'=>'Subject created successfully',

            'subject'=>$subject

        ],201);

    }





    // Show one subject
    public function show(Subject $subject)
    {

        return response()->json([

            'subject'=>$subject

        ]);

    }





    // Update subject
    public function update(
        Request $request,
        Subject $subject
    )
    {


        $subject->update([

            'name'=>$request->name,

            'code'=>$request->code,

            'description'=>$request->description

        ]);



        return response()->json([

            'message'=>'Subject updated successfully',

            'subject'=>$subject

        ]);

    }





    // Delete subject
    public function destroy(Subject $subject)
    {

        $subject->delete();


        return response()->json([

            'message'=>'Subject deleted successfully'

        ]);

    }


}