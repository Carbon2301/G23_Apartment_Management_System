import React from 'react';

const Logo = ({ size = 40, className = '', showText = false }) => {
  return (
    <div className={`d-flex align-items-center ${className}`}>
      <div 
        className="d-inline-flex align-items-center justify-content-center bg-white bg-opacity-90 rounded-circle shadow-sm" 
        style={{
          width: size + 8, 
          height: size + 8, 
          padding: '2px'
        }}
      >
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 40 40" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background circle */}
          <circle cx="20" cy="20" r="20" fill="url(#gradient1)"/>
          
          {/* Building structure */}
          <rect x="10" y="12" width="20" height="20" rx="2" fill="white" opacity="0.95"/>
          
          {/* Building floors */}
          <line x1="10" y1="16" x2="30" y2="16" stroke="#007bff" strokeWidth="0.5"/>
          <line x1="10" y1="20" x2="30" y2="20" stroke="#007bff" strokeWidth="0.5"/>
          <line x1="10" y1="24" x2="30" y2="24" stroke="#007bff" strokeWidth="0.5"/>
          <line x1="10" y1="28" x2="30" y2="28" stroke="#007bff" strokeWidth="0.5"/>
          
          {/* Windows */}
          <rect x="13" y="13.5" width="2" height="1.5" fill="#007bff" opacity="0.7"/>
          <rect x="16" y="13.5" width="2" height="1.5" fill="#007bff" opacity="0.7"/>
          <rect x="22" y="13.5" width="2" height="1.5" fill="#007bff" opacity="0.7"/>
          <rect x="25" y="13.5" width="2" height="1.5" fill="#007bff" opacity="0.7"/>
          
          <rect x="13" y="17.5" width="2" height="1.5" fill="#007bff" opacity="0.7"/>
          <rect x="16" y="17.5" width="2" height="1.5" fill="#007bff" opacity="0.7"/>
          <rect x="22" y="17.5" width="2" height="1.5" fill="#007bff" opacity="0.7"/>
          <rect x="25" y="17.5" width="2" height="1.5" fill="#007bff" opacity="0.7"/>
          
          <rect x="13" y="21.5" width="2" height="1.5" fill="#007bff" opacity="0.7"/>
          <rect x="16" y="21.5" width="2" height="1.5" fill="#007bff" opacity="0.7"/>
          <rect x="22" y="21.5" width="2" height="1.5" fill="#007bff" opacity="0.7"/>
          <rect x="25" y="21.5" width="2" height="1.5" fill="#007bff" opacity="0.7"/>
          
          <rect x="13" y="25.5" width="2" height="1.5" fill="#007bff" opacity="0.7"/>
          <rect x="16" y="25.5" width="2" height="1.5" fill="#007bff" opacity="0.7"/>
          <rect x="22" y="25.5" width="2" height="1.5" fill="#007bff" opacity="0.7"/>
          <rect x="25" y="25.5" width="2" height="1.5" fill="#007bff" opacity="0.7"/>
          
          {/* Main entrance */}
          <rect x="18.5" y="28" width="3" height="4" fill="#007bff"/>
          
          {/* Moon symbol (BlueMoon) */}
          <circle cx="20" cy="8" r="3" fill="#ffd700" opacity="0.9"/>
          <circle cx="21.5" cy="8" r="2.5" fill="#007bff" opacity="0.3"/>
          
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:"#007bff", stopOpacity:1}} />
              <stop offset="100%" style={{stopColor:"#0056b3", stopOpacity:1}} />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      {showText && (
        <div className="d-flex flex-column ms-2">
          <span className="fw-bold text-white" style={{letterSpacing: 1, fontSize: '1.3rem', lineHeight: '1.2'}}>
            BlueMoon
          </span>
          <span className="text-white-50" style={{fontSize: '0.75rem', fontWeight: 'normal'}}>
            Apartment System
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo; 