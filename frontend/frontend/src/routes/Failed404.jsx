import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Failed404.css';
import ThemeToggle from '../component/ThemeToggle';

function Failed404() {
  return (
    <div className="error-page">
      <div className="theme-toggle-wrapper">
        <ThemeToggle />
      </div>
      
      <div className="error-container">
        <div className="error-animation">
          <div className="error-number">404</div>
          <div className="error-icon">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M16 16s-1.5-2-4-2-4 2-4 2"/>
              <line x1="9" y1="9" x2="9.01" y2="9"/>
              <line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
          </div>
        </div>
        
        <div className="error-content">
          <h1>Oops! Page Not Found</h1>
          <p>The page you're looking for doesn't exist or has been moved.</p>
          
          <div className="error-actions">
            <Link to="/dashboard" className="btn-primary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9,22 9,12 15,12 15,22"/>
              </svg>
              Go to Dashboard
            </Link>
            
            <button onClick={() => window.history.back()} className="btn-secondary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Go Back
            </button>
          </div>
          
          <div className="help-text">
            <p>Need help? <Link to="/dashboard">Contact support</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Failed404;
