import React, { useState, useMemo } from 'react';
import { RtProfile, RapItem, Transaction } from '../types';
import { formatRupiah } from '../utils/formatters';
import {
  Printer,
  FileText,
  Calendar,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  Download,
  Landmark,
  ArrowRight,
} from 'lucide-react';
import { executePrint } from '../utils/printHelper';

interface PengambilanBulananGeneratorProps {
  profile: RtProfile;
  rapItems: RapItem[];
  onRecordIncome?: (tx: Transaction) => void;
  onNavigateToTransactions?: () => void;
}

export const PengambilanBulananGenerator: React.FC<PengambilanBulananGeneratorProps> = ({
  profile,
  rapItems,
  onRecordIncome,
  onNavigateToTransactions,
}) => {
  // Mode selection: 'preset-jan-aug' | 'single' | 'range' | 'full-year'
  const [mode, setMode] = useState<'preset-jan-aug' | 'single' | 'range' | 'full-year'>('preset-jan-aug');
  const [selectedSingleMonth, setSelectedSingleMonth] = useState('Agustus');
  const [startMonth, setStartMonth] = useState('Januari');
  const [endMonth, setEndMonth] = useState('Agustus');
  const [sisaBulanSebelumnya, setSisaBulanSebelumnya] = useState<number | ''>(0);
  const [customNominal, setCustomNominal] = useState<number | ''>('');
  const [tableDisplayMode, setTableDisplayMode] = useState<'rekap' | 'detail'>('rekap');
  const [syncSuccess, setSyncSuccess] = useState(false);

  const monthsMap = [
    { name: 'Januari', num: 1, labelShort: 'Jan' },
    { name: 'Februari', num: 2, labelShort: 'Feb', alt: 'Pebruari' },
    { name: 'Maret', num: 3, labelShort: 'Mar' },
    { name: 'April', num: 4, labelShort: 'Apr' },
    { name: 'Mei', num: 5, labelShort: 'Mei' },
    { name: 'Juni', num: 6, labelShort: 'Jun' },
    { name: 'Juli', num: 7, labelShort: 'Jul' },
    { name: 'Agustus', num: 8, labelShort: 'Agu' },
    { name: 'September', num: 9, labelShort: 'Sep' },
    { name: 'Oktober', num: 10, labelShort: 'Okt' },
    { name: 'November', num: 11, labelShort: 'Nov' },
    { name: 'Desember', num: 12, labelShort: 'Des' },
  ];

  // Determine active month numbers based on mode
  const activeMonthNumbers = useMemo(() => {
    if (mode === 'preset-jan-aug') {
      return [1, 2, 3, 4, 5, 6, 7, 8];
    }
    if (mode === 'full-year') {
      return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    }
    if (mode === 'single') {
      const found = monthsMap.find((m) => m.name === selectedSingleMonth);
      return found ? [found.num] : [8];
    }
    if (mode === 'range') {
      const s = monthsMap.find((m) => m.name === startMonth)?.num || 1;
      const e = monthsMap.find((m) => m.name === endMonth)?.num || 8;
      const minM = Math.min(s, e);
      const maxM = Math.max(s, e);
      const res: number[] = [];
      for (let i = minM; i <= maxM; i++) res.push(i);
      return res;
    }
    return [8];
  }, [mode, selectedSingleMonth, startMonth, endMonth]);

  // Periode label for the document header
  const periodeLabel = useMemo(() => {
    if (mode === 'preset-jan-aug') {
      return `Januari s/d Agustus ${profile.year} (Rapel 8 Bulan)`;
    }
    if (mode === 'full-year') {
      return `Satu Tahun Anggaran ${profile.year} (Januari - Desember)`;
    }
    if (mode === 'single') {
      return `${selectedSingleMonth} ${profile.year}`;
    }
    return `${startMonth} s/d ${endMonth} ${profile.year}`;
  }, [mode, selectedSingleMonth, startMonth, endMonth, profile.year]);

  // Filter RAP items that belong to active months
  const filteredRapItems = useMemo(() => {
    return rapItems.filter((item) => {
      // Check by monthNumber or month name
      if (item.monthNumber && activeMonthNumbers.includes(item.monthNumber)) {
        return true;
      }
      const itemMonthObj = monthsMap.find(
        (m) =>
          m.name.toLowerCase() === item.month.toLowerCase() ||
          (m.alt && m.alt.toLowerCase() === item.month.toLowerCase())
      );
      return itemMonthObj ? activeMonthNumbers.includes(itemMonthObj.num) : false;
    });
  }, [rapItems, activeMonthNumbers]);

  // Monthly breakdown for active months
  const monthlyBreakdown = useMemo(() => {
    return activeMonthNumbers.map((mNum) => {
      const mInfo = monthsMap.find((m) => m.num === mNum) || { name: `Bulan ${mNum}` };
      const items = filteredRapItems.filter((it) => {
        if (it.monthNumber === mNum) return true;
        const itM = monthsMap.find(
          (m) =>
            m.name.toLowerCase() === it.month.toLowerCase() ||
            (m.alt && m.alt.toLowerCase() === it.month.toLowerCase())
        );
        return itM?.num === mNum;
      });
      const subtotal = items.reduce((sum, it) => sum + it.total, 0);
      const summaryText =
        items.length > 0
          ? items.map((it) => it.description).slice(0, 2).join(', ') +
            (items.length > 2 ? ` (+${items.length - 2} kegiatan lainnya)` : '')
          : 'Alokasi operasional rutin';
      return {
        monthNumber: mNum,
        monthName: mInfo.name,
        subtotal,
        count: items.length,
        summary: summaryText,
        items,
      };
    });
  }, [activeMonthNumbers, filteredRapItems]);

  // Calculate total calculated from RAP
  const calculatedRapTotal = useMemo(() => {
    return filteredRapItems.reduce((acc, curr) => acc + curr.total, 0);
  }, [filteredRapItems]);

  // Final nominal for withdrawal (supports custom override if bank disburse different rounded amount)
  const finalNominal = useMemo(() => {
    if (customNominal !== '' && customNominal > 0) {
      return Number(customNominal);
    }
    return calculatedRapTotal;
  }, [customNominal, calculatedRapTotal]);

  // Indonesian terbilang function
  const terbilang = (num: number): string => {
    if (num === 0) return 'Nol Rupiah';
    const huruf = [
      '',
      'Satu',
      'Dua',
      'Tiga',
      'Empat',
      'Lima',
      'Enam',
      'Tujuh',
      'Delapan',
      'Sembilan',
      'Sepuluh',
      'Sebelas',
    ];
    let temp = '';
    if (num < 12) {
      temp = huruf[num];
    } else if (num < 20) {
      temp = terbilang(num - 10) + ' Belas';
    } else if (num < 100) {
      temp = terbilang(Math.floor(num / 10)) + ' Puluh ' + terbilang(num % 10);
    } else if (num < 200) {
      temp = 'Seratus ' + terbilang(num - 100);
    } else if (num < 1000) {
      temp = terbilang(Math.floor(num / 100)) + ' Ratus ' + terbilang(num % 100);
    } else if (num < 2000) {
      temp = 'Seribu ' + terbilang(num - 1000);
    } else if (num < 1000000) {
      temp = terbilang(Math.floor(num / 1000)) + ' Ribu ' + terbilang(num % 1000);
    } else if (num < 1000000000) {
      temp = terbilang(Math.floor(num / 1000000)) + ' Juta ' + terbilang(num % 1000000);
    } else if (num < 1000000000000) {
      temp =
        terbilang(Math.floor(num / 1000000000)) + ' Milyar ' + terbilang(num % 1000000000);
    }
    return temp.replace(/\s+/g, ' ').trim() + ' Rupiah';
  };

  const handlePrint = () => {
    executePrint(`Surat Pengambilan Operasional BOP RT - ${periodeLabel}`);
  };

  // Quick Action to register this withdrawal as Income in BKU (Agustus 2026)
  const handleSyncToTransactions = () => {
    if (onRecordIncome) {
      const newIncomeTx: Transaction = {
        id: `tx-rapel-bank-jateng-${Date.now()}`,
        date: '2026-08-05',
        type: 'income',
        category: 'lainnya',
        description: `Pencairan & Penarikan BOP RT (${periodeLabel}) via Bank Jateng`,
        amount: finalNominal,
        recipientOrDonor: 'BPPKAD / Bank Jateng Cabang Semarang',
        notes: `Penarikan rapel operasional RT 04 RW 04 di Bank Jateng Rek. ${profile.bankAccountNumber}`,
        hasMusyawarah: true,
        documentNumber: `TRF-BOP/VIII/${profile.year}`,
      };
      onRecordIncome(newIncomeTx);
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 5000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Notification Banner: Explanation of August Rapel Disbursement */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-xs print:hidden space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-700 mt-0.5">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-950">
                Solusi Penarikan Rapel Dana BOP RT (Januari – Agustus 2026 di Bulan Agustus)
              </h3>
              <p className="text-xs text-amber-900 mt-1 leading-relaxed max-w-4xl">
                Karena dana BOP RT dari Pemerintah Kota Semarang baru dicairkan dari Kasda ke rekening Bank Jateng pada bulan <strong>Agustus 2026</strong>, dana operasional untuk 8 bulan (Januari s/d Agustus) dapat ditarik secara <strong>sekaligus (rapel)</strong> menggunakan surat format resmi di bawah ini.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-200/70 text-amber-900">
            Regulasi Pemkot Semarang
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-amber-200/60 text-xs text-amber-900">
          <div className="flex items-start space-x-2">
            <span className="font-bold text-amber-700 bg-amber-100 w-5 h-5 rounded-full flex items-center justify-center shrink-0">
              1
            </span>
            <span>
              <strong>Cetak Surat Pengambilan Rapel:</strong> Pilih mode <em>Rapel Jan–Agu</em> di bawah ini untuk mencetak format pengantar Bank Jateng.
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="font-bold text-amber-700 bg-amber-100 w-5 h-5 rounded-full flex items-center justify-center shrink-0">
              2
            </span>
            <span>
              <strong>Penarikan di Bank Jateng:</strong> Diteken Ketua RT, Bendahara, dan diketahui Lurah Gunungpati + bawa Buku Rekening & Stempel RT.
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="font-bold text-amber-700 bg-amber-100 w-5 h-5 rounded-full flex items-center justify-center shrink-0">
              3
            </span>
            <span>
              <strong>Catat Kas Masuk di BKU:</strong> Catat penerimaan di bulan Agustus untuk mengganti dana talangan Jan–Jul dan belanja puncak HUT RI.
            </span>
          </div>
        </div>
      </div>

      {/* Controls Bar (Hidden when printing) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs print:hidden space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-red-600" />
              <span>Format Pengambilan Operasional RT melalui Bank Jateng</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Format baku resmi penarikan operasional RT sesuai RAP (Perwal No. 32 Tahun 2025). Siap cetak PDF.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onRecordIncome && (
              <button
                type="button"
                onClick={handleSyncToTransactions}
                className={`font-semibold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow-xs ${
                  syncSuccess
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {syncSuccess ? '✓ Kas Masuk Tersimpan di BKU!' : 'Catat Kas Masuk Penarikan Ini'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-xl shadow-xs flex items-center space-x-2 text-xs transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Surat Pengambilan (PDF)</span>
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Pilihan Periode:</span>
            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs">
              <button
                type="button"
                onClick={() => setMode('preset-jan-aug')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 ${
                  mode === 'preset-jan-aug'
                    ? 'bg-white text-red-700 shadow-xs ring-1 ring-red-300'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Rapel Jan – Agu 2026 (8 Bulan Sekaligus)</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('single')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  mode === 'single'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Per Bulan Tunggal
              </button>

              <button
                type="button"
                onClick={() => setMode('range')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  mode === 'range'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Rentang Kustom
              </button>

              <button
                type="button"
                onClick={() => setMode('full-year')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  mode === 'full-year'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Satu Tahun Penuh (12 Bulan)
              </button>
            </div>
          </div>

          {/* Sub-selectors depending on mode */}
          <div className="flex flex-wrap items-center gap-3">
            {mode === 'single' && (
              <div className="flex items-center space-x-1.5">
                <span className="text-xs text-slate-500">Pilih Bulan:</span>
                <select
                  value={selectedSingleMonth}
                  onChange={(e) => setSelectedSingleMonth(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-red-500"
                >
                  {monthsMap.map((m) => (
                    <option key={m.num} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {mode === 'range' && (
              <div className="flex items-center space-x-1.5 text-xs">
                <span>Dari:</span>
                <select
                  value={startMonth}
                  onChange={(e) => setStartMonth(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1 text-xs"
                >
                  {monthsMap.map((m) => (
                    <option key={m.num} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <span>Sampai:</span>
                <select
                  value={endMonth}
                  onChange={(e) => setEndMonth(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1 text-xs"
                >
                  {monthsMap.map((m) => (
                    <option key={m.num} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Table layout switch */}
            <div className="flex items-center space-x-1.5 text-xs">
              <span className="text-slate-500">Format Tabel:</span>
              <div className="inline-flex rounded-xl bg-slate-100 p-0.5">
                <button
                  type="button"
                  onClick={() => setTableDisplayMode('rekap')}
                  className={`px-2.5 py-1 rounded-lg ${
                    tableDisplayMode === 'rekap'
                      ? 'bg-white text-slate-900 font-bold shadow-xs'
                      : 'text-slate-600'
                  }`}
                  title="Rekapitulasi per bulan (ringkas & disukai pihak Bank/Kelurahan)"
                >
                  Rekap Per Bulan
                </button>
                <button
                  type="button"
                  onClick={() => setTableDisplayMode('detail')}
                  className={`px-2.5 py-1 rounded-lg ${
                    tableDisplayMode === 'detail'
                      ? 'bg-white text-slate-900 font-bold shadow-xs'
                      : 'text-slate-600'
                  }`}
                  title="Rincian per item belanja RAP"
                >
                  Rincian Penuh Item
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick summary stats banner */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-slate-500">Periode Kegiatan:</span>
            <div className="text-sm font-bold text-slate-900 mt-0.5 truncate">{periodeLabel}</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-slate-500">Jumlah Bulan Dicairkan:</span>
            <div className="text-sm font-bold text-slate-900 mt-0.5">
              {activeMonthNumbers.length} Bulan
            </div>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-slate-500">Total Akumulasi RAP:</span>
            <div className="text-sm font-bold text-red-600 mt-0.5">
              {formatRupiah(calculatedRapTotal)}
            </div>
          </div>
          <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200">
            <span className="text-emerald-800 font-medium">Nominal Penarikan Riil:</span>
            <div className="text-sm font-bold text-emerald-800 mt-0.5">
              {formatRupiah(finalNominal)}
            </div>
          </div>
        </div>

        {/* Optional Custom Nominal Adjustment Accordion */}
        <div className="pt-1 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span>Sesuaikan Nominal Penarikan (jika berbeda dengan RAP):</span>
            <input
              type="number"
              placeholder={`Default: ${calculatedRapTotal}`}
              value={customNominal}
              onChange={(e) =>
                setCustomNominal(e.target.value === '' ? '' : Number(e.target.value))
              }
              className="w-44 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-mono"
            />
            {customNominal !== '' && (
              <button
                type="button"
                onClick={() => setCustomNominal('')}
                className="text-red-600 hover:underline text-[11px]"
              >
                Reset ke RAP
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Official Printable Document Container */}
      <div className="bg-white p-10 sm:p-14 rounded-2xl border border-slate-200 shadow-sm max-w-3xl mx-auto text-slate-900 leading-relaxed font-arial-narrow official-doc">
        {/* Kop Surat Resmi */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6">
          <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center">
            <img
              src={profile.logoUrl || "https://upload.wikimedia.org/wikipedia/commons/e/e9/Coat_of_arms_of_Semarang.svg"}
              alt="Logo Kota Semarang"
              className="w-14 h-14 object-contain"
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
          </div>
          <div className="w-16 h-16 flex-shrink-0"></div>
        </div>

        {/* Document Title */}
        <div className="text-center mb-6">
          <h3 className="text-base font-bold uppercase underline tracking-wide">
            PENGAMBILAN OPERASIONAL RT MELALUI BANK JAWA TENGAH
          </h3>
          {mode === 'preset-jan-aug' && (
            <p className="text-xs font-semibold text-slate-700 font-sans mt-0.5 uppercase tracking-wide">
              (AKUMULASI RAPEL BULAN JANUARI S/D AGUSTUS TAHUN {profile.year})
            </p>
          )}
        </div>

        {/* Institution & Period Meta */}
        <div className="space-y-1.5 text-xs sm:text-sm mb-6 max-w-xl font-sans">
          <div className="flex">
            <span className="w-48 font-semibold text-slate-700">Nama Lembaga</span>
            <span>
              : Ngabean RT {profile.rtNumber} RW {profile.rwNumber}
            </span>
          </div>
          <div className="flex">
            <span className="w-48 font-semibold text-slate-700">Kelurahan</span>
            <span>: {profile.kelurahan}</span>
          </div>
          <div className="flex">
            <span className="w-48 font-semibold text-slate-700">Kecamatan</span>
            <span>: {profile.kecamatan}</span>
          </div>
          <div className="flex">
            <span className="w-48 font-semibold text-slate-700">Nomor Rekening Bank</span>
            <span className="font-mono">: {profile.bankAccountNumber} (Bank Jateng)</span>
          </div>
          <div className="flex">
            <span className="w-48 font-semibold text-slate-700">Untuk Kegiatan Bulan</span>
            <span className="font-bold text-red-700">: {periodeLabel}</span>
          </div>
        </div>

        {/* TABLE OPTION 1: Rekapitulasi Per Bulan (Direkomendasikan untuk Bank & Kelurahan) */}
        {tableDisplayMode === 'rekap' && (
          <div className="mb-6">
            <table className="w-full text-xs border-collapse border border-slate-300 font-sans">
              <thead>
                <tr className="bg-slate-100 text-slate-800">
                  <th className="border border-slate-300 py-2 px-2 text-center w-8">No.</th>
                  <th className="border border-slate-300 py-2 px-3 text-left w-32">Bulan Alokasi</th>
                  <th className="border border-slate-300 py-2 px-3 text-left">
                    Uraian Pokok Kegiatan Sesuai RAP
                  </th>
                  <th className="border border-slate-300 py-2 px-2 text-center w-24">Item/Kegiatan</th>
                  <th className="border border-slate-300 py-2 px-3 text-right w-36">
                    Alokasi Anggaran (Rp)
                  </th>
                </tr>
              </thead>
              <tbody>
                {monthlyBreakdown.map((m, idx) => (
                  <tr key={m.monthNumber} className="hover:bg-slate-50">
                    <td className="border border-slate-300 py-2 px-2 text-center">{idx + 1}</td>
                    <td className="border border-slate-300 py-2 px-3 font-semibold text-slate-900">
                      Bulan {m.monthName}
                    </td>
                    <td className="border border-slate-300 py-2 px-3 text-slate-700">
                      <div>{m.summary}</div>
                    </td>
                    <td className="border border-slate-300 py-2 px-2 text-center text-slate-600">
                      {m.count > 0 ? `${m.count} Rincian` : '-'}
                    </td>
                    <td className="border border-slate-300 py-2 px-3 text-right font-medium font-mono">
                      {m.subtotal.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-100 font-bold">
                  <td colSpan={4} className="border border-slate-300 py-2.5 px-3 text-right uppercase">
                    Jumlah Total Alokasi:
                  </td>
                  <td className="border border-slate-300 py-2.5 px-3 text-right text-red-700 font-mono text-sm">
                    {calculatedRapTotal.toLocaleString('id-ID')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* TABLE OPTION 2: Rincian Penuh Item Belanja RAP */}
        {tableDisplayMode === 'detail' && (
          <div className="mb-6">
            <table className="w-full text-xs border-collapse border border-slate-300 font-sans">
              <thead>
                <tr className="bg-slate-100 text-slate-800">
                  <th className="border border-slate-300 py-2 px-1 text-center w-8">No.</th>
                  <th className="border border-slate-300 py-2 px-2 text-left w-20">Bulan</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">Uraian Kegiatan</th>
                  <th className="border border-slate-300 py-2 px-1 text-center w-20">Vol.</th>
                  <th className="border border-slate-300 py-2 px-2 text-right w-24">Harga (Rp)</th>
                  <th className="border border-slate-300 py-2 px-2 text-right w-28">Total (Rp)</th>
                </tr>
              </thead>
              <tbody>
                {filteredRapItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="border border-slate-300 py-6 text-center text-slate-400">
                      Tidak ada rincian RAP pada periode ini.
                    </td>
                  </tr>
                ) : (
                  filteredRapItems.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="border border-slate-300 py-1.5 px-1 text-center">{idx + 1}</td>
                      <td className="border border-slate-300 py-1.5 px-2 text-slate-600">
                        {item.month}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2 font-medium">
                        {item.description}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-1 text-center">
                        {item.qty} {item.unit}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2 text-right font-mono">
                        {item.price.toLocaleString('id-ID')}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2 text-right font-semibold font-mono">
                        {item.total.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))
                )}
                <tr className="bg-slate-100 font-bold">
                  <td colSpan={5} className="border border-slate-300 py-2 px-3 text-right uppercase">
                    Jumlah Total :
                  </td>
                  <td className="border border-slate-300 py-2 px-2 text-right text-red-700 font-mono text-xs">
                    {calculatedRapTotal.toLocaleString('id-ID')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Calculation Box: Sisa, Penarikan & Terbilang */}
        <div className="border border-slate-300 text-xs mb-6 divide-y divide-slate-300 font-sans">
          <div className="flex py-2 px-3">
            <span className="w-56 font-semibold">Sisa Bulan Sebelumnya</span>
            <span>
              :{' '}
              {sisaBulanSebelumnya === '' || sisaBulanSebelumnya === 0
                ? 'Rp 0,- (Nihil)'
                : formatRupiah(Number(sisaBulanSebelumnya))}
            </span>
          </div>
          <div className="flex py-2.5 px-3 bg-slate-50 font-bold text-slate-900">
            <span className="w-56">Pengambilan Operasional Periode Ini</span>
            <span className="text-red-700 font-mono text-sm">: {formatRupiah(finalNominal)},-</span>
          </div>
          <div className="flex py-2 px-3 italic bg-slate-50/50">
            <span className="w-56 font-semibold">Terbilang</span>
            <span className="font-semibold text-slate-800">: {terbilang(finalNominal)}</span>
          </div>
        </div>

        {/* Catatan Resmi Penarikan Rapel */}
        {mode === 'preset-jan-aug' && (
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px] text-slate-700 mb-8 font-sans leading-relaxed">
            <strong>Catatan Resmi Penarikan Rapel:</strong> Penarikan operasional RT periode Januari
            s/d Agustus {profile.year} dilaksanakan secara akumulatif (rapel) pada bulan Agustus{' '}
            {profile.year} sesuai realisasi jadwal penyaluran dana Bantuan Operasional RT dari Kas
            Daerah Pemerintah Kota Semarang ke rekening giro Bank Jateng RT 04 RW 04 Ngabean. Dana
            yang ditarik dipergunakan untuk penggantian/pelaksanaan operasional RT dan PKK sesuai
            RAP yang disepakati musyawarah warga.
          </div>
        )}

        {/* Signatures (Ketua RT, Bendahara RT, Mengetahui Lurah Gunungpati) */}
        <div className="mt-8 grid grid-cols-2 gap-8 text-xs text-center page-break-inside-avoid">
          <div>
            <p className="text-slate-600 mb-1">
              Semarang, 05 Agustus {profile.year}
            </p>
            <p className="font-semibold uppercase text-slate-800">Yang Mengambil,</p>
            <p className="font-bold uppercase text-slate-900">
              Ketua RT {profile.rtNumber} RW {profile.rwNumber}
            </p>
            <div className="h-20 flex items-center justify-center text-slate-300 italic text-[11px]">
              (Tanda Tangan & Stempel RT)
            </div>
            <p className="font-bold underline uppercase text-slate-900">{profile.ketuaRt}</p>
          </div>
          <div>
            <p className="text-slate-600 mb-1">&nbsp;</p>
            <p className="font-semibold uppercase text-slate-800">&nbsp;</p>
            <p className="font-bold uppercase text-slate-900">Bendahara RT {profile.rtNumber}</p>
            <div className="h-20 flex items-center justify-center text-slate-300 italic text-[11px]">
              (Tanda Tangan)
            </div>
            <p className="font-bold underline uppercase text-slate-900">{profile.bendaharaRt}</p>
          </div>
        </div>

        <div className="mt-8 text-center page-break-inside-avoid">
          <p className="text-xs font-semibold text-slate-700">Mengetahui,</p>
          <p className="text-xs font-bold uppercase text-slate-900">Lurah {profile.kelurahan}</p>
          <div className="h-20 flex items-center justify-center text-slate-300 italic text-[11px]">
            (Tanda Tangan & Stempel Kelurahan)
          </div>
          <p className="text-xs font-bold underline uppercase text-slate-900">{profile.lurahName}</p>
        </div>
      </div>
    </div>
  );
};
