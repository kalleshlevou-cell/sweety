const Reading = require('../models/Reading');

const SLOT_LABELS = {
  morning_fasting: 'Morning (fasting)',
  after_breakfast: 'After breakfast',
  after_lunch: 'After lunch',
  after_dinner: 'After dinner',
};

/**
 * Helper: compute stats from readings
 */
const computeStats = (readings) => {
  if (readings.length === 0) return null;
  const values = readings.map((r) => r.value);
  return {
    highest: Math.max(...values),
    lowest: Math.min(...values),
    average: parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)),
    count: readings.length,
  };
};

/**
 * Helper: normalize date to midnight UTC
 */
const toDateOnly = (dateStr) => new Date(dateStr + 'T00:00:00.000Z');

/**
 * Daily report
 * GET /api/reports/daily?date=2026-10-15
 */
const dailyReport = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'Date query parameter is required.' });
    }

    const readingDate = toDateOnly(date);

    const readings = await Reading.find({
      user: req.user.id,
      date: readingDate,
    }).sort({
      time_slot: 1, // Will sort alphabetically; custom order below
    });

    // Custom slot order
    const slotOrder = { morning_fasting: 1, after_breakfast: 2, after_lunch: 3, after_dinner: 4 };
    const sorted = [...readings].sort((a, b) => slotOrder[a.time_slot] - slotOrder[b.time_slot]);

    const enriched = sorted.map((r) => ({
      ...r.toObject(),
      slot_label: SLOT_LABELS[r.time_slot],
    }));

    res.json({
      report: 'daily',
      date,
      stats: computeStats(sorted),
      readings: enriched,
    });
  } catch (err) {
    console.error('Daily report error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * Month-to-date report
 * GET /api/reports/month-to-date?date=2026-10-15
 * Range: 1st of the month to the selected date
 */
const monthToDateReport = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'Date query parameter is required.' });
    }

    const selectedDate = new Date(date);
    const startOfMonth = new Date(Date.UTC(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    const endDate = toDateOnly(date);
    const startStr = startOfMonth.toISOString().split('T')[0];

    const readings = await Reading.find({
      user: req.user.id,
      date: { $gte: startOfMonth, $lte: endDate },
    }).sort({ date: 1 });

    res.json({
      report: 'month-to-date',
      startDate: startStr,
      endDate: date,
      stats: computeStats(readings),
      readingCount: readings.length,
    });
  } catch (err) {
    console.error('Month-to-date report error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * Monthly report (previous month)
 * GET /api/reports/monthly?date=2026-10-15
 * Range: entire previous month (e.g. 1 Sep – 30 Sep 2026)
 */
const monthlyReport = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'Date query parameter is required.' });
    }

    const selectedDate = new Date(date);
    const prevMonthStart = new Date(Date.UTC(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
    const prevMonthEnd = new Date(Date.UTC(selectedDate.getFullYear(), selectedDate.getMonth(), 0));
    const startStr = prevMonthStart.toISOString().split('T')[0];
    const endStr = prevMonthEnd.toISOString().split('T')[0];

    const readings = await Reading.find({
      user: req.user.id,
      date: { $gte: prevMonthStart, $lte: prevMonthEnd },
    }).sort({ date: 1 });

    res.json({
      report: 'monthly',
      startDate: startStr,
      endDate: endStr,
      stats: computeStats(readings),
      readingCount: readings.length,
    });
  } catch (err) {
    console.error('Monthly report error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * Chart data: daily averages for a month
 * GET /api/reports/chart?date=2026-10-15
 */
const chartData = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'Date query parameter is required.' });
    }

    const selectedDate = new Date(date);
    const startOfMonth = new Date(Date.UTC(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    const endOfMonth = new Date(Date.UTC(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0));
    const startStr = startOfMonth.toISOString().split('T')[0];
    const endStr = endOfMonth.toISOString().split('T')[0];

    const readings = await Reading.find({
      user: req.user.id,
      date: { $gte: startOfMonth, $lte: endOfMonth },
    }).sort({ date: 1 });

    // Group by date for chart
    const chartMap = {};
    readings.forEach((r) => {
      const dateKey = r.date.toISOString().split('T')[0];
      if (!chartMap[dateKey]) {
        chartMap[dateKey] = {
          date: dateKey, values: [],
          morning_fasting: null, after_breakfast: null,
          after_lunch: null, after_dinner: null,
        };
      }
      chartMap[dateKey][r.time_slot] = r.value;
      chartMap[dateKey].values.push(r.value);
    });

    // Compute daily averages
    const chartDataArr = Object.values(chartMap).map((d) => ({
      date: d.date,
      average: parseFloat((d.values.reduce((a, b) => a + b, 0) / d.values.length).toFixed(1)),
      morning_fasting: d.morning_fasting,
      after_breakfast: d.after_breakfast,
      after_lunch: d.after_lunch,
      after_dinner: d.after_dinner,
    }));

    res.json({
      report: 'chart',
      startDate: startStr,
      endDate: endStr,
      data: chartDataArr,
    });
  } catch (err) {
    console.error('Chart data error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { dailyReport, monthToDateReport, monthlyReport, chartData };
