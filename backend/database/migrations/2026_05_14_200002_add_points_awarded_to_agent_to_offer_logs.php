<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('offer_installation_logs', function (Blueprint $table) {
            $table->decimal('points_awarded_to_agent', 8, 2)
                  ->default(0)
                  ->after('points_awarded')
                  ->comment(
                      'Actual points credited to this agent after enumerator absorption split. ' .
                      'For enumerators below their threshold, this is less than points_awarded. ' .
                      'points_awarded always stores the full capacity value for audit purposes.'
                  );
        });
    }

    public function down(): void
    {
        Schema::table('offer_installation_logs', function (Blueprint $table) {
            $table->dropColumn('points_awarded_to_agent');
        });
    }
};
