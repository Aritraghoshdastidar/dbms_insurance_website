// src/components/HighRiskAlerts.js 14
import React, { useEffect, useState } from "react";
import axios from "axios";

function HighRiskAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchAlerts = () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    axios
      .get("http://localhost:3001/api/alerts/highrisk", { headers: { 'Authorization': `Bearer ${token}` } })
      .then((res) => {
        setAlerts(res.data.high_risk_claims || []);
        setLastRefresh(new Date());
      })
      .catch((err) => setError(err?.response?.data?.error || "Failed to fetch alerts."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAlerts();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && alerts.length === 0) return <p>Loading alerts...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="card-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ margin: 0 }}>High-Risk Claims Alerts</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <button 
            onClick={fetchAlerts}
            disabled={loading}
            style={{
              padding: '6px 12px',
              backgroundColor: loading ? '#d1d5db' : '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}
          >
            {loading ? '⟳ Refreshing...' : '🔄 Refresh'}
          </button>
        </div>
      </div>
      {alerts.length === 0 ? (
        <p>No high-risk claims detected.</p>
      ) : (
        <>
          <div style={{ 
            backgroundColor: '#f3f4f6', 
            padding: '10px', 
            borderRadius: '6px', 
            marginBottom: '15px',
            fontSize: '0.85rem'
          }}>
            <strong>Risk Levels:</strong> 
            <span style={{ marginLeft: '10px' }}>
              <span style={{ color: '#ef4444', fontWeight: 'bold' }}>HIGH (7-10)</span> &gt; ₹5L | 
              <span style={{ color: '#f59e0b', fontWeight: 'bold', marginLeft: '5px' }}>MEDIUM (5-6)</span> ₹1L-5L | 
              <span style={{ color: '#10b981', fontWeight: 'bold', marginLeft: '5px' }}>LOW (4)</span> &lt; ₹1L
            </span>
          </div>
          <table className="data-table">
          <thead>
            <tr>
              <th>Claim ID</th>
              <th>Customer ID</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Risk Score</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((a) => (
              <tr key={a.claim_id}>
                <td>{a.claim_id}</td>
                <td>{a.customer_id}</td>
                <td>₹{parseFloat(a.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px',
                    backgroundColor: a.claim_status === 'APPROVED' ? '#10b981' : 
                                   a.claim_status === 'DECLINED' ? '#ef4444' : '#f59e0b',
                    color: 'white',
                    fontSize: '0.85rem'
                  }}>
                    {a.claim_status}
                  </span>
                </td>
                <td>
                  <span style={{ 
                    fontWeight: 'bold',
                    color: a.risk_score >= 7 ? '#ef4444' : a.risk_score >= 5 ? '#f59e0b' : '#10b981'
                  }}>
                    {a.risk_score}/10
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </>
      )}
    </div>
  );
}

export default HighRiskAlerts;
