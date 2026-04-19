import React, { useEffect, useState } from 'react';

export default function FinanceActionBoard({ userRole }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/finance/pending');
      if (!res.ok) throw new Error('Failed to fetch transactions');
      const data = await res.json();
      setTransactions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, []);

  const handleAction = async (id, action) => {
    try {
      const res = await fetch(`/api/finance/${action}/${id}`, { method: 'PUT' });
      if (!res.ok) throw new Error('Action failed');
      fetchTransactions();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 24, maxWidth: 700 }}>
      <h2 style={{ color: '#0f8f62', marginBottom: 16 }}>Financial Action Board</h2>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: '#e05252' }}>{error}</div>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {transactions.map(tx => (
          <li key={tx.id} style={{ borderBottom: '1px solid #e8eef1', padding: '12px 0' }}>
            <div style={{ fontWeight: 600 }}>{tx.reference} — NGN {tx.amount}</div>
            <div style={{ color: '#3b4f56', margin: '4px 0 8px' }}>Status: <span style={{ color: '#f0ad4e', fontWeight: 700 }}>{tx.status}</span></div>
            {['ACCOUNTS_OFFICER', 'BURSAR', 'DIRECTOR'].includes(userRole) && tx.status === 'PENDING' && (
              <>
                <button onClick={() => handleAction(tx.id, 'approve')} style={{ background: '#2cc287', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 18px', fontWeight: 600, fontSize: 15, marginRight: 8, cursor: 'pointer' }}>Approve</button>
                <button onClick={() => handleAction(tx.id, 'flag')} style={{ background: '#e05252', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Flag</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
