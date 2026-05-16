<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('admin_ledgers', function (Blueprint $table) {
            $table->string('receipt_path')->nullable()->after('description');
            $table->enum('status', ['pending', 'approved', 'rejected', 'paid'])->default('pending')->after('receipt_path');
            $table->text('rejection_reason')->nullable()->after('status');
            $table->string('payment_method')->nullable()->after('rejection_reason');
            $table->string('payment_reference')->nullable()->after('payment_method');
            $table->timestamp('paid_at')->nullable()->after('payment_reference');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('admin_ledgers', function (Blueprint $table) {
            $table->dropColumn(['receipt_path', 'status', 'rejection_reason', 'payment_method', 'payment_reference', 'paid_at']);
        });
    }
};
