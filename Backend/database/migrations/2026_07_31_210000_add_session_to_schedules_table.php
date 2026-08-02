<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('schedules') && !Schema::hasColumn('schedules', 'session')) {
            Schema::table('schedules', function (Blueprint $table) {
                $table->string('session')->default('morning')->after('day');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('schedules') && Schema::hasColumn('schedules', 'session')) {
            Schema::table('schedules', function (Blueprint $table) {
                $table->dropColumn('session');
            });
        }
    }
};
