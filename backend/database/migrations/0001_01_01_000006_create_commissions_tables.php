<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Commissions Domain Migration
 *
 * Creates: commission_slabs, commissions, admin_ledgers
 *
 * Absorbed patches:
 *  - create_admin_ledgers_table                              → admin_ledgers table
 *  - add_performance_indexes_and_constraints_to_crm_tables  → idx_commissions_locked_at, chk_amount_positive
 */
return new class extends Migration {
    public function up(): void
    {
        // ─── Commission Slabs ─────────────────────────────────────────────────
        Schema::create('commission_slabs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('super_agent_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->string('capacity');
            $table->string('label');
            $table->decimal('agent_commission', 10, 2);
            $table->decimal('enumerator_commission', 10, 2)->default(0);
            $table->decimal('super_agent_override', 10, 2)->default(0);
            $table->string('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['capacity', 'super_agent_id']);
        });

        // ─── Commissions Ledger ───────────────────────────────────────────────
        Schema::create('commissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
            $table->foreignId('payee_id')->constrained('users')->cascadeOnDelete();
            $table->enum('payee_role', ['super_agent', 'agent', 'enumerator', 'field_technical_team', 'admin']);
            $table->decimal('amount', 10, 2);
            $table->foreignId('entered_by')->constrained('users');
            $table->enum('payment_status', ['unpaid', 'paid', 'voided'])->default('unpaid')->index();
            $table->timestamp('paid_at')->nullable();
            $table->foreignId('paid_by')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('payment_method', ['bank_transfer', 'upi', 'cash', 'cheque'])->nullable();
            $table->string('payment_reference', 150)->nullable();
            $table->text('payment_notes')->nullable();
            $table->string('trigger_status', 60)->nullable();
            $table->timestamp('triggered_at')->nullable();
            $table->string('chain_type', 20)->nullable();
            $table->tinyInteger('hierarchy_level')->nullable();
            $table->timestamp('voided_at')->nullable();
            $table->text('void_reason')->nullable();
            $table->timestamp('locked_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // ── Unique & lookup indexes ──────────────────────────────────────
            $table->unique(['lead_id', 'payee_id'], 'unique_lead_payee_person');
            $table->index(['payee_id', 'payee_role'], 'idx_commissions_payee_id_role'); // payee_id-first for single-user lookups
            $table->index(['payee_role', 'payee_id'], 'idx_commissions_payee');         // payee_role-first for role-wide reports
            $table->index('locked_at', 'idx_commissions_locked_at');                    // ← absorbed from performance patch
        });

        // ─── Admin Ledger (non-lead-based expenses & allowances) ─────────────
        // Absorbed from: create_admin_ledgers_table
        Schema::create('admin_ledgers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_id')->constrained('users')->cascadeOnDelete();

            // 'credit' = Money received by Admin (SA allowances, meetings funded)
            // 'debit'  = Money spent by Admin  (office, transport, misc)
            $table->enum('transaction_type', ['credit', 'debit']);

            $table->string('category')->index(); // 'meeting_allowance', 'office_expense', 'travel', 'other'
            $table->decimal('amount', 12, 2);
            $table->string('description');

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // ─── CHECK Constraints ────────────────────────────────────────────────
        // Absorbed from: add_performance_indexes_and_constraints_to_crm_tables
        DB::statement('ALTER TABLE commissions ADD CONSTRAINT chk_commission_amount_positive CHECK (amount >= 0)');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE commissions DROP CONSTRAINT chk_commission_amount_positive');
        Schema::dropIfExists('admin_ledgers');
        Schema::dropIfExists('commissions');
        Schema::dropIfExists('commission_slabs');
    }
};
