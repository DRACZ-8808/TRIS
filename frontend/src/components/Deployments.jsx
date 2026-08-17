import React, { useState } from 'react';
import { ArrowUpDown, Shield, UserCheck, AlertTriangle } from 'lucide-react';

const Deployments = ({ junctions, onOverride }) => {
  const [selectedZone, setSelectedZone] = useState("All");
  const [commentInputs, setCommentInputs] = useState({});

  const zones = ["All", ...new Set(junctions.map(j => j.zone))];

  // Filter junctions
  const filteredJunctions = selectedZone === "All"
    ? junctions
    : junctions.filter(j => j.zone === selectedZone);

  // Rank by risk score descending
  const sortedJunctions = [...filteredJunctions].sort((a, b) => b.risk_score - a.risk_score);

  // Stats comparison
  // Total officers deployed in baseline
  // Let's compare total officers present vs total officers recommended
  const totalPresent = filteredJunctions.reduce((sum, j) => sum + j.officers_present, 0);
  const totalRecommended = filteredJunctions.reduce((sum, j) => sum + j.recommended_officers, 0);
  const unmannedCount = filteredJunctions.filter(j => j.unmanned).length;

  const handleAction = (id, action, val) => {
    const comment = commentInputs[id] || "";
    onOverride(id, action, val, comment);
    // Reset comment input
    setCommentInputs(prev => ({ ...prev, [id]: "" }));
  };

  const handleCommentChange = (id, value) => {
    setCommentInputs(prev => ({ ...prev, [id]: value }));
  };

  return (
    <div className="view-panel">
      <div className="view-header">
        <div>
          <h2>Deployments</h2>
          <p>Ranked police allocation priority list and deployment verification desk.</p>
        </div>
        <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
          <label style={{ margin: 0 }}>Zone Filter:</label>
          <select className="form-select" value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)}>
            {zones.map(z => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>
      </div>

      {/* Deployment Comparison Card */}
      <div className="dashboard-card" style={{ padding: '20px' }}>
        <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ArrowUpDown size={18} color="var(--accent-blue)" /> Force Deployment Comparison Summary ({selectedZone} Zone)
        </h3>
        
        <div className="grid-4" style={{ gap: '16px', marginBottom: '16px' }}>
          <div style={{ background: 'rgba(255,255,255,0.01)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Baseline Deployed</span>
            <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '4px' }}>{totalPresent} Officers</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.01)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>AI Recommended Deployed</span>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-green)', marginTop: '4px' }}>{totalRecommended} Officers</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.01)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Officer Strength Pool</span>
            <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '4px' }}>
              {selectedZone === "All" ? 43 * 12 : 43} Officers Max
            </div>
          </div>
          <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-red)' }}>Unmanned Junctions</span>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-red)', marginTop: '4px' }}>{unmannedCount} Locations</div>
          </div>
        </div>

        {/* Visual comparison bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
            <span>Deployment efficiency alignment</span>
            <span>{Math.round((totalRecommended / (selectedZone === "All" ? 516 : 43)) * 100)}% utilization</span>
          </div>
          <div style={{ height: '8px', background: 'var(--bg-primary)', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: `${(totalPresent / 516) * 100}%`, background: 'var(--text-muted)' }}></div>
            <div style={{ width: `${Math.abs(totalRecommended - totalPresent) / 516 * 100}%`, background: 'var(--accent-blue)' }}></div>
          </div>
        </div>
      </div>

      {/* Ranked List Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px' }}>Priority Risk Standings</h3>
        
        {sortedJunctions.map((j, index) => {
          const rankNum = String(index + 1).padStart(2, '0');
          const riskClass = j.risk_level.toLowerCase();

          return (
            <div key={j.location_id} className={`dashboard-card`} style={{ padding: '16px', borderLeft: `5px solid var(--color-${riskClass})` }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', justifyContent: 'space-between' }}>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '250px' }}>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '20px', fontWeight: 800, color: 'var(--text-muted)' }}>
                    {rankNum}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h4 style={{ margin: 0, fontWeight: 600 }}>{j.location_name}</h4>
                      <span className={`badge badge-${riskClass}`}>{j.risk_level} ({j.risk_score})</span>
                      {j.unmanned && (
                        <span className="badge-unmanned">UNMANNED</span>
                      )}
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      ID: {j.location_id} · Zone: {j.zone} · Station: {j.police_station}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '13px' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '2px' }}>Contributing Reason:</div>
                    <strong>{j.reason}</strong>
                  </div>

                  <div style={{ textAlign: 'right', minWidth: '130px' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Officers Deployed:</div>
                    <div style={{ fontSize: '14px', marginTop: '2px' }}>
                      Present: <strong style={{ color: j.officers_present === 0 ? 'var(--color-red)' : 'inherit' }}>{j.officers_present}</strong> · 
                      Recommended: <strong style={{ color: 'var(--color-green)' }}>{j.recommended_officers}</strong>
                    </div>
                  </div>
                </div>

                {/* Overrides Desk */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '280px' }}>
                  <div className="override-actions" style={{ gap: '6px' }}>
                    <button className="btn-override accept" style={{ padding: '6px' }} onClick={() => handleAction(j.location_id, 'Accept')}>
                      Accept
                    </button>
                    <button className="btn-override modify" style={{ padding: '6px' }} onClick={() => {
                      const val = prompt("Enter custom number of officers to deploy:", j.recommended_officers);
                      if (val !== null) handleAction(j.location_id, 'Modify', parseInt(val) || 0);
                    }}>
                      Modify
                    </button>
                    <button className="btn-override reject" style={{ padding: '6px' }} onClick={() => handleAction(j.location_id, 'Reject')}>
                      Reject
                    </button>
                  </div>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Log justification comment..."
                    style={{ fontSize: '11px', padding: '4px 8px' }}
                    value={commentInputs[j.location_id] || ""}
                    onChange={(e) => handleCommentChange(j.location_id, e.target.value)}
                  />
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Deployments;
