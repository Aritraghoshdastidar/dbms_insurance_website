// src/components/OverdueTasksReport.js 31
import React, { useEffect, useState } from "react";
import axios from "axios";

function OverdueTasksReport() {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios
      .get("http://localhost:3001/api/reports/overdue-tasks", { headers: { 'Authorization': `Bearer ${token}` } })
      .then((res) => setTasks(res.data.overdue_tasks || []))
      .catch((err) => setError(err?.response?.data?.error || "Failed to fetch overdue tasks."));
  }, []);

  if (error) return <p className="error">{error}</p>;

  return (
    <div className="card-container">
      <h2>Overdue Workflow Tasks (SLA Breach - Pending &gt; 7 Days)</h2>
      {tasks.length === 0 ? (
        <p>✅ All tasks are within SLA. No claims pending for more than 7 days.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Claim ID</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Assigned To</th>
              <th>Filed Date</th>
              <th>Hours Overdue</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t, index) => (
              <tr key={t.step_id + '_' + index}>
                <td>{t.claim_id || 'N/A'}</td>
                <td>{t.customer_name || t.customer_id}</td>
                <td>₹{parseFloat(t.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>{t.assigned_role || 'Unassigned'}</td>
                <td>{t.due_date ? new Date(t.due_date).toLocaleDateString() : 'N/A'}</td>
                <td style={{ 
                  color: t.hours_overdue > 336 ? '#ef4444' : t.hours_overdue > 168 ? '#f59e0b' : '#10b981',
                  fontWeight: 'bold'
                }}>
                  {t.hours_overdue}h ({Math.floor(t.hours_overdue / 24)} days)
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default OverdueTasksReport;
