# Nagpur Traffic AI — Product Requirements Document
### AI-Based Traffic Risk Heatmap & Police Deployment Decision Support
Version 2.0 — Full-City Expansion + Simulator Module

---

## 1. Problem Statement

Nagpur Traffic Police manage 12 traffic zones and 171 signalised junctions with a sanctioned strength of 843 personnel but an effective daily field strength of only ~520. Risk conditions (congestion, accidents, violations, weather, events) shift continuously through the day, but there is no system that tells commanders, in real time: **where should limited officers be right now, why, and how should that change as conditions change.**

This PRD covers the next build phase: taking the existing Sitabuldi-only prototype to full-city scope, and adding a **Simulator** module that lets commanders test "what if risk increases here" scenarios without touching the live control room state.

---

## 2. Current State (v1 — already built)

A working prototype exists (React + Vite frontend, Leaflet map, Node/Express backend):

- Single zone scope: **Sitabuldi**, 6 junctions (Variety Square, Panchsheel Square, Jhansi Rani Square, GPO Square, Zero Mile, Munje Square)
- Live risk heatmap with colour-coded markers (Green/Yellow/Orange/Red)
- Ranked deployment list per junction: risk score, officers present vs. recommended, reason
- "Inject Incident" control — simulates an incident directly on the live map/list
- Manual override per recommendation (Accept / Modify / Reject)
- Deployment comparison: current vs. recommended officer count
- Risk model inputs shown per junction (congestion, violations, accident severity, crowding, weather, historical risk)
- Simulated dataset: `sitabuldi_traffic_risk_dataset.csv` (17,520 rows — 6 junctions × hourly observations across 2025) + `sitabuldi_locations.csv` (lat/long per junction)

**Gap vs. hackathon brief:** scope is one zone out of twelve; no dedicated scenario-testing tool separate from live incident injection; no explicit "currently unmanned + high risk" flag as its own view; no baseline-vs-recommended comparison at city scale.

---

## 3. Goals for v2

1. Expand map and data model from 1 zone → **all 12 Nagpur traffic zones**, using real junction/square names and approximate coordinates already identified (Sitabuldi, Sadar, Cotton Market, Lakadganj, Sakkardara, Indora, Ajni, Sonegaon, MIDC, Kamptee, + 2 zones pending official confirmation — label as "Zone 11 / Zone 12 (name TBD)").
2. Add a **Simulator** section to the dashboard nav — separate from the live "Inject Incident" quick control — where a commander can construct a hypothetical scenario, run it, and see the system's reaction *without altering live control-room state*.
3. Keep every deliverable from the hackathon brief explicitly visible and demoable in under 5 minutes.

---

## 4. Users

**Primary: Traffic Commander / Control Room Operator**
Needs a fast, trustworthy, glanceable view of the city, a ranked to-do list, and the ability to override the system without needing to trust it blindly.

**Secondary: Judge / Evaluator**
Needs to see all 9 required outcomes demonstrated clearly, in sequence, on one screen, with visible reasoning.

---

## 5. Scope

### In scope (v2)
- Full 12-zone Nagpur map (Leaflet, real coordinates, zoomable)
- Risk scoring model applied per junction, per zone
- Ranked priority list — city-wide, filterable by zone
- Personnel-allocation algorithm across zones (not just within one zone)
- Unmanned high-risk detection — dedicated flag/view
- Manual override (Accept/Modify/Reject) — unchanged from v1, extended to all zones
- Baseline vs. recommended deployment comparison — city-wide totals + per-zone breakdown
- **NEW: Simulator module**
- Feedback logging (operator marks recommendation as good/bad — logged, shown in Reports)

### Out of scope (v2)
- Live police CCTV or confidential department feeds (explicitly excluded by brief)
- Real-time Google Maps traffic API integration (not reliably accessible for a hackathon build — use static/simulated congestion data styled like a live heatmap instead)
- Official zone-11/zone-12 boundaries (use placeholder until DCP Traffic confirms)
- Mobile app (desktop control-room dashboard only)

---

## 6. Data Model

### 6.1 Zones & Junctions
Expand `locations.csv` schema:

| field | type | notes |
|---|---|---|
| location_id | string | J001, J002... unique across all zones |
| location_name | string | e.g. "Medical Square" |
| zone | string | one of the 12 traffic zones |
| latitude / longitude | float | real approximate coordinates |
| police_station | string | associated station, for context |

Seed with known squares per zone (Sitabuldi: Variety Sq, Panchsheel Sq, Jhansi Rani Sq, GPO Sq, Zero Mile, Munje Sq; Sadar: Sadar Sq, Law College Sq, Ravi Nagar Sq, Vidhan Bhavan Sq; Cotton Market: Cotton Market Sq, Medical Sq, Golibar Sq; Lakadganj: Lakadganj Sq, Gandhi Putla Sq, Mahal Sq; Sakkardara: Sakkardara Sq, Manewada Sq, Dighori Sq; Indora: Indora Sq, Kadbi Chowk; Ajni: Ajni Sq, Chhatrapati Sq, Congress Nagar Sq; Sonegaon: Sonegaon Sq, Khamla Sq, Airport Sq; MIDC: Hingna T-Point, Wanadongri Sq; Kamptee: Kamptee Sq, Kapsi Bridge). Aim for 3–6 junctions per zone (≈40–50 city-wide) — enough to look like a real city map without exploding scope.

### 6.2 Risk observations
Same schema as existing `sitabuldi_traffic_risk_dataset.csv`, generated per junction, per hour: congestion_score, avg_speed_kmph, violations, accident_count, accident_severity, rain_flag, crowd_score, special_event, historical_risk → risk_score, risk_level. Extend generator script to produce this for all ~40–50 junctions instead of 6.

