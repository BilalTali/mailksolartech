<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Performance Indexes — Users & Secondary Leads Indexes
 *
 * All table-creation indexes are defined inline in their respective migrations.
 * This migration ONLY adds supplemental indexes that require all tables to exist first,
 * specifically for the users table (role/status lookup paths).
 *
 * Note: leads hierarchy indexes (assigned_agent_id, assigned_super_agent_id, etc.)
 *       are already defined inline in 000004_create_leads_table.
 */
return new class extends Migration {
    public function up(): void
    {
        // users — role/status lookup (guards added to prevent duplicate index errors)
        if (!$this->hasIndex('users', 'users_role_index')) {
            Schema::table('users', function (Blueprint $table) {
                $table->index('role', 'users_role_index');
                $table->index('status', 'users_status_index');
            });
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_role_index');
            $table->dropIndex('users_status_index');
        });
    }

    private function hasIndex(string $table, string $index): bool
    {
        $indexes = DB::select("SHOW INDEX FROM `{$table}` WHERE Key_name = ?", [$index]);
        return count($indexes) > 0;
    }
};
