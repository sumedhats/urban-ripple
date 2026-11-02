
import "../PredictiveIntelligence.css";
import { useCallback, useEffect, useState } from "react";
import {
  Activity, AlertTriangle, Brain, RefreshCw, ShieldAlert,
  TrendingUp, MapPin, Clock, Lightbulb
} from "lucide-react";

import { apiFetch } from "../services/api.js";

async function load(endpoint) {
  const response = await apiFetch(endpoint);
  if (!response.ok) throw new Error(`API request failed: ${response.status}`);
  return response.json();
}

function scoreColor(score) {
  if (score >= 75) return "#dc2626";
  if (score >= 50) return "#ea580c";
  if (score >= 25) return "#ca8a04";
  return "#16a34a";
}

function Metric({ title, value, caption, icon: Icon }) {
  return <article className="pi-metric">
    <div className="pi-metric-heading"><span>{title}</span><Icon size={19}/></div>
    <strong>{value}</strong>
    <small>{caption}</small>
  </article>;
}

export default function PredictiveIntelligence() {
  const [data, setData] = useState({
    risks: null, forecast: null, anomalies: null,
    recommendations: null, hazards: null
  });
  const [horizon, setHorizon] = useState(24);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [risks, forecast, anomalies, recommendations, hazards] =
        await Promise.all([
          load("/api/intelligence/risk-scores"),
          load(`/api/intelligence/forecast?horizon_hours=${horizon}`),
          load("/api/intelligence/anomalies"),
          load("/api/intelligence/recommendations"),
          load("/api/intelligence/multi-hazard")
        ]);
      setData({ risks, forecast, anomalies, recommendations, hazards });
    } catch (e) {
      setError(e.message + ". Check that the backend is running and the intelligence API is available.");
    } finally {
      setLoading(false);
    }
  }, [horizon]);

  useEffect(() => { refresh(); }, [refresh]);

  const risks = data.risks?.results || [];
  const forecasts = data.forecast?.results || [];
  const anomalies = data.anomalies?.results || [];
  const recommendations = data.recommendations?.results || [];
  const hazards = data.hazards?.results || [];
  const average = risks.length
    ? Math.round(risks.reduce((sum, item) => sum + item.risk_score, 0) / risks.length)
    : 0;
  const highRisk = risks.filter(item => item.risk_score >= 50).length;

  return <main className="pi-dashboard">
    <header className="pi-header">
      <div>
        <a className="pi-home-link" href="#">← Main dashboard</a>
        <span className="pi-eyebrow"><Brain size={15}/> URBAN RIPPLE INTELLIGENCE</span>
        <h1>Predictive Intelligence</h1>
        <p>City disruption risks, forecast scenarios and response recommendations.</p>
      </div>
      <button className="pi-refresh" onClick={refresh} disabled={loading}>
        <RefreshCw size={16}/> {loading ? "Refreshing..." : "Refresh data"}
      </button>
    </header>

    {error && <div className="pi-error"><AlertTriangle size={18}/>{error}</div>}

    {loading && !data.risks ? <div className="pi-loading">Loading intelligence data...</div> :
    <>
      <section className="pi-metrics">
        <Metric title="Disruptions analysed" value={risks.length} caption="Database records" icon={Activity}/>
        <Metric title="Average risk score" value={`${average}/100`} caption="Heuristic baseline" icon={TrendingUp}/>
        <Metric title="High-risk incidents" value={highRisk} caption="Score 50 or above" icon={ShieldAlert}/>
        <Metric title="Anomalies detected" value={anomalies.length} caption="Rule-based screening" icon={AlertTriangle}/>
      </section>

      <section className="pi-section">
        <div className="pi-section-title"><ShieldAlert/><div><h2>Location risk assessment</h2><p>Ranked disruption risk scores</p></div></div>
        {risks.length ? <div className="pi-table-wrap"><table className="pi-table">
          <thead><tr><th>Disruption</th><th>Location</th><th>Type</th><th>Risk</th><th>Score</th></tr></thead>
          <tbody>{risks.map(item => <tr key={item.disruption_id}>
            <td>{item.title}</td><td><MapPin size={13}/> {item.location}</td>
            <td>{item.disruption_type}</td>
            <td><span className="pi-level" style={{color:scoreColor(item.risk_score)}}>{item.risk_level}</span></td>
            <td><div className="pi-score"><span>{item.risk_score}</span><div><i style={{width:`${item.risk_score}%`,background:scoreColor(item.risk_score)}}/></div></div></td>
          </tr>)}</tbody>
        </table></div> : <p className="pi-empty">No disruption records available yet.</p>}
      </section>

      <section className="pi-section">
        <div className="pi-section-title"><Clock/><div><h2>Impact forecast</h2><p>Scenario projection based on current disruption records</p></div></div>
        <div className="pi-horizons">
          {[6,24,48].map(value => <button key={value} className={horizon===value?"active":""} onClick={()=>setHorizon(value)}>{value} hours</button>)}
        </div>
        {forecasts.map(item => <div className="pi-forecast" key={item.disruption_id}>
          <div><strong>{item.title}</strong><small>{item.location}</small></div>
          <div className="pi-forecast-score">{item.baseline_risk} → <b style={{color:scoreColor(item.projected_risk)}}>{item.projected_risk}</b></div>
        </div>)}
        <p className="pi-disclaimer">{data.forecast?.method}</p>
      </section>

      <section className="pi-two-column">
        <article className="pi-section">
          <div className="pi-section-title"><AlertTriangle/><div><h2>Anomaly detection</h2><p>Unusual incident characteristics</p></div></div>
          {anomalies.length ? anomalies.map(item=><div className="pi-item" key={item.disruption_id}>
            <strong>{item.title}</strong><small>{item.location}</small>
            {item.reasons.map((reason,i)=><p key={i}>{reason}</p>)}
          </div>) : <p className="pi-empty">No anomalies detected.</p>}
        </article>
        <article className="pi-section">
          <div className="pi-section-title"><Lightbulb/><div><h2>Response recommendations</h2><p>Prioritized suggested actions</p></div></div>
          {recommendations.length ? recommendations.slice(0,8).map(item=><div className="pi-item" key={item.disruption_id}>
            <strong>{item.title}</strong><small>Risk score: {item.risk_score}</small>
            {item.recommendations.map((r,i)=><p key={i}><b>{r.priority}:</b> {r.action}</p>)}
          </div>) : <p className="pi-empty">No recommendations available.</p>}
        </article>
      </section>

      <section className="pi-section">
        <div className="pi-section-title"><Activity/><div><h2>Multi-hazard screening</h2><p>Multiple disruption types recorded at the same location</p></div></div>
        {hazards.length ? hazards.map((item,i)=><div className="pi-forecast" key={i}>
          <div><strong>{item.location}</strong><small>{item.hazard_types.join(" · ")}</small></div>
          <div><b>{item.combined_exposure_score}/100</b><small>{item.incident_count} incidents</small></div>
        </div>) : <p className="pi-empty">No location-level hazard records available.</p>}
      </section>
      <p className="pi-disclaimer">Decision-support prototype. Scores and forecasts are heuristic estimates, not validated real-world predictions. Verify information with responsible city authorities.</p>
    </>}
  </main>;
}
