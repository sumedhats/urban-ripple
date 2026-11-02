const weights = { Low: 1, Medium: 2, High: 3, Critical: 4 };

export default function PredictiveInsights({ events }) {
  const ranked = events.map(event => {
    const score = Math.min(100, Math.round(
      weights[event.severity] *
      Math.min(Number.parseFloat(event.duration) || 1, 72) *
      (1 + Math.log10(Number(event.affectedPopulation || 0) + 1)) * 4
    ));

    return {
      ...event,
      score,
      risk: score >= 75 ? "Severe" :
        score >= 50 ? "High" :
        score >= 25 ? "Moderate" : "Low"
    };
  }).sort((a, b) => b.score - a.score);

  return (
    <section className="module-page">
      <div className="module-heading">
        <h2>Predictive Insights</h2>
        <p>Prototype risk screening based on recorded disruption attributes</p>
      </div>

      {ranked.length === 0 && <p>No disruption records available.</p>}

      {ranked.map(event => (
        <article className="module-record" key={event.id}>
          <div>
            <strong>{event.name}</strong>
            <p>{event.area} · {event.disruptionType}</p>
          </div>
          <div className="module-risk">
            <strong>{event.score}/100</strong>
            <span>{event.risk} risk</span>
          </div>
        </article>
      ))}

      <p className="chart-disclaimer">
        These are illustrative rule-based screening scores, not validated
        forecasts or trained AI predictions.
      </p>
    </section>
  );
}
