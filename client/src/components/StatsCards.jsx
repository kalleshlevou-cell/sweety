function StatsCards({ stats }) {
  if (!stats) return null;

  const getValueColor = (val) => {
    if (val < 70) return 'glucose-low';
    if (val <= 140) return 'glucose-normal';
    if (val <= 200) return 'glucose-high';
    return 'glucose-very-high';
  };

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className={`stat-value ${getValueColor(stats.highest)}`}>{stats.highest}</div>
        <div className="stat-label">Highest (mg/dl)</div>
      </div>
      <div className="stat-card">
        <div className={`stat-value ${getValueColor(stats.lowest)}`}>{stats.lowest}</div>
        <div className="stat-label">Lowest (mg/dl)</div>
      </div>
      <div className="stat-card">
        <div className={`stat-value ${getValueColor(stats.average)}`}>{stats.average}</div>
        <div className="stat-label">Average (mg/dl)</div>
      </div>
      <div className="stat-card">
        <div className="stat-value" style={{ color: 'var(--info)' }}>{stats.count}</div>
        <div className="stat-label">Total Readings</div>
      </div>
    </div>
  );
}

export default StatsCards;

