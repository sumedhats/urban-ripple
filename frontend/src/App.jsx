import { useState, useEffect } from "react";
import {
  Activity, AlertTriangle, BarChart3, Brain, Building2, Clock,
  MapPin, Menu, Navigation, Plus, Radio, ShieldCheck,
  TrendingUp, X
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis
} from "recharts";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import "./App.css";
import PredictiveIntelligence from "./modules/PredictiveIntelligence.jsx";
import MLDashboard from "./modules/ml/MLDashboard.jsx";
import { API_BASE_URL, apiFetch } from "./services/api.js";

import Analytics from "./modules/Analytics";
import PredictiveInsights from "./modules/PredictiveInsights";
import RippleEffects from "./modules/RippleEffects";
import ScenarioSimulator from "./modules/ScenarioSimulator.jsx";
import LocationIntelligence from "./modules/LocationIntelligence";
import RecommendationEngine from "./modules/RecommendationEngine";
import Reports from "./modules/Reports";
import SAPIntegration from "./modules/SAPIntegration";


const initialEvents = [
  { id: 1, name: "MG Road", area: "Central Business District", duration: "4 hours", severity: "High", status: "Active" },
  { id: 2, name: "Brigade Road", area: "Commercial District", duration: "2 hours", severity: "Medium", status: "Monitoring" },
  { id: 3, name: "Outer Ring Road", area: "Technology Corridor", duration: "6 hours", severity: "High", status: "Planned" }
];

const chartData = [
  { time: "06 AM", impact: 12 }, { time: "08 AM", impact: 28 },
  { time: "10 AM", impact: 46 }, { time: "12 PM", impact: 38 },
  { time: "02 PM", impact: 61 }, { time: "04 PM", impact: 78 },
  { time: "06 PM", impact: 92 }, { time: "08 PM", impact: 54 }
];


function MapAutoFit({ events }) {
  const map = useMap();

  useEffect(() => {
    const locations = events
      .filter(event => event.latitude != null && event.longitude != null)
      .map(event => [Number(event.latitude), Number(event.longitude)]);

    if (locations.length === 1) {
      map.setView(locations[0], 14);
    } else if (locations.length > 1) {
      map.fitBounds(locations, { padding: [40, 40], maxZoom: 14 });
    }
  }, [events, map]);

  return null;
}

