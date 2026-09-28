<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $allBusTypes = DB::table('bus_type')->orderBy('bus_type_id')->get();

        // 1) Tentukan baris "canonical" (paling awal dibuat) per kombinasi
        //    nama kelas + perusahaan. Ini yang nanti jadi 3 baris bus_type
        //    yang tersisa (Ekonomi / Eksekutif / Sleeper).
        $canonicalIdByGroup = [];
        foreach ($allBusTypes as $bt) {
            $groupKey = mb_strtolower(trim($bt->bt_name)).'|'.$bt->company_id;
            if (!isset($canonicalIdByGroup[$groupKey])) {
                $canonicalIdByGroup[$groupKey] = $bt->bus_type_id;
            }
        }

        // 2) Ubah SETIAP baris bus_type (baik yang canonical maupun yang
        //    "duplikat") jadi 1 baris bus_unit -- supaya data fasilitas &
        //    kapasitas yang sudah ada tidak hilang, cuma dipindah tempatnya.
        //    Simpan pemetaan bus_type_id lama -> bus_unit_id baru untuk
        //    dipakai backfill availability di langkah 3.
        $busTypeIdToBusUnitId = [];
        $unitCounter = [];

        foreach ($allBusTypes as $bt) {
            $groupKey = mb_strtolower(trim($bt->bt_name)).'|'.$bt->company_id;
            $canonicalId = $canonicalIdByGroup[$groupKey];

            $companyName = DB::table('company')->where('company_id', $bt->company_id)->value('co_name') ?? 'bus';
            $unitCounter[$groupKey] = ($unitCounter[$groupKey] ?? 0) + 1;

            $facilities = $bt->bt_facilities
                ? array_values(array_filter(array_map('trim', explode(',', $bt->bt_facilities))))
                : [];

            $busUnitId = DB::table('bus_unit')->insertGetId([
                'bus_type_id' => $canonicalId,
                'bu_code' => mb_strtolower(trim($companyName)).' unit '.$unitCounter[$groupKey],
                'bu_plate_number' => null,
                'bu_capacity' => $bt->bt_capacity,
                'bu_facilities' => json_encode($facilities),
                'is_active' => true,
                'created_at' => now(),
            ]);

            $busTypeIdToBusUnitId[$bt->bus_type_id] = $busUnitId;
        }

        // 3) Backfill availability.bus_unit_id berdasarkan bus_type_id lama
        //    yang tadinya dipakai baris itu -- jadwal lama tetap terhubung
        //    ke "profil bus" yang sama persis, cuma sekarang lewat bus_unit.
        foreach ($busTypeIdToBusUnitId as $oldBusTypeId => $newBusUnitId) {
            DB::table('availability')
                ->where('bus_type_id', $oldBusTypeId)
                ->update(['bus_unit_id' => $newBusUnitId]);
        }

        // 4) PENTING: kolom availability.bus_type_id (yang lama) masih ada
        //    dan masih dikunci foreign key sampai migration berikutnya.
        //    Sebelum baris bus_type duplikat dihapus, semua referensi ke
        //    baris itu harus dipindah dulu ke baris canonical-nya --
        //    kalau tidak, database bakal menolak penghapusan (error 1451).
        foreach ($allBusTypes as $bt) {
            $groupKey = mb_strtolower(trim($bt->bt_name)).'|'.$bt->company_id;
            $canonicalId = $canonicalIdByGroup[$groupKey];

            if ($bt->bus_type_id !== $canonicalId) {
                DB::table('availability')
                    ->where('bus_type_id', $bt->bus_type_id)
                    ->update(['bus_type_id' => $canonicalId]);
            }
        }

        // 5) Baru sekarang aman hapus baris bus_type yang bukan canonical --
        //    sisakan cuma 3 baris kelas generik.
        $nonCanonicalIds = array_diff(
            $allBusTypes->pluck('bus_type_id')->all(),
            array_values($canonicalIdByGroup)
        );
        if (!empty($nonCanonicalIds)) {
            DB::table('bus_type')->whereIn('bus_type_id', $nonCanonicalIds)->delete();
        }
    }

    public function down(): void
    {
        // Data migration searah -- tidak didesain untuk rollback otomatis.
        // Kalau perlu batal, pulihkan dari backup .sql sebelum migration ini.
    }
};