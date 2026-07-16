// Data contoh — nantinya diganti dengan fetch ke API Laravel
export const kotaList = [
  'Jember', 'Surabaya', 'Malang', 'Banyuwangi', 'Bali (Denpasar)',
  'Yogyakarta', 'Semarang', 'Bandung', 'Jakarta',
]

export const kotaWisataPopuler = [
  {
    slug: 'banyuwangi',
    nama: 'Banyuwangi',
    deskripsi: 'Terkenal dengan pesona alam mulai dari sunrise di Kawah Ijen',
    gambar: 'https://images.unsplash.com/photo-1554282783-cee1b1b06c96?w=600',
  },
  {
    slug: 'bali',
    nama: 'Bali',
    deskripsi: 'Pulau dewata dengan pantai dan budaya yang mendunia',
    gambar: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=600',
  },
  {
    slug: 'malang',
    nama: 'Malang',
    deskripsi: 'Kota sejuk dengan wisata alam dan kuliner khas',
    gambar: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=600',
  },
]

export const armadaKategori = [
  { id: 'economy', nama: 'Ekonomi', fasilitas: ['AC', 'Kursi Standar'], multiplier: 1 },
  { id: 'executive', nama: 'Eksekutif', fasilitas: ['AC', 'Reclining Seat', 'Bantal & Selimut'], multiplier: 1.5 },
  { id: 'suite', nama: 'Suite Class', fasilitas: ['AC', 'Kursi 2-2', 'Snack', 'USB Charger'], multiplier: 2 },
]
