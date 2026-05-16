<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Leads Domain Migration
 *
 * Creates: dispatches, leads
 * Resolves circular FK: dispatches.lead_id → leads, users.lead_id → leads
 *
 * Absorbed patches:
 *  - add_admin_commission_fields_to_leads_table      (was empty, no-op)
 *  - add_top_down_commission_fields_to_leads_table   → admin_received_commission, admin_meeting_allowance, admin_additional_expenses, admin_other_expenses
 *  - add_registration_number_to_leads_table          → registration_number
 *  - add_installation_data_to_leads_table            → installation_data
 *  - add_performance_indexes (partial)               → idx_leads_admin_received_commission
 */
return new class extends Migration {
    public function up(): void
    {
        // ─── Dispatches (created before leads to satisfy FK later) ──────────
        Schema::create('dispatches', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('lead_id'); // FK added after leads table is created below
            $table->string('vehicle_number', 30)->nullable();
            $table->string('driver_name', 100)->nullable();
            $table->string('driver_mobile', 15)->nullable();
            $table->string('receipt_number', 100)->nullable();
            $table->timestamp('dispatched_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->foreignId('dispatched_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('consumer_confirmed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index('lead_id');
        });

        // ─── Leads ───────────────────────────────────────────────────────────
        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            $table->string('ulid')->unique();

            // ── Source & routing ─────────────────────────────────────────────
            $table->enum('source', [
                'public_form', 'agent_submission', 'super_agent_submission',
                'admin_manual', 'enumerator_submission'
            ])->default('public_form')->index();
            $table->string('referral_agent_id', 20)->nullable()->index();

            // ── Assignment hierarchy ─────────────────────────────────────────
            $table->foreignId('assigned_agent_id')->nullable()->constrained('users');
            $table->foreignId('assigned_super_agent_id')->nullable()->constrained('users');
            $table->foreignId('assigned_admin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('wa_handler_admin_id')->nullable()->constrained('users')->nullOnDelete(); // Admin handling WA-sourced leads
            $table->foreignId('submitted_by_agent_id')->nullable()->constrained('users');
            $table->foreignId('submitted_by_enumerator_id')->nullable();
            $table->foreignId('created_by_super_agent_id')->nullable()
                ->constrained('users')->nullOnDelete();

            // ── Technical team ───────────────────────────────────────────────
            $table->foreignId('assigned_surveyor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('assigned_installer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('installation_assigned_at')->nullable();
            $table->timestamp('surveyor_form_submitted_at')->nullable();

            // ── Ownership & verification ─────────────────────────────────────
            $table->enum('owner_type', ['admin_pool', 'super_agent_pool', 'agent_pool'])
                ->default('admin_pool')->index();
            $table->string('verification_status', 50)->nullable()->index();
            $table->unsignedTinyInteger('revert_count')->default(0);
            $table->text('revert_reason')->nullable();
            $table->foreignId('verified_by_super_agent_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('reverted_at')->nullable();
            $table->foreignId('reverted_by')->nullable()->constrained('users')->nullOnDelete();

            // ── Beneficiary information ──────────────────────────────────────
            $table->string('beneficiary_name');
            $table->string('beneficiary_mobile', 10)->index();
            $table->string('beneficiary_email');
            $table->string('beneficiary_state');
            $table->string('beneficiary_district');
            $table->text('beneficiary_address')->nullable();
            $table->string('beneficiary_pincode')->nullable();
            $table->index('beneficiary_state');

            // ── Beneficiary category (ration card type) ──────────────────────
            $table->enum('category', ['APL', 'BPL', 'AAY', 'OTHER'])->nullable();

            // ── Consumer details ─────────────────────────────────────────────
            $table->string('consumer_number', 100)->nullable()->unique()->index();
            $table->string('registration_number', 100)->nullable()->index(); // ← absorbed patch
            $table->string('discom_name')->nullable();
            $table->string('roof_size')->nullable();
            $table->string('system_capacity')->nullable();
            $table->decimal('monthly_bill_amount', 10, 2)->nullable();

            // ── Consumer portal ──────────────────────────────────────────────
            $table->string('consumer_signature_path', 500)->nullable();
            $table->string('consumer_portal_password')->nullable();

            // ── Beneficiary bank ─────────────────────────────────────────────
            $table->string('beneficiary_bank_account')->nullable();
            $table->string('beneficiary_bank_ifsc', 20)->nullable();
            $table->string('beneficiary_bank_branch', 100)->nullable();
            $table->string('beneficiary_bank_name', 100)->nullable();

            // ── Pipeline status ──────────────────────────────────────────────
            $table->string('status', 50)->default('NEW')->index();
            $table->json('installation_data')->nullable();               // ← absorbed patch
            $table->enum('commission_entry_status', ['none', 'partially_entered', 'all_entered'])
                ->default('none')->index();

            // ── Admin fields ─────────────────────────────────────────────────
            $table->text('query_message')->nullable();
            $table->text('admin_notes')->nullable();
            $table->date('follow_up_date')->nullable();
            $table->string('govt_application_number', 100)->nullable();
            $table->string('rejection_reason')->nullable();

            // ── Admin commission & expense tracking (top-down) ───────────────
            // Absorbed from: add_top_down_commission_fields_to_leads_table
            $table->decimal('admin_received_commission', 10, 2)->nullable();
            $table->decimal('admin_meeting_allowance', 10, 2)->nullable();
            $table->decimal('admin_additional_expenses', 10, 2)->nullable();
            $table->json('admin_other_expenses')->nullable();

            // ── Billing ──────────────────────────────────────────────────────
            $table->string('bill_serial', 50)->nullable()->unique();
            $table->date('bill_date')->nullable();
            $table->string('system_item')->nullable();
            $table->string('system_make', 100)->nullable();
            $table->string('quotation_serial', 100)->nullable();
            $table->string('receipt_serial', 100)->nullable();
            $table->decimal('quotation_base_amount', 12, 2)->nullable();
            $table->decimal('quotation_gst_amount', 12, 2)->nullable();
            $table->decimal('quotation_total_amount', 12, 2)->nullable();
            $table->decimal('receipt_amount', 12, 2)->nullable();
            $table->json('billing_items')->nullable();
            $table->decimal('billing_gst_percentage', 5, 2)->default(5.00);

            // ── Commission (legacy) ──────────────────────────────────────────
            $table->decimal('commission_amount', 10, 2)->nullable();
            $table->boolean('commission_paid')->default(false);
            $table->timestamp('commission_paid_at')->nullable();

            // ── Disbursement ─────────────────────────────────────────────────
            $table->string('disbursement_reference', 100)->nullable();
            $table->timestamp('disbursement_verified_at')->nullable();
            $table->foreignId('disbursement_verified_by')->nullable()->constrained('users')->nullOnDelete();

            // ── Dispatch link ────────────────────────────────────────────────
            $table->foreignId('dispatch_id')->nullable()->constrained('dispatches')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();
            $table->index('created_at');

            // ── Hierarchy query indexes ───────────────────────────────────────
            $table->index('assigned_agent_id',         'leads_assigned_agent_id_index');
            $table->index('assigned_super_agent_id',   'leads_assigned_super_agent_id_index');
            $table->index('assigned_admin_id',         'leads_assigned_admin_id_index');
            $table->index('submitted_by_agent_id',     'leads_submitted_by_agent_id_index');
            $table->index('submitted_by_enumerator_id','leads_submitted_by_enumerator_id_index');
            $table->index('created_by_super_agent_id', 'leads_created_by_super_agent_id_index');
            $table->index('admin_received_commission', 'idx_leads_admin_received_commission');
        });

        // ── Resolve circular FKs after both tables exist ────────────────────
        Schema::table('dispatches', function (Blueprint $table) {
            $table->foreign('lead_id')->references('id')->on('leads')->cascadeOnDelete();
        });

        // ── Add FK from users.lead_id → leads ────────────────────────────────
        Schema::table('users', function (Blueprint $table) {
            $table->foreign('lead_id')->references('id')->on('leads')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['lead_id']);
        });
        Schema::dropIfExists('leads');
        Schema::dropIfExists('dispatches');
    }
};
