export default function LocationIntelligence({ events }) {
  const areas = Object.values(events.reduce((groups, event) => {
    const name = event.area || "Unspecified";
    if (!groups[name]) {
      groups[name] = { name, count: 0, highRisk: 0, population: 0 };
    }
    groups[name].count++;
    if (["High", "Critical"].includes(event.severity)) {
      groups[name].highRisk++;
    }
    groups[name].population += Number(event.affectedPopulation || 0);
    return groups;
  }, {}));

  return (
    <section className="module-page">
      <div className="module-heading">
        <h2>Location Intelligence</h2>
        <p>Compare disruption records across reported locations</p>
      </div>

      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>AREA</th>
              <th>RECORDS</th>
              <th>HIGH-RISK</th>
              <th>AFFECTED POPULATION</th>
            </tr>
          </thead>
          <tbody>
            {areas.map(area => (
              <tr key={area.name}>
                <td><strong>{area.name}</strong></td>
                <td>{area.count}</td>
                <td>{area.highRisk}</td>
                <td>{area.population.toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {areas.length === 0 && <p>No location records available.</p>}

      <p className="chart-disclaimer">
        Location comparisons use user-entered records only. They do not
        represent verified city-wide risk zones.
      </p>
    </section>
  );
}
