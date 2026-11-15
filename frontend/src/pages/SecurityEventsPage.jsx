import React, { useState, useEffect } from 'react';
import { getSecurityEvents } from '../services/api';
import { Shield, Activity, AlertTriangle, ShieldCheck, RefreshCw, Filter } from 'lucide-react';

export default function SecurityEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('');

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await getSecurityEvents(50, severityFilter || null);
      setEvents(data);
    } catch (err) {
      console.error('Failed to load security events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [severityFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Security Audit & Forensics Log</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Immutable security event journal recording authentication anomalies, credential brute-forcing, and policy enforcements
          </p>
        </div>

        <button
          onClick={loadEvents}
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
          <span>Refresh Journal</span>
        </button>
      </div>

      <div className="card">
        {/* Filter bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
            <Filter size={15} />
            <span>Filter Severity:</span>
          </div>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {['', 'INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                style={{
                  background: severityFilter === sev ? 'rgba(6, 182, 212, 0.2)' : 'rgba(30, 41, 59, 0.4)',
                  border: `1px solid ${severityFilter === sev ? 'rgba(6, 182, 212, 0.4)' : 'var(--border-subtle)'}`,
                  color: severityFilter === sev ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: severityFilter === sev ? 600 : 400
                }}
              >
                {sev || 'All Levels'}
              </button>
            ))}
          </div>
        </div>

        {/* Audit Log Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)' }}>
                <th style={{ padding: '0.65rem 0.8rem' }}>Event ID</th>
                <th style={{ padding: '0.65rem 0.8rem' }}>Timestamp</th>
                <th style={{ padding: '0.65rem 0.8rem' }}>Severity</th>
                <th style={{ padding: '0.65rem 0.8rem' }}>Event Category</th>
                <th style={{ padding: '0.65rem 0.8rem' }}>Description & Audit Detail</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-dim)' }}>
                    No security events found for selected filter.
                  </td>
                </tr>
              ) : (
                events.map((ev) => (
                  <tr key={ev.id} style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.25)' }}>
                    <td style={{ padding: '0.65rem 0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                      #{ev.id}
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(ev.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <span className={`badge badge-${ev.severity === 'CRITICAL' || ev.severity === 'HIGH' ? 'danger' : ev.severity === 'MEDIUM' ? 'warning' : 'info'}`}>
                        {ev.severity}
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                      {ev.event_type}
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem', color: 'var(--text-main)', maxWidth: '500px' }}>
                      {ev.description}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
