import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import client from '../api/client';
import PostCard from '../components/PostCard';

export default function Calendar() {
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState('all');

  async function load() {
    const params = filter !== 'all' ? { status: filter } : {};
    const res = await client.get('/posts', { params });
    setPosts(res.data);
  }

  useEffect(() => { load(); }, [filter]);

  const grouped = posts.reduce((acc, p) => {
    const day = format(parseISO(p.scheduled_at), 'yyyy-MM-dd');
    if (!acc[day]) acc[day] = [];
    acc[day].push(p);
    return acc;
  }, {});

  const filters = [
    { value: 'all', label: 'الكل' },
    { value: 'pending', label: 'انتظار' },
    { value: 'published', label: 'منشور' },
    { value: 'failed', label: 'فشل' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">التقويم</h2>
          <p className="text-muted text-sm">جميع البوستات المجدولة</p>
        </div>
        <div className="flex gap-2">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                filter === f.value
                  ? 'bg-accent text-white'
                  : 'bg-surface border border-border text-muted hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <p className="text-muted text-center py-16">لا توجد بوستات.</p>
      ) : (
        Object.entries(grouped)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([day, dayPosts]) => (
            <div key={day}>
              <h3 className="text-sm font-semibold text-muted mb-3 sticky top-0 bg-bg py-1">
                📅 {format(parseISO(day), 'dd/MM/yyyy')}
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {dayPosts.map((p) => (
                  <PostCard key={p.id} post={p} onUpdate={load} />
                ))}
              </div>
            </div>
          ))
      )}
    </div>
  );
}
