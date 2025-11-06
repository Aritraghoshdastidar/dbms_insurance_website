// src/components/DocumentProcessor.js 13
import React, { useState } from "react";
import axios from "axios";

function DocumentProcessor() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoCreateClaim, setAutoCreateClaim] = useState(false);
  const [claimCreated, setClaimCreated] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [loadingPolicies, setLoadingPolicies] = useState(false);

  // Fetch policies when auto-create is enabled
  const fetchPolicies = async () => {
    try {
      setLoadingPolicies(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:3001/api/my-policies', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setPolicies(res.data || []);
    } catch (err) {
      console.error('Error fetching policies:', err);
      setPolicies([]);
    } finally {
      setLoadingPolicies(false);
    }
  };

  // Fetch policies when auto-create is toggled on
  React.useEffect(() => {
    if (autoCreateClaim) {
      fetchPolicies();
    }
  }, [autoCreateClaim]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = ['text/plain'];
      if (!validTypes.includes(selectedFile.type)) {
        setError("Please upload a .txt file only");
        setFile(null);
        return;
      }
      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please choose a file first.");
      return;
    }
    
    setError(null);
    setResult(null);
    setClaimCreated(null);
    setLoading(true);
    const formData = new FormData();
    formData.append("document", file);
    
    try {
      const res = await axios.post(
        "http://localhost:3001/api/documents/process",
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      setResult(res.data.extracted);
      
      // If auto-create is enabled and we have extracted data, create the claim
      if (autoCreateClaim && res.data.extracted.claim_id && res.data.extracted.amount) {
        await createClaimFromExtraction(res.data.extracted);
      }
      
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || "Document processing failed.");
      setLoading(false);
    }
  };

  const createClaimFromExtraction = async (extractedData) => {
    try {
      const token = localStorage.getItem('token');
      
      // First, try to find a policy for this user
      const policiesRes = await axios.get('http://localhost:3001/api/my-policies', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!policiesRes.data || policiesRes.data.length === 0) {
        setError("❌ Cannot auto-create claim: You don't have any policies linked to your account. Please purchase a policy first or file claim manually with a valid Policy ID.");
        return;
      }
      
      // Prefer ACTIVE policy; if none, fall back to first linked policy
      const chosenPolicy = policiesRes.data.find(p => p.status === 'ACTIVE') || policiesRes.data[0];
      
      console.log('Creating claim with policy:', chosenPolicy.policy_id, 'status:', chosenPolicy.status);
      
      // Create the claim
      const claimRes = await axios.post(
        'http://localhost:3001/api/my-claims',
        {
          policy_id: chosenPolicy.policy_id,
          description: `Auto-created from document: Claim ${extractedData.claim_id}`,
          amount: extractedData.amount
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      setClaimCreated({
        claim_id: claimRes.data.claim_id,
        policy_id: chosenPolicy.policy_id,
        extracted_claim_ref: extractedData.claim_id,
        policy_status_used: chosenPolicy.status
      });
      
    } catch (err) {
      console.error('Error auto-creating claim:', err);
      console.error('Error details:', err.response?.data);
      
      // Provide detailed error message
      let errorMsg = 'Document processed, but claim creation failed: ';
      
      if (err.response?.data?.error) {
        errorMsg += err.response.data.error;
        
        // Add helpful hints based on error type
        if (err.response.data.error.includes('does not belong to this customer')) {
          errorMsg += ' This is a database consistency issue. Please contact administrator.';
        } else if (err.response.data.error.includes('Policy ID')) {
          errorMsg += ' Please check that you have an active policy linked to your account.';
        }
      } else {
        errorMsg += err.message || 'Unknown error';
      }
      
      setError(errorMsg);
    }
  };

  return (
    <div className="card-container">
      <h2>Intelligent Document Processor</h2>
      <div className="info-box" style={{ 
        backgroundColor: '#e3f2fd', 
        padding: '15px', 
        borderRadius: '5px', 
        marginBottom: '20px',
        border: '1px solid #90caf9'
      }}>
        <h4 style={{ marginTop: 0, color: '#1976d2' }}>📄 How it works:</h4>
        <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
          <li>Upload a <strong>.txt file</strong> containing claim information</li>
          <li>The system extracts <strong>Claim ID</strong> and <strong>Amount</strong></li>
          <li><strong>Optionally</strong> auto-create a claim in the system</li>
          <li>Accepted format example:</li>
        </ul>
        <pre style={{ 
          backgroundColor: '#f5f5f5', 
          padding: '10px', 
          borderRadius: '4px',
          fontSize: '12px',
          marginTop: '10px'
        }}>
{`Claim ID: CLM2024001
Policy ID: POL1002
Amount: ₹5,500`}
        </pre>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px',
          padding: '10px',
          backgroundColor: '#fff3e0',
          borderRadius: '5px',
          border: '1px solid #ffb74d',
          cursor: 'pointer'
        }}>
          <input
            type="checkbox"
            checked={autoCreateClaim}
            onChange={(e) => setAutoCreateClaim(e.target.checked)}
            style={{ width: '18px', height: '18px' }}
          />
          <span style={{ fontWeight: '500' }}>
            ✨ Auto-create claim after extraction
          </span>
        </label>
        {autoCreateClaim && (
          <p style={{ 
            fontSize: '13px', 
            color: '#666', 
            marginTop: '8px',
            marginLeft: '10px'
          }}>
            ℹ️ The system will automatically file a claim using your first ACTIVE policy
            (or the first linked policy if none are active).
          </p>
        )}
        {autoCreateClaim && (
          <div style={{ 
            marginTop: '10px',
            padding: '10px',
            backgroundColor: '#f5f5f5',
            borderRadius: '5px',
            marginLeft: '10px',
            fontSize: '13px'
          }}>
            <strong>Your Policies:</strong>
            {loadingPolicies ? (
              <p style={{ margin: '5px 0' }}>Loading policies...</p>
            ) : policies.length === 0 ? (
              <p style={{ margin: '5px 0', color: '#f44336' }}>
                ⚠️ No policies found! You need an active policy to auto-create claims.
              </p>
            ) : (
              <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                {policies.map((p, idx) => {
                  const firstActiveIdx = policies.findIndex(pol => pol.status === 'ACTIVE');
                  const willUse = firstActiveIdx !== -1 ? (idx === firstActiveIdx) : (idx === 0);
                  return (
                    <li key={p.policy_id} style={{ 
                      color: p.status === 'ACTIVE' ? '#4caf50' : '#ff9800',
                      marginBottom: '3px'
                    }}>
                      {p.policy_id} - {p.policy_type} 
                      <span style={{ 
                        marginLeft: '8px',
                        padding: '2px 6px',
                        backgroundColor: p.status === 'ACTIVE' ? '#e8f5e9' : '#fff3e0',
                        borderRadius: '3px',
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }}>
                        {p.status}
                      </span>
                      {willUse && (
                        <span style={{ marginLeft: '5px', color: '#1976d2' }}>
                          ← Will use this{p.status !== 'ACTIVE' ? ' (fallback)' : ''}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <input
          type="file"
          onChange={handleFileChange}
          accept=".txt"
          style={{ marginBottom: '10px' }}
        />
        {file && (
          <p style={{ color: '#4caf50', fontSize: '14px' }}>
            ✓ Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
          </p>
        )}
      </div>
      
      <button onClick={handleUpload} disabled={loading || !file}>
        {loading ? 'Processing...' : 'Upload & Process'}
      </button>
      
      {error && <p className="error" style={{ color: '#f44336', marginTop: '10px' }}>{error}</p>}
      
      {claimCreated && (
        <div style={{ 
          marginTop: '15px', 
          padding: '15px', 
          backgroundColor: '#e8f5e9',
          borderRadius: '5px',
          border: '2px solid #4caf50'
        }}>
          <h4 style={{ color: '#2e7d32', marginTop: 0 }}>🎉 Claim Created Successfully!</h4>
          <p style={{ margin: '5px 0' }}>
            <strong>System Claim ID:</strong> {claimCreated.claim_id}
          </p>
          {claimCreated.extracted_claim_ref && (
            <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
              <strong>Document Reference:</strong> {claimCreated.extracted_claim_ref}
            </p>
          )}
          <p style={{ margin: '5px 0' }}>
            <strong>Policy ID:</strong> {claimCreated.policy_id}
          </p>
          <p style={{ fontSize: '13px', color: '#666', marginTop: '10px' }}>
            ✓ You can view this claim in your Dashboard → My Claims section
          </p>
        </div>
      )}
      
      {result && (
        <div className="results" style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#e3f2fd',
          borderRadius: '5px',
          border: '1px solid #64b5f6'
        }}>
          <h3 style={{ color: '#1976d2', marginTop: 0 }}>✓ Extracted Data</h3>
          {result.warning && (
            <div style={{ 
              padding: '10px',
              backgroundColor: '#fff3e0',
              border: '1px solid #ff9800',
              borderRadius: '4px',
              marginBottom: '15px',
              color: '#e65100'
            }}>
              ⚠️ {result.warning}
            </div>
          )}
          <div style={{ fontSize: '16px' }}>
            <p><strong>Claim ID:</strong> {result.claim_id || 'Not found'}</p>
            {result.policy_id && (
              <p><strong>Policy ID (from doc):</strong> {result.policy_id}</p>
            )}
            <p><strong>Amount:</strong> {result.amount ? `₹${result.amount.toLocaleString('en-IN')}` : 'Not found'}</p>
            <p><strong>Confidence:</strong> {(result.confidence * 100).toFixed(1)}%</p>
          </div>
          {!autoCreateClaim && result.claim_id && result.amount && (
            <p style={{ 
              fontSize: '13px', 
              color: '#666', 
              marginTop: '15px',
              padding: '10px',
              backgroundColor: '#fff3e0',
              borderRadius: '4px'
            }}>
              💡 Tip: Enable "Auto-create claim" to automatically file claims from extracted data
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default DocumentProcessor;
