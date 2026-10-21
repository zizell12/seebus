<?php

namespace Tests\Feature;

use App\Models\Passenger;
use App\Support\CsvSafe;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsBookingFixtures;
use Tests\TestCase;

class CsvSafeTest extends TestCase
{
    use BuildsBookingFixtures;
    use RefreshDatabase;

    public function test_formula_prefixes_are_quoted_and_regular_text_is_unchanged(): void
    {
        foreach (['=', '+', '-', '@'] as $prefix) {
            $this->assertSame("'{$prefix}formula", CsvSafe::cell("{$prefix}formula"));
        }

        $this->assertSame('Teks biasa', CsvSafe::cell('Teks biasa'));
        $this->assertSame(123, CsvSafe::cell(123));
    }

    public function test_manifest_export_escapes_passenger_formula(): void
    {
        $booking = $this->makeBooking();
        Passenger::where('booking_id', $booking->booking_id)->firstOrFail()->update(['ps_name' => '=1+1']);
        Sanctum::actingAs($this->makeAdmin());

        $csv = $this->get('/api/admin/manifest/'.$booking->availability_id.'/csv')
            ->assertOk()
            ->streamedContent();

        $this->assertStringContainsString(",'=1+1,", $csv);
        $this->assertStringNotContainsString(',=1+1,', $csv);
    }
}
