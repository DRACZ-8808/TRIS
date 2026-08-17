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
    </div>
  );
};

export default Settings;
