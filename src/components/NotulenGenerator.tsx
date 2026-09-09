import React, { useState } from 'react';
import { RtProfile, AttendeeItem } from '../types';
import { formatDate } from '../utils/formatters';
import { rtNotulenPresets, pkkNotulenPresets, defaultRtAttendees, defaultPkkAttendees } from '../data/initialData';
import { 
  FileText, 
  Printer, 
  Users, 
  BookOpen, 
  Sparkles,
  Mail,
  CheckCircle2,
  Award,
  Layers
} from 'lucide-react';
import { executePrint } from '../utils/printHelper';
import { Bot, Loader2 } from 'lucide-react';

interface NotulenGeneratorProps {
  profile: RtProfile;
}

export const NotulenGenerator: React.FC<NotulenGeneratorProps> = ({ profile }) => {
  const [docViewMode, setDocViewMode] = useState<'daftar-hadir' | 'notulen' | 'undangan'>('undangan');
  const [meetingType, setMeetingType] = useState<'rt' | 'pkk'>('rt');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('notulen-januari');
  const [tableLayoutMode, setTableLayoutMode] = useState<'auto' | '1-kolom' | '2-kolom-100' | '2-kolom'>('1-kolom');
  
  // Initialize with the 1st preset (Januari 2026 - Persiapan Haul)
  const firstPreset = rtNotulenPresets[0];
  const [month, setMonth] = useState(firstPreset.month);
  const [date, setDate] = useState(firstPreset.date);
  const [time, setTime] = useState(firstPreset.time);
  const [location, setLocation] = useState(firstPreset.location);
  const [leader, setLeader] = useState(firstPreset.leader || profile.ketuaRt);
  const [secretary, setSecretary] = useState(firstPreset.secretary || profile.sekretaris);
  const [participantCount, setParticipantCount] = useState(firstPreset.participantCount || 40);
  const [invitedCount, setInvitedCount] = useState(45); // Added for PKK
  const [absentNames, setAbsentNames] = useState(''); // Added for PKK
  const [arisanUang, setArisanUang] = useState(''); // Added for PKK Arisan
  const [arisanBarang, setArisanBarang] = useState(''); // Added for PKK Arisan
  const [agendaItems, setAgendaItems] = useState<string[]>([...firstPreset.agendaItems]);
  const [discussionNotes, setDiscussionNotes] = useState(firstPreset.discussionNotes);
  const [decisions, setDecisions] = useState(firstPreset.decisions);
  const [closingSentence, setClosingSentence] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState('');
  const [agendaSummary, setAgendaSummary] = useState(firstPreset.agendaItems[1] || firstPreset.agendaItems[0]);

  // Attendee list management
  const [rtAttendees] = useState<AttendeeItem[]>([...defaultRtAttendees]);
  const [pkkAttendees] = useState<AttendeeItem[]>([...defaultPkkAttendees]);
  const [blankNamesMode, setBlankNamesMode] = useState(false);
  const [nameWidthMode, setNameWidthMode] = useState<'standar' | 'ringkas' | 'leluasa'>('standar');
  const [includeAddressColumn, setIncludeAddressColumn] = useState<boolean>(false);
  const [showSignatureBlock, setShowSignatureBlock] = useState<boolean>(false);

  const [newAgenda, setNewAgenda] = useState('');

  const handleSelectPreset = (presetId: string, type: 'rt' | 'pkk' = meetingType) => {
    const list = type === 'pkk' ? pkkNotulenPresets : rtNotulenPresets;
    const preset = list.find((p) => p.id === presetId);
    if (!preset) return;
    setSelectedPresetId(presetId);
    setMonth(preset.month);
    setDate(preset.date);
    setTime(preset.time);
    setLocation(preset.location);
    if (type === 'pkk') {
      setLeader(preset.leader || profile.ketuaPkk || 'TISNANI SUBANDIYAH');
      setSecretary(preset.secretary || profile.sekretarisPkk || 'INDRIANAH');
    } else {
      setLeader(preset.leader || profile.ketuaRt);
      setSecretary(preset.secretary || profile.sekretaris);
    }
    setParticipantCount(preset.participantCount);
    setAgendaItems([...preset.agendaItems]);
    setDiscussionNotes(preset.discussionNotes);
    setDecisions(preset.decisions);
    setClosingSentence(type === 'pkk' ? 'Rapat PKK ditutup pukul 17.15 WIB dengan bacaan hamdallah, ucapan salam dan terimakasih.' : '');
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
      setTableLayoutMode('1-kolom');
    }
  };

  const switchMeetingType = (type: 'rt' | 'pkk') => {
    let base = selectedPresetId.replace('pkk-', '');
    if (base === 'notulen-tirakatan-16agustus' || base === 'notulen-resepsi-23agustus') {
      base = 'notulen-agustus';
    }
    const targetId = type === 'pkk' ? `pkk-${base}` : base;
    setMeetingType(type);
    handleSelectPreset(targetId, type);
  };

  const handleGenerateAI = async () => {
    setIsGeneratingAI(true);
    setAiError('');
    try {
      const response = await fetch('/api/generate-notulen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agendaItems,
          location,
          meetingType,
          participantCount,
          month
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate content');
      }
      const data = await response.json();
      if (data.discussionNotes) setDiscussionNotes(data.discussionNotes);
      if (data.decisions) setDecisions(data.decisions);
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Terjadi kesalahan saat memanggil AI.');
    } finally {
      setIsGeneratingAI(false);
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
    executePrint(`${docViewMode === 'daftar-hadir' ? 'Daftar Hadir' : docViewMode === 'undangan' ? 'Surat Undangan' : 'Notulen'} - ${month} ${profile.year}`);
  };

  const activeAttendees = meetingType === 'rt' ? rtAttendees : pkkAttendees;
  const displayAttendees: AttendeeItem[] = activeAttendees.slice(0, Math.max(participantCount, 1));
  const isDualColumn =
    tableLayoutMode === '2-kolom-100' ||
    tableLayoutMode === '2-kolom' ||
    (tableLayoutMode === 'auto' && participantCount > 40);

  const midPoint = Math.ceil(displayAttendees.length / 2);
  const col1Attendees = displayAttendees.slice(0, midPoint);
  const col2Attendees = displayAttendees.slice(midPoint);
  const isUltraCompact = displayAttendees.length > 50;
  const dualRowHeight = isUltraCompact
    ? (showSignatureBlock ? 'h-[13.5px] print:h-[13px]' : 'h-[15.5px] print:h-[14.5px]')
    : (showSignatureBlock ? 'h-[16.5px] print:h-[15.5px]' : 'h-[19px] print:h-[17.5px]');
  const dualHeaderFont = isUltraCompact ? 'text-[7.5px] print:text-[7px]' : 'text-[8.5px] print:text-[8px]';
  const dualTableFont = isUltraCompact ? 'text-[8px] print:text-[7.5px]' : 'text-[9px] print:text-[8.5px]';

  // Dynamic row sizing for 1-Kolom Standar so that the table fills the A4 page right down to the bottom
  const getSingleRowStyle = (count: number) => {
    if (count <= 20) {
      return {
        rowHeight: 'h-[36px] print:h-[9.5mm]',
        fontSize: 'text-[11px] print:text-[10.5px]',
        thHeight: 'h-[28px] print:h-[8mm]',
        py: 'py-1',
      };
    }
    if (count <= 25) {
      return {
        rowHeight: 'h-[30px] print:h-[7.8mm]',
        fontSize: 'text-[10.5px] print:text-[10px]',
        thHeight: 'h-[26px] print:h-[7.5mm]',
        py: 'py-1',
      };
    }
    if (count <= 30) {
      return {
        rowHeight: 'h-[26px] print:h-[6.6mm]',
        fontSize: 'text-[10px] print:text-[9.5px]',
        thHeight: 'h-[24px] print:h-[7mm]',
        py: 'py-0.5',
      };
    }
    if (count <= 35) {
      return {
        rowHeight: 'h-[23px] print:h-[5.7mm]',
        fontSize: 'text-[9.5px] print:text-[9px]',
        thHeight: 'h-[22px] print:h-[6.5mm]',
        py: 'py-0.5',
      };
    }
    if (count <= 40) {
      // 40 rows: precisely fills the A4 sheet down to the bottom margin without spilling
      return {
        rowHeight: 'h-[21px] print:h-[4.95mm]',
        fontSize: 'text-[9px] print:text-[8.5px]',
        thHeight: 'h-[22px] print:h-[6.5mm]',
        py: 'py-0',
      };
    }
    if (count <= 45) {
      return {
        rowHeight: 'h-[18.5px] print:h-[4.3mm]',
        fontSize: 'text-[8.5px] print:text-[8px]',
        thHeight: 'h-[20px] print:h-[6mm]',
        py: 'py-0',
      };
    }
    return {
      rowHeight: 'h-[16.5px] print:h-[3.9mm]',
      fontSize: 'text-[8px] print:text-[7.5px]',
      thHeight: 'h-[18px] print:h-[5.5mm]',
      py: 'py-0',
    };
  };

  const singleStyle = getSingleRowStyle(displayAttendees.length);

  const singleColWidths = includeAddressColumn
    ? nameWidthMode === 'ringkas'
      ? { no: 'w-[6%]', name: 'w-[26%]', gender: 'w-[10%]', addr: 'w-[22%]', ttd: 'w-[18%]', ttdTotal: 'w-[36%]' }
      : nameWidthMode === 'leluasa'
      ? { no: 'w-[6%]', name: 'w-[34%]', gender: 'w-[10%]', addr: 'w-[18%]', ttd: 'w-[16%]', ttdTotal: 'w-[32%]' }
      : { no: 'w-[7%]', name: 'w-[28%]', gender: 'w-[11%]', addr: 'w-[20%]', ttd: 'w-[17%]', ttdTotal: 'w-[34%]' }
    : nameWidthMode === 'ringkas'
    ? { no: 'w-[7%]', name: 'w-[28%]', gender: 'w-[15%]', addr: '', ttd: 'w-[25%]', ttdTotal: 'w-[50%]' }
    : nameWidthMode === 'leluasa'
    ? { no: 'w-[10%]', name: 'w-[40%]', gender: 'w-[14%]', addr: '', ttd: 'w-[18%]', ttdTotal: 'w-[36%]' }
    : { no: 'w-[10%]', name: 'w-[35%]', gender: 'w-[15%]', addr: '', ttd: 'w-[20%]', ttdTotal: 'w-[40%]' };

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
              <span>
                {selectedPresetId === 'notulen-tirakatan-16agustus' || selectedPresetId === 'notulen-resepsi-23agustus'
                  ? 'Berita Acara Pelaksanaan'
                  : 'Notulen Rapat'}
              </span>
            </button>
            <button
              onClick={() => setDocViewMode('undangan')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                docViewMode === 'undangan' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Surat Undangan</span>
            </button>
          </div>

          {/* Meeting Category Switcher */}
          <div className="inline-flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => switchMeetingType('rt')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                meetingType === 'rt' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              RT {profile.rtNumber}
            </button>
            <button
              onClick={() => switchMeetingType('pkk')}
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
            <span>{docViewMode === 'daftar-hadir' ? 'Cetak Daftar Hadir (PDF)' : docViewMode === 'undangan' ? 'Cetak Undangan (PDF)' : 'Cetak Notulen (PDF)'}</span>
          </button>
        </div>
      </div>

      {/* Quick Select Bar for RT 04 Meetings */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 print:hidden space-y-3.5">
        {/* Special Agustusan LPJ 100 Person Presets */}
          {meetingType === 'rt' && (
          <div className="bg-gradient-to-r from-red-500/10 via-amber-500/10 to-red-500/10 border border-red-200 rounded-xl p-3 mb-4">
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

          )}
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
                        {meetingType === 'rt' ? (
                          preset.month === 'Januari' ? 'Persiapan Haul' :
                          preset.month === 'Pebruari' ? 'Tabungan Warga' :
                          preset.month === 'Maret' ? 'Buka Bersama' :
                          preset.month === 'April' ? 'Halal Bi Halal' :
                          preset.month === 'Mei' ? 'Taman TOGA PKK' :
                          preset.month === 'Juni' ? 'Zarkasi Jogja' :
                          preset.month === 'Juli' ? 'Sosialisasi BOP' :
                          'HUT RI Ke-81'
                        ) : (
                          preset.month === 'Januari' ? 'Proker PKK' :
                          'Laporan Bulanan'
                        )}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:block">
        {/* Editor Form (Hidden on print) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs print:hidden space-y-4 text-xs">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-xs">
              {docViewMode === 'daftar-hadir' 
                ? 'Pengaturan Daftar Hadir' 
                : selectedPresetId === 'notulen-tirakatan-16agustus' || selectedPresetId === 'notulen-resepsi-23agustus'
                ? 'Formulir Berita Acara Pelaksanaan'
                : 'Formulir Notulen Rapat'}
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
                <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase">
                  Pas 1 Halaman A4
                </span>
              </label>
              <div className="grid grid-cols-2 gap-2">
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
                      s.d 40 Warga (Penuh Sampai Bawah)
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTableLayoutMode('2-kolom');
                  }}
                  className={`p-2 rounded-lg border text-left flex items-center space-x-2 transition-all ${
                    isDualColumn
                      ? 'bg-red-600 border-red-600 text-white font-bold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold leading-tight">2 Kolom (Rapat Akbar)</div>
                    <div className={`text-[9px] truncate ${isDualColumn ? 'text-red-100' : 'text-slate-500'}`}>
                      45 s.d 100 Warga
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
            {meetingType === 'pkk' && (
              <>
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">Jumlah Diundang</label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={invitedCount}
                    onChange={(e) => setInvitedCount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">Nama Yang Tidak Hadir</label>
                  <input
                    type="text"
                    placeholder="Contoh: Hanavia, Lukita, dll..."
                    value={absentNames}
                    onChange={(e) => setAbsentNames(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
                  />
                </div>
              </>
            )}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-slate-700 uppercase">Jumlah Hadir</label>
                <div className="space-x-1">
                  <button
                    type="button"
                    onClick={() => {
                      setParticipantCount(25);
                      setTableLayoutMode('auto');
                    }}
                    className="text-[10px] text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded"
                  >
                    25
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setParticipantCount(40);
                      setTableLayoutMode('auto');
                    }}
                    className="text-[10px] text-red-700 font-extrabold bg-red-100 hover:bg-red-200 px-2 py-0.5 rounded shadow-xs"
                  >
                    40 (Default)
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
                  if (val >= 25 && tableLayoutMode === 'auto') {
                    setTableLayoutMode('auto');
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

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="showSignature"
                  checked={showSignatureBlock}
                  onChange={(e) => setShowSignatureBlock(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="showSignature" className="text-[11px] font-medium text-slate-700 cursor-pointer">
                  Tampilkan Tanda Tangan Notulis & Ketua RT di Bawah Daftar Hadir
                </label>
              </div>

              {!isDualColumn && (
                <div className="pt-2 border-t border-red-200/60 space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="includeAddress"
                      checked={includeAddressColumn}
                      onChange={(e) => setIncludeAddressColumn(e.target.checked)}
                      className="rounded text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="includeAddress" className="text-[11px] font-medium text-slate-700 cursor-pointer">
                      Sertakan Kolom Alamat / RT (Format 5 Kolom)
                    </label>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                      Proporsi Kolom Tabel:
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        type="button"
                        onClick={() => setNameWidthMode('standar')}
                        className={`py-1.5 px-1 text-[10px] font-bold rounded border text-center transition-all ${
                          nameWidthMode === 'standar'
                            ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        Standar (35% - 15% - 40%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setNameWidthMode('ringkas')}
                        className={`py-1.5 px-1 text-[10px] font-bold rounded border text-center transition-all ${
                          nameWidthMode === 'ringkas'
                            ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        Ringkas (28% - 15% - 50%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setNameWidthMode('leluasa')}
                        className={`py-1.5 px-1 text-[10px] font-bold rounded border text-center transition-all ${
                          nameWidthMode === 'leluasa'
                            ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        Leluasa (40% - 14% - 36%)
                      </button>
                    </div>
                  </div>
                </div>
              )}

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

              <div className="pt-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700 uppercase">
                    {selectedPresetId === 'notulen-tirakatan-16agustus' || selectedPresetId === 'notulen-resepsi-23agustus'
                      ? 'Uraian Jalannya Acara & Pelaksanaan'
                      : 'Uraian Pembahasan Rapat'}
                  </label>
                  <button
                    onClick={handleGenerateAI}
                    disabled={isGeneratingAI || agendaItems.length === 0}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingAI ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Bot className="w-3.5 h-3.5" />
                    )}
                    Generate AI
                  </button>
                </div>
                {aiError && (
                  <div className="text-red-500 text-[10px] mb-2">{aiError}</div>
                )}
                <textarea
                  rows={4}
                  value={discussionNotes}
                  onChange={(e) => setDiscussionNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs"
                ></textarea>

                {meetingType === 'pkk' && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl space-y-3">
                    <h4 className="font-semibold text-red-900 uppercase text-[11px]">Pemenang Arisan (Lain-lain)</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-medium text-slate-700 mb-1">Arisan Uang (2 Orang)</label>
                        <input type="text" value={arisanUang} onChange={e => setArisanUang(e.target.value)} placeholder="Contoh: Bu Istianah, Bu Kakun" className="w-full bg-white border border-slate-200 rounded p-2 text-xs" />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-700 mb-1">Arisan Gula & Telur (2 Orang)</label>
                        <input type="text" value={arisanBarang} onChange={e => setArisanBarang(e.target.value)} placeholder="Contoh: Bu Istianah, Bu Ngatminah" className="w-full bg-white border border-slate-200 rounded p-2 text-xs" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  {selectedPresetId === 'notulen-tirakatan-16agustus' || selectedPresetId === 'notulen-resepsi-23agustus'
                    ? 'Hasil Pelaksanaan & Kesimpulan Acara'
                    : 'Hasil Keputusan Rapat'}
                </label>
                <textarea
                  rows={4}
                  value={decisions}
                  onChange={(e) => setDecisions(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs mb-3"
                ></textarea>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Kalimat Penutup (Opsional)
                </label>
                <input
                  type="text"
                  value={closingSentence}
                  onChange={(e) => setClosingSentence(e.target.value)}
                  placeholder="Contoh: Rapat ditutup pukul 22.00 WIB..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
                />
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
                {/* KOP Surat Resmi */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2 mb-2">
                  <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center">
                    <img 
                      src={meetingType === 'pkk' ? (profile.pkkLogoUrl || profile.logoUrl || "https://upload.wikimedia.org/wikipedia/commons/e/e9/Coat_of_arms_of_Semarang.svg") : (profile.logoUrl || "https://upload.wikimedia.org/wikipedia/commons/e/e9/Coat_of_arms_of_Semarang.svg")} 
                      alt={meetingType === 'pkk' ? "Logo PKK" : "Logo Kota Semarang"} 
                      className="w-14 h-14 object-contain"
                    />
                  </div>
                  <div className="text-center flex-grow px-2">
                    <div className="text-[12px] print:text-[12px] font-bold uppercase text-slate-800 leading-tight">
                      PEMERINTAH KOTA SEMARANG
                    </div>
                    <div className="text-[12px] print:text-[12px] font-semibold uppercase text-slate-800 leading-tight">
                      KECAMATAN {profile.kecamatan.toUpperCase()}
                    </div>
                    <div className="text-[12px] print:text-[12px] font-semibold uppercase text-slate-800 leading-tight">
                      KELURAHAN {profile.kelurahan.toUpperCase()}
                    </div>
                    <div className="text-[16px] print:text-[16px] font-bold uppercase text-slate-900 leading-tight">
                      RT {profile.rtNumber} RW {profile.rwNumber}
                    </div>
                    <p className="text-[8px] print:text-[7.5px] text-slate-600 leading-none mt-0.5">
                      Alamat: Ngabean RT {profile.rtNumber} RW {profile.rwNumber}, Kel. {profile.kelurahan}, Kec. {profile.kecamatan}, Kota Semarang
                    </p>
                  </div>
                  <div className="w-16 h-16 flex-shrink-0"></div>
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
                    <table className={`w-full border-collapse border border-slate-900 ${dualTableFont} leading-none`}>
                      <thead>
                        <tr className={`bg-slate-100 text-slate-900 font-black uppercase ${dualHeaderFont}`}>
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
                            <tr key={att.no} className={dualRowHeight}>
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
                    <table className={`w-full border-collapse border border-slate-900 ${dualTableFont} leading-none`}>
                      <thead>
                        <tr className={`bg-slate-100 text-slate-900 font-black uppercase ${dualHeaderFont}`}>
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
                            <tr key={att.no} className={dualRowHeight}>
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
                {showSignatureBlock && (
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
                )}
              </div>
            ) : (
              /* ================= 1 KOLOM STANDAR (20 - 40 WARGA) ================= */
              <div className="space-y-2 print-one-page text-slate-900 leading-tight">
                {/* KOP Surat Resmi */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2 mb-2">
                  <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center">
                    <img 
                      src={meetingType === 'pkk' ? (profile.pkkLogoUrl || profile.logoUrl || "https://upload.wikimedia.org/wikipedia/commons/e/e9/Coat_of_arms_of_Semarang.svg") : (profile.logoUrl || "https://upload.wikimedia.org/wikipedia/commons/e/e9/Coat_of_arms_of_Semarang.svg")} 
                      alt={meetingType === 'pkk' ? "Logo PKK" : "Logo Kota Semarang"} 
                      className="w-14 h-14 object-contain"
                    />
                  </div>
                  <div className="text-center flex-grow px-2">
                    <div className="text-[12px] print:text-[12px] font-bold uppercase text-slate-800 leading-tight">
                      PEMERINTAH KOTA SEMARANG
                    </div>
                    <div className="text-[12px] print:text-[12px] font-semibold uppercase text-slate-800 leading-tight">
                      KECAMATAN {profile.kecamatan.toUpperCase()}
                    </div>
                    <div className="text-[12px] print:text-[12px] font-semibold uppercase text-slate-800 leading-tight">
                      KELURAHAN {profile.kelurahan.toUpperCase()}
                    </div>
                    <div className="text-[16px] print:text-[16px] font-bold uppercase text-slate-900 leading-tight">
                      RT {profile.rtNumber} RW {profile.rwNumber}
                    </div>
                    <p className="text-[8px] print:text-[7.5px] text-slate-600 leading-none mt-0.5">
                      Alamat: Ngabean RT {profile.rtNumber} RW {profile.rwNumber}, Kel. {profile.kelurahan}, Kec. {profile.kecamatan}, Kota Semarang
                    </p>
                  </div>
                  <div className="w-16 h-16 flex-shrink-0"></div>
                </div>

                {/* DAFTAR HADIR (posisi center) */}
                <div className="text-center my-1.5">
                  <h1 className="text-xs print:text-[11px] font-black tracking-widest uppercase underline underline-offset-2 text-slate-900 leading-none">
                    DAFTAR HADIR WARGA
                  </h1>
                  <p className="text-[9.5px] print:text-[8.5px] font-extrabold uppercase mt-0.5 text-slate-800">
                    {selectedPresetId === 'notulen-tirakatan-16agustus' || selectedPresetId === 'notulen-resepsi-23agustus'
                      ? agendaSummary.toUpperCase()
                      : meetingType === 'rt' 
                      ? `PERTEMUAN RUTIN WARGA RT ${profile.rtNumber} RW ${profile.rwNumber}` 
                      : `PERTEMUAN RUTIN PKK RT ${profile.rtNumber} RW ${profile.rwNumber}`}
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

                {/* Tabelnya: NO | Nama | L/P | (Alamat Opsional) | Tanda Tangan (Silang) */}
                <div className="overflow-x-auto">
                  <table className="w-full table-fixed border-collapse border border-slate-900 text-[8.5px] print:text-[8px] leading-none">
                    <colgroup>
                      <col className={singleColWidths.no} />
                      <col className={singleColWidths.name} />
                      <col className={singleColWidths.gender} />
                      {includeAddressColumn && singleColWidths.addr && (
                        <col className={singleColWidths.addr} />
                      )}
                      <col className={singleColWidths.ttd} />
                      <col className={singleColWidths.ttd} />
                    </colgroup>
                    <thead>
                      <tr className={`bg-slate-100 text-slate-900 font-extrabold uppercase ${singleStyle.fontSize} ${singleStyle.thHeight}`}>
                        <th className={`border border-slate-900 ${singleStyle.py} px-1 text-center ${singleColWidths.no}`}>NO</th>
                        <th className={`border border-slate-900 ${singleStyle.py} px-2 text-left ${singleColWidths.name}`}>Nama Lengkap</th>
                        <th className={`border border-slate-900 ${singleStyle.py} px-1 text-center ${singleColWidths.gender}`}>L/P</th>
                        {includeAddressColumn && singleColWidths.addr && (
                          <th className={`border border-slate-900 ${singleStyle.py} px-1 text-center ${singleColWidths.addr}`}>Alamat / RT</th>
                        )}
                        <th colSpan={2} className={`border border-slate-900 ${singleStyle.py} px-1 text-center ${singleColWidths.ttdTotal}`}>
                          Tanda Tangan
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayAttendees.map((att) => {
                        const isOdd = att.no % 2 !== 0;
                        return (
                          <tr key={att.no} className={singleStyle.rowHeight}>
                            <td className={`border border-slate-900 ${singleStyle.py} px-1 text-center font-bold ${singleStyle.fontSize}`}>
                              {att.no}
                            </td>
                            <td className={`border border-slate-900 ${singleStyle.py} px-2 font-semibold uppercase truncate ${singleStyle.fontSize}`}>
                              {blankNamesMode ? '' : att.name}
                            </td>
                            <td className={`border border-slate-900 ${singleStyle.py} px-1 text-center font-bold ${singleStyle.fontSize}`}>
                              {blankNamesMode ? '' : att.gender}
                            </td>
                            {includeAddressColumn && singleColWidths.addr && (
                              <td className={`border border-slate-900 ${singleStyle.py} px-1.5 text-center text-slate-700 truncate ${singleStyle.fontSize}`}>
                                {blankNamesMode ? '' : `RT ${profile.rtNumber} / RW ${profile.rwNumber}`}
                              </td>
                            )}
                            {isOdd ? (
                              <>
                                <td className={`border border-slate-900 ${singleStyle.py} px-2 text-left font-semibold truncate ${singleColWidths.ttd} ${singleStyle.fontSize}`}>
                                  {att.no}. ....................................................
                                </td>
                                <td className={`border border-slate-900 ${singleStyle.py} px-1.5 bg-slate-50/20 ${singleColWidths.ttd}`}></td>
                              </>
                            ) : (
                              <>
                                <td className={`border border-slate-900 ${singleStyle.py} px-1.5 bg-slate-50/20 ${singleColWidths.ttd}`}></td>
                                <td className={`border border-slate-900 ${singleStyle.py} px-2 text-left font-semibold truncate ${singleColWidths.ttd} ${singleStyle.fontSize}`}>
                                  {att.no}. ....................................................
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
                {showSignatureBlock && (
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
                )}
              </div>
            )
          )}

          {/* ================== VIEW 2: NOTULEN RAPAT (PAS 1 HALAMAN) ================== */}
          {docViewMode === 'notulen' && (
            <div className="space-y-4 print-one-page text-slate-900 leading-relaxed">
              {/* KOP Surat Resmi */}
              <div className="flex items-center justify-between border-b-4 border-double border-slate-900 pb-3 mb-4">
                <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center">
                  <img 
                    src={meetingType === 'pkk' ? (profile.pkkLogoUrl || profile.logoUrl || "https://upload.wikimedia.org/wikipedia/commons/e/e9/Coat_of_arms_of_Semarang.svg") : (profile.logoUrl || "https://upload.wikimedia.org/wikipedia/commons/e/e9/Coat_of_arms_of_Semarang.svg")} 
                    alt={meetingType === 'pkk' ? "Logo PKK" : "Logo Kota Semarang"} 
                    className="w-16 h-16 object-contain"
                  />
                </div>
                <div className="text-center flex-grow px-4">
                  <div className="text-sm print:text-sm font-bold uppercase text-slate-800 leading-tight">
                    PEMERINTAH KOTA SEMARANG
                  </div>
                  <div className="text-sm print:text-sm font-semibold uppercase text-slate-800 leading-tight">
                    KECAMATAN {profile.kecamatan.toUpperCase()}
                  </div>
                  <div className="text-sm print:text-sm font-semibold uppercase text-slate-800 leading-tight">
                    KELURAHAN {profile.kelurahan.toUpperCase()}
                  </div>
                  <div className="text-xl print:text-xl font-bold uppercase text-slate-900 leading-tight mt-1">
                    RT {profile.rtNumber} RW {profile.rwNumber} NGABEAN
                  </div>
                  <p className="text-xs print:text-xs text-slate-600 leading-relaxed mt-1">
                    Alamat: Ngabean RT {profile.rtNumber} RW {profile.rwNumber}, Kel. {profile.kelurahan}, Kec. {profile.kecamatan}, Kota Semarang
                  </p>
                </div>
                <div className="w-20 h-20 flex-shrink-0"></div>
              </div>

              {/* Judul Notulen */}
              <div className="text-center my-4">
                <h1 className="text-base print:text-base font-black tracking-wider uppercase underline underline-offset-4 text-slate-900 leading-tight">
                  {selectedPresetId === 'notulen-tirakatan-16agustus'
                    ? 'BERITA ACARA & NOTULEN PELAKSANAAN MALAM TIRAKATAN HUT RI KE 81 TAHUN 2026'
                    : selectedPresetId === 'notulen-resepsi-23agustus'
                    ? 'BERITA ACARA & NOTULEN PELAKSANAAN MALAM RESEPSI HUT RI KE 81 TAHUN 2026'
                    : meetingType === 'rt' 
                    ? `NOTULEN RAPAT RUTIN WARGA RT ${profile.rtNumber} RW ${profile.rwNumber}` 
                    : `NOTULEN PERTEMUAN RUTIN PKK RT ${profile.rtNumber} RW ${profile.rwNumber}`}
                </h1>
                <p className="text-xs print:text-xs font-bold uppercase text-slate-700 mt-2">
                  Bulan {month} Tahun {profile.year}
                </p>
              </div>

              {/* Tabel Meta Pertemuan (Grid 2 Kolom Ringkas) */}
              <table className="w-full border-collapse border border-slate-900 text-[13px] print:text-[13px] mb-4 leading-relaxed">
                <tbody>
                  <tr>
                    <td className="border border-slate-900 py-1.5 px-2.5 font-bold bg-slate-100 w-32">Hari / Tanggal</td>
                    <td className="border border-slate-900 py-1.5 px-2.5 font-semibold text-slate-900 w-[30%]">{formatDate(date)}</td>
                    <td className="border border-slate-900 py-1.5 px-2.5 font-bold bg-slate-100 w-40">Pimpinan Rapat</td>
                    <td className="border border-slate-900 py-1.5 px-2.5 font-semibold text-slate-900">{leader}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-900 py-1.5 px-2.5 font-bold bg-slate-100">Waktu / Pukul</td>
                    <td className="border border-slate-900 py-1.5 px-2.5 text-slate-900">{time}</td>
                    <td className="border border-slate-900 py-1.5 px-2.5 font-bold bg-slate-100">Notulis / Sekretaris</td>
                    <td className="border border-slate-900 py-1.5 px-2.5 font-semibold text-slate-900">{secretary}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-900 py-1.5 px-2.5 font-bold bg-slate-100 w-32">Tempat</td>
                    <td className="border border-slate-900 py-1.5 px-2.5 text-slate-900 w-[30%]">{location}</td>
                    {meetingType === 'pkk' ? (
                      <td colSpan={2} className="border border-slate-900 p-0 align-top">
                        <table className="w-full h-full">
                          <tbody>
                            <tr>
                              <td className="py-1 px-2.5 font-bold bg-slate-100 border-b border-r border-slate-900 w-40">Jumlah Diundang</td>
                              <td className="py-1 px-2.5 text-slate-900 border-b border-slate-900 font-bold">{invitedCount} Orang</td>
                            </tr>
                            <tr>
                              <td className="py-1 px-2.5 font-bold bg-slate-100 border-b border-r border-slate-900">Peserta Hadir</td>
                              <td className="py-1 px-2.5 text-slate-900 border-b border-slate-900 font-bold">{participantCount} Orang</td>
                            </tr>
                            <tr>
                              <td className="py-1 px-2.5 font-bold bg-slate-100 border-r border-slate-900">Tidak Hadir</td>
                              <td className="py-1 px-2.5 text-slate-900 font-bold">
                                {Math.max(0, invitedCount - participantCount)} Orang
                                {absentNames && <span className="font-normal block mt-0.5 text-xs">({absentNames})</span>}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    ) : (
                      <>
                        <td className="border border-slate-900 py-1.5 px-2.5 font-bold bg-slate-100 w-40">Peserta Hadir</td>
                        <td className="border border-slate-900 py-1.5 px-2.5 font-bold text-slate-900">{participantCount} Orang (Daftar Hadir Terlampir)</td>
                      </>
                    )}
                  </tr>
                  <tr>
                    <td className="border border-slate-900 py-1.5 px-2.5 font-bold bg-slate-100">Agenda Rapat</td>
                    <td colSpan={3} className="border border-slate-900 py-1.5 px-2.5 font-bold text-slate-900">{agendaSummary}</td>
                  </tr>
                </tbody>
              </table>

              {/* I. Susunan Acara Rapat (Kompak 2 Kolom) */}
              <div className="mb-4">
                <div className="text-sm print:text-sm font-bold uppercase bg-slate-100 py-1.5 px-2.5 border-l-4 border-slate-900 text-slate-900 mb-2">
                  {selectedPresetId === 'notulen-tirakatan-16agustus' || selectedPresetId === 'notulen-resepsi-23agustus'
                    ? 'I. Susunan Acara Pelaksanaan Kegiatan'
                    : 'I. Susunan Agenda / Acara Rapat'}
                </div>
                <div className={`grid ${meetingType === 'pkk' ? 'grid-cols-1' : 'grid-cols-2'} gap-x-4 gap-y-1.5 text-[13px] print:text-[13px] pl-3 leading-relaxed text-slate-800`}>
                  {agendaItems.map((ag, i) => (
                    <div key={i} className="flex space-x-2">
                      <span className="font-bold text-slate-900">{i + 1}.</span>
                      <span className="whitespace-pre-line">
                        {ag}
                        {meetingType === 'pkk' && ag.toLowerCase().includes('lain-lain') && (arisanUang || arisanBarang) && (
                          <>{`\n      Uang : ${arisanUang || '-'}\n      Gula dan Telur : ${arisanBarang || '-'}`}</>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* II. Uraian Pembahasan / Jalannya Acara */}
              <div className="mb-4">
                <div className="text-sm print:text-sm font-bold uppercase bg-slate-100 py-1.5 px-2.5 border-l-4 border-slate-900 text-slate-900 mb-2">
                  {selectedPresetId === 'notulen-tirakatan-16agustus' || selectedPresetId === 'notulen-resepsi-23agustus'
                    ? 'II. Uraian Jalannya Acara & Pelaksanaan Kegiatan'
                    : 'II. Uraian Pembahasan & Diskusi Rapat'}
                </div>
                <div className="text-[13px] print:text-[13px] text-justify leading-relaxed whitespace-pre-line text-slate-900 border border-slate-300 rounded p-3 bg-slate-50/40 print:bg-transparent print:p-0 print:border-none">
                  {discussionNotes}
                </div>
              </div>

              {/* III. Hasil Keputusan / Kesepakatan Warga */}
              <div className="mb-6">
                <div className="text-sm print:text-sm font-bold uppercase bg-slate-100 py-1.5 px-2.5 border-l-4 border-slate-900 text-slate-900 mb-2">
                  {selectedPresetId === 'notulen-tirakatan-16agustus' || selectedPresetId === 'notulen-resepsi-23agustus'
                    ? 'III. Hasil Pelaksanaan Kegiatan & Kesimpulan'
                    : 'III. Hasil Keputusan & Kesepakatan Warga'}
                </div>
                <div className="text-[13px] print:text-[13px] text-justify leading-relaxed whitespace-pre-line text-slate-900 font-medium border border-slate-300 rounded p-3 bg-slate-50/40 print:bg-transparent print:p-0 print:border-none">
                  {decisions}
                </div>
              </div>

              {closingSentence && (
                <div className="text-[13px] print:text-[13px] text-slate-900 mb-6 text-justify">
                  {closingSentence}
                </div>
              )}

              {/* Tanda Tangan Mengetahui */}
              <div className="mt-8 pt-4 grid grid-cols-2 gap-12 text-[13px] print:text-[13px] text-center print-avoid-break">
                <div>
                  <p className="font-bold uppercase">
                    {meetingType === 'rt' ? `Notulis / Sekretaris RT ${profile.rtNumber}` : `Sekretaris PKK RT ${profile.rtNumber}`}
                  </p>
                  <div className="h-20 print:h-20"></div>
                  <p className="font-extrabold underline uppercase">{secretary}</p>
                </div>
                <div>
                  <p className="text-slate-600 mb-1">Semarang, {formatDate(date)}</p>
                  <p className="font-bold uppercase">
                    {meetingType === 'rt' ? `Ketua RT ${profile.rtNumber}` : `Ketua PKK RT ${profile.rtNumber}`}
                  </p>
                  <div className="h-20 print:h-20"></div>
                  <p className="font-extrabold underline uppercase">{leader}</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
