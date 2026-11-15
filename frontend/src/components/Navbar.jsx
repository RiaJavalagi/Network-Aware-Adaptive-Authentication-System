import React from 'react';
import { 
  Shield, 
  Lock, 
  Network, 
  Smartphone, 
  Cpu, 
  Activity, 
  FlaskConical, 
  BarChart3, 
  LogOut, 
  User as UserIcon,
  LogIn,
  UserPlus
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, currentUser, onLogout }) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: Shield },
    { id: 'network', label: 'Network Monitor', icon: Network },
    { id: 'risk', label: 'Risk Analytics', icon: Cpu },
    { id: 'security', label: 'Security Events', icon: Activity },
    { id: 'devices', label: 'Devices', icon: Smartphone, requiresAuth: true },
    { id: 'totp', label: '2FA Setup', icon: Lock, requiresAuth: true },
    { id: 'simulation', label: 'Attack Lab', icon: FlaskConical },
    { id: 'evaluation', label: 'Benchmarks', icon: BarChart3 },
  ];

  return (
    <nav style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(10, 14, 23, 0.85)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '0.75rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      flexWrap: 'wrap'
    }}>
      {/* Brand */}
      <div 
        onClick={() => setActiveTab('overview')} 
        style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}
      >
        <div style={{
          background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
          padding: '0.4rem',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 12px rgba(6, 182, 212, 0.4)'
        }}>
          <Shield size={20} color="#ffffff" />
        </div>
        <div>
          <span style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.02em' }}>
            Adaptive<span style={{ color: 'var(--accent-cyan)' }}>Auth</span>
          </span>
          <span style={{ fontSize: '0.65rem', marginLeft: '0.4rem', padding: '0.1rem 0.35rem', background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', borderRadius: '4px', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
            v0.1.0
          </span>
        </div>
      </div>

      {/* Nav Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', overflowX: 'auto' }}>
        {navItems.map((item) => {
          if (item.requiresAuth && !currentUser) return null;
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.75rem',
                borderRadius: '6px',
                border: 'none',
                background: isActive ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                color: isActive ? 'var(--accent-cyan)' : 'var(--text-muted)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.825rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease-in-out',
                outline: 'none',
              }}
            >
              <Icon size={15} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Auth Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {currentUser ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div 
              onClick={() => setActiveTab('dashboard')}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.4rem', 
                cursor: 'pointer',
                background: 'rgba(30, 41, 59, 0.5)',
                padding: '0.35rem 0.75rem',
                borderRadius: '20px',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.8rem'
              }}
            >
              <UserIcon size={14} style={{ color: 'var(--accent-cyan)' }} />
              <span style={{ fontWeight: 600 }}>{currentUser.username}</span>
              {currentUser.totp_enabled && (
                <span style={{ fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '0.05rem 0.35rem', borderRadius: '4px' }}>
                  2FA
                </span>
              )}
            </div>
            <button
              onClick={onLogout}
              style={{
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: '#fb7185',
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.8rem',
              }}
            >
              <LogOut size={13} />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              onClick={() => setActiveTab('login')}
              style={{
                background: activeTab === 'login' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(30, 41, 59, 0.5)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.825rem',
              }}
            >
              <LogIn size={14} />
              <span>Sign In</span>
            </button>
            <button
              onClick={() => setActiveTab('register')}
              style={{
                background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                border: 'none',
                color: '#ffffff',
                padding: '0.4rem 0.85rem',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.825rem',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(6, 182, 212, 0.3)',
              }}
            >
              <UserPlus size={14} />
              <span>Register</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
