import React, { useState, useEffect } from 'react';
import { getRiskHistory, getRiskAssessment } from '../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Cpu, ShieldCheck, ShieldAlert, AlertTriangle, Info, ChevronRight } from 'lucide-react';

export default function RiskAnalysisPage() {
  const [history, setHistory] = useState([]);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await getRiskHistory(50);
        setHistory(data);
        if (data.length > 0) {
          setSelectedAssessment(data[0]);
        }
      } catch (err) {
        console.error('Failed to load risk history:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute risk category counts for chart
  const counts = { LOW: 0, MEDIUM: 0, HIGH: 0 };
  history.forEach((h) => {
    if (counts[h.risk_level] !== undefined) counts[h.risk_level]++;
  });
  const pieData = [
    { name: 'Low Risk (0–20)', value: counts.LOW, color: '#10b981' },
    { name: 'Medium Risk (21–50)', value: counts.MEDIUM, color: '#f59e0b' },
    { name: 'High Risk (51–100)', value: counts.HIGH, color: '#f43f5e' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Explainable Risk Engine Analytics</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Transparent, multi-signal scoring model explaining the exact rationale behind every authentication classification
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* Risk Breakdown Pie Chart */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Risk Score Category Distribution</h3>
          <div style={{ height: '220px', width: '100%' }}>
            {history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} />
                  <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', paddingTop: '4rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                No evaluations recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Selected Evaluation Detail Inspector */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Explainability Inspector</h3>
              {selectedAssessment && (
                <span className={`badge badge-${selectedAssessment.risk_level === 'HIGH' ? 'danger' : selectedAssessment.risk_level === 'MEDIUM' ? 'warning' : 'success'}`}>
                  {selectedAssessment.risk_level} ({selectedAssessment.risk_score}/100)
                </span>
              )}
            </div>

            {selectedAssessment ? (
              <div>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <div>Assessment ID: <strong style={{ color: 'var(--text-main)' }}>#{selectedAssessment.id}</strong></div>
                  <div>Policy Action: <strong style={{ color: 'var(--accent-cyan)' }}>{selectedAssessment.decision}</strong></div>
                  <div>Time: <span style={{ color: 'var(--text-dim)' }}>{new Date(selectedAssessment.created_at).toLocaleTimeString()}</span></div>
                </div>

                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '0.4rem' }}>
                  Contributing Risk Factors:
                </div>
                {selectedAssessment.contributing_factors && selectedAssessment.contributing_factors.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedAssessment.contributing_factors.map((f, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: 'rgba(15, 23, 42, 0.7)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '6px',
                          padding: '0.55rem 0.75rem',
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '0.5rem'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-main)' }}>{f.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{f.explanation}</div>
                        </div>
                        <span className="font-mono badge badge-warning" style={{ flexShrink: 0, fontSize: '0.75rem' }}>
                          +{f.contribution}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '0.75rem', borderRadius: '6px', color: '#34d399', fontSize: '0.8rem' }}>
                    Zero anomalous signals identified. Login matched baseline profile.
                  </div>
                )}
              </div>
            ) : (
              <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Select an evaluation below to inspect details.</p>
            )}
          </div>
        </div>
      </div>

      {/* Evaluation History Table */}
      <div className="card">
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Historical Risk Assessments</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)' }}>
                <th style={{ padding: '0.6rem 0.8rem' }}>ID</th>
                <th style={{ padding: '0.6rem 0.8rem' }}>Timestamp</th>
                <th style={{ padding: '0.6rem 0.8rem' }}>Risk Score</th>
                <th style={{ padding: '0.6rem 0.8rem' }}>Level</th>
                <th style={{ padding: '0.6rem 0.8rem' }}>Action Taken</th>
                <th style={{ padding: '0.6rem 0.8rem' }}>Factors Count</th>
                <th style={{ padding: '0.6rem 0.8rem' }}>Inspect</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>
                    No evaluations on record.
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr 
                    key={item.id} 
                    onClick={() => setSelectedAssessment(item)}
                    style={{ 
                      borderBottom: '1px solid rgba(51, 65, 85, 0.25)',
                      cursor: 'pointer',
                      background: selectedAssessment?.id === item.id ? 'rgba(6, 182, 212, 0.08)' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '0.6rem 0.8rem', fontWeight: 600 }}>#{item.id}</td>
                    <td style={{ padding: '0.6rem 0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.6rem 0.8rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      {item.risk_score} / 100
                    </td>
                    <td style={{ padding: '0.6rem 0.8rem' }}>
                      <span className={`badge badge-${item.risk_level === 'HIGH' ? 'danger' : item.risk_level === 'MEDIUM' ? 'warning' : 'success'}`}>
                        {item.risk_level}
                      </span>
                    </td>
                    <td style={{ padding: '0.6rem 0.8rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                      {item.decision}
                    </td>
                    <td style={{ padding: '0.6rem 0.8rem', color: 'var(--text-dim)' }}>
                      {item.contributing_factors?.length || 0} signal(s)
                    </td>
                    <td style={{ padding: '0.6rem 0.8rem', color: 'var(--accent-blue)' }}>
                      <ChevronRight size={16} />
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
