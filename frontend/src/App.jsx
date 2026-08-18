import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Map,
  UserCheck,
  Zap,
  PlayCircle,
  FileText,
  Sliders,
  Bell,
  ShieldAlert,
  Search,
  BarChart2
} from 'lucide-react';

import Overview from './components/Overview';
import LiveMap from './components/LiveMap';
import Deployments from './components/Deployments';
import Incidents from './components/Incidents';
import Simulator from './components/Simulator';
import Reports from './components/Reports';
import Settings from './components/Settings';

function App() {
  const [activeTopTab, setActiveTopTab] = useState("Home / Command Center");
  const [activeLeftTab, setActiveLeftTab] = useState("Overview");

  const [junctions, setJunctions] = useState([]);
  const [overviewData, setOverviewData] = useState({});
  const [reportsLogs, setReportsLogs] = useState([]);
  const [dateTimeStr, setDateTimeStr] = useState("");

  // Live timer for top bar clock
  useEffect(() => {
    const updateTime = () => {
      const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      };
      setDateTimeStr(new Date().toLocaleString('en-US', options) + " IST");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch live dashboard states from express server
  const fetchState = () => {
    fetch('http://localhost:5000/api/junctions')
      .then(res => res.json())
      .then(data => setJunctions(data))
      .catch(err => console.error("Error fetching junctions:", err));

    fetch('http://localhost:5000/api/overview')
      .then(res => res.json())
      .then(data => setOverviewData(data))
      .catch(err => console.error("Error fetching overview:", err));

    fetch('http://localhost:5000/api/reports')
      .then(res => res.json())
      .then(data => setReportsLogs(data))
      .catch(err => console.error("Error fetching reports:", err));
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  // API Mutators
  const handleInjectIncident = (payload) => {
    fetch('http://localhost:5000/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(() => fetchState())
      .catch(err => console.error("Error injecting incident:", err));
  };

  const handleClearAllIncidents = () => {
    fetch('http://localhost:5000/api/incidents', {
      method: 'DELETE'
    })
      .then(res => res.json())
      .then(() => fetchState())
      .catch(err => console.error("Error clearing incidents:", err));
  };

  const handleOverride = (locationId, action, value, comment) => {
    fetch('http://localhost:5000/api/overrides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location_id: locationId,
        action,
        value,
        comment
      })
    })
      .then(res => res.json())
      .then(() => fetchState())
      .catch(err => console.error("Error recording override:", err));
  };

  // Render left panel view based on activeLeftTab
  const renderLeftPanel = () => {
    switch (activeLeftTab) {
      case "Overview":
        return <Overview data={overviewData} junctions={junctions} onTabChange={setActiveLeftTab} />;
      case "Live map":
        return <LiveMap junctions={junctions} onOverride={handleOverride} />;
      case "Deployments":
        return <Deployments junctions={junctions} onOverride={handleOverride} />;
      case "Report Incidents":
        return (
          <Incidents
            incidents={overviewData.incidents || []}
            junctions={junctions}
            onInject={handleInjectIncident}
            onClearAll={handleClearAllIncidents}
          />
        );
      case "Simulator":
        return <Simulator junctions={junctions} />;
      case "Audit Logs":
        return <Reports logs={reportsLogs} />;
      case "Settings":
        return <Settings />;
      default:
        return <Overview data={overviewData} junctions={junctions} onTabChange={setActiveLeftTab} />;
    }
  };

  // Render stub pages for other top navigation tabs
  const renderStubPage = (title, desc) => {
    return (
      <div className="view-panel">
        <div className="view-header">
          <div>
            <h2>{title}</h2>
            <p>{desc}</p>
          </div>
        </div>
        <div className="dashboard-card" style={{ padding: '40px', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldAlert size={48} color="var(--accent-blue)" style={{ marginBottom: '16px' }} />
          <h3 style={{ marginBottom: '8px' }}>Page Sandbox Placeholder</h3>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '500px', fontSize: '13px' }}>
            This tab is outside the core deliverables of this mock phase. Full live analytics modules will be linked here in future releases. Use the **Home / Command Center** tab to interact with live deployment feeds.
          </p>
        </div>
        {title === "Junctions" && (
          <div className="dashboard-card" style={{ padding: '20px' }}>
            <h4 style={{ marginBottom: '12px' }}>Registered Nagpur Junctions ({junctions.length})</h4>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Junction Name</th>
                    <th>Zone</th>
                    <th>Coordinates</th>
                    <th>Police Station</th>
                  </tr>
                </thead>
                <tbody>
                  {junctions.map(j => (
                    <tr key={j.location_id}>
                      <td>{j.location_id}</td>
                      <td><strong>{j.location_name}</strong></td>
                      <td>{j.zone}</td>
                      <td>{j.latitude}, {j.longitude}</td>
                      <td>{j.police_station}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="app-container">

      {/* Top Header Bar */}
      <div className="topbar">
        <div className="topbar-left">
          <div className="police-logo">NP</div>
          <div className="topbar-title-block">
            <h1>Nagpur Traffic Intelligence</h1>
            <p>TRAFFIC RISK INTELLIGENCE SYSTEM</p>
          </div>
        </div>

        <div className="topbar-right">
          <div className="status-indicator">
            <span className="status-dot"></span>
            SYSTEM ACTIVE
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>
            {dateTimeStr}
          </div>
          <div className="bell-icon-container" onClick={() => setActiveLeftTab("Report Incidents")}>
            <Bell size={18} />
            {(overviewData.active_incidents > 0) && (
              <span className="bell-badge">{overviewData.active_incidents}</span>
            )}
          </div>
          <div className="topbar-operator">
            <span className="name">Inspector Rajesh Kumar</span>
            <span className="role">Control Room Dispatcher</span>
          </div>
        </div>
      </div>

      {/* Nav Tab Buttons */}
      <div className="nav-tabs">
        {["Home / Command Center", "Junctions", "Analytics"].map(tab => (
          <button
            key={tab}
            className={`tab-btn ${activeTopTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTopTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Workspace Frame */}
      <div className="workspace-container">

        {activeTopTab === "Home / Command Center" ? (
          <>
            {/* Sidebar Menu */}
            <div className="sidebar">
              <div className="sidebar-menu">
                <button
                  className={`sidebar-item ${activeLeftTab === 'Overview' ? 'active' : ''}`}
                  onClick={() => setActiveLeftTab("Overview")}
                >
                  <LayoutDashboard size={16} /> Overview
                </button>
                <button
                  className={`sidebar-item ${activeLeftTab === 'Live map' ? 'active' : ''}`}
                  onClick={() => setActiveLeftTab("Live map")}
                >
                  <Map size={16} /> Live map
                </button>
                <button
                  className={`sidebar-item ${activeLeftTab === 'Deployments' ? 'active' : ''}`}
                  onClick={() => setActiveLeftTab("Deployments")}
                >
                  <UserCheck size={16} /> Deployments
                </button>
                <button
                  className={`sidebar-item ${activeLeftTab === 'Report Incidents' ? 'active' : ''}`}
                  onClick={() => setActiveLeftTab("Report Incidents")}
                >
                  <Zap size={16} /> Report Incidents
                </button>
                <button
                  className={`sidebar-item ${activeLeftTab === 'Simulator' ? 'active' : ''}`}
                  onClick={() => setActiveLeftTab("Simulator")}
                >
                  <PlayCircle size={16} /> Simulator
                </button>
                <button
                  className={`sidebar-item ${activeLeftTab === 'Audit Logs' ? 'active' : ''}`}
                  onClick={() => setActiveLeftTab("Audit Logs")}
                >
                  <FileText size={16} /> Audit Logs
                </button>
                <button
                  className={`sidebar-item ${activeLeftTab === 'Settings' ? 'active' : ''}`}
                  onClick={() => setActiveLeftTab("Settings")}
                >
                  <Sliders size={16} /> Settings
                </button>
              </div>

              <div className="sidebar-footer">
                Simulated data · Human approval required for deployment actions.
              </div>
            </div>

            {/* Left Nav Main Sub-view content */}
            {renderLeftPanel()}
          </>
        ) : (
          /* Stub pages content */
          null
        )}

        {activeTopTab === "Junctions" && renderStubPage("Junctions", "View, filter, and inspect city traffic junctions list.")}
        {activeTopTab === "Analytics" && renderStubPage("Analytics", "Strategic analysis of city-wide average congestion, speed, and accident trends.")}

      </div>
    </div>
  );
}

export default App;
