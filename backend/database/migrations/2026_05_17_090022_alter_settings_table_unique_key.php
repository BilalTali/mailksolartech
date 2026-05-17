<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        try {
            DB::statement('ALTER TABLE settings DROP INDEX settings_key_unique');
        } catch (\Exception $e) {
            // Ignore if already dropped
        }
        
        try {
            DB::statement('ALTER TABLE settings ADD UNIQUE KEY settings_user_id_key_unique (user_id, `key`)');
        } catch (\Exception $e) {
            // Ignore if already exists
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->dropUnique('settings_user_id_key_unique');
            $table->unique('key', 'settings_key_unique');
        });
    }
};
