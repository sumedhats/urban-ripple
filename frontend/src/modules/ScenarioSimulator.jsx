import { useEffect, useState } from "react";
import {
  Activity, AlertTriangle, ArrowRight, Brain,
  CheckCircle2, Clock, MapPin, Play, RefreshCw,
  ShieldAlert, Users, Zap
} from "lucide-react";
import { apiFetch } from "../services/api";
import "./ScenarioSimulator.css";

const initialForm = {
  disruption_type: "road closure",
  severity: "High",
  duration_hours: 4,
  affected_population: 1000,
  location: ""
};

export default function ScenarioSimulator() {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [disruptions, setDisruptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [listLoading, setListLoading] = useState(true);

  async function loadDisruptions() {
    setListLoading(true);
    try {
      const response = await apiFetch("/api/scenarios/active-disruptions");
      if (!response.ok) throw new Error("Could not load active disruptions");
      const data = await response.json();
      setDisruptions(data.disruptions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setListLoading(false);
    }
  }

  useEffect(() => {
    loadDisruptions();
  }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setForm(current => ({
      ...current,
      [name]: name === "duration_hours" || name === "affected_population"
        ? Number(value)
        : value
    }));
  }

  async function runSimulation(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await apiFetch("/api/scenarios/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Scenario simulation failed");
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const riskScore = result?.risk?.score ?? 0;
  const riskLevel = result?.risk?.level ?? "Unknown";

  return (
    <div className="scenario-page">
      <div className="scenario-heading">
        <div>
          <span className="scenario-eyebrow">
            <Brain size={15} /> URBAN INTELLIGENCE ENGINE
          </span>
          <h1>Scenario Simulator</h1>
          <p>
            Model a temporary city disruption and examine its potential
            downstream effects across connected urban systems.
          </p>
        </div>
        <button className="scenario-refresh" onClick={loadDisruptions}>
          <RefreshCw size={16} /> Refresh data
        </button>
      </div>

      <div className="scenario-stats">
        <div className="scenario-stat">
          <span><Activity size={17} /> Active disruptions</span>
          <strong>{listLoading ? "..." : disruptions.length}</strong>
          <small>Records from the live database</small>
        </div>
        <div className="scenario-stat">
          <span><ShieldAlert size={17} /> Latest risk level</span>
          <strong>{result ? riskLevel : "Not run"}</strong>
          <small>Based on your latest scenario</small>
        </div>
        <div className="scenario-stat">
          <span><Users size={17} /> Estimated population</span>
          <strong>
            {result
              ? Number(result.estimated_affected_population).toLocaleString()
              : "—"}
          </strong>
          <small>Model-generated estimate</small>
        </div>
      </div>

      <div className="scenario-layout">
        <section className="scenario-panel">
          <div className="scenario-panel-title">
            <div>
              <span className="scenario-step">01 / INPUT</span>
              <h2>Configure disruption</h2>
            </div>
            <Zap size={20} />
          </div>

          <form onSubmit={runSimulation}>
            <label>
              Disruption type
              <select
                name="disruption_type"
                value={form.disruption_type}
                onChange={updateField}
              >
                <option value="road closure">Road closure</option>
                <option value="water outage">Water outage</option>
                <option value="electricity failure">Electricity failure</option>
                <option value="flood">Flood</option>
                <option value="transport disruption">Transport disruption</option>
              </select>
            </label>

            <label>
              Location
              <input
                name="location"
                value={form.location}
                onChange={updateField}
                placeholder="e.g. Whitefield, Bengaluru"
                minLength={2}
                maxLength={200}
                required
              />
            </label>

            <label>
              Severity
              <select
                name="severity"
                value={form.severity}
                onChange={updateField}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Critical</option>
              </select>
            </label>

            <label>
              Duration (hours)
              <input
                type="number"
                name="duration_hours"
                min="0.1"
                max="720"
                step="0.1"
                value={form.duration_hours}
                onChange={updateField}
                required
              />
            </label>

            <label>
              Affected population
              <input
                type="number"
                name="affected_population"
                min="0"
                max="100000000"
                value={form.affected_population}
                onChange={updateField}
                required
              />
            </label>

            {error && (
              <div className="scenario-error">
                <AlertTriangle size={17} />
                <span>{error}</span>
              </div>
            )}

            <button className="scenario-run" type="submit" disabled={loading}>
              {loading ? (
                <><RefreshCw size={17} className="scenario-spin" /> Simulating...</>
              ) : (
                <><Play size={17} /> Run scenario simulation <ArrowRight size={17} /></>
              )}
            </button>
          </form>
        </section>

        <section className="scenario-panel scenario-results">
          <div className="scenario-panel-title">
            <div>
              <span className="scenario-step">02 / ANALYSIS</span>
              <h2>Simulation results</h2>
            </div>
            <Activity size={20} />
          </div>

          {!result ? (
            <div className="scenario-empty">
              <div className="scenario-empty-icon"><Brain size={34} /></div>
              <h3>Awaiting simulation</h3>
              <p>
                Configure a disruption and run the simulation to see its
                potential impact on connected urban systems.
              </p>
            </div>
          ) : (
            <>
              <div className="scenario-risk">
                <div>
                  <span>OVERALL SCENARIO RISK</span>
                  <strong>{riskScore.toFixed(2)}<small>/100</small></strong>
                  <b className={"risk-" + riskLevel.toLowerCase()}>
                    {riskLevel} Risk
                  </b>
                </div>
                <div
                  className="scenario-risk-ring"
                  style={{ "--risk-value": `${Math.min(100, riskScore)}%` }}
                >
                  <span>{Math.round(riskScore)}%</span>
                </div>
              </div>

              <div className="scenario-result-summary">
                <span><MapPin size={15} /> {result.scenario?.location}</span>
                <span><Clock size={15} /> {result.scenario?.duration_hours} hours</span>
                <span><Users size={15} /> {Number(result.estimated_affected_population).toLocaleString()} estimated affected</span>
              </div>

              <h3 className="scenario-subheading">Downstream system impacts</h3>
              <div className="scenario-impact-list">
                {(result.downstream_impacts || []).map((impact, index) => (
                  <div className="scenario-impact" key={impact.system || index}>
                    <div className="scenario-impact-top">
                      <strong>{impact.system}</strong>
                      <span>{impact.impact_score} · {impact.impact_level}</span>
                    </div>
                    <div className="scenario-impact-track">
                      <div
                        className="scenario-impact-fill"
                        style={{ width: `${Math.min(100, impact.impact_score)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="scenario-subheading">Recommended actions</h3>
              <ul className="scenario-recommendations">
                {(result.recommendations || []).map((item, index) => (
                  <li key={index}>
                    <CheckCircle2 size={16} /> {item}
                  </li>
                ))}
              </ul>

              <p className="scenario-disclaimer">
                {result.disclaimer}
              </p>
            </>
          )}
        </section>
      </div>

      <section className="scenario-panel scenario-active">
        <div className="scenario-panel-title">
          <div>
            <span className="scenario-step">03 / LIVE DATA</span>
            <h2>Existing active disruptions</h2>
          </div>
          <span className="scenario-live-label">DATABASE CONNECTED</span>
        </div>

        {listLoading ? (
          <p className="scenario-muted">Loading disruption records...</p>
        ) : disruptions.length === 0 ? (
          <p className="scenario-muted">No active disruptions found.</p>
        ) : (
          <div className="scenario-table-wrap">
            <table className="scenario-table">
              <thead>
                <tr>
                  <th>Disruption</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Severity</th>
                  <th>Duration</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {disruptions.map(item => (
                  <tr key={item.id}>
                    <td>{item.title}</td>
                    <td>{item.disruption_type}</td>
                    <td>{item.location}</td>
                    <td>{item.severity}</td>
                    <td>{item.duration_hours} hrs</td>
                    <td>{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="scenario-method">
        <AlertTriangle size={15} />
        {result?.method || "Transparent rule-based scenario simulation"}.
        Estimates are preliminary and are not validated predictions or
        verified emergency instructions.
      </p>
    </div>
  );
}
