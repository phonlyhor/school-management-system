<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations to add extended social, health & economic fields to students table.
     */
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            if (!Schema::hasColumn('students', 'height_cm')) {
                $table->decimal('height_cm', 5, 2)->nullable()->after('gender');
            }
            if (!Schema::hasColumn('students', 'weight_kg')) {
                $table->decimal('weight_kg', 5, 2)->nullable()->after('height_cm');
            }
            if (!Schema::hasColumn('students', 'orphan_status')) {
                $table->string('orphan_status')->nullable()->after('weight_kg');
            }
            if (!Schema::hasColumn('students', 'equity_card_type')) {
                $table->string('equity_card_type')->nullable()->after('orphan_status');
            }
            if (!Schema::hasColumn('students', 'equity_card_number')) {
                $table->string('equity_card_number')->nullable()->after('equity_card_type');
            }
            if (!Schema::hasColumn('students', 'scholarship_type')) {
                $table->string('scholarship_type')->nullable()->after('equity_card_number');
            }
            if (!Schema::hasColumn('students', 'insurance_card_number')) {
                $table->string('insurance_card_number')->nullable()->after('scholarship_type');
            }
            if (!Schema::hasColumn('students', 'student_phone')) {
                $table->string('student_phone')->nullable()->after('insurance_card_number');
            }
            if (!Schema::hasColumn('students', 'father_occupation')) {
                $table->string('father_occupation')->nullable()->after('father_phone');
            }
            if (!Schema::hasColumn('students', 'mother_occupation')) {
                $table->string('mother_occupation')->nullable()->after('mother_phone');
            }
            if (!Schema::hasColumn('students', 'family_monthly_income')) {
                $table->string('family_monthly_income')->nullable()->after('mother_occupation');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn([
                'height_cm',
                'weight_kg',
                'orphan_status',
                'equity_card_type',
                'equity_card_number',
                'scholarship_type',
                'insurance_card_number',
                'student_phone',
                'father_occupation',
                'mother_occupation',
                'family_monthly_income',
            ]);
        });
    }
};
