import React from 'react';
import { Sliders, ShieldCheck } from 'lucide-react';

const Settings = () => {
  return (
    <div className="view-panel">
      <div className="view-header">
        <div>
          <h2>Settings & Configuration</h2>
          <p>Read-only parameter specifications of the Nagpur Traffic AI Decision Support system.</p>
        </div>
      </div>

      <div className="grid-2-col">
        {/* Risk Weights Config Card */}
        <div className="dashboard-card" style={{ padding: '24px' }}>
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={18} color="var(--accent-blue)" /> Risk Formula Coefficient Weights
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span>Congestion Level Coefficient:</span>
              <strong>0.25 (25%)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span>Accident Severity Coefficient:</span>
              <strong>0.20 (20%)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span>Traffic Violations Coefficient:</span>
              <strong>0.15 (15%)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span>Historical Zone Accident Rate:</span>
              <strong>0.15 (15%)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span>Pedestrian / Crowd Density Rate:</span>
              <strong>0.10 (10%)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span>VIP Movement / Public Event Flag:</span>
              <strong>0.10 (10% - adds 10 score)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span>Weather (Rainfall / Storms) Flag:</span>
              <strong>0.05 (5% - adds 5 score)</strong>
            </div>
          </div>
        </div>

        {/* Risk Classification Thresholds Card */}
        <div className="dashboard-card" style={{ padding: '24px' }}>
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} color="var(--color-green)" /> Alert Classification Thresholds
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
              <span className="badge badge-green" style={{ width: '80px', textAlign: 'center' }}>Green</span>
              <span>Low risk (0 to 30) - Standard 1 field officer presence</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
              <span className="badge badge-yellow" style={{ width: '80px', textAlign: 'center' }}>Yellow</span>
              <span>Moderate risk (31 to 55) - Standard 2 field officers presence</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
              <span className="badge badge-orange" style={{ width: '80px', textAlign: 'center' }}>Orange</span>
              <span>High risk (56 to 75) - Recommended 3 field officers presence</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
              <span className="badge badge-red" style={{ width: '80px', textAlign: 'center' }}>Red</span>
              <span>Critical risk (76 to 100) - Escalation protocol, pull buffer officers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Officer Allocation & Balancing Rules */}
      <div className="dashboard-card" style={{ padding: '24px', marginTop: '24px' }}>
        <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={18} color="var(--accent-blue)" /> Fixed Zone Officer Allocation & Balancing Rules
        </h3>

        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6', marginBottom: '16px' }}>
          To maintain strict operational constraints, the total number of field personnel in any zone is **strictly fixed at 10 officers**, and the deployment at any single junction is **capped at a maximum of 10 officers**. If an operator overrides a junction deployment (e.g. manually adds or subtracts officers), the system automatically balances the pool by adjusting deployments at other junctions in the same zone.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
              Rule 1: Surplus Reduction Protocol (Too many officers)
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '8px' }}>
              When adding officers to a junction (creating a surplus in the zone's active pool), officers are drawn/removed from other junctions in the following priority order:
            </p>
            <ol style={{ fontSize: '11px', color: 'var(--text-secondary)', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li><strong>Centroid Buffer Junction</strong>: Drawn first (e.g. Panchsheel Sq J002 centroid in Sitabuldi).</li>
              <li><strong>Green Alert Junctions</strong>: Lowest risk score first.</li>
              <li><strong>Yellow Alert Junctions</strong>: Lowest risk score first.</li>
              <li><strong>Orange Alert Junctions</strong>: Lowest risk score first.</li>
              <li><strong>Red Alert Junctions</strong>: Lowest risk score first.</li>
            </ol>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
              Rule 2: Deficit Distribution Protocol (Too few officers)
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '8px' }}>
              When removing officers from a junction (creating a deficit in the zone's active pool), officers are distributed/added to other junctions in the following priority order:
            </p>
            <ol style={{ fontSize: '11px', color: 'var(--text-secondary)', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li><strong>Red Alert Junctions</strong>: Highest risk score first.</li>
              <li><strong>Orange Alert Junctions</strong>: Highest risk score first.</li>
              <li><strong>Yellow Alert Junctions</strong>: Highest risk score first.</li>
              <li><strong>Green Alert Junctions</strong>: Highest risk score first.</li>
              <li><strong>Centroid Buffer Junction</strong>: Receives additional surplus last.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
