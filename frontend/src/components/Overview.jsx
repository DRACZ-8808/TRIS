import React from 'react';
import { ShieldAlert, UserCheck, AlertOctagon, Map, Zap } from 'lucide-react';

const Overview = ({ data, onTabChange }) => {
  return (
    <div className="view-panel">
      <div className="view-header">
        <div>
          <h2>Home / Command Center</h2>
          <p>City-wide real-time traffic risk assessment and force deployment overview.</p>
        </div>
        <div className="status-indicator">
          <span className="status-dot"></span>
          LIVE MONITORING ACTIVE
        </div>
      </div>

      <div className="grid-4">
        {/* Card 1: Total Monitored Junctions */}
        <div className="dashboard-card stat-card" style={{ cursor: 'pointer' }} onClick={() => onTabChange("Live map")}>
          <div className="icon-wrapper">
            <Map size={20} />
          </div>
          <span className="lbl">Monitored Junctions</span>
          <span className="val">{data.monitored_junctions || 40}</span>
          <span className="sub">Across Nagpur City (12 Zones)</span>
        </div>

        {/* Card 2: High Risk Junctions */}
        <div className="dashboard-card stat-card high" style={{ cursor: 'pointer' }} onClick={() => onTabChange("Deployments")}>
          <div className="icon-wrapper">
            <ShieldAlert size={20} />
          </div>
          <span className="lbl">High Risk Junctions</span>
          <span className="val">{data.high_risk_count || 0}</span>
          <span className="sub">Require Operator Attention</span>
        </div>

        {/* Card 3: Critical Bottlenecks */}
        <div className="dashboard-card stat-card critical" style={{ cursor: 'pointer' }} onClick={() => onTabChange("Deployments")}>
          <div className="icon-wrapper">
            <AlertOctagon size={20} />
          </div>
          <span className="lbl">Critical Bottlenecks</span>
          <span className="val">{data.critical_count || 0}</span>
          <span className="sub">Immediate Red Alerts Active</span>
        </div>

        {/* Card 4: Active Police Personnel */}
        <div className="dashboard-card stat-card unmanned">
          <div className="icon-wrapper">
            <UserCheck size={20} />
          </div>
          <span className="lbl">Active Personnel Ratio</span>
          <span className="val" style={{ fontSize: '24px', marginTop: '6px' }}>
            {data.deployed_officers || 0} / {data.available_officers + data.deployed_officers || 516}
          </span>
          <span className="sub">Deployed / Sanctioned Strength</span>
        </div>
      </div>

      {/* Row 2: Visual layout of System Status */}
      <div className="dashboard-card" style={{ padding: '24px', flex: 1 }}>
        <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', marginBottom: '12px' }}>Operational Overview</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', marginBottom: '16px' }}>
          The AI-based Traffic Risk Scoring and Personnel Deployment Engine automatically re-ranks traffic junctions every hour. When a junction risk surges (due to congestion, accidents, violations, rain, or crowding), the allocation algorithm recommends moving officers from low-risk areas or drawing from centroid buffer zones to resolve gaps.
        </p>
        
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '250px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={14} color="var(--color-red)" /> Injected Incidents ({data.active_incidents || 0})
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Simulated live crashes or road blocks are immediately factored into live risk levels and officer dispatch loops. Use the "Incidents" tab to test this functionality.
            </p>
          </div>

          <div style={{ flex: 1, minWidth: '250px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertOctagon size={14} color="var(--color-yellow)" /> Unmanned Alerts ({data.unmanned_count || 0})
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Any critical (Red) or high-risk (Orange) junction currently with zero field personnel assigned triggers an unmanned alert badge requiring dispatcher approval.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
