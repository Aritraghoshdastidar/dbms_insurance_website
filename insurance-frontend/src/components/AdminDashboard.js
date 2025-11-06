import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // <-- THIS LINE IS CHANGED

function AdminDashboard() {
  // --- State ---
  const [pendingClaims, setPendingClaims] = useState([]);
  const [pendingPolicies, setPendingPolicies] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [loadingClaims, setLoadingClaims] = useState(true);
  const [loadingPolicies, setLoadingPolicies] = useState(true);
  
  const [error, setError] = useState(null);
  const [updateStatus, setUpdateStatus] = useState({}); // For row-level status

  // --- Data Fetching ---

  // Get current user details from JWT
  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const decodedToken = jwtDecode(token); // <-- THIS LINE IS CHANGED
        setCurrentUser(decodedToken); // e.g., { admin_id: 'ADM002', role: 'Junior Adjuster', ... }
      }
    } catch (err) {
      console.error("Failed to decode JWT:", err);
      setError("Session error. Please log in again.");
    }
  }, []);

  // Fetch pending claims
  const fetchPendingClaims = async () => {
    setLoadingClaims(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/admin/pending-claims', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Could not fetch pending claims.');
      }
      const data = await response.json();
      setPendingClaims(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingClaims(false);
    }
  };

  // Fetch pending policies
  const fetchPendingPolicies = async () => {
    setLoadingPolicies(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/admin/pending-policies', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Could not fetch pending policies.');
      }
      const data = await response.json();
      setPendingPolicies(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingPolicies(false);
    }
  };

  // Fetch all data on initial load
  useEffect(() => {
    fetchPendingClaims();
    fetchPendingPolicies();
  }, []);

  // --- Handlers ---

  // Handle claim Approve/Decline
  const handleClaimUpdate = async (claimId, newStatus) => {
    setUpdateStatus(prev => ({ ...prev, [claimId]: 'Updating...' }));
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/admin/claims/${claimId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newStatus })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Failed to update claim ${claimId}`);
      }
      // Success! Remove from list
      setPendingClaims(prevClaims => prevClaims.filter(claim => claim.claim_id !== claimId));
      setUpdateStatus(prev => ({ ...prev, [claimId]: null }));
    } catch (err) {
      console.error(`Error updating claim ${claimId}:`, err);
      setUpdateStatus(prev => ({ ...prev, [claimId]: `Error: ${err.message}` }));
    }
  };

  // Handle policy approval (multi-step)
  const handlePolicyApprove = async (policyId) => {
    const statusKey = `policy-${policyId}`; // Use a prefix to avoid ID clashes with claims
    setUpdateStatus(prev => ({ ...prev, [statusKey]: 'Approving...' }));
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/admin/policies/${policyId}/approve`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Failed to approve policy ${policyId}`);
      }
      // Success! Refetch the list to show the new status or remove it
      fetchPendingPolicies(); 
      setUpdateStatus(prev => ({ ...prev, [statusKey]: null }));
    } catch (err) {
      console.error(`Error approving policy ${policyId}:`, err);
      setUpdateStatus(prev => ({ ...prev, [statusKey]: `Error: ${err.message}` }));
    }
  };

  // --- Render Policy Action Button (Conditional Logic) ---
  const renderPolicyAction = (policy) => {
    const statusKey = `policy-${policy.policy_id}`;
    
    if (updateStatus[statusKey]) {
      return (
        <span className={updateStatus[statusKey]?.startsWith('Error') ? 'error-inline' : 'loading-inline'}>
          {updateStatus[statusKey]}
        </span>
      );
    }

    if (!currentUser) {
      return <span>Loading user...</span>;
    }

    // State 1: Awaiting Initial Approval
    if (policy.status === 'PENDING_INITIAL_APPROVAL') {
      return (
        <button
          className="action-button approve-button"
          onClick={() => handlePolicyApprove(policy.policy_id)}
        >
          Initial Approve
        </button>
      );
    }

    // State 2: Awaiting Final Approval
    if (policy.status === 'PENDING_FINAL_APPROVAL') {
      // Check 1: Role
      if (currentUser.role !== 'Security Officer') {
        return <span className="error-inline">Requires 'Security Officer' role</span>;
      }
      // Check 2: Different User
      if (currentUser.admin_id === policy.initial_approver_id) {
        return <span className="error-inline">Cannot be same approver</span>;
      }
      // All checks pass
      return (
        <button
          className="action-button approve-button"
          onClick={() => handlePolicyApprove(policy.policy_id)}
        >
          Final Approve
        </button>
      );
    }
    
    return <span>{policy.status}</span>; // e.g., APPROVED
  };


  // --- Render Component ---
  return (
    <div className="dashboard-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Admin Dashboard</h2>
        <Link to="/admin/workflows">
          <button className="button-secondary" style={{ width: 'auto' }}>
            Manage Workflows
          </button>
        </Link>
      </div>

      {error && <div className="error">{error}</div>}

      {/* --- Section: Pending Policy Approvals --- */}
      <div className="claims-section">
        <h3>Pending Policy Approvals</h3>
        {loadingPolicies ? (
          <div>Loading pending policies...</div>
        ) : pendingPolicies.length === 0 ? (
          <p>There are no policies awaiting approval.</p>
        ) : (
          <table className="claims-table">
            <thead>
              <tr>
                <th>Policy ID</th>
                <th>Type</th>
                <th>Premium</th>
                <th>Status</th>
                <th>Initial Approver</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingPolicies.map(policy => (
                <tr key={policy.policy_id}>
                  <td>{policy.policy_id}</td>
                  <td>{policy.policy_type}</td>
                  <td>₹{parseFloat(policy.premium_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>{policy.status}</td>
                  <td>{policy.initial_approver_name || 'N/A'}</td>
                  <td>{renderPolicyAction(policy)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <hr style={{ margin: '40px 0' }} />

      {/* --- Section: Pending Claims --- */}
      <div className="claims-section">
        <h3>Pending Claims</h3>
        {loadingClaims ? (
          <div>Loading pending claims...</div>
        ) : pendingClaims.length === 0 ? (
          <p>There are no pending claims requiring review.</p>
        ) : (
          <table className="claims-table">
            <thead>
              <tr>
                <th>Claim ID</th>
                <th>Customer Name</th>
                <th>Description</th>
                <th>Date Filed</th>
                <th>Amount</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingClaims.map(claim => (
                <tr key={claim.claim_id}>
                  <td>{claim.claim_id}</td>
                  <td>{claim.customer_name}</td>
                  <td>{claim.description}</td>
                  <td>{new Date(claim.claim_date).toLocaleDateString()}</td>
                  <td>₹{parseFloat(claim.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>
                    {updateStatus[claim.claim_id] ? (
                      <span className={updateStatus[claim.claim_id]?.startsWith('Error') ? 'error-inline' : 'loading-inline'}>
                        {updateStatus[claim.claim_id]}
                      </span>
                    ) : (
                      <>
                        <button
                          className="action-button approve-button"
                          onClick={() => handleClaimUpdate(claim.claim_id, 'APPROVED')}
                        >
                          Approve
                        </button>
                        <button
                          className="action-button decline-button"
                          onClick={() => handleClaimUpdate(claim.claim_id, 'DECLINED')}
                        >
                          Decline
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;