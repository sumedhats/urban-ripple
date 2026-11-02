import jsPDF from "jspdf";
import * as XLSX from "xlsx";

export default function Reports({ events }) {
  function exportExcel() {
    const rows = events.map(e => ({
      Title: e.name,
      Location: e.area,
      Type: e.disruptionType,
      Duration: e.duration,
      Severity: e.severity,
      Status: e.status,
      Latitude: e.latitude ?? "",
      Longitude: e.longitude ?? "",
      AffectedPopulation: e.affectedPopulation ?? 0
    }));

    const sheet = XLSX.utils.json_to_sheet(rows);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Disruptions");
    XLSX.writeFile(book, "Urban_Ripple_Report.xlsx");
  }

  function exportPDF() {
    const pdf = new jsPDF();
    pdf.setFontSize(18);
    pdf.text("URBAN RIPPLE - Disruption Report", 14, 20);
    pdf.setFontSize(10);
    pdf.text(`Total records: ${events.length}`, 14, 30);

    let y = 42;
    events.forEach((event, index) => {
      const lines = [
        `${index + 1}. ${event.name}`,
        `Location: ${event.area} | Type: ${event.disruptionType}`,
        `Severity: ${event.severity} | Duration: ${event.duration}`,
        `Affected population: ${event.affectedPopulation ?? 0}`
      ];

      if (y > 255) {
        pdf.addPage();
        y = 20;
      }

      lines.forEach(line => {
        pdf.text(line, 14, y);
        y += 6;
      });
      y += 5;
    });

    pdf.save("Urban_Ripple_Report.pdf");
  }

  return (
    <section className="module-page">
      <div className="module-heading">
        <h2>Reports & Export</h2>
        <p>Download reports from saved disruption records</p>
      </div>

      <div className="module-kpis">
        <article><span>Available records</span><strong>{events.length}</strong></article>
      </div>

      <div className="report-actions">
        <button className="secondary-button" onClick={exportPDF}>
          Download PDF
        </button>
        <button className="secondary-button" onClick={exportExcel}>
          Export Excel
        </button>
      </div>

      <p className="chart-disclaimer">
        Reports contain application records and user-entered information.
      </p>
    </section>
  );
}
