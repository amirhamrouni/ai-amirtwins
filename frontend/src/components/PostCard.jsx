import { format } from 'date-fns';
import toast from 'react-hot-toast';
import client from '../api/client';

const statusStyles = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  published: 'bg-green-500/20 text-green-400',
  failed: 'bg-red-500/20 text-red-400',
};

const statusLabels = { pending: 'انتظار', published: 'منشور', failed: 'فشل' };

export default function PostCard({ post, onUpdate }) {
  async function handlePublish() {
    try {
      await client.post(`/posts/${post.id}/publish`);
      toast.success('تم النشر بنجاح!');
      onUpdate?.();
    } catch (err) {
      toast.error(err.response?.data?.error || 'خطأ في النشر');
    }
  }

  async function handleDelete() {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    try {
      await client.delete(`/posts/${post.id}`);
      toast.success('تم الحذف');
      onUpdate?.();
    } catch {
      toast.error('خطأ في الحذف');
    }
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted">{post.topic}</span>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusStyles[post.status]}`}>
          {statusLabels[post.status]}
        </span>
      </div>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
      <div className="flex items-center justify-between text-xs text-muted">
        <span>
          {format(new Date(post.scheduled_at), 'dd/MM/yyyy HH:mm')}
        </span>
        <div className="flex gap-2">
          {post.status === 'pending' && (
            <button
              onClick={handlePublish}
              className="px-3 py-1 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-colors"
            >
              نشر الآن
            </button>
          )}
          <button
            onClick={handleDelete}
            className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            حذف
          </button>
        </div>
      </div>
      {post.error_message && (
        <p className="text-xs text-red-400 bg-red-500/10 rounded p-2">{post.error_message}</p>
      )}
    </div>
  );
}