### 6.3 Officer strength (planning estimate — label clearly as estimated, not official)
Per zone: sanctioned ≈70, working ≈54, effective field ≈43 (per DCP Traffic public figures, distributed proportionally across 12 zones). Use this as the **available-officer pool per zone** that the allocation algorithm works within.

---

## 7. Risk Scoring Model

Keep the existing interpretable weighted formula (already implemented) — do not switch to a black-box model. Suggested weights (tune later):

```
risk_score = 0.25×congestion + 0.20×accident_severity + 0.15×violations
           + 0.15×historical_risk + 0.10×crowd_score + 0.10×special_event_flag
           + 0.05×rain_flag
```
Bucket into Green (0–30) / Yellow (31–55) / Orange (56–75) / Red (76–100), matching the existing colour scheme.

**Explainability requirement:** every score must return its top 2–3 contributing factors in plain language (already partially implemented — "Accident + heavy congestion"). Keep this pattern for every junction, every zone.

---

## 8. Allocation Algorithm

Extend from single-zone to city-wide:
1. Rank all junctions city-wide by risk_score, descending.
2. For each junction above a risk threshold, compute `required = f(risk_score, junction_type)`.
3. Compare `required` vs. `officers_present` → `gap`.
4. Pull surplus officers from the **nearest** low-risk junctions first (same zone preferred, adjacent zone if none available) — this must respect the officer pool ceiling per zone from §6.3, not invent officers from nowhere.
5. Flag any Red/Orange junction with `officers_present == 0` as **UNMANNED — CRITICAL** (dedicated badge, already present in v1, extend city-wide).
6. Output: ranked move-list ("Move 2 officers from Zero Mile → Variety Square") with reason attached to each move.

---

## 9. NEW: Simulator Module

**Why it's separate from "Inject Incident":** the live control room reflects what commanders act on right now. The Simulator is a sandbox — commanders (or judges) explore hypothetical futures without changing live state, and see the full reasoning chain the AI would apply.

### 9.1 Entry point
New nav item: **Simulator** (alongside Overview, Live map, Deployments, Incidents, Reports, Settings).

### 9.2 Scenario builder
- Select target junction(s) or zone(s)
- Choose a preset scenario OR manually adjust factors via sliders:
  - Preset scenarios: "Road accident", "VIP movement / bandobast", "Festival crowd surge", "Heavy rain rush hour", "Multi-junction cascading congestion"
  - Manual sliders: congestion +/-, accident severity, crowd surge, weather, special event toggle
- "Run Simulation" button

### 9.3 Reaction view (the core of this feature)
On run, show, step by step (like the existing "Explanation" pattern, extended into a short sequence):
1. **Before state** — current risk map + deployment (baseline)
2. **Risk recalculation** — which junctions' scores change and why (including secondary/cascading effects, e.g. traffic diverted from an incident junction raises risk at a neighboring junction)
3. **Re-ranking** — updated priority list, highlighting rank changes with up/down indicators
4. **Re-allocation** — which officers the system would move, from where, to where, and why (reuse §8 logic against the hypothetical state)
5. **After state** — side-by-side heatmap: before vs. after
6. **Unmanned check** — does this scenario create any new unmanned high-risk junction?

### 9.4 Controls
- "Reset simulation" — discard, return to live state (Simulator never writes to live data)
- "Apply to live dashboard" (optional stretch) — lets an operator promote a simulated scenario into a real incident injection if they choose
- Save/name a scenario for replay during the demo

### 9.5 Design intent
Reuse existing visual language (risk badges, colour scheme, card style from the existing mockups) — this should look like a natural extension of the dashboard, not a bolted-on separate tool.

---

## 10. Information Architecture (dashboard nav)

1. **Overview** — city-wide summary tiles: critical count, high-risk count, unmanned count, available officers, active incidents
2. **Live map** — full 12-zone Nagpur map, heatmap markers, zone filter, click-to-inspect
3. **Deployments** — ranked list, current vs. recommended, override controls, baseline comparison
4. **Incidents** — active incident log + "Inject Incident" live control (existing v1 feature)
5. **Simulator** *(new)* — scenario builder + reaction view, per §9
6. **Reports** — feedback log (operator accept/modify/reject history), simple accuracy/usage stats
7. **Settings** — thresholds, weights (optional, for judge transparency)

---

## 11. Success Criteria (maps to hackathon brief)

| Brief requirement | Where it lives |
|---|---|
| Risk-scoring model | §7, shown per-junction on Live map + Deployments |
| Interactive colour-coded heatmap | Live map |
| Ranked list of locations | Deployments |
| Personnel-allocation algorithm | §8, Deployments |
| Dynamic redeployment during simulated incident | Incidents (live) + Simulator (sandbox) |
| Unmanned high-risk identification | Overview tile + badge on Deployments/map |
| Explainable recommendations + manual override | Every card, Accept/Modify/Reject |
| Baseline vs. recommended comparison | Deployments, city-wide + per-zone |
| Control-room dashboard | Whole app |

---

## 12. Non-Functional Notes

- All data is simulated/public-derived — label this clearly in the UI footer, as in existing mockups ("Simulated data · Human approval required for deployment actions")
- Keep risk model interpretable — a judge should be able to ask "why is this 82?" and get an answer in one sentence
- Performance: city-wide (~40–50 junctions) should still render smoothly on the existing Leaflet setup — no need for clustering unless it visibly lags

---

## 13. Open Items to Resolve Before Demo
- Confirm/generate coordinates for all ~40–50 junctions (can approximate from known square names near each police station)
- Decide preset scenario list for Simulator (recommend 3, not 5, to keep the demo tight)
- Decide whether feedback (§10 Reports) actually adjusts future scores or is just logged — logged-only is sufficient for a hackathon
