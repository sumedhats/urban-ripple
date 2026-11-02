const portals = {
  admin: {
    title: "Administrator Portal",
    description: "Manage users, departments, permissions and city operations.",
    modules: ["User Management", "Department Management", "System Settings", "Audit Monitoring"]
  },
  official: {
    title: "Government Official Portal",
    description: "Review city disruptions and coordinate operational decisions.",
    modules: ["Disruption Review", "City Analytics", "Emergency Coordination", "Reports"]
  },
  analyst: {
    title: "City Analyst Portal",
    description: "Study disruption patterns, risk scores and predicted impacts.",
    modules: ["Predictive Intelligence", "Historical Analysis", "Risk Assessment", "City Reports"]
  },
  emergency: {
    title: "Emergency Response Portal",
    description: "Monitor incidents and coordinate response resources.",
    modules: ["Incident Monitoring", "Response Management", "Resource Allocation", "Emergency Alerts"]
  },
  public: {
    title: "Citizen Portal",
    description: "Submit disruption reports and explore public city information.",
    modules: ["Report a Disruption", "Track Reports", "City Map", "Public Alerts"]
  }
};

export default function RolePortal({ user, onOpenWorkspace, onLogout }) {
  const role = String(user.role || "public").toLowerCase();
  const portal = portals[role] || portals.public;

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <strong>URBAN RIPPLE</strong>
          <small> CITY INTELLIGENCE PLATFORM</small>
        </div>
        <button style={styles.logout} onClick={onLogout}>Logout</button>
      </header>

      <section style={styles.content}>
        <p style={styles.eyebrow}>{role.toUpperCase()} WORKSPACE</p>
        <h1>{portal.title}</h1>
        <p style={styles.description}>{portal.description}</p>

        <div style={styles.grid}>
          {portal.modules.map((module, index) => (
            <article style={styles.card} key={module}>
              <span style={styles.number}>0{index + 1}</span>
              <h3>{module}</h3>
            </article>
          ))}
        </div>

        <button style={styles.primary} onClick={onOpenWorkspace}>
          Open URBAN RIPPLE Dashboard →
        </button>

        <p style={styles.user}>
          Signed in as {user.name} · {user.email} · {role}
        </p>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh", background: "#f4f5fa",
    fontFamily: "Arial, sans-serif", color: "#25263a"
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "20px 6%", background: "white", borderBottom: "1px solid #e8e8ef"
  },
  headerSmall: { color: "#888" },
  logout: {
    padding: "10px 18px", background: "white", border: "1px solid #ddd",
    borderRadius: 8, cursor: "pointer"
  },
  content: { maxWidth: 1050, margin: "auto", padding: "65px 24px" },
  eyebrow: { color: "#5957cb", fontWeight: 700, letterSpacing: 2, fontSize: 12 },
  description: { color: "#737489", lineHeight: 1.6 },
  grid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))",
    gap: 18, margin: "35px 0"
  },
  card: {
    background: "white", padding: 24, borderRadius: 14,
    border: "1px solid #e9e9f1", minHeight: 90
  },
  number: { color: "#5957cb", fontWeight: 800 },
  primary: {
    padding: "14px 22px", background: "#5957cb", color: "white",
    border: 0, borderRadius: 9, fontWeight: 700, cursor: "pointer"
  },
  user: { color: "#777", fontSize: 12, marginTop: 28 }
};
