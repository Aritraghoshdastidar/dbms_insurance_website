import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function RegistrationPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('http://localhost:3001/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Registration failed');

      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '50px', maxWidth: '450px', width: '100%', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '15px' }}></div>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937', marginBottom: '10px' }}>Join Us Today</h2>
          <p style={{ color: '#6b7280', fontSize: '1.05rem' }}>Create your account in seconds</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div style={{ background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', border: '1px solid #fca5a5', color: '#991b1b', padding: '14px 18px', borderRadius: '10px', marginBottom: '20px', fontWeight: '600', fontSize: '0.95rem' }}>{error}</div>}
          {success && <div style={{ background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', border: '1px solid #6ee7b7', color: '#065f46', padding: '14px 18px', borderRadius: '10px', marginBottom: '20px', fontWeight: '600', fontSize: '0.95rem' }}>{success}</div>}

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: '#374151', fontWeight: '600', marginBottom: '10px', fontSize: '0.95rem' }}>Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="John Doe" style={{ width: '100%', padding: '14px 18px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '1rem', background: '#f9fafb' }} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: '#374151', fontWeight: '600', marginBottom: '10px', fontSize: '0.95rem' }}>Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your.email@example.com" style={{ width: '100%', padding: '14px 18px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '1rem', background: '#f9fafb' }} />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', color: '#374151', fontWeight: '600', marginBottom: '10px', fontSize: '0.95rem' }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="" style={{ width: '100%', padding: '14px 18px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '1rem', background: '#f9fafb' }} />
          </div>

          <button type="submit" style={{ width: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '16px', fontSize: '1.1rem', fontWeight: '700', border: 'none', borderRadius: '12px', cursor: 'pointer', marginBottom: '20px', boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)' }}>
            Create Account
          </button>
        </form>

        <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.95rem', marginTop: '20px' }}>
          Already have an account? <Link to="/login" style={{ color: '#667eea', textDecoration: 'none', fontWeight: '700' }}>Sign In</Link>
        </div>

        <div style={{ textAlign: 'center', marginTop: '25px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
          <Link to="/" style={{ color: '#667eea', textDecoration: 'none', fontWeight: '600', fontSize: '0.9rem' }}> Back to Home</Link>
        </div>
      </div>
    </div>
  );
}

export default RegistrationPage;
