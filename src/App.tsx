import React, { useState, useEffect } from 'react';
import { ActiveTab, Transaction, RtProfile, MusyawarahRecord, RapItem, MonthlySpjRecord, CategoryDefinition } from './types';
import { initialTransactions, initialRtProfile, initialMusyawarah, initialRapItems, initialMonthlySpj, defaultCategories } from './data/initialData';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { TransactionList } from './components/TransactionList';
import { TransactionModal } from './components/TransactionModal';
import { ReportGenerator } from './components/ReportGenerator';
import { SuratPencairanGenerator } from './components/SuratPencairanGenerator';
import { RapManager } from './components/RapManager';
import { PengambilanBulananGenerator } from './components/PengambilanBulananGenerator';
import { MonthlySpjManager } from './components/MonthlySpjManager';
import { NotulenGenerator } from './components/NotulenGenerator';
import { MusyawarahManager } from './components/MusyawarahManager';
import { SettingsModal } from './components/SettingsModal';
import { BaKesepakatanManager } from './components/BaKesepakatanManager';
import { SptjmGenerator } from './components/SptjmGenerator';
import { LoginHeroLanding } from './components/LoginHeroLanding';

export default function App() {
  const [authRole, setAuthRole] = useState<'admin' | 'public' | null>(() => {
    if (window.location.hash === '#warga') {
      return 'public';
    }
    return null;
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Load from localStorage or defaults
  const [profile, setProfile] = useState<RtProfile>(() => {
    const saved = localStorage.getItem('bop_rt_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return initialRtProfile;
      }
    }
    return initialRtProfile;
  });

  const [categories, setCategories] = useState<CategoryDefinition[]>(() => {
    const saved = localStorage.getItem('bop_rt_categories');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return defaultCategories;
      }
    }
    return defaultCategories;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('bop_rt_transactions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return initialTransactions;
      }
    }
    return initialTransactions;
  });

  const [musyawarahRecords, setMusyawarahRecords] = useState<MusyawarahRecord[]>(() => {
    const saved = localStorage.getItem('bop_rt_musyawarah');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return initialMusyawarah;
      }
    }
    return initialMusyawarah;
  });

  const [rapItems, setRapItems] = useState<RapItem[]>(() => {
    const saved = localStorage.getItem('bop_rt_rap');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return initialRapItems;
      }
    }
    return initialRapItems;
  });

  const [spjRecords, setSpjRecords] = useState<MonthlySpjRecord[]>(() => {
    const saved = localStorage.getItem('bop_rt_spj');
    if (saved) {
      try {
        const parsed: MonthlySpjRecord[] = JSON.parse(saved);
        // Ensure all default 8 months from initialMonthlySpj are present
        const merged = [...parsed];
        for (const item of initialMonthlySpj) {
          if (!merged.some((m) => m.month.toLowerCase() === item.month.toLowerCase())) {
            merged.push(item);
          }
        }
        return merged;
      } catch {
        return initialMonthlySpj;
      }
    }
    return initialMonthlySpj;
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('bop_rt_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('bop_rt_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('bop_rt_musyawarah', JSON.stringify(musyawarahRecords));
  }, [musyawarahRecords]);

  useEffect(() => {
    localStorage.setItem('bop_rt_rap', JSON.stringify(rapItems));
  }, [rapItems]);

  useEffect(() => {
    localStorage.setItem('bop_rt_spj', JSON.stringify(spjRecords));
  }, [spjRecords]);

  useEffect(() => {
    localStorage.setItem('bop_rt_categories', JSON.stringify(categories));
  }, [categories]);

  const handleAddCategory = (newCat: CategoryDefinition) => {
    setCategories((prev) => {
      if (prev.some((c) => c.id === newCat.id)) return prev;
      return [...prev, newCat];
    });
  };

  const handleDeleteCategory = (catId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== catId));
  };

  const handleSaveTransaction = (tx: Transaction) => {
    if (!guardAdminAction()) return;
    setTransactions((prev) => {
      const exists = prev.some((t) => t.id === tx.id);
      if (exists) {
        return prev.map((t) => (t.id === tx.id ? tx : t));
      }
      return [tx, ...prev];
    });
  };

  const handleDeleteTransaction = (id: string) => {
    if (!guardAdminAction()) return;
    if (window.confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const handleEditTransaction = (tx: Transaction) => {
    if (!guardAdminAction()) return;
    setEditingTransaction(tx);
    setIsAddModalOpen(true);
  };

  const handleAddMusyawarah = (rec: MusyawarahRecord) => {
    if (!guardAdminAction()) return;
    setMusyawarahRecords((prev) => [rec, ...prev]);
  };

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Guard helper for public mode
  const guardAdminAction = (): boolean => {
    if (authRole === 'public') {
      alert('Akses Terbatas: Anda berada dalam Mode Warga (Lihat Laporan Saja). Hanya Admin / Operator RT yang berhak menambah atau mengubah data.');
      return false;
    }
    return true;
  };

  if (!authRole) {
    return (
      <LoginHeroLanding
        profile={profile}
        onLoginSuccess={(mode) => {
          setAuthRole(mode);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-arial-narrow antialiased text-slate-800">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        profile={profile}
        totalExpense={totalExpense}
        onLogout={() => {
          window.location.hash = '';
          setAuthRole(null);
        }}
        authRole={authRole}
      />

      <div className="flex-1 md:pl-72 flex flex-col print:pl-0 print:m-0">
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0 print:max-w-none print:w-full">
        {activeTab === 'dashboard' && (
          <Dashboard
            transactions={transactions}
            profile={profile}
            rapItems={rapItems}
            onNavigate={setActiveTab}
            onOpenAddModal={() => {
              setEditingTransaction(null);
              setIsAddModalOpen(true);
            }}
          />
        )}

        {activeTab === 'ba-kesepakatan' && (
          <BaKesepakatanManager
            profile={profile}
            records={musyawarahRecords}
            onAddRecord={handleAddMusyawarah}
          />
        )}

        {activeTab === 'rap' && (
          <RapManager rapItems={rapItems} onUpdateRap={setRapItems} profile={profile} />
        )}

        {activeTab === 'sptjm' && (
          <SptjmGenerator profile={profile} />
        )}

        {activeTab === 'surat' && (
          <SuratPencairanGenerator profile={profile} />
        )}

        {activeTab === 'pengambilan' && (
          <PengambilanBulananGenerator
            profile={profile}
            rapItems={rapItems}
            onRecordIncome={handleSaveTransaction}
            onNavigateToTransactions={() => setActiveTab('transactions')}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionList
            transactions={transactions}
            onAddTransaction={() => {
              setEditingTransaction(null);
              setIsAddModalOpen(true);
            }}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            categories={categories}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        )}

        {activeTab === 'reports' && (
          <ReportGenerator
            transactions={transactions}
            profile={profile}
            categories={categories}
          />
        )}

        {activeTab === 'spj-bulanan' && (
          <MonthlySpjManager
            profile={profile}
            rapItems={rapItems}
            spjRecords={spjRecords}
            onSaveSpj={setSpjRecords}
            onNavigateToNotulen={() => setActiveTab('notulen')}
          />
        )}

        {activeTab === 'notulen' && (
          <NotulenGenerator profile={profile} />
        )}

        {activeTab === 'musyawarah' && (
          <MusyawarahManager
            records={musyawarahRecords}
            onAddRecord={handleAddMusyawarah}
            profile={profile}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsModal profile={profile} onUpdateProfile={setProfile} />
        )}
        </main>
      </div>

      <TransactionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        editData={editingTransaction}
        categories={categories}
        onAddCategory={handleAddCategory}
      />

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 print:hidden">
        <p>
          SI-BOP RT Kota Semarang • Sistem Pelaporan Mandiri & Transparan Berdasarkan Juknis APBD
        </p>
      </footer>
    </div>
  );
}
