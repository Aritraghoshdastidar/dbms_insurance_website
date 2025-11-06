import React, { useState } from 'react';

function HelpPage() {
  const [activeTab, setActiveTab] = useState('faq');

  const faqs = [
    {
      q: "How do I file a claim?",
      a: "Go to your Dashboard, scroll down to 'File a New Claim', fill in the policy ID, description, and claim amount, then click Submit Claim."
    },
    {
      q: "How long does claim approval take?",
      a: "Most claims are processed within 24-48 hours. High-risk claims may require additional review and can take 3-5 business days."
    },
    {
      q: "What is the policy approval process?",
      a: "Policies go through a four-eyes approval: Initial approval by any admin, then final approval by a Security Officer. After approval, you'll need to make a payment to activate the policy."
    },
    {
      q: "How do I activate my policy?",
      a: "Once your policy is approved, it will show status 'INACTIVE_AWAITING_PAYMENT' on your dashboard. Click the 'Activate Policy (Mock Pay)' button to activate it."
    },
    {
      q: "What are high-risk claims?",
      a: "Claims over $1,000,000 or with a risk score above 8 are flagged as high-risk and require additional scrutiny. You can view these in the Alerts section."
    },
    {
      q: "Can I track my claim status?",
      a: "Yes! All your claims are visible on the Dashboard with real-time status updates (Pending, Approved, or Declined)."
    }
  ];

  const quickLinks = [
    { icon: '📋', title: 'Dashboard', desc: 'View policies and file claims', path: '/dashboard' },
    { icon: '📄', title: 'Documents', desc: 'Upload and process documents', path: '/documents' },
    { icon: '🚨', title: 'Alerts', desc: 'High-risk claim notifications', path: '/alerts' },
    { icon: '📊', title: 'Metrics', desc: 'Workflow performance analytics', path: '/metrics' },
    { icon: '⏰', title: 'Overdue', desc: 'Track overdue tasks', path: '/overdue' },
    { icon: '⚙️', title: 'Workflows', desc: 'Admin workflow management', path: '/admin/workflows' }
  ];

  return (
    <div className="dashboard-container" style={{ maxWidth: '1000px', margin: '40px auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>
        💬 Help & Support
      </h2>

      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '15px', 
        marginBottom: '30px',
        borderBottom: '2px solid #e5e7eb',
        justifyContent: 'center'
      }}>
        <button
          onClick={() => setActiveTab('faq')}
          style={{
            background: activeTab === 'faq' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
            color: activeTab === 'faq' ? 'white' : '#667eea',
            border: 'none',
            padding: '12px 30px',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '1rem',
            transition: 'all 0.3s ease',
            transform: activeTab === 'faq' ? 'translateY(2px)' : 'none'
          }}
        >
          ❓ FAQ
        </button>
        <button
          onClick={() => setActiveTab('quickstart')}
          style={{
            background: activeTab === 'quickstart' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
            color: activeTab === 'quickstart' ? 'white' : '#667eea',
            border: 'none',
            padding: '12px 30px',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '1rem',
            transition: 'all 0.3s ease',
            transform: activeTab === 'quickstart' ? 'translateY(2px)' : 'none'
          }}
        >
          🚀 Quick Start
        </button>
        <button
          onClick={() => setActiveTab('contact')}
          style={{
            background: activeTab === 'contact' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
            color: activeTab === 'contact' ? 'white' : '#667eea',
            border: 'none',
            padding: '12px 30px',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '1rem',
            transition: 'all 0.3s ease',
            transform: activeTab === 'contact' ? 'translateY(2px)' : 'none'
          }}
        >
          📧 Contact
        </button>
      </div>

      {/* FAQ Tab */}
      {activeTab === 'faq' && (
        <div>
          {faqs.map((faq, index) => (
            <div key={index} style={{
              background: 'white',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '15px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#667eea';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
            }}>
              <h4 style={{ color: '#667eea', marginBottom: '12px', fontSize: '1.1rem' }}>
                {faq.q}
              </h4>
              <p style={{ color: '#374151', margin: 0, lineHeight: '1.7', fontSize: '0.95rem' }}>
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Quick Start Tab */}
      {activeTab === 'quickstart' && (
        <div>
          <div style={{
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            border: '2px solid #bae6fd',
            borderRadius: '16px',
            padding: '30px',
            marginBottom: '25px'
          }}>
            <h3 style={{ color: '#0891b2', marginBottom: '20px' }}>🎯 Getting Started</h3>
            <ol style={{ lineHeight: '2.5', fontSize: '1rem', color: '#374151' }}>
              <li><strong>Create an Account:</strong> Register with your email and password</li>
              <li><strong>Login:</strong> Use your credentials to access the dashboard</li>
              <li><strong>View Policies:</strong> See all your insurance policies on the dashboard</li>
              <li><strong>File a Claim:</strong> Submit claims directly from your dashboard</li>
              <li><strong>Track Status:</strong> Monitor claim approval in real-time</li>
              <li><strong>Upload Documents:</strong> Use the Documents page for intelligent processing</li>
            </ol>
          </div>

          <h3 style={{ color: '#667eea', marginBottom: '20px' }}>🔗 Quick Links</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '20px' 
          }}>
            {quickLinks.map((link, index) => (
              <div key={index} style={{
                background: 'white',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'center'
              }}
              onClick={() => window.location.href = link.path}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.2)';
                e.currentTarget.style.borderColor = '#667eea';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>{link.icon}</div>
                <h4 style={{ color: '#667eea', marginBottom: '8px' }}>{link.title}</h4>
                <p style={{ color: '#6b7280', margin: 0, fontSize: '0.9rem' }}>{link.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact Tab */}
      {activeTab === 'contact' && (
        <div>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '40px',
            borderRadius: '16px',
            marginBottom: '25px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
          }}>
            <h3 style={{ color: 'white', borderBottom: 'none', fontSize: '1.8rem', marginBottom: '15px' }}>
              📧 Get in Touch
            </h3>
            <p style={{ fontSize: '1.1rem', marginBottom: '0', opacity: '0.95' }}>
              Our support team is here to help you 24/7
            </p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '20px',
            marginBottom: '30px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              padding: '30px',
              borderRadius: '16px',
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📞</div>
              <h4 style={{ margin: '0 0 10px 0' }}>Phone Support</h4>
              <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: '600' }}>1-800-INSURE</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', opacity: 0.9 }}>Mon-Fri, 9AM-6PM</p>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
              color: 'white',
              padding: '30px',
              borderRadius: '16px',
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(6, 182, 212, 0.3)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>✉️</div>
              <h4 style={{ margin: '0 0 10px 0' }}>Email Us</h4>
              <p style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>support@insurance.com</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', opacity: 0.9 }}>Response in 24 hours</p>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: 'white',
              padding: '30px',
              borderRadius: '16px',
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>💬</div>
              <h4 style={{ margin: '0 0 10px 0' }}>Live Chat</h4>
              <p style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>Chat with us</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', opacity: 0.9 }}>Available 24/7</p>
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            border: '2px solid #fcd34d',
            borderRadius: '16px',
            padding: '25px',
            textAlign: 'center'
          }}>
            <p style={{ color: '#78350f', margin: 0, fontSize: '1rem' }}>
              <strong>Emergency Claims Hotline:</strong> 1-800-URGENT (Available 24/7)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default HelpPage;
