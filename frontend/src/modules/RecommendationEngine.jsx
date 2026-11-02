export default function RecommendationEngine({ events }) {
  function recommendations(event) {
    const actions = [];

    if (["High", "Critical"].includes(event.severity)) {
      actions.push("Prioritise for city-authority review.");
    }
    if (Number(event.affectedPopulation || 0) >= 1000) {
      actions.push("Consider resident notifications and service coordination.");
    }
    if (event.disruptionType === "Road Closure") {
      actions.push("Review alternate routes and traffic management.");
    }
    if (event.disruptionType === "Water Outage") {
      actions.push("Review backup water arrangements for essential facilities.");
    }
    if (event.disruptionType === "Power Outage") {
      actions.push("Review backup power for critical infrastructure.");
    }
    if (!actions.length) {
      actions.push("Continue monitoring and review if conditions change.");
    }
    return actions;
  }

  return (
    <section className="module-page">
      <div className="module-heading">
        <h2>Recommendation Engine</h2>
        <p>Rule-based response suggestions for recorded disruptions</p>
      </div>

      {events.map(event => (
        <article className="panel recommendation-card" key={event.id}>
          <h3>{event.name}</h3>
          <p>{event.area} · {event.severity} severity</p>
          <ul>
            {recommendations(event).map((item, index) =>
              <li key={index}>{item}</li>
            )}
          </ul>
        </article>
      ))}

      {events.length === 0 && <p>No disruptions available.</p>}

      <p className="chart-disclaimer">
        Suggestions are prototype guidance, not verified emergency
        instructions. Follow official authority directions.
      </p>
    </section>
  );
}
