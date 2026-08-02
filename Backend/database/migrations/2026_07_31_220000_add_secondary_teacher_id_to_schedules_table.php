<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('schedules') && !Schema::hasColumn('schedules', 'secondary_teacher_id')) {
            Schema::table('schedules', function (Blueprint $table) {
                $table->foreignId('secondary_teacher_id')->nullable()->after('teacher_id')->constrained('users')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('schedules') && Schema::hasColumn('schedules', 'secondary_teacher_id')) {
            Schema::table('schedules', function (Blueprint $table) {
                $table->dropForeign(['secondary_teacher_id']);
                $table->dropColumn('secondary_teacher_id');
            });
        }
    }
};
