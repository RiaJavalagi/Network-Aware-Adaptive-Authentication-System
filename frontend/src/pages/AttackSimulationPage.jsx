import React, { useState } from 'react';
import { runSimulation } from '../services/api';
import { FlaskConical, Play, ShieldAlert, CheckCircle2, Clock, Terminal, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function AttackSimulationPage() {
  const [selectedScenario, setSelectedScenario] = useState('COMBINED_ATTACK');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const scenarios = [
    { id: 'NORMAL_LOGIN', name: '1. Normal Baseline Login', severity: 'LOW', desc: 'Familiar IP host, registered device, and expected request velocity' },
    { id: 'NEW_IP', name: '2. Login from New Host IP', severity: 'LOW', desc: 'New host IP address within an already familiar subnet block' },
    { id: 'NEW_SUBNET', name: '3. Ingress from Unseen Subnet', severity: 'MEDIUM', desc: 'Connection originating from an unfamiliar /24 CIDR network' },
    { id: 'NEW_DEVICE', name: '4. Unrecognized Device Identifier', severity: 'MEDIUM', desc: 'Authentication attempt from an unknown browser client device' },
    { id: 'WRONG_PASSWORD_BURST', name: '5. Credential Stuffing / Brute Force', severity: 'HIGH', desc: 'Multiple consecutive password mismatches in short window' },
    { id: 'EXCESSIVE_FREQUENCY', name: '6. High Velocity Request Burst', severity: 'CRITICAL', desc: 'Rapid automated attack (> 15 requests in 60s) triggering IP rate limiter' },
    { id: 'REPEATED_WRONG_OTP', name: '7. Repeated Failed OTP Verification', severity: 'HIGH', desc: 'Valid password combined with multiple incorrect 2FA codes' },
    { id: 'COMBINED_ATTACK', name: '8. Combined Multi-Vector Threat', severity: 'CRITICAL', desc: 'Unfamiliar subnet + untrusted device + high frequency + failed credentials' },
  ];

  const handleRun = async (scenarioId) => {
    const sc = scenarioId || selectedScenario;
    setLoading(true);
    setResult(null);
    try {
      const data = await runSimulation(sc);
      setResult(data);
    } catch (err) {
      alert('Simulation error: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Simulation Lab Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
            <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>Security Testing Section</span>
            <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>Local Environment Only</span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Attack Simulation Laboratory</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Execute controlled threat scenarios against the Risk Engine to observe real-time multi-factor explainable decisions
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
        {/* Scenario Selector */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FlaskConical size={18} style={{ color: 'var(--accent-cyan)' }} />
            <span>Select Attack Scenario</span>
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>
            Choose a threat vector to simulate connection telemetry and credential behaviors:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {scenarios.map((sc) => {
              const isSelected = selectedScenario === sc.id;
              return (
                <div
                  key={sc.id}
                  onClick={() => { setSelectedScenario(sc.id); handleRun(sc.id); }}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: `1px solid ${isSelected ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                    background: isSelected ? 'rgba(6, 182, 212, 0.1)' : 'rgba(15, 23, 42, 0.6)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease-in-out'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: isSelected ? 'var(--accent-cyan)' : 'var(--text-main)' }}>
                      {sc.name}
                    </span>
                    <span className={`badge badge-${sc.severity === 'CRITICAL' || sc.severity === 'HIGH' ? 'danger' : sc.severity === 'MEDIUM' ? 'warning' : 'success'}`} style={{ fontSize: '0.65rem' }}>
                      {sc.severity}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sc.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Simulation Results */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Terminal size={18} style={{ color: 'var(--accent-cyan)' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Simulation Telemetry & Evaluation</h3>
              </div>
              <button
                onClick={() => handleRun()}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                  border: 'none',
                  color: '#ffffff',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                <Play size={12} fill="#ffffff" />
                <span>{loading ? 'Evaluating...' : 'Re-Run'}</span>
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
                <FlaskConical size={32} style={{ margin: '0 auto 1rem', animation: 'pulse 1.5s infinite', color: 'var(--accent-cyan)' }} />
                <p style={{ fontSize: '0.85rem' }}>Injecting simulated connection vectors into Risk Engine...</p>
              </div>
            ) : result ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Result Top Banner */}
                <div style={{
                  background: result.decision === 'DENY' 
                    ? 'rgba(244, 63, 94, 0.12)' 
                    : result.decision === 'CHALLENGE_TOTP' || result.decision === 'RESTRICT_AND_VERIFY' 
                    ? 'rgba(245, 158, 11, 0.12)' 
                    : 'rgba(16, 185, 129, 0.12)',
                  border: `1px solid ${
                    result.decision === 'DENY' 
                      ? 'rgba(244, 63, 94, 0.3)' 
                      : result.decision === 'CHALLENGE_TOTP' || result.decision === 'RESTRICT_AND_VERIFY' 
                      ? 'rgba(245, 158, 11, 0.3)' 
                      : 'rgba(16, 185, 129, 0.3)'
                  }`,
                  borderRadius: '8px',
                  padding: '0.85rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                      Decision: <span style={{ color: result.decision === 'DENY' ? '#fb7185' : result.decision === 'ALLOW' ? '#34d399' : '#fbbf24' }}>{result.decision}</span>
                    </div>
                    <span className="font-mono badge badge-info" style={{ fontSize: '0.75rem' }}>
                      Latency: {result.processing_time_ms} ms
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>Risk Score: <strong style={{ color: 'var(--text-main)' }}>{result.risk_score} / 100</strong></span>
                    <span>Level: <strong>{result.risk_level}</strong></span>
                    <span style={{ fontStyle: 'italic', color: 'var(--text-dim)' }}>(Simulated Event)</span>
                  </div>
                </div>

                {/* Simulated Ingress Parameters */}
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '0.35rem' }}>
                    Injected Connection Parameters:
                  </div>
                  <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '0.6rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', border: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem' }}>
                    <div>Source IP: <span style={{ color: 'var(--accent-cyan)' }}>{result.input_parameters.source_ip}</span></div>
                    <div>Subnet: <span style={{ color: 'var(--text-main)' }}>{result.input_parameters.subnet}</span></div>
                    <div>Device Trusted: <span>{String(result.input_parameters.device_trusted)}</span></div>
                    <div>Recent Rate: <span>{result.input_parameters.recent_requests} req/min</span></div>
                  </div>
                </div>

                {/* Contributing Factor Explanations */}
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '0.35rem' }}>
                    Explainable Risk Factor Deductions:
                  </div>
                  {result.factors && result.factors.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {result.factors.map((f, i) => (
                        <div key={i} style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '0.5rem 0.7rem', borderRadius: '6px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{f.name}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{f.explanation}</div>
                          </div>
                          <span className="font-mono badge badge-warning">+{f.contribution}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.75rem', color: '#34d399', background: 'rgba(16, 185, 129, 0.08)', padding: '0.5rem', borderRadius: '6px' }}>
                      Zero threat signals identified. Connection permitted automatically.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                Select a scenario from the left to trigger the attack simulator.
              </div>
            )}
          </div>

          <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.725rem', color: 'var(--text-dim)' }}>
            * All events executed in this test section are safely tagged with <code>simulated: true</code>.
          </div>
        </div>
      </div>
    </div>
  );
}
