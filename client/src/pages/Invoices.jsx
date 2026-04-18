import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Plus, Search, Edit2, Trash2, X, Eye, FileDown, Printer, Send } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import ResponsiveTable from '../components/ResponsiveTable';
import { exportInvoicePDF } from '../lib/exportUtils';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export default function Invoices() {
  const [data, setData] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [editId, setEditId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [form, setForm] = useState({ number: '', client_id: '', project_id: '', date: '', due_date: '', subtotal: '', tax: '', status: 'Draft', items_json: '[]' });

  const load = () => {
    api.get(`/invoices?search=${search}`).then(res => setData(res.data || [])).catch(console.error);
    api.get('/customers').then(res => setCustomers(res.data || [])).catch(console.error);
  };
  useEffect(load, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const subtotal = Number(form.subtotal) || 0;
    const tax = Number(form.tax) || 0;
    const payload = { ...form, subtotal, tax, total: subtotal + tax, client_id: Number(form.client_id) || null, project_id: Number(form.project_id) || null };
    if (editId) { await api.put(`/invoices/${editId}`, payload); } else { await api.post('/invoices', payload); }
    setShowForm(false); setEditId(null); load();
  };

  const handleEdit = (item) => {
    setForm({ number: item.number, client_id: item.client_id, project_id: item.project_id, date: item.date, due_date: item.due_date, subtotal: item.subtotal, tax: item.tax, status: item.status, items_json: item.items_json });
    setEditId(item.id); setShowForm(true);
  };

  const handleDelete = async (id) => { if (confirm('Hapus invoice ini?')) { await api.delete(`/invoices/${id}`); load(); } };
  const custName = (id) => customers.find(c => c.id === id)?.name || '-';

  const columns = [
    { key: 'number', label: 'Nomor' },
    { key: 'client_id', label: 'Client', render: r => custName(r.client_id) },
    { key: 'date', label: 'Tanggal' },
    { key: 'due_date', label: 'Jatuh Tempo' },
    { key: 'total', label: 'Total', render: r => fmt(r.total) },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
  ];

  const handleBulkReminder = async () => {
    await api.post('/bulk/invoices', { ids: selectedIds, action: 'send_reminder' });
    alert(`${selectedIds.length} reminder diproses`);
    setSelectedIds([]);
  };

  const handleBulkExportPDF = () => {
    selectedIds.forEach(id => {
      const inv = data.find(d => d.id === id);
      if (inv) exportInvoicePDF(inv, custName(inv.client_id));
    });
    setSelectedIds([]);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-800">Invoice</h2>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ number: `INV-${new Date().getFullYear()}-${String(data.length+1).padStart(3,'0')}`, client_id: '', project_id: '', date: new Date().toISOString().slice(0,10), due_date: '', subtotal: '', tax: '', status: 'Draft', items_json: '[]' }); }} className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 flex items-center gap-2 no-print"><Plus size={16} /> Tambah Invoice</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100 no-print">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-72"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari invoice..." className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          </div>
        </div>
        <ResponsiveTable
          columns={columns}
          data={data}
          selectable
          selectedIds={selectedIds}
          onToggleSelect={setSelectedIds}
          bulkActions={
            <>
              <button onClick={handleBulkReminder} className="px-3 py-1 bg-yellow-500 text-white rounded text-xs flex items-center gap-1"><Send size={12} /> Kirim Reminder</button>
              <button onClick={handleBulkExportPDF} className="px-3 py-1 bg-green-600 text-white rounded text-xs flex items-center gap-1"><FileDown size={12} /> Export PDF</button>
            </>
          }
          renderActions={(inv) => (
            <div className="flex gap-2 no-print">
              <button onClick={() => setShowDetail(inv)} className="text-gray-500 hover:text-gray-700"><Eye size={16} /></button>
              <button onClick={() => exportInvoicePDF(inv, custName(inv.client_id))} className="text-green-500 hover:text-green-700" title="Export PDF"><FileDown size={16} /></button>
              <button onClick={() => { setShowDetail(inv); setTimeout(() => window.print(), 200); }} className="text-gray-500 hover:text-gray-700" title="Print"><Printer size={16} /></button>
              <button onClick={() => handleEdit(inv)} className="text-blue-500 hover:text-blue-700"><Edit2 size={16} /></button>
              <button onClick={() => handleDelete(inv.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
            </div>
          )}
        />
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-5 sm:p-6 w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-lg">{editId ? 'Edit' : 'Tambah'} Invoice</h3><button onClick={() => setShowForm(false)}><X size={20} /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Nomor</label><input value={form.number} onChange={e => setForm({...form, number: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Client</label><select value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm"><option value="">Pilih</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label><input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Jatuh Tempo</label><input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Subtotal</label><input type="number" value={form.subtotal} onChange={e => setForm({...form, subtotal: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Pajak</label><input type="number" value={form.tax} onChange={e => setForm({...form, tax: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm"><option>Draft</option><option>Sent</option><option>Paid</option><option>Cancelled</option></select></div>
              <div className="flex gap-3 justify-end"><button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">Batal</button><button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">Simpan</button></div>
            </form>
          </div>
        </div>
      )}

      {showDetail && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-5 sm:p-6 w-full sm:max-w-lg max-h-[90vh] overflow-y-auto print-area">
            <div className="flex items-center justify-between mb-4 no-print"><h3 className="font-semibold text-lg">Detail Invoice</h3><button onClick={() => setShowDetail(null)}><X size={20} /></button></div>
            <div className="space-y-2 text-sm">
              <div className="print-only font-bold text-lg mb-4">PT Manggala Utama Indonesia</div>
              <div className="flex justify-between"><span className="text-gray-500">Nomor</span><span className="font-medium">{showDetail.number}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Client</span><span>{custName(showDetail.client_id)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Tanggal</span><span>{showDetail.date}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Jatuh Tempo</span><span>{showDetail.due_date}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{fmt(showDetail.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Pajak</span><span>{fmt(showDetail.tax)}</span></div>
              <div className="flex justify-between border-t pt-2"><span className="text-gray-500 font-medium">Total</span><span className="font-bold">{fmt(showDetail.total)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Status</span><StatusBadge status={showDetail.status} /></div>
            </div>
            <div className="mt-4 flex gap-2 no-print">
              <button onClick={() => exportInvoicePDF(showDetail, custName(showDetail.client_id))} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm flex items-center gap-1"><FileDown size={14} /> Export PDF</button>
              <button onClick={() => window.print()} className="px-3 py-2 border rounded-lg text-sm flex items-center gap-1"><Printer size={14} /> Print</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
