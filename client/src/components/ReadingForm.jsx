import { useState } from 'react';

const SLOT_OPTIONS = [
  { value: 'morning_fasting', label: 'Morning (fasting)' },
  { value: 'after_breakfast', label: 'After breakfast' },
  { value: 'after_lunch', label: 'After lunch' },
  { value: 'after_dinner', label: 'After dinner' },
];

function ReadingForm({ reading, onSubmit, onClose }) {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(reading?.date?.split('T')[0] || today);
  const [timeSlot, setTimeSlot] = useState(reading?.time_slot || 'morning_fasting');
  const [value, setValue] = useState(reading?.value?.toString() || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!value) {
      setError('Please enter a glucose value.');
      return;
    }
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 40 || numValue > 600 || value.includes('.')) {
      setError('Value must be between 40 and 600 mg/dl.');
      return;
    }
    if (new Date(date + 'T00:00:00') > new Date(today + 'T23:59:59')) {
      setError('Date cannot be in the future.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({ date, time_slot: timeSlot, value: numValue });
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="card-header">
          <h3>{reading ? 'Edit Reading' : 'Add Reading'}</h3>
        </div>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={today}
                required
              />
            </div>
            <div className="form-group">
              <label>Time Slot</label>
              <select value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)}>
                {SLOT_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Glucose Value (mg/dl)</label>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. 120"
              min="40"
              max="600"
              required
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : reading ? 'Update' : 'Add Reading'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReadingForm;

