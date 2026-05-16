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
        Schema::table('super_agent_absorbed_points', function (Blueprint $table) {
            $table->decimal('agent_total_points', 10, 2)->default(0)->after('absorbed_points');
            $table->decimal('offer_target', 10, 2)->default(0)->after('agent_total_points');
            $table->string('absorption_reason')->nullable()->after('offer_target');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('super_agent_absorbed_points', function (Blueprint $table) {
            $table->dropColumn(['agent_total_points', 'offer_target', 'absorption_reason']);
        });
    }
};
