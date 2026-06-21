<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds super_admin_rate to commission_slabs.
 * This is the ₹/lead amount the Super Admin allocates TO Admins per capacity tier.
 * e.g. 1kW → ₹10,000 | 3kW → ₹30,000 | 5kW → ₹50,000
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('commission_slabs', function (Blueprint $table) {
            $table->decimal('super_admin_rate', 10, 2)->default(0)->after('super_agent_override');
        });
    }

    public function down(): void
    {
        Schema::table('commission_slabs', function (Blueprint $table) {
            $table->dropColumn('super_admin_rate');
        });
    }
};
