import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid
} from "recharts";

export default function Analytics({ events }) {
  const severity = ["Low", "Medium", "High", "Critical"].map(name => ({
    name,
    count: events.filter(e => e.severity === name).length
  }));

  const types = ["Road Closure", "Water Outage", "Power Outage"].map(name => ({
    name,
    count: events.filter(e => e.disruptionType === name).length
  }));

  const population = events.reduce(
    (sum, e) => sum + Number(e.affectedPopulation || 0), 0
  );

  const statusSummary = {
    active: events.filter(e => e.status?.toLowerCase() === "active").length,
    monitoring: events.filter(e => e.status?.toLowerCase() === "monitoring").length,
    planned: events.filter(e => e.status?.toLowerCase() === "planned").length,
    resolved: events.filter(e => e.status?.toLowerCase() === "resolved").length
  };

  const active = statusSummary.active;
  const highRisk = events.filter(e =>
    ["High", "Critical"].includes(e.severity)
  ).length;

  return (
    <section className="module-page">
      <div className="module-heading">
        <h2>City Analytics</h2>
        <p>Statistics calculated from saved disruption records</p>
      </div>

      <div className="module-kpis">
        <article><span>Total disruptions</span><strong>{events.length}</strong></article>
        <article><span>Active disruptions</span><strong>{statusSummary.active}</strong></article>
        <article><span>Monitoring</span><strong>{statusSummary.monitoring}</strong></article>
        <article><span>Planned</span><strong>{statusSummary.planned}</strong></article>
        <article><span>Resolved</span><strong>{statusSummary.resolved}</strong></article>
        <article><span>High-risk records</span><strong>{highRisk}</strong></article>
        <article><span>Affected population</span><strong>{population.toLocaleString("en-IN")}</strong></article>
      </div>

      <div className="module-charts">
        <article className="panel">
          <h3>Severity Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={severity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#625fc7" radius={[5,5,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article className="panel">
          <h3>Disruption Type Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={types} dataKey="count" nameKey="name"
                outerRadius={85} label>
                {types.map((item, index) => (
                  <Cell key={item.name}
                    fill={["#625fc7", "#e5a34b", "#db6872"][index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </article>
      </div>

      <p className="chart-disclaimer">
        Analytics reflect records currently stored in the application.
        They are not live city-wide statistics.
      </p>
    </section>
  );
}
