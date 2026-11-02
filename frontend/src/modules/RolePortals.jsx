import React from "react";

const portalConfig = {
  admin: {
    title: "Admin Portal",
    description: "Manage users, roles, departments and system configuration.",
    modules: ["User Management", "Role Management", "Department Management", "Audit Logs"]
  },
  official: {
    title: "Official Portal",
    description: "Review reported disruptions and coordinate response activities.",
    modules: ["Incident Review", "Disruption Assignment", "Status Updates", "Response Tracking"]
  },
  analyst: {
    title: "Analyst Portal",
    description: "Review urban risk, forecasts and disruption trends.",
    modules: ["Risk Scores", "Forecasts", "Anomaly Detection", "Analytics", "Reports"]
  },
  public: {
    title: "Public Portal",
    description: "Submit disruption reports and view permitted public updates.",
    modules: ["Report a Disruption", "My Reports", "Public Alerts"]
  }
};

export default function RolePortals({ role = "public" }) {
  const normalizedRole = String(role).toLowerCase();
  const portal = portalConfig[normalizedRole] || portalConfig.public;

  return (
    <section className="role-portals" style={{ padding: 24 }}>
      <p style={{ color: "#64748b", fontSize: 12, letterSpacing: 1 }}>URBAN RIPPLE WORKSPACE</p>
      <h1>{portal.title}</h1>
      <p>{portal.description}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 16, marginTop: 24 }}>
        {portal.modules.map((item) => (
          <article key={item} style={{ border: "1px solid #dbe3ec", borderRadius: 12, padding: 18 }}>
            <h3>{item}</h3>
            <p style={{ color: "#64748b", fontSize: 13 }}>Workspace module</p>
          </article>
        ))}
      </div>
    </section>
  );
}
