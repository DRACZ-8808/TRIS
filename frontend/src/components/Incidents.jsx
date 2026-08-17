import React, { useState } from 'react';
import { AlertCircle, Trash2, Plus, Zap } from 'lucide-react';

const Incidents = ({ incidents, junctions, onInject, onClearAll }) => {
  const [targetId, setTargetId] = useState("");
  const [incType, setIncType] = useState("accident");
  const [severity, setSeverity] = useState(80);
  const [desc, setDesc] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!targetId) {
      alert("Please select a target junction first");
      return;
    }
    onInject({
      location_id: targetId,
      type: incType,
      severity: parseInt(severity),
      description: desc || `Simulated ${incType} incident`
    });
    setDesc("");
  };

  return (
    <div className="view-panel">
      <div className="view-header">
        <div>
          <h2>Incident Injector (Live Room Control)</h2>
          <p>Mutate the live dashboard state by injecting road bottlenecks, crashes, or severe storms.</p>
        </div>
        {incidents.length > 0 && (
          <button className="btn-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={onClearAll}>
            <Trash2 size={16} /> Clear All Incidents
          </button>
        )}
      </div>

      <div className="grid-2-col">
        {/* Injector Form */}
        <div className="dashboard-card" style={{ padding: '24px' }}>
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} color="var(--accent-blue)" /> Inject New Incident
          </h3>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label>Target Junction:</label>
              <select className="form-select" value={targetId} onChange={(e) => setTargetId(e.target.value)}>
                <option value="">-- Select Junction --</option>
                {junctions.map(j => (
                  <option key={j.location_id} value={j.location_id}>
                    {j.location_name} (Zone: {j.zone})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Incident Type:</label>
              <select className="form-select" value={incType} onChange={(e) => setIncType(e.target.value)}>
                <option value="accident">Road Accident</option>
                <option value="congestion">Severe Traffic Gridlock</option>
                <option value="event">Festival / VIP Crowd Surge</option>
                <option value="weather">Heavy Torrential Rain</option>
              </select>
            </div>

            <div className="slider-group">
              <div className="slider-label-val">
                <span>Incident Severity Impact:</span>
                <strong>{severity}%</strong>
              </div>
              <input 
                type="range" 
                min="30" 
                max="100" 
                className="form-slider" 
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Incident Details / Notes:</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Minor pileup blocking north lanes"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>

            <button type="submit" className="btn-primary" style={{ padding: '10px', marginTop: '10px' }}>
              Simulate Incident Impact
            </button>
          </form>
        </div>

        {/* Active Incident List */}
        <div className="panel-card" style={{ height: 'auto' }}>
          <div className="panel-header">
            <span>Active Incident Feed ({incidents.length})</span>
          </div>
          <div className="panel-body">
            {incidents.length > 0 ? (
              incidents.map(inc => (
                <div key={inc.incident_id} style={{ display: 'flex', gap: '12px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '16px', borderRadius: '6px' }}>
                  <div style={{ color: 'var(--color-red)', marginTop: '2px' }}>
                    <AlertCircle size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '14px', textTransform: 'capitalize' }}>{inc.type} @ {inc.location_name}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{inc.timestamp}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      {inc.description}
                    </p>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Severity score: <strong style={{ color: 'var(--color-orange)' }}>{inc.severity}%</strong> · ID: {inc.incident_id}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '40px', fontSize: '13px' }}>
                No active incidents currently injected. Use the simulator panel on the left to inject traffic disturbances.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Incidents;
