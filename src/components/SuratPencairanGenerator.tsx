import { DEFAULT_SEMARANG_LOGO } from '../data/initialData';
import React, { useState } from 'react';
import { RtProfile, RapItem } from '../types';
import { formatDate, formatRupiah } from '../utils/formatters';
import { Printer, FileCheck, Building, Landmark, Sparkles } from 'lucide-react';
import { executePrint } from '../utils/printHelper';

interface SuratPencairanGeneratorProps {
  profile: RtProfile;
  rapItems: RapItem[];
}

export const SuratPencairanGenerator: React.FC<SuratPencairanGeneratorProps> = ({ profile, rapItems }) => {
  const [pencairanType, setPencairanType] = useState<'rapel-august' | 'full' | 'monthly' | 'custom'>('rapel-august');
  const [customAmount, setCustomAmount] = useState<number>(18800000);
  const [selectedMonth, setSelectedMonth] = useState<string>('September');
  const [monthlyAmount, setMonthlyAmount] = useState<number>(0); 
  const [nomorSurat, setNomorSurat] = useState(`002/${profile.rtNumber}.${profile.rwNumber}/VIII/2026`);

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

  React.useEffect(() => {
    if (!rapItems) return;
    const targetMonth = monthsMap.find(m => m.name === selectedMonth);
    if (!targetMonth) return;

    const totalForMonth = rapItems.filter(item => {
      if (item.monthNumber === targetMonth.num) return true;
      const itemMonthObj = monthsMap.find(
        (m) =>
          m.name.toLowerCase() === item.month?.toLowerCase() ||
          (m.alt && m.alt.toLowerCase() === item.month?.toLowerCase())
      );
      return itemMonthObj?.num === targetMonth.num;
    }).reduce((sum, item) => sum + item.amount, 0);

    setMonthlyAmount(totalForMonth);
  }, [selectedMonth, rapItems]);
  const [sifat, setSifat] = useState('Segera');
  const [lampiran, setLampiran] = useState('1 (satu) Berkas Lengkap');
  const [lurahName, setLurahName] = useState(`Lurah ${profile.kelurahan}`);
  const [perwalNumber, setPerwalNumber] = useState('Semarang Nomor 20 Tahun 2026');

  // Indonesian terbilang function
  const terbilang = (num: number): string => {
    if (num === 0) return 'Nol';
    const huruf = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
    let temp = '';
    if (num < 12) {
      temp = huruf[num];
    } else if (num < 20) {
      temp = terbilang(num - 10) + ' Belas';
    } else if (num < 100) {
      temp = terbilang(Math.floor(num / 10)) + ' Puluh' + (num % 10 > 0 ? ' ' + terbilang(num % 10) : '');
    } else if (num < 200) {
      temp = 'Seratus' + (num - 100 > 0 ? ' ' + terbilang(num - 100) : '');
    } else if (num < 1000) {
      temp = terbilang(Math.floor(num / 100)) + ' Ratus' + (num % 100 > 0 ? ' ' + terbilang(num % 100) : '');
    } else if (num < 2000) {
      temp = 'Seribu' + (num - 1000 > 0 ? ' ' + terbilang(num - 1000) : '');
    } else if (num < 1000000) {
      temp = terbilang(Math.floor(num / 1000)) + ' Ribu' + (num % 1000 > 0 ? ' ' + terbilang(num % 1000) : '');
    } else if (num < 1000000000) {
      temp = terbilang(Math.floor(num / 1000000)) + ' Juta' + (num % 1000000 > 0 ? ' ' + terbilang(num % 1000000) : '');
    } else if (num < 1000000000000) {
      temp = terbilang(Math.floor(num / 1000000000)) + ' Milyar' + (num % 1000000000 > 0 ? ' ' + terbilang(num % 1000000000) : '');
    }
    return temp.trim();
  };

  const getNominal = () => {
    if (pencairanType === 'full') return profile.totalPagu;
    if (pencairanType === 'rapel-august') return 18800000;
    if (pencairanType === 'monthly') return monthlyAmount;
    return customAmount;
  };

  const currentNominal = getNominal();

  const handlePrint = () => {
    executePrint(`Surat Permohonan Pencairan BOP RT ${profile.rtNumber} - ${nomorSurat}`);
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar (Hidden when printing) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs print:hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <FileCheck className="w-5 h-5 text-red-600" />
            <span>Format Surat Permohonan Pencairan Bantuan RT</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sesuai Peraturan Wali Kota Semarang (Perwal No. 20 Tahun 2026) tentang BOP RT. Siap cetak tanpa ketik ulang.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-xs flex items-center space-x-2 text-xs transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Surat Permohonan (PDF)</span>
        </button>
      </div>

      {/* Type Selector & Editor Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs print:hidden space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Skema Pencairan:</span>
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs">
            <button
              type="button"
              onClick={() => setPencairanType('rapel-august')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 ${
                pencairanType === 'rapel-august'
                  ? 'bg-white text-red-700 shadow-xs ring-1 ring-red-300'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Rapel Jan – Agu 2026 (Rp 18.800.000)</span>
            </button>
            <button
              type="button"
              onClick={() => setPencairanType('full')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                pencairanType === 'full'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Penuh 100% (Rp 25.000.000)
            </button>
            <button
              type="button"
              onClick={() => setPencairanType('custom')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                pencairanType === 'custom'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Nominal Kustom
            </button>
            <button
              type="button"
              onClick={() => setPencairanType('monthly')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                pencairanType === 'monthly'
                  ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Per Bulan
            </button>
          </div>
        </div>

        {pencairanType === 'custom' && (
          <div className="flex items-center space-x-2 text-xs">
            <span className="font-semibold text-slate-700">Nominal Permohonan:</span>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(Number(e.target.value))}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1 text-xs font-mono font-bold w-48"
            />
          </div>
        )}

        {pencairanType === 'monthly' && (
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-700">Bulan:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1 text-xs font-semibold"
              >
                {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-700">Nominal:</span>
              <input
                type="number"
                value={monthlyAmount}
                onChange={(e) => setMonthlyAmount(Number(e.target.value))}
                className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1 text-xs font-mono font-bold w-32"
              />
              <span className="text-slate-500 italic">(Otomatis sesuai RAP)</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Nomor Surat
            </label>
            <input
              type="text"
              value={nomorSurat}
              onChange={(e) => setNomorSurat(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Ditujukan Kepada (Lurah)
            </label>
            <input
              type="text"
              value={lurahName}
              onChange={(e) => setLurahName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Referensi Peraturan Wali Kota
            </label>
            <input
              type="text"
              value={perwalNumber}
              onChange={(e) => setPerwalNumber(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Official Printable Letter Container */}
      <div className="bg-white p-10 sm:p-16 rounded-2xl border border-slate-200 shadow-sm max-w-3xl mx-auto text-slate-900 leading-relaxed font-arial-narrow official-doc">
        {/* Letter Header */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-8">
          <div className="w-24 h-24 print:w-24 print:h-24 flex-shrink-0 flex items-center justify-center">
            <img
              src={profile.logoUrl || DEFAULT_SEMARANG_LOGO}
              alt="Logo Kota Semarang"
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
            <p className="text-[10px] text-slate-600 leading-tight">
              Alamat: Ngabean RT {profile.rtNumber} RW {profile.rwNumber} Kelurahan {profile.kelurahan}
            </p>
          </div>
          <div className="w-24 h-24 print:w-24 print:h-24 flex-shrink-0"></div>
        </div>

        {/* Letter Meta Details */}
        <div className="grid grid-cols-2 gap-4 text-sm mb-8">
          <div className="space-y-1">
            <div className="flex">
              <span className="w-24 font-semibold">Nomor</span>
              <span className="mr-1">:</span>
              <span>{nomorSurat}</span>
            </div>
            <div className="flex">
              <span className="w-24 font-semibold">Sifat</span>
              <span className="mr-1">:</span>
              <span>{sifat}</span>
            </div>
            <div className="flex">
              <span className="w-24 font-semibold">Lampiran</span>
              <span className="mr-1">:</span>
              <span>{lampiran}</span>
            </div>
            <div className="flex">
              <span className="w-24 font-semibold flex-shrink-0">Hal</span>
              <span className="mr-1">:</span>
              <span className="font-semibold">
                Permohonan Pencairan Bantuan Operasional RT
                {pencairanType === 'rapel-august' ? ' (Rapel Jan - Agu 2026)' : ''}
                {pencairanType === 'monthly' ? ` (Bulan ${selectedMonth} ${profile.year})` : ''}
              </span>
            </div>
          </div>

          <div className="space-y-1 text-right sm:text-left sm:pl-12">
            <div>Semarang, {formatDate(new Date().toISOString().split('T')[0])}</div>
            <div className="mt-4">
              <div>Kepada</div>
              <div className="font-semibold">Yth. {lurahName}</div>
              <div>Di</div>
              <div className="font-bold underline">SEMARANG</div>
            </div>
          </div>
        </div>

        {/* Letter Body */}
        <div className="space-y-4 text-sm text-justify">
          <p className="indent-8">
            Bersama ini kami mengajukan permohonan pencairan Bantuan Operasional RT {profile.rtNumber} RW {profile.rwNumber}{' '}
            {pencairanType === 'rapel-august' ? (
              <span>
                Tahap I (Akumulasi Rapel Operasional Periode <strong>Januari s/d Agustus {profile.year}</strong>) sebesar{' '}
                <strong>{formatRupiah(currentNominal)} <em>({terbilang(currentNominal)} Rupiah)</em></strong>
              </span>
            ) : pencairanType === 'monthly' ? (
              <span>
                untuk <strong>Bulan {selectedMonth} {profile.year}</strong> sebesar{' '}
                <strong>{formatRupiah(currentNominal)} <em>({terbilang(currentNominal)} Rupiah)</em></strong>
              </span>
            ) : (
              <span>
                sebesar <strong>{formatRupiah(currentNominal)} <em>({terbilang(currentNominal)} Rupiah)</em></strong>
              </span>
            )}{' '}
            dengan rincian sebagaimana terlampir (Lampiran Rencana Anggaran Penggunaan / RAP).
          </p>

          <p className="indent-8">
            Sebagai bahan pertimbangan, bersama ini kami sampaikan persyaratan pencairan Bantuan Operasional RT {profile.rtNumber} RW {profile.rwNumber} sesuai dengan Peraturan Wali Kota {perwalNumber} Tentang Pedoman Pemberian Bantuan Operasional Rukun Tetangga dan Rukun Warga.
          </p>

          <p className="indent-8">
            Pencairan bantuan dapat ditransfer melalui rekening <strong>{profile.bankName}</strong> atas nama <strong>{profile.bankAccountName}</strong> nomor rekening <strong>{profile.bankAccountNumber}</strong>.
          </p>

          <p className="indent-8">
            Demikian permohonan kami, atas perhatian dan kerjasamanya kami sampaikan terima kasih.
          </p>
        </div>

        {/* Signature */}
        <div className="mt-16 flex justify-end">
          <div className="text-center w-64">
            <p className="text-sm">Hormat kami,</p>
            <p className="text-sm font-bold uppercase mt-1">
              Ketua RT {profile.rtNumber} RW {profile.rwNumber}
            </p>
            <div className="h-24"></div>
            <p className="text-sm font-bold underline uppercase">{profile.ketuaRt}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
