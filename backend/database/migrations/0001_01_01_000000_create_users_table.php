<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();

            // Consumer portal link (FK added in leads migration after leads table is created)
            $table->unsignedBigInteger('lead_id')->nullable();
            $table->index('lead_id');
            $table->foreignId('parent_id')->nullable()->constrained('users')->nullOnDelete();

            // Core identity
            $table->string('name');
            $table->string('father_name')->nullable();
            $table->date('dob')->nullable();
            $table->enum('gender', ['male', 'female', 'other'])->nullable();
            $table->string('blood_group', 10)->nullable();
            $table->string('religion', 100)->nullable();
            $table->enum('marital_status', ['single', 'married', 'divorced', 'widowed'])->nullable();

            // Contact
            $table->string('email')->unique();
            $table->string('mobile', 10)->unique();
            $table->string('password')->nullable();

            // Role & status
            $table->enum('role', [
                'admin', 'super_agent', 'agent', 'enumerator',
                'operator', 'super_admin', 'field_technical_team', 'consumer',
            ])->default('agent');
            $table->string('technician_type')->nullable();
            $table->json('permissions')->nullable();
            $table->enum('status', ['active', 'inactive', 'pending'])->default('pending');
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users');

            // WhatsApp & public contact
            $table->boolean('is_wa_lead_handler')->default(false); // Receives all WA leads
            $table->boolean('is_public_contact')->default(false);  // Shown on public contact page
            $table->string('whatsapp_number', 10)->nullable();      // WA number (may differ from mobile)

            // CRM codes
            $table->string('agent_id', 20)->nullable()->unique();
            $table->string('enumerator_id')->nullable()->unique();
            $table->string('super_agent_code', 20)->nullable()->unique();

            // Hierarchy
            $table->foreignId('super_agent_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_by_agent_id')->nullable()->index('idx_enumerators_by_agent');
            $table->enum('enumerator_creator_role', ['admin', 'super_agent', 'agent'])
                ->nullable()
                ->comment('For enumerator role only: who created this enumerator');
            $table->foreignId('created_by_super_agent_id')->nullable()->constrained('users')->nullOnDelete();
            $table->json('managed_states')->nullable();

            // Address
            $table->string('district')->nullable();
            $table->string('state')->nullable();
            $table->string('area')->nullable();
            $table->text('permanent_address')->nullable();
            $table->text('current_address')->nullable();
            $table->string('pincode', 10)->nullable();
            $table->string('landmark')->nullable();

            // KYC
            $table->text('aadhaar_number')->nullable();      // encrypted
            $table->string('aadhaar_document', 500)->nullable();
            $table->string('pan_number', 10)->nullable();
            $table->string('pan_document', 500)->nullable();
            $table->string('voter_id', 20)->nullable();

            // Banking
            $table->string('bank_name')->nullable();
            $table->string('bank_account_number')->nullable(); // encrypted
            $table->string('bank_ifsc', 11)->nullable();
            $table->string('bank_branch')->nullable();
            $table->string('upi_id', 100)->nullable();


            // Professional
            $table->string('occupation')->nullable();
            $table->string('qualification')->nullable();
            $table->string('education_level', 50)->nullable();
            $table->string('education_cert', 500)->nullable();
            $table->string('resume', 500)->nullable();
            $table->string('mou_signed', 500)->nullable();
            $table->unsignedTinyInteger('experience_years')->nullable();
            $table->json('languages_known')->nullable();
            $table->string('reference_name')->nullable();
            $table->string('reference_mobile', 10)->nullable();
            $table->text('territory')->nullable();
            $table->unsignedSmallInteger('target_monthly')->nullable();

            // Media
            $table->string('profile_photo')->nullable();
            $table->string('signature_image', 500)->nullable();

            // Session & auth
            $table->timestamp('last_login_at')->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->rememberToken();

            // QR
            $table->string('qr_token', 64)->nullable()->unique();
            $table->timestamp('qr_generated_at')->nullable();
            $table->timestamp('last_verified_at')->nullable();
            $table->unsignedInteger('scan_count')->default(0);

            // Misc
            $table->string('letter_number', 50)->nullable()->unique();
            $table->date('joining_date')->nullable();
            $table->date('joining_letter_valid_until')->nullable();   // Expiry date of joining letter
            $table->timestamp('joining_letter_revoked_at')->nullable(); // Set when letter is revoked

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('role');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
