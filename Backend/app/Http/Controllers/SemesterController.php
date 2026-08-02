<?php

namespace App\Http\Controllers;

use App\Models\Semester;
use Illuminate\Http\Request;

class SemesterController extends Controller
{


    // Get All Semesters

    public function index()
    {

        return response()->json([

            'semesters'=>Semester::with(
                'academicYear'
            )->get()

        ]);

    }



    // Create Semester

    public function store(Request $request)
    {

        $data = $request->validate([

            'academic_year_id'=>'required|exists:academic_years,id',

            'name'=>'required',

            'start_date'=>'required|date',

            'end_date'=>'required|date'

        ]);


        $semester = Semester::create($data);



        return response()->json([

            'message'=>'Semester created successfully',

            'semester'=>$semester

        ],201);

    }





    // Show One Semester

    public function show(Semester $semester)
    {

        return response()->json([

            'semester'=>$semester->load(
                'academicYear'
            )

        ]);

    }





    // Update Semester

    public function update(Request $request, Semester $semester)
    {

        $data = $request->validate([

            'name'=>'required',

            'start_date'=>'required|date',

            'end_date'=>'required|date'

        ]);



        $semester->update($data);



        return response()->json([

            'message'=>'Semester updated successfully',

            'semester'=>$semester

        ]);

    }





    // Delete Semester

    public function destroy(Semester $semester)
    {

        $semester->delete();



        return response()->json([

            'message'=>'Semester deleted successfully'

        ]);

    }


}