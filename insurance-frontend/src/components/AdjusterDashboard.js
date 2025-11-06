// src/components/AdjusterDashboard.js 12
import React, { useEffect, useState } from "react";
import axios from "axios";

function AdjusterDashboard({ adminId = "ADM1001" }) {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `http://localhost:3001/api/adjuster/dashboard/${adminId}`
        );
        setClaims(res.data.assigned_claims || []);
      } catch (err) {
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchClaims();
  }, [adminId]);

  if (loading) return <p>Loading dashboard...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="card-container">
      <h2>Claims Adjuster Dashboard</h2>
      {claims.length === 0 ? (
        <p>No assigned claims.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Claim ID</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((c) => (
              <tr key={c.claim_id}>
                <td>{c.claim_id}</td>
                <td>{c.description}</td>
                <td>₹{c.amount}</td>
                <td>{c.claim_status}</td>
                <td>{new Date(c.claim_date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdjusterDashboard;
