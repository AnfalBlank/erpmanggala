import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Save } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => { api.get('/settings').then(setSettings).catch(console.error); }, []);

  const handleSave = async () => {
    await api.put('/settings', settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-800">Pengaturan</h2>
        <button onClick={handleSave} className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 flex items-center gap-2"><Save size={16} /> {saved ? 'Tersimpan!' : 'Simpan'}</button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg space-y-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Nama Perusahaan</label><input value={settings.company_name || ''} onChange={e => setSettings({...settings, company_name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label><textarea value={settings.company_address || ''} onChange={e => setSettings({...settings, company_address: e.target.value})} rows={2} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
      </div>
    </div>
  );
}
