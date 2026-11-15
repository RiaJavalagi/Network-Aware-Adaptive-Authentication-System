import React, { useState, useEffect } from 'react';
import { getSecurityOverview, getDevices } from '../services/api';
import { User, ShieldCheck, Smartphone, Lock, Activity, Clock, CheckCircle } from 'lucide-react';

export default function UserDashboard({ currentUser, onNavigate }) {
  const [overview, setOverview] = useState(null);
  const [deviceCount, setDeviceCount] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const [secData, devData] = await Promise.all([
          getSecurityOverview(),
          getDevices().catch(() => []),
        ]);
        setOverview(secData);
        setDeviceCount(devData.length);
      } catch (err) {
        console.error('Failed to load user dashboard data:', err);
      }
    }
    loadData();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Welcome Banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(59, 130, 246, 0.08))', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '0.85rem', borderRadius: '12px', color: 'var(--accent-cyan)' }}>
              <User size={32} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Welcome back, {currentUser?.username}!</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Account Email: <strong style={{ color: 'var(--text-main)' }}>{currentUser?.email}</strong> &bull; Member since: {new Date(currentUser?.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {currentUser?.totp_enabled ? (
              <span className="badge badge-success">
                <ShieldCheck size={14} />
                2FA Protected
              </span>
            ) : (
              <button
                onClick={() => onNavigate('totp')}
                style={{
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  color: '#fbbf24',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <Lock size={14} />
                Enable 2FA
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card" onClick={() => onNavigate('devices')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>Active Devices</span>
            <Smartphone size={18} style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <div className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 700 }}>{deviceCount}</div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Manage recognized browsers</p>
        </div>

        <div className="card" onClick={() => onNavigate('security')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>Total Logins</span>
            <Activity size={18} style={{ color: 'var(--accent-blue)' }} />
          </div>
          <div className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 700 }}>{overview?.total_logins ?? 0}</div>
          <p style={{ fontSize: '0.75rem', color: '#34d399', marginTop: '0.25rem' }}>{overview?.successful_logins ?? 0} successful</p>
        </div>

        <div className="card" onClick={() => onNavigate('risk')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>2FA Challenges</span>
            <Lock size={18} style={{ color: 'var(--accent-amber)' }} />
          </div>
          <div className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 700 }}>{overview?.totp_challenges ?? 0}</div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Adaptive risk triggers</p>
        </div>

        <div className="card" onClick={() => onNavigate('network')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>Security Events</span>
            <ShieldCheck size={18} style={{ color: '#fb7185' }} />
          </div>
          <div className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 700 }}>{overview?.recent_events_count ?? 0}</div>
          <p style={{ fontSize: '0.75rem', color: '#fb7185', marginTop: '0.25rem' }}>Audit and threat alerts</p>
        </div>
      </div>
    </div>
  );
}
