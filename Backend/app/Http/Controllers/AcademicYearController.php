<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use Illuminate\Http\Request;

class AcademicYearController extends Controller
{


    // Get All Academic Years

    public function index()
    {

        return response()->json([

            'academic_years'=>AcademicYear::with(
                'semesters.assessments'
            )->get()

        ]);

    }




    // Create Academic Year

    public function store(Request $request)
    {

        $data = $request->validate([

            'name'=>'required',

            'start_date'=>'required|date',

            'end_date'=>'required|date'

        ]);



        $year = AcademicYear::create([

            'name'=>$data['name'],

            'start_date'=>$data['start_date'],

            'end_date'=>$data['end_date'],

            'status'=>true

        ]);



        return response()->json([

            'message'=>'Academic year created successfully',

            'academic_year'=>$year

        ],201);

    }





    // Show One Academic Year

    public function show(AcademicYear $academicYear)
    {

        return response()->json([

            'academic_year'=>$academicYear->load(
                'semesters.assessments'
            )

        ]);

    }





    // Update Academic Year

    public function update(
        Request $request,
        AcademicYear $academicYear
    )
    {


        $data = $request->validate([

            'name'=>'required',

            'start_date'=>'required|date',

            'end_date'=>'required|date',

            'status'=>'boolean'

        ]);



        $academicYear->update($data);



        return response()->json([

            'message'=>'Academic year updated successfully',

            'academic_year'=>$academicYear

        ]);

    }





    // Delete Academic Year

    public function destroy(
        AcademicYear $academicYear
    )
    {


        $academicYear->delete();



        return response()->json([

            'message'=>'Academic year deleted successfully'

        ]);

    }


}