export default function App() {
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState("Overview");
  const [showForm, setShowForm] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedImpactId, setSelectedImpactId] = useState("");
  const [impactResult, setImpactResult] = useState(null);
  const [impactLoading, setImpactLoading] = useState(false);
  const [impactError, setImpactError] = useState("");
  const [form, setForm] = useState({
    name: "",
    area: "",
    disruptionType: "Road Closure",
    latitude: "",
    longitude: "",
    duration: "2 hours",
    population: "0",
    severity: "Medium"
  });

  const activeCount = events.filter(e => e.status === "Active").length;

  const geolocatedCount = events.filter(
    event => event.latitude != null && event.longitude != null
  ).length;

  const averageDuration = events.length
    ? (
        events.reduce(
          (sum, event) => sum + (Number.parseFloat(event.duration) || 0),
          0
        ) / events.length
      ).toFixed(1)
    : "0";

  const affectedPopulation = events.reduce(
    (sum, event) => sum + Number(event.affectedPopulation || 0),
    0
  );

  const severityChartData = ["Low", "Medium", "High", "Critical"].map(
    severity => ({
      severity,
      count: events.filter(event => event.severity === severity).length
    })
  );

  useEffect(() => {
    async function loadDisruptions() {
      try {
        const response = await apiFetch("/api/disruptions");
        if (!response.ok) throw new Error("Could not load disruptions");

        const data = await response.json();

        setEvents(data.disruptions.map(record => ({
          id: record.id,
          name: record.title,
          area: record.location,
          duration: `${record.duration_hours} hours`,
          severity: record.severity,
          status: record.status,
          disruptionType: record.disruption_type,
          latitude: record.latitude,
          longitude: record.longitude,
          affectedPopulation: record.affected_population
        })));
      } catch (error) {
        console.error("Backend loading error:", error);
      }
    }

    loadDisruptions();
  }, []);

  async function addEvent(e) {
    e.preventDefault();

    const payload = {
      title: form.name,
      disruption_type: form.disruptionType,
      location: form.area,
      latitude: form.latitude === "" ? null : Number(form.latitude),
      longitude: form.longitude === "" ? null : Number(form.longitude),
      duration_hours: parseFloat(form.duration),
      affected_population: Number(form.population),
      severity: form.severity
    };

    try {
      const response = await apiFetch("/api/disruptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(JSON.stringify(result.detail || result));
      }

      const record = result.disruption;

      setEvents(old => [{
        id: record.id,
        name: record.title,
        area: record.location,
        duration: `${record.duration_hours} hours`,
        severity: record.severity,
        status: record.status,
        disruptionType: record.disruption_type,
          latitude: record.latitude,
          longitude: record.longitude,
          affectedPopulation: record.affected_population
      }, ...old]);

      setForm({
        name: "",
        area: "",
        disruptionType: "Road Closure",
        latitude: "",
        longitude: "",
        duration: "2 hours",
        population: "0",
        severity: "Medium"
      });
      setShowForm(false);
      setPage("Disruptions");

    } catch (error) {
      console.error("Save error:", error);
      alert("Could not save disruption. Check whether the backend is running. " + error.message);
    }
  }

  async function runImpactAnalysis() {
    const selected = events.find(
      event => String(event.id) === String(selectedImpactId)
    );

    if (!selected) {
      setImpactError("Please select a disruption first.");
      return;
    }

    setImpactLoading(true);
    setImpactError("");
    setImpactResult(null);

    try {
      const response = await apiFetch("/api/impact/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disruption_type: selected.disruptionType,
          duration_hours: parseFloat(selected.duration),
          affected_population: Number(selected.affectedPopulation || 0),
          severity: selected.severity
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(JSON.stringify(result.detail || result));
      }

      setImpactResult(result);
    } catch (error) {
      setImpactError("Analysis failed: " + error.message);
    } finally {
      setImpactLoading(false);
    }
  }

  const nav = [
    { label: "Overview", icon: BarChart3 },
    { label: "Disruptions", icon: AlertTriangle },
    { label: "City Map", icon: MapPin },
    { label: "Impact Analysis", icon: TrendingUp },
    { label: "Predictive Intelligence", icon: Brain },
    { label: "Machine Learning", icon: Brain },

    { label: "Analytics", icon: BarChart3 },
    { label: "Predictive Insights", icon: TrendingUp },
    { label: "Ripple Effects", icon: Activity },
    { label: "Scenario Simulator", icon: Brain },
    { label: "Location Intelligence", icon: MapPin },
    { label: "Recommendations", icon: ShieldCheck },
    { label: "Reports", icon: Building2 },
    { label: "SAP Integration", icon: Radio }
  ];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-icon"><Activity size={24} /></div>
          <div><h2>URBAN RIPPLE</h2><span>URBAN INTELLIGENCE</span></div>
          <button className="mobile-close" onClick={() => setMenuOpen(false)}><X size={20} /></button>
        </div>

        <p className="workspace-label">WORKSPACE</p>
        <nav>
          {nav.map(({ label, icon: Icon }) => (
            <button key={label}
              className={`nav-item ${page === label ? "nav-active" : ""}`}
              onClick={() => { setPage(label); setMenuOpen(false); }}>
              <Icon size={19} /> <span>{label}</span>
              {label === "Disruptions" && <span className="nav-count">{events.length}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="system-card">
            <div className="system-title"><span className="live-dot" /> SYSTEM STATUS</div>
            <h4>Prototype running</h4>
            <p>SAP-RPT prediction integration is pending.</p>
          </div>
          <div className="sidebar-footer">
            <div className="avatar">UR</div>
            <div><strong>Urban Analyst</strong><span>City Operations</span></div>
          </div>
        </div>
      </aside>

      {menuOpen && <button className="mobile-overlay" onClick={() => setMenuOpen(false)} />}

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="menu-toggle" onClick={() => setMenuOpen(true)}><Menu size={21} /></button>
            <div className="breadcrumb">Workspace <span>›</span> <strong>{page}</strong></div>
          </div>
          <div className="topbar-right">
            <div className="live-status"><span className="live-dot" /> DEMO ENVIRONMENT</div>
            <span className="top-date">BENGALURU · INDIA</span>
          </div>
        </header>

        <div className="page-container">
          <section className="welcome-row">
            <div>
              <div className="eyebrow"><Radio size={15} /> CITY DISRUPTION INTELLIGENCE</div>
              <h1>{page === "Overview" ? "City Overview" : page}</h1>
              <p className="page-subtitle">Understand disruption patterns. Anticipate urban consequences.</p>
            </div>
            <button className="primary-button" onClick={() => setShowForm(true)}>
              <Plus size={18} /> New Disruption
            </button>
          </section>

          <section className="notice-banner">
            <div className="notice-icon"><ShieldCheck size={21} /></div>
            <div><strong>Demonstration mode</strong>
              <p>Dashboard figures are calculated from saved records. SAP-RPT prediction integration is not connected.</p>
            </div>
          </section>

          {page === "Overview" && <>
            <section className="metrics-grid">
              <Metric title="Tracked disruptions" value={events.length} caption="Saved disruption records" icon={<Activity size={20} />} color="purple" />
              <Metric title="Active disruptions" value={activeCount} caption="Currently marked active" icon={<AlertTriangle size={20} />} color="orange" />
              <Metric title="Geolocated records" value={geolocatedCount} caption="Records with coordinates" icon={<Navigation size={20} />} color="blue" />
              <Metric title="Impact engine" value="Demo" caption="Rule-based estimates; not trained ML" icon={<ShieldCheck size={20} />} color="green" />
            </section>

            <section className="content-grid">
              <article className="panel">
                <div className="panel-heading">
                  <div><h3>Disruption Severity</h3><p>Severity distribution from saved records</p></div>
                  <span className="chart-tag">LIVE RECORDS</span>
                </div>
                <div className="chart-area">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={severityChartData} margin={{ top: 15, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid stroke="#ececf3" strokeDasharray="4 4" vertical={false} />
                      <XAxis dataKey="severity" axisLine={false} tickLine={false} tick={{ fill: "#85859a", fontSize: 11 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "#85859a", fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#5957cb" radius={[7, 7, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="chart-disclaimer">Counts are calculated from disruption records currently stored in the application.</p>
              </article>

              <article className="panel response-panel">
                <div className="panel-heading"><div><h3>Operational Snapshot</h3><p>Calculated from saved records</p></div><Building2 size={20} /></div>
                <Snapshot icon={<Clock size={18} />} title="Average disruption duration" text={`${averageDuration} hours across ${events.length} records`} />
                <Snapshot icon={<MapPin size={18} />} title="Geographic coverage" text={`${geolocatedCount} of ${events.length} records have coordinates`} />
                <Snapshot icon={<TrendingUp size={18} />} title="Affected population" text={affectedPopulation.toLocaleString("en-IN")} />
                <button className="text-button" onClick={() => setPage("Impact Analysis")}>Explore impact analysis →</button>
              </article>
            </section>
          </>}

          {page === "Disruptions" && <section className="panel table-panel">
            <div className="panel-heading">
              <div><h3>Disruption Registry</h3><p>Disruption records retrieved from the application database</p></div>
              <button className="secondary-button" onClick={() => setShowForm(true)}><Plus size={16} /> Add event</button>
            </div>
            <div className="table-wrap"><table>
              <thead><tr><th>LOCATION</th><th>DISRUPTION</th><th>DURATION</th><th>SEVERITY</th><th>STATUS</th></tr></thead>
              <tbody>{events.map(event => <tr key={event.id}>
                <td><strong>{event.name}</strong><span className="table-subtitle">{event.area}</span></td>
                <td>{event.disruptionType || "Road Closure"}</td><td>{event.duration}</td>
                <td><span className={`severity severity-${event.severity.toLowerCase()}`}>{event.severity}</span></td>
                <td><span className="status-pill">{event.status}</span></td>
              </tr>)}</tbody>
            </table></div>
          </section>}

          {page === "City Map" && <section className="panel real-map-panel">
            <div className="panel-heading map-heading">
              <div><h3>Bengaluru Disruption Map</h3><p>OpenStreetMap · Saved disruption locations</p></div>
              <span className="chart-tag">DATABASE RECORDS</span>
            </div>
            <div className="map-legend">
              <span><i className="legend-dot red-dot"></i> High severity</span>
              <span><i className="legend-dot amber-dot"></i> Medium severity</span>
            </div>
            <MapContainer center={[12.9716, 77.5946]} zoom={12} scrollWheelZoom={true} className="leaflet-map">\n              <MapAutoFit events={events} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {events.filter(event =>
                event.latitude !== null &&
                event.latitude !== undefined &&
                event.longitude !== null &&
                event.longitude !== undefined
              ).map(event => {
                const color =
                  event.severity === "Critical" || event.severity === "High"
                    ? "#d94f5c"
                    : event.severity === "Medium"
                    ? "#d99a35"
                    : "#399b78";

                return (
                  <Circle
                    key={event.id}
                    center={[Number(event.latitude), Number(event.longitude)]}
                    radius={260}
                    pathOptions={{ color, fillColor: color, fillOpacity: 0.25 }}
                  >
                    <Popup>
                      <strong>{event.name}</strong><br />
                      Area: {event.area}<br />
                      Type: {event.disruptionType}<br />
                      Severity: {event.severity}<br />
                      Duration: {event.duration}<br />
                      Affected population: {event.affectedPopulation ?? "Not specified"}<br />
                      <small>User-entered record; not independently verified.</small>
                    </Popup>
                  </Circle>
                );
              })}
            </MapContainer>
            <p className="chart-disclaimer">Only saved disruptions with valid coordinates appear on the map. Records are user-entered and do not represent verified live traffic conditions.</p>
          </section>}

          {page === "Impact Analysis" && <section className="panel analysis-placeholder">
            <div className="panel-heading">
              <div>
                <h3>Impact Analysis</h3>
                <p>Evaluate the potential consequences of a saved city disruption</p>
              </div>
              <TrendingUp size={22} />
            </div>

            <div className="analysis-grid">
              <Analysis title="INPUT FEATURES" heading="Location, duration, severity" text="Analysis uses the selected disruption record." />
              <Analysis title="MODEL STATUS" heading="Prototype calculation" text="Rule-based estimate. SAP-RPT is not connected." />
              <Analysis title="NEXT MILESTONE" heading="SAP-RPT inference" text="Connect and validate an authorised model endpoint." />
            </div>

            <div className="impact-controls">
              <label htmlFor="impact-disruption">Select a saved disruption</label>
              <select
                id="impact-disruption"
                value={selectedImpactId}
                onChange={e => {
                  setSelectedImpactId(e.target.value);
                  setImpactResult(null);
                  setImpactError("");
                }}
              >
                <option value="">Choose a disruption</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.name} — {event.area}
                  </option>
                ))}
              </select>

              <button
                className="secondary-button"
                onClick={runImpactAnalysis}
                disabled={impactLoading || events.length === 0}
              >
                {impactLoading ? "Analysing..." : "Analyse Impact"}
              </button>

              {events.length === 0 && <p>No saved disruptions available. Add a disruption first.</p>}
              {impactError && <p className="impact-error">{impactError}</p>}
            </div>

            {impactResult && (
              <div className="impact-results">
                <div className="panel-heading">
                  <div>
                    <h3>Impact Assessment Results</h3>
                    <p>Prototype rule-based assessment</p>
                  </div>
                  <span className="chart-tag">ESTIMATE</span>
                </div>

                <div className="analysis-grid">
                  <Analysis
                    title="IMPACT SCORE"
                    heading={`${impactResult.impact_score}/100`}
                    text="Demonstration score"
                  />
                  <Analysis
                    title="RISK CLASSIFICATION"
                    heading={impactResult.impact_level}
                    text={`Reported severity: ${impactResult.severity}`}
                  />
                  <Analysis
                    title="AFFECTED POPULATION"
                    heading={Number(impactResult.affected_population).toLocaleString("en-IN")}
                    text={`Estimated duration: ${impactResult.duration_hours} hours`}
                  />
                </div>

                <div className="impact-recommendations">
                  <h3>Recommended Actions</h3>
                  <ul>
                    {impactResult.recommendations?.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>

                <p className="chart-disclaimer">
                  {impactResult.notice} Recommendations are rule-based suggestions,
                  not verified emergency instructions.
                </p>
              </div>
            )}
          </section>}


          {page === "Predictive Intelligence" && <PredictiveIntelligence />}
          {page === "Machine Learning" && <MLDashboard />}
           {page === "Analytics" && <Analytics events={events} />}
          {page === "Predictive Insights" && <PredictiveInsights events={events} />}
          {page === "Ripple Effects" && <RippleEffects events={events} />}
          {page === "Scenario Simulator" && <ScenarioSimulator />}
          {page === "Location Intelligence" && <LocationIntelligence events={events} />}
          {page === "Recommendations" && <RecommendationEngine events={events} />}
          {page === "Reports" && <Reports events={events} />}
          {page === "SAP Integration" && <SAPIntegration />}
          <footer className="page-footer"><span>URBAN RIPPLE · CITY DISRUPTION INTELLIGENCE</span><span>Prototype · SAP-RPT integration pending</span></footer>
        </div>
      </main>

      {showForm && <div className="modal-backdrop" onClick={() => setShowForm(false)}>
        <section className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-heading">
            <div><span className="eyebrow">EVENT MANAGEMENT</span><h2>Register a disruption</h2><p>Add a road closure to the local demo registry.</p></div>
            <button className="icon-button" onClick={() => setShowForm(false)}><X size={20} /></button>
          </div>
          <form onSubmit={addEvent}>
            <label>Disruption type
              <select value={form.disruptionType}
                onChange={e => setForm({ ...form, disruptionType: e.target.value })}>
                <option>Road Closure</option>
                <option>Water Outage</option>
                <option>Power Outage</option>
              </select>
            </label>

            <label>Road or location name
              <input required value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Hosur Road" />
            </label>

            <label>Area or neighborhood
              <input required value={form.area}
                onChange={e => setForm({ ...form, area: e.target.value })}
                placeholder="e.g. Electronic City" />
            </label>

            <div className="form-row">
              <label>Latitude
                <input type="number" step="any" min="-90" max="90"
                  value={form.latitude}
                  onChange={e => setForm({ ...form, latitude: e.target.value })}
                  placeholder="e.g. 12.8452" />
              </label>
              <label>Longitude
                <input type="number" step="any" min="-180" max="180"
                  value={form.longitude}
                  onChange={e => setForm({ ...form, longitude: e.target.value })}
                  placeholder="e.g. 77.6602" />
              </label>
            </div>

            <div className="form-row">
              <label>Duration
                <select value={form.duration}
                  onChange={e => setForm({ ...form, duration: e.target.value })}>
                  <option>1 hour</option><option>2 hours</option>
                  <option>4 hours</option><option>6 hours</option>
                  <option>12 hours</option><option>24 hours</option>
                </select>
              </label>
              <label>Affected population
                <input type="number" min="0" step="1" required
                  value={form.population}
                  onChange={e => setForm({ ...form, population: e.target.value })}
                  placeholder="e.g. 1000" />
              </label>
            </div>

            <label>Severity
              <select value={form.severity}
                onChange={e => setForm({ ...form, severity: e.target.value })}>
                <option>Low</option><option>Medium</option>
                <option>High</option><option>Critical</option>
              </select>
            </label>

            <div className="form-note"><AlertTriangle size={16} />This creates a local demo record, not a real prediction.</div>
            <button className="primary-button submit-button" type="submit">Save disruption →</button>
          </form>
        </section>
      </div>}
    </div>
  );
}

function Metric({ title, value, caption, icon, color }) {
  return <article className="metric-card">
    <div className="metric-top"><span>{title}</span><div className={`metric-icon ${color}`}>{icon}</div></div>
    <h2 className={title === "Model connection" ? "connection-text" : ""}>{value}</h2>
    <p className="metric-caption">{caption}</p>
  </article>;
}

function Snapshot({ icon, title, text }) {
  return <div className="snapshot-item"><div className="snapshot-icon">{icon}</div><div><strong>{title}</strong><p>{text}</p></div></div>;
}

function Analysis({ title, heading, text }) {
  return <div className="analysis-card"><span>{title}</span><h4>{heading}</h4><p>{text}</p></div>;
}
