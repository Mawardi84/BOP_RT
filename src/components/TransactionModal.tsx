import React, { useState, useEffect } from 'react';
import { Transaction, TransactionCategory, TransactionType, CategoryDefinition } from '../types';
import { categoryColorPresets, defaultCategories, getCategoryDefinition } from '../data/initialData';
import { X, AlertCircle, CheckCircle2, Plus, Tag, Sparkles } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
  editData?: Transaction | null;
  categories?: CategoryDefinition[];
  onAddCategory?: (cat: CategoryDefinition) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editData,
  categories = defaultCategories,
  onAddCategory,
}) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<TransactionCategory>('kebersihan');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [recipientOrDonor, setRecipientOrDonor] = useState('');
  const [notes, setNotes] = useState('');
  const [hasMusyawarah, setHasMusyawarah] = useState(true);
  const [documentNumber, setDocumentNumber] = useState('');

  // State for creating new custom category
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatColor, setNewCatColor] = useState(categoryColorPresets[0].value);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Available expense categories (exclude 'lainnya' from expense recommendation unless chosen)
  const expenseCategories = categories.filter((c) => c.id !== 'lainnya');

  useEffect(() => {
    if (editData) {
      setDate(editData.date);
      setType(editData.type);
      setCategory(editData.category);
      setDescription(editData.description);
      setAmount(editData.amount);
      setRecipientOrDonor(editData.recipientOrDonor);
      setNotes(editData.notes || '');
      setHasMusyawarah(editData.hasMusyawarah);
      setDocumentNumber(editData.documentNumber || '');
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setType('expense');
      setCategory('kebersihan');
      setDescription('');
      setAmount('');
      setRecipientOrDonor('');
      setNotes('');
      setHasMusyawarah(true);
      setDocumentNumber('');
    }
    setIsAddingNewCategory(false);
    setCategoryError(null);
  }, [editData, isOpen]);

  if (!isOpen) return null;

  // Check for forbidden honor/gaji keywords
  const isHonorSuspicious =
    description.toLowerCase().includes('honor') ||
    description.toLowerCase().includes('gaji') ||
    description.toLowerCase().includes('insentif') ||
    description.toLowerCase().includes('fee pengurus');

  const handleCreateCategory = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      setCategoryError('Nama kategori tidak boleh kosong!');
      return;
    }

    const catSlug = newCatName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');

    const newCategoryDef: CategoryDefinition = {
      id: catSlug || `cat_${Date.now()}`,
      name: newCatName.trim(),
      desc: newCatDesc.trim() || `Kategori kustom BOP RT: ${newCatName.trim()}`,
      color: newCatColor,
      isCustom: true,
    };

    if (onAddCategory) {
      onAddCategory(newCategoryDef);
    }
    setCategory(newCategoryDef.id);
    setIsAddingNewCategory(false);
    setNewCatName('');
    setNewCatDesc('');
    setCategoryError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mandatory category validation for expense
    if (type === 'expense') {
      if (!category || category.trim() === '') {
        setCategoryError('Setiap pengeluaran wajib memiliki kategori yang jelas!');
        alert('Setiap pengeluaran BOP RT wajib memiliki kategori yang jelas! Silakan pilih salah satu kategori.');
        return;
      }
    }

    if (!description || !amount || !recipientOrDonor) {
      alert('Mohon lengkapi kolom yang wajib diisi (Uraian, Nominal, dan Penerima/Toko)!');
      return;
    }

    if (isHonorSuspicious) {
      const confirmHonor = window.confirm(
        'PERINGATAN ATURAN BOP RT KOTA SEMARANG:\nDana BOP RT DILARANG KERAS untuk honor atau gaji pengurus RT. Yakin ingin melanjutkan?'
      );
      if (!confirmHonor) return;
    }

    const selectedCategoryFinal = type === 'income' ? 'lainnya' : category;

    const newTx: Transaction = {
      id: editData ? editData.id : `tx-${Date.now()}`,
      date,
      type,
      category: selectedCategoryFinal,
      description,
      amount: Number(amount),
      recipientOrDonor,
      notes,
      hasMusyawarah,
      documentNumber,
    };

    onSave(newTx);
    onClose();
  };

  const activeCategoryInfo = getCategoryDefinition(category, categories);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">
              {editData ? 'Edit Transaksi BOP RT' : 'Catat Transaksi Baru'}
            </h3>
            <p className="text-xs text-slate-500">
              Setiap pengeluaran wajib tercatat dengan kategori resmi atau kategori kustom.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
              Jenis Transaksi *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setType('expense');
                  if (category === 'lainnya') setCategory('kebersihan');
                }}
                className={`py-2.5 px-4 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center space-x-2 ${
                  type === 'expense'
                    ? 'bg-red-600 text-white border-red-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>Kas Keluar (Pengeluaran Kegiatan)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('income');
                  setCategory('lainnya');
                }}
                className={`py-2.5 px-4 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center space-x-2 ${
                  type === 'income'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>Kas Masuk (Pencairan APBD)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Tanggal Transaksi *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Nomor Nota / Kwitansi / SPJ
              </label>
              <input
                type="text"
                placeholder="Cth: NOTA-012/IV/2026"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>
          </div>

          {/* Category Section with Option to Pick Existing or Add New */}
          {type === 'expense' && (
            <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800 uppercase">
                  Kategori Peruntukan Pengeluaran *
                  <span className="text-red-500 font-normal ml-1">(Wajib Jelas)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingNewCategory(!isAddingNewCategory)}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingNewCategory ? 'Tutup Form Kategori' : '+ Tambah Kategori Baru'}</span>
                </button>
              </div>

              {!isAddingNewCategory ? (
                <>
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setCategoryError(null);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  >
                    <optgroup label="Kategori Standar Juknis BOP RT">
                      {defaultCategories
                        .filter((c) => c.id !== 'lainnya')
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </optgroup>
                    {categories.filter((c) => c.isCustom).length > 0 && (
                      <optgroup label="Kategori Kustom Tambahan">
                        {categories
                          .filter((c) => c.isCustom)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              ★ {c.name}
                            </option>
                          ))}
                      </optgroup>
                    )}
                  </select>

                  {/* Selected Category Info Preview */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-500">Label:</span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${activeCategoryInfo.color}`}
                      >
                        {activeCategoryInfo.name}
                      </span>
                    </div>
                    {activeCategoryInfo.desc && (
                      <span className="text-slate-500 text-[11px] truncate max-w-[200px]" title={activeCategoryInfo.desc}>
                        {activeCategoryInfo.desc}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                /* Inline Custom Category Creator */
                <div className="bg-white p-3.5 rounded-xl border border-red-200 shadow-xs space-y-3">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-red-800">
                    <Sparkles className="w-3.5 h-3.5 text-red-600" />
                    <span>Buat Kategori Pengeluaran Baru</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Nama Kategori Baru *
                    </label>
                    <input
                      type="text"
                      placeholder="Cth: Keamanan Lingkungan / Poskamling"
                      value={newCatName}
                      onChange={(e) => {
                        setNewCatName(e.target.value);
                        setCategoryError(null);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Keterangan Singkat (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Cth: Pengadaan senter, perbaikan pos ronda, dll."
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Pilihan Warna Badge
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {categoryColorPresets.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setNewCatColor(preset.value)}
                          className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${preset.value} ${
                            newCatColor === preset.value
                              ? 'ring-2 ring-red-500 font-bold scale-105 shadow-xs'
                              : 'opacity-70 hover:opacity-100'
                          }`}
                        >
                          {preset.label.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingNewCategory(false)}
                      className="text-xs px-2.5 py-1 text-slate-500 hover:text-slate-700"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateCategory}
                      className="text-xs px-3.5 py-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-xs"
                    >
                      Simpan & Pakai Kategori
                    </button>
                  </div>
                </div>
              )}

              {categoryError && (
                <div className="text-xs text-red-600 font-medium flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{categoryError}</span>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Uraian / Keterangan Kegiatan *
            </label>
            <input
              type="text"
              required
              placeholder="Cth: Pembelian alat kebersihan gerobak sampah"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
            {isHonorSuspicious && (
              <div className="mt-1.5 flex items-center space-x-1.5 text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Peringatan: Dana BOP RT dilarang keras digunakan untuk honor / gaji pengurus!</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Jumlah Nominal (Rp) *
              </label>
              <input
                type="number"
                required
                min="0"
                placeholder="Cth: 1500000"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                {type === 'income' ? 'Sumber / Pemberi Dana *' : 'Nama Toko / Penerima / Vendor *'}
              </label>
              <input
                type="text"
                required
                placeholder={type === 'income' ? 'Cth: Pemkot Semarang' : 'Cth: Toko Makmur Jaya'}
                value={recipientOrDonor}
                onChange={(e) => setRecipientOrDonor(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Catatan Tambahan (Opsional)
            </label>
            <input
              type="text"
              placeholder="Cth: Disetujui dalam rapat warga tanggal 10 Januari 2026"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          {type === 'expense' && (
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-start space-x-3">
              <input
                type="checkbox"
                id="musyawarahCheck"
                checked={hasMusyawarah}
                onChange={(e) => setHasMusyawarah(e.target.checked)}
                className="mt-0.5 h-4 w-4 text-red-600 focus:ring-red-500 border-slate-300 rounded"
              />
              <label htmlFor="musyawarahCheck" className="text-xs text-slate-700 cursor-pointer">
                <span className="font-semibold text-slate-900">
                  Keputusan Berdasarkan Musyawarah Warga
                </span>
                <p className="text-slate-500 mt-0.5">
                  Centang untuk mengonfirmasi bahwa pengeluaran ini sudah disetujui dalam musyawarah warga RT sesuai ketentuan Pemkot Semarang.
                </p>
              </label>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 shadow-xs transition-colors"
            >
              Simpan Transaksi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
