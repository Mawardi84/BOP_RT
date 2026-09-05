import React from 'react';
import { RtProfile } from '../types';
import { Building2, Award, CheckCircle2, FileText, Download, Users, Zap, ShieldCheck, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';

interface LpkmProposalViewProps {
  profile: RtProfile;
  onClose?: () => void;
}

export const LpkmProposalView: React.FC<LpkmProposalViewProps> = ({ profile }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/20 border border-emerald-500/40 px-3.5 py-1.5 rounded-full text-xs font-semibold text-emerald-300">
            <Sparkles className="w-4 h-4" />
            <span>Dokumen Kemitraan Strategis LPKM 2026</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold uppercase tracking-tight">
            Proposal Hilirisasi & Pilot Project <span className="text-emerald-400">SI-BOP RT</span>
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Sistem Informasi Bantuan Operasional RT (SI-BOP) berbasis Web Full-Stack untuk transparansi keuangan dan otomatisasi pelaporan pertanggungjawaban (SPJ) tingkat Rukun Tetangga di Kota Semarang.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Cetak / Unduh Dokumen Proposal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Section 1: Executive Summary */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold uppercase text-slate-900">1. Ringkasan Eksekutif (Executive Summary)</h2>
            <p className="text-xs text-slate-500">Latar belakang inovasi dan urgensi digitalisasi keuangan tingkat RT</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl space-y-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">01</div>
            <h3 className="text-xs font-bold uppercase text-slate-900">Urgensi Pelaporan</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pencairan dana BOP RT Rp25.000.000 per tahun dari APBD Kota Semarang memerlukan akuntabilitas tinggi, rekap BKU bulanan, dan berkas SPJ yang ketat.
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl space-y-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">02</div>
            <h3 className="text-xs font-bold uppercase text-slate-900">Solusi Otomatisasi</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              SI-BOP mengotomatisasi penyusunan BA Kesepakatan, RAP 12 bulan, Surat Permohonan Pencairan Bank Jateng, SPTJM, hingga lembar bukti fisik SPJ siap cetak.
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl space-y-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">03</div>
            <h3 className="text-xs font-bold uppercase text-slate-900">Transparansi Publik</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Dilengkapi dengan Mode Warga (Frontend) terpisah, memungkinkan warga memantau realisasi anggaran secara *real-time* tanpa akses edit data.
            </p>
          </div>
        </div>
      </div>

      {/* Section 2: Core Modules for LPKM Presentation */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold uppercase text-slate-900">2. Modul Utama & Kesiapan Sistem</h2>
            <p className="text-xs text-slate-500">Fitur lengkap yang siap didemonstrasikan kepada tim LPKM</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { title: "Dashboard & Grafik Recharts", desc: "Ringkasan realisasi anggaran bulanan, persentase penyerapan, dan grafik kategori belanja." },
            { title: "Pencatatan Kas & BKU", desc: "Pencatatan kas masuk pencairan dan pengeluaran peruntukan (kebersihan, sosial, pemberdayaan, ketahanan pangan)." },
            { title: "Dokumen Resmi SPJ & SPTJM", desc: "Pembuatan Surat Pernyataan Tanggung Jawab Mutlak (SPTJM) dan surat permohonan Bank Jateng otomatis." },
            { title: "Pelaporan & Bukti Fisik SPJ Bulanan", desc: "Berkas lengkap bulanan meliputi notulen rapat RT/PKK, daftar hadir, foto kegiatan, dan nota belanja." },
            { title: "Dual-Access Architecture", desc: "Pemisahan tegas antara Admin / Operator (Backend) dan Warga (Frontend Transparency Link)." },
            { title: "Penyimpanan & Ekspor", desc: "Penyimpanan lokal responsif dan siap cetak dengan format kop surat resmi Pemerintah Kota Semarang." }
          ].map((item, idx) => (
            <div key={idx} className="flex items-start space-x-3 p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-bold uppercase text-slate-900">{item.title}</h3>
                <p className="text-[11px] text-slate-600 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Pilot Project Roadmap & Collaboration Offer */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold uppercase text-slate-900">3. Rencana Aksi & Pilot Project Kolaborasi LPKM</h2>
            <p className="text-xs text-slate-500">Tahapan implementasi untuk skala Kelurahan Gunungpati & Kota Semarang</p>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { phase: "Fase 1 (Saat Ini)", title: "Showcase & Uji Coba RT 04 / RW 04 Ngabean", desc: "Implementasi penuh di wilayah RT 04 Gunungpati sebagai pilot project percontohan transparansi BOP RT 2026." },
            { phase: "Fase 2", title: "Pendampingan & Bimtek Pengurus RT/RW", desc: "Pelatihan penggunaan aplikasi bagi bendahara dan sekretaris RT di bawah supervisi LPKM dan Kelurahan Gunungpati." },
            { phase: "Fase 3", title: "Replikasi Skala Kecamatan & Kota", desc: "Perluasan adopsi sistem ke seluruh RT di Kecamatan Gunungpati sebagai bagian dari program pengabdian masyarakat perguruan tinggi." }
          ].map((step, idx) => (
            <div key={idx} className="flex items-start space-x-4 p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs">
              <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-3 py-1 rounded-full shrink-0">
                {step.phase}
              </span>
              <div>
                <h3 className="text-xs font-bold uppercase text-slate-900">{step.title}</h3>
                <p className="text-xs text-slate-600 mt-1">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 4: Contact & Pitch Summary */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="text-xs uppercase font-bold tracking-wider text-emerald-400">Siap Didemonstrasikan</div>
          <h3 className="text-lg font-bold">Wilayah RT 04 / RW 04 Ngabean, Kelurahan Gunungpati</h3>
          <p className="text-xs text-slate-300">
            Ketua RT: {profile.ketuaRt} | Sekretaris: {profile.sekretaris} | Bendahara: {profile.bendaharaRt}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => alert('Silakan hubungi pengembang / pengurus RT 04 Ngabean untuk penjadwalan demo langsung dengan tim LPKM.')}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg flex items-center space-x-2"
          >
            <span>Jadwalkan Diskusi / Demo LPKM</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
