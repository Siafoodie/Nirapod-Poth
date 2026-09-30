import React, { useState, useEffect } from 'react';


const EmergencySOS = () => {
  const [trustedNumber, setTrustedNumber] = useState('01700000000');

  useEffect(() => {
    const saved = localStorage.getItem('trusted_contact');
    if (saved) setTrustedNumber(saved);
  }, []);

  // US-03: One-Tap Offline SMS SOS Function
  const handleSOS = () => {
    let message = "EMERGENCY! I need help immediately!";

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          message = `EMERGENCY! I need help. My location: https://maps.google.com/?q=${latitude},${longitude}`;
          window.location.href = `sms:${trustedNumber}?body=${encodeURIComponent(message)}`;
        },
        () => {
          window.location.href = `sms:${trustedNumber}?body=${encodeURIComponent(message)}`;
        }
      );
    } else {
      window.location.href = `sms:${trustedNumber}?body=${encodeURIComponent(message)}`;
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.card}>
        {/* Header with Custom Logo */}
        <div style={styles.headerGroup}>
          <div style={styles.iconBadge}>
          <img src="/nirapod-logo.png" alt="Nirapod Poth Logo" style={styles.logoImage} /> 
          </div>
          <h2 style={styles.title}>Emergency SOS</h2>
          <p style={styles.subtitle}>Quick response tools for urgent safety situations</p>
        </div>

        {/* US-03: Offline SOS Button */}
        <div style={styles.section}>
          <button onClick={handleSOS} style={styles.sosButton}>
            <span>SEND EMERGENCY SMS</span>
            <small style={styles.sosSubtext}>Works offline without internet/data</small>
          </button>
        </div>

        {/* Divider */}
        <div style={styles.dividerContainer}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>National Helplines</span>
          <div style={styles.dividerLine} />
        </div>

        {/* US-04: One-Tap Helpline Dialing */}
        <div style={styles.helplineGroup}>
          <a href="tel:999" style={styles.helplineButton}>
            <span></span>
            <span>Call National Emergency (999)</span>
          </a>

          <a href="tel:109" style={styles.helplineButton}>
            <span></span>
            <span>Women & Children Helpline (109)</span>
          </a>
        </div>
      </div>
    </div>
  );
};

// Style Object
const styles = {
  pageContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7f4fb',
    padding: '20px',
    boxSizing: 'border-box',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    padding: '36px 28px',
    maxWidth: '400px',
    width: '100%',
    boxShadow: '0 12px 32px rgba(107, 70, 193, 0.08), 0 2px 6px rgba(0, 0, 0, 0.02)',
    border: '1px solid #efe8f8',
    textAlign: 'center',
    boxSizing: 'border-box'
  },
  headerGroup: {
    marginBottom: '28px'
  },
  iconBadge: {
    width: '60px',
    height: '60px',
    borderRadius: '18px',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 14px auto',
    boxShadow: '0 4px 12px rgba(94, 53, 177, 0.15)',
    backgroundColor: '#000000'
  },
  logoImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  title: {
    margin: '0 0 6px 0',
    color: '#2d1a47',
    fontSize: '22px',
    fontWeight: '700',
    letterSpacing: '-0.3px'
  },
  subtitle: {
    margin: 0,
    color: '#7e6c9c',
    fontSize: '13px',
    lineHeight: '1.4'
  },
  section: {
    marginBottom: '20px'
  },
  sosButton: {
    width: '100%',
    backgroundColor: '#5e35b1',
    color: '#ffffff',
    padding: '16px 20px',
    fontSize: '14px',
    fontWeight: '700',
    border: 'none',
    borderRadius: '16px',
    cursor: 'pointer',
    boxShadow: '0 6px 18px rgba(94, 53, 177, 0.22)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    letterSpacing: '0.5px'
  },
  sosSubtext: {
    fontSize: '11px',
    fontWeight: '400',
    opacity: 0.85,
    textTransform: 'none'
  },
  dividerContainer: {
    display: 'flex',
    alignItems: 'center',
    margin: '24px 0',
    gap: '12px'
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#e9e1f3'
  },
  dividerText: {
    fontSize: '11px',
    color: '#9584b2',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  helplineGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  helplineButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '14px 18px',
    backgroundColor: '#f6f2fb',
    color: '#4a2c85',
    borderRadius: '14px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '14px',
    border: '1px solid #e5dcf2'
  }
};

export default EmergencySOS; 