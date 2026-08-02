<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Subject;

class SubjectSeeder extends Seeder
{
    public function run(): void
    {
        Subject::create([
            'name' => 'Mathematics',
            'code' => 'MATH001',
            'description' => 'Mathematics Subject',
        ]);

        Subject::create([
            'name' => 'English',
            'code' => 'ENG001',
            'description' => 'English Language',
        ]);

        Subject::create([
            'name' => 'Science',
            'code' => 'SCI001',
            'description' => 'Science Subject',
        ]);

        Subject::create([
            'name' => 'Khmer',
            'code' => 'KH001',
            'description' => 'Khmer Language',
        ]);
    }
}