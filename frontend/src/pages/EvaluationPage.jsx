import React, { useState, useEffect } from 'react';
import { getEvaluationMetrics } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChart3, CheckCircle, Shield, Zap, RefreshCw, Cpu, Layers } from 'lucide-react';

export default function EvaluationPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const data = await getEvaluationMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load benchmark evaluation metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const chartData = metrics ? [
    {
      metric: 'User Friction (%)',
      Conventional: metrics.conventional_system.user_friction_pct,
      Adaptive: metrics.adaptive_system.user_friction_pct,
    },
    {
      metric: 'OTP Prompts (%)',
      Conventional: metrics.conventional_system.totp_challenge_frequency_pct,
      Adaptive: metrics.adaptive_system.totp_challenge_frequency_pct,
    },
    {
      metric: 'Detection Rate (%)',
      Conventional: metrics.conventional_system.detection_rate_pct,
      Adaptive: metrics.adaptive_system.detection_rate_pct,
    },
  ] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
            <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Empirical Evaluation</span>
            <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>Reproducible Benchmark</span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Comparative Security & Friction Evaluation</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Empirical comparative analysis of Conventional Password + Mandatory TOTP vs Network-Aware Adaptive Authentication
          </p>
        </div>

        <button
          onClick={loadMetrics}
          disabled={loading}
          style={{
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-main)',
            padding: '0.45rem 0.85rem',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.8rem'
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Re-Run Benchmark</span>
        </button>
      </div>

      {/* KPI Highlights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card">
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>User Friction Reduction</div>
          <div className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 700, color: '#34d399' }}>
            {metrics?.comparison_summary?.friction_reduction_pct || 0}%
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Fewer unnecessary 2FA prompts for benign users
          </p>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>Adaptive Detection Rate</div>
          <div className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
            {metrics?.adaptive_system?.detection_rate_pct || 0}%
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Attacks intercepted by risk policy
          </p>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>Evaluation Latency</div>
          <div className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent-blue)' }}>
            {metrics?.adaptive_system?.average_evaluation_latency_ms || 0} ms
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Real-time multi-signal scoring overhead
          </p>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>False Positive Rate</div>
          <div className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fbbf24' }}>
            {metrics?.adaptive_system?.false_positive_rate_pct || 0}%
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Benign logins mistakenly blocked
          </p>
        </div>
      </div>

      {/* Comparison Chart & Detailed Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.25rem' }}>
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={18} style={{ color: 'var(--accent-cyan)' }} />
            <span>Side-by-Side Comparison</span>
          </h3>
          <div style={{ height: '260px', width: '100%' }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                  <XAxis dataKey="metric" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} />
                  <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                  <Bar dataKey="Conventional" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Conventional Static MFA" />
                  <Bar dataKey="Adaptive" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Adaptive Risk Model" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', paddingTop: '4rem', color: 'var(--text-dim)' }}>
                Running empirical benchmark suite...
              </div>
            )}
          </div>
        </div>

        {/* System Comparison Table */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={18} style={{ color: 'var(--accent-blue)' }} />
            <span>Benchmark Model Breakdown</span>
          </h3>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)' }}>
                <th style={{ padding: '0.5rem' }}>Feature / Metric</th>
                <th style={{ padding: '0.5rem', color: '#fb7185' }}>Conventional MFA</th>
                <th style={{ padding: '0.5rem', color: '#22d3ee' }}>Adaptive System</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.25)' }}>
                <td style={{ padding: '0.55rem', fontWeight: 600 }}>TOTP Challenge Rate</td>
                <td style={{ padding: '0.55rem', color: 'var(--text-muted)' }}>100.0% (Always prompt)</td>
                <td style={{ padding: '0.55rem', color: '#34d399', fontWeight: 600 }}>
                  {metrics?.adaptive_system?.totp_challenge_frequency_pct}% (Risk-gated)
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.25)' }}>
                <td style={{ padding: '0.55rem', fontWeight: 600 }}>Connection Context</td>
                <td style={{ padding: '0.55rem', color: 'var(--text-muted)' }}>None (Static credentials)</td>
                <td style={{ padding: '0.55rem', color: 'var(--accent-cyan)' }}>Subnet, IP, Device, Rate</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.25)' }}>
                <td style={{ padding: '0.55rem', fontWeight: 600 }}>Rate Limiting</td>
                <td style={{ padding: '0.55rem', color: 'var(--text-muted)' }}>Basic IP block</td>
                <td style={{ padding: '0.55rem', color: 'var(--accent-cyan)' }}>Redis Sliding-Window</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.25)' }}>
                <td style={{ padding: '0.55rem', fontWeight: 600 }}>Explainability</td>
                <td style={{ padding: '0.55rem', color: 'var(--text-muted)' }}>Opaque binary pass/fail</td>
                <td style={{ padding: '0.55rem', color: '#34d399', fontWeight: 600 }}>Itemized factors JSON</td>
              </tr>
              <tr>
                <td style={{ padding: '0.55rem', fontWeight: 600 }}>Decision Overhead</td>
                <td style={{ padding: '0.55rem', color: 'var(--text-muted)' }}>~0.05 ms</td>
                <td style={{ padding: '0.55rem', color: 'var(--text-muted)' }}>
                  {metrics?.adaptive_system?.average_evaluation_latency_ms} ms
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
