export function exportAnalyticsJSON(data) {
  if (!data) {
    throw new Error("No analytics data available.");
  }

  const report = {
    report_name: "URBAN RIPPLE Analytics Report",
    generated_at: new Date().toISOString(),
    report_data: data
  };

  const blob = new Blob(
    [JSON.stringify(report, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `urban-ripple-report-${new Date()
    .toISOString()
    .slice(0, 10)}.json`;

  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
