const { BrowserWindow, shell, app } = require("electron");
const fs = require("fs");
const path = require("path");

function localDayRange(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  const start = new Date(year, month - 1, day, 0, 0, 0, 0);
  const end = new Date(year, month - 1, day, 23, 59, 59, 999);
  return { from: start.toISOString(), to: end.toISOString() };
}

function formatMoney(amount) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
    amount / 100
  );
}

function methodLabel(method) {
  switch (method) {
    case "EFECTIVO":
      return "Efectivo";
    case "TRANSFERENCIA":
      return "Transferencia";
    case "TARJETA":
      return "Tarjeta";
    case "CREDITO_TIENDA":
      return "Crédito de tienda";
    default:
      return method;
  }
}

function formatLocalDateTime(value) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function buildReportHtml(date, summary, shifts) {
  const methodRows = Object.entries(summary.byMethod)
    .map(
      ([method, total]) =>
        `<tr><td>${methodLabel(method)}</td><td>${formatMoney(total)}</td></tr>`
    )
    .join("");
  const shiftRows = shifts
    .map(
      (shift) => `
        <tr>
          <td>${shift.id}</td>
          <td>${formatLocalDateTime(shift.openedAt)}</td>
          <td>${shift.closedAt ? formatLocalDateTime(shift.closedAt) : "-"}</td>
          <td>${formatMoney(shift.openingAmount.amount)}</td>
          <td>${formatMoney(shift.expectedAmount.amount)}</td>
          <td>${shift.realAmount ? formatMoney(shift.realAmount.amount) : "-"}</td>
          <td>${shift.difference ? formatMoney(shift.difference.amount) : "-"}</td>
        </tr>
      `
    )
    .join("");

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Reporte diario</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; color: #111; }
          h1, h2 { margin: 0 0 12px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
          th, td { border: 1px solid #ccc; padding: 6px 8px; font-size: 12px; }
          th { background: #f2f2f2; text-align: left; }
          .summary { margin-bottom: 16px; }
        </style>
      </head>
      <body>
        <h1>Reporte diario</h1>
        <div class="summary">
          <p>Fecha: ${date}</p>
          <p>Total de ventas: ${formatMoney(summary.totalAmount)}</p>
          <p>Numero de ventas: ${summary.salesCount}</p>
          <p>Comprobantes pendientes: ${summary.pendingProofs}</p>
          <p>Credito otorgado: ${formatMoney(summary.credit.granted)}</p>
          <p>Credito usado: ${formatMoney(summary.credit.used)}</p>
        </div>

        <h2>Totales por metodo de pago</h2>
        <table>
          <thead><tr><th>Metodo</th><th>Total</th></tr></thead>
          <tbody>${methodRows}</tbody>
        </table>

        <h2>Turnos del dia</h2>
        <table>
          <thead>
            <tr>
              <th>Turno</th>
              <th>Apertura</th>
              <th>Cierre</th>
              <th>Inicial</th>
              <th>Esperado</th>
              <th>Real</th>
              <th>Diferencia</th>
            </tr>
          </thead>
          <tbody>${shiftRows || "<tr><td colspan=\"7\">Sin turnos</td></tr>"}</tbody>
        </table>
      </body>
    </html>
  `;
}

async function renderPdf(html, filepath) {
  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      sandbox: true,
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  const data = await win.webContents.printToPDF({});
  fs.mkdirSync(path.dirname(filepath), { recursive: true });
  fs.writeFileSync(filepath, data);
  win.close();
}

function registerDailyReportsIpc(ipcMain, saleRepo, shiftRepo, storeCreditRepo, options = {}) {
  const authorize = typeof options.authorize === "function" ? options.authorize : null;
  ipcMain.handle("daily-reports:summary", (_event, date) => {
    authorize?.("reports:view");
    const range = localDayRange(date);
    const salesSummary = saleRepo.getSummaryByDate(range.from, range.to);
    const creditSummary = storeCreditRepo.getSummaryByDate(range.from, range.to);
    return {
      date,
      totalAmount: salesSummary.totalAmount,
      salesCount: salesSummary.salesCount,
      byMethod: salesSummary.byMethod,
      pendingProofs: salesSummary.pendingProofs,
      credit: creditSummary
    };
  });

  ipcMain.handle("daily-reports:sales", (_event, date) => {
    authorize?.("reports:view");
    const range = localDayRange(date);
    return saleRepo.listFiltered({ from: range.from, to: range.to });
  });

  ipcMain.handle("daily-reports:shifts", (_event, date) => {
    authorize?.("reports:view");
    const range = localDayRange(date);
    return shiftRepo.listByDate(range.from, range.to);
  });

  ipcMain.handle("daily-reports:generatePdf", async (_event, date) => {
    authorize?.("reports:view");
    const range = localDayRange(date);
    const salesSummary = saleRepo.getSummaryByDate(range.from, range.to);
    const creditSummary = storeCreditRepo.getSummaryByDate(range.from, range.to);
    const shifts = shiftRepo.listByDate(range.from, range.to);
    const summary = {
      date,
      totalAmount: salesSummary.totalAmount,
      salesCount: salesSummary.salesCount,
      byMethod: salesSummary.byMethod,
      pendingProofs: salesSummary.pendingProofs,
      credit: creditSummary
    };
    const html = buildReportHtml(date, summary, shifts);
    const reportDir = path.join(app.getPath("userData"), "reports");
    const filename = `${date}-reporte-diario.pdf`;
    const filepath = path.join(reportDir, filename);
    await renderPdf(html, filepath);
    return filepath;
  });

  ipcMain.handle("daily-reports:openPdf", async (_event, filepath) => {
    return shell.openPath(filepath);
  });
}

module.exports = { registerDailyReportsIpc };
