<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('teacher_class_assignments', function (Blueprint $table) {
            $table->id();

            // Teacher (User with role = teacher)
            $table->foreignId('teacher_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // Assigned Class
            $table->foreignId('class_id')
                ->constrained('school_classes')
                ->cascadeOnDelete();

            // Academic Year
            $table->string('academic_year');

            $table->timestamps();

            // Prevent duplicate assignments
            $table->unique([
                'teacher_id',
                'class_id',
                'academic_year'
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_class_assignments');
    }
};