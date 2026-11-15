import React, { useState, useEffect } from 'react';
import { getNetworkEvents, getNetworkSummary, getNetworkActivity } from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid 
} from 'recharts';
import { Network, Globe, Activity, ShieldAlert, RefreshCw } from 'lucide-react';

export default function NetworkMonitoringPage() {
  const [events, setEvents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [evts, sum, act] = await Promise.all([
        getNetworkEvents(50, severityFilter || null),
        getNetworkSummary(),
        getNetworkActivity(24),
      ]);
      setEvents(evts);
      setSummary(sum);
      setActivity(act);
    } catch (err) {
      console.error('Failed to load network monitoring data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [severityFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Network Traffic Intelligence</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Real-time subnet analysis, ingress request frequency, and connection anomaly detection
          </p>
        </div>

        <button
          onClick={loadData}
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
          <span>Refresh Traffic</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>Total Logged Ingress Events</div>
          <div className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 700 }}>{summary?.total_events ?? 0}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginTop: '0.2rem' }}>All monitored endpoints</div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>Unique IP Hosts</div>
          <div className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 700 }}>{summary?.unique_ips ?? 0}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', marginTop: '0.2rem' }}>Distinct ingress hosts</div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>Monitored Subnets</div>
          <div className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 700 }}>{summary?.unique_subnets ?? 0}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', marginTop: '0.2rem' }}>Canonical /24 and /64 blocks</div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>High / Critical Alerts</div>
          <div className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fb7185' }}>
            {summary?.events_by_severity?.HIGH || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#fb7185', marginTop: '0.2rem' }}>Threat events intercepted</div>
        </div>
      </div>

      {/* Recharts Analytics Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.25rem' }}>
        {/* Top Subnets Chart */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Globe size={18} style={{ color: 'var(--accent-cyan)' }} />
            <span>Top Ingress Network Subnets</span>
          </h3>
          <div style={{ height: '240px', width: '100%' }}>
            {summary?.top_subnets && summary.top_subnets.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.top_subnets} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis type="number" stroke="#64748b" fontSize={11} />
                  <YAxis type="category" dataKey="subnet" stroke="#64748b" fontSize={11} width={110} />
                  <Tooltip 
                    contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                  />
                  <Bar dataKey="count" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', paddingTop: '4rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                No subnet distribution data available yet.
              </div>
            )}
          </div>
        </div>

        {/* Traffic Timeline Chart */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} style={{ color: 'var(--accent-blue)' }} />
            <span>24-Hour Traffic Activity</span>
          </h3>
          <div style={{ height: '240px', width: '100%' }}>
            {activity && activity.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activity} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="timestamp" stroke="#64748b" fontSize={10} tickFormatter={(str) => str.split(' ')[1] || str} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} />
                  <Area type="monotone" dataKey="total" stroke="#3b82f6" fillOpacity={1} fill="url(#trafficGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', paddingTop: '4rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                Collecting traffic telemetry...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Network Events Table */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Recent Network Events</h3>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {['', 'INFO', 'LOW', 'MEDIUM', 'HIGH'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                style={{
                  background: severityFilter === sev ? 'rgba(6, 182, 212, 0.2)' : 'rgba(30, 41, 59, 0.4)',
                  border: `1px solid ${severityFilter === sev ? 'rgba(6, 182, 212, 0.4)' : 'var(--border-subtle)'}`,
                  color: severityFilter === sev ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.55rem',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {sev || 'All'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)' }}>
                <th style={{ padding: '0.6rem 0.8rem' }}>Timestamp</th>
                <th style={{ padding: '0.6rem 0.8rem' }}>Source IP</th>
                <th style={{ padding: '0.6rem 0.8rem' }}>Subnet (/24)</th>
                <th style={{ padding: '0.6rem 0.8rem' }}>Event Type</th>
                <th style={{ padding: '0.6rem 0.8rem' }}>HTTP Endpoint</th>
                <th style={{ padding: '0.6rem 0.8rem' }}>Severity</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>
                    No network events recorded yet.
                  </td>
                </tr>
              ) : (
                events.map((ev) => (
                  <tr key={ev.id} style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.25)' }}>
                    <td style={{ padding: '0.6rem 0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(ev.request_timestamp).toLocaleTimeString()}
                    </td>
                    <td style={{ padding: '0.6rem 0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                      {ev.source_ip}
                    </td>
                    <td style={{ padding: '0.6rem 0.8rem', fontFamily: 'var(--font-mono)' }}>
                      {ev.subnet}
                    </td>
                    <td style={{ padding: '0.6rem 0.8rem', fontWeight: 600 }}>
                      {ev.event_type}
                    </td>
                    <td style={{ padding: '0.6rem 0.8rem', color: 'var(--text-dim)' }}>
                      <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{ev.http_method}</span> {ev.request_path} ({ev.status_code})
                    </td>
                    <td style={{ padding: '0.6rem 0.8rem' }}>
                      <span className={`badge badge-${ev.severity === 'HIGH' ? 'danger' : ev.severity === 'MEDIUM' ? 'warning' : 'info'}`}>
                        {ev.severity}
                      </span>
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
