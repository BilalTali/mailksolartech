<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedSmallInteger('offer_point_threshold')
                  ->default(10)
                  ->after('enumerator_creator_role')
                  ->comment('Points creator absorbs before enumerator earns freely. Only applies to enumerator role.');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('offer_point_threshold');
        });
    }
};
