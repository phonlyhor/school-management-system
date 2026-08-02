<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('student_scores', function (Blueprint $table) {
               $table->id();


        $table->foreignId('student_id')
              ->constrained('students')
              ->cascadeOnDelete();


        $table->foreignId('subject_id')
              ->constrained('subjects')
              ->cascadeOnDelete();


        $table->foreignId('assessment_id')
              ->constrained('assessments')
              ->cascadeOnDelete();



        $table->decimal(
            'score',
            5,
            2
        );


        $table->string('grade')
              ->nullable();


        $table->text('remark')
              ->nullable();



        $table->timestamps();


        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_scores');
    }
};
