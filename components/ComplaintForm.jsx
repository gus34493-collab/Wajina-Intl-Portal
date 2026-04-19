import React, { useState } from 'react';

export default function ComplaintForm({ studentId, onSubmitted }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [targetRole, setTargetRole] = useState('ADMIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message, studentId, targetRole })
      });
      if (!res.ok) throw new Error('Failed to submit complaint');
      setSubject('');
      setMessage('');
      setTargetRole('ADMIN');
      if (onSubmitted) onSubmitted();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: '#f4f7f8', borderRadius: 12, padding: 24, maxWidth: 480 }}>
      <h2 style={{ color: '#0f8f62', marginBottom: 16 }}>Submit a Complaint or Request</h2>
      <label style={{ display: 'block', marginBottom: 8 }}>
        Subject
        <input value={subject} onChange={e => setSubject(e.target.value)} required style={{ width: '100%', marginTop: 4, marginBottom: 12, padding: 8, borderRadius: 6, border: '1px solid #b4c0c6' }} />
      </label>
      <label style={{ display: 'block', marginBottom: 8 }}>
        Message
        <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={4} style={{ width: '100%', marginTop: 4, marginBottom: 12, padding: 8, borderRadius: 6, border: '1px solid #b4c0c6' }} />
      </label>
      <label style={{ display: 'block', marginBottom: 16 }}>
        Send to
        <select value={targetRole} onChange={e => setTargetRole(e.target.value)} style={{ marginLeft: 8, padding: 6, borderRadius: 6, border: '1px solid #b4c0c6' }}>
          <option value="ADMIN">Admin</option>
          <option value="DIRECTOR">Director</option>
        </select>
      </label>
      {error && <div style={{ color: '#e05252', marginBottom: 12 }}>{error}</div>}
      <button type="submit" disabled={loading} style={{ background: '#2cc287', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>
        {loading ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
