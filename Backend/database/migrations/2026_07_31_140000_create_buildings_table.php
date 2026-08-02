<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('buildings', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->string('type')->default('Building'); // Building (អគារសិក្សា), Admin Office (ទីចាត់ការ), Library (បណ្ណាល័យ), Laboratory (បន្ទប់ពិសោធន៍)
            $table->integer('total_rooms')->default(1);
            $table->integer('floors')->default(1);
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('buildings');
    }
};
