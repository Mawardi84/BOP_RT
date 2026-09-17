import { RapItem, Transaction } from '../types';

export function absorbRapToTransactions(
  rapItems: RapItem[],
  existingTransactions: Transaction[],
  maxMonthNumber: number = 8
): Transaction[] {
  const monthToNum: Record<string, string> = {
    januari: '01',
    pebruari: '02',
    februari: '02',
    maret: '03',
    april: '04',
    mei: '05',
    juni: '06',
    juli: '07',
    agustus: '08',
    september: '09',
    oktober: '10',
    november: '11',
    desember: '12',
  };

  // 1. Clean existing transactions:
  // - Remove any tx-rap- auto-generated transactions to prevent double counting
  // - Remove any future unrealized expenses (month > maxMonthNumber)
  const cleanedTransactions = existingTransactions.filter((t) => {
    // Remove old auto-generated tx-rap- items so we don't accumulate stale duplicates
    if (t.id && t.id.startsWith('tx-rap-')) {
      return false;
    }
    if (t.type === 'expense' && t.date) {
      const mStr = t.date.split('-')[1];
      const mNum = parseInt(mStr, 10);
      if (!isNaN(mNum) && mNum > maxMonthNumber) {
        return false; // Future unrealized expense
      }
    }
    return true;
  });

  const newTransactions: Transaction[] = [...cleanedTransactions];

  // 2. Ensure income total is 25.000.000
  const incomeTotal = newTransactions
    .filter((t) => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  if (incomeTotal < 25000000) {
    const tx1Idx = newTransactions.findIndex((t) => t.id === 'tx-1');
    if (tx1Idx !== -1) {
      newTransactions[tx1Idx] = {
        ...newTransactions[tx1Idx],
        amount: 18800000,
        description: 'Pencairan Dana BOP RT (Rapel Periode Januari - Agustus 2026)',
        notes: 'Masuk Rekening Bank Jateng (Pencairan Rapel 8 Bulan)',
        documentNumber: 'BPD-01/VIII/2026',
      };
    } else {
      newTransactions.unshift({
        id: 'tx-1',
        date: '2026-08-10',
        type: 'income',
        category: 'lainnya',
        description: 'Pencairan Dana BOP RT (Rapel Periode Januari - Agustus 2026)',
        amount: 18800000,
        recipientOrDonor: 'BPPKAD / Pemkot Semarang',
        notes: 'Masuk Rekening Bank Jateng (Pencairan Rapel 8 Bulan)',
        hasMusyawarah: true,
        documentNumber: 'BPD-01/VIII/2026',
      });
    }

    const tx2Idx = newTransactions.findIndex((t) => t.id === 'tx-2-inc');
    if (tx2Idx !== -1) {
      newTransactions[tx2Idx] = {
        ...newTransactions[tx2Idx],
        amount: 6200000,
        description: 'Pencairan Alokasi Dana BOP RT 2026 (Sisa Pagu APBD)',
        notes: 'Masuk Rekening Bank Jateng (Total Pagu Rp 25.000.000)',
        documentNumber: 'BPD-02/VIII/2026',
      };
    } else {
      newTransactions.push({
        id: 'tx-2-inc',
        date: '2026-08-10',
        type: 'income',
        category: 'lainnya',
        description: 'Pencairan Alokasi Dana BOP RT 2026 (Sisa Pagu APBD)',
        amount: 6200000,
        recipientOrDonor: 'BPPKAD / Pemkot Semarang',
        notes: 'Masuk Rekening Bank Jateng (Total Pagu Rp 25.000.000)',
        hasMusyawarah: true,
        documentNumber: 'BPD-02/VIII/2026',
      });
    }
  }

  // 3. Find which months already have recorded expense transactions
  const monthsWithExpenses = new Set<string>();
  cleanedTransactions.forEach((t) => {
    if (t.type === 'expense' && t.date) {
      const mStr = t.date.split('-')[1];
      if (mStr) monthsWithExpenses.add(mStr);
    }
  });

  // 4. Absorb RAP items ONLY for months that do not have recorded expense transactions yet!
  rapItems.forEach((rap) => {
    if (!rap.month) return;
    const mLower = rap.month.toLowerCase().trim();
    const monthNumStr = monthToNum[mLower] || String(rap.monthNumber || 1).padStart(2, '0');
    const mNum = parseInt(monthNumStr, 10);

    if (mNum > maxMonthNumber) return; // Skip future unrealized months
    if (monthsWithExpenses.has(monthNumStr)) return; // Skip months that already have transactions

    const day = rap.category === 'pemberdayaan' ? '18' : '15';
    const year = 2026;
    const dateStr = `${year}-${monthNumStr}-${day}`;

    let recipient = 'Konsumsi Warga RT 04';
    if (rap.category === 'pemberdayaan') recipient = 'PKK RT 04';
    else if (rap.category === 'kebersihan') recipient = 'Toko Bahan / Material RT';
    else if (rap.category === 'sosial') recipient = 'Panitia HUT RI / Warga RT';
    else if (rap.category === 'ketahanan_pangan') recipient = 'Kelompok Toga RT 04';

    newTransactions.push({
      id: `tx-rap-${rap.id}`,
      date: dateStr,
      type: 'expense',
      category: rap.category,
      description: rap.description,
      amount: rap.total || rap.qty * rap.price,
      recipientOrDonor: recipient,
      notes: `Diserap otomatis dari RAP Bulan ${rap.month}`,
      hasMusyawarah: true,
      documentNumber: `NOTA-RAP/${monthNumStr}/2026`,
    });
  });

  return newTransactions;
}


