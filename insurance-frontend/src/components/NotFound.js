import React from 'react';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="dashboard-container" style={{ 
      maxWidth: '600px', 
      margin: '80px auto',
      textAlign: 'center',
      padding: '60px 40px'
    }}>
      <div style={{
        fontSize: '8rem',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontWeight: 'bold',
        marginBottom: '20px'
      }}>
        404
      </div>
      
      <h2 style={{ 
        color: '#667eea',
        fontSize: '2rem',
        marginBottom: '15px'
      }}>
        Page Not Found
      </h2>
      
      <p style={{ 
        color: '#6b7280',
        fontSize: '1.1rem',
        marginBottom: '30px',
        lineHeight: '1.6'
      }}>
        Oops! The page you're looking for doesn't exist or has been moved.
      </p>
      
      <div style={{
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        padding: '25px',
        borderRadius: '16px',
        marginBottom: '30px',
        border: '2px solid #bae6fd'
      }}>
        <p style={{ 
          color: '#0891b2',
          margin: 0,
          fontSize: '1rem',
          fontWeight: '600'
        }}>
          💡 Try checking the URL or go back to the homepage
        </p>
      </div>
      
      <Link to="/" style={{ textDecoration: 'none' }}>
        <button style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          padding: '14px 40px',
          fontSize: '1.1rem',
          fontWeight: '600',
          borderRadius: '12px',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
        }}>
          🏠 Go to Homepage
        </button>
      </Link>
    </div>
  );
}

export default NotFound;
