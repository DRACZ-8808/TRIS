# Antigravity Build Prompt — Nagpur Traffic AI (Build From Scratch)

Paste this into Antigravity as a fresh project. There is no existing codebase — generate the full stack.

---

## PROMPT

Build a full-stack web application called **Nagpur Traffic AI** — an AI-based traffic risk heatmap and police deployment decision-support control room, for a hackathon prototype. Build it from scratch: frontend, backend, and dataset generation. Use simulated/synthetic data throughout (no live police feeds, no real Google Maps traffic API).

### Tech stack
- **Frontend**: React + Vite, Leaflet (via react-leaflet) for the map, plain CSS or a lightweight utility approach (no heavy UI framework needed) — dark control-room aesthetic, colour-coded risk badges (Green/Yellow/Orange/Red)
- **Backend**: Node.js + Express, serving REST endpoints from a generated dataset (JSON or CSV loaded into memory — no database required for a hackathon build, but structure the code so one could be added later)
- **Data**: generate synthetic hourly traffic-risk data via a Node or Python script, saved as CSV/JSON, loaded by the backend at startup

### Task 1 — Data model and generator
Build a data generator (script, run once to produce the dataset files) covering all 12 Nagpur traffic zones: Sitabuldi, Sadar, Cotton Market, Lakadganj, Sakkardara, Indora, Ajni, Sonegaon, MIDC, Kamptee, Zone 11 (name TBD), Zone 12 (name TBD).

- Seed 3–6 junctions per zone with real square/junction names, e.g.:
  - Sitabuldi: Variety Square, Panchsheel Square, Jhansi Rani Square, GPO Square, Zero Mile, Munje Square
  - Sadar: Sadar Square, Law College Square, Ravi Nagar Square
  - Cotton Market: Cotton Market Square, Medical Square, Golibar Square
  - Lakadganj: Lakadganj Square, Gandhi Putla Square, Mahal Square
  - Sakkardara: Sakkardara Square, Manewada Square, Dighori Square
  - Indora: Indora Square, Kadbi Chowk
  - Ajni: Ajni Square, Chhatrapati Square, Congress Nagar Square
  - Sonegaon: Sonegaon Square, Khamla Square, Airport Square
  - MIDC: Hingna T-Point, Wanadongri Square
  - Kamptee: Kamptee Square, Kapsi Bridge
- Assign each junction an approximate real lat/long around Nagpur's center (21.1458° N, 79.0882° E) so the map looks geographically correct.
- Location schema: `location_id, location_name, zone, latitude, longitude, police_station`.
- Risk-observation schema (generate hourly rows per junction, e.g. one representative week or a full simulated day for the demo — keep total row count reasonable, a few thousand rows is enough): `date, hour, location_id, location_name, zone, congestion_score, avg_speed_kmph, violations, accident_count, accident_severity, rain_flag, crowd_score, special_event, historical_risk, risk_score, risk_level`.
- Risk score formula (keep it transparent, not a black-box model):
  ```
  risk_score = 0.25*congestion_score + 0.20*accident_severity + 0.15*violations
             + 0.15*historical_risk + 0.10*crowd_score + 0.10*special_event*100
             + 0.05*rain_flag*100
  ```
  Bucket into risk_level: Green (0–30), Yellow (31–55), Orange (56–75), Red (76–100).
- Officer pool per zone (label as "estimated distribution," not official data): sanctioned ≈70, working ≈54, effective field ≈43. Also generate a starting `officers_present` count per junction (some junctions start at 0 to demonstrate "unmanned" cases).

### Task 2 — Backend (Express)
Build REST endpoints:
- `GET /api/junctions` — all junctions with latest risk score, risk level, zone, officers present, officers recommended, top reason factors
- `GET /api/junctions/:id` — full detail for one junction, including the risk-factor breakdown and explanation text
- `GET /api/zones/:zone/summary` — zone-level totals (avg risk, officers deployed vs pool, unmanned count)
- `GET /api/overview` — city-wide summary tiles: critical count, high-risk count, unmanned count, available officers, active incidents
- `POST /api/incidents` — inject a live incident at a junction (raises its risk score and recalculates ranking + recommended allocation; this is LIVE state)
- `DELETE /api/incidents` — clear all injected incidents, return to baseline
- `POST /api/overrides` — record an operator's Accept/Modify/Reject action on a recommendation
- `POST /api/simulate` — run a hypothetical scenario WITHOUT touching live state (see Task 5); accepts target junction(s)/zone, scenario type or manual factor adjustments, returns before/after risk, ranking, and allocation deltas

