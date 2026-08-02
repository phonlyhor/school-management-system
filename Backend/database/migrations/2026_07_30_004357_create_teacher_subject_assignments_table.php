<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('teacher_subject_assignments', function (Blueprint $table) {

            $table->id();

            // Teacher
            $table->foreignId('teacher_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // Subject
            $table->foreignId('subject_id')
                ->constrained('subjects')
                ->cascadeOnDelete();

            // Class
            $table->foreignId('class_id')
                ->constrained('school_classes')
                ->cascadeOnDelete();

            $table->string('academic_year');

            $table->timestamps();

            // prevent duplicate
            $table->unique([
                'teacher_id',
                'subject_id',
                'class_id',
                'academic_year'
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_subject_assignments');
    }
};