import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { DollarSign, FileText, FileDown, Printer } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import { exportPayrollPDF } from '../../lib/exportUtils';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export default function SlipGaji() {
  const [data, setData] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/payroll').then(res => {
      const items = res.data || [];
      setData(items);
      if (items.length > 0 && !selectedPeriod) {
        setSelectedPeriod(items[0].period);
      }
    }).catch(console.error);
  }, []);

  const selected = data.find(d => d.period === selectedPeriod);
  const periods = [...new Set(data.map(d => d.period))];

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">Slip Gaji Saya</h2>

      {data.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <FileText size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">Belum ada data payroll</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Period selector */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-700 mb-3">Periode</h3>
              <div className="space-y-2">
                {periods.map(p => (
                  <button key={p} onClick={() => setSelectedPeriod(p)}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors ${p === selectedPeriod ? 'bg-blue-50 text-blue-600 font-medium' : 'hover:bg-gray-50 text-gray-600'}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Slip detail */}
          <div className="lg:col-span-2">
            {selected && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Slip Gaji</h3>
                    <p className="text-sm text-gray-500">Periode: {selected.period}</p>
                  </div>
                  <StatusBadge status={selected.status} />
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-1">
                  {/* Income Section */}
                  <div className="bg-green-50 rounded-xl px-4 py-2 mb-2">
                    <span className="text-sm font-semibold text-green-700">Pendapatan</span>
                  </div>
                  <div className="flex justify-between py-2 px-4">
                    <span className="text-gray-500">Gaji Pokok</span>
                    <span className="font-medium">{fmt(selected.basic_salary)}</span>
                  </div>
                  <div className="flex justify-between py-2 px-4 text-green-600">
                    <span>Tunjangan Transport</span>
                    <span className="font-medium">{fmt(selected.transport_allowance || 0)}</span>
                  </div>
                  <div className="flex justify-between py-2 px-4 text-green-600">
                    <span>Tunjangan Makan</span>
                    <span className="font-medium">{fmt(selected.meal_allowance || 0)}</span>
                  </div>
                  <div className="flex justify-between py-2 px-4 text-blue-600">
                    <span>Lembur</span>
                    <span className="font-medium">{fmt(selected.overtime_pay || 0)}</span>
                  </div>
                  <div className="flex justify-between py-2 px-4 border-t border-gray-100 font-semibold">
                    <span className="text-gray-700">Total Pendapatan</span>
                    <span className="text-green-700">{fmt((selected.basic_salary || 0) + (selected.transport_allowance || 0) + (selected.meal_allowance || 0) + (selected.overtime_pay || 0))}</span>
                  </div>

                  {/* Separator */}
                  <div className="my-3 border-t-2 border-dashed border-gray-200"></div>

                  {/* Deduction Section */}
                  <div className="bg-red-50 rounded-xl px-4 py-2 mb-2">
                    <span className="text-sm font-semibold text-red-700">Potongan</span>
                  </div>
                  <div className="flex justify-between py-2 px-4 text-red-600">
                    <span>BPJS Kesehatan</span>
                    <span className="font-medium">{fmt(selected.bpjs_kesehatan || 0)}</span>
                  </div>
                  <div className="flex justify-between py-2 px-4 text-red-600">
                    <span>BPJS Ketenagakerjaan</span>
                    <span className="font-medium">{fmt(selected.bpjs_tk || 0)}</span>
                  </div>
                  <div className="flex justify-between py-2 px-4 text-red-600">
                    <span>PPh 21</span>
                    <span className="font-medium">{fmt(selected.pph21 || 0)}</span>
                  </div>
                  <div className="flex justify-between py-2 px-4 text-red-600">
                    <span>Denda Keterlambatan</span>
                    <span className="font-medium">{fmt(selected.late_penalty || 0)}</span>
                  </div>
                  <div className="flex justify-between py-2 px-4 border-t border-gray-100 font-semibold">
                    <span className="text-gray-700">Total Potongan</span>
                    <span className="text-red-700">{fmt(selected.deductions || 0)}</span>
                  </div>

                  {/* Separator */}
                  <div className="my-3 border-t-2 border-dashed border-gray-200"></div>

                  {/* Net Salary */}
                  <div className="bg-blue-50 rounded-xl px-4 py-3 flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-800">Gaji Bersih</span>
                    <span className="text-lg font-bold text-blue-600">{fmt(selected.net_salary)}</span>
                  </div>
                </div>
                <div className="mt-4 flex gap-2 no-print">
                  <button onClick={() => exportPayrollPDF(selected)} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm flex items-center gap-1"><FileDown size={14} /> Export PDF</button>
                  <button onClick={() => window.print()} className="px-3 py-2 border rounded-lg text-sm flex items-center gap-1"><Printer size={14} /> Print</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
