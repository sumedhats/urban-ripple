const relationships = {
  "Road Closure": [
    "Traffic congestion",
    "Public transport delays",
    "Emergency route disruption"
  ],
  "Water Outage": [
    "Residential water shortage",
    "Hospital and facility pressure",
    "Commercial service disruption"
  ],
  "Power Outage": [
    "Communication interruptions",
    "Water pumping disruption",
    "Transport infrastructure impact"
  ]
};

export default function RippleEffects({ events }) {
  return (
    <section className="module-page">
      <div className="module-heading">
        <h2>Ripple Effect Analysis</h2>
        <p>Explore possible cascading consequences of city disruptions</p>
      </div>

      {events.map(event => (
        <article className="panel ripple-card" key={event.id}>
          <span className="chart-tag">INITIAL DISRUPTION</span>
          <h3>{event.name}</h3>
          <p>{event.disruptionType} · {event.area}</p>
          <div className="ripple-arrow">↓ Possible cascading effects</div>
          <div className="ripple-effects">
            {(relationships[event.disruptionType] || [
              "Further service disruption",
              "Operational delays"
            ]).map(effect => <span key={effect}>{effect}</span>)}
          </div>
        </article>
      ))}

      {events.length === 0 && <p>No saved disruptions available.</p>}

      <p className="chart-disclaimer">
        These relationships are illustrative scenarios, not verified
        causal predictions or live infrastructure dependencies.
      </p>
    </section>
  );
}
