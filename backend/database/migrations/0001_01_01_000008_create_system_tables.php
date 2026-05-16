<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 100);
            $table->string('title');
            $table->text('message');
            $table->json('data')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });

        Schema::create('login_otps', function (Blueprint $table) {
            $table->id();
            $table->string('email')->index();
            $table->string('otp');
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->timestamp('expires_at')->useCurrent()->useCurrentOnUpdate();
            $table->timestamps();
        });

        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('group', 50)->nullable();
            $table->timestamps();
        });

        Schema::create('crm_options', function (Blueprint $table) {
            $table->id();
            $table->string('category')->index();
            $table->string('label');
            $table->string('value');
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('faqs', function (Blueprint $table) {
            $table->id();
            $table->string('question');
            $table->text('answer');
            $table->string('category')->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_published')->default(true);
            $table->timestamps();
        });

        Schema::create('push_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->morphs('subscribable');
            $table->string('endpoint', 500)->unique();
            $table->string('public_key')->nullable();
            $table->string('auth_token')->nullable();
            $table->string('content_encoding')->nullable();
            $table->timestamps();
        });

        Schema::create('qr_scan_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->timestamp('scanned_at')->useCurrent();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->string('referer', 500)->nullable();
            $table->index(['user_id', 'scanned_at'], 'idx_user_scanned');
        });

        Schema::create('super_agent_team_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('super_agent_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('agent_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('assigned_by')->constrained('users');
            $table->timestamp('assigned_at');
            $table->timestamp('unassigned_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['super_agent_id', 'agent_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('super_agent_team_logs');
        Schema::dropIfExists('qr_scan_logs');
        Schema::dropIfExists('push_subscriptions');
        Schema::dropIfExists('faqs');
        Schema::dropIfExists('crm_options');
        Schema::dropIfExists('settings');
        Schema::dropIfExists('login_otps');
        Schema::dropIfExists('notifications');
    }
};
