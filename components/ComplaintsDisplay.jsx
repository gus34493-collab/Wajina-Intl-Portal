import React, { useEffect, useState } from 'react';

export default function ComplaintsDisplay({ role }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchComplaints = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/complaints');
      if (!res.ok) throw new Error('Failed to fetch complaints');
      const data = await res.json();
      setComplaints(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchComplaints(); }, []);

  const handleResolve = async (id) => {
    try {
      const res = await fetch(`/api/complaints/${id}/resolve`, { method: 'PUT' });
      if (!res.ok) throw new Error('Failed to resolve complaint');
      fetchComplaints();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 24, maxWidth: 700 }}>
      <h2 style={{ color: '#0f8f62', marginBottom: 16 }}>Complaints & Requests</h2>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: '#e05252' }}>{error}</div>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {complaints.map(c => (
          <li key={c.id} style={{ borderBottom: '1px solid #e8eef1', padding: '12px 0' }}>
            <div style={{ fontWeight: 600 }}>{c.subject}</div>
            <div style={{ color: '#3b4f56', margin: '4px 0 8px' }}>{c.message}</div>
            <div style={{ fontSize: 13, color: '#b4c0c6' }}>To: {c.targetRole} | Status: <span style={{ color: c.status === 'RESOLVED' ? '#2cc287' : '#f0ad4e', fontWeight: 700 }}>{c.status}</span></div>
            {role !== 'PARENT' && c.status !== 'RESOLVED' && (
              <button onClick={() => handleResolve(c.id)} style={{ background: '#2cc287', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 18px', fontWeight: 600, fontSize: 15, marginTop: 8, cursor: 'pointer' }}>Resolve</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
