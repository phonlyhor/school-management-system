<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('homework')) {
            Schema::create('homework', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->text('description')->nullable();
                $table->foreignId('class_id')->constrained('school_classes')->onDelete('cascade');
                $table->foreignId('subject_id')->nullable()->constrained('subjects')->onDelete('cascade');
                $table->foreignId('teacher_id')->constrained('users')->onDelete('cascade');
                $table->date('due_date');
                $table->string('attachment_path')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('homework');
    }
};
