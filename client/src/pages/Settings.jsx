import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useTranslation } from '../lib/i18n.jsx';
import { Save, Mail, TestTube, ExternalLink } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState('');
  const { t, lang, setLang } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => { api.get('/settings').then(setSettings).catch(console.error); }, []);

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleSave = async () => {
    await api.put('/settings', settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTestEmail = async () => {
    setTesting(true);
    setTestResult('');
    try {
      const res = await api.post('/email/test', { to: settings.smtp_user });
      setTestResult(res.message || 'Email terkirim!');
    } catch (e) {
      setTestResult('Gagal: ' + (e.message || 'Error'));
    }
    setTesting(false);
  };

  const handleInstall = () => {
    if (deferredPrompt) { deferredPrompt.prompt(); setDeferredPrompt(null); }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-800">{t('settings.title')}</h2>
        <button onClick={handleSave} className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 flex items-center gap-2">
          <Save size={16} /> {saved ? t('settings.saved') : t('common.save')}
        </button>
      </div>

      {/* Company Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg space-y-4 mb-6">
        <h3 className="font-semibold text-gray-700 mb-2">Perusahaan</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.companyName')}</label>
          <input value={settings.company_name || ''} onChange={e => setSettings({...settings, company_name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.companyAddress')}</label>
          <textarea value={settings.company_address || ''} onChange={e => setSettings({...settings, company_address: e.target.value})} rows={2} className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
      </div>

      {/* Email Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg space-y-4 mb-6">
        <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2"><Mail size={18} /> {t('settings.emailSettings')}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.smtpHost')}</label>
            <input value={settings.smtp_host || ''} onChange={e => setSettings({...settings, smtp_host: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="smtp.gmail.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.smtpPort')}</label>
            <input value={settings.smtp_port || ''} onChange={e => setSettings({...settings, smtp_port: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="587" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.smtpUser')}</label>
          <input value={settings.smtp_user || ''} onChange={e => setSettings({...settings, smtp_user: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="email@example.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.smtpPass')}</label>
          <input type="password" value={settings.smtp_pass || ''} onChange={e => setSettings({...settings, smtp_pass: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.fromEmail')}</label>
          <input value={settings.from_email || ''} onChange={e => setSettings({...settings, from_email: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleTestEmail} disabled={testing} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-orange-600 disabled:opacity-50">
            <TestTube size={14} /> {testing ? 'Mengirim...' : t('settings.testEmail')}
          </button>
          {testResult && <span className="text-sm text-gray-600">{testResult}</span>}
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg space-y-4 mb-6">
        <h3 className="font-semibold text-gray-700 mb-2">Preferensi</h3>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">{t('settings.language')}</span>
          <button onClick={() => setLang(lang === 'id' ? 'en' : 'id')} className="px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50">
            🌐 {lang === 'id' ? 'Bahasa Indonesia' : 'English'}
          </button>
        </div>
      </div>

      {/* API Docs */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg space-y-4 mb-6">
        <h3 className="font-semibold text-gray-700 mb-2">{t('settings.apiDocs')}</h3>
        <a href="/api-docs" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-900">
          <ExternalLink size={14} /> Open API Documentation
        </a>
      </div>

      {/* Install App */}
      {deferredPrompt && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg space-y-4">
          <h3 className="font-semibold text-gray-700 mb-2">{t('settings.installApp')}</h3>
          <button onClick={handleInstall} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">
            📲 Install ERP Manggala
          </button>
        </div>
      )}
    </div>
  );
}
