import React, { useState, useEffect } from 'react';
import { setupTotp, confirmTotp, disableTotp } from '../services/api';
import { Lock, ShieldCheck, QrCode, AlertCircle, CheckCircle2, ShieldOff, Key } from 'lucide-react';

export default function TotpSetupPage({ currentUser, onUserUpdated }) {
  const [setupData, setSetupData] = useState(null);
  const [confirmCode, setConfirmCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchSetup = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await setupTotp();
      setSetupData(data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to initialize TOTP');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser?.totp_enabled) {
      fetchSetup();
    }
  }, [currentUser]);

  const handleConfirm = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await confirmTotp(setupData.secret, confirmCode);
      setSuccess('Two-Factor Authentication is now actively protecting your account!');
      setConfirmCode('');
      onUserUpdated();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Confirmation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await disableTotp(disablePassword);
      setSuccess('Two-factor authentication disabled.');
      setDisablePassword('');
      onUserUpdated();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to disable TOTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto' }} className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
        <div style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '0.6rem', borderRadius: '10px', color: 'var(--accent-cyan)' }}>
          <Lock size={22} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Two-Factor Authentication (TOTP)</h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            Status: {currentUser?.totp_enabled ? (
              <span className="badge badge-success" style={{ marginLeft: '0.3rem' }}>ACTIVE</span>
            ) : (
              <span className="badge badge-warning" style={{ marginLeft: '0.3rem' }}>NOT CONFIGURED</span>
            )}
          </p>
        </div>
      </div>

      {error && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.12)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          borderRadius: '8px',
          padding: '0.75rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#fb7185',
          fontSize: '0.85rem'
        }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '8px',
          padding: '0.75rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#34d399',
          fontSize: '0.85rem'
        }}>
          <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
          <span>{success}</span>
        </div>
      )}

      {/* Case 1: TOTP is already enabled -> Option to disable */}
      {currentUser?.totp_enabled ? (
        <div>
          <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#34d399', marginBottom: '0.4rem' }}>
              <ShieldCheck size={20} />
              <span>Enhanced Security Active</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Your account requires a 6-digit time-based code from your authenticator app on every login attempt. Secret keys are encrypted at rest with Fernet cryptographic keys.
            </p>
          </div>

          <form onSubmit={handleDisable} style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fb7185', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldOff size={16} />
              <span>Disable Two-Factor Authentication</span>
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.75rem' }}>
              Enter your current account password to confirm disabling 2FA.
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="password"
                required
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                placeholder="Account password"
                style={{
                  flex: 1,
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '0.55rem 0.75rem',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={loading || !disablePassword}
                style={{
                  background: 'rgba(244, 63, 94, 0.15)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: '#fb7185',
                  padding: '0.55rem 1rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: (loading || !disablePassword) ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Disabling...' : 'Disable 2FA'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Case 2: TOTP is not enabled -> Setup & Confirm Flow */
        <div>
          {setupData && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{
                  background: '#ffffff',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  display: 'inline-block',
                  marginBottom: '1rem',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
                }}>
                  <img 
                    src={setupData.qr_code_base64} 
                    alt="TOTP QR Code" 
                    style={{ width: '180px', height: '180px', display: 'block' }} 
                  />
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '400px' }}>
                  Scan this QR code using Google Authenticator, Microsoft Authenticator, or 1Password.
                </p>

                <div style={{ marginTop: '0.75rem', background: 'rgba(30, 41, 59, 0.5)', padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginRight: '0.5rem' }}>Manual Key:</span>
                  <code style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>{setupData.secret}</code>
                </div>
              </div>

              <form onSubmit={handleConfirm} style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                  Enter the 6-digit code shown in your app to activate:
                </label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={confirmCode}
                    onChange={(e) => setConfirmCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    style={{
                      width: '160px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '0.65rem',
                      color: 'var(--accent-cyan)',
                      fontSize: '1.2rem',
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: '0.25em',
                      textAlign: 'center',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={loading || confirmCode.length !== 6}
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      cursor: (loading || confirmCode.length !== 6) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {loading ? 'Activating...' : 'Activate 2FA'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
