import React, { useState } from 'react';
import { MonthlySpjRecord, RtProfile, RapItem, DocumentationPhoto } from '../types';
import { formatRupiah } from '../utils/formatters';
import { 
  FileCheck, 
  Printer, 
  Save, 
  Image, 
  Users, 
  FileText, 
  CheckCircle2, 
  Camera, 
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { executePrint } from '../utils/printHelper';
import { FotoDokumentasiLampiran } from './FotoDokumentasiLampiran';
import { getDefaultPhotosForMonth } from '../utils/photoHelpers';

interface MonthlySpjManagerProps {
  profile: RtProfile;
  rapItems: RapItem[];
  spjRecords: MonthlySpjRecord[];
  onSaveSpj: (records: MonthlySpjRecord[]) => void;
  onNavigateToNotulen?: () => void;
}

export const MonthlySpjManager: React.FC<MonthlySpjManagerProps> = ({
  profile,
  rapItems,
  spjRecords,
  onSaveSpj,
  onNavigateToNotulen,
}) => {
  const [selectedMonth, setSelectedMonth] = useState('Agustus');
  const [viewMode, setViewMode] = useState<'spj' | 'foto-terpisah' | 'all'>('foto-terpisah');

  const months = [
    'Januari',
    'Pebruari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  // Find or create record for selected month
  const foundRecord = spjRecords.find((s) => s.month === selectedMonth);
  const initialPhotos = getDefaultPhotosForMonth(selectedMonth, profile.year, foundRecord);

  const currentRecord: MonthlySpjRecord = foundRecord || {
    id: `spj-${selectedMonth.toLowerCase()}`,
    month: selectedMonth,
    year: profile.year,
    notulenRt: `Notulen rapat rutin warga RT ${profile.rtNumber} bulan ${selectedMonth} ${profile.year}. Membahas kegiatan warga, kebersihan, dan pelaksanaan program BOP RT.`,
    notulenPkk: `Notulen rapat PKK bulan ${selectedMonth} ${profile.year}. Membahas arisan, pemberdayaan, dan konsumsi pertemuan.`,
    attendanceCount: 40,
    attendanceNotes: 'Daftar hadir warga terlampir.',
    meetingPhotoUrl: initialPhotos[0]?.imageUrl || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
    itemPhotoUrl: initialPhotos[1]?.imageUrl || 'https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=800&q=80',
    receiptPhotoUrl: initialPhotos[2]?.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    photos: initialPhotos,
  };

  const [formState, setFormState] = useState<MonthlySpjRecord>({
    ...currentRecord,
    photos: currentRecord.photos && currentRecord.photos.length > 0 ? currentRecord.photos : initialPhotos,
  });

  // When selectedMonth changes, update formState
  const handleMonthChange = (m: string) => {
    setSelectedMonth(m);
    const found = spjRecords.find((s) => s.month === m);
    if (found) {
      const photos = found.photos && found.photos.length > 0
        ? found.photos
        : getDefaultPhotosForMonth(m, profile.year, found);
      setFormState({ ...found, photos });
    } else {
      const newPhotos = getDefaultPhotosForMonth(m, profile.year);
      setFormState({
        id: `spj-${m.toLowerCase()}`,
        month: m,
        year: profile.year,
        notulenRt: `Notulen rapat rutin warga RT ${profile.rtNumber} bulan ${m} ${profile.year}. Membahas kegiatan warga dan pelaksanaan anggaran.`,
        notulenPkk: `Notulen rapat PKK bulan ${m} ${profile.year}. Membahas program PKK dan konsumsi.`,
        attendanceCount: 40,
        attendanceNotes: 'Daftar hadir warga terlampir.',
        meetingPhotoUrl: newPhotos[0]?.imageUrl || '',
        itemPhotoUrl: newPhotos[1]?.imageUrl || '',
        receiptPhotoUrl: newPhotos[2]?.imageUrl || '',
        photos: newPhotos,
      });
    }
  };

  const handleUpdatePhotos = (newPhotos: DocumentationPhoto[]) => {
    setFormState((prev) => ({
      ...prev,
      photos: newPhotos,
      meetingPhotoUrl: newPhotos[0]?.imageUrl || prev.meetingPhotoUrl,
      itemPhotoUrl: newPhotos[1]?.imageUrl || prev.itemPhotoUrl,
      receiptPhotoUrl: newPhotos[2]?.imageUrl || prev.receiptPhotoUrl,
    }));
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const existingIndex = spjRecords.findIndex((s) => s.month === selectedMonth);
    let updated: MonthlySpjRecord[];
    if (existingIndex >= 0) {
      updated = [...spjRecords];
      updated[existingIndex] = formState;
    } else {
      updated = [...spjRecords, formState];
    }
    onSaveSpj(updated);
    alert(`Berkas Pelaporan SPJ & Lampiran Foto Bulan ${selectedMonth} berhasil disimpan!`);
  };

  const handlePrintCurrentView = () => {
    executePrint(`SPJ Pelaporan & Foto - Bulan ${selectedMonth} ${profile.year}`);
  };

  const handlePrintPhotosOnly = () => {
    setViewMode('foto-terpisah');
    setTimeout(() => {
      executePrint(`Lampiran Foto Dokumentasi - Bulan ${selectedMonth} ${profile.year}`);
    }, 200);
  };

  const handlePrintSpjOnly = () => {
    setViewMode('spj');
    setTimeout(() => {
      executePrint(`Dokumen SPJ Bulanan - Bulan ${selectedMonth} ${profile.year}`);
    }, 200);
  };

  // RAP items for this month
  const monthRapItems = rapItems.filter((item) => item.month === selectedMonth);
  const totalRapMonth = monthRapItems.reduce((acc, curr) => acc + curr.total, 0);

  const photosList = formState.photos || initialPhotos;
  const portraitCount = photosList.filter(p => p.orientation === 'portrait').length;
  const landscapeCount = photosList.filter(p => p.orientation !== 'portrait').length;

  return (
    <div className="space-y-6">
      {/* Navigation & Controls Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs print:hidden space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <FileCheck className="w-5 h-5 text-red-600" />
              <span>Pelaporan & Bukti Fisik Bulanan (SPJ)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Berkas SPJ resmi Kelurahan: Notulen RT/PKK, Partisipasi Warga, serta <strong>Lampiran Foto Terpisah (1 Lembar 2 Foto Postcard)</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  Bulan: {m}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handlePrintPhotosOnly}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-3.5 py-2 rounded-xl shadow-xs flex items-center space-x-1.5 text-xs transition-colors"
              title="Cetak khusus halaman foto dokumentasi terpisah"
            >
              <Camera className="w-4 h-4" />
              <span>Cetak Lampiran Foto (PDF)</span>
            </button>

            <button
              type="button"
              onClick={handlePrintSpjOnly}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-3.5 py-2 rounded-xl shadow-xs flex items-center space-x-1.5 text-xs transition-colors"
              title="Cetak berkas naskah SPJ utama"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Berkas SPJ (PDF)</span>
            </button>
          </div>
        </div>

        {/* View Mode Tabs Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('foto-terpisah')}
              className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all ${
                viewMode === 'foto-terpisah'
                  ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-red-600" />
              <span>📸 Lampiran Foto Terpisah (1 Lembar 2 Postcard)</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('spj')}
              className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all ${
                viewMode === 'spj'
                  ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-red-600" />
              <span>📋 Berkas SPJ & Notulen (Lengkap)</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all ${
                viewMode === 'all'
                  ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-red-600" />
              <span>📑 Seluruh Berkas (SPJ + Lampiran Foto)</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 flex items-center space-x-3">
            <span>
              Foto Bulan {selectedMonth}: <strong>{photosList.length} Foto</strong>
            </span>
            <span className="text-slate-300">|</span>
            <span>
              Orientasi: <strong>{landscapeCount} Landscape</strong>, <strong>{portraitCount} Portrait</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: LAMPIRAN FOTO DOKUMENTASI TERPISAH (1 Lembar 2 Foto Postcard)      */}
      {/* ========================================================================= */}
      {viewMode === 'foto-terpisah' && (
        <div>
          <FotoDokumentasiLampiran
            profile={profile}
            month={selectedMonth}
            photos={photosList}
            onUpdatePhotos={handleUpdatePhotos}
            onPrint={handlePrintCurrentView}
            standalone={true}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: BERKAS SPJ & NOTULEN UTAMA                                         */}
      {/* ========================================================================= */}
      {(viewMode === 'spj' || viewMode === 'all') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:block">
          {/* Editor Form (Hidden on print) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs print:hidden space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Input Berkas Bulan {selectedMonth}</h3>
              <span className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded-md font-medium">
                Alokasi: {formatRupiah(totalRapMonth)}
              </span>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Notulen Rapat RT
                </label>
                <textarea
                  rows={3}
                  value={formState.notulenRt}
                  onChange={(e) => setFormState({ ...formState, notulenRt: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs"
                  required
                ></textarea>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Notulen Rapat PKK
                </label>
                <textarea
                  rows={3}
                  value={formState.notulenPkk}
                  onChange={(e) => setFormState({ ...formState, notulenPkk: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs"
                  required
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">
                    Jumlah Hadir (Orang)
                  </label>
                  <input
                    type="number"
                    value={formState.attendanceCount}
                    onChange={(e) => setFormState({ ...formState, attendanceCount: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">
                    Keterangan Daftar Hadir
                  </label>
                  <input
                    type="text"
                    value={formState.attendanceNotes}
                    onChange={(e) => setFormState({ ...formState, attendanceNotes: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
                  />
                </div>
              </div>

              {/* Photos Management Shortcut */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center space-x-1.5">
                    <Camera className="w-4 h-4 text-amber-600" />
                    <span>Lampiran Foto Postcard ({photosList.length} Foto)</span>
                  </span>
                  <span className="text-[10px] bg-amber-200/80 px-2 py-0.5 rounded font-semibold">
                    1 Lembar 2 Foto
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Foto dokumentasi diatur pada lembar lampiran terpisah.
                </p>
                <button
                  type="button"
                  onClick={() => setViewMode('foto-terpisah')}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka Editor & Pengaturan Foto Dokumentasi</span>
                </button>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl shadow-xs flex items-center justify-center space-x-2 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Berkas Pelaporan</span>
              </button>
            </form>
          </div>

          {/* Printable Official SPJ Evidence Dossier */}
          <div className="lg:col-span-2 bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-sm text-slate-900 space-y-8 font-arial-narrow official-doc leading-relaxed print-page-break">
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
              <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center">
                <img 
                  src={profile.logoUrl || "https://upload.wikimedia.org/wikipedia/commons/e/e9/Coat_of_arms_of_Semarang.svg"} 
                  alt="Logo Kota Semarang" 
                  className="w-14 h-14 object-contain"
                />
              </div>
              <div className="text-center flex-grow px-4">
                <div className="text-[12px] font-bold uppercase text-slate-800 leading-tight">
                  PEMERINTAH KOTA SEMARANG
                </div>
                <div className="text-[12px] font-semibold uppercase text-slate-800 leading-tight">
                  KECAMATAN {profile.kecamatan.toUpperCase()}
                </div>
                <div className="text-[12px] font-semibold uppercase text-slate-800 leading-tight">
                  KELURAHAN {profile.kelurahan.toUpperCase()}
                </div>
                <div className="text-[16px] font-bold uppercase text-slate-900 leading-tight">
                  RT {profile.rtNumber} RW {profile.rwNumber}
                </div>
                <p className="text-[10px] text-slate-600 leading-tight">
                  Alamat: Ngabean RT {profile.rtNumber} RW {profile.rwNumber} Kelurahan {profile.kelurahan}
                </p>
                <div className="h-px bg-slate-300 my-1"></div>
                <h1 className="text-base font-extrabold uppercase text-slate-900 leading-tight">
                  LAPORAN PERTANGGUNGJAWABAN BULANAN (SPJ) BOP RT
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  Bulan {selectedMonth} Tahun Anggaran {profile.year}
                </p>
              </div>
              <div className="w-16 h-16 flex-shrink-0 flex items-center justify-end">
                <div className="text-right text-[10px] text-slate-500 font-mono hidden sm:block print:block">
                  SPJ/BOP/{selectedMonth.toUpperCase()}/{profile.year}
                </div>
              </div>
            </div>

            {/* Document Info */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
              <div>
                <span className="font-semibold text-slate-600">Alokasi Dana Sesuai RAP:</span>
                <span className="font-bold text-slate-900 ml-2 text-sm">{formatRupiah(totalRapMonth)}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-600">Status Laporan:</span>
                <span className="font-bold text-emerald-700 ml-2">LENGKAP & TERTIB</span>
              </div>
            </div>

            {/* 1. Realisasi RAP Bulan Ini */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase bg-slate-100 p-2 border-l-4 border-red-600">
                1. Rincian Realisasi Penggunaan Dana Bulan {selectedMonth} (Sesuai RAP)
              </h3>
              {monthRapItems.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-2">Tidak ada pos anggaran RAP pada bulan {selectedMonth}.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-200">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-2 border border-slate-200 w-8 text-center">No</th>
                        <th className="p-2 border border-slate-200">Uraian Kebutuhan</th>
                        <th className="p-2 border border-slate-200 w-16 text-center">Vol</th>
                        <th className="p-2 border border-slate-200 w-16 text-center">Satuan</th>
                        <th className="p-2 border border-slate-200 text-right">Harga Satuan</th>
                        <th className="p-2 border border-slate-200 text-right">Total Realisasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {monthRapItems.map((item, idx) => (
                        <tr key={item.id}>
                          <td className="p-2 border border-slate-200 text-center font-mono">{idx + 1}</td>
                          <td className="p-2 border border-slate-200 font-medium">{item.activity}</td>
                          <td className="p-2 border border-slate-200 text-center">{item.volume}</td>
                          <td className="p-2 border border-slate-200 text-center">{item.unit}</td>
                          <td className="p-2 border border-slate-200 text-right font-mono">{formatRupiah(item.unitPrice)}</td>
                          <td className="p-2 border border-slate-200 text-right font-mono font-semibold">{formatRupiah(item.total)}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50 font-bold">
                        <td colSpan={5} className="p-2 border border-slate-200 text-right uppercase text-[10px]">
                          Total Pengeluaran Bulan {selectedMonth}:
                        </td>
                        <td className="p-2 border border-slate-200 text-right font-mono text-red-600">
                          {formatRupiah(totalRapMonth)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 2. Notulen Rapat */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase bg-slate-100 p-2 border-l-4 border-red-600">
                2. Berita Acara & Notulen Musyawarah / Rapat
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                  <h4 className="font-bold text-slate-800 text-[11px] uppercase mb-1 flex items-center space-x-1.5">
                    <FileText className="w-3.5 h-3.5 text-red-600" />
                    <span>A. Notulen Rapat Rutin Warga RT {profile.rtNumber}</span>
                  </h4>
                  <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                    {formState.notulenRt}
                  </p>
                </div>

                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                  <h4 className="font-bold text-slate-800 text-[11px] uppercase mb-1 flex items-center space-x-1.5">
                    <FileText className="w-3.5 h-3.5 text-red-600" />
                    <span>B. Notulen Rapat PKK RT {profile.rtNumber}</span>
                  </h4>
                  <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                    {formState.notulenPkk}
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Daftar Hadir & Partisipasi */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase bg-slate-100 p-2 border-l-4 border-red-600">
                3. Daftar Hadir & Partisipasi Warga
              </h3>
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <p className="text-xs text-slate-800">
                    Kegiatan musyawarah warga dihadiri oleh <strong className="font-bold text-slate-900">{formState.attendanceCount} orang</strong> warga RT {profile.rtNumber} RW {profile.rwNumber}.
                  </p>
                  <p className="text-[11px] text-slate-500 italic mt-0.5">
                    {formState.attendanceNotes || 'Daftar presensi tanda tangan terlampir pada berkas LPJ.'}
                  </p>
                </div>

                {onNavigateToNotulen && (
                  <button
                    type="button"
                    onClick={onNavigateToNotulen}
                    className="print:hidden bg-red-50 hover:bg-red-100 text-red-700 font-semibold px-2.5 py-1.5 rounded-lg text-[11px] border border-red-200 flex items-center space-x-1.5 transition-colors shrink-0"
                  >
                    <Users className="w-3.5 h-3.5 text-red-600" />
                    <span>Buka / Cetak Format Daftar Hadir (Silang)</span>
                  </button>
                )}
              </div>
            </div>

            {/* 4. Lampiran Foto Dokumentasi (Notice & Mini Gallery) */}
            <div className="space-y-3 print-avoid-break">
              <div className="flex justify-between items-center bg-slate-100 p-2 border-l-4 border-red-600">
                <h3 className="text-xs font-bold uppercase">
                  4. Lampiran Foto Dokumentasi
                </h3>
                <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded font-bold">
                  Lampiran Terpisah
                </span>
              </div>

              {/* Informational banner about separate photo sheet */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-1">
                  <p className="font-bold text-amber-950 flex items-center space-x-1.5">
                    <Camera className="w-4 h-4 text-amber-700" />
                    <span>Dibuat Lembar Terpisah: Lampiran Foto Dokumentasi Kegiatan</span>
                  </p>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Sesuai petunjuk teknis pelaporan, dokumentasi foto dicetak terpisah agar kualitas cetak prima dan rapi.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setViewMode('foto-terpisah')}
                  className="print:hidden bg-amber-600 hover:bg-amber-700 text-white font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1.5 transition-colors shrink-0 shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka Lembar Foto Terpisah</span>
                </button>
              </div>

              {/* Mini Gallery Previews */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                {photosList.slice(0, 4).map((photo, idx) => (
                  <div key={photo.id || idx} className="border border-slate-200 rounded-xl p-2 bg-slate-50">
                    <div className="flex justify-between items-center mb-1 text-[10px]">
                      <span className="font-bold text-slate-700">Foto {idx + 1}</span>
                      <span className={`px-1 rounded text-[9px] font-semibold uppercase ${
                        photo.orientation === 'portrait' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {photo.orientation === 'portrait' ? 'Tegak' : 'Mendatar'}
                      </span>
                    </div>
                    <div className="h-24 bg-slate-200 rounded-lg overflow-hidden flex items-center justify-center border border-slate-300">
                      {photo.imageUrl ? (
                        <img 
                          src={photo.imageUrl} 
                          alt={photo.title} 
                          className={photo.fitMode === 'contain' ? 'max-w-full max-h-full object-contain' : 'w-full h-full object-cover'} 
                        />
                      ) : (
                        <span className="text-[10px] text-slate-400">Belum ada foto</span>
                      )}
                    </div>
                    <p className="text-[10px] font-semibold text-slate-800 truncate mt-1">
                      {photo.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Signatures */}
            <div className="mt-8 pt-4 grid grid-cols-3 gap-6 text-xs text-center print-avoid-break">
              <div>
                <p className="font-semibold">Sekretaris RT {profile.rtNumber}</p>
                <div className="h-16"></div>
                <p className="font-bold underline uppercase">{profile.sekretaris}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Semarang, akhir {selectedMonth} {profile.year}</p>
                <p className="font-semibold">Ketua RT {profile.rtNumber}</p>
                <div className="h-16"></div>
                <p className="font-bold underline uppercase">{profile.ketuaRt}</p>
              </div>
              <div>
                <p className="font-semibold">&nbsp;</p>
                <p className="font-semibold">Bendahara RT {profile.rtNumber}</p>
                <div className="h-16"></div>
                <p className="font-bold underline uppercase">{profile.bendaharaRt}</p>
              </div>
            </div>

            <div className="mt-6 pt-4 grid grid-cols-2 gap-8 text-xs text-center print-avoid-break border-t border-slate-200">
              <div>
                <p className="font-semibold">Mengetahui,</p>
                <p className="font-semibold uppercase">Lurah {profile.kelurahan}</p>
                <div className="h-16"></div>
                <p className="font-bold underline uppercase">{profile.lurahName}</p>
              </div>
              <div>
                <p className="font-semibold">&nbsp;</p>
                <p className="font-semibold uppercase">Ketua RW {profile.rwNumber}</p>
                <div className="h-16"></div>
                <p className="font-bold underline uppercase">{profile.rwChairman}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: JIKA "SEMUA DOKUMEN", LAMPIRAN FOTO MENEMPEL DI HALAMAN TERPISAH  */}
      {/* ========================================================================= */}
      {viewMode === 'all' && (
        <div className="print-page-break-before pt-6">
          <div className="print:hidden pb-3 mb-3 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Camera className="w-4 h-4 text-red-600" />
              <span>Halaman Lampiran Foto Terpisah (Akan otomatis dicetak pada lembar berikutnya)</span>
            </h3>
          </div>
          <FotoDokumentasiLampiran
            profile={profile}
            month={selectedMonth}
            photos={photosList}
            onUpdatePhotos={handleUpdatePhotos}
            onPrint={handlePrintCurrentView}
            standalone={false}
          />
        </div>
      )}
    </div>
  );
};
