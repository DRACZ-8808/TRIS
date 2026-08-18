const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ['https://tris-silk.vercel.app', 'http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.use(express.json());

// Load static files
const locationsPath = path.join(__dirname, 'data', 'locations.json');
const datasetPath = path.join(__dirname, 'data', 'traffic_dataset.json');

let rawLocations = [];
let rawDataset = [];

try {
  rawLocations = JSON.parse(fs.readFileSync(locationsPath, 'utf8'));
  rawDataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
} catch (e) {
  console.error("Error reading initial datasets. Make sure to run data_generator.js first.", e);
  process.exit(1);
}

// System live state
let currentHour = 19; // Default representative hour (7 PM)
let liveJunctions = [];
let activeIncidents = [];
let overrideLog = [];

// Helper to calculate risk score
const calculateRiskScore = (jState) => {
  const score = (0.25 * jState.congestion_score) +
    (0.20 * jState.accident_severity) +
    (0.15 * jState.violations) +
    (0.15 * jState.historical_risk) +
    (0.10 * jState.crowd_score) +
    (0.10 * (jState.special_event ? 100 : 0)) +
    (0.05 * (jState.rain_flag ? 100 : 0));
  return Math.min(100, Math.max(0, Math.round(score)));
};

const getRiskLevel = (score) => {
  if (score <= 30) return "Green";
  if (score <= 55) return "Yellow";
  if (score <= 75) return "Orange";
  return "Red";
};

// Plain language explanation generator
const getExplanation = (jState) => {
  const factors = [];
  if (jState.accident_severity > 50) factors.push("Active accident");
  if (jState.congestion_score > 70) factors.push("Heavy congestion");
  if (jState.violations > 40) factors.push("High violation rate");
  if (jState.special_event) factors.push("Special event crowd");
  if (jState.rain_flag) factors.push("Heavy rainfall");

  if (factors.length === 0) {
    if (jState.congestion_score > 40) factors.push("Moderate traffic");
    else factors.push("Normal traffic baseline");
  }

  return factors.join(" + ");
};

// Seed/reset live state
const resetToBaseline = () => {
  activeIncidents = [];

  // Filter dataset to currentHour
  const hourlyData = rawDataset.filter(d => d.hour === currentHour);

  liveJunctions = rawLocations.map(loc => {
    const data = hourlyData.find(d => d.location_id === loc.location_id) || {};

    // Seed initial officers present:
    // Effective field strength is 10 per zone. We distribute them.
    // Let's seed initial deployment: some junctions will start at 0 to demonstrate unmanned high-risk states.
    let baseOfficers = 1;

    // Make specific junctions unmanned initially for demo purposes
    if (loc.location_id === "J001" || loc.location_id === "J008" || loc.location_id === "J012") {
      baseOfficers = 0;
    } else if (loc.zone === "Sitabuldi") {
      // Sitabuldi: total pool 10. Variety(0), Panchsheel(2), Jhansi Rani(2), GPO(1), Zero Mile(3), Munje(2) = 10
      if (loc.location_name === "Panchsheel Square") baseOfficers = 2;
      else if (loc.location_name === "Jhansi Rani Square") baseOfficers = 2;
      else if (loc.location_name === "GPO Square") baseOfficers = 1;
      else if (loc.location_name === "Zero Mile") baseOfficers = 3;
      else if (loc.location_name === "Munje Square") baseOfficers = 2;
    } else {
      // Other zones: distribute baseline 10 officers among junctions (4, 3, 3)
      const zoneJunctions = rawLocations.filter(j => j.zone === loc.zone);
      const index = zoneJunctions.findIndex(j => j.location_id === loc.location_id);
      if (index === 0) baseOfficers = 4;
      else if (index === 1) baseOfficers = 3;
      else baseOfficers = 3;
    }

    const baseState = {
      location_id: loc.location_id,
      location_name: loc.location_name,
      zone: loc.zone,
      latitude: loc.latitude,
      longitude: loc.longitude,
      police_station: loc.police_station,

      congestion_score: data.congestion_score || 30,
      avg_speed_kmph: data.avg_speed_kmph || 45,
      violations: data.violations || 10,
      accident_count: data.accident_count || 0,
      accident_severity: data.accident_severity || 0,
      rain_flag: data.rain_flag || 0,
      crowd_score: data.crowd_score || 20,
      special_event: data.special_event || 0,
      historical_risk: data.historical_risk || 40,

      officers_present: baseOfficers,
      manual_override: null // Can be { status: 'Accept'|'Modify'|'Reject', value?: number }
    };

    baseState.risk_score = calculateRiskScore(baseState);
    baseState.risk_level = getRiskLevel(baseState.risk_score);
    return baseState;
  });
};

resetToBaseline();

// Helper to balance zone personnel to targetTotal (fixed at 43) for a given field ('recommended_officers' or 'officers_present')
const balanceZoneField = (zoneJunctions, targetTotal, fieldName) => {
  let currentTotal = zoneJunctions.reduce((sum, j) => sum + j[fieldName], 0);

  if (currentTotal === targetTotal) return;

  let iterations = 0;
  while (currentTotal !== targetTotal && iterations < 500) {
    iterations++;
    const diff = targetTotal - currentTotal;

    if (diff < 0) {
      // Surplus officers on field -> We need to REMOVE officers.
      // Search priority: Centroid Buffer (J002) first, then Green, Yellow, Orange, Red (lowest risk score first).
      // We only remove from junctions that currently have > 0 officers.
      const candidates = zoneJunctions.filter(j => j[fieldName] > 0);
      if (candidates.length === 0) break;

      candidates.sort((a, b) => {
        // For actual present officers, respect/lock manual overrides (adjust overridden junctions last)
        if (fieldName === 'officers_present') {
          const aOverridden = a.manual_override ? 1 : 0;
          const bOverridden = b.manual_override ? 1 : 0;
          if (aOverridden !== bOverridden) return aOverridden - bOverridden;
        }

        // Centroid buffer (Panchsheel Sq J002) is first to draw from
        const aIsBuffer = a.location_id === "J002";
        const bIsBuffer = b.location_id === "J002";
        if (aIsBuffer !== bIsBuffer) return aIsBuffer ? -1 : 1;

        // Risk level order (lowest risk level first: Green -> Yellow -> Orange -> Red)
        const levelOrder = { "Green": 1, "Yellow": 2, "Orange": 3, "Red": 4 };
        const aLevel = levelOrder[a.risk_level] || 1;
        const bLevel = levelOrder[b.risk_level] || 1;
        if (aLevel !== bLevel) return aLevel - bLevel;

        // Risk score order (lowest risk score first)
        return a.risk_score - b.risk_score;
      });

      candidates[0][fieldName]--;
      currentTotal--;
    } else {
      // Deficit of officers -> We need to ADD officers.
      // Search priority: Red, Orange, Yellow, Green (highest risk score first), then Centroid Buffer J002 last.
      // Never allocate more than 10 officers to a single junction.
      const candidates = zoneJunctions.filter(j => j[fieldName] < 10);
      if (candidates.length === 0) break; // Capped out at 10 officers per junction in this zone

      candidates.sort((a, b) => {
        if (fieldName === 'officers_present') {
          const aOverridden = a.manual_override ? 1 : 0;
          const bOverridden = b.manual_override ? 1 : 0;
          if (aOverridden !== bOverridden) return aOverridden - bOverridden;
        }

        // Risk level order desc (highest risk level first: Red -> Orange -> Yellow -> Green)
        const levelOrder = { "Red": 1, "Orange": 2, "Yellow": 3, "Green": 4 };
        const aLevel = levelOrder[a.risk_level] || 4;
        const bLevel = levelOrder[b.risk_level] || 4;
        if (aLevel !== bLevel) return aLevel - bLevel;

        // Risk score order desc (highest risk score first)
        if (b.risk_score !== a.risk_score) return b.risk_score - a.risk_score;

        // Centroid buffer is last to receive additional surplus officers
        const aIsBuffer = a.location_id === "J002";
        const bIsBuffer = b.location_id === "J002";
        if (aIsBuffer !== bIsBuffer) return aIsBuffer ? 1 : -1;

        return 0;
      });

      candidates[0][fieldName]++;
      currentTotal++;
    }
  }
};

// Personnel Allocation Algorithm Engine
const runAllocationAlgorithm = (junctions) => {
  const zonePoolCeiling = 10; // Sanctioned effective pool per zone

  // Define geometric buffer clusters
  const isSitabuldiCluster = (id) => ["J001", "J002", "J003", "J006"].includes(id);

  // Initialize recommendation fields
  const results = junctions.map(j => {
    return {
      ...j,
      recommended_officers: 0,
      unmanned: false,
      reason: getExplanation(j)
    };
  });

  const zones = [...new Set(results.map(j => j.zone))];

  // Step 1: Calculate recommendations per zone using Netlify proportional allocation model
  zones.forEach(zone => {
    const zoneJunctions = results.filter(j => j.zone === zone);
    const sumRisk = zoneJunctions.reduce((sum, j) => sum + j.risk_score, 0) || 1;
    
    // required = Math.max(1, Math.ceil(risk / 20))
    const requiredList = zoneJunctions.map(j => Math.max(1, Math.ceil(j.risk_score / 20)));
    const sumRequired = requiredList.reduce((sum, val) => sum + val, 0);

    if (sumRequired <= zonePoolCeiling) {
      // Base assignment
      zoneJunctions.forEach((j, idx) => {
        j.recommended_officers = requiredList[idx];
      });
    } else {
      // Proportional assignment
      let sumAllocated = 0;
      zoneJunctions.forEach((j, idx) => {
        const share = j.risk_score / sumRisk;
        let allocated = Math.floor(zonePoolCeiling * share);
        if (j.risk_score >= 60 && allocated === 0) {
          allocated = 1;
        }
        j.recommended_officers = allocated;
        sumAllocated += allocated;
      });

      // Distribute remainder
      let remainder = zonePoolCeiling - sumAllocated;
      if (remainder > 0) {
        const sortedIndices = zoneJunctions
          .map((j, idx) => ({ j, idx }))
          .sort((a, b) => b.j.risk_score - a.j.risk_score);
        
        let loopIdx = 0;
        let iterations = 0;
        while (remainder > 0 && iterations < 100) {
          iterations++;
          const target = sortedIndices[loopIdx];
          if (target.j.recommended_officers < requiredList[target.idx]) {
            target.j.recommended_officers++;
            remainder--;
          }
          loopIdx = (loopIdx + 1) % sortedIndices.length;
        }
      }
    }
  });

  // Step 2: Apply geometric buffer allocation inside Sitabuldi cluster if applicable
  // Panchsheel (J002) is the centroid
  const centroidJunction = results.find(j => j.location_id === "J002");
  if (centroidJunction) {
    const vertices = results.filter(j => ["J001", "J003", "J006"].includes(j.location_id));
    
    // Centroid holds buffer pool
    let bufferPool = 1;
    if (centroidJunction.risk_level === "Yellow") bufferPool = 2;
    else if (centroidJunction.risk_level === "Orange" || centroidJunction.risk_level === "Red") bufferPool = 0;
    
    centroidJunction.recommended_officers = bufferPool;

    // Escalation: if any vertex turns Red, dispatch centroid buffer officer
    vertices.forEach(v => {
      if (v.risk_level === "Red" && bufferPool > 0) {
        // Dispatch 1 buffer officer from Panchsheel to the Red vertex
        v.recommended_officers = Math.min(10, Math.max(v.recommended_officers, v.officers_present + 1));
        centroidJunction.recommended_officers = Math.max(0, centroidJunction.recommended_officers - 1);
        bufferPool--;
        v.reason = `Buffer officer dispatched from Panchsheel Sq due to Red Alert (${v.reason})`;
      }
    });
  }

  // Step 3: Run final balancing step using balanceZoneField to guarantee it sums to exactly 10
  zones.forEach(zone => {
    const zoneJunctions = results.filter(j => j.zone === zone);
    balanceZoneField(zoneJunctions, zonePoolCeiling, 'recommended_officers');
  });

  // Apply manual overrides if operator acted
  results.forEach(j => {
    if (j.manual_override) {
      if (j.manual_override.status === 'Accept') {
        j.officers_present = j.recommended_officers;
      } else if (j.manual_override.status === 'Modify') {
        j.officers_present = j.manual_override.value;
      } else if (j.manual_override.status === 'Reject') {
        // Keep present officers unchanged
      }
    }
  });

  // Balance each zone's officers_present to exactly 10
  zones.forEach(zone => {
    const zoneJunctions = results.filter(j => j.zone === zone);
    balanceZoneField(zoneJunctions, zonePoolCeiling, 'officers_present');
  });

  // Flag Unmanned High-Risk
  results.forEach(j => {
    if ((j.risk_level === "Red" || j.risk_level === "Orange") && j.officers_present === 0) {
      j.unmanned = true;
    }
  });

  return results;
};

// Endpoints

// GET /api/junctions
app.get('/api/junctions', (req, res) => {
  const allocated = runAllocationAlgorithm(liveJunctions);
  res.json(allocated);
});

// GET /api/junctions/:id
app.get('/api/junctions/:id', (req, res) => {
  const allocated = runAllocationAlgorithm(liveJunctions);
  const j = allocated.find(item => item.location_id === req.params.id);
  if (!j) return res.status(404).json({ error: "Junction not found" });

  // Build a specific risk breakdown explanation text
  const explanation = `${j.location_name} is currently at ${j.risk_level} risk level (Score: ${j.risk_score}/100) due to ${j.reason.toLowerCase()}. Recommended personnel: ${j.recommended_officers} officers.`;

  res.json({
    ...j,
    explanation_text: explanation,
    factors: {
      congestion: j.congestion_score,
      accident_severity: j.accident_severity,
      violations: j.violations,
      historical_risk: j.historical_risk,
      crowd_score: j.crowd_score,
      special_event: j.special_event,
      rain_flag: j.rain_flag
    }
  });
});

// GET /api/zones/:zone/summary
app.get('/api/zones/:zone/summary', (req, res) => {
  const allocated = runAllocationAlgorithm(liveJunctions);
  const zoneJunctions = allocated.filter(j => j.zone.toLowerCase() === req.params.zone.toLowerCase());

  if (zoneJunctions.length === 0) return res.status(404).json({ error: "Zone not found" });

  const avgRisk = Math.round(zoneJunctions.reduce((sum, j) => sum + j.risk_score, 0) / zoneJunctions.length);
  const officersDeployed = zoneJunctions.reduce((sum, j) => sum + j.officers_present, 0);
  const unmannedCount = zoneJunctions.filter(j => j.unmanned).length;

  res.json({
    zone: req.params.zone,
    avg_risk_score: avgRisk,
    officers_deployed: officersDeployed,
    officers_pool: 10, // Active field pool per zone
    unmanned_count: unmannedCount,
    junction_count: zoneJunctions.length
  });
});

// GET /api/overview
app.get('/api/overview', (req, res) => {
  const allocated = runAllocationAlgorithm(liveJunctions);

  const criticalCount = allocated.filter(j => j.risk_level === "Red").length;
  const highRiskCount = allocated.filter(j => j.risk_level === "Orange").length;
  const unmannedCount = allocated.filter(j => j.unmanned).length;

  const totalDeployed = allocated.reduce((sum, j) => sum + j.officers_present, 0);
  const totalPool = 150; // Sanctioned max strength = 150
  const availableOfficers = totalPool - totalDeployed;

  res.json({
    monitored_junctions: allocated.length,
    critical_count: criticalCount,
    high_risk_count: highRiskCount,
    unmanned_count: unmannedCount,
    available_officers: Math.max(0, availableOfficers),
    deployed_officers: totalDeployed,
    active_incidents: activeIncidents.length,
    incidents: activeIncidents
  });
});

// POST /api/incidents
app.post('/api/incidents', (req, res) => {
  const { location_id, type, severity, description } = req.body;
  const j = liveJunctions.find(item => item.location_id === location_id);
  if (!j) return res.status(404).json({ error: "Junction not found" });

  const incident = {
    incident_id: `INC-${Date.now()}`,
    location_id,
    location_name: j.location_name,
    type, // "accident", "congestion", "event", "weather"
    severity: parseInt(severity) || 80,
    description: description || "Injected simulated incident",
    timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  };

  activeIncidents.push(incident);

  // Mutate live junction state to simulate incident impact
  if (type === "accident") {
    j.accident_severity = Math.max(j.accident_severity, incident.severity);
    j.congestion_score = Math.max(j.congestion_score, 85);
  } else if (type === "congestion") {
    j.congestion_score = Math.max(j.congestion_score, incident.severity);
  } else if (type === "event") {
    j.crowd_score = Math.max(j.crowd_score, incident.severity);
    j.special_event = 1;
  } else if (type === "weather") {
    j.rain_flag = 1;
    j.congestion_score = Math.min(95, j.congestion_score + 20);
  }

  j.risk_score = calculateRiskScore(j);
  j.risk_level = getRiskLevel(j.risk_score);

  res.json({ message: "Incident injected successfully", incident, junction: j });
});

// DELETE /api/incidents
app.delete('/api/incidents', (req, res) => {
  resetToBaseline();
  res.json({ message: "All incidents cleared and reset to baseline" });
});

// POST /api/overrides
app.post('/api/overrides', (req, res) => {
  const { location_id, action, value, comment } = req.body; // action: "Accept"|"Modify"|"Reject"
  const j = liveJunctions.find(item => item.location_id === location_id);
  if (!j) return res.status(404).json({ error: "Junction not found" });

  j.manual_override = {
    status: action,
    value: action === 'Modify' ? parseInt(value) : undefined
  };

  const logEntry = {
    log_id: `LOG-${Date.now()}`,
    location_id,
    location_name: j.location_name,
    action,
    value: action === 'Modify' ? value : '-',
    comment: comment || 'Action approved by operator',
    timestamp: new Date().toLocaleString()
  };

  overrideLog.push(logEntry);
  res.json({ message: "Override recorded successfully", junction: j, logEntry });
});

// GET /api/reports
app.get('/api/reports', (req, res) => {
  res.json(overrideLog);
});

// POST /api/simulate (Sandbox simulator - returns results without writing to live state)
app.post('/api/simulate', (req, res) => {
  const { target_id, type, sliders } = req.body;
  // target_id: junction location_id
  // type: preset scenario or custom slider values
  // sliders: { congestion_score, accident_severity, crowd_score, rain_flag, special_event }

  const jSource = liveJunctions.find(item => item.location_id === target_id);
  if (!jSource) return res.status(404).json({ error: "Target junction not found" });

  // Map before state
  const beforeState = runAllocationAlgorithm(liveJunctions);
  const beforeJunction = beforeState.find(item => item.location_id === target_id);

  // Copy live state to simulate changes
  const simulatedJunctions = JSON.parse(JSON.stringify(liveJunctions));
  const simTarget = simulatedJunctions.find(item => item.location_id === target_id);

  // Apply scenario impacts
  if (type === "Road accident") {
    simTarget.accident_severity = 95;
    simTarget.congestion_score = 90;
  } else if (type === "Festival crowd surge") {
    simTarget.crowd_score = 90;
    simTarget.special_event = 1;
  } else if (type === "Heavy rain rush hour") {
    simTarget.rain_flag = 1;
    simTarget.congestion_score = Math.min(95, simTarget.congestion_score + 35);
  } else if (type === "VIP movement") {
    simTarget.special_event = 1;
    simTarget.congestion_score = Math.min(95, simTarget.congestion_score + 25);
  } else if (type === "Custom" && sliders) {
    if (sliders.congestion_score !== undefined) simTarget.congestion_score = sliders.congestion_score;
    if (sliders.accident_severity !== undefined) simTarget.accident_severity = sliders.accident_severity;
    if (sliders.crowd_score !== undefined) simTarget.crowd_score = sliders.crowd_score;
    if (sliders.rain_flag !== undefined) simTarget.rain_flag = sliders.rain_flag ? 1 : 0;
    if (sliders.special_event !== undefined) simTarget.special_event = sliders.special_event ? 1 : 0;
  }

  // Recalculate target risk
  simTarget.risk_score = calculateRiskScore(simTarget);
  simTarget.risk_level = getRiskLevel(simTarget.risk_score);

  // Cascading effect: increase congestion at a neighboring junction in same zone
  const zoneJunctions = simulatedJunctions.filter(item => item.zone === simTarget.zone && item.location_id !== target_id);
  let simNeighbor = null;
  if (zoneJunctions.length > 0) {
    // Select first neighbor
    simNeighbor = zoneJunctions[0];
    simNeighbor.congestion_score = Math.min(90, simNeighbor.congestion_score + 15);
    simNeighbor.risk_score = calculateRiskScore(simNeighbor);
    simNeighbor.risk_level = getRiskLevel(simNeighbor.risk_score);
  }

  // Run allocation engine on simulated set
  const afterState = runAllocationAlgorithm(simulatedJunctions);
  const afterJunction = afterState.find(item => item.location_id === target_id);
  const afterNeighbor = simNeighbor ? afterState.find(item => item.location_id === simNeighbor.location_id) : null;

  // Build ranking deltas
  const getRankMap = (state) => {
    return [...state]
      .sort((a, b) => b.risk_score - a.risk_score)
      .map((item, idx) => ({ location_id: item.location_id, rank: idx + 1 }));
  };

  const beforeRanks = getRankMap(beforeState);
  const afterRanks = getRankMap(afterState);

  const targetBeforeRank = beforeRanks.find(item => item.location_id === target_id).rank;
  const targetAfterRank = afterRanks.find(item => item.location_id === target_id).rank;

  // Recommended move details
  const moves = [];
  afterState.forEach(afterJ => {
    const beforeJ = beforeState.find(item => item.location_id === afterJ.location_id);
    const diff = afterJ.recommended_officers - beforeJ.recommended_officers;
    if (diff > 0) {
      // Find where we pulled surplus from: the lowest risk junctions in the same zone
      const zoneSources = afterState.filter(item => item.zone === afterJ.zone && item.location_id !== afterJ.location_id);
      const pullSource = zoneSources.find(item => {
        const bItem = beforeState.find(bi => bi.location_id === item.location_id);
        return item.recommended_officers < bItem.recommended_officers;
      });

      moves.push({
        location_id: afterJ.location_id,
        location_name: afterJ.location_name,
        from_name: pullSource ? pullSource.location_name : "Zone Reserve Pool",
        officers_count: diff,
        reason: `Deploy to cover risk spike (${afterJ.reason})`
      });
    }
  });

  res.json({
    before: {
      location_id: beforeJunction.location_id,
      location_name: beforeJunction.location_name,
      risk_score: beforeJunction.risk_score,
      risk_level: beforeJunction.risk_level,
      officers_present: beforeJunction.officers_present,
      recommended_officers: beforeJunction.recommended_officers,
      rank: targetBeforeRank,
      unmanned: beforeJunction.unmanned
    },
    after: {
      location_id: afterJunction.location_id,
      location_name: afterJunction.location_name,
      risk_score: afterJunction.risk_score,
      risk_level: afterJunction.risk_level,
      officers_present: afterJunction.officers_present,
      recommended_officers: afterJunction.recommended_officers,
      rank: targetAfterRank,
      unmanned: afterJunction.unmanned
    },
    neighbor: simNeighbor ? {
      location_id: simNeighbor.location_id,
      location_name: simNeighbor.location_name,
      before_risk: beforeState.find(item => item.location_id === simNeighbor.location_id).risk_score,
      after_risk: afterNeighbor.risk_score,
      before_recommended: beforeState.find(item => item.location_id === simNeighbor.location_id).recommended_officers,
      after_recommended: afterNeighbor.recommended_officers
    } : null,
    recommended_moves: moves,
    new_unmanned_created: afterState.filter(item => item.unmanned && !beforeState.find(b => b.location_id === item.location_id).unmanned).map(item => item.location_name)
  });
});

app.listen(PORT, () => {
  console.log(`Nagpur Traffic AI Control Backend listening on port ${PORT}`);
});
