<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Student;
use App\Models\StudentScore;
use App\Models\SchoolClass;
use App\Services\MoEYSCalculationService;

class ReportCardController extends Controller
{
    /**
     * Display student academic report card (MoEYS Standard)
     */
    public function show(Request $request, $student_id)
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

        $academicYear = $request->query('academic_year');
        $semesterId = $request->query('semester_id');

        // Get Scores
        $scoresQuery = StudentScore::with([
            'subject',
            'assessment.semester.academicYear'
        ])
        ->where('student_id', $student->id);

        if ($academicYear) {
            $scoresQuery->whereHas('assessment.semester.academicYear', function ($q) use ($academicYear) {
                $q->where('name', $academicYear);
            });
        }

        if ($semesterId) {
            $scoresQuery->whereHas('assessment', function ($q) use ($semesterId) {
                $q->where('semester_id', $semesterId);
            });
        }

        $scores = $scoresQuery->get();

        // MoEYS Summary Calculation
        $summary = MoEYSCalculationService::calculateScoreSummary($scores);

        // Class Ranking Calculation
        $rankData = MoEYSCalculationService::calculateClassRanking(
            $student->class_id,
            $academicYear,
            $semesterId
        );

        $studentRank = null;
        if (!empty($rankData['rankings'])) {
            foreach ($rankData['rankings'] as $item) {
                if ($item['student_id'] == $student->id) {
                    $studentRank = $item['rank'];
                    break;
                }
            }
        }

        $academicYearName = $scores->first()?->assessment?->semester?->academicYear?->name ?? $academicYear ?? '2025-2026';
        $semesterName = $scores->first()?->assessment?->semester?->name ?? 'N/A';

        return response()->json([
            'student' => [
                'id' => $student->id,
                'name' => $student->user?->name ?? 'Unknown Student',
                'student_code' => $student->student_code ?? '',
                'gender' => $student->gender ?? 'N/A',
                'class' => [
                    'id' => $student->schoolClass?->id,
                    'name' => $student->schoolClass?->name ?? 'Unassigned',
                    'grade_level' => $student->schoolClass?->grade_level ?? 'N/A'
                ]
            ],
            'academic_year' => $academicYearName,
            'semester' => $semesterName,
            'subjects' => $summary['subjects'],
            'total_score' => $summary['total_score'],
            'total_max_score' => $summary['total_max_score'],
            'average' => $summary['average_percentage'],
            'score_out_of_50' => $summary['score_out_of_50'],
            'score_out_of_10' => $summary['score_out_of_10'],
            'final_score_50' => (int)round($summary['score_out_of_50']),
            'is_passed' => $summary['pass_status']['is_passed'],
            'result_status' => $summary['pass_status']['label'],
            'pass_status' => $summary['pass_status'],
            'pass_threshold' => 25.00,
            'grade_mention' => $summary['grade_mention'],
            'overall_grade' => $summary['grade_mention']['code'],
            'rank' => $studentRank,
            'total_students' => $rankData['total_students']
        ]);
    }

    /**
     * Get MoEYS Class Broadsheet / Ranking Summary for a whole class
     */
    public function classSummaryReport(Request $request, $class_id)
    {
        $schoolClass = SchoolClass::find($class_id);
        if (!$schoolClass) {
            return response()->json([
                'message' => 'School class not found.'
            ], 404);
        }

        $academicYear = $request->query('academic_year');
        $semesterId = $request->query('semester_id');

        $rankData = MoEYSCalculationService::calculateClassRanking($class_id, $academicYear, $semesterId);

        $rankings = $rankData['rankings'];
        $totalStudents = $rankData['total_students'];
        $passedCount = count(array_filter($rankings, fn($r) => $r['pass_status']['is_passed']));
        $failedCount = $totalStudents - $passedCount;

        $classAverage = $totalStudents > 0
            ? round(array_sum(array_column($rankings, 'average_percentage')) / $totalStudents, 2)
            : 0;

        return response()->json([
            'class' => [
                'id' => $schoolClass->id,
                'name' => $schoolClass->name,
                'grade_level' => $schoolClass->grade_level
            ],
            'academic_year' => $academicYear ?? 'All',
            'summary' => [
                'total_students' => $totalStudents,
                'passed_count' => $passedCount,
                'failed_count' => $failedCount,
                'pass_rate' => $totalStudents > 0 ? round(($passedCount / $totalStudents) * 100, 2) . '%' : '0%',
                'class_average' => $classAverage
            ],
            'rankings' => $rankings
        ]);
    }
}