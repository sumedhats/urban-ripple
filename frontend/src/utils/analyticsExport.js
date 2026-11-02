export function exportAnalyticsCSV(data) {
  if (!data) {
    throw new Error("No analytics data available.");
  }

  const sections = [
    {
      title: "Overview",
      rows: [
        ["Metric", "Value"],
        ["Total Disruptions", data.total_disruptions ?? 0],
        ["Affected Population", data.affected_population ?? 0],
        ["Disruption Categories", data.disruption_types?.length ?? 0],
        ["Locations Impacted", data.location_impact?.length ?? 0]
      ]
    },
    {
      title: "Monthly Trend",
      rows: [
        ["Month", "Disruptions"],
        ...(data.monthly_trend || []).map(item => [
          item.month,
          item.count
        ])
      ]
    },
    {
      title: "Severity Distribution",
      rows: [
        ["Severity", "Count"],
        ...(data.severity_distribution || []).map(item => [
          item.severity,
          item.count
        ])
      ]
    },
    {
      title: "Disruption Types",
      rows: [
        ["Disruption Type", "Count"],
        ...(data.disruption_types || []).map(item => [
          item.disruption_type,
          item.count
        ])
      ]
    },
    {
      title: "Location Impact",
      rows: [
        ["Location", "Disruptions", "Affected Population"],
        ...(data.location_impact || []).map(item => [
          item.location,
          item.count,
          item.affected_population
        ])
      ]
    }
  ];

  const escapeCell = value => {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  };

  const csv = sections
    .flatMap(section => [
      [section.title],
      ...section.rows,
      []
    ])
    .map(row => row.map(escapeCell).join(","))
    .join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `urban-ripple-analytics-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
