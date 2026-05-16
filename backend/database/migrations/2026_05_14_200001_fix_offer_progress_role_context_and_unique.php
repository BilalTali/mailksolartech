<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Step 1: Expand ENUM to include 'admin' — prevents DB crash when admin earns points
        DB::statement(
            "ALTER TABLE offer_progress MODIFY role_context ENUM('agent','super_agent','admin') DEFAULT 'agent'"
        );

        // Step 2: Add wide unique key including role_context FIRST
        // This provides an index for the offer_id foreign key so we can drop the old one safely.
        Schema::table('offer_progress', function (Blueprint $table) {
            $table->unique(
                ['offer_id', 'user_id', 'role_context'],
                'offer_progress_offer_user_role_unique'
            );
        });

        // Step 3: Drop old narrow unique key (offer_id, user_id)
        Schema::table('offer_progress', function (Blueprint $table) {
            $table->dropUnique(['offer_id', 'user_id']);
        });
    }

    public function down(): void
    {
        DB::statement(
            "ALTER TABLE offer_progress MODIFY role_context ENUM('agent','super_agent') DEFAULT 'agent'"
        );
        Schema::table('offer_progress', function (Blueprint $table) {
            $table->dropUnique('offer_progress_offer_user_role_unique');
            $table->unique(['offer_id', 'user_id']);
        });
    }
};
