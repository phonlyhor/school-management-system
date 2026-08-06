<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations to drop max_leave_days column from students table.
     */
    public function up(): void
    {
        if (Schema::hasColumn('students', 'max_leave_days')) {
            Schema::table('students', function (Blueprint $table) {
                $table->dropColumn('max_leave_days');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->integer('max_leave_days')->default(10);
        });
    }
};
