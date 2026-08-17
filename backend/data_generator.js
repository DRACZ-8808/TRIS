const fs = require('fs');
const path = require('path');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Define the 12 zones and their junctions with approximate coordinates
const zonesData = [
  {
    zone: "Sitabuldi",
    ps: "Sitabuldi Police Station",
    junctions: [
      { name: "Variety Square", lat: 21.1458, lng: 79.0882 },
      { name: "Panchsheel Square", lat: 21.1468, lng: 79.0838 },
      { name: "Jhansi Rani Square", lat: 21.1425, lng: 79.0847 },
      { name: "GPO Square", lat: 21.1439, lng: 79.0864 },
      { name: "Zero Mile", lat: 21.1453, lng: 79.0805 },
      { name: "Munje Square", lat: 21.1474, lng: 79.0910 }
    ]
  },
  {
    zone: "Sadar",
    ps: "Sadar Police Station",
    junctions: [
      { name: "Sadar Square", lat: 21.1638, lng: 79.0792 },
      { name: "Law College Square", lat: 21.1558, lng: 79.0682 },
      { name: "Ravi Nagar Square", lat: 21.1538, lng: 79.0552 },
      { name: "Vidhan Bhavan Square", lat: 21.1610, lng: 79.0820 }
    ]
  },
  {
    zone: "Cotton Market",
    ps: "Ganeshpeth Police Station",
    junctions: [
      { name: "Cotton Market Square", lat: 21.1442, lng: 79.0988 },
      { name: "Medical Square", lat: 21.1342, lng: 79.0982 },
      { name: "Golibar Square", lat: 21.1482, lng: 79.1022 }
    ]
  },
  {
    zone: "Lakadganj",
    ps: "Lakadganj Police Station",
    junctions: [
      { name: "Lakadganj Square", lat: 21.1542, lng: 79.1188 },
      { name: "Gandhi Putla Square", lat: 21.1502, lng: 79.1088 },
      { name: "Mahal Square", lat: 21.1422, lng: 79.1122 }
    ]
  },
  {
    zone: "Sakkardara",
    ps: "Sakkardara Police Station",
    junctions: [
      { name: "Sakkardara Square", lat: 21.1212, lng: 79.1138 },
      { name: "Manewada Square", lat: 21.1042, lng: 79.1088 },
      { name: "Dighori Square", lat: 21.1182, lng: 79.1388 }
    ]
  },
  {
    zone: "Indora",
    ps: "Jaripatka Police Station",
    junctions: [
      { name: "Indora Square", lat: 21.1848, lng: 79.0922 },
      { name: "Kadbi Chowk", lat: 21.1738, lng: 79.0888 },
      { name: "Kamal Chowk", lat: 21.1788, lng: 79.1038 }
    ]
  },
  {
    zone: "Ajni",
    ps: "Ajni Police Station",
    junctions: [
      { name: "Ajni Square", lat: 21.1188, lng: 79.0762 },
      { name: "Chhatrapati Square", lat: 21.1088, lng: 79.0682 },
      { name: "Congress Nagar Square", lat: 21.1288, lng: 79.0782 }
    ]
  },
  {
    zone: "Sonegaon",
    ps: "Sonegaon Police Station",
    junctions: [
      { name: "Sonegaon Square", lat: 21.0968, lng: 79.0552 },
      { name: "Khamla Square", lat: 21.1118, lng: 79.0522 },
      { name: "Airport Square", lat: 21.0908, lng: 79.0622 }
    ]
  },
  {
    zone: "MIDC",
    ps: "MIDC Police Station",
    junctions: [
      { name: "Hingna T-Point", lat: 21.1128, lng: 79.0112 },
      { name: "Wanadongri Square", lat: 21.1018, lng: 78.9882 },
      { name: "Lokmanya Nagar Square", lat: 21.1068, lng: 78.9992 }
    ]
  },
  {
    zone: "Kamptee",
    ps: "Kamptee Police Station",
    junctions: [
      { name: "Kamptee Square", lat: 21.2188, lng: 79.1912 },
      { name: "Kapsi Bridge", lat: 21.1688, lng: 79.1822 },
      { name: "Dragon Palace Chowk", lat: 21.2228, lng: 79.1982 }
    ]
  },
  {
    zone: "Yashodhara Nagar",
    ps: "Yashodhara Nagar Police Station",
    junctions: [
      { name: "Yashodhara Nagar Square", lat: 21.1898, lng: 79.1212 },
      { name: "Vaishno Devi Square", lat: 21.1828, lng: 79.1352 },
      { name: "Automotive Square", lat: 21.1968, lng: 79.0982 }
    ]
  },
  {
    zone: "Wathoda",
    ps: "Wathoda Police Station",
    junctions: [
      { name: "Wathoda Square", lat: 21.1418, lng: 79.1462 },
      { name: "Ring Road Chowk", lat: 21.1308, lng: 79.1412 },
      { name: "Dighori T-Point", lat: 21.1218, lng: 79.1482 }
    ]
  }
];

