<?php

namespace App\Services;

use App\Models\Student;
use App\Models\StudentScore;
use App\Models\SchoolClass;

class MoEYSCalculationService
{
    /**
     * Get Khmer Grade Mention based on percentage (or score out of 100/50/10)
     */
    public static function getKhmerGradeMention($percentage)
    {
        if ($percentage >= 90) {
            return [
                'code' => 'A',
                'khmer' => 'ល្អប្រសើរ',
                'english' => 'Excellent',
                'color' => '#16a34a' // Green
            ];
        } elseif ($percentage >= 80) {
            return [
                'code' => 'B',
                'khmer' => 'ល្អណាស់',
                'english' => 'Very Good',
                'color' => '#2563eb' // Blue
            ];
        } elseif ($percentage >= 70) {
            return [
                'code' => 'C',
                'khmer' => 'ល្អ',
                'english' => 'Good',
                'color' => '#0284c7' // Light Blue
            ];
        } elseif ($percentage >= 60) {
            return [
                'code' => 'D',
                'khmer' => 'ល្អបង្គួរ',
                'english' => 'Fairly Good',
                'color' => '#d97706' // Amber
            ];
        } elseif ($percentage >= 50) {
            return [
                'code' => 'E',
                'khmer' => 'មធ្យម',
                'english' => 'Pass / Average',
                'color' => '#ea580c' // Orange
            ];
        } else {
            return [
                'code' => 'F',
                'khmer' => 'ខ្សោយ',
                'english' => 'Fail / Poor',
                'color' => '#dc2626' // Red
            ];
        }
    }

    /**
     * Determine MoEYS Passing Status based on score out of 50
     */
    public static function getPassStatus($scoreOn50)
    {
        $rounded50 = (int)round($scoreOn50);
        $isPassed = $rounded50 >= 25;
        
        return [
            'is_passed' => $isPassed,
            'status_khmer' => $isPassed ? 'ជាប់' : 'ធ្លាក់',
            'status_english' => $isPassed ? 'PASS' : 'FAIL',
            'label' => $isPassed ? 'ជាប់ (PASS)' : 'ធ្លាក់ (FAIL)',
            'color' => $isPassed ? '#16a34a' : '#dc2626'
        ];
    }

    /**
     * Calculate MoEYS Summary for a collection of StudentScores
     */
    public static function calculateScoreSummary($scores)
    {
        if ($scores->isEmpty()) {
            return [
                'total_score' => 0,
                'total_max_score' => 0,
                'average_percentage' => 0,
                'score_out_of_50' => 0,
                'score_out_of_10' => 0,
                'grade_mention' => self::getKhmerGradeMention(0),
                'pass_status' => self::getPassStatus(0),
                'subjects' => []
            ];
        }

        $totalScore = 0;
        $totalMaxScore = 0;
        $formattedSubjects = [];

        foreach ($scores as $scoreItem) {
            $scoreVal = (float)$scoreItem->score;
            $maxScoreVal = (float)($scoreItem->max_score > 0 ? $scoreItem->max_score : 100);
            $percentageVal = $scoreItem->percentage > 0 ? (float)$scoreItem->percentage : round(($scoreVal / $maxScoreVal) * 100, 2);

            $totalScore += $scoreVal;
            $totalMaxScore += $maxScoreVal;

            $formattedSubjects[] = [
                'subject_id' => $scoreItem->subject_id,
                'subject' => $scoreItem->subject?->name ?? 'N/A',
                'subject_khmer' => $scoreItem->subject?->name ?? 'N/A',
                'score' => $scoreVal,
                'max_score' => $maxScoreVal,
                'percentage' => $percentageVal,
                'grade_code' => $scoreItem->grade ?? self::getKhmerGradeMention($percentageVal)['code'],
                'grade_mention' => self::getKhmerGradeMention($percentageVal),
                'assessment' => $scoreItem->assessment?->title ?? $scoreItem->assessment?->type ?? 'N/A'
            ];
        }

        $averagePercentage = $totalMaxScore > 0 ? round(($totalScore / $totalMaxScore) * 100, 2) : 0;
        $scoreOn50 = round($averagePercentage / 2, 2);
        $scoreOn10 = round($averagePercentage / 10, 2);

        return [
            'total_score' => round($totalScore, 2),
            'total_max_score' => round($totalMaxScore, 2),
            'average_percentage' => $averagePercentage,
            'score_out_of_50' => $scoreOn50,
            'score_out_of_10' => $scoreOn10,
            'grade_mention' => self::getKhmerGradeMention($averagePercentage),
            'pass_status' => self::getPassStatus($scoreOn50),
            'subjects' => $formattedSubjects
        ];
    }

    /**
     * Calculate Class Ranking for a given class ID based on student averages
     */
    public static function calculateClassRanking($classId, $academicYear = null, $semesterId = null)
    {
        if (!$classId) {
            return [
                'rankings' => [],
                'total_students' => 0
            ];
        }

        $students = Student::with('user')
            ->where('class_id', $classId)
            ->get();

        if ($students->isEmpty()) {
            return [
                'rankings' => [],
                'total_students' => 0
            ];
        }

        $studentAverages = [];

        foreach ($students as $student) {
            $query = StudentScore::where('student_id', $student->id);

            if ($academicYear) {
                $query->whereHas('assessment.semester.academicYear', function ($q) use ($academicYear) {
                    $q->where('name', $academicYear);
                });
            }

            if ($semesterId) {
                $query->whereHas('assessment', function ($q) use ($semesterId) {
                    $q->where('semester_id', $semesterId);
                });
            }

            $scores = $query->get();
            $summary = self::calculateScoreSummary($scores);

            $studentAverages[] = [
                'student_id' => $student->id,
                'student_code' => $student->student_code,
                'student_name' => $student->user?->name ?? 'Unknown',
                'gender' => $student->gender ?? 'N/A',
                'total_score' => $summary['total_score'],
                'average_percentage' => $summary['average_percentage'],
                'score_out_of_50' => $summary['score_out_of_50'],
                'grade_mention' => $summary['grade_mention'],
                'pass_status' => $summary['pass_status'],
            ];
        }

        // Sort descending by average_percentage
        usort($studentAverages, function ($a, $b) {
            return $b['average_percentage'] <=> $a['average_percentage'];
        });

        // Assign dense ranks (handling ties)
        $currentRank = 1;
        $totalCount = count($studentAverages);

        for ($i = 0; $i < $totalCount; $i++) {
            if ($i > 0 && $studentAverages[$i]['average_percentage'] < $studentAverages[$i - 1]['average_percentage']) {
                $currentRank = $i + 1;
            }
            $studentAverages[$i]['rank'] = $currentRank;
        }

        return [
            'rankings' => $studentAverages,
            'total_students' => $totalCount
        ];
    }
}
