<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('booking', function (Blueprint $table) {
            $table->string('bk_paypal_capture_id', 100)->nullable();
            $table->decimal('bk_paid_usd', 14, 2)->nullable();
            $table->timestamp('bk_cancelled_at')->nullable();
            $table->string('bk_cancel_reason', 255)->nullable();
            $table->unsignedBigInteger('bk_cancelled_by')->nullable();
            $table->unsignedTinyInteger('bk_refund_percent')->nullable();
            $table->decimal('bk_refund_amount', 14, 2)->nullable();
            $table->decimal('bk_refund_usd', 14, 2)->nullable();
            $table->string('bk_paypal_refund_id', 100)->nullable();
            $table->timestamp('bk_refunded_at')->nullable();
            $table->index(['bk_cancelled_at']);

            $table->index('bk_paypal_capture_id');
        });
    }

    public function down(): void
    {
        Schema::table('booking', function (Blueprint $table) {
            $table->dropIndex(['bk_paypal_capture_id']);
            $table->dropIndex(['bk_cancelled_at']);
            $table->dropColumn(['bk_paypal_capture_id', 'bk_paid_usd', 'bk_cancelled_at', 'bk_cancel_reason', 'bk_cancelled_by', 'bk_refund_percent', 'bk_refund_amount', 'bk_refund_usd', 'bk_paypal_refund_id', 'bk_refunded_at']);
        });
    }
};
