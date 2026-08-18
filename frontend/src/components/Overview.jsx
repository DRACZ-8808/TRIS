import React from 'react';
import { ShieldAlert, UserCheck, AlertOctagon, Map, Zap } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';

const Overview = ({ data, junctions = [], onTabChange }) => {
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
            {data.deployed_officers || 0} / {data.available_officers + data.deployed_officers || 120}
          </span>
          <span className="sub">Deployed / Sanctioned Strength</span>
        </div>
      </div>

      {/* Row 2: Operational Overview & Mini Map Grid */}
      <div className="grid-2-col" style={{ flex: 1, minHeight: '380px' }}>
        
        {/* Left Column: Mini Heatmap Snapshot */}
        <div 
          className="dashboard-card" 
          style={{ 
            padding: '20px', 
            position: 'relative', 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px' }}>Live Map Snapshot</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-green)', display: 'inline-block', animation: 'pulse-green 2s infinite' }}></span> Click map to expand
            </span>
          </div>

          <div style={{ flex: 1, borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-light)', position: 'relative' }}>
            <MapContainer 
              center={[21.1458, 79.0882]} 
              zoom={11} 
              zoomControl={false}
              dragging={false}
              doubleClickZoom={false}
              scrollWheelZoom={false}
              boxZoom={false}
              keyboard={false}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              />
              {junctions.map(j => {
                let color = "var(--color-green)";
                if (j.risk_level === "Yellow") color = "var(--color-yellow)";
                else if (j.risk_level === "Orange") color = "var(--color-orange)";
                else if (j.risk_level === "Red") color = "var(--color-red)";

                const icon = L.divIcon({
                  className: 'mini-map-marker',
                  iconSize: [10, 10],
                  iconAnchor: [5, 5],
                  html: `<div style="background-color: ${color}; width: 100%; height: 100%; border-radius: 50%; border: 1.5px solid #fff; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`
                });

                return (
                  <Marker
                    key={j.location_id}
                    position={[j.latitude, j.longitude]}
                    icon={icon}
                  />
                );
              })}
            </MapContainer>

            {/* Click intercept overlay */}
            <div 
              onClick={() => onTabChange("Live map")}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 1000,
                background: 'rgba(0, 0, 0, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              className="map-click-overlay"
            >
              <div className="overlay-msg" style={{
                background: 'rgba(0, 26, 114, 0.95)',
                color: '#fff',
                padding: '10px 18px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <Map size={16} /> Open Interactive Live Map
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Force Deployment Snapshot */}
        <div 
          className="dashboard-card" 
          style={{ 
            padding: '20px', 
            position: 'relative', 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px' }}>Force Deployment Snapshot</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-blue)', display: 'inline-block', animation: 'pulse-green 2s infinite' }}></span> Click map to expand
            </span>
          </div>

          <div style={{ flex: 1, borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-light)', position: 'relative' }}>
            <MapContainer 
              center={[21.1458, 79.0882]} 
              zoom={11} 
              zoomControl={false}
              dragging={false}
              doubleClickZoom={false}
              scrollWheelZoom={false}
              boxZoom={false}
              keyboard={false}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              />
              {junctions.map(j => {
                const count = j.officers_present;
                let bg = "#001a72";
                let border = "#fff";
                let textCol = "#fff";
                let cls = "mini-officer-marker";

                if (j.unmanned) {
                  bg = "var(--color-red)";
                  border = "var(--color-red)";
                  cls += " flashing-red";
                }

                const icon = L.divIcon({
                  className: cls,
                  iconSize: [18, 18],
                  iconAnchor: [9, 9],
                  html: `<div style="background-color: ${bg}; color: ${textCol}; border: 1.5px solid ${border}; width: 100%; height: 100%; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: bold; box-shadow: 0 0 4px rgba(0,0,0,0.5);">${count}</div>`
                });

                return (
                  <Marker
                    key={j.location_id}
                    position={[j.latitude, j.longitude]}
                    icon={icon}
                  />
                );
              })}
            </MapContainer>

            {/* Click intercept overlay */}
            <div 
              onClick={() => onTabChange("Deployments")}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 1000,
                background: 'rgba(0, 0, 0, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              className="map-click-overlay-deploy"
            >
              <div className="overlay-msg" style={{
                background: 'rgba(0, 26, 114, 0.95)',
                color: '#fff',
                padding: '10px 18px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <UserCheck size={16} /> Open Deployments Control
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <div style={{ flex: 1, background: 'rgba(0,0,0,0.01)', border: '1px solid var(--border-light)', padding: '6px 10px', borderRadius: '4px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#001a72' }}></span>
              <span style={{ color: 'var(--text-secondary)' }}>Blue: Assigned Officers</span>
            </div>
            <div style={{ flex: 1, background: 'rgba(0,0,0,0.01)', border: '1px solid var(--border-light)', padding: '6px 10px', borderRadius: '4px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-red)' }}></span>
              <span style={{ color: 'var(--text-secondary)' }}>Red: Unmanned Critical Risk</span>
            </div>
          </div>
        </div>

      </div>

      {/* Row 3: Status Details (Incidents & Unmanned Alerts) */}
      <div className="grid-2-col" style={{ flexShrink: 0 }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', padding: '16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={20} color="var(--color-red)" />
          </div>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Injected Incidents ({data.active_incidents || 0})
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Simulated crashes or blocks are factored into live risk levels. Use the **Report Incidents** tab to inject test events.
            </p>
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', padding: '16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertOctagon size={20} color="var(--color-yellow)" />
          </div>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Unmanned Alerts ({data.unmanned_count || 0})
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Critical or High risk junctions currently with zero personnel assigned require operator override approvals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
