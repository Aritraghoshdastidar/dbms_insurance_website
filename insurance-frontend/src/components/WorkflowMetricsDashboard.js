// src/components/WorkflowMetricsDashboard.js 30
import React, { useEffect, useState } from "react";
import axios from "axios";

function WorkflowMetricsDashboard() {
  const [metrics, setMetrics] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:3001/api/metrics/workflows")
      .then((res) => setMetrics(res.data.metrics || []))
      .catch(() => setError("Could not load workflow metrics."));
  }, []);

  if (error) return <p className="error">{error}</p>;

  return (
    <div className="card-container">
      <h2>Workflow Metrics</h2>
      {metrics.length === 0 ? (
        <p>No workflows found.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Workflow ID</th>
              <th>Name</th>
              <th>Total Claims</th>
              <th>Avg Processing Time (hrs)</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m) => (
              <tr key={m.workflow_id}>
                <td>{m.workflow_id}</td>
                <td>{m.workflow_name}</td>
                <td>{m.total_claims}</td>
                <td>{Number(m.avg_processing_time_hrs).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default WorkflowMetricsDashboard;
