<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations to add structured address fields to users table.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'province')) {
                $table->string('province')->nullable()->after('address');
            }
            if (!Schema::hasColumn('users', 'district')) {
                $table->string('district')->nullable()->after('province');
            }
            if (!Schema::hasColumn('users', 'commune')) {
                $table->string('commune')->nullable()->after('district');
            }
            if (!Schema::hasColumn('users', 'village')) {
                $table->string('village')->nullable()->after('commune');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['province', 'district', 'commune', 'village']);
        });
    }
};
