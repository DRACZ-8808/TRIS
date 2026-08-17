import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ShieldAlert, AlertOctagon, Check, UserCheck, X } from 'lucide-react';

// Custom component to adjust map view based on coordinates
const ChangeMapView = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.setView(coords, 14, { animate: true });
    }
  }, [coords, map]);
  return null;
};

const LiveMap = ({ junctions, onOverride }) => {
  const [selectedJunction, setSelectedJunction] = useState(null);
  const [selectedZone, setSelectedZone] = useState("All");
  const [jDetails, setJDetails] = useState(null);
  const [modifyVal, setModifyVal] = useState(2);
  const [commentVal, setCommentVal] = useState("");

  const zones = ["All", ...new Set(junctions.map(j => j.zone))];

  // Fetch detailed junction data when clicked
  useEffect(() => {
    if (selectedJunction) {
      fetch(`http://localhost:5000/api/junctions/${selectedJunction.location_id}`)
        .then(res => res.json())
        .then(data => {
          setJDetails(data);
          setModifyVal(data.recommended_officers);
          setCommentVal("");
        })
        .catch(err => console.error("Error fetching junction details:", err));
    } else {
      setJDetails(null);
    }
  }, [selectedJunction]);

  // Filter junctions by zone
  const filteredJunctions = selectedZone === "All"
    ? junctions
    : junctions.filter(j => j.zone === selectedZone);

  // Helper to create Leaflet HTML DivIcon with pulsing color
  const getMarkerIcon = (riskLevel, id) => {
    let colorClass = "marker-green";
    if (riskLevel === "Yellow") colorClass = "marker-yellow";
    else if (riskLevel === "Orange") colorClass = "marker-orange";
    else if (riskLevel === "Red") colorClass = "marker-red";

    return L.divIcon({
      className: `custom-pulsing-marker ${colorClass}`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      html: `<div style="line-height: 24px; text-align: center;">${id.replace('J', '')}</div>`
    });
  };

  const handleAction = (action, val) => {
    if (!selectedJunction) return;
    onOverride(selectedJunction.location_id, action, val, commentVal);
    // Optimistic local update
    setSelectedJunction(prev => ({
      ...prev,
      officers_present: action === 'Accept' ? prev.recommended_officers : (action === 'Modify' ? val : prev.officers_present)
    }));
  };

  return (
    <div className="view-panel" style={{ padding: '24px 0 0 24px', flex: 1, flexDirection: 'row', gap: '0' }}>
      
      {/* Map Column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '24px', paddingBottom: '24px' }}>
        <div className="view-header">
          <div>
            <h2>Live Map</h2>
            <p>Nagpur City tactical risk heatmap and police deployment visualization.</p>
          </div>
          <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
            <label style={{ margin: 0 }}>Zone Filter:</label>
            <select className="form-select" value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)}>
              {zones.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
        </div>

        <div className="map-container-wrapper" style={{ flex: 1, minHeight: '400px' }}>
          <MapContainer 
            center={[21.1458, 79.0882]} 
            zoom={12} 
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            {filteredJunctions.map(j => (
              <Marker
                key={j.location_id}
                position={[j.latitude, j.longitude]}
                icon={getMarkerIcon(j.risk_level, j.location_id)}
                eventHandlers={{
                  click: () => {
                    setSelectedJunction(j);
                  },
                }}
              >
                <Popup>
                  <div style={{ color: '#000', fontWeight: 'bold' }}>
                    {j.location_name}<br/>
                    Risk Level: {j.risk_level} ({j.risk_score})
                  </div>
                </Popup>
              </Marker>
            ))}

            {selectedJunction && (
              <ChangeMapView coords={[selectedJunction.latitude, selectedJunction.longitude]} />
            )}
          </MapContainer>

          <div className="legend-container" style={{ position: 'absolute', bottom: '16px', left: '16px', zIndex: 1000 }}>
            <div className="legend-item"><span className="legend-dot green"></span> Low (0-30)</div>
            <div className="legend-item"><span className="legend-dot yellow"></span> Moderate (31-55)</div>
            <div className="legend-item"><span className="legend-dot orange"></span> High (56-75)</div>
            <div className="legend-item"><span className="legend-dot red"></span> Critical (76-100)</div>
          </div>
        </div>
      </div>

      {/* Side Inspect Panel Column */}
      <div className="panel-card" style={{ width: '400px', borderLeft: '1px solid var(--border-light)', borderRadius: 0 }}>
        <div className="panel-header">
          <span>Junction Inspection</span>
          {selectedJunction && (
            <button className="btn-secondary" style={{ padding: '4px' }} onClick={() => setSelectedJunction(null)}>
              <X size={16} />
            </button>
          )}
        </div>
        <div className="panel-body">
          {selectedJunction ? (
            <div className="inspection-card">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h3 style={{ fontFamily: 'Outfit, sans-serif' }}>{selectedJunction.location_name}</h3>
                  <span className={`badge badge-${selectedJunction.risk_level.toLowerCase()}`}>
                    {selectedJunction.risk_level} ({selectedJunction.risk_score})
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  ID: {selectedJunction.location_id} · Zone: {selectedJunction.zone} · Station: {selectedJunction.police_station}
                </p>
              </div>

              {selectedJunction.unmanned && (
                <div className="badge-unmanned" style={{ textAlign: 'center', padding: '6px' }}>
                  UNMANNED CRITICAL RISK ALERT
                </div>
              )}

              {/* Contributing factors text */}
              <div className={selectedJunction.risk_level === 'Red' ? 'reason-alert' : 'reason-normal'}>
                <strong>Contributing Factors: </strong> {selectedJunction.reason}
              </div>

              {/* Risk contributors score grids */}
              {jDetails && (
                <div>
                  <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Risk Factor Breakdown</h4>
                  <div className="factor-grid">
                    <div className="factor-item">
                      <span className="label">Congestion</span>
                      <span className="val" style={{ color: jDetails.factors.congestion > 70 ? 'var(--color-red)' : 'inherit' }}>
                        {jDetails.factors.congestion}%
                      </span>
                    </div>
                    <div className="factor-item">
                      <span className="label">Accident Severity</span>
                      <span className="val" style={{ color: jDetails.factors.accident_severity > 50 ? 'var(--color-red)' : 'inherit' }}>
                        {jDetails.factors.accident_severity}%
                      </span>
                    </div>
                    <div className="factor-item">
                      <span className="label">Violations</span>
                      <span className="val">{jDetails.factors.violations}%</span>
                    </div>
                    <div className="factor-item">
                      <span className="label">Historical Risk</span>
                      <span className="val">{jDetails.factors.historical_risk}%</span>
                    </div>
                    <div className="factor-item">
                      <span className="label">Crowd Surge</span>
                      <span className="val">{jDetails.factors.crowd_score}%</span>
                    </div>
                    <div className="factor-item">
                      <span className="label">Weather (Rain)</span>
                      <span className="val">{jDetails.factors.rain_flag ? 'Active' : 'Dry'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Force Deployment */}
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-light)', padding: '16px', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserCheck size={16} /> Deployments & Recommendation
                </h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                  <span>Currently Assigned:</span>
                  <span className="bold">{selectedJunction.officers_present} officers</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '12px' }}>
                  <span>System Recommended:</span>
                  <span className="bold" style={{ color: 'var(--color-green)' }}>{selectedJunction.recommended_officers} officers</span>
                </div>

                <div className="override-actions" style={{ marginTop: '16px', flexDirection: 'column', gap: '10px' }}>
                  <button className="btn-override accept" onClick={() => handleAction('Accept')}>
                    Accept System Recommendation
                  </button>
                  
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input 
                      type="number" 
                      className="form-input" 
                      style={{ width: '60px', padding: '6px' }}
                      value={modifyVal}
                      onChange={(e) => setModifyVal(parseInt(e.target.value) || 0)}
                    />
                    <button className="btn-override modify" style={{ flex: 1 }} onClick={() => handleAction('Modify', modifyVal)}>
                      Modify & Reallocate
                    </button>
                  </div>
                  
                  <button className="btn-override reject" onClick={() => handleAction('Reject')}>
                    Reject Recommendation
                  </button>

                  <div className="form-group" style={{ marginTop: '10px' }}>
                    <label>Log justification note:</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Cleared lane, dispatched unit"
                      value={commentVal}
                      onChange={(e) => setCommentVal(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '40px', fontSize: '13px' }}>
              Select a junction marker on the live map to inspect active risk metrics, deployment details, and override recommendations.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default LiveMap;
