import React, { useState, useEffect, useCallback } from 'react';
import { getHealthStatus } from '../services/api';
import { Activity, CheckCircle2, AlertCircle, RefreshCw, Server, ShieldCheck, Database, HardDrive } from 'lucide-react';

export default function HealthBadge() {
  const [healthData, setHealthData] = useState(null);
  const [latency, setLatency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getHealthStatus();
      setHealthData(result.data);
      setLatency(result.latencyMs);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('API Health check failed:', err);
      setError(err.message || 'Unable to connect to FastAPI backend');
      setHealthData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return (
    <div className="card" style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ 
            background: 'rgba(6, 182, 212, 0.1)', 
            padding: '0.5rem', 
            borderRadius: '8px',
            color: 'var(--accent-cyan)'
          }}>
            <Server size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Backend Connectivity</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>FastAPI Gateway Health Check</p>
          </div>
        </div>

        <button
          onClick={checkHealth}
          disabled={loading}
          style={{
            background: 'rgba(51, 65, 85, 0.5)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-main)',
            padding: '0.4rem 0.8rem',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.8rem',
            transition: 'all 0.2s'
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          <span>{loading ? 'Pinging...' : 'Ping Test'}</span>
        </button>
      </div>

      {loading && !healthData && (
        <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Activity size={24} style={{ margin: '0 auto 0.5rem', animation: 'pulse 1.5s infinite', color: 'var(--accent-cyan)' }} />
          <p style={{ fontSize: '0.875rem' }}>Probing backend endpoint (/api/health)...</p>
        </div>
      )}

      {error && (
        <div style={{ 
          background: 'rgba(244, 63, 94, 0.1)', 
          border: '1px solid rgba(244, 63, 94, 0.3)',
          borderRadius: '8px',
          padding: '1rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem'
        }}>
          <AlertCircle size={20} style={{ color: 'var(--accent-rose)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 600, color: '#fb7185', fontSize: '0.9rem' }}>Connection Failed</div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{error}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
              Ensure the FastAPI backend is running on <code>http://127.0.0.1:8000</code>.
            </p>
          </div>
        </div>
      )}

      {healthData && (
        <div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '0.875rem',
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-success">
                <span className="pulse-dot" style={{ background: '#34d399' }}></span>
                ONLINE
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Response Status: <strong style={{ color: '#34d399' }}>{healthData.status.toUpperCase()}</strong>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem' }}>
              {latency !== null && (
                <span className="font-mono" style={{ color: latency < 100 ? '#34d399' : '#fbbf24' }}>
                  {latency} ms
                </span>
              )}
              {lastChecked && (
                <span style={{ color: 'var(--text-dim)' }}>Checked: {lastChecked}</span>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            <div style={{ 
              background: 'rgba(30, 41, 59, 0.4)', 
              padding: '0.75rem', 
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-dim)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                <ShieldCheck size={14} style={{ color: 'var(--accent-cyan)' }} />
                <span>API Version</span>
              </div>
              <div className="font-mono" style={{ fontSize: '0.95rem', fontWeight: 600 }}>v{healthData.version}</div>
            </div>

            <div style={{ 
              background: 'rgba(30, 41, 59, 0.4)', 
              padding: '0.75rem', 
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-dim)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                <Database size={14} style={{ color: 'var(--accent-blue)' }} />
                <span>Database</span>
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                {healthData.services?.database || 'Pending'}
              </div>
            </div>

            <div style={{ 
              background: 'rgba(30, 41, 59, 0.4)', 
              padding: '0.75rem', 
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-dim)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                <HardDrive size={14} style={{ color: 'var(--accent-amber)' }} />
                <span>Redis Cache</span>
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                {healthData.services?.redis || 'Pending'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
