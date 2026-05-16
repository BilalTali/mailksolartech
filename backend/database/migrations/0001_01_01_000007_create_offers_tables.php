<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('offers', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('prize_label');
            $table->decimal('prize_amount', 10, 2)->nullable();
            $table->string('prize_image_path')->nullable();
            $table->enum('offer_type', ['individual', 'collective'])->default('individual');
            $table->enum('visible_to', ['agents', 'super_agents', 'both'])->default('both');
            $table->decimal('target_points', 10, 2)->default(0);
            $table->timestamp('offer_from')->nullable();
            $table->timestamp('offer_to')->nullable();
            $table->integer('grace_period_days')->default(7);
            $table->enum('status', ['draft', 'active', 'ended'])->default('draft');
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_annual')->default(false);
            $table->integer('display_order')->default(0);
            $table->decimal('current_points', 10, 2)->default(0);
            $table->boolean('collective_redeemed')->default(false);
            $table->timestamp('collective_redeemed_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('absorption_processed_at')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('offer_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('offer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('role_context', ['agent', 'super_agent'])->default('agent');
            $table->decimal('total_points', 8, 2)->default(0);
            $table->decimal('redeemed_points', 8, 2)->default(0);
            $table->decimal('unredeemed_points', 8, 2)->default(0);
            $table->integer('redemption_count')->default(0);
            $table->boolean('can_redeem')->default(false);
            $table->integer('pending_redemption_count')->default(0);
            $table->timestamp('first_installation_at')->nullable();
            $table->timestamp('last_installation_at')->nullable();
            $table->timestamp('last_redeemed_at')->nullable();
            $table->timestamp('offer_ended_zeroed_at')->nullable();
            $table->timestamps();
            $table->unique(['offer_id', 'user_id']);
        });

        Schema::create('offer_installation_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('offer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
            $table->decimal('points_awarded', 8, 2)->default(0);
            $table->timestamp('installed_at')->useCurrent()->useCurrentOnUpdate();
            $table->timestamps();
            $table->unique(['offer_id', 'lead_id']);
        });

        Schema::create('offer_redemptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('offer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->integer('redemption_number');
            $table->decimal('points_used', 8, 2);
            $table->enum('status', ['pending', 'admin_approved', 'approved', 'delivered', 'rejected', 'cancelled'])->nullable()->default('pending');
            $table->foreignId('admin_approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('claimed_at')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('admin_approved_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamps();
        });

        Schema::create('super_agent_absorbed_points', function (Blueprint $table) {
            $table->id();
            $table->foreignId('offer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('super_agent_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->foreignId('source_agent_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('lead_id')->nullable()->constrained('leads')->nullOnDelete();
            $table->decimal('absorbed_points', 8, 2)->default(0);
            $table->decimal('absorbed_installations', 8, 2)->default(0);
            $table->string('status', 30)->default('unclaimed');
            $table->timestamp('absorbed_at')->nullable();
            $table->timestamp('claimed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('offer_expiry_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('offer_id')->constrained()->cascadeOnDelete();
            $table->integer('agents_processed');
            $table->integer('agents_absorbed');
            $table->integer('agents_grace_period_expired');
            $table->decimal('total_points_absorbed', 8, 2);
            $table->decimal('total_points_discarded', 8, 2);
            $table->json('agent_breakdown');
            $table->timestamp('processed_at')->useCurrent()->useCurrentOnUpdate();
            $table->timestamps();
        });

        Schema::create('withdrawal_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('offer_id')->nullable()->constrained()->nullOnDelete();
            $table->integer('points_withdrawn');
            $table->decimal('amount', 10, 2)->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected', 'paid'])->default('pending');
            $table->text('admin_notes')->nullable();
            $table->string('payment_method')->nullable();
            $table->text('payment_details')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('withdrawal_requests');
        Schema::dropIfExists('offer_expiry_logs');
        Schema::dropIfExists('super_agent_absorbed_points');
        Schema::dropIfExists('offer_redemptions');
        Schema::dropIfExists('offer_installation_logs');
        Schema::dropIfExists('offer_progress');
        Schema::dropIfExists('offers');
    }
};
