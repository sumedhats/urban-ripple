const stages = [
  ["01", "Disruption Data", "React application and SQLite records"],
  ["02", "API Integration Layer", "Structured request and response interface"],
  ["03", "SAP-RPT Endpoint", "Authorised SAP prediction service required"],
  ["04", "Knowledge Graph", "Represent relationships between city entities"],
  ["05", "Prediction Output", "Risk score, impact category and recommendations"],
  ["06", "Decision Support", "Display results for analyst review"]
];

export default function SAPIntegration() {
  return (
    <section className="module-page">
      <div className="module-heading">
        <h2>SAP Integration Architecture</h2>
        <p>Proposed architecture for future SAP-RPT integration</p>
      </div>

      <div className="integration-status">
        <span className="status-pill">Architecture prototype</span>
        <strong>SAP-RPT: Not connected</strong>
      </div>

      <div className="integration-flow">
        {stages.map(([number, title, description]) => (
          <article className="panel integration-stage" key={number}>
            <span>{number}</span>
            <div>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          </article>
        ))}
      </div>

      <p className="chart-disclaimer">
        This is a proposed integration design. No SAP endpoint, live
        knowledge graph or SAP prediction service is currently connected.
      </p>
    </section>
  );
}
