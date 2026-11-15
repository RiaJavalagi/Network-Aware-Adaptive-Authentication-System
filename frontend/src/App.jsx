import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HealthBadge from './components/HealthBadge';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import TotpSetupPage from './pages/TotpSetupPage';
import UserDashboard from './pages/UserDashboard';
import DeviceManagementPage from './pages/DeviceManagementPage';
import NetworkMonitoringPage from './pages/NetworkMonitoringPage';
import RiskAnalysisPage from './pages/RiskAnalysisPage';
import SecurityEventsPage from './pages/SecurityEventsPage';
import AttackSimulationPage from './pages/AttackSimulationPage';
import EvaluationPage from './pages/EvaluationPage';

import { getCurrentUser, logoutUser } from './services/api';
import { Shield, Network, Lock, Cpu, CheckCircle, ArrowRight } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const checkAuth = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
    } catch {
      setCurrentUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
      setCurrentUser(null);
      setActiveTab('overview');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const phases = [
    { num: '01', title: 'Architecture & Connectivity', status: 'completed', desc: 'FastAPI + React baseline, Git repo, and /api/health probe' },
    { num: '02', title: 'Database & Alembic', status: 'completed', desc: 'PostgreSQL schema with 7 models, indexes, cascades, and migrations' },
    { num: '03', title: 'Argon2id Auth', status: 'completed', desc: 'Memory-hard password hashing, registration, and secure sessions' },
    { num: '04', title: 'TOTP 2FA', status: 'completed', desc: 'QR code enrollment, clock skew tolerance, encrypted secrets' },
    { num: '05', title: 'Network Intelligence', status: 'completed', desc: 'Trusted proxy IP analysis, subnet monitoring, traffic logging' },
    { num: '06', title: 'Device Recognition', status: 'completed', desc: 'Device fingerprinting, known/unknown detection, revocation' },
    { num: '07', title: 'Explainable Risk Engine', status: 'completed', desc: 'Weighted scoring model with contributing factor breakdown' },
    { num: '08', title: 'Adaptive Policy & Redis', status: 'completed', desc: 'Dynamic challenge policies, rate limiting, and temporary state' },
    { num: '09', title: 'Attack Simulation Lab', status: 'completed', desc: 'Admin test harness for credential stuffing, brute force & IP shifts' },
    { num: '10', title: 'Security Dashboard', status: 'completed', desc: 'Full-featured Recharts analytics, event logs, and traffic graphs' },
    { num: '11', title: 'Evaluation & Benchmarks', status: 'completed', desc: 'Detection rates, latency benchmarks, comparative analysis' },
    { num: '12', title: 'Docker Compose', status: 'completed', desc: 'Full multi-container orchestration with Nginx reverse proxy' },
  ];

  return (
    <div>
      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <div className="container">
        {/* View Router */}
        {activeTab === 'register' && (
          <RegisterPage
            onRegistered={() => setActiveTab('login')}
            onSwitchToLogin={() => setActiveTab('login')}
          />
        )}

        {activeTab === 'login' && (
          <LoginPage
            onLoginSuccess={(user) => {
              setCurrentUser(user);
              setActiveTab('dashboard');
            }}
            onSwitchToRegister={() => setActiveTab('register')}
          />
        )}

        {activeTab === 'dashboard' && (
          <UserDashboard
            currentUser={currentUser}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'totp' && (
          <TotpSetupPage
            currentUser={currentUser}
            onUserUpdated={checkAuth}
          />
        )}

        {activeTab === 'devices' && <DeviceManagementPage />}

        {activeTab === 'network' && <NetworkMonitoringPage />}

        {activeTab === 'risk' && <RiskAnalysisPage />}

        {activeTab === 'security' && <SecurityEventsPage />}

        {activeTab === 'simulation' && <AttackSimulationPage />}

        {activeTab === 'evaluation' && <EvaluationPage />}

        {activeTab === 'overview' && (
          <main style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Top Header */}
            <header style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <span className="badge badge-success">Production Ready</span>
                <span className="badge badge-info">All 12 Phases Implemented</span>
              </div>
              <h1 style={{ 
                fontSize: '2.5rem', 
                fontWeight: 800, 
                letterSpacing: '-0.025em',
                background: 'linear-gradient(to right, #ffffff, #94a3b8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '0.75rem'
              }}>
                Network-Aware Adaptive Authentication System
              </h1>
              <p style={{ color: 'var(--text-muted)', maxWidth: '750px', margin: '0 auto', fontSize: '1.05rem', lineHeight: 1.6 }}>
                Full-stack cybersecurity platform integrating Argon2id password protection, encrypted TOTP two-factor verification, connection subnet intelligence, device recognition, and explainable risk analysis.
              </p>

              {/* Quick Actions */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setActiveTab('simulation')}
                  style={{
                    background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                    border: 'none',
                    color: '#ffffff',
                    padding: '0.6rem 1.25rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 4px 14px rgba(6, 182, 212, 0.35)'
                  }}
                >
                  <span>Launch Attack Simulation Lab</span>
                  <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => setActiveTab('evaluation')}
                  style={{
                    background: 'rgba(30, 41, 59, 0.6)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    padding: '0.6rem 1.25rem',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  View Benchmark Results
                </button>
              </div>
            </header>

            {/* Live Gateway Health Probe */}
            <section>
              <HealthBadge />
            </section>

            {/* System Architecture Highlights */}
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div className="card" onClick={() => setActiveTab('security')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--accent-cyan)' }}>
                  <Lock size={18} />
                  <h4 style={{ fontWeight: 600 }}>Argon2id & TOTP 2FA</h4>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  OWASP-compliant memory-hard password hashing with Fernet-encrypted TOTP secrets at rest and clock-skew tolerance.
                </p>
              </div>

              <div className="card" onClick={() => setActiveTab('network')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--accent-blue)' }}>
                  <Network size={18} />
                  <h4 style={{ fontWeight: 600 }}>Network Intelligence</h4>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Canonical /24 and /64 CIDR subnet extraction, trusted proxy validation, and sliding-window velocity rate limiting.
                </p>
              </div>

              <div className="card" onClick={() => setActiveTab('risk')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--accent-emerald)' }}>
                  <Cpu size={18} />
                  <h4 style={{ fontWeight: 600 }}>Explainable Risk Engine</h4>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Transparent multi-signal scoring model explaining the exact rationale and contributing factors behind every decision.
                </p>
              </div>
            </section>

            {/* Development Roadmap */}
            <section className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Master Implementation Pipeline</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>All 12 phases delivered, tested, and verified</p>
                </div>
                <span className="badge badge-success">100% Complete</span>
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
                      background: 'rgba(16, 185, 129, 0.06)',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      borderRadius: '8px',
                      padding: '0.875rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span className="font-mono" style={{ fontSize: '0.75rem', color: '#34d399' }}>
                        PHASE {p.num}
                      </span>
                      <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>Done</span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{p.title}</div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>{p.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          </main>
        )}
      </div>

      {/* Footer */}
      <footer style={{ marginTop: '4rem', padding: '2rem 1.5rem', borderTop: '1px solid var(--border-subtle)', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
        Network-Aware Adaptive Authentication System with Explainable Risk Analysis &bull; Final Delivery
      </footer>
    </div>
  );
}
