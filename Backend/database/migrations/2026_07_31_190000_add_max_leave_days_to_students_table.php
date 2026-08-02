<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('students') && !Schema::hasColumn('students', 'max_leave_days')) {
            Schema::table('students', function (Blueprint $table) {
                $table->integer('max_leave_days')->default(10)->nullable()->after('class_position');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('students') && Schema::hasColumn('students', 'max_leave_days')) {
            Schema::table('students', function (Blueprint $table) {
                $table->dropColumn('max_leave_days');
            });
        }
    }
};
