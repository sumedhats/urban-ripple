import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from "recharts";

import "./AnalyticsCharts.css";

const COLORS = [
  "#2878d0",
  "#16a085",
  "#e6a23c",
  "#e05252",
  "#805ad5",
  "#64748b"
];

export default function AnalyticsCharts({ data }) {
  if (!data) return null;

  const severityData = data.severity_distribution || [];
  const typeData = data.disruption_types || [];
  const monthlyData = data.monthly_trend || [];

  const locationData = [...(data.location_impact || [])]
    .sort(
      (a, b) =>
        Number(b.affected_population || 0) -
        Number(a.affected_population || 0)
    )
    .slice(0, 10);

  return (
    <section className="urban-charts">
      <article className="urban-chart-card">
        <h2>Monthly Disruption Activity</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="count"
              name="Disruptions"
              stroke="#2878d0"
              strokeWidth={3}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </article>

      <article className="urban-chart-card">
        <h2>Severity Distribution</h2>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={severityData}
              dataKey="count"
              nameKey="severity"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label
            >
              {severityData.map((item, index) => (
                <Cell
                  key={`${item.severity}-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </article>

      <article className="urban-chart-card">
        <h2>Disruption Categories</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={typeData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="disruption_type"
              width={120}
            />
            <Tooltip />
            <Bar
              dataKey="count"
              name="Disruptions"
              fill="#16a085"
              radius={[0, 6, 6, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </article>

      <article className="urban-chart-card">
        <h2>Population Affected by Location</h2>
        {locationData.length === 0 ? (
          <p>No location impact data available.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={locationData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis
                type="category"
                dataKey="location"
                width={120}
              />
              <Tooltip />
              <Bar
                dataKey="affected_population"
                name="Affected Population"
                fill="#805ad5"
                radius={[0, 6, 6, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </article>
    </section>
  );
}
