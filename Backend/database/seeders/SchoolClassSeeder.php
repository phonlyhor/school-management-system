<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SchoolClass;

class SchoolClassSeeder extends Seeder
{
    public function run(): void
    {
        SchoolClass::create([
            'name' => 'Class 7A',
            'grade_level' => 'Grade 7',
            'academic_year' => '2026-2027',
        ]);

        SchoolClass::create([
            'name' => 'Class 7B',
            'grade_level' => 'Grade 7',
            'academic_year' => '2026-2027',
        ]);

        SchoolClass::create([
            'name' => 'Class 8A',
            'grade_level' => 'Grade 8',
            'academic_year' => '2026-2027',
        ]);

        SchoolClass::create([
            'name' => 'Class 9A',
            'grade_level' => 'Grade 9',
            'academic_year' => '2026-2027',
        ]);
    }
}