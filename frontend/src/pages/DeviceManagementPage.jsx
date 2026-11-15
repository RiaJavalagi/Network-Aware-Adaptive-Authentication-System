import React, { useState, useEffect } from 'react';
import { getDevices, setDeviceTrust, revokeDevice } from '../services/api';
import { Smartphone, CheckCircle, XCircle, Trash2, Shield, AlertCircle } from 'lucide-react';

export default function DeviceManagementPage() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDevices = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDevices();
      setDevices(data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const handleToggleTrust = async (deviceId, currentTrust) => {
    try {
      await setDeviceTrust(deviceId, !currentTrust);
      loadDevices();
    } catch (err) {
      alert('Failed to update trust: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleRevoke = async (deviceId) => {
    if (!confirm('Are you sure you want to revoke this device? You will need to re-verify on your next login.')) return;
    try {
      await revokeDevice(deviceId);
      loadDevices();
    } catch (err) {
      alert('Failed to revoke device: ' + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Trusted Devices Registry</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Recognized client devices and browser identifiers linked to your account
          </p>
        </div>
        <span className="badge badge-info">{devices.length} Active Devices</span>
      </div>

      {error && (
        <div style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '0.75rem', borderRadius: '8px', color: '#fb7185', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {loading && devices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading device registry...
        </div>
      ) : devices.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Smartphone size={36} style={{ margin: '0 auto 1rem', color: 'var(--text-dim)' }} />
          <h4 style={{ fontWeight: 600 }}>No Devices Registered Yet</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Devices will automatically register upon your first successful login.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {devices.map((device) => (
            <div key={device.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ background: 'rgba(6, 182, 212, 0.12)', padding: '0.45rem', borderRadius: '8px', color: 'var(--accent-cyan)' }}>
                      <Smartphone size={18} />
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Device #{device.id}</span>
                  </div>

                  {device.trusted ? (
                    <span className="badge badge-success">
                      <CheckCircle size={12} />
                      TRUSTED
                    </span>
                  ) : (
                    <span className="badge badge-warning">
                      UNTRUSTED
                    </span>
                  )}
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.6rem', borderRadius: '6px', marginBottom: '0.75rem', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '0.2rem' }}>Fingerprint Identifier:</div>
                  <code style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', wordBreak: 'break-all' }}>
                    {device.device_identifier}
                  </code>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div>First seen: <span style={{ color: 'var(--text-muted)' }}>{new Date(device.first_seen).toLocaleString()}</span></div>
                  <div>Last seen: <span style={{ color: 'var(--text-muted)' }}>{new Date(device.last_seen).toLocaleString()}</span></div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  onClick={() => handleToggleTrust(device.id, device.trusted)}
                  style={{
                    flex: 1,
                    background: device.trusted ? 'rgba(51, 65, 85, 0.4)' : 'rgba(16, 185, 129, 0.15)',
                    border: `1px solid ${device.trusted ? 'var(--border-subtle)' : 'rgba(16, 185, 129, 0.3)'}`,
                    color: device.trusted ? 'var(--text-muted)' : '#34d399',
                    padding: '0.4rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {device.trusted ? 'Revoke Trust' : 'Mark Trusted'}
                </button>

                <button
                  onClick={() => handleRevoke(device.id)}
                  title="Revoke device access"
                  style={{
                    background: 'rgba(244, 63, 94, 0.15)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    color: '#fb7185',
                    padding: '0.4rem 0.65rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
