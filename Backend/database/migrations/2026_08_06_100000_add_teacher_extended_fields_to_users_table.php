<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations for both PostgreSQL and MySQL/SQLite compatibility.
     */
    public function up(): void
    {
        $columnsToDrop = [
            'position',
            'civil_service_framework',
            'education_level',
            'qualification',
            'specialization_1',
            'specialization_2',
            'specialization_3',
            'teaching_level',
            'activity_status',
            'class_charge',
            'civil_service_date',
            'service_duration',
            'awards',
            'honors',
            'grades_taught',
            'technology_usage',
            'civil_servant_id'
        ];

        foreach ($columnsToDrop as $col) {
            if (Schema::hasColumn('users', $col)) {
                Schema::table('users', function (Blueprint $table) use ($col) {
                    $table->dropColumn($col);
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No need to re-add to users table
    }
};
