export const provinsiPopuler = [
  'Jawa Barat',
  'DKI Jakarta',
  'Jawa Tengah',
  'Jawa Timur',
  'DI Yogyakarta',
  'Banten',
  'Bali',
  'Sumatera Utara',
  'Sumatera Barat',
  'Sumatera Selatan',
  'Riau',
  'Jambi',
  'Lampung',
]
export const dataWilayah = {
  'Jawa Barat': {
    gambar: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?w=200',
    jumlahKota: 27,
    jumlahTerminal: 145,
    kota: [
      {
        nama: 'Kota Bandung',
        terminals: [
          {
            kecamatan: 'Kec. Bojongloa Kidul',
            nama: 'Terminal Leuwipanjang',
            tipe: 'Tipe A',
            keterangan: 'Jalur Lintas Selatan',
          },
          {
            kecamatan: 'Kec. Antapani',
            nama: 'Terminal Cicaheum',
            tipe: 'Tipe A',
            keterangan: 'Jalur Lintas Timur',
          },
        ],
      },
      {
        nama: 'Kota Bogor',
        terminals: [
          {
            kecamatan: 'Kec. Bogor Timur',
            nama: 'Terminal Baranangsiang',
            tipe: 'Tipe A',
            keterangan: 'Gerbang Utama',
          },
        ],
      },
    ],
  },
  'DKI Jakarta': {
    gambar: 'https://images.unsplash.com/photo-1555899434-94d1368aa7af?w=200',
    jumlahKota: 6,
    jumlahTerminal: 18,
    kota: [
      {
        nama: 'Jakarta Timur',
        terminals: [
          {
            kecamatan: 'Kec. Cakung',
            nama: 'Terminal Pulo Gebang',
            tipe: 'Tipe A',
            keterangan: 'Terminal Terbesar Asia Tenggara',
          },
        ],
      },
      {
        nama: 'Jakarta Timur (Kramat Jati)',
        terminals: [
          {
            kecamatan: 'Kec. Kramat Jati',
            nama: 'Terminal Kampung Rambutan',
            tipe: 'Tipe A',
            keterangan: 'Jalur Lintas Selatan',
          },
        ],
      },
    ],
  },
  'Jawa Tengah': {
    gambar: 'https://images.unsplash.com/photo-1596395463970-4c78f3c5e8e0?w=200',
    jumlahKota: 29,
    jumlahTerminal: 96,
    kota: [
      {
        nama: 'Kota Semarang',
        terminals: [
          {
            kecamatan: 'Kec. Genuk',
            nama: 'Terminal Terboyo',
            tipe: 'Tipe A',
            keterangan: 'Pusat Kota',
          },
        ],
      },
      {
        nama: 'Kota Salatiga',
        terminals: [
          {
            kecamatan: 'Kec. Argomulyo',
            nama: 'Terminal Tingkir',
            tipe: 'Tipe A',
            keterangan: 'Jalur Lintas Selatan Jawa',
          },
        ],
      },
    ],
  },
  'Jawa Timur': {
    gambar: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=200',
    jumlahKota: 38,
    jumlahTerminal: 122,
    kota: [
      {
        nama: 'Kota Surabaya',
        terminals: [
          {
            kecamatan: 'Kec. Waru',
            nama: 'Terminal Purabaya (Bungurasih)',
            tipe: 'Tipe A',
            keterangan: 'Terminal Terbesar Jawa Timur',
          },
        ],
      },
      {
        nama: 'Kota Malang',
        terminals: [
          {
            kecamatan: 'Kec. Blimbing',
            nama: 'Terminal Arjosari',
            tipe: 'Tipe A',
            keterangan: 'Jalur Lintas Timur',
          },
        ],
      },
    ],
  },
  'DI Yogyakarta': {
    gambar: 'https://images.unsplash.com/photo-1584810359583-96fc9d6d9c0e?w=200',
    jumlahKota: 5,
    jumlahTerminal: 14,
    kota: [
      {
        nama: 'Kota Yogyakarta',
        terminals: [
          {
            kecamatan: 'Kec. Umbulharjo',
            nama: 'Terminal Giwangan',
            tipe: 'Tipe A',
            keterangan: 'Pusat Kota',
          },
        ],
      },
    ],
  },
  Banten: {
    gambar: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=200',
    jumlahKota: 8,
    jumlahTerminal: 21,
    kota: [
      {
        nama: 'Kota Tangerang',
        terminals: [
          {
            kecamatan: 'Kec. Cipondoh',
            nama: 'Terminal Poris Plawad',
            tipe: 'Tipe A',
            keterangan: 'Jalur Lintas Barat',
          },
        ],
      },
    ],
  },
  Bali: {
    gambar: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=200',
    jumlahKota: 9,
    jumlahTerminal: 12,
    kota: [
      {
        nama: 'Kabupaten Badung',
        terminals: [
          {
            kecamatan: 'Kec. Mengwi',
            nama: 'Terminal Mengwi',
            tipe: 'Tipe A',
            keterangan: 'Terminal Induk Terbesar di Bali',
          },
        ],
      },
      {
        nama: 'Kota Denpasar',
        terminals: [
          {
            kecamatan: 'Kec. Denpasar Utara',
            nama: 'Terminal Ubung',
            tipe: 'Tipe B',
            keterangan: 'Gerbang Barat Kota Denpasar',
          },
        ],
      },
    ],
  },
  'Sumatera Utara': {
    gambar: 'https://images.unsplash.com/photo-1604999565976-8913ad2ddb7c?w=200',
    jumlahKota: 33,
    jumlahTerminal: 40,
    kota: [
      {
        nama: 'Kota Medan',
        terminals: [
          {
            kecamatan: 'Kec. Medan Amplas',
            nama: 'Terminal Amplas',
            tipe: 'Tipe A',
            keterangan: 'Direvitalisasi via SBSN',
          },
        ],
      },
      {
        nama: 'Kota Pematang Siantar',
        terminals: [
          {
            kecamatan: 'Kec. Siantar Martoba',
            nama: 'Terminal Tanjung Pinggir',
            tipe: 'Tipe A',
            keterangan: 'Jalur Lintas Sumatra Bagian Utara',
          },
        ],
      },
    ],
  },
  'Sumatera Barat': {
    gambar: 'https://images.unsplash.com/photo-1600180758890-6b94519a8ba6?w=200',
    jumlahKota: 19,
    jumlahTerminal: 25,
    kota: [
      {
        nama: 'Kota Padang',
        terminals: [
          {
            kecamatan: 'Kec. Koto Tangah',
            nama: 'Terminal Anak Air',
            tipe: 'Tipe A',
            keterangan: 'Pusat AKAP & AKDP Sumbar',
          },
        ],
      },
      {
        nama: 'Kota Pariaman',
        terminals: [
          {
            kecamatan: 'Kec. Pariaman Tengah',
            nama: 'Terminal Jati Pariaman',
            tipe: 'Tipe A',
            keterangan: 'Poros Jalan Nasional Padang - Pasaman',
          },
        ],
      },
      {
        nama: 'Kota Bukittinggi',
        terminals: [
          {
            kecamatan: 'Kec. Aur Birugo Tigo Baleh',
            nama: 'Terminal Simpang Aur',
            tipe: 'Tipe A',
            keterangan: 'Pintu Gerbang Utama Bukittinggi',
          },
        ],
      },
    ],
  },
  'Sumatera Selatan': {
    gambar: 'https://images.unsplash.com/photo-1596395463970-4c78f3c5e8e0?w=200',
    jumlahKota: 17,
    jumlahTerminal: 22,
    kota: [
      {
        nama: 'Kota Palembang',
        terminals: [
          {
            kecamatan: 'Kec. Alang-Alang Lebar',
            nama: 'Terminal Alang-Alang Lebar (AAL)',
            tipe: 'Tipe A',
            keterangan: 'Terminal Terbesar & Utama Palembang',
          },
        ],
      },
    ],
  },
  Riau: {
    gambar: 'https://images.unsplash.com/photo-1580820267682-426da823b514?w=200',
    jumlahKota: 12,
    jumlahTerminal: 15,
    kota: [
      {
        nama: 'Kota Pekanbaru',
        terminals: [
          {
            kecamatan: 'Kec. Payung Sekaki',
            nama: 'Terminal Bandar Raya Payung Sekaki (BRPS)',
            tipe: 'Tipe A',
            keterangan: 'Dibangun 2006, luas 27 hektar',
          },
        ],
      },
    ],
  },
  Jambi: {
    gambar: 'https://images.unsplash.com/photo-1580820267682-426da823b514?w=200',
    jumlahKota: 11,
    jumlahTerminal: 13,
    kota: [
      {
        nama: 'Kota Jambi',
        terminals: [
          {
            kecamatan: 'Kec. Alam Barajo',
            nama: 'Terminal Alam Barajo',
            tipe: 'Tipe A',
            keterangan: 'Terminal Utama Kota Jambi',
          },
        ],
      },
      {
        nama: 'Kabupaten Bungo',
        terminals: [
          {
            kecamatan: 'Kec. Bathin III',
            nama: 'Terminal Muara Bungo',
            tipe: 'Tipe A',
            keterangan: 'Jalur Lintas Sumatra',
          },
        ],
      },
    ],
  },
  Lampung: {
    gambar: 'https://images.unsplash.com/photo-1600180758890-6b94519a8ba6?w=200',
    jumlahKota: 15,
    jumlahTerminal: 20,
    kota: [
      {
        nama: 'Kota Bandar Lampung',
        terminals: [
          {
            kecamatan: 'Kec. Panjang',
            nama: 'Terminal Rajabasa',
            tipe: 'Tipe A',
            keterangan: 'Kapasitas hingga 500 bus/hari',
          },
        ],
      },
      {
        nama: 'Kabupaten Tulang Bawang',
        terminals: [
          {
            kecamatan: 'Kec. Menggala',
            nama: 'Terminal Menggala',
            tipe: 'Tipe A',
            keterangan: 'Jalur Lintas Timur Sumatra',
          },
        ],
      },
    ],
  },
}
export const totalTerminalAktif = '1.240+'
