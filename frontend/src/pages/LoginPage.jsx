import React, { useState } from 'react';
import { loginUser, verifyTotpLogin } from '../services/api';
import { Lock, User, AlertCircle, KeyRound, ShieldAlert, Cpu, ArrowRight } from 'lucide-react';

export default function LoginPage({ onLoginSuccess, onSwitchToRegister }) {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [simulatedIp, setSimulatedIp] = useState('');
  const [showSimIp, setShowSimIp] = useState(false);

  // Challenge State (if Adaptive Risk Engine requires TOTP)
  const [challengeData, setChallengeData] = useState(null);
  const [otpCode, setOtpCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInitialLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await loginUser(usernameOrEmail, password, simulatedIp || null);

      if (response.requires_totp) {
        // Adaptive Risk Engine or Account Setting Triggered 2FA
        setChallengeData(response);
      } else {
        // Direct Allow
        onLoginSuccess(response.user);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await verifyTotpLogin(challengeData.challenge_token, otpCode);
      onLoginSuccess(response.user);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Verification failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '520px', margin: '2rem auto' }} className="card">
      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <div style={{
          background: 'rgba(59, 130, 246, 0.12)',
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 0.75rem',
          color: 'var(--accent-blue)'
        }}>
          {challengeData ? <KeyRound size={26} /> : <Lock size={26} />}
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>
          {challengeData ? 'Adaptive 2FA Challenge' : 'Secure System Login'}
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {challengeData 
            ? 'Risk assessment requires secondary verification' 
            : 'Argon2id credential verification with connection risk inspection'}
        </p>
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

      {/* Case 1: Primary Login Form */}
      {!challengeData && (
        <form onSubmit={handleInitialLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
              Username or Email
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
              <input
                type="text"
                required
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder="username or email"
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '0.65rem 0.75rem 0.65rem 2.4rem',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '0.65rem 0.75rem 0.65rem 2.4rem',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Network Simulation Toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowSimIp(!showSimIp)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-cyan)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0',
                marginBottom: showSimIp ? '0.5rem' : '0'
              }}
            >
              <span>{showSimIp ? '▼ Hide Network Simulation IP' : '▶ Simulate Ingress IP (Test Network Scenarios)'}</span>
            </button>

            {showSimIp && (
              <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.35rem' }}>
                  Simulated Ingress Source IP:
                </label>
                <input
                  type="text"
                  value={simulatedIp}
                  onChange={(e) => setSimulatedIp(e.target.value)}
                  placeholder="e.g. 198.51.100.42 (New Subnet) or 185.220.101.5"
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '0.45rem 0.65rem',
                    color: 'var(--text-main)',
                    fontSize: '0.8rem',
                    fontFamily: 'var(--font-mono)',
                    outline: 'none',
                  }}
                />
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setSimulatedIp('192.168.1.15')}
                    style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem', background: 'rgba(51, 65, 85, 0.4)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Known Subnet (192.168.1.15)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimulatedIp('198.51.100.88')}
                    style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#fbbf24', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    New Subnet (198.51.100.88)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimulatedIp('185.220.101.5')}
                    style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Foreign Host (185.220.101.5)
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              padding: '0.75rem',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(6, 182, 212, 0.3)'
            }}
          >
            <span>{loading ? 'Analyzing Connection...' : 'Authenticate'}</span>
            <ArrowRight size={16} />
          </button>

          <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            Need an account?{' '}
            <span 
              onClick={onSwitchToRegister} 
              style={{ color: 'var(--accent-cyan)', cursor: 'pointer', fontWeight: 600 }}
            >
              Register here
            </span>
          </div>
        </form>
      )}

      {/* Case 2: Adaptive 2FA Challenge Triggered */}
      {challengeData && (
        <div>
          {/* Risk Breakdown Banner */}
          <div style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: '#fbbf24', fontSize: '0.9rem' }}>
                <ShieldAlert size={18} />
                <span>Risk Assessment: {challengeData.risk_level}</span>
              </div>
              <span className="font-mono badge badge-warning">
                Score: {challengeData.risk_score} / 100
              </span>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              {challengeData.message}
            </p>

            {challengeData.assessment?.factors && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-dim)' }}>
                  Contributing Risk Signals:
                </div>
                {challengeData.assessment.factors.map((f, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      fontSize: '0.75rem', 
                      background: 'rgba(15, 23, 42, 0.6)', 
                      padding: '0.4rem 0.6rem', 
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>{f.name}: <span style={{ color: 'var(--text-muted)' }}>{f.explanation}</span></span>
                    <span className="font-mono" style={{ color: '#fbbf24', fontWeight: 600 }}>+{f.contribution}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                Six-Digit Authenticator Code (TOTP)
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                autoFocus
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  color: '#22d3ee',
                  fontSize: '1.5rem',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.4em',
                  textAlign: 'center',
                  outline: 'none',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              style={{
                background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                padding: '0.75rem',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: (loading || otpCode.length !== 6) ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Verifying OTP...' : 'Verify Two-Factor Code'}
            </button>

            <button
              type="button"
              onClick={() => { setChallengeData(null); setOtpCode(''); }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-dim)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              Cancel and Return to Login
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
