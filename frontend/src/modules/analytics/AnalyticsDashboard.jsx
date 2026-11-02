import { useEffect, useState } from "react";
import { getAnalyticsOverview } from "../../services/analyticsService";
import { exportAnalyticsCSV } from "../../utils/analyticsExport";
import AnalyticsCharts from "./charts/AnalyticsCharts";
import { exportAnalyticsJSON } from "../../utils/analyticsJsonExport";
import "./AnalyticsDashboard.css";

export default function AnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  async function applyQuickFilter(days) {
    const end = new Date();
    const start = new Date();

    let startValue = "";

    if (days !== null) {
      start.setDate(start.getDate() - days);
      startValue = start.toISOString().slice(0, 10);
    }

    const endValue = days === null ? "" : end.toISOString().slice(0, 10);

    setStartDate(startValue);
    setEndDate(endValue);

    try {
      setLoading(true);
      setError("");
      const result = await getAnalyticsOverview(startValue, endValue);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadAnalytics() {
    try {
      setLoading(true);
      setError("");
      const result = await getAnalyticsOverview(startDate, endDate);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) return <div className="analytics-page">Loading analytics...</div>;

  if (error) {
    return (
      <div className="analytics-page">
        <h2>Analytics Dashboard</h2>
        <p className="analytics-error">{error}</p>
        <button onClick={loadAnalytics}>Retry</button>
      </div>
    );
  }

  const highRiskCount = Number(data.risk_summary?.high_risk || 0);
  const totalDisruptions = Number(data.total_disruptions || 0);
  const highRiskPercentage = totalDisruptions
    ? (highRiskCount / totalDisruptions) * 100
    : 0;

  const highRiskPopulation = Number(
    data.risk_summary?.high_risk_population || 0
  );
  const totalAffectedPopulation = Number(data.affected_population || 0);

  const affectedPopulationPercentage = totalAffectedPopulation
    ? (highRiskPopulation / totalAffectedPopulation) * 100
    : 0;

  const maxMonthly = Math.max(
    1,
    ...(data.monthly_trend || []).map(item => item.count)
  );

  return (
    <main className="analytics-page">
      <header className="analytics-header">
        <div>
          <p className="analytics-eyebrow">URBAN RIPPLE / INSIGHTS</p>
          <h1>Analytics Dashboard</h1>
          <p>Understand disruption patterns and their city-wide impact.</p>
        </div>
        <div className="analytics-actions">
          <button onClick={() => exportAnalyticsCSV(data)}>Export CSV</button>
          <button onClick={() => exportAnalyticsJSON(data)}>Export JSON</button>
          <button onClick={loadAnalytics}>Refresh Data</button>
        </div>
      </header>

      <section className="analytics-quick-filters">
        <button onClick={() => applyQuickFilter(7)}>Last 7 Days</button>
        <button onClick={() => applyQuickFilter(30)}>Last 30 Days</button>
        <button onClick={() => applyQuickFilter(90)}>Last 90 Days</button>
        <button onClick={() => applyQuickFilter(null)}>All Time</button>
      </section>

      <section className="analytics-filters">
        <label>
          Start date
          <input
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={event => setStartDate(event.target.value)}
          />
        </label>
        <label>
          End date
          <input
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={event => setEndDate(event.target.value)}
          />
        </label>
        <button onClick={loadAnalytics}>Apply Filters</button>
        <button onClick={() => {
          setStartDate("");
          setEndDate("");
          getAnalyticsOverview().then(setData).catch(err => setError(err.message));
        }}>
          Clear Filters
        </button>
      </section>

      <section className="analytics-risk-summary">
        <article>
          <span>Critical Disruptions</span>
          <strong>{data.risk_summary?.critical ?? 0}</strong>
        </article>
        <article>
          <span>High Severity Disruptions</span>
          <strong>{data.risk_summary?.high ?? 0}</strong>
        </article>
        <article>
          <span>High-Risk Events</span>
          <strong>{data.risk_summary?.high_risk ?? 0}</strong>
        </article>
        <article>
          <span>Population in High-Risk Events</span>
          <strong>{Number(data.risk_summary?.high_risk_population ?? 0).toLocaleString("en-IN")}</strong>
        </article>
      </section>

      <section className="analytics-exposure">
        <div className="analytics-exposure-heading">
          <div>
            <h2>Risk Exposure Analysis</h2>
            <p>Based on recorded high and critical severity events.</p>
          </div>
        </div>

        <div className="analytics-exposure-item">
          <div>
            <span>High-risk share of disruptions</span>
            <strong>{highRiskPercentage.toFixed(1)}%</strong>
          </div>
          <div className="analytics-exposure-track">
            <div
              className="analytics-exposure-fill"
              style={{ width: `${Math.min(highRiskPercentage, 100)}%` }}
            />
          </div>
        </div>

        <div className="analytics-exposure-item">
          <div>
            <span>High-risk share of affected population</span>
            <strong>{affectedPopulationPercentage.toFixed(1)}%</strong>
          </div>
          <div className="analytics-exposure-track">
            <div
              className="analytics-exposure-fill population"
              style={{ width: `${Math.min(affectedPopulationPercentage, 100)}%` }}
            />
          </div>
        </div>
      </section>

      <section className="analytics-stats">
        <article className="analytics-card">
          <span>Total Disruptions</span>
          <strong>{data.total_disruptions}</strong>
        </article>
        <article className="analytics-card">
          <span>Population Affected</span>
          <strong>{Number(data.affected_population).toLocaleString("en-IN")}</strong>
        </article>
        <article className="analytics-card">
          <span>Disruption Categories</span>
          <strong>{data.disruption_types.length}</strong>
        </article>
        <article className="analytics-card">
          <span>Locations Impacted</span>
          <strong>{data.location_impact.length}</strong>
        </article>
      </section>

      <AnalyticsCharts data={data} />

      <section className="analytics-grid">
        <article className="analytics-panel">
          <h2>Monthly Disruption Trend</h2>
          {data.monthly_trend.length === 0 ? (
            <p>No monthly records available.</p>
          ) : (
            <div className="analytics-bars">
              {data.monthly_trend.map(item => (
                <div className="analytics-bar-row" key={item.month}>
                  <span>{item.month}</span>
                  <div className="analytics-bar-track">
                    <div
                      className="analytics-bar"
                      style={{ width: `${(item.count / maxMonthly) * 100}%` }}
                    />
                  </div>
                  <strong>{item.count}</strong>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="analytics-panel">
          <h2>Severity Distribution</h2>
          {data.severity_distribution.length === 0 ? (
            <p>No severity records available.</p>
          ) : (
            data.severity_distribution.map(item => (
              <div className="analytics-list-row" key={item.severity}>
                <span>{item.severity || "Unspecified"}</span>
                <strong>{item.count}</strong>
              </div>
            ))
          )}
        </article>

        <article className="analytics-panel">
          <h2>Disruption Types</h2>
          {data.disruption_types.length === 0 ? (
            <p>No disruption types available.</p>
          ) : (
            data.disruption_types.map(item => (
              <div className="analytics-list-row" key={item.disruption_type}>
                <span>{item.disruption_type || "Unspecified"}</span>
                <strong>{item.count}</strong>
              </div>
            ))
          )}
        </article>

        <article className="analytics-panel">
          <h2>Location-wise Impact</h2>
          {data.location_impact.length === 0 ? (
            <p>No location records available.</p>
          ) : (
            data.location_impact.map(item => (
              <div className="analytics-location-row" key={item.location}>
                <div>
                  <strong>{item.location || "Unknown location"}</strong>
                  <span>
                    {Number(item.affected_population || 0).toLocaleString("en-IN")}
                    {" "}people affected
                  </span>
                </div>
                <strong>{item.count} events</strong>
              </div>
            ))
          )}
        </article>
      </section>

      <p className="analytics-note">
        Figures are calculated from recorded disruptions. They represent
        reported data, not independently verified real-world impact.
      </p>
    </main>
  );
}
