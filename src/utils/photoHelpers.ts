import { DocumentationPhoto, MonthlySpjRecord } from '../types';

export const getDefaultPhotosForMonth = (
  month: string,
  year: number = 2026,
  existingRecord?: Partial<MonthlySpjRecord>
): DocumentationPhoto[] => {
  // If record already has valid photos, return them
  if (existingRecord?.photos && existingRecord.photos.length > 0) {
    return existingRecord.photos;
  }

  // Special preset for August (Agustusan / HUT RI Ke-81)
  if (month.toLowerCase() === 'agustus') {
    return [
      {
        id: `photo-agustus-1`,
        title: 'Malam Tirakatan HUT RI Ke 81 Tahun 2026',
        description: 'Kegiatan doa bersama, tahlil pejuang, renungan suci dan pemotongan tumpeng kemerdekaan bersama warga.',
        date: '16 Agustus 2026',
        location: 'Balai Warga RT 04 / RW 04 Ngabean',
        imageUrl: existingRecord?.meetingPhotoUrl || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
        orientation: 'landscape',
        fitMode: 'cover',
      },
      {
        id: `photo-agustus-2`,
        title: 'Malam Resepsi HUT RI Ke 81 Tahun 2026',
        description: 'Pentas seni kreasi pemuda, panggung gembira warga dan penyerahan hadiah aneka lomba 17-an.',
        date: '23 Agustus 2026',
        location: 'Panggung Kemerdekaan RT 04 Ngabean',
        imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
        orientation: 'landscape',
        fitMode: 'cover',
      },
      {
        id: `photo-agustus-3`,
        title: 'Pembelanjaan Konsumsi & Logistik HUT RI',
        description: 'Pengadaan bahan tumpeng tirakatan, snack warga, sound system dan perlengkapan panggung.',
        date: '15 Agustus 2026',
        location: 'Wilayah RT 04 Ngabean',
        imageUrl: existingRecord?.itemPhotoUrl || 'https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=800&q=80',
        orientation: 'landscape',
        fitMode: 'cover',
      },
      {
        id: `photo-agustus-4`,
        title: 'Bukti Nota / Kwitansi Pembelian Toko',
        description: 'Nota kontan sah berstempel toko untuk pembelanjaan konsumsi dan perlengkapan kegiatan.',
        date: '17 Agustus 2026',
        location: 'Toko / Rekanan Penyedia',
        imageUrl: existingRecord?.receiptPhotoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
        orientation: 'portrait', // Exemplary portrait photo
        fitMode: 'contain',
      },
    ];
  }

  // Special preset for July (Menghias Kampung & Sosialisasi BOP)
  if (month.toLowerCase() === 'juli') {
    return [
      {
        id: `photo-juli-1`,
        title: 'Rapat Warga Sosialisasi BOP RT 2026',
        description: 'Musyawarah pembahasan rencana pembelanjaan lampu hias, cat kampung dan administrasi BOP.',
        date: '06 Juli 2026',
        location: 'Kediaman Bp. Sunarno RT 04',
        imageUrl: existingRecord?.meetingPhotoUrl || 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
        orientation: 'landscape',
        fitMode: 'cover',
      },
      {
        id: `photo-juli-2`,
        title: 'Barang Belanjaan Menghias Lingkungan',
        description: 'Lampu LED, cat tembok, cat kayu, kuas, tiner dan tiang bendera untuk menyemarakkan kampung.',
        date: '12 Juli 2026',
        location: 'Pos Kamling RT 04 Ngabean',
        imageUrl: existingRecord?.itemPhotoUrl || 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80',
        orientation: 'portrait', // Exemplary portrait photo
        fitMode: 'cover',
      },
      {
        id: `photo-juli-3`,
        title: 'Nota / Kwitansi Pembelian Toko Bangunan',
        description: 'Nota asli pembelanjaan bahan cat dan perlengkapan lampu hias jalan RT 04.',
        date: '12 Juli 2026',
        location: 'Toko Bangunan & Listrik',
        imageUrl: existingRecord?.receiptPhotoUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
        orientation: 'portrait',
        fitMode: 'contain',
      },
      {
        id: `photo-juli-4`,
        title: 'Gotong Royong Pemasangan Lampu & Pengecatan',
        description: 'Warga RT 04 kerja bakti memasang tiang bendera dan mengecat portal pintu masuk kampung.',
        date: '19 Juli 2026',
        location: 'Sepanjang Jalan RT 04 RW 04',
        imageUrl: 'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?auto=format&fit=crop&w=800&q=80',
        orientation: 'landscape',
        fitMode: 'cover',
      },
    ];
  }

  // Generic fallback for other months
  return [
    {
      id: `photo-${month.toLowerCase()}-1`,
      title: `Pertemuan Rapat Rutin Warga Bulan ${month}`,
      description: `Musyawarah warga RT 04 membahas ketertiban lingkungan dan realisasi program bantuan operasional RT.`,
      date: `Pertengahan ${month} ${year}`,
      location: `Wilayah RT 04 / RW 04 Ngabean`,
      imageUrl: existingRecord?.meetingPhotoUrl || 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
      orientation: 'landscape',
      fitMode: 'cover',
    },
    {
      id: `photo-${month.toLowerCase()}-2`,
      title: `Barang Hasil Pembelanjaan Anggaran BOP Bulan ${month}`,
      description: `Bukti fisik pengadaan barang/konsumsi/operasional RT sesuai rincian RAP bulan ${month}.`,
      date: `Bulan ${month} ${year}`,
      location: `RT 04 / RW 04 Ngabean`,
      imageUrl: existingRecord?.itemPhotoUrl || 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80',
      orientation: 'landscape',
      fitMode: 'cover',
    },
    {
      id: `photo-${month.toLowerCase()}-3`,
      title: `Bukti Nota / Kwitansi Sah Pembelian Bulan ${month}`,
      description: `Nota kontan / kwitansi berstempel toko untuk pertanggungjawaban kas pembelanjaan BOP RT.`,
      date: `Bulan ${month} ${year}`,
      location: `Toko Rekanan / Penyedia`,
      imageUrl: existingRecord?.receiptPhotoUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
      orientation: 'portrait',
      fitMode: 'contain',
    },
    {
      id: `photo-${month.toLowerCase()}-4`,
      title: `Partisipasi & Dokumentasi Pendukung Kegiatan`,
      description: `Dokumentasi kebersamaan warga dalam mendukung kelancaran program pembangunan lingkungan.`,
      date: `Bulan ${month} ${year}`,
      location: `RT 04 RW 04 Kel. Gunungpati`,
      imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
      orientation: 'landscape',
      fitMode: 'cover',
    },
  ];
};
