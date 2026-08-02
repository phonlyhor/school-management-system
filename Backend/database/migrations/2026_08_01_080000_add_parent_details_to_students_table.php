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
        Schema::table('students', function (Blueprint $table) {
            $table->date('father_dob')->nullable()->after('father_name');
            $table->string('father_phone')->nullable()->after('father_dob');
            $table->date('mother_dob')->nullable()->after('mother_name');
            $table->string('mother_phone')->nullable()->after('mother_dob');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn(['father_dob', 'father_phone', 'mother_dob', 'mother_phone']);
        });
    }
};
