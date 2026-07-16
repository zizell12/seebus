<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booking', function (Blueprint $table) {
            $table->id('booking_id');
            $table->string('bk_code', 20)->unique();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->unsignedBigInteger('availability_id');
            $table->unsignedBigInteger('contact_id');
            $table->integer('bk_adult_count')->default(0);
            $table->integer('bk_child_count')->default(0);
            $table->integer('bk_infant_count')->default(0);
            $table->text('bk_notes')->nullable();
            $table->decimal('bk_net_price', 10, 2);
            $table->decimal('bk_publish_price', 10, 2);
            $table->decimal('bk_total_price', 10, 2);
            $table->enum('bk_status', ['pending', 'paid', 'expired', 'cancelled'])->default('pending');
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('user_id')->references('user_id')->on('user')
                ->onDelete('set null')->onUpdate('cascade');
            $table->foreign('availability_id')->references('availability_id')->on('availability')->onUpdate('cascade');
            $table->foreign('contact_id')->references('contact_id')->on('contact')->onUpdate('cascade');
            $table->index('bk_code', 'idx_booking_code');
            $table->index('user_id', 'idx_booking_user');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking');
    }
};
