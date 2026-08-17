import React, { useState } from 'react';
import { Play, RotateCcw, AlertTriangle, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';

const Simulator = ({ junctions }) => {
  const [targetId, setTargetId] = useState("");
  const [scenarioType, setScenarioType] = useState("Road accident");
  const [simResults, setSimResults] = useState(null);
  
  // Custom slider values (only used when scenarioType === "Custom")
  const [congestionVal, setCongestionVal] = useState(80);
  const [accidentVal, setAccidentVal] = useState(0);
  const [crowdVal, setCrowdVal] = useState(30);
  const [rainFlag, setRainFlag] = useState(false);
  const [eventFlag, setEventFlag] = useState(false);

  const handleRun = (e) => {
    e.preventDefault();
    if (!targetId) {
      alert("Please select a target junction first");
      return;
    }

    const payload = {
      target_id: targetId,
      type: scenarioType
    };

    if (scenarioType === "Custom") {
      payload.sliders = {
        congestion_score: parseInt(congestionVal),
        accident_severity: parseInt(accidentVal),
        crowd_score: parseInt(crowdVal),
        rain_flag: rainFlag,
        special_event: eventFlag
      };
    }

    fetch('http://localhost:5000/api/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        setSimResults(data);
      })
      .catch(err => console.error("Error running simulation:", err));
  };

  const handleReset = () => {
    setSimResults(null);
    setTargetId("");
  };

  return (
    <div className="view-panel">
      <div className="view-header">
        <div>
          <h2>Simulator Sandbox</h2>
          <p>Model hypothetical scenarios and preview cascading risk updates and deployment changes.</p>
        </div>
        {simResults && (
          <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={handleReset}>
            <RotateCcw size={16} /> Reset Sandbox
          </button>
        )}
      </div>

      <div className="grid-2-col" style={{ gridTemplateColumns: simResults ? '350px 1fr' : '1fr' }}>
        
        {/* Left Column: Sandbox Config Panel */}
        <div className="dashboard-card" style={{ padding: '24px', height: 'fit-content' }}>
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Scenario Configurator
          </h3>
          
          <form onSubmit={handleRun} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label>Select Target Junction:</label>
              <select className="form-select" value={targetId} onChange={(e) => setTargetId(e.target.value)} disabled={!!simResults}>
                <option value="">-- Choose Junction --</option>
                {junctions.map(j => (
                  <option key={j.location_id} value={j.location_id}>
                    {j.location_name} ({j.zone})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Choose Preset Scenario:</label>
              <select className="form-select" value={scenarioType} onChange={(e) => setScenarioType(e.target.value)} disabled={!!simResults}>
                <option value="Road accident">Road Accident Preset</option>
                <option value="Festival crowd surge">Festival Surge Preset</option>
                <option value="Heavy rain rush hour">Torrential Rain Preset</option>
                <option value="VIP movement">VIP Escort / Bandobast Preset</option>
                <option value="Custom">Custom Factor Adjustment</option>
              </select>
            </div>

            {/* Custom Sliders Panel */}
            {scenarioType === "Custom" && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid var(--border-light)', paddingTop: '14px' }}>
                <div className="slider-group">
                  <div className="slider-label-val">
                    <span>Congestion:</span>
                    <strong>{congestionVal}%</strong>
                  </div>
                  <input type="range" className="form-slider" min="0" max="100" value={congestionVal} onChange={(e) => setCongestionVal(e.target.value)} disabled={!!simResults} />
                </div>
                
                <div className="slider-group">
                  <div className="slider-label-val">
                    <span>Accident Severity:</span>
                    <strong>{accidentVal}%</strong>
                  </div>
                  <input type="range" className="form-slider" min="0" max="100" value={accidentVal} onChange={(e) => setAccidentVal(e.target.value)} disabled={!!simResults} />
                </div>

                <div className="slider-group">
                  <div className="slider-label-val">
                    <span>Crowd Surge:</span>
                    <strong>{crowdVal}%</strong>
                  </div>
                  <input type="range" className="form-slider" min="0" max="100" value={crowdVal} onChange={(e) => setCrowdVal(e.target.value)} disabled={!!simResults} />
                </div>

                <div style={{ display: 'flex', gap: '20px', fontSize: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input type="checkbox" checked={rainFlag} onChange={(e) => setRainFlag(e.target.checked)} disabled={!!simResults} /> Rain Active
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input type="checkbox" checked={eventFlag} onChange={(e) => setEventFlag(e.target.checked)} disabled={!!simResults} /> Special Event
                  </label>
                </div>
              </div>
            )}

            {!simResults ? (
              <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }}>
                <Play size={16} /> Run Scenario Simulation
              </button>
            ) : (
              <button type="button" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }} onClick={handleReset}>
                <RotateCcw size={16} /> Discard & Reset
              </button>
            )}
          </form>
        </div>

        {/* Right Column: Sandbox Simulation Results */}
        {simResults ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Reaction Summary Card */}
            <div className="dashboard-card" style={{ borderLeft: '4px solid var(--color-orange)' }}>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Simulation Results Summary
              </h3>
              
              <div className="sim-before-after" style={{ marginTop: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Before Risk Score</div>
                  <div style={{ fontSize: '24px', fontWeight: 800 }}>{simResults.before.risk_score}</div>
                  <span className={`badge badge-${simResults.before.risk_level.toLowerCase()}`} style={{ fontSize: '9px', padding: '2px 6px', marginTop: '4px' }}>
                    {simResults.before.risk_level}
                  </span>
                </div>

                <div className="arrow-icon">
                  <ArrowRight size={24} />
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>After Risk Score</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-orange)' }}>{simResults.after.risk_score}</div>
                  <span className={`badge badge-${simResults.after.risk_level.toLowerCase()}`} style={{ fontSize: '9px', padding: '2px 6px', marginTop: '4px' }}>
                    {simResults.after.risk_level}
                  </span>
                </div>
              </div>

              {/* Rank Change details */}
              <div className="sim-delta-badge" style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <span>Junction Risk Ranking Priority:</span>
                <span className="diff up" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px' }}>
                  Rank {simResults.before.rank} <ArrowRight size={14} /> Rank {simResults.after.rank} 
                  {simResults.after.rank < simResults.before.rank ? (
                    <ArrowUp size={16} color="var(--color-red)" />
                  ) : (
                    <ArrowDown size={16} color="var(--color-green)" />
                  )}
                </span>
              </div>
            </div>

            {/* Cascading Effects Warn */}
            {simResults.neighbor && (
              <div className="dashboard-card" style={{ borderLeft: '4px solid var(--accent-blue)', padding: '16px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  Cascading Zone Traffic Impact
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Diverted traffic from the incident target junction is simulated to raise congestion at nearby <strong>{simResults.neighbor.location_name}</strong>.
                  Risk score rises from <strong>{simResults.neighbor.before_risk}</strong> to <strong>{simResults.neighbor.after_risk}</strong>.
                  AI Deployment shifts recommended officers from <strong>{simResults.neighbor.before_recommended}</strong> to <strong>{simResults.neighbor.after_recommended}</strong>.
                </p>
              </div>
            )}

            {/* Re-allocation Moves */}
            <div className="panel-card" style={{ height: 'auto' }}>
              <div className="panel-header">
                <span>Recommended Officer Movements</span>
              </div>
              <div className="panel-body">
                {simResults.recommended_moves.length > 0 ? (
                  simResults.recommended_moves.map((move, idx) => (
                    <div key={idx} style={{ display: 'flex', itemsAlign: 'center', gap: '12px', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-light)', padding: '12px', borderRadius: '6px' }}>
                      <div className="police-logo" style={{ width: '32px', height: '32px', fontSize: '10px' }}>NP</div>
                      <div style={{ flex: 1, fontSize: '13px' }}>
                        <div>
                          Move <strong style={{ color: 'var(--color-green)' }}>{move.officers_count} Officers</strong> from <strong>{move.from_name}</strong> &rarr; <strong>{move.location_name}</strong>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{move.reason}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '12px', textAlign: 'center', padding: '10px' }}>
                    No personnel movements required. Baseline deployments remain optimal for this scenario.
                  </div>
                )}
              </div>
            </div>

            {/* New Unmanned Created */}
            {simResults.new_unmanned_created.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-red)', padding: '12px', borderRadius: '6px', fontSize: '13px', color: 'var(--color-red)' }}>
                <AlertTriangle size={18} />
                <div>
                  <strong>WARNING:</strong> This scenario creates a new unmanned high-risk location at: <strong>{simResults.new_unmanned_created.join(', ')}</strong>
                </div>
              </div>
            )}

          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', background: 'var(--bg-secondary)', border: '1px dashed var(--border-light)', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
            Set a target junction and trigger a preset or custom scenario above to run the sandbox deployment simulation.
          </div>
        )}

      </div>
    </div>
  );
};

export default Simulator;
