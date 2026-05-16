<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Pipeline Domain Migration
 *
 * Creates: lead_survey_requirements, installer_material_dispatches,
 *          installer_material_receipts, consumer_material_verifications,
 *          installation_submissions, installation_documents,
 *          inventory_items, lead_inventory_items,
 *          pod_inspections, pod_rejection_logs,
 *          reviews, service_requests, consumer_ratings
 *
 * Absorbed patches:
 *  - add_make_to_inventory_items                                    → inventory_items.make
 *  - update_technical_tables_for_detailed_reporting                 → installer_material_receipts (condition, notes, geo_photo_1_path, geo_photo_2_path)
 *  - add_quantity_columns_to_lead_inventory_items                   → lead_inventory_items (consumed_quantity, reverted_quantity, reversion_confirmed_by/at)
 *  - add_annexure_technical_fields_to_lead_survey_requirements_table → lead_survey_requirements (inverter_rating, remote_monitoring_configured, dcdb_rating, acdb_rating, dc/ac/earth wire fields)
 *  - create_consumer_ratings_table                                  → consumer_ratings table
 *  - add_performance_indexes_and_constraints_to_crm_tables (partial) → idx_lead_inventory_items_reversion_confirmed_at, idx_inventory_items_category, chk_reverted_qty_valid
 */