// Create locations dataset
const locations = [];
let jIdCounter = 1;

zonesData.forEach(z => {
  z.junctions.forEach(j => {
    const id = `J${String(jIdCounter++).padStart(3, '0')}`;
    locations.push({
      location_id: id,
      location_name: j.name,
      zone: z.zone,
      latitude: j.lat,
      longitude: j.lng,
      police_station: z.ps
    });
  });
});

console.log(`Generated ${locations.length} locations across 12 zones.`);
fs.writeFileSync(path.join(dataDir, 'locations.json'), JSON.stringify(locations, null, 2));

// Generate hourly risk data for 24 hours of a single day
const trafficDataset = [];
const dateStr = "2026-08-17"; // A simulated date

const calculateRiskScore = (congestion, accidentSeverity, violations, historicalRisk, crowdScore, specialEvent, rainFlag) => {
  const score = (0.25 * congestion) + 
                (0.20 * accidentSeverity) + 
                (0.15 * violations) + 
                (0.15 * historicalRisk) + 
                (0.10 * crowdScore) + 
                (0.10 * specialEvent * 100) + 
                (0.05 * rainFlag * 100);
  return Math.min(100, Math.max(0, Math.round(score)));
};

const getRiskLevel = (score) => {
  if (score <= 30) return "Green";
  if (score <= 55) return "Yellow";
  if (score <= 75) return "Orange";
  return "Red";
};

// Seed randomized values but ensure realistic time-of-day traffic patterns
for (let hour = 0; hour < 24; hour++) {
  // Peak hour factors (morning peak 8-11, evening peak 17-20)
  const isPeak = (hour >= 8 && hour <= 11) || (hour >= 17 && hour <= 20);
  const isNight = hour >= 23 || hour <= 5;
  
  locations.forEach(loc => {
    // Generate base congestion score
    let baseCongestion = isPeak ? 65 : (isNight ? 15 : 40);
    // Add location-specific variation
    baseCongestion += Math.floor(Math.random() * 20) - 10;
    baseCongestion = Math.max(10, Math.min(95, baseCongestion));

    const avgSpeed = Math.round(60 - (baseCongestion * 0.45) - (Math.random() * 5));
    
    // Accidents are rare, but severity spikes occasionally
    const accidentOccurs = Math.random() < 0.05; // 5% chance per hour
    const accidentSeverity = accidentOccurs ? Math.floor(Math.random() * 50) + 50 : 0;
    const accidentCount = accidentOccurs ? 1 : 0;
    
    // Violations correlate with congestion and speeds
    const violations = Math.max(0, Math.round((baseCongestion * 0.6) + (Math.random() * 15) - 5));

    // Historical risk is fixed per junction
    const locHash = loc.location_name.charCodeAt(0) + loc.location_name.charCodeAt(loc.location_name.length - 1);
    const historicalRisk = 30 + (locHash % 40); // 30 to 70 range

    // Crowd scores correlate slightly with peak hours and center zones like Sitabuldi/Sadar
    let crowdScore = isPeak ? 50 : 25;
    if (loc.zone === "Sitabuldi" || loc.zone === "Sadar") crowdScore += 15;
    crowdScore += Math.floor(Math.random() * 15) - 5;
    crowdScore = Math.max(10, Math.min(90, crowdScore));

    // Weather flags (rain) - e.g. 10% chance of rain overall, if rain, it affects speed and risk
    const isRaining = Math.random() < 0.10 ? 1 : 0;

    // Special event (binary flag) - e.g. 5% chance
    const isSpecialEvent = Math.random() < 0.03 ? 1 : 0;

    const riskScore = calculateRiskScore(
      baseCongestion,
      accidentSeverity,
      violations,
      historicalRisk,
      crowdScore,
      isSpecialEvent,
      isRaining
    );

    const riskLevel = getRiskLevel(riskScore);

    trafficDataset.push({
      date: dateStr,
      hour: hour,
      location_id: loc.location_id,
      location_name: loc.location_name,
      zone: loc.zone,
      congestion_score: baseCongestion,
      avg_speed_kmph: Math.max(10, avgSpeed),
      violations: violations,
      accident_count: accidentCount,
      accident_severity: accidentSeverity,
      rain_flag: isRaining,
      crowd_score: crowdScore,
      special_event: isSpecialEvent,
      historical_risk: historicalRisk,
      risk_score: riskScore,
      risk_level: riskLevel
    });
  });
}

console.log(`Generated ${trafficDataset.length} hourly observation rows.`);
fs.writeFileSync(path.join(dataDir, 'traffic_dataset.json'), JSON.stringify(trafficDataset, null, 2));
console.log('Dataset generation complete.');
