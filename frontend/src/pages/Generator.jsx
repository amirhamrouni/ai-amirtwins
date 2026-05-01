import { useState } from 'react';
import toast from 'react-hot-toast';
import client from '../api/client';

const categories = [
  'ترفيه وفكاهة',
  'نصائح يومية',
  'أخبار تكنولوجيا',
  'طبخ ووصفات',
  'رياضة',
  'صحة ولياقة',
  'سياحة وسفر',
  'تحفيز وإلهام',
];

export default function Generator() {
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [saving, setSaving] = useState(false);

  async function generate() {
    if (!topic.trim()) return toast.error('أدخل موضوعاً');
    setLoading(true);
    try {
      const res = await client.post('/generate', { topic: `${category}: ${topic}` });
      setContent(res.data.content);
    } catch (err) {
      toast.error(err.response?.data?.error || 'خطأ في التوليد');
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!content) return toast.error('ولّد محتوى أولاً');
    if (!scheduledAt) return toast.error('اختر وقت النشر');
    setSaving(true);
    try {
      await client.post('/posts', {
        topic: `${category}: ${topic}`,
        content,
        scheduled_at: new Date(scheduledAt).toISOString(),
      });
      toast.success('تم الحفظ والجدولة!');
      setTopic('');
      setContent('');
      setScheduledAt('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'خطأ في الحفظ');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">صانع المحتوى</h2>
        <p className="text-muted text-sm">ولّد بوستات تونسية بالذكاء الاصطناعي</p>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm text-muted mb-1">الفئة</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
          >
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm text-muted mb-1">الموضوع</label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && generate()}
            placeholder="مثال: نصائح للنوم بشكل أفضل..."
            className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
          />
        </div>

        <button
          onClick={generate}
          disabled={loading}
          className="w-full py-2.5 bg-accent hover:bg-accent/90 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
        >
          {loading ? '⏳ جاري التوليد...' : '✨ ولّد البوست'}
        </button>
      </div>

      {content && (
        <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-sm text-muted">النص المولّد</h3>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none leading-relaxed"
          />

          <div>
            <label className="block text-sm text-muted mb-1">وقت النشر</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
            />
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="w-full py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
          >
            {saving ? '⏳ جاري الحفظ...' : '📅 احفظ وجدوله'}
          </button>
        </div>
      )}
    </div>
  );
}