Implement the **allocation algorithm** server-side:
1. Rank junctions by risk_score descending (city-wide or filtered by zone).
2. For each junction above a risk threshold, compute required officers as a function of risk_score (e.g. required = ceil(risk_score/25)).
3. Compare to officers_present → gap.
4. Reallocate surplus from the nearest lowest-risk junction, same zone first, adjacent zone only if none available in-zone — never exceed the zone's officer pool ceiling.
5. Flag any Orange/Red junction with officers_present == 0 as `unmanned: true, severity: "CRITICAL"`.
6. Return, per recommendation, a plain-language `reason` string built from the top 2–3 contributing risk factors (e.g. "Accident + heavy congestion").

### Task 3 — Frontend: dashboard shell
Build a control-room dashboard with left nav: **Overview, Live map, Deployments, Incidents, Simulator, Reports, Settings**. Dark theme, colour-coded badges matching risk_level, footer disclaimer visible on every screen: "Simulated data · Human approval required for deployment actions."

- **Overview**: summary tiles (Critical / High-risk / Unmanned / Available officers / Active incidents), city-wide, pulling from `/api/overview`.
- **Live map**: Leaflet map centered on Nagpur, all junctions plotted as colour-coded markers, zone filter dropdown/chips, click a marker → side panel with risk breakdown, reason, and current vs. recommended officers (pull from `/api/junctions/:id`).
- **Deployments**: ranked list of junctions by risk (city-wide, filterable by zone), each card showing risk score, officers present/recommended, reason, UNMANNED badge where relevant, and Accept/Modify/Reject buttons (POST to `/api/overrides`). Include a baseline-vs-recommended comparison summary (current total officers deployed vs. recommended total, city-wide and per zone).
- **Incidents**: active incident list + "Inject Incident" control (POST `/api/incidents`) that mutates live state and should immediately reflect in Live map and Deployments; "Clear all incidents" resets to baseline.
- **Reports**: simple log of override actions (accept/modify/reject history) recorded via `/api/overrides` — for demo purposes this can just be a table, no need for analytics.
- **Settings**: read-only display of the risk-weight formula and thresholds, for judge transparency (optional, low priority).

### Task 4 — Simulator module (new, distinct from Incidents)
This is a sandbox — it must never mutate live state (never call `/api/incidents`; always go through `/api/simulate`).

Build:
1. **Scenario builder panel**: select a target junction or whole zone, then either pick a preset ("Road accident," "Festival crowd surge," "Heavy rain rush hour") or manually adjust sliders (congestion, accident severity, crowd surge, weather, special-event toggle).
2. **"Run Simulation"** → calls `POST /api/simulate`, which recomputes risk using the same formula as Task 2 against the hypothetical inputs, including a simple cascading effect (e.g. a neighboring junction in the same zone gets a modest congestion bump if the target junction's congestion spikes).
3. **Reaction view**, shown as a short sequence, reusing the same card/badge visual language as Deployments:
   - Before state (current risk + deployment for affected junction(s))
   - What changed and why (plain-language reasons)
   - Updated ranking with up/down indicators for any junction whose rank changed
   - Recommended officer moves (from → to, with reason)
   - After state, shown side-by-side or toggled against before
   - Whether this scenario creates a new unmanned high-risk junction
4. **"Reset simulation"** clears the hypothetical view, returns to live data — with no backend side effects, since `/api/simulate` never writes to live state.

### Task 5 — Explainability everywhere
Every risk score and every deployment recommendation, anywhere in the app (Live map, Deployments, Simulator), must show a one-line plain-language reason built from its top contributing factors — never show a bare number with no explanation.

### Constraints
- Keep the risk model a transparent weighted formula — no ML black box.
- All data is simulated; label it clearly in the UI.
- No live external APIs (no real Google Maps traffic data, no live CCTV).
- Keep the app runnable locally with two commands: backend `npm start` (or `node server.js`), frontend `npm run dev`.

### Deliverable
A locally runnable full-stack app: backend serving the generated dataset and allocation logic, frontend showing the full 12-zone Nagpur map, city-wide risk scoring, ranked deployment list with unmanned detection and manual override, baseline-vs-recommended comparison, and the Simulator module — everything demoable from one dashboard in under 5 minutes.
