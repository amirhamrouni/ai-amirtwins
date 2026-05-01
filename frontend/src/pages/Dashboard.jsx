import { useEffect, useState } from 'react';
import client from '../api/client';
import StatsCard from '../components/StatsCard';
import PostCard from '../components/PostCard';

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, publishedToday: 0, pending: 0, failed: 0 });
  const [posts, setPosts] = useState([]);

  async function load() {
    const [s, p] = await Promise.all([client.get('/stats'), client.get('/posts')]);
    setStats(s.data);
    setPosts(p.data.slice(0, 6));
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-1">الرئيسية</h2>
        <p className="text-muted text-sm">نظرة عامة على نشاطك</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="إجمالي البوستات" value={stats.total} color="accent" icon="📊" />
        <StatsCard title="نُشر اليوم" value={stats.publishedToday} color="green" icon="✅" />
        <StatsCard title="في الانتظار" value={stats.pending} color="blue" icon="⏳" />
        <StatsCard title="فشل النشر" value={stats.failed} color="red" icon="❌" />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">آخر البوستات</h3>
        {posts.length === 0 ? (
          <p className="text-muted text-center py-12">لا توجد بوستات بعد. ابدأ بصانع المحتوى!</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} onUpdate={load} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
