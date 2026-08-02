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
        Schema::create('schedules', function (Blueprint $table) {
 $table->id();

    $table->foreignId('teacher_id')
        ->constrained('users')
        ->cascadeOnDelete();

    $table->foreignId('class_id')
        ->constrained('school_classes')
        ->cascadeOnDelete();

    $table->foreignId('subject_id')
        ->constrained()
        ->cascadeOnDelete();

    $table->string('day');

    $table->time('start_time');

    $table->time('end_time');

    $table->string('room')->nullable();

    $table->string('academic_year');

    $table->timestamps(); // <-- important

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schedules');
    }
};
