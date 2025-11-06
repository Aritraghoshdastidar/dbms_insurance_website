import React, { useState, useEffect } from 'react';

// This component takes a function `onClaimFiled` to refresh the dashboard
function FileClaim({ onClaimFiled, refreshKey }) {
  const [policyId, setPolicyId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // New: policies state
  const [policies, setPolicies] = useState([]);
  const [loadingPolicies, setLoadingPolicies] = useState(true);
  const [policyFetchError, setPolicyFetchError] = useState(null);

  // Fetch user's linked policies and default to first ACTIVE, else first available
  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        setLoadingPolicies(true);
        setPolicyFetchError(null);
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:3001/api/my-policies', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Could not fetch policies.');
        }
  setPolicies(Array.isArray(data) ? data : []);
  // Prefer ACTIVE; fallback to first
  const active = (data || []).find(p => p.status === 'ACTIVE');
  if (active) setPolicyId(active.policy_id);
  else if ((data || []).length > 0) setPolicyId(data[0].policy_id);
      } catch (err) {
        setPolicyFetchError(err.message);
      } finally {
        setLoadingPolicies(false);
      }
    };
    fetchPolicies();
  }, [refreshKey]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Client-side guard: ensure selected policy is one of user's linked policies
    const selectedPolicy = policies.find(p => p.policy_id === policyId);
    if (!selectedPolicy) {
      setError('Selected policy is not linked to your account. Please choose from the dropdown.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/my-claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ policy_id: policyId, description, amount: parseFloat(amount) })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Could not file claim.');
      }

      setSuccess('Claim filed successfully! ID: ' + data.claim_id);
      // Clear the form
      setPolicyId(selectedPolicy.policy_id);
      setDescription('');
      setAmount('');
      // Tell the dashboard to refresh
      onClaimFiled(); 
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="file-claim-form">
      <h3>File a New Claim</h3>
      {error && <div className="error">{error}</div>}
      {policyFetchError && <div className="error">{policyFetchError}</div>}
      {success && <div className="success">{success}</div>}

      <div className="form-group">
        <label>Policy</label>
        {loadingPolicies ? (
          <div>Loading your policies...</div>
        ) : policies.length === 0 ? (
          <div className="error">No policies linked to your account. Please activate or purchase a policy first.</div>
        ) : (
          <select value={policyId} onChange={(e) => setPolicyId(e.target.value)} required>
            <option value="" disabled>Select a policy</option>
            {policies.map(p => (
              <option key={p.policy_id} value={p.policy_id}>
                {p.policy_id} — {p.policy_type} [{p.status}]
              </option>
            ))}
          </select>
        )}
        {policyId && (
          <small>
            You can use any linked policy. Status is shown in the dropdown.
          </small>
        )}
      </div>
      <div className="form-group">
        <label>Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Annual check-up"
          required
        />
      </div>
      <div className="form-group">
        <label>Claim Amount (₹)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g., 25000"
          required
        />
      </div>
  <button type="submit" disabled={policies.length === 0}>Submit Claim</button>
    </form>
  );
}

export default FileClaim;