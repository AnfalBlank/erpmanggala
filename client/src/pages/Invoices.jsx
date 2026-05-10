import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Plus, Search, Edit2, Trash2, Eye, FileDown, Printer, Send, Mail, MessageCircle, X } from 'lucide-react';
import CurrencyInput from '../components/CurrencyInput';
import StatusBadge from '../components/StatusBadge';
import ResponsiveTable from '../components/ResponsiveTable';
import { exportInvoicePDF } from '../lib/exportUtils';
import Modal, { FormField, BtnPrimary, BtnSecondary, inputClass, selectClass, textareaClass } from '../components/Modal';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const emptyLine = () => ({ description: '', qty: 1, price: 0 });

export default function Invoices() {
  const [data, setData] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [editId, setEditId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ number: '', client_id: '', project_id: '', date: '', due_date: '', subtotal: '', tax: '', status: 'Draft', items_json: '[]' });
  const [lineItems, setLineItems] = useState([emptyLine()]);
  const [projects, setProjects] = useState([]);
  const [emailModal, setEmailModal] = useState(null);
  const [waModal, setWaModal] = useState(null);
  const [sending, setSending] = useState(false);

  const load = () => {
    api.get(`/invoices?search=${search}`).then(res => setData(res.data || [])).catch(console.error);
    api.get('/customers').then(res => setCustomers(res.data || [])).catch(console.error);
    api.get('/projects').then(res => setProjects(res.data || [])).catch(console.error);
  };
  useEffect(load, [search]);

  const calcSubtotal = (items) => items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);

  const updateLineItem = (index, field, value) => {
    setLineItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      const sub = calcSubtotal(updated);
      setForm(f => ({ ...f, subtotal: sub }));
      return updated;
    });
  };

  const addLineItem = () => setLineItems(prev => [...prev, emptyLine()]);

  const removeLineItem = (index) => {
    setLineItems(prev => {
      const updated = prev.filter((_, i) => i !== index);
      const result = updated.length === 0 ? [emptyLine()] : updated;
      const sub = calcSubtotal(result);
      setForm(f => ({ ...f, subtotal: sub }));
      return result;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const subtotal = calcSubtotal(lineItems);
      const tax = Number(form.tax) || 0;
      const payload = {
        ...form,
        subtotal,
        tax,
        total: subtotal + tax,
        client_id: Number(form.client_id) || null,
        project_id: Number(form.project_id) || null,
        items_json: JSON.stringify(lineItems),
      };
      if (editId) { await api.put(`/invoices/${editId}`, payload); } else { await api.post('/invoices', payload); }
      setShowForm(false); setEditId(null); setLineItems([emptyLine()]); load();
    } finally { setSaving(false); }
  };

  const handleEdit = (item) => {
    setForm({ number: item.number, client_id: item.client_id, project_id: item.project_id, date: item.date, due_date: item.due_date, subtotal: item.subtotal, tax: item.tax, status: item.status, items_json: item.items_json });
    // Parse line items from items_json
    try {
      const parsed = JSON.parse(item.items_json || '[]');
      setLineItems(parsed.length > 0 ? parsed : [emptyLine()]);
    } catch { setLineItems([emptyLine()]); }
    setEditId(item.id); setShowForm(true);
  };

  const handleDelete = async (id) => { if (confirm('Hapus invoice ini?')) { await api.delete(`/invoices/${id}`); load(); } };
  const custName = (id) => customers.find(c => c.id === id)?.name || '-';
  const custPhone = (id) => customers.find(c => c.id === id)?.phone || '';
  const custEmail = (id) => customers.find(c => c.id === id)?.email || '';

  const handleSendEmail = async () => {
    if (!emailModal) return;
    setSending(true);
    try {
      await api.post('/email/send-invoice', { invoice_id: emailModal.id, to: emailModal.to });
      alert('Email terkirim!');
      setEmailModal(null);
    } catch (e) { alert('Gagal: ' + (e.message || 'Error')); }
    setSending(false);
  };

  const handleSendWA = async () => {
    if (!waModal) return;
    setSending(true);
    try {
      await api.post('/whatsapp/send-invoice', { invoice_id: waModal.id, phone: waModal.phone, message: waModal.message });
      alert('WhatsApp terkirim!');
      setWaModal(null);
    } catch (e) { alert('Gagal: ' + (e.message || 'Error')); }
    setSending(false);
  };

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

  // Parse line items for detail view
  const getDetailLineItems = (inv) => {
    try {
      const parsed = JSON.parse(inv.items_json || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Invoice</h2>
        <button onClick={() => { setShowForm(true); setEditId(null); setLineItems([emptyLine()]); setForm({ number: `INV-${new Date().getFullYear()}-${String(data.length+1).padStart(3,'0')}`, client_id: '', project_id: '', date: new Date().toISOString().slice(0,10), due_date: '', subtotal: '', tax: '', status: 'Draft', items_json: '[]' }); }} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 no-print"><Plus size={16} /> Tambah Invoice</button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200">
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
            <div className="flex gap-1 no-print">
              <button onClick={() => setShowDetail(inv)} className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-500"><Eye size={16} /></button>
              <button onClick={() => exportInvoicePDF(inv, custName(inv.client_id))} className="p-1.5 hover:bg-blue-50 rounded-lg text-green-500" title="Export PDF"><FileDown size={16} /></button>
              <button onClick={() => setEmailModal({ id: inv.id, to: custEmail(inv.client_id) })} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500" title="📧 Kirim Email"><Mail size={16} /></button>
              <button onClick={() => setWaModal({ id: inv.id, phone: custPhone(inv.client_id), message: `Yth ${custName(inv.client_id)}, berikut invoice ${inv.number} dari PT Manggala Utama Indonesia sebesar Rp ${(inv.total||0).toLocaleString('id-ID')}. Terima kasih.` })} className="p-1.5 hover:bg-blue-50 rounded-lg text-green-600" title="💬 Kirim WA"><MessageCircle size={16} /></button>
              <button onClick={() => handleEdit(inv)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500"><Edit2 size={16} /></button>
              <button onClick={() => handleDelete(inv.id)} className="p-1.5 hover:bg-blue-50 rounded-lg text-red-500"><Trash2 size={16} /></button>
            </div>
          )}
        />
      </div>

      {/* Invoice Form Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={`${editId ? 'Edit' : 'Tambah'} Invoice`} size="lg"
        footer={<>
          <BtnSecondary onClick={() => setShowForm(false)}>Batal</BtnSecondary>
          <BtnPrimary loading={saving} onClick={() => document.getElementById('form-invoice').requestSubmit()} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</BtnPrimary>
        </>}>
        <form id="form-invoice" onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Nomor" required>
            <input value={form.number} onChange={e => setForm({...form, number: e.target.value})} className={inputClass} required />
          </FormField>
          <FormField label="Client">
            <select value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} className={selectClass}><option value="">Pilih</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          </FormField>
          <FormField label="Proyek" hint="Pilih proyek untuk auto-isi client">
            <select value={form.project_id} onChange={e => {
              const pid = e.target.value;
              setForm(f => ({ ...f, project_id: pid }));
              // Auto-fill client from project
              if (pid) {
                const proj = projects.find(p => p.id == pid);
                if (proj?.client_id) setForm(f => ({ ...f, project_id: pid, client_id: String(proj.client_id) }));
              }
            }} className={selectClass}>
              <option value="">Tanpa Proyek</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Tanggal">
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className={inputClass} />
            </FormField>
            <FormField label="Jatuh Tempo">
              <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} className={inputClass} />
            </FormField>
          </div>

          {/* Line Items Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Line Items</label>
            <div className="border border-gray-200 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 text-[11px] uppercase tracking-wider text-gray-400 font-semibold text-left">Deskripsi</th>
                    <th className="px-3 py-2 text-[11px] uppercase tracking-wider text-gray-400 font-semibold text-center w-20">Qty</th>
                    <th className="px-3 py-2 text-[11px] uppercase tracking-wider text-gray-400 font-semibold text-right w-40">Harga</th>
                    <th className="px-3 py-2 text-[11px] uppercase tracking-wider text-gray-400 font-semibold text-right w-36">Total</th>
                    <th className="px-3 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lineItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2">
                        <input value={item.description} onChange={e => updateLineItem(idx, 'description', e.target.value)} placeholder="Nama item..." className="w-full px-2 py-1.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min="1" value={item.qty} onChange={e => updateLineItem(idx, 'qty', Number(e.target.value) || 0)} className="w-full px-2 py-1.5 border border-gray-200 rounded-xl text-sm text-center outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                      </td>
                      <td className="px-3 py-2">
                        <CurrencyInput value={item.price} onChange={val => updateLineItem(idx, 'price', val)} />
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-gray-700">
                        {fmt((Number(item.qty) || 0) * (Number(item.price) || 0))}
                      </td>
                      <td className="px-3 py-2">
                        <button type="button" onClick={() => removeLineItem(idx)} className="p-1 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-3 py-2 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                <button type="button" onClick={addLineItem} className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                  <Plus size={14} /> Tambah Item
                </button>
                <div className="text-sm font-semibold text-gray-700">
                  Subtotal: {fmt(calcSubtotal(lineItems))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Subtotal">
              <CurrencyInput value={calcSubtotal(lineItems)} onChange={() => {}} />
            </FormField>
            <FormField label="Pajak">
              <CurrencyInput value={form.tax} onChange={val => setForm({...form, tax: val})} />
            </FormField>
          </div>
          <FormField label="Status">
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className={selectClass}><option>Draft</option><option>Sent</option><option>Paid</option><option>Cancelled</option></select>
          </FormField>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!showDetail} onClose={() => setShowDetail(null)} title="Detail Invoice" size="lg">
        {showDetail && (
          <>
            <div className="space-y-2 text-sm">
              <div className="print-only font-bold text-lg mb-4">PT Manggala Utama Indonesia</div>
              <div className="flex justify-between"><span className="text-gray-500">Nomor</span><span className="font-medium">{showDetail.number}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Client</span><span>{custName(showDetail.client_id)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Tanggal</span><span>{showDetail.date}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Jatuh Tempo</span><span>{showDetail.due_date}</span></div>

              {/* Line Items Table */}
              {getDetailLineItems(showDetail).length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Line Items</h4>
                  <div className="border border-gray-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-3 py-2 text-[11px] uppercase tracking-wider text-gray-400 font-semibold text-left">Deskripsi</th>
                          <th className="px-3 py-2 text-[11px] uppercase tracking-wider text-gray-400 font-semibold text-center">Qty</th>
                          <th className="px-3 py-2 text-[11px] uppercase tracking-wider text-gray-400 font-semibold text-right">Harga</th>
                          <th className="px-3 py-2 text-[11px] uppercase tracking-wider text-gray-400 font-semibold text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {getDetailLineItems(showDetail).map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2">{item.description || '-'}</td>
                            <td className="px-3 py-2 text-center">{item.qty}</td>
                            <td className="px-3 py-2 text-right">{fmt(item.price || 0)}</td>
                            <td className="px-3 py-2 text-right font-medium">{fmt((Number(item.qty) || 0) * (Number(item.price) || 0))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-2"><span className="text-gray-500">Subtotal</span><span>{fmt(showDetail.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Pajak</span><span>{fmt(showDetail.tax)}</span></div>
              <div className="flex justify-between border-t pt-2"><span className="text-gray-500 font-medium">Total</span><span className="font-bold">{fmt(showDetail.total)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Status</span><StatusBadge status={showDetail.status} /></div>
            </div>
            <div className="mt-4 flex gap-2 no-print">
              <button onClick={() => exportInvoicePDF(showDetail, custName(showDetail.client_id))} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm flex items-center gap-1"><FileDown size={14} /> Export PDF</button>
              <button onClick={() => window.print()} className="px-3 py-2 border rounded-lg text-sm flex items-center gap-1"><Printer size={14} /> Print</button>
            </div>
          </>
        )}
      </Modal>

      {/* Email Modal */}
      <Modal open={!!emailModal} onClose={() => setEmailModal(null)} title="Kirim Email" size="sm"
        footer={
          <BtnPrimary loading={sending} onClick={handleSendEmail} disabled={sending}>{sending ? 'Mengirim...' : 'Kirim Email'}</BtnPrimary>
        }>
        {emailModal && (
          <div className="space-y-3">
            <FormField label="Email Penerima">
              <input value={emailModal.to || ''} onChange={e => setEmailModal({...emailModal, to: e.target.value})} className={inputClass} />
            </FormField>
          </div>
        )}
      </Modal>

      {/* WhatsApp Modal */}
      <Modal open={!!waModal} onClose={() => setWaModal(null)} title="Kirim WhatsApp" size="sm"
        footer={
          <BtnPrimary loading={sending} onClick={handleSendWA} disabled={sending} className="!bg-green-600 hover:!bg-green-700">{sending ? 'Mengirim...' : 'Kirim WhatsApp'}</BtnPrimary>
        }>
        {waModal && (
          <div className="space-y-3">
            <FormField label="Nomor Telepon">
              <input value={waModal.phone || ''} onChange={e => setWaModal({...waModal, phone: e.target.value})} className={inputClass} placeholder="+628..." />
            </FormField>
            <FormField label="Pesan">
              <textarea value={waModal.message || ''} onChange={e => setWaModal({...waModal, message: e.target.value})} rows={4} className={textareaClass} />
            </FormField>
          </div>
        )}
      </Modal>
    </div>
  );
}
