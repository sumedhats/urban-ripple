import { useEffect, useState } from "react";
import {
  getEmergencyIncidents,
  getEmergencySummary,
  createEmergencyIncident,
  updateEmergencyIncident,
} from "../../services/emergencyService";
import "./EmergencyDashboard.css";

export default function EmergencyDashboard() {
  const [incidents, setIncidents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    incident_type: "Flood",
    priority: "medium",
  });

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [incidentData, summaryData] = await Promise.all([
        getEmergencyIncidents(),
        getEmergencySummary(),
      ]);

      setIncidents(incidentData.incidents || []);
      setSummary(summaryData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function changeField(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      await createEmergencyIncident(form);

      setMessage("Emergency incident registered successfully.");

      setForm({
        title: "",
        description: "",
        location: "",
        incident_type: "Flood",
        priority: "medium",
      });

      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(id, status) {
    setError("");
    setMessage("");

    try {
      await updateEmergencyIncident(id, { status });
      setMessage("Incident status updated.");
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function assignTeam(id) {
    const team = window.prompt("Enter the response team name:");

    if (!team?.trim()) return;

    try {
      await updateEmergencyIncident(id, {
        assigned_team: team.trim(),
        status: "assigned",
      });

      setMessage("Response team assigned.");
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="emergency-dashboard">
      <header className="emergency-header">
        <div>
          <span className="emergency-eyebrow">
            URBAN RIPPLE / RESPONSE OPERATIONS
          </span>
          <h1>Emergency Management</h1>
          <p>Monitor incidents and coordinate emergency response.</p>
        </div>

        <button onClick={loadData} disabled={loading}>
          Refresh
        </button>
      </header>

      {error && <div className="emergency-error">{error}</div>}
      {message && <div className="emergency-success">{message}</div>}

      <section className="emergency-stats">
        <article>
          <span>Total Incidents</span>
          <strong>{summary?.total_incidents ?? 0}</strong>
        </article>

        <article>
          <span>Reported</span>
          <strong>{summary?.by_status?.reported ?? 0}</strong>
        </article>

        <article>
          <span>In Progress</span>
          <strong>{summary?.by_status?.in_progress ?? 0}</strong>
        </article>

        <article>
          <span>Resolved</span>
          <strong>{summary?.by_status?.resolved ?? 0}</strong>
        </article>
      </section>

      <section className="emergency-panel">
        <h2>Register Emergency Incident</h2>

        <form onSubmit={handleSubmit}>
          <label>
            Incident Title
            <input
              name="title"
              value={form.title}
              onChange={changeField}
              required
              minLength={3}
              placeholder="Enter incident title"
            />
          </label>

          <label>
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={changeField}
              required
              minLength={5}
              placeholder="Describe the incident"
            />
          </label>

          <label>
            Location
            <input
              name="location"
              value={form.location}
              onChange={changeField}
              required
              placeholder="Enter affected location"
            />
          </label>

          <label>
            Incident Type
            <select
              name="incident_type"
              value={form.incident_type}
              onChange={changeField}
            >
              <option>Flood</option>
              <option>Road Accident</option>
              <option>Fire</option>
              <option>Infrastructure Failure</option>
              <option>Power Outage</option>
              <option>Other</option>
            </select>
          </label>

          <label>
            Priority
            <select
              name="priority"
              value={form.priority}
              onChange={changeField}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </label>

          <button type="submit" disabled={saving}>
            {saving ? "Registering..." : "Register Incident"}
          </button>
        </form>
      </section>

      <section className="emergency-panel">
        <h2>Incident Operations</h2>

        {loading ? (
          <p>Loading incidents...</p>
        ) : incidents.length === 0 ? (
          <p>No emergency incidents registered yet.</p>
        ) : (
          <div className="emergency-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Incident</th>
                  <th>Location</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Response Team</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {incidents.map((incident) => (
                  <tr key={incident.id}>
                    <td>{incident.title}</td>
                    <td>{incident.location}</td>
                    <td>
                      <span className={`priority ${incident.priority}`}>
                        {incident.priority}
                      </span>
                    </td>
                    <td>{incident.status.replaceAll("_", " ")}</td>
                    <td>{incident.assigned_team || "Unassigned"}</td>
                    <td>
                      <div className="emergency-actions">
                        <button
                          onClick={() => assignTeam(incident.id)}
                        >
                          Assign
                        </button>

                        <select
                          value={incident.status}
                          onChange={(event) =>
                            changeStatus(incident.id, event.target.value)
                          }
                          aria-label={`Update status for ${incident.title}`}
                        >
                          <option value="reported">Reported</option>
                          <option value="acknowledged">Acknowledged</option>
                          <option value="assigned">Assigned</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
