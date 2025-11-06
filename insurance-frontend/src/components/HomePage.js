import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function HomePage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store token and redirect to dashboard
      localStorage.setItem('token', data.token);
      window.location.href = '/dashboard'; // Force full page reload to trigger auth check
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background Elements */}
      <div style={{
        position: 'absolute',
        top: '10%',
        right: '10%',
        width: '300px',
        height: '300px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        animation: 'float 6s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        left: '5%',
        width: '400px',
        height: '400px',
        background: 'rgba(255, 255, 255, 0.08)',
        borderRadius: '50%',
        filter: 'blur(80px)',
        animation: 'float 8s ease-in-out infinite reverse'
      }} />

      {/* Navigation Bar */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '25px 60px',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{
          fontSize: '1.8rem',
          fontWeight: '700',
          color: 'white',
          textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '2.2rem' }}>🛡️</span>
          Insurance Portal
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <Link to="/about" style={{
            color: 'white',
            textDecoration: 'none',
            fontSize: '1.05rem',
            fontWeight: '500',
            padding: '10px 20px',
            borderRadius: '8px',
            transition: 'all 0.3s ease',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}>
            About
          </Link>
          <Link to="/help" style={{
            color: 'white',
            textDecoration: 'none',
            fontSize: '1.05rem',
            fontWeight: '500',
            padding: '10px 20px',
            borderRadius: '8px',
            transition: 'all 0.3s ease',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}>
            Help
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '60px 60px',
        position: 'relative',
        zIndex: 5
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '60px',
          alignItems: 'center',
          minHeight: '70vh'
        }}>
          {/* Left Side - Content */}
          <div style={{
            animation: 'fadeInLeft 1s ease-out'
          }}>
            <div style={{
              display: 'inline-block',
              background: 'rgba(255, 255, 255, 0.15)',
              padding: '10px 24px',
              borderRadius: '30px',
              color: 'white',
              fontSize: '0.95rem',
              fontWeight: '600',
              marginBottom: '30px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              🚀 Smart Insurance Solutions
            </div>

            <h1 style={{
              fontSize: '4rem',
              fontWeight: '800',
              color: 'white',
              lineHeight: '1.1',
              marginBottom: '25px',
              textShadow: '2px 2px 8px rgba(0,0,0,0.2)'
            }}>
              Protect What <br/>
              <span style={{
                background: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block'
              }}>
                Matters Most
              </span>
            </h1>

            <p style={{
              fontSize: '1.3rem',
              color: 'rgba(255, 255, 255, 0.9)',
              lineHeight: '1.8',
              marginBottom: '40px',
              fontWeight: '400'
            }}>
              Modern insurance management with AI-powered claims processing, 
              instant approvals, and 24/7 support. Your peace of mind is our priority.
            </p>

            {/* CTA Buttons */}
            <div style={{
              display: 'flex',
              gap: '20px',
              marginBottom: '50px'
            }}>
              <button
                onClick={() => navigate('/register')}
                style={{
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                  color: '#78350f',
                  padding: '18px 40px',
                  fontSize: '1.15rem',
                  fontWeight: '700',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(251, 191, 36, 0.4)',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(251, 191, 36, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(251, 191, 36, 0.4)';
                }}
              >
                Get Started Free
                <span style={{ fontSize: '1.3rem' }}>→</span>
              </button>

              <button
                onClick={() => navigate('/login')}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  padding: '18px 40px',
                  fontSize: '1.15rem',
                  fontWeight: '600',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Sign In
              </button>
            </div>

            {/* Stats */}
            <div style={{
              display: 'flex',
              gap: '40px',
              marginTop: '40px'
            }}>
              <div>
                <div style={{
                  fontSize: '2.5rem',
                  fontWeight: '800',
                  color: 'white',
                  marginBottom: '5px'
                }}>10K+</div>
                <div style={{
                  fontSize: '0.95rem',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontWeight: '500'
                }}>Happy Customers</div>
              </div>
              <div>
                <div style={{
                  fontSize: '2.5rem',
                  fontWeight: '800',
                  color: 'white',
                  marginBottom: '5px'
                }}>98%</div>
                <div style={{
                  fontSize: '0.95rem',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontWeight: '500'
                }}>Claim Approval Rate</div>
              </div>
              <div>
                <div style={{
                  fontSize: '2.5rem',
                  fontWeight: '800',
                  color: 'white',
                  marginBottom: '5px'
                }}>24/7</div>
                <div style={{
                  fontSize: '0.95rem',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontWeight: '500'
                }}>Customer Support</div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Card */}
          <div style={{
            animation: 'fadeInRight 1s ease-out'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '24px',
              padding: '50px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}>
              <h2 style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: '#1f2937',
                marginBottom: '10px',
                textAlign: 'center'
              }}>
                Welcome Back
              </h2>
              <p style={{
                textAlign: 'center',
                color: '#6b7280',
                marginBottom: '35px',
                fontSize: '1.05rem'
              }}>
                Sign in to access your insurance portal
              </p>

              {/* Login Form - Now Functional! */}
              {error && (
                <div style={{
                  background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                  border: '1px solid #fca5a5',
                  color: '#991b1b',
                  padding: '14px 18px',
                  borderRadius: '10px',
                  marginBottom: '20px',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  textAlign: 'center'
                }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    color: '#374151',
                    fontWeight: '600',
                    marginBottom: '10px',
                    fontSize: '0.95rem'
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
                      padding: '14px 18px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '10px',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease',
                      background: '#f9fafb'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#667eea';
                      e.currentTarget.style.background = 'white';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.background = '#f9fafb';
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    color: '#374151',
                    fontWeight: '600',
                    marginBottom: '10px',
                    fontSize: '0.95rem'
                  }}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      padding: '14px 18px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '10px',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease',
                      background: '#f9fafb'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#667eea';
                      e.currentTarget.style.background = 'white';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.background = '#f9fafb';
                    }}
                  />
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '25px'
                }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    color: '#6b7280',
                    fontSize: '0.9rem'
                  }}>
                    <input type="checkbox" style={{ width: 'auto', cursor: 'pointer' }} />
                    <span>Remember me</span>
                  </label>
                  <Link to="/login" style={{
                    color: '#667eea',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}>
                    Admin login?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    background: isLoading ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    padding: '16px',
                    fontSize: '1.1rem',
                    fontWeight: '700',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    marginBottom: '20px',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.5)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                    }
                  }}
                >
                  {isLoading ? 'Signing In...' : 'Sign In to Portal'}
                </button>
              </form>

              <div style={{
                textAlign: 'center',
                color: '#6b7280',
                fontSize: '0.95rem'
              }}>
                Don't have an account?{' '}
                <Link to="/register" style={{
                  color: '#667eea',
                  textDecoration: 'none',
                  fontWeight: '700'
                }}>
                  Register Now
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div style={{
          marginTop: '100px',
          animation: 'fadeInUp 1s ease-out 0.3s both'
        }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            color: 'white',
            textAlign: 'center',
            marginBottom: '60px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
          }}>
            Why Choose Us?
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '30px'
          }}>
            {[
              {
                icon: '⚡',
                title: 'Instant Claims',
                desc: 'AI-powered processing for claims under 24 hours'
              },
              {
                icon: '🔒',
                title: 'Bank-Grade Security',
                desc: '256-bit encryption with multi-factor authentication'
              },
              {
                icon: '📊',
                title: 'Smart Analytics',
                desc: 'Real-time insights into your insurance portfolio'
              },
              {
                icon: '💼',
                title: 'Multiple Policies',
                desc: 'Life, Health, Auto - all in one place'
              },
              {
                icon: '👥',
                title: 'Expert Support',
                desc: 'Dedicated advisors available 24/7'
              },
              {
                icon: '📱',
                title: 'Mobile First',
                desc: 'Manage everything on-the-go with our app'
              }
            ].map((feature, index) => (
              <div key={index} style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                borderRadius: '20px',
                padding: '40px 30px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.transform = 'translateY(-10px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}>
                <div style={{
                  fontSize: '3.5rem',
                  marginBottom: '20px',
                  textAlign: 'center'
                }}>{feature.icon}</div>
                <h3 style={{
                  fontSize: '1.3rem',
                  fontWeight: '700',
                  color: 'white',
                  marginBottom: '12px',
                  textAlign: 'center'
                }}>{feature.title}</h3>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.85)',
                  fontSize: '1rem',
                  lineHeight: '1.6',
                  textAlign: 'center'
                }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Badges */}
        <div style={{
          marginTop: '80px',
          textAlign: 'center',
          paddingBottom: '60px'
        }}>
          <p style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.9rem',
            marginBottom: '20px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '1.5px'
          }}>
            Trusted by industry leaders
          </p>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '40px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            {['ISO Certified', 'GDPR Compliant', 'SOC 2 Type II', 'PCI DSS'].map((badge, i) => (
              <div key={i} style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                padding: '15px 30px',
                borderRadius: '10px',
                color: 'white',
                fontWeight: '600',
                fontSize: '0.95rem',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                ✓ {badge}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-30px); }
          }
          @keyframes fadeInLeft {
            from {
              opacity: 0;
              transform: translateX(-50px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          @keyframes fadeInRight {
            from {
              opacity: 0;
              transform: translateX(50px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
}

export default HomePage;
