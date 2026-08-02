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
        Schema::create('teacher_assignments', function (Blueprint $table) {
$table->id();

            // Teacher user
            $table->foreignId('teacher_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // Class assigned
            $table->foreignId('class_id')
                ->constrained('school_classes')
                ->cascadeOnDelete();

            // Class teacher?
            $table->boolean('is_class_teacher')
                ->default(false);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('teacher_assignments');
    }
};
