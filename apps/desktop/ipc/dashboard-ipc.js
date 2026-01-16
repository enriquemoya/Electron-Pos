function localDayRange(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  const start = new Date(year, month - 1, day, 0, 0, 0, 0);
  const end = new Date(year, month - 1, day, 23, 59, 59, 999);
  return { from: start.toISOString(), to: end.toISOString() };
}

function registerDashboardIpc(ipcMain, { saleRepo, shiftRepo, dashboardRepo }) {
  ipcMain.handle("dashboard:summary", (_event, date) => {
    const range = localDayRange(date);
    const salesSummary = saleRepo.getSummaryByDate(range.from, range.to);
    const activeShift = shiftRepo.getActive();

    const dailyStatus = {
      date,
      shiftStatus: activeShift ? "OPEN" : "CLOSED",
      openedAt: activeShift?.openedAt ?? null,
      salesTotal: salesSummary.totalAmount,
      salesCount: salesSummary.salesCount
    };

    const salesSummaryPayload = {
      total: salesSummary.totalAmount,
      byMethod: salesSummary.byMethod,
      averageTicket:
        salesSummary.salesCount > 0
          ? Math.floor(salesSummary.totalAmount / salesSummary.salesCount)
          : 0
    };

    const alerts = {
      outOfStock: dashboardRepo.getStockAlerts("OUT_OF_STOCK", 5),
      lowStock: dashboardRepo.getStockAlerts("LOW_STOCK", 5),
      pendingProofs: dashboardRepo.getPendingProofSales(5),
      tournamentsWithoutWinners: dashboardRepo.getTournamentsWithoutWinners(5)
    };

    const recentSales = dashboardRepo.getRecentSales(5).map((sale) => ({
      type: "SALE",
      id: sale.id,
      label: sale.id,
      amount: sale.totalAmount,
      createdAt: sale.createdAt
    }));

    const recentCustomers = dashboardRepo.getRecentCustomers(5).map((customer) => ({
      type: "CUSTOMER",
      id: customer.id,
      label: `${customer.firstNames} ${customer.lastNamePaternal} ${customer.lastNameMaternal}`.trim(),
      createdAt: customer.createdAt
    }));

    const recentTournaments = dashboardRepo.getRecentTournaments(5).map((tournament) => ({
      type: "TOURNAMENT",
      id: tournament.id,
      label: tournament.name,
      createdAt: tournament.updatedAt || tournament.createdAt
    }));

    const recentActivity = [...recentSales, ...recentCustomers, ...recentTournaments]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return {
      dailyStatus,
      salesSummary: salesSummaryPayload,
      alerts,
      recentActivity
    };
  });
}

module.exports = { registerDashboardIpc };