return new class extends Migration {
    public function up(): void
    {
        // ─── Lead Survey Requirements ─────────────────────────────────────────
        Schema::create('lead_survey_requirements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
            $table->foreignId('technician_id')->constrained('users')->cascadeOnDelete();

            // ── System specs ─────────────────────────────────────────────────
            $table->decimal('system_capacity_kw', 8, 2);
            $table->integer('panel_quantity');
            $table->string('panel_model_make', 200);
            $table->string('inverter_model_make', 200);

            // ── Inverter & monitoring (absorbed from annexure patch) ──────────
            $table->string('inverter_rating')->nullable();
            $table->boolean('remote_monitoring_configured')->default(false);

            // ── DB/AC ratings (absorbed from annexure patch) ──────────────────
            $table->string('dcdb_rating')->nullable();
            $table->string('acdb_rating')->nullable();

            // ── Wiring details (absorbed from annexure patch) ─────────────────
            $table->decimal('wire_length_meters', 8, 2);
            $table->string('dc_wire_type')->nullable();
            $table->string('dc_wire_size')->nullable();
            $table->string('ac_wire_type')->nullable();
            $table->string('ac_wire_size')->nullable();
            $table->string('earth_wire_type')->nullable();
            $table->string('earth_wire_size')->nullable();

            // ── Accessories ──────────────────────────────────────────────────
            $table->boolean('earthing_kit_required')->default(false);
            $table->boolean('lightning_arrester_required')->default(false);
            $table->json('additional_accessories')->nullable();

            // ── Site info ────────────────────────────────────────────────────
            $table->text('site_notes')->nullable();
            $table->string('geo_photo_path', 500);
            $table->decimal('latitude', 10, 8);
            $table->decimal('longitude', 11, 8);
            $table->boolean('signed_off')->default(false);

            $table->timestamps();
        });

        // ─── Installer Material Dispatches ────────────────────────────────────
        Schema::create('installer_material_dispatches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
            $table->foreignId('dispatched_by')->constrained('users')->cascadeOnDelete();
            $table->json('items')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // ─── Installer Material Receipts ──────────────────────────────────────
        Schema::create('installer_material_receipts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
            $table->foreignId('installer_id')->constrained('users')->cascadeOnDelete();

            // ── Condition & notes (absorbed from technical reporting patch) ───
            $table->string('condition', 30)->nullable();
            $table->text('notes')->nullable();

            // ── Geo photos (absorbed from technical reporting patch) ───────────
            $table->string('geo_photo_1_path', 500)->nullable();
            $table->string('geo_photo_2_path', 500)->nullable();

            // ── Legacy geo fields ─────────────────────────────────────────────
            $table->string('geo_photo_path', 500)->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();

            $table->json('items_received')->nullable();
            $table->timestamps();
        });

        // ─── Consumer Material Verifications ──────────────────────────────────
        Schema::create('consumer_material_verifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
            $table->foreignId('consumer_id')->constrained('users')->cascadeOnDelete();
            $table->json('items_verified')->nullable();
            $table->string('geo_photo_path', 500)->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->timestamps();
        });

        // ─── Installation Submissions ─────────────────────────────────────────
        Schema::create('installation_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
            $table->foreignId('installer_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->boolean('terms_agreed')->default(false);
            $table->timestamp('terms_agreed_at')->nullable();
            $table->string('status', 30)->default('submitted');
            $table->text('rejection_reason')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
        });

        // ─── Installation Documents ───────────────────────────────────────────
        Schema::create('installation_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('installation_submission_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
            $table->string('document_key', 60);
            $table->string('model_make', 200)->nullable();
            $table->string('serial_number', 200)->nullable();
            $table->string('file_path', 500);
            $table->string('original_filename')->nullable();
            $table->string('mime_type', 100)->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->timestamp('geo_tagged_at')->nullable();
            $table->timestamps();
        });

        // ─── Inventory Items ──────────────────────────────────────────────────
        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->string('make', 100)->nullable();   // ← absorbed from add_make_to_inventory_items
            $table->string('sku', 100)->nullable()->unique();
            $table->string('category', 100)->index('idx_inventory_items_category'); // ← absorbed index
            $table->string('unit', 50)->default('piece');
            $table->text('description')->nullable();
            $table->unsignedInteger('current_stock')->default(0);
            $table->decimal('base_price', 10, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // ─── Lead Inventory Items ─────────────────────────────────────────────
        Schema::create('lead_inventory_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
            $table->foreignId('inventory_item_id')->constrained()->cascadeOnDelete();

            // ── Quantity tracking (absorbed from quantity_columns patch) ──────
            $table->unsignedInteger('quantity')->default(1);
            $table->unsignedInteger('consumed_quantity')->default(0);
            $table->unsignedInteger('reverted_quantity')->default(0);

            $table->string('serial_number', 200)->nullable();
            $table->foreignId('dispatched_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('dispatched_at')->nullable();

            // ── Reversion tracking (absorbed from quantity_columns patch) ─────
            $table->foreignId('reversion_confirmed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reversion_confirmed_at')->nullable()
                ->index('idx_lead_inventory_items_reversion_confirmed_at'); // ← absorbed index

            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // ─── POD Inspections ──────────────────────────────────────────────────
        Schema::create('pod_inspections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
            $table->foreignId('installation_submission_id')->nullable()
                ->constrained('installation_submissions')->nullOnDelete();
            $table->string('status', 30)->default('pending');
            $table->foreignId('inspected_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('inspected_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // ─── POD Rejection Logs ───────────────────────────────────────────────
        Schema::create('pod_rejection_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pod_inspection_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
            $table->foreignId('rejected_by')->constrained('users')->cascadeOnDelete();
            $table->text('reason');
            $table->timestamps();
        });

        // ─── Reviews ─────────────────────────────────────────────────────────
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
            $table->foreignId('consumer_id')->constrained('users')->cascadeOnDelete();
            $table->tinyInteger('rating');
            $table->text('comment')->nullable();
            $table->boolean('is_published')->default(false);
            $table->timestamps();
        });

        // ─── Service Requests ─────────────────────────────────────────────────
        Schema::create('service_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
            $table->foreignId('consumer_id')->constrained('users')->cascadeOnDelete();
            $table->string('type', 60)->default('general');
            $table->string('subject');
            $table->text('description');
            $table->string('status', 30)->default('open');
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('resolved_at')->nullable();
            $table->text('resolution_notes')->nullable();
            $table->timestamps();
        });

        // ─── Consumer Ratings ─────────────────────────────────────────────────
        // Absorbed from: create_consumer_ratings_table
        Schema::create('consumer_ratings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
            $table->foreignId('consumer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('rated_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('role_rated'); // 'agent', 'enumerator', 'surveyor', 'installer', 'driver'
            $table->tinyInteger('rating')->unsigned(); // 1–5
            $table->text('comments')->nullable();
            $table->timestamps();

            // A consumer can only rate a specific role once per lead
            $table->unique(['lead_id', 'consumer_id', 'role_rated'], 'consumer_role_rating_unique');
        });

        // ─── CHECK Constraints ────────────────────────────────────────────────
        // Absorbed from: add_performance_indexes_and_constraints_to_crm_tables
        DB::statement('ALTER TABLE lead_inventory_items ADD CONSTRAINT chk_reverted_qty_valid CHECK (reverted_quantity >= 0 AND reverted_quantity <= quantity)');

        // ─── Admin Stock Dispatches ───────────────────────────────────────────
        // Super Admin dispatches bulk hardware to an Admin's warehouse (not lead-specific)
        Schema::create('admin_stock_dispatches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('super_admin_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('admin_id')->constrained('users')->cascadeOnDelete();

            // Logistics / courier info
            $table->string('driver_name');
            $table->string('driver_phone', 20);
            $table->string('vehicle_number', 50);
            $table->date('expected_delivery_date')->nullable();

            $table->enum('status', ['DISPATCHED_TO_ADMIN', 'RECEIVED_BY_ADMIN', 'PARTIALLY_RECEIVED'])
                  ->default('DISPATCHED_TO_ADMIN');
            $table->timestamp('dispatched_at')->useCurrent();
            $table->timestamp('received_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['admin_id', 'status'], 'idx_admin_dispatches_status');
            $table->index(['super_admin_id', 'dispatched_at'], 'idx_superadmin_dispatches');
        });

        // ─── Admin Stock Dispatch Items ───────────────────────────────────────
        // Per-item breakdown for each admin_stock_dispatch
        Schema::create('admin_stock_dispatch_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_stock_dispatch_id')
                  ->constrained('admin_stock_dispatches')->cascadeOnDelete();
            $table->foreignId('inventory_item_id')->constrained()->cascadeOnDelete();

            $table->unsignedInteger('dispatched_quantity');
            $table->unsignedInteger('received_quantity')->nullable(); // filled on Admin receipt confirmation
            $table->enum('condition', ['good', 'damaged', 'missing'])->nullable();
            $table->json('serial_numbers')->nullable(); // for high-value items like inverters
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('admin_stock_dispatch_id');
            $table->index('inventory_item_id');
        });

        // ─── Admin Inventory Ledger ───────────────────────────────────────────
        // Tracks each Admin's personal stock — sourced ONLY from SA dispatches.
        // Admins cannot create stock; it flows from Super Admin → admin_inventory → lead_inventory_items.
        Schema::create('admin_inventory', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('inventory_item_id')->constrained()->cascadeOnDelete();

            $table->unsignedInteger('current_stock')->default(0);  // available for allocation
            $table->unsignedInteger('total_received')->default(0); // lifetime received from SA
            $table->unsignedInteger('total_consumed')->default(0); // dispatched to leads
            $table->unsignedInteger('total_reverted')->default(0); // returned by technicians

            $table->timestamps();
            $table->unique(['admin_id', 'inventory_item_id'], 'admin_item_unique');
            $table->index('admin_id', 'idx_admin_inventory_admin');
        });

        // Safety: stock can never go below 0 (enforced in MySQL/PgSQL; SQLite ignores CHECK)
        DB::statement('ALTER TABLE admin_inventory ADD CONSTRAINT chk_admin_stock_non_negative CHECK (current_stock >= 0)');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE lead_inventory_items DROP CONSTRAINT IF EXISTS chk_reverted_qty_valid');
        DB::statement('ALTER TABLE admin_inventory DROP CONSTRAINT IF EXISTS chk_admin_stock_non_negative');

        // New admin stock tables (drop children first)
        Schema::dropIfExists('admin_inventory');
        Schema::dropIfExists('admin_stock_dispatch_items');
        Schema::dropIfExists('admin_stock_dispatches');

        Schema::dropIfExists('consumer_ratings');
        Schema::dropIfExists('consumer_material_verifications');
        Schema::dropIfExists('installer_material_receipts');
        Schema::dropIfExists('installer_material_dispatches');
        Schema::dropIfExists('lead_survey_requirements');
        Schema::dropIfExists('service_requests');
        Schema::dropIfExists('reviews');
        Schema::dropIfExists('pod_rejection_logs');
        Schema::dropIfExists('pod_inspections');
        Schema::dropIfExists('lead_inventory_items');
        Schema::dropIfExists('inventory_items');
        Schema::dropIfExists('installation_documents');
        Schema::dropIfExists('installation_submissions');
    }
};
