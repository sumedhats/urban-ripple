export default function CommandCentre({ events = [], onNavigate }) {
  const active = events.filter(e => e.status === "Active").length;
  const critical = events.filter(e =>
    ["High", "Critical"].includes(e.severity)
  ).length;

  const population = events.reduce(
    (sum, e) => sum + Number(e.affectedPopulation || 0), 0
  );

  const actions = [
    ["Analytics", "Review city disruption statistics"],
    ["City Map", "Explore recorded disruption locations"],
    ["Predictive Insights", "Review prototype risk estimates"],
    ["Recommendations", "Review suggested response actions"],
    ["Emergency Response", "Manage emergency operations"],
    ["Reports", "Generate operational reports"]
  ];

  return (
    <section className="module-page">
      <div className="module-heading">
        <h2>Digital City Command Centre</h2>
        <p>Unified urban disruption monitoring and decision support</p>
      </div>

      <div className="module-kpis">
        <article>
          <span>Total disruptions</span>
          <strong>{events.length}</strong>
        </article>
        <article>
          <span>Active disruptions</span>
          <strong>{active}</strong>
        </article>
        <article>
          <span>High-priority records</span>
          <strong>{critical}</strong>
        </article>
        <article>
          <span>Affected population</span>
          <strong>{population.toLocaleString("en-IN")}</strong>
        </article>
      </div>

      <div className="panel">
        <h3>Latest Disruption Records</h3>
        {events.length === 0 ? (
          <p>No disruption records available.</p>
        ) : events.slice(0, 5).map(event => (
          <div className="module-record" key={event.id}>
            <div>
              <strong>{event.name}</strong>
              <p>{event.area} · {event.disruptionType}</p>
            </div>
            <span className={`severity severity-${event.severity.toLowerCase()}`}>
              {event.severity}
            </span>
          </div>
        ))}
      </div>

      <div className="module-heading">
        <h2>Operational Modules</h2>
        <p>Navigate to city intelligence and management tools</p>
      </div>

      <div className="module-kpis">
        {actions.map(([name, description]) => (
          <article key={name}>
            <strong>{name}</strong>
            <p>{description}</p>
            <button
              className="text-button"
              onClick={() => onNavigate?.(name)}
            >
              Open module →
            </button>
          </article>
        ))}
      </div>

      <p className="chart-disclaimer">
        Command Centre statistics use saved application records.
        Emergency and predictive information is not independently verified.
      </p>
    </section>
  );
}
