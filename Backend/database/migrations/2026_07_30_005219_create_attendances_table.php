<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendances', function (Blueprint $table) {

            $table->id();

            // Student
            $table->foreignId('student_id')
                ->constrained('students')
                ->cascadeOnDelete();

            // Teacher who takes attendance
            $table->foreignId('teacher_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // Class
            $table->foreignId('class_id')
                ->constrained('school_classes')
                ->cascadeOnDelete();

            // Subject
            $table->foreignId('subject_id')
                ->constrained('subjects')
                ->cascadeOnDelete();


            $table->date('date');


            $table->enum('status', [
                'present',
                'absent',
                'late',
                'permission'
            ]);

            $table->text('note')->nullable();


            $table->timestamps();


            // Prevent duplicate attendance
            $table->unique([
                'student_id',
                'subject_id',
                'date'
            ]);

        });
    }


    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};