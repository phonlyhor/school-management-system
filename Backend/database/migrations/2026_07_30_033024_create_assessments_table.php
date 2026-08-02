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
        Schema::create('assessments', function (Blueprint $table) {
              $table->id();


        $table->foreignId('semester_id')
              ->constrained('semesters')
              ->cascadeOnDelete();


        $table->string('name');


        $table->enum('type',[
            'monthly',
            'midterm',
            'final'
        ]);


        $table->string('month')
              ->nullable();


        $table->integer('max_score')
              ->default(100);


        $table->date('date')
              ->nullable();


        $table->timestamps();

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assessments');
    }
};
