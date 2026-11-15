import React from 'react';
import HealthBadge from './components/HealthBadge';
import { Shield, Network, Lock, Cpu, CheckCircle } from 'lucide-react';

export default function App() {
  const phases = [
    { num: '01', title: 'Architecture & Connectivity', status: 'active', desc: 'FastAPI + React baseline, Git repo, and /api/health probe' },
    { num: '02', title: 'Database & Alembic', status: 'upcoming', desc: 'PostgreSQL schema with users, sessions, devices, and audit tables' },
    { num: '03', title: 'Argon2id Auth', status: 'upcoming', desc: 'Password hashing, registration, login, and secure sessions' },
    { num: '04', title: 'TOTP 2FA', status: 'upcoming', desc: 'QR code enrollment, clock skew tolerance, encrypted secrets' },
    { num: '05', title: 'Network Intelligence', status: 'upcoming', desc: 'Trusted proxy IP analysis, subnet monitoring, traffic logging' },
    { num: '06', title: 'Device Recognition', status: 'upcoming', desc: 'Device fingerprinting, known/unknown detection, revocation' },
    { num: '07', title: 'Explainable Risk Engine', status: 'upcoming', desc: 'Weighted scoring model with contributing factor breakdown' },
    { num: '08', title: 'Adaptive Policy & Redis', status: 'upcoming', desc: 'Dynamic challenge policies, rate limiting, and temporary state' },
    { num: '09', title: 'Attack Simulation Lab', status: 'upcoming', desc: 'Admin test harness for credential stuffing, brute force & IP shifts' },
    { num: '10', title: 'Security Dashboard', status: 'upcoming', desc: 'Full-featured Recharts analytics, event logs, and traffic graphs' },
    { num: '11', title: 'Evaluation & Benchmarks', status: 'upcoming', desc: 'Detection rates, latency benchmarks, comparative analysis' },
    { num: '12', title: 'Docker Compose', status: 'upcoming', desc: 'Full multi-container orchestration with Nginx reverse proxy' },
  ];

  return (
    <div className="container">
      {/* Top Header */}
      <header style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <span className="badge badge-info">Phase 1 Initialized</span>
          <span className="badge badge-success">Cybersecurity Project</span>
        </div>
        <h1 style={{ 
          fontSize: '2.25rem', 
          fontWeight: 800, 
          letterSpacing: '-0.025em',
          background: 'linear-gradient(to right, #ffffff, #94a3b8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '0.75rem'
        }}>
          Network-Aware Adaptive Authentication System
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '700px', margin: '0 auto', fontSize: '1.05rem' }}>
          Explainable risk analysis, Argon2id credentials, TOTP two-factor verification, and dynamic connection anomaly mitigation.
        </p>
      </header>

      {/* Main Grid */}
      <main style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Live Connectivity Test Card */}
        <section>
          <HealthBadge />
        </section>

        {/* System Architecture Highlights */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--accent-cyan)' }}>
              <Lock size={18} />
              <h4 style={{ fontWeight: 600 }}>Argon2id & 2FA</h4>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Memory-hard password hashing combined with encrypted TOTP secrets and clock-skew tolerance.
            </p>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--accent-blue)' }}>
              <Network size={18} />
              <h4 style={{ fontWeight: 600 }}>Network Intelligence</h4>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Real-time subnet tracking, IP anomaly detection, request frequency analysis, and Nginx proxy integrity.
            </p>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--accent-emerald)' }}>
              <Cpu size={18} />
              <h4 style={{ fontWeight: 600 }}>Explainable Risk Engine</h4>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Transparent multi-signal scoring model explaining exactly why a login attempt was classified as risky.
            </p>
          </div>
        </section>

        {/* Development Roadmap */}
        <section className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Implementation Roadmap</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Incremental development pipeline</p>
            </div>
            <span className="badge badge-info">12 Phases</span>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', 
            gap: '0.875rem' 
          }}>
            {phases.map((p) => (
              <div 
                key={p.num} 
                style={{ 
                  background: p.status === 'active' ? 'rgba(6, 182, 212, 0.08)' : 'rgba(30, 41, 59, 0.3)',
                  border: `1px solid ${p.status === 'active' ? 'rgba(6, 182, 212, 0.4)' : 'var(--border-subtle)'}`,
                  borderRadius: '8px',
                  padding: '0.875rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span className="font-mono" style={{ fontSize: '0.75rem', color: p.status === 'active' ? 'var(--accent-cyan)' : 'var(--text-dim)' }}>
                    PHASE {p.num}
                  </span>
                  {p.status === 'active' ? (
                    <span className="badge badge-info" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>Active</span>
                  ) : (
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Planned</span>
                  )}
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{p.title}</div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
        Network-Aware Adaptive Authentication System &bull; Phase 1 Verification Baseline
      </footer>
    </div>
  );
}
