<?php

namespace Tests\Feature;

use App\Http\Controllers\Api\Admin\AdminBookingController;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class PhaseOneReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_report_returns_empty_rollup_on_sqlite(): void
    {
        $request = Request::create('/api/admin/booking/rekap', 'GET', [
            'mode' => 'harian',
            'dari' => '2026-09-01',
            'sampai' => '2026-09-30',
        ]);

        $response = (new AdminBookingController())->rekap($request)->getData(true);

        $this->assertSame(0, $response['ringkasan']['jumlah_tiket']);
        $this->assertEquals(0, $response['ringkasan']['pendapatan_tiket']);
        $this->assertSame([], $response['rincian']);
    }

    public function test_report_rejects_reversed_date_range(): void
    {
        $request = Request::create('/api/admin/booking/rekap', 'GET', [
            'mode' => 'harian',
            'dari' => '2026-09-30',
            'sampai' => '2026-09-01',
        ]);

        $this->expectException(ValidationException::class);

        (new AdminBookingController())->rekap($request);
    }
}