import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import ReadingForm from '../components/ReadingForm';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const SLOT_LABELS = {
  morning_fasting: 'Morning (fasting)',
  after_breakfast: 'After breakfast',
  after_lunch: 'After lunch',
  after_dinner: 'After dinner',
};

function ReadingsPage() {
  const [readings, setReadings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingReading, setEditingReading] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchReadings = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/readings?page=${page}&limit=10`);
      setReadings(res.data.readings);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load readings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReadings(); }, [fetchReadings]);

  const handleAdd = async (data) => {
    await api.post('/readings', data);
    toast.success('Reading added!');
    setShowForm(false);
    fetchReadings(pagination.page);
  };

  const handleEdit = async (data) => {
    const id = editingReading._id || editingReading.id;
    await api.put(`/readings/${id}`, data);
    toast.success('Reading updated!');
    setEditingReading(null);
    fetchReadings(pagination.page);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/readings/${id}`);
      toast.success('Reading deleted.');
      setDeleteConfirm(null);
      fetchReadings(pagination.page);
    } catch {
      toast.error('Failed to delete reading.');
    }
  };

  const getValueColor = (val) => {
    if (val < 70) return 'glucose-low';
    if (val <= 140) return 'glucose-normal';
    if (val <= 200) return 'glucose-high';
    return 'glucose-very-high';
  };

  const formatDate = (dateStr) => {
    try {
      const d = typeof dateStr === 'string' ? new Date(dateStr + 'T00:00:00') : new Date(dateStr);
      return format(d, 'dd MMM yyyy');
    } catch {
      return dateStr;
    }
  };

  // Helper to get reading ID (works with both MongoDB _id and generic id)
  const getId = (r) => r._id || r.id;

  return (
    <>
      <div className="page-header">
        <h1>My Readings</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Add Reading
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading readings...</div>
      ) : readings.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>No readings yet</h3>
            <p>Start by adding your first blood glucose reading.</p>
            <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => setShowForm(true)}>
              + Add Your First Reading
            </button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <table className="readings-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time Slot</th>
                <th>Value</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {readings.map((r) => (
                <tr key={getId(r)}>
                  <td>{formatDate(r.date)}</td>
                  <td>
                    <span className={`slot-badge slot-${r.time_slot}`}>
                      {SLOT_LABELS[r.time_slot]}
                    </span>
                  </td>
                  <td>
                    <span className={`glucose-value ${getValueColor(r.value)}`}>
                      {r.value} <small style={{ fontWeight: 400, fontSize: '0.8rem' }}>mg/dl</small>
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => setEditingReading(r)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(getId(r))}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button onClick={() => fetchReadings(pagination.page - 1)} disabled={pagination.page <= 1}>
                ← Previous
              </button>
              <span className="page-info">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <button onClick={() => fetchReadings(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages}>
                Next →
              </button>
            </div>
          )}
        </div>
      )}

      {showForm && <ReadingForm onSubmit={handleAdd} onClose={() => setShowForm(false)} />}
      {editingReading && (
        <ReadingForm reading={editingReading} onSubmit={handleEdit} onClose={() => setEditingReading(null)} />
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="card-header"><h3>Delete Reading</h3></div>
            <p>Are you sure you want to delete this reading? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ReadingsPage;
