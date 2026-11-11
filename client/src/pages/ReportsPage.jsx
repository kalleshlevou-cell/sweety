import { useState, useEffect } from 'react';
import api from '../api/axios';
import StatsCards from '../components/StatsCards';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const SLOT_LABELS = {
  morning_fasting: 'Morning (fasting)',
  after_breakfast: 'After breakfast',
  after_lunch: 'After lunch',
  after_dinner: 'After dinner',
};

function ReportsPage() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [activeTab, setActiveTab] = useState('daily');
  const [report, setReport] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchReport(); }, [selectedDate, activeTab]);
  useEffect(() => { fetchChartData(); }, [selectedDate]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'daily'
        ? `/reports/daily?date=${selectedDate}`
        : activeTab === 'month-to-date'
        ? `/reports/month-to-date?date=${selectedDate}`
        : `/reports/monthly?date=${selectedDate}`;
      const res = await api.get(endpoint);
      setReport(res.data);
    } catch {
      toast.error('Failed to load report.');
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    try {
      const res = await api.get(`/reports/chart?date=${selectedDate}`);
      setChartData(res.data.data);
    } catch { /* chart is optional */ }
  };

  const formatDate = (dateStr) => {
    try { return format(new Date(dateStr + 'T00:00:00'), 'dd MMM yyyy'); }
    catch { return dateStr; }
  };

  const formatChartDate = (dateStr) => {
    try { return format(new Date(dateStr + 'T00:00:00'), 'dd MMM'); }
    catch { return dateStr; }
  };

  const getValueColor = (val) => {
    if (val < 70) return 'glucose-low';
    if (val <= 140) return 'glucose-normal';
    if (val <= 200) return 'glucose-high';
    return 'glucose-very-high';
  };

  const getDateRangeLabel = () => {
    if (!report) return '';
    if (activeTab === 'daily') return formatDate(selectedDate);
    return `${formatDate(report.startDate)} – ${formatDate(report.endDate)}`;
  };

  return (
    <>
      <div className="page-header"><h1>Reports</h1></div>

      <div className="card">
        <div className="date-picker-row">
          <span className="date-label">Select date:</span>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} max={today} />
        </div>

        <div className="report-tabs">
          <button className={`report-tab ${activeTab === 'daily' ? 'active' : ''}`} onClick={() => setActiveTab('daily')}>
            📅 Daily
          </button>
          <button className={`report-tab ${activeTab === 'month-to-date' ? 'active' : ''}`} onClick={() => setActiveTab('month-to-date')}>
            📆 Month-to-Date
          </button>
          <button className={`report-tab ${activeTab === 'monthly' ? 'active' : ''}`} onClick={() => setActiveTab('monthly')}>
            🗓️ Previous Month
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading report...</div>
        ) : (
          <>
            <div className="date-range">{getDateRangeLabel()}</div>

            {report?.stats ? (
              <>
                <StatsCards stats={report.stats} />
                {activeTab === 'daily' && report.readings?.length > 0 && (
                  <div style={{ marginTop: '20px' }}>
                    <h4 style={{ marginBottom: '12px', fontSize: '0.95rem', color: 'var(--text-light)' }}>
                      Readings for this day
                    </h4>
                    <table className="readings-table">
                      <thead>
                        <tr><th>Time Slot</th><th>Value</th></tr>
                      </thead>
                      <tbody>
                        {report.readings.map((r) => (
                          <tr key={r._id || r.id}>
                            <td><span className={`slot-badge slot-${r.time_slot}`}>{SLOT_LABELS[r.time_slot]}</span></td>
                            <td>
                              <span className={`glucose-value ${getValueColor(r.value)}`}>
                                {r.value} <small style={{ fontWeight: 400, fontSize: '0.8rem' }}>mg/dl</small>
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3>No readings found</h3>
                <p>There are no readings for this {activeTab === 'daily' ? 'date' : 'period'}.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Chart (Bonus) */}
      {chartData.length > 0 && (
        <div className="card">
          <div className="card-header"><h3>📈 Monthly Glucose Trend</h3></div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="date" tickFormatter={formatChartDate} fontSize={12} />
                <YAxis domain={[40, 'auto']} fontSize={12} />
                <Tooltip
                  labelFormatter={formatChartDate}
                  formatter={(value, name) => {
                    const labels = {
                      average: 'Average', morning_fasting: 'Morning (fasting)',
                      after_breakfast: 'After breakfast', after_lunch: 'After lunch', after_dinner: 'After dinner',
                    };
                    return value !== null ? [`${value} mg/dl`, labels[name] || name] : null;
                  }}
                />
                <Legend formatter={(v) => ({
                  average: 'Average', morning_fasting: 'Morning (fasting)',
                  after_breakfast: 'After breakfast', after_lunch: 'After lunch', after_dinner: 'After dinner',
                }[v] || v)} />
                <Line type="monotone" dataKey="average" stroke="#e74c7c" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="morning_fasting" stroke="#e65100" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="after_breakfast" stroke="#2e7d32" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="after_lunch" stroke="#1565c0" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="after_dinner" stroke="#7b1fa2" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </>
  );
}

export default ReportsPage;

