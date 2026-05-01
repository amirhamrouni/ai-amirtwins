import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import client from '../api/client';

const fields = [
  { key: 'GROQ_API_KEY', label: 'Groq API Key', placeholder: 'gsk_...' },
  { key: 'GROQ_MODEL', label: 'Groq Model', placeholder: 'llama3-70b-8192' },
  { key: 'FACEBOOK_PAGE_ACCESS_TOKEN', label: 'Facebook Page Access Token', placeholder: 'EAA...' },
  { key: 'FACEBOOK_PAGE_ID', label: 'Facebook Page ID', placeholder: '123456789' },
  { key: 'HUGGINGFACE_API_KEY', label: 'HuggingFace API Key', placeholder: 'hf_...' },
  { key: 'OLLAMA_BASE_URL', label: 'Ollama Base URL', placeholder: 'http://localhost:11434' },
];

export default function Settings() {
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    client.get('/settings').then((r) => setValues(r.data));
  }, []);

  async function save() {
    setSaving(true);
    try {
      await client.post('/settings', values);
      toast.success('تم الحفظ!');
    } catch {
      toast.error('خطأ في الحفظ');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">الإعدادات</h2>
        <p className="text-muted text-sm">ضع مفاتيح API الخاصة بك</p>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
        {fields.map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="block text-sm text-muted mb-1">{label}</label>
            <input
              type={key.includes('KEY') || key.includes('TOKEN') ? 'password' : 'text'}
              value={values[key] || ''}
              onChange={(e) => setValues({ ...values, [key]: e.target.value })}
              placeholder={placeholder}
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent font-mono"
            />
          </div>
        ))}

        <button
          onClick={save}
          disabled={saving}
          className="w-full py-2.5 bg-accent hover:bg-accent/90 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors mt-2"
        >
          {saving ? '⏳ جاري الحفظ...' : '💾 حفظ الإعدادات'}
        </button>
      </div>

      <div className="bg-surface border border-border rounded-xl p-5 text-sm text-muted space-y-2">
        <p className="font-semibold text-white">ملاحظات:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Groq API مجاني على <span className="text-accent">console.groq.com</span></li>
          <li>Facebook Token من <span className="text-accent">developers.facebook.com</span></li>
          <li>HuggingFace Key من <span className="text-accent">huggingface.co/settings/tokens</span></li>
          <li>Ollama اختياري — للعمل بدون إنترنت</li>
        </ul>
      </div>
    </div>
  );
}
