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
        Schema::create('teachers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('class_id')->nullable()->constrained('school_classes')->onDelete('set null');
            $table->string('civil_servant_id')->nullable()->unique();
            $table->string('position')->nullable();
            $table->string('civil_service_framework')->nullable();
            $table->string('education_level')->nullable();
            $table->string('qualification')->nullable();
            $table->string('specialization_1')->nullable();
            $table->string('specialization_2')->nullable();
            $table->string('specialization_3')->nullable();
            $table->string('teaching_level')->nullable();
            $table->string('activity_status')->nullable();
            $table->date('civil_service_date')->nullable();
            $table->string('service_duration')->nullable();
            $table->text('awards')->nullable();
            $table->text('honors')->nullable();
            $table->string('grades_taught')->nullable();
            $table->string('technology_usage')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('teachers');
    }
};
