import React, { useState } from 'react';
import { RtProfile, AttendeeItem } from '../types';
import { formatDate } from '../utils/formatters';
import { rtNotulenPresets, defaultRtAttendees, defaultPkkAttendees } from '../data/initialData';
import { 
  FileText, 
  Printer, 
  Users, 
  BookOpen, 
  Sparkles,
  CheckCircle2,
  Award,
  Layers
} from 'lucide-react';

interface NotulenGeneratorProps {
  profile: RtProfile;
}

export const NotulenGenerator: React.FC<NotulenGeneratorProps> = ({ profile }) => {
  const [docViewMode, setDocViewMode] = useState<'daftar-hadir' | 'notulen'>('daftar-hadir');
  const [meetingType, setMeetingType] = useState<'rt' | 'pkk'>('rt');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('notulen-januari');
  const [tableLayoutMode, setTableLayoutMode] = useState<'auto' | '1-kolom' | '2-kolom-100'>('auto');
  
  // Initialize with the 1st preset (Januari 2026 - Persiapan Haul)
  const firstPreset = rtNotulenPresets[0];
  const [month, setMonth] = useState(firstPreset.month);
  const [date, setDate] = useState(firstPreset.date);
  const [time, setTime] = useState(firstPreset.time);
  const [location, setLocation] = useState(firstPreset.location);
  const [leader, setLeader] = useState(firstPreset.leader || profile.ketuaRt);
  const [secretary, setSecretary] = useState(firstPreset.secretary || profile.sekretaris);
  const [participantCount, setParticipantCount] = useState(firstPreset.participantCount || 40);
  const [agendaItems, setAgendaItems] = useState<string[]>([...firstPreset.agendaItems]);
  const [discussionNotes, setDiscussionNotes] = useState(firstPreset.discussionNotes);
  const [decisions, setDecisions] = useState(firstPreset.decisions);
  const [agendaSummary, setAgendaSummary] = useState(firstPreset.agendaItems[1] || firstPreset.agendaItems[0]);

  // Attendee list management
  const [rtAttendees] = useState<AttendeeItem[]>([...defaultRtAttendees]);
  const [pkkAttendees] = useState<AttendeeItem[]>([...defaultPkkAttendees]);
  const [blankNamesMode, setBlankNamesMode] = useState(false);

  const [newAgenda, setNewAgenda] = useState('');

  const handleSelectPreset = (presetId: string) => {
    const preset = rtNotulenPresets.find((p) => p.id === presetId);
    if (!preset) return;
    setSelectedPresetId(presetId);
    setMonth(preset.month);
    setDate(preset.date);
    setTime(preset.time);
    setLocation(preset.location);
    setLeader(profile.ketuaRt);
    setSecretary(profile.sekretaris);
    setParticipantCount(preset.participantCount);
    setAgendaItems([...preset.agendaItems]);
    setDiscussionNotes(preset.discussionNotes);
    setDecisions(preset.decisions);
    setAgendaSummary(
      preset.agendaTitle ||
      (preset.id === 'notulen-tirakatan-16agustus'
        ? 'Malam Tirakatan HUT RI Ke 81 Tahun 2026'
        : preset.id === 'notulen-resepsi-23agustus'
        ? 'Malam Resepsi HUT RI Ke 81 Tahun 2026'
        : preset.agendaItems[1] || preset.agendaItems[0])
    );
    if (preset.participantCount >= 50) {
      setTableLayoutMode('2-kolom-100');
    } else {
      setTableLayoutMode('auto');
    }
  };

  const handleAddAgenda = () => {
    if (!newAgenda.trim()) return;
    setAgendaItems([...agendaItems, newAgenda.trim()]);
    setNewAgenda('');
  };

  const handleRemoveAgenda = (index: number) => {
    setAgendaItems(agendaItems.filter((_, idx) => idx !== index));
  };

  const handlePrint = () => {
    window.print();
  };

  const activeAttendees = meetingType === 'rt' ? rtAttendees : pkkAttendees;
  const displayAttendees: AttendeeItem[] = activeAttendees.slice(0, Math.max(participantCount, 1));
  const isDualColumn = tableLayoutMode === '2-kolom-100' || (tableLayoutMode === 'auto' && participantCount >= 50);

  const midPoint = Math.ceil(displayAttendees.length / 2);
  const col1Attendees = displayAttendees.slice(0, midPoint);
  const col2Attendees = displayAttendees.slice(midPoint);

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs print:hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-red-600" />
            <span>Notulen & Daftar Hadir Resmi</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Format resmi KOP Surat Pemerintah Kota Semarang lengkap dengan Notulen Rapat dan Daftar Hadir bertanda tangan silang (ganjil di kiri, genap di kanan).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Document Type Switcher */}
          <div className="inline-flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setDocViewMode('daftar-hadir')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                docViewMode === 'daftar-hadir' ? 'bg-white text-red-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Daftar Hadir (Format Silang)</span>
            </button>
            <button
              onClick={() => setDocViewMode('notulen')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                docViewMode === 'notulen' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Notulen Rapat</span>
            </button>
          </div>

          {/* Meeting Category Switcher */}
          <div className="inline-flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => {
                setMeetingType('rt');
                setLeader(profile.ketuaRt);
                setSecretary(profile.sekretaris);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                meetingType === 'rt' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              RT {profile.rtNumber}
            </button>
            <button
              onClick={() => {
                setMeetingType('pkk');
                setLeader('Ibu Ketua PKK RT ' + profile.rtNumber);
                setSecretary('Ibu Sekretaris PKK');
                if (docViewMode === 'daftar-hadir' && (agendaSummary.includes('Haul') || agendaSummary.includes('RT'))) {
                  setAgendaSummary('Pertemuan Rutin Kader PKK dan Pembahasan Program RT 04');
                }
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                meetingType === 'pkk' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              PKK RT {profile.rtNumber}
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-xl shadow-xs flex items-center space-x-2 text-xs transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>{docViewMode === 'daftar-hadir' ? 'Cetak Daftar Hadir (PDF)' : 'Cetak Notulen (PDF)'}</span>
          </button>
        </div>
      </div>

      {/* Quick Select Bar for RT 04 Meetings */}
      {meetingType === 'rt' && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 print:hidden space-y-3.5">
          {/* Special Agustusan LPJ 100 Person Presets */}
          <div className="bg-gradient-to-r from-red-500/10 via-amber-500/10 to-red-500/10 border border-red-200 rounded-xl p-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
              <div className="flex items-center space-x-2">
                <span className="flex h-2 w-2 rounded-full bg-red-600 animate-pulse"></span>
                <span className="text-xs font-black uppercase tracking-wider text-red-900">
                  🇮🇩 Dokumen Khusus LPJ Agustusan (100 Warga / 1 Lembar Pas Cetak)
                </span>
              </div>
              <span className="text-[11px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full w-fit">
                Layout 2 Kolom • Tanda Tangan Silang • Hemat Kertas
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Preset 1: Malam Tirakatan 16 Agustus 2026 */}
              <button
                type="button"
                onClick={() => handleSelectPreset('notulen-tirakatan-16agustus')}
                className={`text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                  selectedPresetId === 'notulen-tirakatan-16agustus'
                    ? 'bg-red-600 border-red-600 text-white shadow-sm ring-2 ring-red-400/40'
                    : 'bg-white border-red-200 hover:border-red-400 hover:bg-red-50/50 text-slate-800'
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${
                      selectedPresetId === 'notulen-tirakatan-16agustus' ? 'bg-red-700 text-white' : 'bg-red-100 text-red-800'
                    }`}>
                      16 Agustus 2026
                    </span>
                    <span className={`text-[11px] font-bold truncate ${
                      selectedPresetId === 'notulen-tirakatan-16agustus' ? 'text-white' : 'text-slate-900'
                    }`}>
                      Malam Tirakatan HUT RI Ke 81 Tahun 2026
                    </span>
                  </div>
                  <p className={`text-[11px] line-clamp-1 ${
                    selectedPresetId === 'notulen-tirakatan-16agustus' ? 'text-red-100' : 'text-slate-600'
                  }`}>
                    Indonesia Raya, Sambutan RW, Tumpeng, Ramah Tamah, Lomba Bapak/Ibu & Remaja
                  </p>
                  <div className="flex items-center space-x-2 text-[10px] pt-1">
                    <span className={`font-semibold ${selectedPresetId === 'notulen-tirakatan-16agustus' ? 'text-red-100' : 'text-slate-500'}`}>
                      📍 Balai Warga RT 04
                    </span>
                    <span>•</span>
                    <span className={`font-bold ${selectedPresetId === 'notulen-tirakatan-16agustus' ? 'text-white' : 'text-red-600'}`}>
                      100 Warga (1 Lembar)
                    </span>
                  </div>
                </div>
                <Award className={`w-5 h-5 shrink-0 mt-0.5 ${
                  selectedPresetId === 'notulen-tirakatan-16agustus' ? 'text-amber-300' : 'text-red-500'
                }`} />
              </button>

              {/* Preset 2: Malam Resepsi / Puncak 23 Agustus 2026 */}
              <button
                type="button"
                onClick={() => handleSelectPreset('notulen-resepsi-23agustus')}
                className={`text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                  selectedPresetId === 'notulen-resepsi-23agustus'
                    ? 'bg-red-600 border-red-600 text-white shadow-sm ring-2 ring-red-400/40'
                    : 'bg-white border-red-200 hover:border-red-400 hover:bg-red-50/50 text-slate-800'
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${
                      selectedPresetId === 'notulen-resepsi-23agustus' ? 'bg-red-700 text-white' : 'bg-red-100 text-red-800'
                    }`}>
                      23 Agustus 2026
                    </span>
                    <span className={`text-[11px] font-bold truncate ${
                      selectedPresetId === 'notulen-resepsi-23agustus' ? 'text-white' : 'text-slate-900'
                    }`}>
                      Malam Resepsi HUT RI Ke 81 Tahun 2026
                    </span>
                  </div>
                  <p className={`text-[11px] line-clamp-1 ${
                    selectedPresetId === 'notulen-resepsi-23agustus' ? 'text-red-100' : 'text-slate-600'
                  }`}>
                    Sambutan RW & Panitia, Pentas Seni Anak, UMKM & Hiburan Solo Organ
                  </p>
                  <div className="flex items-center space-x-2 text-[10px] pt-1">
                    <span className={`font-semibold ${selectedPresetId === 'notulen-resepsi-23agustus' ? 'text-red-100' : 'text-slate-500'}`}>
                      📍 Panggung RT 04 Ngabean
                    </span>
                    <span>•</span>
                    <span className={`font-bold ${selectedPresetId === 'notulen-resepsi-23agustus' ? 'text-white' : 'text-red-600'}`}>
                      100 Warga (1 Lembar)
                    </span>
                  </div>
                </div>
                <Award className={`w-5 h-5 shrink-0 mt-0.5 ${
                  selectedPresetId === 'notulen-resepsi-23agustus' ? 'text-amber-300' : 'text-red-500'
                }`} />
              </button>
            </div>
          </div>

          {/* 8 Regular Monthly Meetings */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Pertemuan Rutin Warga RT 04 (Januari - Agustus 2026)
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                40 Hadir • 19:30 WIB • Kediaman Bergilir
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {rtNotulenPresets.slice(0, 8).map((preset, idx) => {
                const isActive = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`text-left p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                      isActive
                        ? 'bg-slate-900 border-slate-900 text-white shadow-xs scale-[1.02]'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div>
                      <div className={`text-[10px] font-bold uppercase ${isActive ? 'text-slate-300' : 'text-red-700'}`}>
                        {idx + 1}. {preset.month}
                      </div>
                      <div className="text-[11px] font-extrabold leading-tight mt-0.5 truncate" title={preset.agendaItems[1] || preset.agendaItems[0]}>
                        {preset.month === 'Januari' ? 'Persiapan Haul' :
                         preset.month === 'Pebruari' ? 'Tabungan Warga' :
                         preset.month === 'Maret' ? 'Buka Bersama' :
                         preset.month === 'April' ? 'Halal Bi Halal' :
                         preset.month === 'Mei' ? 'Taman TOGA PKK' :
                         preset.month === 'Juni' ? 'Zarkasi Jogja' :
                         preset.month === 'Juli' ? 'Sosialisasi BOP' :
                         'HUT RI Ke-81'}
                      </div>
                    </div>
                    <div className={`text-[9px] mt-1.5 pt-1 border-t truncate ${isActive ? 'border-slate-700 text-slate-300' : 'border-slate-100 text-slate-500'}`}>
                      {preset.location.replace('Kediaman ', '')}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:block">
        {/* Editor Form (Hidden on print) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs print:hidden space-y-4 text-xs">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-xs">
              {docViewMode === 'daftar-hadir' ? 'Pengaturan Daftar Hadir' : 'Formulir Notulen Rapat'}
            </span>
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
              Bulan {month} 2026
            </span>
          </div>

          {/* Layout Mode Selector for Daftar Hadir */}
          {docViewMode === 'daftar-hadir' && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="block font-bold text-slate-800 uppercase text-[11px] flex items-center justify-between">
                <span>Format Lembar Cetak</span>
                {isDualColumn && (
                  <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase">
                    Pas 1 Lembar A4
                  </span>
                )}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTableLayoutMode('2-kolom-100');
                    if (participantCount < 50) setParticipantCount(100);
                  }}
                  className={`p-2 rounded-lg border text-left flex items-center space-x-2 transition-all ${
                    isDualColumn
                      ? 'bg-red-600 border-red-600 text-white font-bold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold leading-tight">2 Kolom (1 Lembar)</div>
                    <div className={`text-[9px] truncate ${isDualColumn ? 'text-red-100' : 'text-slate-500'}`}>
                      Hingga 100 Orang
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTableLayoutMode('1-kolom')}
                  className={`p-2 rounded-lg border text-left flex items-center space-x-2 transition-all ${
                    !isDualColumn
                      ? 'bg-slate-900 border-slate-900 text-white font-bold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold leading-tight">1 Kolom Standar</div>
                    <div className={`text-[9px] truncate ${!isDualColumn ? 'text-slate-300' : 'text-slate-500'}`}>
                      20 - 40 Orang
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">Bulan</label>
              <input
                type="text"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">Tanggal</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">Waktu</label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-slate-700 uppercase">Jumlah Hadir</label>
                <div className="space-x-1">
                  <button
                    type="button"
                    onClick={() => {
                      setParticipantCount(40);
                      setTableLayoutMode('auto');
                    }}
                    className="text-[10px] text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded"
                  >
                    40
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setParticipantCount(100);
                      setTableLayoutMode('2-kolom-100');
                    }}
                    className="text-[10px] text-red-600 font-bold hover:text-red-700 bg-red-50 hover:bg-red-100 px-1.5 py-0.5 rounded"
                  >
                    100
                  </button>
                </div>
              </div>
              <input
                type="number"
                min={1}
                max={100}
                value={participantCount}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setParticipantCount(val);
                  if (val >= 50 && tableLayoutMode === 'auto') {
                    setTableLayoutMode('2-kolom-100');
                  }
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase mb-1">Tempat Pelaksanaan</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase mb-1">Agenda Rapat</label>
            <textarea
              rows={2}
              value={agendaSummary}
              onChange={(e) => setAgendaSummary(e.target.value)}
              placeholder="Contoh: Musyawarah Persiapan Pelaksanaan Haul Kyai Pati Joyokusumo..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium"
            ></textarea>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">Pimpinan Rapat / Ketua</label>
              <input
                type="text"
                value={leader}
                onChange={(e) => setLeader(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">Sekretaris / Notulis</label>
              <input
                type="text"
                value={secretary}
                onChange={(e) => setSecretary(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
              />
            </div>
          </div>

          {/* Additional controls for Daftar Hadir */}
          {docViewMode === 'daftar-hadir' && (
            <div className="p-3 bg-red-50/60 rounded-xl border border-red-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-red-900 text-xs">Pilihan Lembar Daftar Hadir</span>
                <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded font-bold">
                  {displayAttendees.length} Warga
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="blankNames"
                  checked={blankNamesMode}
                  onChange={(e) => setBlankNamesMode(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="blankNames" className="text-[11px] font-medium text-slate-700 cursor-pointer">
                  Kosongkan Kolom Nama & L/P (Untuk ditulis tangan warga langsung di lokasi)
                </label>
              </div>

              <p className="text-[10px] text-slate-600">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 inline mr-1" />
                Kolom <strong>Tanda Tangan</strong> menggunakan sistem <strong>nomor silang</strong> (ganjil di sebelah kiri, genap di sebelah kanan).
              </p>
            </div>
          )}

          {/* Additional fields for Notulen view */}
          {docViewMode === 'notulen' && (
            <>
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Susunan Acara / Agenda</label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    placeholder="Tambah agenda baru..."
                    value={newAgenda}
                    onChange={(e) => setNewAgenda(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddAgenda}
                    className="bg-slate-900 text-white px-3 py-2 rounded-xl font-semibold shrink-0"
                  >
                    Tambah
                  </button>
                </div>
                <ul className="space-y-1">
                  {agendaItems.map((ag, i) => (
                    <li key={i} className="flex justify-between items-center bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                      <span>{i + 1}. {ag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAgenda(i)}
                        className="text-red-600 hover:text-red-700 font-bold px-1"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Uraian Pembahasan Rapat</label>
                <textarea
                  rows={4}
                  value={discussionNotes}
                  onChange={(e) => setDiscussionNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs"
                ></textarea>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Hasil Keputusan Rapat</label>
                <textarea
                  rows={4}
                  value={decisions}
                  onChange={(e) => setDecisions(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs"
                ></textarea>
              </div>
            </>
          )}
        </div>

        {/* ================================================================ */}
        {/* Printable Official Document Preview */}
        {/* ================================================================ */}
        <div className="lg:col-span-2 bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-sm text-slate-900 font-arial-narrow official-doc leading-relaxed">
          
          {/* ================== VIEW 1: DAFTAR HADIR (FORMAT SILANG) ================== */}
          {docViewMode === 'daftar-hadir' && (
            isDualColumn ? (
              /* ================= 1 LEMBAR CETAK (2 KOLOM - 100 WARGA) ================= */
              <div className="space-y-2 print-one-page text-slate-900 leading-tight">
                {/* KOP Surat Compact */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1.5 mb-1.5">
                  <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center">
                    <img 
                      src={meetingType === 'pkk' ? (profile.pkkLogoUrl || profile.logoUrl || "https://upload.wikimedia.org/wikipedia/commons/e/e9/Coat_of_arms_of_Semarang.svg") : (profile.logoUrl || "https://upload.wikimedia.org/wikipedia/commons/e/e9/Coat_of_arms_of_Semarang.svg")} 
                      alt={meetingType === 'pkk' ? "Logo PKK" : "Logo Kota Semarang"} 
                      className="w-10 h-10 object-contain"
                    />
                  </div>
                  <div className="text-center flex-grow px-2">
                    <div className="text-[10px] print:text-[9px] font-bold uppercase text-slate-800 leading-tight">
                      PEMERINTAH KOTA SEMARANG
                    </div>
                    <div className="text-[10px] print:text-[9px] font-semibold uppercase text-slate-800 leading-tight">
                      KECAMATAN {profile.kecamatan.toUpperCase()}
                    </div>
                    <div className="text-[10px] print:text-[9px] font-semibold uppercase text-slate-800 leading-tight">
                      KELURAHAN {profile.kelurahan.toUpperCase()}
                    </div>
                    <div className="text-[10px] print:text-[9px] font-bold uppercase text-slate-900 leading-tight">
                      RT {profile.rtNumber} RW {profile.rwNumber}
                    </div>
                    <p className="text-[8px] print:text-[7.5px] text-slate-600 leading-none mt-0.5">
                      Alamat: Ngabean RT {profile.rtNumber} RW {profile.rwNumber}, Kel. {profile.kelurahan}, Kec. {profile.kecamatan}, Kota Semarang
                    </p>
                  </div>
                  <div className="w-12 h-12 flex-shrink-0"></div>
                </div>

                {/* DAFTAR HADIR (posisi center) */}
                <div className="text-center my-1.5">
                  <h1 className="text-xs print:text-[11px] font-black tracking-widest uppercase underline underline-offset-2 text-slate-900 leading-none">
                    DAFTAR HADIR WARGA
                  </h1>
                  <p className="text-[9.5px] print:text-[8.5px] font-extrabold uppercase mt-0.5 text-slate-800">
                    {agendaSummary.toUpperCase()}
                  </p>
                </div>

                {/* Hari/tanggal, Waktu, Tempat, Agenda (Compact Grid) */}
                <div className="border border-slate-900/70 rounded p-1.5 bg-slate-50/50 print:bg-transparent print:p-1 text-[9px] print:text-[8px] mb-1.5 leading-tight">
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                    <div className="flex">
                      <span className="w-20 font-bold shrink-0">Hari / tanggal</span>
                      <span className="w-2 font-bold">:</span>
                      <span className="font-semibold text-slate-900">{formatDate(date)}</span>
                    </div>
                    <div className="flex">
                      <span className="w-16 font-bold shrink-0">Tempat</span>
                      <span className="w-2 font-bold">:</span>
                      <span className="truncate text-slate-900">{location}</span>
                    </div>
                    <div className="flex">
                      <span className="w-20 font-bold shrink-0">Waktu</span>
                      <span className="w-2 font-bold">:</span>
                      <span className="text-slate-900">{time}</span>
                    </div>
                    <div className="flex">
                      <span className="w-16 font-bold shrink-0">Agenda</span>
                      <span className="w-2 font-bold">:</span>
                      <span className="font-medium truncate text-slate-900">{agendaSummary}</span>
                    </div>
                  </div>
                </div>

                {/* Dua Kolom Tabel (Kiri No. 1-50, Kanan No. 51-100) */}
                <div className="grid grid-cols-2 gap-2 print:gap-1.5">
                  {/* Kolom 1 */}
                  <div>
                    <table className="w-full border-collapse border border-slate-900 text-[8px] print:text-[7.5px] leading-none">
                      <thead>
                        <tr className="bg-slate-100 text-slate-900 font-black uppercase text-[7.5px] print:text-[7px]">
                          <th className="border border-slate-900 py-0.5 px-0.5 text-center w-5">NO</th>
                          <th className="border border-slate-900 py-0.5 px-1 text-left">Nama</th>
                          <th className="border border-slate-900 py-0.5 px-0.5 text-center w-5">L/P</th>
                          <th colSpan={2} className="border border-slate-900 py-0.5 px-0.5 text-center w-28">Tanda Tangan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {col1Attendees.map((att) => {
                          const isOdd = att.no % 2 !== 0;
                          return (
                            <tr key={att.no} className="h-[13.5px] print:h-[13px]">
                              <td className="border border-slate-900 py-0 px-0.5 text-center font-bold">
                                {att.no}
                              </td>
                              <td className="border border-slate-900 py-0 px-1 font-semibold uppercase truncate max-w-[85px]">
                                {blankNamesMode ? '' : att.name}
                              </td>
                              <td className="border border-slate-900 py-0 px-0.5 text-center font-bold">
                                {blankNamesMode ? '' : att.gender}
                              </td>
                              {isOdd ? (
                                <>
                                  <td className="border border-slate-900 py-0 px-0.5 text-left w-14 font-semibold">
                                    {att.no}. ........
                                  </td>
                                  <td className="border border-slate-900 py-0 px-0.5 w-14 bg-slate-50/20"></td>
                                </>
                              ) : (
                                <>
                                  <td className="border border-slate-900 py-0 px-0.5 w-14 bg-slate-50/20"></td>
                                  <td className="border border-slate-900 py-0 px-0.5 text-left w-14 font-semibold">
                                    {att.no}. ........
                                  </td>
                                </>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Kolom 2 */}
                  <div>
                    <table className="w-full border-collapse border border-slate-900 text-[8px] print:text-[7.5px] leading-none">
                      <thead>
                        <tr className="bg-slate-100 text-slate-900 font-black uppercase text-[7.5px] print:text-[7px]">
                          <th className="border border-slate-900 py-0.5 px-0.5 text-center w-5">NO</th>
                          <th className="border border-slate-900 py-0.5 px-1 text-left">Nama</th>
                          <th className="border border-slate-900 py-0.5 px-0.5 text-center w-5">L/P</th>
                          <th colSpan={2} className="border border-slate-900 py-0.5 px-0.5 text-center w-28">Tanda Tangan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {col2Attendees.map((att) => {
                          const isOdd = att.no % 2 !== 0;
                          return (
                            <tr key={att.no} className="h-[13.5px] print:h-[13px]">
                              <td className="border border-slate-900 py-0 px-0.5 text-center font-bold">
                                {att.no}
                              </td>
                              <td className="border border-slate-900 py-0 px-1 font-semibold uppercase truncate max-w-[85px]">
                                {blankNamesMode ? '' : att.name}
                              </td>
                              <td className="border border-slate-900 py-0 px-0.5 text-center font-bold">
                                {blankNamesMode ? '' : att.gender}
                              </td>
                              {isOdd ? (
                                <>
                                  <td className="border border-slate-900 py-0 px-0.5 text-left w-14 font-semibold">
                                    {att.no}. ........
                                  </td>
                                  <td className="border border-slate-900 py-0 px-0.5 w-14 bg-slate-50/20"></td>
                                </>
                              ) : (
                                <>
                                  <td className="border border-slate-900 py-0 px-0.5 w-14 bg-slate-50/20"></td>
                                  <td className="border border-slate-900 py-0 px-0.5 text-left w-14 font-semibold">
                                    {att.no}. ........
                                  </td>
                                </>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Tanda Tangan Mengetahui Compact */}
                <div className="mt-2 pt-1 grid grid-cols-2 gap-8 text-[9px] print:text-[8px] text-center print-avoid-break">
                  <div>
                    <p className="font-bold uppercase">
                      {meetingType === 'rt' ? `Notulis / Sekretaris RT ${profile.rtNumber}` : `Sekretaris PKK RT ${profile.rtNumber}`}
                    </p>
                    <div className="h-7 print:h-6"></div>
                    <p className="font-extrabold underline uppercase">{secretary}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 mb-0.5">Semarang, {formatDate(date)}</p>
                    <p className="font-bold uppercase">
                      {meetingType === 'rt' ? `Ketua RT ${profile.rtNumber}` : `Ketua PKK RT ${profile.rtNumber}`}
                    </p>
                    <div className="h-7 print:h-6"></div>
                    <p className="font-extrabold underline uppercase">{leader}</p>
                  </div>
                </div>
              </div>
            ) : (
              /* ================= 1 KOLOM STANDAR (20 - 40 WARGA) ================= */
              <div className="space-y-4">
                {/* KOP surat */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-2">
                  <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center">
                    <img 
                      src={meetingType === 'pkk' ? (profile.pkkLogoUrl || profile.logoUrl || "https://upload.wikimedia.org/wikipedia/commons/e/e9/Coat_of_arms_of_Semarang.svg") : (profile.logoUrl || "https://upload.wikimedia.org/wikipedia/commons/e/e9/Coat_of_arms_of_Semarang.svg")} 
                      alt={meetingType === 'pkk' ? "Logo PKK" : "Logo Kota Semarang"} 
                      className="w-14 h-14 object-contain"
                    />
                  </div>
                  <div className="text-center flex-grow px-2">
                    <div className="text-xs font-bold uppercase text-slate-800 leading-tight">
                      PEMERINTAH KOTA SEMARANG
                    </div>
                    <div className="text-xs font-semibold uppercase text-slate-800 leading-tight">
                      KECAMATAN {profile.kecamatan.toUpperCase()}
                    </div>
                    <div className="text-xs font-semibold uppercase text-slate-800 leading-tight">
                      KELURAHAN {profile.kelurahan.toUpperCase()}
                    </div>
                    <div className="text-xs font-bold uppercase text-slate-900 leading-tight">
                      RT {profile.rtNumber} RW {profile.rwNumber}
                    </div>
                    <p className="text-[10px] text-slate-600 leading-tight">
                      Alamat: Ngabean RT {profile.rtNumber} RW {profile.rwNumber} Kelurahan {profile.kelurahan}
                    </p>
                  </div>
                  <div className="w-16 h-16 flex-shrink-0"></div>
                </div>

                {/* DAFTAR HADIR (posisi center) */}
                <div className="text-center my-3">
                  <h1 className="text-base font-black tracking-widest uppercase underline underline-offset-4 text-slate-900">
                    DAFTAR HADIR
                  </h1>
                  <p className="text-[11px] font-bold uppercase mt-1 text-slate-700">
                    {selectedPresetId === 'notulen-tirakatan-16agustus' || selectedPresetId === 'notulen-resepsi-23agustus'
                      ? agendaSummary.toUpperCase()
                      : meetingType === 'rt' 
                      ? `PERTEMUAN RUTIN WARGA RT ${profile.rtNumber} RW ${profile.rwNumber}` 
                      : `PERTEMUAN RUTIN PKK RT ${profile.rtNumber} RW ${profile.rwNumber}`}
                  </p>
                </div>

                {/* Hari/tanggal, Waktu, Tempat, Agenda */}
                <div className="border border-slate-300 rounded-lg p-3 bg-slate-50/50 print:bg-transparent print:border-none print:p-0 mb-3">
                  <table className="w-full text-xs border-collapse">
                    <tbody>
                      <tr>
                        <td className="w-28 font-bold py-0.5 text-slate-900">Hari/tanggal</td>
                        <td className="w-4 py-0.5 text-center font-bold">:</td>
                        <td className="py-0.5 text-slate-800 font-semibold">{formatDate(date)}</td>
                      </tr>
                      <tr>
                        <td className="font-bold py-0.5 text-slate-900">Waktu</td>
                        <td className="py-0.5 text-center font-bold">:</td>
                        <td className="py-0.5 text-slate-800">{time}</td>
                      </tr>
                      <tr>
                        <td className="font-bold py-0.5 text-slate-900">Tempat</td>
                        <td className="py-0.5 text-center font-bold">:</td>
                        <td className="py-0.5 text-slate-800">{location}</td>
                      </tr>
                      <tr>
                        <td className="font-bold py-0.5 text-slate-900 align-top">Agenda</td>
                        <td className="py-0.5 text-center font-bold align-top">:</td>
                        <td className="py-0.5 text-slate-800 font-medium leading-normal">{agendaSummary}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Tabelnya: NO | Nama | L/P | Tanda Tangan (Silang) */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-slate-900 text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900 font-extrabold uppercase">
                        <th className="border border-slate-900 py-1.5 px-1 text-center w-10">NO</th>
                        <th className="border border-slate-900 py-1.5 px-3 text-left">Nama</th>
                        <th className="border border-slate-900 py-1.5 px-2 text-center w-14">L/P</th>
                        <th colSpan={2} className="border border-slate-900 py-1.5 px-2 text-center w-64">Tanda Tangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayAttendees.map((att) => {
                        const isOdd = att.no % 2 !== 0;
                        return (
                          <tr key={att.no} className="hover:bg-slate-50/50">
                            <td className="border border-slate-900 py-1 px-1 text-center font-bold text-[11px]">
                              {att.no}
                            </td>
                            <td className="border border-slate-900 py-1 px-3 font-semibold uppercase text-[11px]">
                              {blankNamesMode ? '' : att.name}
                            </td>
                            <td className="border border-slate-900 py-1 px-1 text-center font-bold text-[11px]">
                              {blankNamesMode ? '' : att.gender}
                            </td>
                            {isOdd ? (
                              <>
                                <td className="border border-slate-900 py-1 px-2 text-left w-32 font-semibold text-[11px]">
                                  {att.no}. ..........................
                                </td>
                                <td className="border border-slate-900 py-1 px-2 w-32 bg-slate-50/20"></td>
                              </>
                            ) : (
                              <>
                                <td className="border border-slate-900 py-1 px-2 w-32 bg-slate-50/20"></td>
                                <td className="border border-slate-900 py-1 px-2 text-left w-32 font-semibold text-[11px]">
                                  {att.no}. ..........................
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Tanda Tangan Mengetahui */}
                <div className="mt-8 pt-4 grid grid-cols-2 gap-8 text-xs text-center page-break-inside-avoid">
                  <div>
                    <p className="font-bold uppercase">
                      {meetingType === 'rt' ? `Notulis / Sekretaris RT ${profile.rtNumber}` : `Sekretaris PKK RT ${profile.rtNumber}`}
                    </p>
                    <div className="h-16"></div>
                    <p className="font-extrabold underline uppercase">{secretary}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 mb-1">Semarang, {formatDate(date)}</p>
                    <p className="font-bold uppercase">
                      {meetingType === 'rt' ? `Ketua RT ${profile.rtNumber}` : `Ketua PKK RT ${profile.rtNumber}`}
                    </p>
                    <div className="h-16"></div>
                    <p className="font-extrabold underline uppercase">{leader}</p>
                  </div>
                </div>
              </div>
            )
          )}

          {/* ================== VIEW 2: NOTULEN RAPAT ================== */}
          {docViewMode === 'notulen' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center">
                  <img 
                    src={meetingType === 'pkk' ? (profile.pkkLogoUrl || profile.logoUrl || "https://upload.wikimedia.org/wikipedia/commons/e/e9/Coat_of_arms_of_Semarang.svg") : (profile.logoUrl || "https://upload.wikimedia.org/wikipedia/commons/e/e9/Coat_of_arms_of_Semarang.svg")} 
                    alt={meetingType === 'pkk' ? "Logo PKK" : "Logo Kota Semarang"} 
                    className="w-14 h-14 object-contain"
                  />
                </div>
                <div className="text-center flex-grow px-2">
                  <div className="text-xs font-bold uppercase text-slate-800 leading-tight">
                    PEMERINTAH KOTA SEMARANG
                  </div>
                  <div className="text-xs font-semibold uppercase text-slate-800 leading-tight">
                    KECAMATAN {profile.kecamatan.toUpperCase()}
                  </div>
                  <div className="text-xs font-semibold uppercase text-slate-800 leading-tight">
                    KELURAHAN {profile.kelurahan.toUpperCase()}
                  </div>
                  <div className="text-xs font-bold uppercase text-slate-900 leading-tight">
                    RT {profile.rtNumber} RW {profile.rwNumber}
                  </div>
                  <p className="text-[10px] text-slate-600 leading-tight">
                    Alamat: Ngabean RT {profile.rtNumber} RW {profile.rwNumber} Kelurahan {profile.kelurahan}
                  </p>
                  <div className="h-px bg-slate-300 my-1"></div>
                  <h1 className="text-base font-extrabold uppercase text-slate-900 leading-tight">
                    {selectedPresetId === 'notulen-tirakatan-16agustus'
                      ? 'NOTULEN MALAM TIRAKATAN HUT RI KE 81 TAHUN 2026'
                      : selectedPresetId === 'notulen-resepsi-23agustus'
                      ? 'NOTULEN MALAM RESEPSI HUT RI KE 81 TAHUN 2026'
                      : meetingType === 'rt' ? 'NOTULEN RAPAT RUTIN WARGA' : 'NOTULEN PERTEMUAN PKK'}
                  </h1>
                  <p className="text-xs text-slate-600 mt-0.5">Bulan {month} Tahun {profile.year}</p>
                </div>
                <div className="w-16 h-16 flex-shrink-0"></div>
              </div>

              {/* Meeting Meta Table */}
              <table className="w-full text-xs border-collapse border border-slate-300">
                <tbody>
                  <tr>
                    <td className="border border-slate-300 p-2 font-semibold bg-slate-50 w-40">Hari / Tanggal</td>
                    <td className="border border-slate-300 p-2">{formatDate(date)}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 font-semibold bg-slate-50">Waktu / Pukul</td>
                    <td className="border border-slate-300 p-2">{time}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 font-semibold bg-slate-50">Tempat Pertemuan</td>
                    <td className="border border-slate-300 p-2">{location}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 font-semibold bg-slate-50">Agenda Rapat</td>
                    <td className="border border-slate-300 p-2 font-bold text-slate-900">{agendaSummary}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 font-semibold bg-slate-50">Pimpinan Rapat</td>
                    <td className="border border-slate-300 p-2">{leader}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 font-semibold bg-slate-50">Notulis / Sekretaris</td>
                    <td className="border border-slate-300 p-2">{secretary}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 font-semibold bg-slate-50">Jumlah Peserta Hadir</td>
                    <td className="border border-slate-300 p-2 font-bold">{participantCount} Orang (Daftar hadir terlampir)</td>
                  </tr>
                </tbody>
              </table>

              {/* Agenda Rapat */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase bg-slate-100 p-2 border-l-4 border-red-600">
                  I. Susunan Agenda / Acara Rapat
                </h3>
                <ol className="list-decimal list-inside space-y-1 text-xs pl-2">
                  {agendaItems.map((ag, i) => (
                    <li key={i}>{ag}</li>
                  ))}
                </ol>
              </div>

              {/* Uraian Pembahasan */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase bg-slate-100 p-2 border-l-4 border-red-600">
                  II. Uraian Pembahasan & Diskusi
                </h3>
                <p className="text-xs text-justify whitespace-pre-line bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {discussionNotes}
                </p>
              </div>

              {/* Hasil Keputusan */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase bg-slate-100 p-2 border-l-4 border-red-600">
                  III. Hasil Keputusan & Kesepakatan Warga
                </h3>
                <p className="text-xs text-justify whitespace-pre-line bg-slate-50 p-3 rounded-xl border border-slate-200 font-medium">
                  {decisions}
                </p>
              </div>

              {/* Signatures */}
              <div className="mt-12 pt-6 grid grid-cols-2 gap-8 text-xs text-center page-break-inside-avoid">
                <div>
                  <p className="font-semibold uppercase">Notulis / Sekretaris</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline uppercase">{secretary}</p>
                </div>
                <div>
                  <p className="text-slate-600 mb-1">Semarang, {formatDate(date)}</p>
                  <p className="font-semibold uppercase">Pimpinan Rapat / Ketua RT {profile.rtNumber}</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline uppercase">{leader}</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
