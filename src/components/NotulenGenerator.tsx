import { DEFAULT_SEMARANG_LOGO } from '../data/initialData';
import React, { useState, useEffect } from 'react';
import { RtProfile, AttendeeItem, NotulenPreset } from '../types';
import { formatDate, formatDateWithDay } from '../utils/formatters';
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
  Layers,
  Scissors,
  RotateCcw
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
  const [rtPresets, setRtPresets] = useState<NotulenPreset[]>(() => {
    const saved = localStorage.getItem('rtNotulenPresets');
    return saved ? JSON.parse(saved) : rtNotulenPresets;
  });

  const [pkkPresets, setPkkPresets] = useState<NotulenPreset[]>(() => {
    const saved = localStorage.getItem('pkkNotulenPresets');
    return saved ? JSON.parse(saved) : pkkNotulenPresets;
  });

  useEffect(() => {
    localStorage.setItem('rtNotulenPresets', JSON.stringify(rtPresets));
  }, [rtPresets]);

  useEffect(() => {
    localStorage.setItem('pkkNotulenPresets', JSON.stringify(pkkPresets));
  }, [pkkPresets]);

  const firstPreset = rtPresets[0] || rtNotulenPresets[0];
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

  // Auto-save changes to the currently selected preset in memory
  useEffect(() => {
    if (!selectedPresetId) return;
    const updatedPreset: NotulenPreset = {
      id: selectedPresetId,
      month,
      date,
      time,
      location,
      participantCount,
      leader,
      secretary,
      agendaItems,
      discussionNotes,
      decisions,
      invitedCount,
      absentNames,
      arisanUang,
      arisanBarang
    };
    
    if (meetingType === 'rt') {
      setRtPresets(prev => {
        const idx = prev.findIndex(p => p.id === selectedPresetId);
        if (idx === -1) return prev;
        if (JSON.stringify(prev[idx]) === JSON.stringify(updatedPreset)) return prev;
        const copy = [...prev];
        copy[idx] = updatedPreset;
        return copy;
      });
    } else {
      setPkkPresets(prev => {
        const idx = prev.findIndex(p => p.id === selectedPresetId);
        if (idx === -1) return prev;
        if (JSON.stringify(prev[idx]) === JSON.stringify(updatedPreset)) return prev;
        const copy = [...prev];
        copy[idx] = updatedPreset;
        return copy;
      });
    }
  }, [selectedPresetId, month, date, time, location, participantCount, leader, secretary, agendaItems, discussionNotes, decisions, invitedCount, absentNames, arisanUang, arisanBarang, meetingType]);

  // Roman numeral and month index helpers for official documents
  const getRomanMonth = (m: string) => {
    const map: Record<string, string> = {
      'Januari': 'I', 'Februari': 'II', 'Maret': 'III', 'April': 'IV',
      'Mei': 'V', 'Juni': 'VI', 'Juli': 'VII', 'Agustus': 'VIII',
      'September': 'IX', 'Oktober': 'X', 'November': 'XI', 'Desember': 'XII'
    };
    return map[m] || 'I';
  };

  const getMonthIndexNumber = (m: string) => {
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const idx = months.indexOf(m);
    return idx >= 0 ? String(idx + 1).padStart(3, '0') : '001';
  };

  const getIndonesianDayName = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Hari H';
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      return days[d.getDay()];
    } catch {
      return 'Hari H';
    }
  };

  // Surat Undangan specific states
  const [undanganNomorCustom, setUndanganNomorCustom] = useState<string>('');
  const [undanganHalCustom, setUndanganHalCustom] = useState<string>('');
  const [undanganPenerimaCustom, setUndanganPenerimaCustom] = useState<string>('');
  const [undanganAcaraCustom, setUndanganAcaraCustom] = useState<string>('');
  const [undanganSalamPembuka, setUndanganSalamPembuka] = useState<string>('Assalamualaikum Wr.Wb.');
  const [undanganSalamPenutup, setUndanganSalamPenutup] = useState<string>('Wassalamuailikum Wr.Wb.');
  const [undanganPengantarCustom, setUndanganPengantarCustom] = useState<string>('');
  const [undanganPenutupCustom, setUndanganPenutupCustom] = useState<string>('');
  const [undanganCatatan, setUndanganCatatan] = useState<string>('');
  const [showAgendaDetailsInUndangan, setShowAgendaDetailsInUndangan] = useState<boolean>(false);
  const [undanganLayout, setUndanganLayout] = useState<'1-halaman' | '2-in-1'>('1-halaman');
  const [undanganDateCustom, setUndanganDateCustom] = useState<string>('');

  const handleSelectPreset = (presetId: string, type: 'rt' | 'pkk' = meetingType) => {
    const list = type === 'pkk' ? pkkPresets : rtPresets;
    const preset = list.find((p) => p.id === presetId);
    if (!preset) return;
    setSelectedPresetId(presetId);
    setMonth(preset.month);
    setDate(preset.date);
    setTime(preset.time);
    setLocation(preset.location);
    if (type === 'pkk') {
      setLeader(preset.leader || profile.ketuaPkk || 'TISTANI SUBANDIYAH');
      setSecretary(preset.secretary || profile.sekretarisPkk || 'INDRIANAH');
    } else {
      setLeader(preset.leader || profile.ketuaRt);
      setSecretary(preset.secretary || profile.sekretaris);
    }
    setParticipantCount(preset.participantCount);
    setInvitedCount(preset.invitedCount !== undefined ? preset.invitedCount : 45);
    setAbsentNames(preset.absentNames !== undefined ? preset.absentNames : '');
    setArisanUang(preset.arisanUang !== undefined ? preset.arisanUang : '');
    setArisanBarang(preset.arisanBarang !== undefined ? preset.arisanBarang : '');
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

      const responseText = await response.text();
      let data: any = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseErr) {
        throw new Error(responseText || 'Server returned invalid response');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate content');
      }

      if (data.discussionNotes) setDiscussionNotes(data.discussionNotes);
      if (data.decisions) setDecisions(data.decisions);
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Terjadi kesalahan saat memanggil AI.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSavePreset = () => {
    const updatedPreset = {
      id: selectedPresetId,
      month,
      date,
      time,
      location,
      participantCount: 40,
      leader,
      secretary,
      agendaTitle: (meetingType === 'rt' ? rtPresets : pkkPresets).find(p => p.id === selectedPresetId)?.agendaTitle,
      agendaItems: [...agendaItems]
    };

    if (meetingType === 'rt') {
      setRtPresets(prev => prev.map(p => p.id === selectedPresetId ? updatedPreset : p));
    } else {
      setPkkPresets(prev => prev.map(p => p.id === selectedPresetId ? updatedPreset : p));
    }
    // simple UI feedback without full alert if possible, but alert is fine for simple app
    alert('Jadwal/Notulen berhasil disimpan!');
  };

  const handleAddPreset = () => {
    const newId = `${meetingType}-notulen-${Date.now()}`;
    const newPreset = {
      id: newId,
      month: 'Baru',
      date: new Date().toISOString().split('T')[0],
      time: '19:30 - selesai',
      location: meetingType === 'rt' ? 'Kediaman ...' : 'Kediaman Ibu Tistani Subandiyah',
      participantCount: 40,
      leader,
      secretary,
      agendaItems: ['Agenda Baru']
    };

    if (meetingType === 'rt') {
      setRtPresets(prev => [...prev, newPreset]);
    } else {
      setPkkPresets(prev => [...prev, newPreset]);
    }
    
    // Select it
    setSelectedPresetId(newId);
    setMonth(newPreset.month);
    setDate(newPreset.date);
    setTime(newPreset.time);
    setLocation(newPreset.location);
    setAgendaItems([...newPreset.agendaItems]);
  };

  const handleDeletePreset = () => {
    if (confirm('Yakin ingin menghapus jadwal ini?')) {
      if (meetingType === 'rt') {
        setRtPresets(prev => {
          const filtered = prev.filter(p => p.id !== selectedPresetId);
          if (filtered.length > 0) {
            setTimeout(() => handleSelectPreset(filtered[0].id, 'rt'), 0);
          }
          return filtered;
        });
      } else {
        setPkkPresets(prev => {
          const filtered = prev.filter(p => p.id !== selectedPresetId);
          if (filtered.length > 0) {
            setTimeout(() => handleSelectPreset(filtered[0].id, 'pkk'), 0);
          }
          return filtered;
        });
      }
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

  const romanMonth = getRomanMonth(month);
  const numMonth = getMonthIndexNumber(month);
  const defaultNomorSurat = meetingType === 'rt'
    ? `${numMonth}/UND-RT.04/${romanMonth}/${profile.year}`
    : `${numMonth}/PKK-RT.04/${romanMonth}/${profile.year}`;
  const currentNomorSurat = undanganNomorCustom || defaultNomorSurat;

  const defaultHalSurat = meetingType === 'rt'
    ? `Undangan Pertemuan Rutin Warga RT ${profile.rtNumber} RW ${profile.rwNumber}`
    : `Undangan Pertemuan Rutin PKK RT ${profile.rtNumber} RW ${profile.rwNumber}`;
  const currentHalSurat = undanganHalCustom || defaultHalSurat;

  const defaultPenerima = meetingType === 'rt'
    ? `Bapak / Ibu Warga RT ${profile.rtNumber} RW ${profile.rwNumber}`
    : `Ibu-Ibu Warga RT ${profile.rtNumber} RW ${profile.rwNumber}`;
  const currentPenerima = undanganPenerimaCustom || defaultPenerima;

  const currentUndanganDate = undanganDateCustom || date;

  const defaultPengantar = meetingType === 'rt'
    ? `Sehubungan dengan akan dilaksanakannya pertemuan rutin warga Ngabean RT. ${profile.rtNumber} RW. ${profile.rwNumber}   maka dengan ini kami mengundang Bapak/Ibu  untuk menghadiri acara tersebut  yang akan dilaksanakan pada :`
    : `Sehubungan dengan akan dilaksanakannya pertemuan rutin PKK warga Ngabean RT. ${profile.rtNumber} RW. ${profile.rwNumber}   maka dengan ini kami mengundang Ibu-Ibu  untuk menghadiri acara tersebut  yang akan dilaksanakan pada :`;
  const currentPengantar = undanganPengantarCustom || defaultPengantar;

  const defaultAcara = meetingType === 'rt'
    ? (selectedPresetId === 'notulen-tirakatan-16agustus'
        ? 'Malam Tirakatan HUT RI Ke 81'
        : selectedPresetId === 'notulen-resepsi-23agustus'
        ? 'Malam Resepsi HUT RI Ke 81'
        : `Pertemuan rutin  RT. ${profile.rtNumber}`)
    : `Pertemuan rutin  PKK RT. ${profile.rtNumber}`;
  const currentAcara = undanganAcaraCustom || defaultAcara;

  const defaultPenutup = 'Demikian surat undangan ini kami sampaikan, atas perhatiannya dan kehadirannya di ucapkan terima kasih.';
  const currentPenutup = undanganPenutupCustom || defaultPenutup;

  const currentSalamPembuka = undanganSalamPembuka || 'Assalamualaikum Wr.Wb.';
  const currentSalamPenutup = undanganSalamPenutup || 'Wassalamuailikum Wr.Wb.';

  const renderUndanganBody = (isCompact: boolean = false) => {
    const kopTitleSize = isCompact ? 'text-[11px] print:text-[10px]' : 'text-[13px] print:text-[13px]';
    const kopSubSize = isCompact ? 'text-[9.5px] print:text-[9px]' : 'text-[12px] print:text-[12px]';
    const kopRtSize = isCompact ? 'text-[13px] print:text-[12px]' : 'text-[16px] print:text-[15px]';
    const kopAddressSize = isCompact ? 'text-[8px] print:text-[7.5px]' : 'text-[9.5px] print:text-[9px]';
    const logoSize = isCompact ? 'w-16 h-16 print:w-16 print:h-16' : 'w-24 h-24 sm:w-26 sm:h-26 print:w-24 print:h-24';
    const textSize = isCompact ? 'text-[10.5px] print:text-[9.5px]' : 'text-[13px] print:text-[12.5px]';
    const spacingClass = isCompact ? 'space-y-2' : 'space-y-3.5';
    const tablePadding = isCompact ? 'py-0.5' : 'py-1';
    const ttdHeight = isCompact ? 'h-12 print:h-11' : 'h-20 print:h-18';

    return (
      <div className={`text-slate-900 leading-normal ${spacingClass}`}>
        {/* KOP Surat Resmi */}
        <div className="flex items-center justify-between border-b-4 border-double border-slate-900 pb-2 mb-3">
          <div className={`${logoSize} flex-shrink-0 flex items-center justify-center`}>
            <img 
              src={meetingType === 'pkk' ? (profile.pkkLogoUrl || profile.logoUrl || DEFAULT_SEMARANG_LOGO) : (profile.logoUrl || DEFAULT_SEMARANG_LOGO)} 
              alt={meetingType === 'pkk' ? "Logo PKK" : "Logo Kota Semarang"} 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="text-center flex-grow px-2">
            {meetingType === 'rt' ? (
              <>
                <div className="text-[14px] font-bold uppercase text-slate-900 leading-tight">
                  PEMERINTAH KOTA SEMARANG
                </div>
                <div className="text-[14px] font-bold uppercase text-slate-900 leading-tight">
                  KECAMATAN {profile.kecamatan}
                </div>
                <div className="text-[14px] font-bold uppercase text-slate-900 leading-tight">
                  KELURAHAN {profile.kelurahan}
                </div>
                <div className="text-[18px] font-bold uppercase text-slate-900 leading-tight mt-1">
                  RT {profile.rtNumber} RW {profile.rwNumber}
                </div>
              </>
            ) : (
              <>
                <div className="text-[14px] font-bold uppercase text-slate-900 leading-tight">
                  PEMBERDAYAAN DAN KESEJAHTERAAN KELUARGA (PKK)
                </div>
                <div className="text-[14px] font-bold uppercase text-slate-900 leading-tight">
                  TIM PENGGERAK PKK RT {profile.rtNumber} RW {profile.rwNumber} NGABEAN
                </div>
                <div className="text-[14px] font-bold uppercase text-slate-900 leading-tight">
                  KECAMATAN {profile.kecamatan}
                </div>
                <div className="text-[14px] font-bold uppercase text-slate-900 leading-tight">
                  KELURAHAN {profile.kelurahan}
                </div>
                <div className="text-[18px] font-bold uppercase text-slate-900 leading-tight mt-1">
                  KOTA SEMARANG
                </div>
              </>
            )}
            <p className="text-[10px] text-slate-800 leading-tight mt-1">
              Alamat: Ngabean RT {profile.rtNumber} RW {profile.rwNumber} Kelurahan {profile.kelurahan}
            </p>
          </div>
          <div className={`${logoSize} flex-shrink-0 flex items-center justify-center opacity-0 print:opacity-0`}>
            <div className="w-12 h-12"></div>
          </div>
        </div>

        {/* Tanggal Surat di Kanan Atas */}
        <div className={`flex justify-end ${textSize} mb-1`}>
          <span className="font-semibold">Semarang, {formatDate(currentUndanganDate)}</span>
        </div>

        {/* Baris Nomor, Lampiran, Perihal */}
        <div className={`space-y-0.5 ${textSize}`}>
          <div className="flex">
            <span className="w-20 sm:w-24 font-semibold">Nomor</span>
            <span className="w-4">:</span>
            <span className="font-medium">{currentNomorSurat || '-'}</span>
          </div>
          <div className="flex">
            <span className="w-20 sm:w-24 font-semibold">Lampiran</span>
            <span className="w-4">:</span>
            <span>-</span>
          </div>
          <div className="flex">
            <span className="w-20 sm:w-24 font-semibold">Perihal</span>
            <span className="w-4">:</span>
            <span className="font-bold underline">{currentHalSurat}</span>
          </div>
        </div>

        {/* Kepada Yth. Berada Tepat di Bawah Nomor Surat */}
        <div className={`${isCompact ? 'mt-2.5' : 'mt-4'} ${textSize}`}>
          <p>Kepada Yth.</p>
          <p className="font-bold">{currentPenerima}</p>
          <p>di -</p>
          <p className="pl-4 font-semibold">Tempat</p>
        </div>

        {/* Isi Surat */}
        <div className={`text-justify leading-relaxed mt-4 ${textSize}`}>
          <p className="mb-2 font-bold">{currentSalamPembuka}</p>
          <p className="mb-2 whitespace-pre-line">{currentPengantar}</p>
          
          <table className={`w-11/12 mx-auto my-3 font-semibold ${tablePadding}`}>
            <tbody>
              <tr>
                <td className="w-32 py-1">Hari, Tanggal</td>
                <td className="w-4 py-1">:</td>
                <td className="py-1">{formatDateWithDay(date)}</td>
              </tr>
              <tr>
                <td className="py-1">Waktu</td>
                <td className="py-1">:</td>
                <td className="py-1">{time}</td>
              </tr>
              <tr>
                <td className="py-1 align-top">Tempat</td>
                <td className="py-1 align-top">:</td>
                <td className="py-1 leading-normal font-bold">{location}</td>
              </tr>
              <tr>
                <td className="py-1 align-top">Agenda</td>
                <td className="py-1 align-top">:</td>
                <td className="py-1 leading-normal font-bold">{currentAcara}</td>
              </tr>
              {showAgendaDetailsInUndangan && (
                <tr>
                  <td className="py-1 align-top">Detail Agenda</td>
                  <td className="py-1 align-top">:</td>
                  <td className="py-1 font-normal text-[11px] print:text-[10px]">
                    <ul className="list-disc pl-4 space-y-0.5">
                      {agendaItems.map((ag, i) => (
                         <li key={i}>{ag}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {undanganCatatan && (
            <div className="mb-2 p-2 border-l-2 border-slate-900 bg-slate-50 text-[10px] print:text-[9.5px]">
              <span className="font-bold">Catatan Tambahan:</span><br/>
              <span className="whitespace-pre-line">{undanganCatatan}</span>
            </div>
          )}

          <p className="mb-4 whitespace-pre-line">{currentPenutup}</p>
          <p className="font-bold">{currentSalamPenutup}</p>
        </div>

        {/* Tanda Tangan */}
        <div className="mt-6 pt-2 flex justify-between text-center gap-4">
          <div className="w-48 text-center">
            <p className="font-bold uppercase text-[12px] print:text-[11px]">
              {meetingType === 'rt' ? `Sekretaris RT ${profile.rtNumber}` : `Sekretaris PKK RT ${profile.rtNumber}`}
            </p>
            <div className={ttdHeight}></div>
            <p className="font-extrabold underline uppercase text-[12px] print:text-[11px]">{secretary}</p>
          </div>
          <div className="w-48 text-center">
            <p className="font-bold uppercase text-[12px] print:text-[11px]">
              {meetingType === 'rt' ? `Ketua RT ${profile.rtNumber}` : `Ketua PKK RT ${profile.rtNumber}`}
            </p>
            <div className={ttdHeight}></div>
            <p className="font-extrabold underline uppercase text-[12px] print:text-[11px]">{leader}</p>
          </div>
        </div>
      </div>
    );
  };

  // Computed values and configurations for printable documents (Daftar Hadir & Notulen)
  const attendees = meetingType === 'rt' ? rtAttendees : pkkAttendees;
  const displayAttendees = attendees.slice(0, participantCount);
  const isDualColumn = tableLayoutMode === '2-kolom' || tableLayoutMode === '2-kolom-100';
  const col1Attendees = displayAttendees.slice(0, Math.ceil(displayAttendees.length / 2));
  const col2Attendees = displayAttendees.slice(Math.ceil(displayAttendees.length / 2));
  const dualTableFont = 'text-[9.5px] print:text-[8px]';
  const dualHeaderFont = 'text-[10px] print:text-[8px] h-6';
  const dualRowHeight = 'h-7 print:h-6';
  
  const singleColWidths = {
    no: 'w-10 sm:w-12',
    name: 'w-auto',
    gender: 'w-12',
    addr: includeAddressColumn ? 'w-24 sm:w-28' : '',
    ttd: 'w-24 sm:w-28',
    ttdTotal: 'w-48 sm:w-56'
  };

  const singleStyle = (() => {
    if (participantCount > 35) {
      return {
        fontSize: 'text-[10px] print:text-[8.5px]',
        rowHeight: 'h-6 print:h-5.5',
        thHeight: 'h-7 print:h-6',
        py: 'py-0.5',
      };
    } else if (participantCount > 25) {
      return {
        fontSize: 'text-[11px] print:text-[9.5px]',
        rowHeight: 'h-8 print:h-7',
        thHeight: 'h-9 print:h-8',
        py: 'py-1',
      };
    } else {
      return {
        fontSize: 'text-[12px] print:text-[11px]',
        rowHeight: 'h-10 print:h-9.5',
        thHeight: 'h-11 print:h-10',
        py: 'py-1.5',
      };
    }
  })();

  return (
    <div className="space-y-6 print:space-y-0 print:m-0 print:p-0">
      {/* Header/Controls */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            Generator Notulen & Undangan
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Buat Undangan, Daftar Hadir, dan Notulen kegiatan bulanan warga RT dan PKK.
          </p>
        </div>
        <div className="flex items-center bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200">
          <button
            onClick={() => {
              setMeetingType('rt');
              handleSelectPreset(rtPresets[0]?.id || 'notulen-januari', 'rt');
            }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              meetingType === 'rt' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Rapat RT
          </button>
          <button
            onClick={() => {
              setMeetingType('pkk');
              handleSelectPreset(pkkPresets[0]?.id || 'pkk-notulen-januari', 'pkk');
            }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              meetingType === 'pkk' ? 'bg-white text-rose-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Rapat PKK
          </button>
        </div>
      </div>

      {/* Control Panel / Presets */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs print:hidden">
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {meetingType === 'rt' ? 'Pertemuan Rutin Warga RT 04 (2026)' : 'Pertemuan Rutin PKK RT 04 (2026)'}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Apakah Anda yakin ingin mengatur ulang semua preset jadwal & notulen ke data bawaan? Semua perubahan kustom Anda akan dikembalikan.')) {
                    localStorage.removeItem('rtNotulenPresets');
                    localStorage.removeItem('pkkNotulenPresets');
                    window.location.reload();
                  }
                }}
                className="text-[10px] text-rose-600 hover:text-rose-700 font-bold hover:underline transition-colors ml-3"
              >
                (Reset ke Default)
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 items-center bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm mr-2"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{docViewMode === 'daftar-hadir' ? 'Cetak Daftar Hadir (PDF)' : docViewMode === 'undangan' ? 'Cetak Undangan (PDF)' : 'Cetak Notulen (PDF)'}</span>
            </button>
            <div className="w-px h-6 bg-slate-300 mx-1"></div>
            <button
              onClick={() => setDocViewMode('daftar-hadir')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                docViewMode === 'daftar-hadir' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Daftar Hadir</span>
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
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          {(meetingType === 'rt' ? rtPresets : pkkPresets).map((preset, idx) => {
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
                  <div className="text-[11px] font-extrabold leading-tight mt-0.5 truncate" title={preset.agendaTitle || preset.agendaItems[0]}>
                    {preset.agendaTitle || 
                      (meetingType === 'rt' ? (
                        preset.month === 'Januari' ? 'Persiapan Haul' :
                        preset.month === 'Pebruari' ? 'Tabungan Warga' :
                        preset.month === 'Maret' ? 'Buka Bersama' :
                        preset.month === 'April' ? 'Halal Bi Halal' :
                        preset.month === 'Mei' ? 'Taman TOGA PKK' :
                        preset.month === 'Juni' ? 'Zarkasi Jogja' :
                        preset.month === 'Juli' ? 'Sosialisasi BOP' :
                        preset.month === 'Agustus' ? 'HUT RI Ke-81' : 'Rapat Rutin'
                      ) : (
                        preset.month === 'Januari' ? 'Proker PKK' :
                        preset.month === 'Pebruari' || preset.month === 'Maret' || preset.month === 'April' || preset.month === 'Mei' || preset.month === 'Juni' || preset.month === 'Juli' || preset.month === 'Agustus' ? 'Laporan Bulanan' : 'Pertemuan PKK'
                      ))
                    }
                  </div>
                </div>
                <div className={`text-[9px] mt-1.5 pt-1 border-t truncate ${isActive ? 'border-slate-700 text-slate-300' : 'border-slate-100 text-slate-500'}`}>
                  {meetingType === 'rt' ? preset.location.replace('Kediaman ', '') : preset.location.replace('Kediaman Ibu ', 'Ibu ')}
                </div>
              </button>
            );
          })}
          </div>
        </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:block">
        {/* Editor Form (Hidden on print) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs print:hidden space-y-4 text-xs">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-xs">
              {docViewMode === 'daftar-hadir' 
                ? 'Pengaturan Daftar Hadir' 
                : docViewMode === 'undangan'
                ? (meetingType === 'rt' ? 'Pengaturan Surat Undangan RT' : 'Pengaturan Surat Undangan PKK')
                : selectedPresetId === 'notulen-tirakatan-16agustus' || selectedPresetId === 'notulen-resepsi-23agustus'
                ? 'Formulir Berita Acara Pelaksanaan'
                : 'Formulir Notulen Rapat'}
            </span>
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
              Bulan {month} 2026
            </span>
          </div>

          {docViewMode !== 'notulen' && (
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-800">
              <div className="font-semibold flex items-center gap-1.5 mb-1 text-indigo-900">
                <Bot className="w-3.5 h-3.5" />
                <span>Ingin Edit & Generate Notulen?</span>
              </div>
              <p className="text-[10px] leading-normal mb-2">
                Tombol <strong>Generate AI</strong> dan pengaturan detail pembahasan rapat berada di tab <strong>Notulen Rapat</strong>.
              </p>
              <button
                type="button"
                onClick={() => setDocViewMode('notulen')}
                className="w-full text-center py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[10px] transition-all"
              >
                Buka Tab Notulen Rapat & Generate AI
              </button>
            </div>
          )}

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
                    {/* ================== VIEW 1: DAFTAR HADIR (FORMAT KERTAS A4) ================== */}
          {docViewMode === 'daftar-hadir' && (
            <div className="space-y-4 print-one-page text-slate-900 leading-relaxed">
              {/* KOP Surat Resmi */}
              <div className="flex items-center justify-between border-b-4 border-double border-slate-900 pb-3 mb-4">
                <div className="w-24 h-24 sm:w-28 sm:h-28 print:w-24 print:h-24 flex-shrink-0 flex items-center justify-center">
                  <img 
                    src={meetingType === 'pkk' ? (profile.pkkLogoUrl || profile.logoUrl || DEFAULT_SEMARANG_LOGO) : (profile.logoUrl || DEFAULT_SEMARANG_LOGO)} 
                    alt={meetingType === 'pkk' ? "Logo PKK" : "Logo Kota Semarang"} 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-center flex-grow px-4">
                  <div className="text-[14px] font-bold uppercase text-slate-900 leading-tight">
                    PEMERINTAH KOTA SEMARANG
                  </div>
                  <div className="text-[14px] font-bold uppercase text-slate-900 leading-tight">
                    KECAMATAN {profile.kecamatan}
                  </div>
                  <div className="text-[14px] font-bold uppercase text-slate-900 leading-tight">
                    KELURAHAN {profile.kelurahan}
                  </div>
                  <div className="text-[18px] font-bold uppercase text-slate-900 leading-tight mt-1">
                    RT {profile.rtNumber} RW {profile.rwNumber} NGABEAN
                  </div>
                  <p className="text-[10px] text-slate-800 leading-tight mt-1">
                    Alamat: Ngabean RT {profile.rtNumber} RW {profile.rwNumber} Kelurahan {profile.kelurahan}
                  </p>
                </div>
                <div className="w-24 h-24 sm:w-28 sm:h-28 print:w-24 print:h-24 flex-shrink-0"></div>
              </div>

              {/* Judul Daftar Hadir */}
              <div className="text-center my-4">
                <h1 className="text-base print:text-base font-black tracking-wider uppercase underline underline-offset-4 text-slate-900 leading-tight">
                  {selectedPresetId === 'notulen-tirakatan-16agustus' || selectedPresetId === 'notulen-resepsi-23agustus' 
                    ? agendaSummary.toUpperCase()
                    : (meetingType === 'rt' 
                      ? `DAFTAR HADIR RAPAT RUTIN WARGA RT ${profile.rtNumber} RW ${profile.rwNumber}` 
                      : `DAFTAR HADIR PERTEMUAN RUTIN PKK RT ${profile.rtNumber} RW ${profile.rwNumber}`)}
                </h1>
                <p className="text-xs print:text-xs font-bold uppercase text-slate-700 mt-2">
                  Bulan {month} Tahun {profile.year}
                </p>
              </div>

              {/* Tabel Meta Pertemuan */}
              <div className="flex justify-between items-end mb-2">
                <table className="w-2/3 border-none text-[13px] print:text-[13px] leading-relaxed">
                  <tbody>
                    <tr>
                      <td className="py-0.5 font-bold w-32">Hari / Tanggal</td>
                      <td className="py-0.5 w-4 font-bold">:</td>
                      <td className="py-0.5">{formatDateWithDay(date)}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 font-bold w-32">Waktu / Pukul</td>
                      <td className="py-0.5 w-4 font-bold">:</td>
                      <td className="py-0.5">{time}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 font-bold w-32">Tempat</td>
                      <td className="py-0.5 w-4 font-bold">:</td>
                      <td className="py-0.5 font-bold uppercase">{location}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Tabel Kehadiran (Format Ringkas - 2 Kolom untuk menghemat kertas) */}
              <div className="grid grid-cols-2 gap-4 print:gap-x-8">
                {/* Kolom Kiri */}
                <table className="w-full border-collapse border border-slate-900 text-[11px] print:text-[11px] leading-tight">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-900 py-1.5 px-2 w-10 text-center">No</th>
                      <th className="border border-slate-900 py-1.5 px-2 text-left">{meetingType === 'rt' ? 'Nama Kepala Keluarga' : 'Nama Ibu / Anggota PKK'}</th>
                      <th className="border border-slate-900 py-1.5 px-2 w-20 text-center">Tanda Tangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendees.slice(0, Math.ceil(attendees.length / 2)).map((att, idx) => (
                      <tr key={idx}>
                        <td className="border border-slate-900 py-1.5 px-2 text-center">{idx + 1}</td>
                        <td className="border border-slate-900 py-1.5 px-2">{att.name}</td>
                        <td className="border border-slate-900 py-1.5 px-2 relative">
                          <span className={`absolute top-1/2 -translate-y-1/2 text-[9px] text-slate-400 ${(idx + 1) % 2 === 1 ? 'left-2' : 'right-2'}`}>
                            {idx + 1}.
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Kolom Kanan */}
                <table className="w-full border-collapse border border-slate-900 text-[11px] print:text-[11px] leading-tight">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-900 py-1.5 px-2 w-10 text-center">No</th>
                      <th className="border border-slate-900 py-1.5 px-2 text-left">{meetingType === 'rt' ? 'Nama Kepala Keluarga' : 'Nama Ibu / Anggota PKK'}</th>
                      <th className="border border-slate-900 py-1.5 px-2 w-20 text-center">Tanda Tangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendees.slice(Math.ceil(attendees.length / 2)).map((att, idx) => {
                      const realIdx = Math.ceil(attendees.length / 2) + idx;
                      return (
                        <tr key={realIdx}>
                          <td className="border border-slate-900 py-1.5 px-2 text-center">{realIdx + 1}</td>
                          <td className="border border-slate-900 py-1.5 px-2">{att.name}</td>
                          <td className="border border-slate-900 py-1.5 px-2 relative">
                            <span className={`absolute top-1/2 -translate-y-1/2 text-[9px] text-slate-400 ${(realIdx + 1) % 2 === 1 ? 'left-2' : 'right-2'}`}>
                              {realIdx + 1}.
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

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

          {/* Controls for Surat Undangan */}
          {docViewMode === 'undangan' && (
            <div className="space-y-4 pt-2">
              <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2.5">
                <label className="block font-bold text-blue-900 uppercase text-[11px] flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-700" />
                    <span>Format Lembar Cetak Undangan</span>
                  </span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase">
                    {undanganLayout === '1-halaman' ? '1 Lembar A4' : '2-in-1 Selebaran'}
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUndanganLayout('1-halaman')}
                    className={`p-2.5 rounded-lg border text-left flex items-center space-x-2 transition-all ${
                      undanganLayout === '1-halaman'
                        ? 'bg-slate-900 border-slate-900 text-white font-bold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <FileText className="w-4 h-4 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate">Surat Resmi A4</div>
                      <div className={`text-[9px] ${undanganLayout === '1-halaman' ? 'text-slate-300' : 'text-slate-500'}`}>
                        1 Surat Penuh
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUndanganLayout('2-in-1')}
                    className={`p-2.5 rounded-lg border text-left flex items-center space-x-2 transition-all ${
                      undanganLayout === '2-in-1'
                        ? 'bg-slate-900 border-slate-900 text-white font-bold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Scissors className="w-4 h-4 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate">2-in-1 Selebaran</div>
                      <div className={`text-[9px] ${undanganLayout === '2-in-1' ? 'text-slate-300' : 'text-slate-500'}`}>
                        2 Undangan / Lembar
                      </div>
                    </div>
                  </button>
                </div>
                <p className="text-[10px] text-blue-800 leading-snug">
                  {undanganLayout === '1-halaman' 
                    ? 'Format surat resmi 1 lembar A4 lengkap dengan KOP Surat, rincian acara, dan tanda tangan Ketua & Sekretaris.'
                    : 'Format selebaran hemat: mencetak 2 surat undangan berukuran presisi dalam 1 lembar kertas A4 dengan garis potong (cocok diedarkan ke warga).'}
                </p>
              </div>

              {/* Sesuaikan Teks Template Undangan */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-[11px] font-bold text-slate-800 uppercase flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    Teks Template Undangan
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setUndanganSalamPembuka('Assalamualaikum Wr.Wb.');
                      setUndanganSalamPenutup('Wassalamuailikum Wr.Wb.');
                      setUndanganPengantarCustom('');
                      setUndanganPenutupCustom('');
                      setUndanganAcaraCustom('');
                      setUndanganCatatan('');
                    }}
                    className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset Teks
                  </button>
                </div>

                <div>
                  <label className="block text-[10.5px] font-semibold text-slate-700 uppercase mb-1">
                    Salam Pembuka
                  </label>
                  <input
                    type="text"
                    value={currentSalamPembuka}
                    onChange={(e) => setUndanganSalamPembuka(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] font-semibold text-slate-700 uppercase mb-1">
                    Kalimat Pengantar Undangan
                  </label>
                  <textarea
                    rows={3}
                    value={currentPengantar}
                    onChange={(e) => setUndanganPengantarCustom(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10.5px] font-semibold text-slate-700 uppercase mb-1">
                      Nama Acara pada Undangan
                    </label>
                    <input
                      type="text"
                      value={currentAcara}
                      onChange={(e) => setUndanganAcaraCustom(e.target.value)}
                      placeholder="Contoh: Pertemuan rutin  RT. 04"
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-semibold text-slate-700 uppercase mb-1">
                      Tempat Acara
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Contoh: Bapak Arif"
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10.5px] font-semibold text-slate-700 uppercase mb-1">
                    Kalimat Penutup
                  </label>
                  <textarea
                    rows={2}
                    value={currentPenutup}
                    onChange={(e) => setUndanganPenutupCustom(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] font-semibold text-slate-700 uppercase mb-1">
                    Salam Penutup
                  </label>
                  <input
                    type="text"
                    value={currentSalamPenutup}
                    onChange={(e) => setUndanganSalamPenutup(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>

                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showAgendaDetailsInUndangan}
                      onChange={(e) => setShowAgendaDetailsInUndangan(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="text-[11px] font-medium text-slate-700">
                      Tampilkan daftar rincian agenda poin-poin di bawah acara
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Penerima Undangan (Kepada Yth.)
                </label>
                <input
                  type="text"
                  value={currentPenerima}
                  onChange={(e) => setUndanganPenerimaCustom(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">
                    Nomor Surat Undangan
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={currentNomorSurat}
                      onChange={(e) => setUndanganNomorCustom(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono"
                    />
                    {undanganNomorCustom && (
                      <button
                        type="button"
                        title="Reset ke nomor otomatis"
                        onClick={() => setUndanganNomorCustom('')}
                        className="px-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">
                    Tanggal Surat Dikeluarkan
                  </label>
                  <input
                    type="date"
                    value={currentUndanganDate}
                    onChange={(e) => setUndanganDateCustom(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Perihal / Hal Surat
                </label>
                <input
                  type="text"
                  value={currentHalSurat}
                  onChange={(e) => setUndanganHalCustom(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Catatan Tambahan (NB) - Opsional
                </label>
                <textarea
                  rows={2}
                  value={undanganCatatan}
                  onChange={(e) => setUndanganCatatan(e.target.value)}
                  placeholder="Kosongkan jika tidak ada catatan tambahan..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
                />
              </div>
            </div>
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
                  <div className="w-20 h-20 sm:w-22 sm:h-22 print:w-20 print:h-20 flex-shrink-0 flex items-center justify-center">
                    <img 
                      src={meetingType === 'pkk' ? (profile.pkkLogoUrl || profile.logoUrl || DEFAULT_SEMARANG_LOGO) : (profile.logoUrl || DEFAULT_SEMARANG_LOGO)} 
                      alt={meetingType === 'pkk' ? "Logo PKK" : "Logo Kota Semarang"} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-center flex-grow px-2">
                    <div className="text-[14px] font-bold uppercase text-slate-900 leading-tight">
              PEMERINTAH KOTA SEMARANG
            </div>
                    <div className="text-[14px] font-bold uppercase text-slate-900 leading-tight">
              KECAMATAN {profile.kecamatan}
            </div>
                    <div className="text-[14px] font-bold uppercase text-slate-900 leading-tight">
              KELURAHAN {profile.kelurahan}
            </div>
                    <div className="text-[18px] font-bold uppercase text-slate-900 leading-tight mt-1">
              RT {profile.rtNumber} RW {profile.rwNumber}
            </div>
                    <p className="text-[8px] print:text-[7.5px] text-slate-600 leading-none mt-0.5">
                      Alamat: Ngabean RT {profile.rtNumber} RW {profile.rwNumber}, Kel. {profile.kelurahan}, Kec. {profile.kecamatan}, Kota Semarang
                    </p>
                  </div>
                  <div className="w-20 h-20 sm:w-22 sm:h-22 print:w-20 print:h-20 flex-shrink-0"></div>
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
                      <span className="font-semibold text-slate-900">{formatDateWithDay(date)}</span>
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
                  <div className="w-20 h-20 sm:w-22 sm:h-22 print:w-20 print:h-20 flex-shrink-0 flex items-center justify-center">
                    <img 
                      src={meetingType === 'pkk' ? (profile.pkkLogoUrl || profile.logoUrl || DEFAULT_SEMARANG_LOGO) : (profile.logoUrl || DEFAULT_SEMARANG_LOGO)} 
                      alt={meetingType === 'pkk' ? "Logo PKK" : "Logo Kota Semarang"} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-center flex-grow px-2">
                    <div className="text-[14px] font-bold uppercase text-slate-900 leading-tight">
              PEMERINTAH KOTA SEMARANG
            </div>
                    <div className="text-[14px] font-bold uppercase text-slate-900 leading-tight">
              KECAMATAN {profile.kecamatan}
            </div>
                    <div className="text-[14px] font-bold uppercase text-slate-900 leading-tight">
              KELURAHAN {profile.kelurahan}
            </div>
                    <div className="text-[18px] font-bold uppercase text-slate-900 leading-tight mt-1">
              RT {profile.rtNumber} RW {profile.rwNumber}
            </div>
                    <p className="text-[8px] print:text-[7.5px] text-slate-600 leading-none mt-0.5">
                      Alamat: Ngabean RT {profile.rtNumber} RW {profile.rwNumber}, Kel. {profile.kelurahan}, Kec. {profile.kecamatan}, Kota Semarang
                    </p>
                  </div>
                  <div className="w-20 h-20 sm:w-22 sm:h-22 print:w-20 print:h-20 flex-shrink-0"></div>
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
                      <span className="font-semibold text-slate-900">{formatDateWithDay(date)}</span>
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
                <div className="w-24 h-24 sm:w-28 sm:h-28 print:w-24 print:h-24 flex-shrink-0 flex items-center justify-center">
                  <img 
                    src={meetingType === 'pkk' ? (profile.pkkLogoUrl || profile.logoUrl || DEFAULT_SEMARANG_LOGO) : (profile.logoUrl || DEFAULT_SEMARANG_LOGO)} 
                    alt={meetingType === 'pkk' ? "Logo PKK" : "Logo Kota Semarang"} 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-center flex-grow px-4">
                  <div className="text-[14px] font-bold uppercase text-slate-900 leading-tight">
                    PEMERINTAH KOTA SEMARANG
                  </div>
                  <div className="text-[14px] font-bold uppercase text-slate-900 leading-tight">
                    KECAMATAN {profile.kecamatan}
                  </div>
                  <div className="text-[14px] font-bold uppercase text-slate-900 leading-tight">
                    KELURAHAN {profile.kelurahan}
                  </div>
                  <div className="text-[18px] font-bold uppercase text-slate-900 leading-tight mt-1">
                    RT {profile.rtNumber} RW {profile.rwNumber} NGABEAN
                  </div>
                  <p className="text-[10px] text-slate-800 leading-tight mt-1">
                    Alamat: Ngabean RT {profile.rtNumber} RW {profile.rwNumber} Kelurahan {profile.kelurahan}
                  </p>
                </div>
                <div className="w-24 h-24 sm:w-28 sm:h-28 print:w-24 print:h-24 flex-shrink-0"></div>
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
                    <td className="border border-slate-900 py-1.5 px-2.5 font-semibold text-slate-900 w-[30%]">{formatDateWithDay(date)}</td>
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

          {/* ================== VIEW 3: SURAT UNDANGAN PERTEMUAN RUTIN (RT & PKK) ================== */}
          {docViewMode === 'undangan' && (
            undanganLayout === '2-in-1' ? (
              /* ================= 2-IN-1 FORMAT SELEBARAN POTONG DUA ================= */
              <div className="space-y-4 print-one-page text-slate-900">
                {renderUndanganBody(true)}

                <div className="border-t-2 border-dashed border-slate-400 my-4 py-1 flex items-center justify-center space-x-2 text-slate-500 text-[10px] font-mono print:my-2">
                  <Scissors className="w-3.5 h-3.5 shrink-0" />
                  <span>✂ Potong / Gunting di sini (Format 2 Undangan Selebaran per Lembar A4) ✂</span>
                </div>

                {renderUndanganBody(true)}
              </div>
            ) : (
              /* ================= 1 LEMBAR PENUH (SURAT RESMI A4) ================= */
              <div className="print-one-page text-slate-900">
                {renderUndanganBody(false)}
              </div>
            )
          )}

        </div>
      </div>
    </div>
  );
};
