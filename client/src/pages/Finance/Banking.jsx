import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Plus, ArrowLeftRight, Search, X, Building2, BookOpen, CheckCircle } from 'lucide-react';
import CurrencyInput from '../../components/CurrencyInput';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export default function Banking() {
  const [data, setData] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filterType, setFilterType] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [tab, setTab] = useState('transactions'); // transactions | buku-bank
  const [bukuBank, setBukuBank] = useState(null);
  const [bukuFrom, setBukuFrom] = useState('');
  const [bukuTo, setBukuTo] = useState(new Date().toISOString().slice(0, 10));
  const [selectedBukuAccount, setSelectedBukuAccount] = useState('');
  const [form, setForm] = useState({ type: 'income', account_id: '', amount: '', date: new Date().toISOString().slice(0, 10), description: '', reference: '', category: '', project_id: '' });
  const [transferForm, setTransferForm] = useState({ from_account_id: '', to_account_id: '', amount: '', date: new Date().toISOString().slice(0, 10), description: '' });

  const load = () => {
    api.get(`/banking/transactions${filterType ? `?type=${filterType}` : ''}`).then(res => setData(res.data || [])).catch(console.error);
    api.get('/bank_accounts').then(res => setAccounts(res.data || [])).catch(console.error);
    api.get('/projects').then(res => setProjects(res.data || [])).catch(console.error);
  };
  useEffect(load, [filterType]);

  const loadBukuBank = () => {
    if (!selectedBukuAccount) return;
    let url = `/banking/buku-bank/${selectedBukuAccount}`;
    const params = [];
    if (bukuFrom) params.push(`from=${bukuFrom}`);
    if (bukuTo) params.push(`to=${bukuTo}`);
    if (params.length) url += '?' + params.join('&');
    api.get(url).then(res => setBukuBank(res)).catch(console.error);
  };
  useEffect(() => { if (tab === 'buku-bank' && selectedBukuAccount) loadBukuBank(); }, [tab, selectedBukuAccount, bukuFrom, bukuTo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/banking/transactions', { ...form, amount: Number(form.amount), account_id: Number(form.account_id), project_id: form.project_id ? Number(form.project_id) : null });
    setShowForm(false); setForm({ type: 'income', account_id: '', amount: '', date: new Date().toISOString().slice(0, 10), description: '', reference: '', category: '', project_id: '' }); load();
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    await api.post('/banking/transfer', { ...transferForm, amount: Number(transferForm.amount) });
    setShowTransfer(false); setTransferForm({ from_account_id: '', to_account_id: '', amount: '', date: new Date().toISOString().slice(0, 10), description: '' }); load();
  };

  const handleReconcile = async (id, reconciled) => {
    await api.put(`/banking/transactions/${id}/reconcile`, { reconciled: !reconciled });
    load();
  };

  const accountTransactions = selectedAccount ? data.filter(t => t.account_id === selectedAccount.id) : data;

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-800">Kas & Bank</h2>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setTab('transactions')} className={`px-3 py-2 rounded-lg text-sm font-medium ${tab === 'transactions' ? 'bg-blue-500 text-white' : 'bg-white border'}`}>Transaksi</button>
          <button onClick={() => setTab('buku-bank')} className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 ${tab === 'buku-bank' ? 'bg-blue-500 text-white' : 'bg-white border'}`}><BookOpen size={14} /> Buku Bank</button>
          <button onClick={() => setShowTransfer(true)} className="bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-600 flex items-center gap-2"><ArrowLeftRight size={16} /> Transfer</button>
          <button onClick={() => setShowForm(true)} className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 flex items-center gap-2"><Plus size={16} /> Tambah</button>
        </div>
      </div>

      {/* Account cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {accounts.map(a => (
          <div key={a.id} onClick={() => setSelectedAccount(selectedAccount?.id === a.id ? null : a)} className={`bg-white rounded-xl border p-4 cursor-pointer transition hover:shadow-md ${selectedAccount?.id === a.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-2"><Building2 size={16} className="text-gray-400" /><span className="text-sm font-medium text-gray-500">{a.bank}</span></div>
            <div className="text-lg font-bold">{fmt(a.balance)}</div>
            <div className="text-sm text-gray-500 mt-1">{a.name} &bull; {a.account_number}</div>
          </div>
        ))}
      </div>

      {tab === 'transactions' && (
        <>
          <div className="flex gap-2 mb-4">
            <button onClick={() => setFilterType('')} className={`px-3 py-1.5 rounded-lg text-sm ${!filterType ? 'bg-blue-500 text-white' : 'bg-white border'}`}>Semua</button>
            <button onClick={() => setFilterType('income')} className={`px-3 py-1.5 rounded-lg text-sm ${filterType === 'income' ? 'bg-green-500 text-white' : 'bg-white border'}`}>Pendapatan</button>
            <button onClick={() => setFilterType('expense')} className={`px-3 py-1.5 rounded-lg text-sm ${filterType === 'expense' ? 'bg-red-500 text-white' : 'bg-white border'}`}>Pengeluaran</button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 text-left text-gray-500"><th className="px-4 py-3 font-medium">Tanggal</th><th className="px-4 py-3 font-medium">Tipe</th><th className="px-4 py-3 font-medium">Rekening</th><th className="px-4 py-3 font-medium">Kategori</th><th className="px-4 py-3 font-medium">Deskripsi</th><th className="px-4 py-3 font-medium">Jumlah</th><th className="px-4 py-3 font-medium">Rekon</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {accountTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{t.date}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${t.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{t.type === 'income' ? 'Masuk' : 'Keluar'}</span></td>
                    <td className="px-4 py-3">{t.account_name}</td>
                    <td className="px-4 py-3 text-gray-600">{t.category}</td>
                    <td className="px-4 py-3 text-gray-600">{t.description}</td>
                    <td className={`px-4 py-3 font-medium ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{t.type === 'income' ? '+' : '-'}{fmt(t.amount)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleReconcile(t.id, t.reconciled)} className={`${t.reconciled ? 'text-green-500' : 'text-gray-300'}`}>
                        <CheckCircle size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'buku-bank' && (
        <div>
          <div className="flex flex-wrap gap-3 mb-4">
            <select value={selectedBukuAccount} onChange={e => setSelectedBukuAccount(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
              <option value="">Pilih Rekening</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.bank})</option>)}
            </select>
            <input type="date" value={bukuFrom} onChange={e => setBukuFrom(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" placeholder="Dari" />
            <input type="date" value={bukuTo} onChange={e => setBukuTo(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
          </div>

          {bukuBank && (
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-4 border-b bg-gray-50">
                <div className="text-sm text-gray-500">Saldo Awal</div>
                <div className="text-xl font-bold">{fmt(bukuBank.opening_balance)}</div>
              </div>
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 text-left text-gray-500"><th className="px-4 py-3 font-medium">Tanggal</th><th className="px-4 py-3 font-medium">Deskripsi</th><th className="px-4 py-3 font-medium text-right">Debit (Keluar)</th><th className="px-4 py-3 font-medium text-right">Kredit (Masuk)</th><th className="px-4 py-3 font-medium text-right">Saldo</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {(bukuBank.transactions || []).map((t, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{t.date}</td>
                      <td className="px-4 py-3">{t.description}</td>
                      <td className="px-4 py-3 text-right text-red-600">{t.type === 'expense' ? fmt(t.amount) : ''}</td>
                      <td className="px-4 py-3 text-right text-green-600">{t.type === 'income' ? fmt(t.amount) : ''}</td>
                      <td className="px-4 py-3 text-right font-medium">{fmt(t.running_balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-4 border-t bg-gray-50">
                <div className="text-sm text-gray-500">Saldo Akhir</div>
                <div className="text-xl font-bold">{fmt(bukuBank.closing_balance)}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-5 sm:p-6 w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-lg">Tambah Transaksi</h3><button onClick={() => setShowForm(false)}><X size={20} /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label><select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm"><option value="income">Pendapatan</option><option value="expense">Pengeluaran</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Rekening</label><select value={form.account_id} onChange={e => setForm({...form, account_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required><option value="">Pilih</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.bank})</option>)}</select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Jumlah</label><CurrencyInput value={form.amount} onChange={val => setForm({...form, amount: val})} required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label><input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label><input value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Proyek (opsional)</label><select value={form.project_id} onChange={e => setForm({...form, project_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm"><option value="">Tanpa Proyek</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label><input value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Referensi</label><input value={form.reference} onChange={e => setForm({...form, reference: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              <div className="flex gap-3 justify-end"><button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">Batal</button><button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">Simpan</button></div>
            </form>
          </div>
        </div>
      )}

      {showTransfer && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-5 sm:p-6 w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-lg">Transfer Internal</h3><button onClick={() => setShowTransfer(false)}><X size={20} /></button></div>
            <form onSubmit={handleTransfer} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Dari Rekening</label><select value={transferForm.from_account_id} onChange={e => setTransferForm({...transferForm, from_account_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required><option value="">Pilih</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.bank}) - {fmt(a.balance)}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Ke Rekening</label><select value={transferForm.to_account_id} onChange={e => setTransferForm({...transferForm, to_account_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required><option value="">Pilih</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.bank}) - {fmt(a.balance)}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Jumlah</label><CurrencyInput value={transferForm.amount} onChange={val => setTransferForm({...transferForm, amount: val})} required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label><input type="date" value={transferForm.date} onChange={e => setTransferForm({...transferForm, date: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label><input value={transferForm.description} onChange={e => setTransferForm({...transferForm, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              <div className="flex gap-3 justify-end"><button type="button" onClick={() => setShowTransfer(false)} className="px-4 py-2 border rounded-lg text-sm">Batal</button><button type="submit" className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm">Transfer</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
