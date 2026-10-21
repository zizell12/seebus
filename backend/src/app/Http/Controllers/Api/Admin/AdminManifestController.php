<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Availability;
use App\Support\CsvSafe;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminManifestController extends Controller
{
    public function show(int $availabilityId): JsonResponse
    {
        return response()->json(['data' => $this->manifestData($availabilityId)]);
    }

    public function export(int $availabilityId): StreamedResponse
    {
        $manifest = $this->manifestData($availabilityId);

        return response()->streamDownload(function () use ($manifest) {
            $stream = fopen('php://output', 'w');
            fputcsv($stream, [
                'Jenis', 'Titik', 'Jumlah naik', 'Jumlah turun', 'ID booking',
                'Kode booking', 'Penumpang', 'Kategori', 'Kursi', 'Kontak',
                'Telepon', 'Naik dari', 'Turun di',
            ]);

            foreach ($manifest['ringkasan_titik'] as $stop) {
                fputcsv($stream, [
                    CsvSafe::cell('Ringkasan titik'), CsvSafe::cell($stop['nama']), $stop['jumlah_naik'], $stop['jumlah_turun'],
                    '', '', '', '', '', '', '', '', '',
                ]);
            }

            foreach ($manifest['penumpang'] as $passenger) {
                fputcsv($stream, [
                    CsvSafe::cell('Penumpang'), '', '', '', $passenger['booking_id'], CsvSafe::cell($passenger['bk_code']),
                    CsvSafe::cell($passenger['ps_name']), CsvSafe::cell($passenger['ps_category']), CsvSafe::cell($passenger['label_kursi']),
                    CsvSafe::cell($passenger['kontak_nama']), CsvSafe::cell($passenger['kontak_telepon']),
                    CsvSafe::cell($passenger['naik_dari']), CsvSafe::cell($passenger['turun_di']),
                ]);
            }
            fclose($stream);
        }, "manifest-{$availabilityId}.csv", [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    private function manifestData(int $availabilityId): array
    {
        $availability = Availability::with([
            'route.originStation',
            'route.destinationStation',
            'busUnit.busType.company',
            'route.stops.station',
            'bookings' => fn ($query) => $query->where('bk_status', 'paid')
                ->with([
                    'contact',
                    'passengers.fromStop.station',
                    'passengers.toStop.station',
                ]),
        ])->findOrFail($availabilityId);

        $passengers = $availability->bookings
            ->flatMap(fn ($booking) => $booking->passengers->map(fn ($passenger) => [
                'booking_id' => $booking->booking_id,
                'bk_code' => $booking->bk_code,
                'kontak_nama' => $booking->contact?->ct_name,
                'kontak_telepon' => $booking->contact?->ct_phone,
                'ps_name' => $passenger->ps_name,
                'ps_category' => $passenger->ps_category,
                'ps_age' => $passenger->ps_age,
                'ps_gender' => $passenger->ps_gender,
                'ps_seat_number' => $passenger->ps_seat_number === null
                    ? null
                    : mb_strtoupper($passenger->ps_seat_number),
                'label_kursi' => $passenger->ps_category === 'infant'
                    ? 'Tidak mendapat kursi'
                    : ($availability->busUnit?->busType?->bt_use_seat_number
                        ? ($passenger->ps_seat_number === null ? 'Belum ditentukan' : mb_strtoupper($passenger->ps_seat_number))
                        : 'Bebas'),
                'naik_stop_id' => $passenger->from_stop_id,
                'turun_stop_id' => $passenger->to_stop_id,
                'naik_dari' => $passenger->fromStop?->station?->stn_name,
                'turun_di' => $passenger->toStop?->station?->stn_name,
                'naik_order' => $passenger->fromStop?->stop_order,
            ]))
            ->sortBy(['naik_order', 'ps_name'])
            ->values()
            ->map(fn ($passenger) => collect($passenger)->except('naik_order')->all());

        $ringkasanTitik = $availability->route?->stops->map(fn ($stop) => [
            'route_stop_id' => $stop->route_stop_id,
            'nama' => $stop->station?->stn_name,
            'stop_order' => $stop->stop_order,
            'jumlah_naik' => $passengers->where('naik_stop_id', $stop->route_stop_id)->count(),
            'jumlah_turun' => $passengers->where('turun_stop_id', $stop->route_stop_id)->count(),
        ])->values() ?? collect();
        $passengers = $passengers->map(fn ($passenger) => collect($passenger)
            ->except(['naik_order', 'naik_stop_id', 'turun_stop_id'])
            ->all());

        return [
            'availability_id' => $availability->availability_id,
            'tanggal' => $availability->av_date?->toDateString(),
            'jam' => substr((string) $availability->av_time, 0, 5),
            'operator' => $availability->busUnit?->busType?->company?->co_name,
            'kelas' => $availability->busUnit?->busType?->bt_name,
            'pakai_nomor_kursi' => (bool) $availability->busUnit?->busType?->bt_use_seat_number,
            'armada' => $availability->busUnit?->bu_code,
            'asal' => $availability->route?->originStation?->stn_name,
            'tujuan' => $availability->route?->destinationStation?->stn_name,
            'ringkasan_titik' => $ringkasanTitik,
            'penumpang' => $passengers,
        ];
    }
}
