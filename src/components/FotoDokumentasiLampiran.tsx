import React, { useState } from 'react';
import { DocumentationPhoto, RtProfile } from '../types';
import { 
  Camera, 
  Printer, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Upload, 
  RotateCw, 
  Maximize2, 
  Image as ImageIcon,
  CheckCircle2,
  Calendar,
  MapPin,
  FileText,
  Sparkles
} from 'lucide-react';
import { executePrint } from '../utils/printHelper';
import { getDefaultPhotosForMonth } from '../utils/photoHelpers';

interface FotoDokumentasiLampiranProps {
  profile: RtProfile;
  month: string;
  photos: DocumentationPhoto[];
  onUpdatePhotos: (photos: DocumentationPhoto[]) => void;
  onPrint?: () => void;
  standalone?: boolean;
}

export const FotoDokumentasiLampiran: React.FC<FotoDokumentasiLampiranProps> = ({
  profile,
  month,
  photos,
  onUpdatePhotos,
  onPrint,
  standalone = false,
}) => {
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(0);
  const [showEditor, setShowEditor] = useState<boolean>(true);

  // Split photos into chunks of 2 (1 sheet = 2 postcard photos)
  const chunkSize = 2;
  const sheets: DocumentationPhoto[][] = [];
  for (let i = 0; i < photos.length; i += chunkSize) {
    sheets.push(photos.slice(i, i + chunkSize));
  }

  const handleToggleOrientation = (index: number) => {
    const updated = [...photos];
    const current = updated[index].orientation || 'landscape';
    updated[index] = {
      ...updated[index],
      orientation: current === 'landscape' ? 'portrait' : 'landscape',
    };
    onUpdatePhotos(updated);
  };

  const handleToggleFitMode = (index: number) => {
    const updated = [...photos];
    const current = updated[index].fitMode || 'cover';
    updated[index] = {
      ...updated[index],
      fitMode: current === 'cover' ? 'contain' : 'cover',
    };
    onUpdatePhotos(updated);
  };

  const handleFileUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Detect image natural orientation if possible, or read as DataURL
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        const dataUrl = event.target.result;
        
        // Auto-detect orientation from image dimensions
        const img = new Image();
        img.onload = () => {
          const isVertical = img.naturalHeight > img.naturalWidth;
          const updated = [...photos];
          updated[index] = {
            ...updated[index],
            imageUrl: dataUrl,
            orientation: isVertical ? 'portrait' : 'landscape',
          };
          onUpdatePhotos(updated);
        };
        img.src = dataUrl;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateField = (index: number, field: keyof DocumentationPhoto, value: string) => {
    const updated = [...photos];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    onUpdatePhotos(updated);
  };

  const handleAddPhoto = () => {
    const newNo = photos.length + 1;
    const newPhoto: DocumentationPhoto = {
      id: `photo-${Date.now()}`,
      title: `Foto ${newNo}: Dokumentasi Tambahan Bulan ${month}`,
      description: `Uraian kegiatan dokumentasi warga RT 04 RW 04 Kelurahan Gunungpati.`,
      date: `Bulan ${month} ${profile.year}`,
      location: `Wilayah RT 04 / RW 04 Ngabean`,
      imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
      orientation: 'landscape',
      fitMode: 'cover',
    };
    onUpdatePhotos([...photos, newPhoto]);
    setActivePhotoIndex(photos.length);
  };

  const handleDeletePhoto = (index: number) => {
    if (photos.length <= 1) {
      alert('Minimal harus ada 1 foto dokumentasi.');
      return;
    }
    if (window.confirm(`Hapus foto ke-${index + 1}?`)) {
      const updated = photos.filter((_, idx) => idx !== index);
      onUpdatePhotos(updated);
      setActivePhotoIndex(0);
    }
  };

  const handleMovePhoto = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= photos.length) return;
    const updated = [...photos];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    onUpdatePhotos(updated);
    setActivePhotoIndex(targetIdx);
  };

  const handleLoadAgustusPreset = () => {
    const defaults = getDefaultPhotosForMonth('Agustus', profile.year);
    onUpdatePhotos(defaults);
    setActivePhotoIndex(0);
  };

  const handleLoadCurrentMonthDefaults = () => {
    const defaults = getDefaultPhotosForMonth(month, profile.year);
    onUpdatePhotos(defaults);
    setActivePhotoIndex(0);
  };

  const handlePrintDocument = () => {
    if (onPrint) {
      onPrint();
    } else {
      executePrint(`Lampiran Foto Dokumentasi SPJ Bulan ${month} ${profile.year}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header & Print Controls (Screen Only) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs print:hidden">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-red-50 text-red-600 rounded-xl">
                <Camera className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <span>Lampiran Foto Dokumentasi</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dokumentasi pelaksanaan kegiatan dan pembelanjaan operasional RT.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => setShowEditor(!showEditor)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>{showEditor ? 'Tutup Pengaturan Foto' : 'Edit Keterangan & Foto'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrintDocument}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center space-x-2 shadow-xs transition-colors shrink-0"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Lampiran Foto Saja (PDF)</span>
            </button>
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500 font-medium">Preset Rekomendasi:</span>
            <button
              type="button"
              onClick={handleLoadAgustusPreset}
              className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg font-medium flex items-center space-x-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>🇮🇩 Preset Agustusan (Tirakatan & Resepsi)</span>
            </button>
            <button
              type="button"
              onClick={handleLoadCurrentMonthDefaults}
              className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-lg font-medium transition-colors"
            >
              Reset Default Bulan {month}
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-600 text-xs">
              Total: <strong>{photos.length} Foto</strong> ({sheets.length} Lembar Cetak)
            </span>
            <button
              type="button"
              onClick={handleAddPhoto}
              className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-3 py-1 rounded-lg flex items-center space-x-1 text-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Foto</span>
            </button>
          </div>
        </div>
      </div>

      {/* Editor Panel (Screen Only, Collapsible) */}
      {showEditor && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs print:hidden space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
              <ImageIcon className="w-4 h-4 text-red-600" />
              <span>Pengaturan & Orientasi Tiap Foto Dokumentasi</span>
            </h4>
            <span className="text-xs text-slate-500">
              Pilih orientasi Landscape atau Portrait untuk tiap foto
            </span>
          </div>

          {/* Photo Selector Pills */}
          <div className="flex flex-wrap gap-2">
            {photos.map((photo, idx) => (
              <button
                key={photo.id || idx}
                type="button"
                onClick={() => setActivePhotoIndex(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
                  activePhotoIndex === idx
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>Foto {idx + 1}</span>
                <span className={`text-[10px] uppercase px-1.5 py-0.2 rounded-md ${
                  activePhotoIndex === idx
                    ? 'bg-red-700 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {photo.orientation === 'portrait' ? 'Tegak' : 'Mendatar'}
                </span>
              </button>
            ))}
          </div>

          {/* Active Photo Editing Form */}
          {activePhotoIndex !== null && photos[activePhotoIndex] && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-xs">
                    {activePhotoIndex + 1}
                  </span>
                  <span className="font-bold text-slate-800 text-sm">
                    {photos[activePhotoIndex].title || `Foto Dokumentasi ${activePhotoIndex + 1}`}
                  </span>
                </div>

                {/* Actions: Move, Delete */}
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => handleMovePhoto(activePhotoIndex, 'up')}
                    disabled={activePhotoIndex === 0}
                    className="p-1.5 bg-white hover:bg-slate-100 disabled:opacity-40 border border-slate-200 rounded-lg text-slate-600"
                    title="Pindah ke Atas"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMovePhoto(activePhotoIndex, 'down')}
                    disabled={activePhotoIndex === photos.length - 1}
                    className="p-1.5 bg-white hover:bg-slate-100 disabled:opacity-40 border border-slate-200 rounded-lg text-slate-600"
                    title="Pindah ke Bawah"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePhoto(activePhotoIndex)}
                    className="p-1.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-lg"
                    title="Hapus Foto Ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Controls: Orientation & Fit Mode */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                  <label className="block font-bold text-slate-700 uppercase text-[11px]">
                    1. Orientasi Pengambilan Foto
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleOrientation(activePhotoIndex)}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 border transition-all ${
                        photos[activePhotoIndex].orientation !== 'portrait'
                          ? 'bg-red-50 text-red-700 border-red-300 ring-2 ring-red-400/20'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-base">📐</span>
                      <div className="text-left">
                        <div className="leading-none">Landscape</div>
                        <div className="text-[10px] font-normal opacity-80">Mendatar (3:2)</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleOrientation(activePhotoIndex)}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 border transition-all ${
                        photos[activePhotoIndex].orientation === 'portrait'
                          ? 'bg-red-50 text-red-700 border-red-300 ring-2 ring-red-400/20'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-base">📏</span>
                      <div className="text-left">
                        <div className="leading-none">Portrait</div>
                        <div className="text-[10px] font-normal opacity-80">Tegak (2:3)</div>
                      </div>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 italic">
                    {photos[activePhotoIndex].orientation === 'portrait'
                      ? 'Format Tegak: Foto ditampilkan tegak 2:3 dengan tabel keterangan di sebelahnya agar 2 foto tetap pas dalam 1 lembar.'
                      : 'Format Mendatar: Foto ditampilkan lebar 3:2 dengan keterangan di bawahnya.'}
                  </p>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                  <label className="block font-bold text-slate-700 uppercase text-[11px]">
                    2. Sumber Foto & Unggah Gambar
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-2 rounded-lg cursor-pointer flex items-center justify-center space-x-2 border border-slate-300 transition-colors">
                      <Upload className="w-3.5 h-3.5 text-slate-600" />
                      <span>Unggah File dari HP / Laptop</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(activePhotoIndex, e)}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => handleToggleFitMode(activePhotoIndex)}
                      className="px-2.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 text-[11px] font-medium shrink-0"
                      title="Ganti Mode Potong/Penuh"
                    >
                      {photos[activePhotoIndex].fitMode === 'contain' ? 'Mode: Utuh' : 'Mode: Penuh'}
                    </button>
                  </div>
                  <div>
                    <input
                      type="url"
                      placeholder="Atau tempel Link URL Foto di sini..."
                      value={photos[activePhotoIndex].imageUrl}
                      onChange={(e) => handleUpdateField(activePhotoIndex, 'imageUrl', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Text Fields: Title, Description, Date, Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase text-[11px] mb-1">
                    Judul Foto / Kegiatan
                  </label>
                  <input
                    type="text"
                    value={photos[activePhotoIndex].title}
                    onChange={(e) => handleUpdateField(activePhotoIndex, 'title', e.target.value)}
                    placeholder="Contoh: Malam Tirakatan HUT RI Ke 81"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase text-[11px] mb-1">
                      Hari & Tanggal
                    </label>
                    <input
                      type="text"
                      value={photos[activePhotoIndex].date || ''}
                      onChange={(e) => handleUpdateField(activePhotoIndex, 'date', e.target.value)}
                      placeholder="Contoh: 16 Agustus 2026"
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase text-[11px] mb-1">
                      Tempat / Lokasi
                    </label>
                    <input
                      type="text"
                      value={photos[activePhotoIndex].location || ''}
                      onChange={(e) => handleUpdateField(activePhotoIndex, 'location', e.target.value)}
                      placeholder="Contoh: Balai Warga RT 04"
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 uppercase text-[11px] mb-1">
                    Uraian / Keterangan Dokumentasi Kegiatan
                  </label>
                  <textarea
                    rows={2}
                    value={photos[activePhotoIndex].description}
                    onChange={(e) => handleUpdateField(activePhotoIndex, 'description', e.target.value)}
                    placeholder="Jelaskan aktivitas atau rincian pembelanjaan yang terekam dalam foto ini..."
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
                  ></textarea>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRINTABLE DOSSIER: 1 LEMBAR 2 FOTO UKURAN POSTCARD (10 x 15 cm)           */}
      {/* ========================================================================= */}
      <div className="space-y-8 font-arial-narrow official-doc text-slate-900">
        {sheets.map((sheetPhotos, sheetIdx) => {
          const sheetNumber = sheetIdx + 1;
          const totalSheets = sheets.length;

          return (
            <div
              key={`sheet-${sheetIdx}`}
              className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-sm print-avoid-break print-page-break flex flex-col justify-between"
              style={{ minHeight: '260mm' }}
            >
              {/* Official Header / KOP Surat Resmi */}
              <div className="border-b-2 border-slate-900 pb-2.5 mb-3">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center">
                    <img 
                      src={profile.logoUrl || "https://upload.wikimedia.org/wikipedia/commons/e/e9/Coat_of_arms_of_Semarang.svg"} 
                      alt="Logo Kota Semarang" 
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                  <div className="text-center flex-grow px-2">
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
                    <h1 className="text-sm font-extrabold uppercase text-slate-900 leading-tight">
                      LAMPIRAN FOTO DOKUMENTASI KEGIATAN & PEMBELANJAAN BOP RT
                    </h1>
                    <p className="text-[11px] text-slate-600 font-medium">
                      Bulan {month} Tahun {profile.year} • Lembar ke-{sheetNumber} dari {totalSheets}
                    </p>
                  </div>
                  <div className="w-14 h-14 flex-shrink-0"></div>
                </div>
                <div className="h-0.5 bg-slate-900 mt-1"></div>
                <div className="h-px bg-slate-900 mt-0.5"></div>
              </div>

              {/* Sub-Header Notice */}
              <div className="bg-slate-50 border border-slate-300 px-3 py-1.5 mb-3 text-[11px] text-center">
                <span className="font-bold text-slate-800 uppercase">
                  DOKUMENTASI PELAKSANAAN ANGGARAN OPERASIONAL RT 04 BULAN {month.toUpperCase()} {profile.year}
                </span>
              </div>

              {/* Main Content: The Photos */}
              <div className="space-y-4 flex-1 flex flex-col justify-around">
                {sheetPhotos.map((photo, photoInSheetIdx) => {
                  const globalPhotoNumber = sheetIdx * chunkSize + photoInSheetIdx + 1;
                  const isPortrait = photo.orientation === 'portrait';

                  return (
                    <div
                      key={photo.id || photoInSheetIdx}
                      className="border border-slate-300 rounded-lg p-2 bg-white print:border-slate-400 print-avoid-break"
                    >
                      {/* Top Bar for each photo */}
                      <div className="flex items-center pb-1.5 mb-1.5 border-b border-slate-200 text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="bg-slate-900 text-white font-bold text-[10px] px-2 py-0.5 rounded">
                            FOTO {globalPhotoNumber}
                          </span>
                          <span className="font-bold text-slate-900 text-xs truncate max-w-md">
                            {photo.title || `Dokumentasi Kegiatan ${globalPhotoNumber}`}
                          </span>
                        </div>
                      </div>

                      {/* Photo + Caption Layout: Adaptive based on Portrait / Landscape */}
                      {isPortrait ? (
                        /* PORTRAIT PHOTO LAYOUT */
                        <div className="flex items-center gap-3">
                          <div 
                            className="shrink-0 bg-slate-100 border border-slate-800 rounded overflow-hidden flex items-center justify-center"
                            style={{ width: '70mm', height: '98mm' }}
                          >
                            {photo.imageUrl ? (
                              <img
                                src={photo.imageUrl}
                                alt={photo.title}
                                className={photo.fitMode === 'contain' ? 'max-w-full max-h-full object-contain' : 'w-full h-full object-cover'}
                              />
                            ) : (
                              <span className="text-xs text-slate-400">Tidak ada foto</span>
                            )}
                          </div>

                          {/* Metadata / Caption Box on Right */}
                          <div 
                            className="flex-1 border border-slate-300 rounded p-3.5 bg-slate-50 text-xs flex flex-col justify-between"
                            style={{ height: '98mm' }}
                          >
                            <div className="space-y-2">
                              <div>
                                <span className="text-[10px] font-bold uppercase text-slate-500 block">Uraian / Keterangan Kegiatan:</span>
                                <p className="text-slate-800 font-medium leading-relaxed text-justify mt-1">
                                  {photo.description || 'Dokumentasi bukti kegiatan / pembelanjaan operasional RT.'}
                                </p>
                              </div>

                              <div className="pt-2 border-t border-slate-200">
                                <div>
                                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Hari / Tanggal Pelaksanaan:</span>
                                  <span className="text-slate-800 font-semibold">{photo.date || `-`}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* LANDSCAPE PHOTO LAYOUT */
                        <div className="flex flex-col items-center">
                          <div 
                            className="w-full max-w-[160mm] bg-slate-100 border border-slate-800 rounded overflow-hidden flex items-center justify-center mb-2"
                            style={{ height: '90mm' }}
                          >
                            {photo.imageUrl ? (
                              <img
                                src={photo.imageUrl}
                                alt={photo.title}
                                className={photo.fitMode === 'contain' ? 'max-w-full max-h-full object-contain' : 'w-full h-full object-cover'}
                              />
                            ) : (
                              <span className="text-xs text-slate-400">Tidak ada foto</span>
                            )}
                          </div>

                          {/* Caption Strip Underneath */}
                          <div className="w-full max-w-[160mm] bg-slate-50 border border-slate-300 rounded p-2.5 text-xs">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                              <p className="text-slate-800 leading-snug flex-1">
                                <strong className="font-bold text-slate-900">Keterangan: </strong>
                                {photo.description || 'Dokumentasi bukti kegiatan / pembelanjaan operasional RT.'}
                              </p>
                            </div>
                            <div className="mt-1 pt-1 border-t border-slate-200 text-[11px] text-slate-600">
                              <span><strong>Waktu:</strong> {photo.date || `-`}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* If sheet has only 1 photo, fill second slot with empty box */}
                {sheetPhotos.length === 1 && (
                  <div className="border border-dashed border-slate-300 rounded-lg p-6 text-center text-slate-400 text-xs flex flex-col items-center justify-center min-h-[90mm]">
                    <ImageIcon className="w-8 h-8 text-slate-300 mb-1" />
                    <span>Slot Foto 2 Belum Terisi</span>
                    <button
                      type="button"
                      onClick={handleAddPhoto}
                      className="print:hidden mt-2 text-red-600 hover:text-red-700 font-semibold"
                    >
                      + Tambah Foto ke Slot 2
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
