<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Guard migration: ensures the settings table has the user_id column
 * and the correct composite unique key (user_id, key).
 *
 * Safe to run multiple times — all steps check existence before acting.
 * This resolves 500 errors on /api/v1/public/settings caused by
 * production DBs created before user_id was added to the settings schema.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            // Step 1: Add user_id column if it doesn't exist yet.
            if (! Schema::hasColumn('settings', 'user_id')) {
                $table->foreignId('user_id')
                    ->nullable()
                    ->after('id')
                    ->constrained('users')
                    ->nullOnDelete();
            }

            // Step 2: Add group column if it doesn't exist yet.
            if (! Schema::hasColumn('settings', 'group')) {
                $table->string('group', 50)->nullable()->after('value');
            }
        });

        // Step 3: Drop old single-column unique on 'key' if still present.
        // We need the raw statement because Blueprint::dropUnique requires
        // the exact index name which varies across environments.
        $possibleOldIndexNames = [
            'settings_key_unique',
            'key',
        ];

        foreach ($possibleOldIndexNames as $indexName) {
            try {
                DB::statement("ALTER TABLE settings DROP INDEX `{$indexName}`");
            } catch (\Throwable $e) {
                // Index doesn't exist — that's fine, continue.
            }
        }

        // Step 4: Add composite unique (user_id, key) if it doesn't exist.
        try {
            DB::statement('ALTER TABLE settings ADD UNIQUE KEY settings_user_id_key_unique (user_id, `key`)');
        } catch (\Throwable $e) {
            // Already exists — fine.
        }
    }

    public function down(): void
    {
        // Intentionally non-destructive — do not drop user_id column on rollback
        // since production data may depend on it.
        try {
            DB::statement('ALTER TABLE settings DROP INDEX `settings_user_id_key_unique`');
        } catch (\Throwable $e) {
        }

        try {
            DB::statement('ALTER TABLE settings ADD UNIQUE KEY settings_key_unique (`key`)');
        } catch (\Throwable $e) {
        }
    }
};
