export default function StatsCard({ title, value, color = 'accent', icon }) {
  const colorMap = {
    accent: 'text-accent',
    blue: 'text-blue-400',
    green: 'text-green-400',
    red: 'text-red-400',
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-5 flex items-center gap-4">
      <div className={`text-3xl ${colorMap[color] || colorMap.accent}`}>{icon}</div>
      <div>
        <p className="text-muted text-sm">{title}</p>
        <p className={`text-2xl font-bold ${colorMap[color] || colorMap.accent}`}>{value}</p>
      </div>
    </div>
  );
}
