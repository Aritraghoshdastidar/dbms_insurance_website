import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import FileClaim from './FileClaim'; // 👈 You already have this
import NotificationsPanel from './NotificationsPanel';

function Dashboard() {
  // State for Claims
  const [claims, setClaims] = useState([]);
  const [loadingClaims, setLoadingClaims] = useState(true);
  const [errorClaims, setErrorClaims] = useState(null);

  // --- NEW: State for Policies ---
  const [policies, setPolicies] = useState([]);
  const [loadingPolicies, setLoadingPolicies] = useState(true);
  const [errorPolicies, setErrorPolicies] = useState(null);
  const [activationStatus, setActivationStatus] = useState({}); // For row-level status

  // 1. fetchClaims (your existing function, renamed loading/error)
  const fetchClaims = async () => {
    try {
      setLoadingClaims(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/my-claims', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Could not fetch claims.');
      const data = await response.json();
      setClaims(data);
    } catch (err) {
      setErrorClaims(err.message);
    } finally {
      setLoadingClaims(false);
    }
  };

  // --- NEW: fetchPolicies ---
  const [policyRefreshKey, setPolicyRefreshKey] = useState(0); // bump to signal children
  const fetchPolicies = async () => {
    try {
      setLoadingPolicies(true);
      setErrorPolicies(null); // Clear previous errors
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/my-policies', { // Use the new endpoint
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
           const data = await response.json();
           throw new Error(data.error || 'Could not fetch policies.');
      }
      const data = await response.json();
      setPolicies(data);
      setPolicyRefreshKey(prev => prev + 1);
    } catch (err) {
      setErrorPolicies(err.message);
    } finally {
      setLoadingPolicies(false);
    }
  };

  // 2. useEffect now calls both
  useEffect(() => {
    fetchClaims();
    fetchPolicies(); // <-- ADDED
  }, []); 

  // 3. handleClaimFiled (your existing function)
  const handleClaimFiled = () => {
    fetchClaims(); // This refreshes the claims list
  };

  // --- NEW: handleActivatePolicy (Mock Payment) ---
  const handleActivatePolicy = async (policyId) => {
    // Show a simple confirmation for the mock payment
    if (!window.confirm("This is a mock payment.\nDo you want to simulate a successful payment and activate this policy?")) {
      return;
    }

    setActivationStatus(prev => ({ ...prev, [policyId]: 'Activating...' }));
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/policies/${policyId}/mock-activate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Could not activate policy.');
      }

      // Success! Refresh the policy list to show the new "ACTIVE" status
      console.log('Mock activation successful:', data.message);
      setActivationStatus(prev => ({ ...prev, [policyId]: 'Activated!' }));
      await fetchPolicies(); // Refresh the list

    } catch (err) {
      console.error('Mock Activation Error:', err);
      setActivationStatus(prev => ({ ...prev, [policyId]: `Error: ${err.message}` }));
    }
  };


  // --- Render ---
  return (
    <div className="dashboard-container">
      {/* Notifications */}
      <NotificationsPanel />
      
      {/* --- NEW: Policies Section --- */}
      <h2>My Policies</h2>
      {loadingPolicies ? (
        <div>Loading policies...</div>
      ) : errorPolicies ? (
        <div className="error">{errorPolicies}</div>
      ) : policies.length === 0 ? (
        <div>
          <p>You do not have any policies yet.</p>
          <Link className="action-button approve-button" to="/buy-policy">Buy a Policy</Link>
        </div>
      ) : (
        <table className="claims-table" style={{ marginBottom: '40px' }}>
          <thead>
            <tr>
              <th>Policy ID</th>
              <th>Type</th>
              <th>Premium</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {policies.map(policy => {
              const statusMsg = activationStatus[policy.policy_id];
              return (
                <tr key={policy.policy_id}>
                  <td>{policy.policy_id}</td>
                  <td>{policy.policy_type}</td>
                  <td>₹{parseFloat(policy.premium_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>
                    <span className={`status status-${policy.status.toLowerCase().replace(/_/g, '-')}`}>
                       {policy.status.replace(/_/g, ' ')} {/* Make status more readable */}
                    </span>
                  </td>
                  <td>
                    {/* Show button ONLY if payment is needed */}
                    {policy.status === 'INACTIVE_AWAITING_PAYMENT' && !statusMsg && (
                      <button
                        className="action-button approve-button" // Using approve style
                        onClick={() => handleActivatePolicy(policy.policy_id)}
                      >
                        Activate (Mock Pay)
                      </button>
                    )}
                    {/* Show status message during/after activation attempt */}
                    {statusMsg && (
                      <span className={statusMsg.startsWith('Error') ? 'error-inline' : 'loading-inline'}>
                        {statusMsg}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

  {/* --- Existing Claims Section --- */}
  <FileClaim onClaimFiled={handleClaimFiled} refreshKey={policyRefreshKey} />

      <h2 style={{marginTop: '40px'}}>My Claims</h2>
      {loadingClaims ? (
        <div>Loading claims...</div>
      ) : errorClaims ? (
         <div className="error">{errorClaims}</div>
      ) : claims.length === 0 ? (
        <p>You have not filed any claims yet.</p>
      ) : (
        <table className="claims-table">
          <thead>
            <tr>
              <th>Claim ID</th>
              <th>Description</th>
              <th>Date Filed</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {claims.map(claim => (
              <tr key={claim.claim_id}>
                <td>{claim.claim_id}</td>
                <td>{claim.description}</td>
                <td>{new Date(claim.claim_date).toLocaleDateString()}</td>
                <td>₹{parseFloat(claim.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>
                  <span className={`status status-${claim.claim_status.toLowerCase()}`}>
                    {claim.claim_status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Dashboard;