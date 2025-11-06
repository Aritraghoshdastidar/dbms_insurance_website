import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const loginUrl = isAdminLogin
      ? 'http://localhost:3001/api/admin/login'
      : 'http://localhost:3001/api/login';

    try {
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Login failed');

      localStorage.setItem('token', data.token);
      onLoginSuccess(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Floating animation for background elements
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
      @keyframes float {
        0%, 100% { transform: translate(0, 0) rotate(0deg); }
        33% { transform: translate(30px, -30px) rotate(120deg); }
        66% { transform: translate(-20px, 20px) rotate(240deg); }
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
      }
      @keyframes slideInLeft {
        from { opacity: 0; transform: translateX(-50px); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes slideInRight {
        from { opacity: 0; transform: translateX(50px); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes glow {
        0%, 100% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.5), 0 0 40px rgba(118, 75, 162, 0.3); }
        50% { box-shadow: 0 0 30px rgba(102, 126, 234, 0.8), 0 0 60px rgba(118, 75, 162, 0.5); }
      }
      .login-container { animation: fadeIn 0.8s ease-out; }
      .login-title { animation: slideInLeft 0.6s ease-out 0.2s both; }
      .login-form { animation: slideInRight 0.6s ease-out 0.3s both; }
      .float-shape { animation: float 20s ease-in-out infinite; }
      .glow-effect { animation: glow 3s ease-in-out infinite; }
      .glass-input {
        background: rgba(15, 23, 42, 0.6);
        border: 2px solid rgba(139, 92, 246, 0.3);
        backdrop-filter: blur(10px);
        transition: all 0.3s ease;
        color: #ffffff;
      }
      .glass-input:focus {
        background: rgba(15, 23, 42, 0.8);
        border-color: rgba(167, 139, 250, 0.6);
        box-shadow: 0 0 20px rgba(167, 139, 250, 0.4);
        outline: none;
      }
      .glass-input::placeholder {
        color: rgba(203, 213, 225, 0.6);
      }
      .role-btn {
        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      .role-btn:hover {
        transform: translateY(-3px) scale(1.05);
      }
      .role-btn:active {
        transform: translateY(0) scale(0.98);
      }
      .submit-btn {
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }
      .submit-btn::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: translate(-50%, -50%);
        transition: width 0.6s, height 0.6s;
      }
      .submit-btn:hover::before {
        width: 300px;
        height: 300px;
      }
      .submit-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      }
    `;
    document.head.appendChild(styleSheet);
    return () => document.head.removeChild(styleSheet);
  }, []);

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #1e3a8a 0%, #3b0764 50%, #7c2d12 100%)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '40px 20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated floating shapes */}
      <div className="float-shape" style={{ 
        position: 'absolute', 
        top: '15%', 
        left: '8%', 
        width: '350px', 
        height: '350px', 
        background: 'linear-gradient(45deg, rgba(139, 92, 246, 0.3), rgba(236, 72, 153, 0.3))', 
        borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
        filter: 'blur(40px)',
        opacity: 0.6
      }}></div>
      <div className="float-shape" style={{ 
        position: 'absolute', 
        bottom: '10%', 
        right: '10%', 
        width: '300px', 
        height: '300px', 
        background: 'linear-gradient(225deg, rgba(59, 130, 246, 0.4), rgba(147, 51, 234, 0.3))', 
        borderRadius: '70% 30% 30% 70% / 70% 70% 30% 30%',
        filter: 'blur(40px)',
        opacity: 0.5,
        animationDelay: '-10s'
      }}></div>
      <div className="float-shape" style={{ 
        position: 'absolute', 
        top: '40%', 
        right: '15%', 
        width: '250px', 
        height: '250px', 
        background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.3), rgba(239, 68, 68, 0.2))', 
        borderRadius: '50%',
        filter: 'blur(50px)',
        opacity: 0.4,
        animationDelay: '-5s'
      }}></div>

      <div className="login-container" style={{ 
        maxWidth: '1100px', 
        width: '100%',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Left Side - Branding */}
        <div className="login-title" style={{
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px 0 0 24px',
          padding: '60px 50px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          borderRight: '2px solid rgba(255, 255, 255, 0.15)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'inset 0 0 60px rgba(139, 92, 246, 0.2)'
        }}>
          {/* Decorative gradient overlay */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}></div>

          <div className="glow-effect" style={{
            width: '120px',
            height: '120px',
            borderRadius: '30px',
            background: 'linear-gradient(135deg, #a78bfa 0%, #ec4899 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '30px',
            transform: 'rotate(45deg)',
            position: 'relative',
            zIndex: 1,
            boxShadow: '0 8px 32px rgba(167, 139, 250, 0.5)'
          }}>
            <span style={{ 
              fontSize: '3.5rem', 
              transform: 'rotate(-45deg)',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
            }}>
              {isAdminLogin ? '🔐' : '�️'}
            </span>
          </div>

          <h1 style={{
            fontSize: '2.8rem',
            fontWeight: '900',
            color: '#ffffff',
            marginBottom: '15px',
            textAlign: 'center',
            lineHeight: '1.2',
            textShadow: '0 2px 20px rgba(0,0,0,0.8), 0 4px 40px rgba(139, 92, 246, 0.5)',
            position: 'relative',
            zIndex: 1
          }}>
            Insurance<br/>Workflow System
          </h1>

          <p style={{
            color: '#e0e7ff',
            fontSize: '1.15rem',
            textAlign: 'center',
            lineHeight: '1.6',
            marginBottom: '40px',
            position: 'relative',
            zIndex: 1,
            fontWeight: '500',
            textShadow: '0 2px 10px rgba(0,0,0,0.5)'
          }}>
            {isAdminLogin 
              ? 'Secure administrative access to manage the entire platform'
              : 'Manage your insurance policies and claims with ease'
            }
          </p>

          <div style={{
            display: 'flex',
            gap: '30px',
            marginTop: '20px',
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '2.2rem', 
                fontWeight: '900', 
                color: '#fbbf24',
                textShadow: '0 2px 15px rgba(0,0,0,0.6), 0 0 30px rgba(251, 191, 36, 0.4)'
              }}>10K+</div>
              <div style={{ 
                fontSize: '0.9rem', 
                color: '#d1d5db',
                marginTop: '5px',
                fontWeight: '600',
                textShadow: '0 1px 3px rgba(0,0,0,0.5)'
              }}>Users</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '2.2rem', 
                fontWeight: '900', 
                color: '#10b981',
                textShadow: '0 2px 15px rgba(0,0,0,0.6), 0 0 30px rgba(16, 185, 129, 0.4)'
              }}>99.9%</div>
              <div style={{ 
                fontSize: '0.9rem', 
                color: '#d1d5db',
                marginTop: '5px',
                fontWeight: '600',
                textShadow: '0 1px 3px rgba(0,0,0,0.5)'
              }}>Uptime</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '2.2rem', 
                fontWeight: '900', 
                color: '#60a5fa',
                textShadow: '0 2px 15px rgba(0,0,0,0.6), 0 0 30px rgba(96, 165, 250, 0.4)'
              }}>24/7</div>
              <div style={{ 
                fontSize: '0.9rem', 
                color: '#d1d5db',
                marginTop: '5px',
                fontWeight: '600',
                textShadow: '0 1px 3px rgba(0,0,0,0.5)'
              }}>Support</div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="login-form" style={{
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(20px)',
          borderRadius: '0 24px 24px 0',
          padding: '60px 50px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          boxShadow: 'inset 0 0 60px rgba(139, 92, 246, 0.15)'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '35px',
            paddingBottom: '25px',
            borderBottom: '2px solid rgba(139, 92, 246, 0.3)'
          }}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: '800',
              color: '#ffffff !important',
              marginBottom: '10px',
              textShadow: '0 2px 10px rgba(0,0,0,0.5)',
              WebkitTextFillColor: '#ffffff',
              opacity: 1
            }}>
              {isAdminLogin ? 'Admin Login' : 'Welcome Back'}
            </h2>
            <p style={{
              color: '#e0e7ff',
              fontSize: '1rem',
              marginBottom: '0',
              fontWeight: '500'
            }}>
              {isAdminLogin ? 'Enter your admin credentials' : 'Please login to your account'}
            </p>
          </div>

          {/* Role Toggle MOVED UP */}
          <div style={{ 
            marginBottom: '30px', 
            display: 'flex', 
            gap: '12px',
            background: 'rgba(0, 0, 0, 0.4)',
            padding: '6px',
            borderRadius: '14px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <button
              type="button"
              onClick={() => setIsAdminLogin(false)}
              className="role-btn"
              style={{
                flex: 1,
                background: !isAdminLogin ? 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)' : 'transparent',
                color: '#ffffff',
                border: 'none',
                padding: '14px 24px',
                borderRadius: '10px',
                fontSize: '1rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: !isAdminLogin ? '0 4px 15px rgba(139, 92, 246, 0.5)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '1.3rem' }}>👤</span>
              Customer
            </button>
            <button
              type="button"
              onClick={() => setIsAdminLogin(true)}
              className="role-btn"
              style={{
                flex: 1,
                background: isAdminLogin ? 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)' : 'transparent',
                color: '#ffffff',
                border: 'none',
                padding: '14px 24px',
                borderRadius: '10px',
                fontSize: '1rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: isAdminLogin ? '0 4px 15px rgba(139, 92, 246, 0.5)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '1.3rem' }}>🔐</span>
              Admin
            </button>
          </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.2)', 
              border: '1px solid rgba(239, 68, 68, 0.5)', 
              color: 'white', 
              padding: '14px 18px', 
              borderRadius: '12px', 
              marginBottom: '20px', 
              fontWeight: '600', 
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backdropFilter: 'blur(10px)'
            }}>
              <span style={{ fontSize: '1.2rem' }}>⚠️</span>
              {error}
            </div>
          )}

          {/* Email Input */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              color: '#f1f5f9', 
              fontWeight: '600', 
              marginBottom: '10px', 
              fontSize: '0.9rem',
              textShadow: '0 1px 3px rgba(0,0,0,0.3)'
            }}>
              Email Address
            </label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              placeholder="your.email@example.com" 
              style={{ 
                width: '100%', 
                padding: '15px 18px', 
                borderRadius: '12px', 
                fontSize: '1rem', 
                color: '#ffffff',
                fontWeight: '500',
                background: 'rgba(15, 23, 42, 0.6)',
                  border: '2px solid rgba(139, 92, 246, 0.3)',
                  boxSizing: 'border-box',
                  outline: 'none'
              }} 
                onFocus={(e) => {
                  e.target.style.background = 'rgba(15, 23, 42, 0.8)';
                  e.target.style.borderColor = 'rgba(167, 139, 250, 0.6)';
                }}
                onBlur={(e) => {
                  e.target.style.background = 'rgba(15, 23, 42, 0.6)';
                  e.target.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                }}
            />
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ 
              display: 'block', 
              color: '#f1f5f9', 
              fontWeight: '600', 
              marginBottom: '10px', 
              fontSize: '0.9rem',
              textShadow: '0 1px 3px rgba(0,0,0,0.3)'
            }}>
              Password
            </label>
            <input 
              type="password"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              placeholder="Enter your password" 
              style={{ 
                width: '100%', 
                padding: '15px 18px', 
                borderRadius: '12px', 
                fontSize: '1rem', 
                color: '#ffffff',
                fontWeight: '500',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '2px solid rgba(139, 92, 246, 0.3)',
                boxSizing: 'border-box',
                outline: 'none'
              }} 
              onFocus={(e) => {
                e.target.style.background = 'rgba(15, 23, 42, 0.8)';
                e.target.style.borderColor = 'rgba(167, 139, 250, 0.6)';
              }}
              onBlur={(e) => {
                e.target.style.background = 'rgba(15, 23, 42, 0.6)';
                e.target.style.borderColor = 'rgba(139, 92, 246, 0.3)';
              }}
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={isLoading}
            className="submit-btn"
            style={{ 
              width: '100%', 
              background: isLoading 
                ? 'rgba(107, 114, 128, 0.5)' 
                : 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)', 
              color: 'white', 
              padding: '16px', 
              fontSize: '1.1rem', 
              fontWeight: '700', 
              border: 'none', 
              borderRadius: '12px', 
              cursor: isLoading ? 'not-allowed' : 'pointer', 
              marginBottom: '20px', 
              boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              letterSpacing: '0.5px',
              position: 'relative',
              zIndex: 1
            }}>
            {isLoading ? (
              <>
                <span style={{ fontSize: '1.2rem' }}>⏳</span>
                Authenticating...
              </>
            ) : (
              <>
                <span style={{ fontSize: '1.3rem' }}>{isAdminLogin ? '🔐' : '🚀'}</span>
                {isAdminLogin ? 'Access Admin Portal' : 'Sign In to Dashboard'}
              </>
            )}
          </button>

          {/* Footer Links */}
          <div style={{ 
            textAlign: 'center', 
            paddingTop: '20px', 
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <p style={{ 
              color: '#cbd5e1', 
              fontSize: '0.95rem', 
              marginBottom: '15px',
              fontWeight: '500'
            }}>
              Don't have an account?{' '}
              <Link 
                to="/register" 
                style={{ 
                  color: '#fbbf24', 
                  textDecoration: 'none', 
                  fontWeight: '700',
                  textShadow: '0 1px 3px rgba(0,0,0,0.3)'
                }}
              >
                Register Now
              </Link>
            </p>
            <Link 
              to="/" 
              style={{ 
                color: '#94a3b8', 
                textDecoration: 'none', 
                fontWeight: '600', 
                fontSize: '0.9rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>←</span> Back to Home
            </Link>
          </div>

          {/* Trust Badge */}
          <div style={{ 
            marginTop: '25px', 
            textAlign: 'center',
            padding: '12px',
            background: 'rgba(34, 197, 94, 0.15)',
            borderRadius: '10px',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            backdropFilter: 'blur(10px)'
          }}>
            <p style={{ 
              margin: 0, 
              color: '#86efac', 
              fontSize: '0.85rem', 
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              textShadow: '0 1px 3px rgba(0,0,0,0.3)'
            }}>
              <span style={{ fontSize: '1rem' }}>🔒</span>
              256-bit SSL Encrypted & Secure
            </p>
          </div>
        </form>
        </div>
      </div>

      {/* Responsive Design for Mobile */}
      <style>{`
        @media (max-width: 968px) {
          .login-container {
            grid-template-columns: 1fr !important;
            max-width: 500px !important;
          }
          .login-title {
            border-radius: 24px 24px 0 0 !important;
            border-right: none !important;
            border-bottom: 2px solid rgba(255, 255, 255, 0.15) !important;
            padding: 40px 30px !important;
          }
          .login-form {
            border-radius: 0 0 24px 24px !important;
            padding: 40px 30px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default LoginPage;
