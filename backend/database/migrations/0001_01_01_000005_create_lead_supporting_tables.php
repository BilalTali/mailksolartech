<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Lead supporting tables
        Schema::create('lead_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
            $table->string('document_type');
            $table->string('file_path');
            $table->string('original_filename');
            $table->foreignId('uploaded_by')->nullable()->constrained('users');
            $table->boolean('visible_to_downline')->default(false);
            $table->string('uploaded_by_role', 50)->nullable();
            $table->timestamps();
        });

        Schema::create('lead_status_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
            $table->foreignId('changed_by')->nullable()->constrained('users');
            $table->string('from_status');
            $table->string('to_status');
            $table->text('notes')->nullable();
            $table->json('metadata')->nullable();
            $table->string('geotag_photo_path', 500)->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->string('changed_by_role', 50)->nullable();
            $table->timestamps();
        });

        Schema::create('lead_verifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
            $table->enum('action', ['verified', 'reverted']);
            $table->foreignId('performed_by')->constrained('users');
            $table->enum('performer_role', ['super_agent', 'admin', 'agent']);
            $table->text('reason')->nullable();
            $table->unsignedTinyInteger('revert_count_at_time')->default(0);
            $table->timestamp('created_at')->useCurrent();
            $table->index('action');
        });

        Schema::create('lead_technical_visits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
            $table->foreignId('technician_id')->constrained('users')->cascadeOnDelete();
            $table->string('visit_type');
            $table->string('selfie_url')->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->timestamp('terms_agreed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_technical_visits');
        Schema::dropIfExists('lead_verifications');
        Schema::dropIfExists('lead_status_logs');
        Schema::dropIfExists('lead_documents');
    }
};
