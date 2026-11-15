import React, { useState } from 'react';
import { registerUser } from '../services/api';
import { ShieldCheck, Lock, User, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function RegisterPage({ onRegistered, onSwitchToLogin }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Password rules validation
  const rules = [
    { label: 'Minimum 10 characters', met: password.length >= 10 },
    { label: 'At least one uppercase letter (A-Z)', met: /[A-Z]/.test(password) },
    { label: 'At least one lowercase letter (a-z)', met: /[a-z]/.test(password) },
    { label: 'At least one numeric digit (0-9)', met: /\d/.test(password) },
    { label: 'At least one special symbol (!@#$...)', met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
  ];
  const allRulesMet = rules.every(r => r.met);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!allRulesMet) {
      setError('Password does not meet enterprise cybersecurity requirements.');
      return;
    }

    setLoading(true);
    try {
      const user = await registerUser(username, email, password);
      setSuccess(`Account '${user.username}' created with Argon2id encryption! Redirecting to login...`);
      setTimeout(() => {
        onRegistered();
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Registration failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '480px', margin: '2rem auto' }} className="card">
      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <div style={{
          background: 'rgba(6, 182, 212, 0.1)',
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 0.75rem',
          color: 'var(--accent-cyan)'
        }}>
          <ShieldCheck size={26} />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Create Secure Account</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Protected by Argon2id memory-hard password hashing
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

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
            Username
          </label>
          <div style={{ position: 'relative' }}>
            <User size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. sec_analyst"
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
            Email Address
          </label>
          <div style={{ position: 'relative' }}>
            <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="analyst@enterprise.com"
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

          {/* Password strength checklist */}
          <div style={{ marginTop: '0.75rem', background: 'rgba(30, 41, 59, 0.3)', padding: '0.6rem 0.8rem', borderRadius: '6px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '0.4rem' }}>
              Cybersecurity Password Policy:
            </div>
            {rules.map((r, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.725rem', color: r.met ? '#34d399' : 'var(--text-dim)', marginBottom: '0.2rem' }}>
                <span style={{ fontSize: '0.8rem' }}>{r.met ? '✓' : '○'}</span>
                <span>{r.label}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !allRulesMet}
          style={{
            background: allRulesMet ? 'linear-gradient(135deg, #06b6d4, #3b82f6)' : 'rgba(51, 65, 85, 0.4)',
            border: 'none',
            borderRadius: '8px',
            color: '#ffffff',
            padding: '0.75rem',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: (loading || !allRulesMet) ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            marginTop: '0.5rem',
            boxShadow: allRulesMet ? '0 4px 14px rgba(6, 182, 212, 0.3)' : 'none'
          }}
        >
          {loading ? 'Securing with Argon2id...' : 'Create Account'}
        </button>

        <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
          Already registered?{' '}
          <span 
            onClick={onSwitchToLogin} 
            style={{ color: 'var(--accent-cyan)', cursor: 'pointer', fontWeight: 600 }}
          >
            Sign in here
          </span>
        </div>
      </form>
    </div>
  );
}
