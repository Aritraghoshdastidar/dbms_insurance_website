import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../BuyPolicy.css'; // Import dedicated CSS

function BuyPolicy() {
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [purchasing, setPurchasing] = useState(null); // product_id in progress
  const [filter, setFilter] = useState('ALL'); // Filter by policy type
  const navigate = useNavigate();

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/policy-catalog', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        // Token likely expired or missing — route to login
        navigate('/login', { replace: true });
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(`${data.error || 'Could not load catalog.'} (HTTP ${res.status})`);
      }
      const items = await res.json();
      setCatalog(items);
    } catch (e) {
      console.error('Catalog error:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const handlePurchase = async (product) => {
    if (!window.confirm(`Purchase ${product.name} for ₹${Number(product.premium_amount).toLocaleString('en-IN')}?`)) return;
    try {
      setPurchasing(product.product_id);
      setError(null);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/policies/purchase', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          product_id: product.product_id,
          premium_amount: product.premium_amount,
          coverage_details: product.coverage_details,
          policy_type: product.policy_type
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Purchase failed.');
      // Success: go back to dashboard to see it under My Policies
      navigate('/dashboard', { replace: true });
    } catch (e) {
      console.error('Purchase error:', e);
      setError(e.message);
    } finally {
      setPurchasing(null);
    }
  };

  const filteredCatalog = filter === 'ALL' 
    ? catalog 
    : catalog.filter(item => item.policy_type === filter);

  const policyTypes = ['ALL', ...new Set(catalog.map(item => item.policy_type))];

  return (
    <div className="buy-policy-container">
      <div className="buy-policy-header">
        <h2>Insurance Plans</h2>
        <p className="subtitle">Choose the right protection for you and your family</p>
      </div>

      {loading ? (
        <div className="loading-state">Loading plans…</div>
      ) : error ? (
        <div className="error-state">
          <div className="error">{error}</div>
          <button className="retry-button" onClick={fetchCatalog}>Retry</button>
        </div>
      ) : (
        <>
          <div className="filter-bar">
            {policyTypes.map(type => (
              <button
                key={type}
                className={`filter-button ${filter === type ? 'active' : ''}`}
                onClick={() => setFilter(type)}
              >
                {type === 'ALL' ? 'All Plans' : type.charAt(0) + type.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <div className="policy-grid">
            {filteredCatalog.map(item => (
              <div key={item.product_id} className={`policy-card ${item.popular ? 'popular' : ''}`}>
                {item.popular && <div className="badge-popular">Most Popular</div>}
                
                <div className="policy-header">
                  <div className={`policy-icon icon-${item.policy_type.toLowerCase()}`}>
                    {item.policy_type === 'HEALTH' && '🏥'}
                    {item.policy_type === 'LIFE' && '🛡️'}
                    {item.policy_type === 'AUTO' && '🚗'}
                    {item.policy_type === 'HOME' && '🏠'}
                    {item.policy_type === 'TRAVEL' && '✈️'}
                    {item.policy_type === 'ACCIDENT' && '⚕️'}
                  </div>
                  <div className="policy-type-badge">{item.policy_type}</div>
                </div>

                <h3 className="policy-name">{item.name}</h3>
                
                <div className="policy-coverage">
                  <span className="coverage-label">Coverage:</span>
                  <span className="coverage-amount">
                    ₹{Number(item.coverage_amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <p className="policy-description">{item.coverage_details}</p>

                {item.features && item.features.length > 0 && (
                  <ul className="policy-features">
                    {item.features.slice(0, 4).map((feature, idx) => (
                      <li key={idx}>✓ {feature}</li>
                    ))}
                  </ul>
                )}

                <div className="policy-footer">
                  <div className="policy-price">
                    <span className="price-amount">₹{Number(item.premium_amount).toLocaleString('en-IN')}</span>
                    <span className="price-term">/ {item.term_months} {item.term_months === 1 ? 'month' : 'months'}</span>
                  </div>
                  <button
                    className={`purchase-button ${item.popular ? 'primary' : ''}`}
                    disabled={purchasing === item.product_id}
                    onClick={() => handlePurchase(item)}
                  >
                    {purchasing === item.product_id ? 'Processing…' : 'Get Covered'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredCatalog.length === 0 && (
            <div className="empty-state">
              <p>No policies found for this category.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default BuyPolicy;
