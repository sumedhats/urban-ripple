import { useEffect, useState } from "react";
import {
  getMLStatus,
  trainMLModel,
  getMLAnomalies,
} from "../../services/mlService";
import "./MLDashboard.css";

export default function MLDashboard() {
  const [status, setStatus] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const modelStatus = await getMLStatus();
      setStatus(modelStatus);

      if (modelStatus.trained) {
        const data = await getMLAnomalies();
        setResults(data.results || []);
      } else {
        setResults([]);
      }
    } catch (err) {
      setError(err.message || "Unable to load ML dashboard.");
    } finally {
      setLoading(false);
    }
  }

  async function handleTraining() {
    setTraining(true);
    setError("");
    setMessage("");

    try {
      const response = await trainMLModel();
      setMessage(response.message || "Model training completed.");
      await loadDashboard();
    } catch (err) {
      setError(err.message || "Model training failed.");
    } finally {
      setTraining(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const anomalyCount = results.filter(
    (item) => item.anomaly
  ).length;

  return (
    <main className="ml-dashboard">
      <header className="ml-header">
        <div>
          <span className="ml-eyebrow">
            URBAN RIPPLE / MACHINE LEARNING
          </span>
          <h1>ML Intelligence Centre</h1>
          <p>
            Detect unusual patterns in historical city disruptions.
          </p>
        </div>

        <button
          className="ml-refresh"
          onClick={loadDashboard}
          disabled={loading}
        >
          Refresh
        </button>
      </header>

      {error && <div className="ml-error">{error}</div>}
      {message && <div className="ml-success">{message}</div>}

      <section className="ml-stats">
        <article className="ml-card">
          <span>Model Status</span>
          <strong>
            {loading
              ? "Loading..."
              : status?.trained
                ? "Trained"
                : "Not Trained"}
          </strong>
        </article>

        <article className="ml-card">
          <span>Training Records</span>
          <strong>
            {status?.training_records ?? 0}
          </strong>
        </article>

        <article className="ml-card">
          <span>Records Analysed</span>
          <strong>{results.length}</strong>
        </article>

        <article className="ml-card">
          <span>Unusual Records</span>
          <strong>{anomalyCount}</strong>
        </article>
      </section>

      <section className="ml-panel">
        <div>
          <h2>Isolation Forest Model</h2>
          <p>
            Uses disruption duration, affected population and
            severity to identify unusual records.
          </p>
          {status?.trained_at && (
            <small>Last trained: {status.trained_at}</small>
          )}
        </div>

        <button
          className="ml-train"
          onClick={handleTraining}
          disabled={training || loading}
        >
          {training ? "Training..." : "Train Model"}
        </button>
      </section>

      <section className="ml-panel">
        <h2>Anomaly Detection Results</h2>

        {loading ? (
          <p>Loading anomaly results...</p>
        ) : results.length === 0 ? (
          <p>No results available. Train the model when sufficient
            historical records are available.</p>
        ) : (
          <div className="ml-table-wrap">
            <table className="ml-table">
              <thead>
                <tr>
                  <th>Disruption</th>
                  <th>Location</th>
                  <th>Severity</th>
                  <th>Population</th>
                  <th>Duration</th>
                  <th>Classification</th>
                  <th>Score</th>
                </tr>
              </thead>

              <tbody>
                {results.map((item) => (
                  <tr key={item.id}>
                    <td>{item.title}</td>
                    <td>{item.location}</td>
                    <td>{item.severity}</td>
                    <td>
                      {Number(
                        item.affected_population || 0
                      ).toLocaleString()}
                    </td>
                    <td>{item.duration_hours} hrs</td>
                    <td>
                      <span className={
                        item.anomaly
                          ? "ml-tag ml-unusual"
                          : "ml-tag ml-normal"
                      }>
                        {item.classification}
                      </span>
                    </td>
                    <td>{item.anomaly_score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer className="ml-disclaimer">
        Anomaly detection identifies statistically unusual records.
        It does not establish that an incident is dangerous or predict
        future city-wide impact. Results require human review.
      </footer>
    </main>
  );
}
