import React from 'react';

function AboutPage() {
  return (
    <div className="dashboard-container" style={{ maxWidth: '900px', margin: '40px auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>
        🏢 About Insurance Portal
      </h2>
      
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        color: 'white',
        padding: '40px',
        borderRadius: '16px',
        marginBottom: '30px',
        boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
      }}>
        <h3 style={{ color: 'white', borderBottom: 'none', fontSize: '1.8rem', marginBottom: '15px' }}>
          Modern Insurance Management System
        </h3>
        <p style={{ fontSize: '1.1rem', lineHeight: '1.8', marginBottom: '0' }}>
          A comprehensive platform for managing insurance policies, claims, and workflows with advanced automation and intelligent processing.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          padding: '25px',
          borderRadius: '16px',
          color: 'white',
          boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🚀</div>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '1.2rem' }}>Fast Processing</h4>
          <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.9 }}>
            Automated workflows for quick claim approvals
          </p>
        </div>

        <div style={{ 
          background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
          padding: '25px',
          borderRadius: '16px',
          color: 'white',
          boxShadow: '0 4px 15px rgba(6, 182, 212, 0.3)'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🔒</div>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '1.2rem' }}>Secure & Safe</h4>
          <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.9 }}>
            Bank-grade security for your sensitive data
          </p>
        </div>

        <div style={{ 
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          padding: '25px',
          borderRadius: '16px',
          color: 'white',
          boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📊</div>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '1.2rem' }}>Smart Analytics</h4>
          <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.9 }}>
            Real-time insights and comprehensive reports
          </p>
        </div>
      </div>

      <div style={{ 
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        padding: '30px',
        borderRadius: '16px',
        border: '2px solid #bae6fd',
        marginBottom: '30px'
      }}>
        <h3 style={{ color: '#0891b2', borderBottom: 'none', marginBottom: '20px' }}>
          ✨ Key Features
        </h3>
        <ul style={{ lineHeight: '2', fontSize: '1rem', color: '#374151' }}>
          <li><strong>📋 Policy Management:</strong> Create, update, and track insurance policies with ease</li>
          <li><strong>⚡ Claims Processing:</strong> Submit and manage claims with automated approval workflows</li>
          <li><strong>🤖 Workflow Automation:</strong> Custom workflows for different claim types and amounts</li>
          <li><strong>📄 Document Intelligence:</strong> Smart document processing and verification</li>
          <li><strong>🚨 Risk Assessment:</strong> Real-time alerts for high-risk claims</li>
          <li><strong>📈 Performance Metrics:</strong> Comprehensive dashboards and analytics</li>
          <li><strong>👥 Multi-Role Support:</strong> Different access levels for admins, adjusters, and customers</li>
          <li><strong>🔔 SLA Monitoring:</strong> Track and manage overdue tasks efficiently</li>
        </ul>
      </div>

      <div style={{ 
        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
        padding: '25px',
        borderRadius: '16px',
        border: '2px solid #fcd34d',
        textAlign: 'center'
      }}>
        <h3 style={{ color: '#92400e', borderBottom: 'none', marginBottom: '15px' }}>
          📚 Need Help?
        </h3>
        <p style={{ color: '#78350f', fontSize: '1rem', marginBottom: '20px' }}>
          Check out our guides and documentation for detailed instructions
        </p>
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => alert('User Guide - Coming Soon!')} style={{ 
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            padding: '12px 24px',
            fontSize: '0.95rem'
          }}>
            📖 User Guide
          </button>
          <button onClick={() => alert('FAQ - Coming Soon!')} style={{ 
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            padding: '12px 24px',
            fontSize: '0.95rem'
          }}>
            ❓ FAQ
          </button>
        </div>
      </div>

      <div style={{ 
        marginTop: '40px',
        padding: '20px',
        borderTop: '2px solid #e5e7eb',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        <p style={{ margin: 0, fontSize: '0.9rem' }}>
          <strong>Team Logicore</strong> | PESU AIML Section B | P04
        </p>
        <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem' }}>
          Built with React & Node.js | © 2025
        </p>
      </div>
    </div>
  );
}

export default AboutPage;
