import { state } from "./dashboard-state.js";
import { dom } from "./dashboard-dom.js";
import { updateWithTransition } from "./dashboard-utils.js";

export function renderStats(totals, daily) {
  if (dom.statTotalRequests) {
    updateWithTransition(dom.statTotalRequests, totals.totalRequests || 0);
  }
  if (dom.statTotalTokens) {
    updateWithTransition(dom.statTotalTokens, (totals.totalTokens || 0).toLocaleString());
  }

  if (daily && daily.length > 0) {
    const last = daily[daily.length - 1];
    const prev = daily.length > 1 ? daily[daily.length - 2] : { requests: 0, tokens: 0 };
    const reqDiff = last.requests - prev.requests;
    const tokDiff = last.tokens - prev.tokens;

    if (dom.statRequestsTrend) {
      if (reqDiff > 0) {
        dom.statRequestsTrend.className = "text-xs font-semibold text-emerald-400 transition-opacity duration-300 mt-1";
        updateWithTransition(dom.statRequestsTrend, `↑ +${reqDiff}`);
      } else {
        dom.statRequestsTrend.className = "text-xs font-semibold text-zinc-500 transition-opacity duration-300 mt-1";
        updateWithTransition(dom.statRequestsTrend, "—");
      }
    }

    if (dom.statTokensTrend) {
      if (tokDiff > 0) {
        dom.statTokensTrend.className = "text-xs font-semibold text-emerald-400 transition-opacity duration-300 mt-1";
        updateWithTransition(dom.statTokensTrend, `↑ +${tokDiff}`);
      } else {
        dom.statTokensTrend.className = "text-xs font-semibold text-zinc-500 transition-opacity duration-300 mt-1";
        updateWithTransition(dom.statTokensTrend, "—");
      }
    }
  } else {
    if (dom.statRequestsTrend) {
      dom.statRequestsTrend.className = "text-xs font-semibold text-zinc-500 transition-opacity duration-300 mt-1";
      updateWithTransition(dom.statRequestsTrend, "—");
    }
    if (dom.statTokensTrend) {
      dom.statTokensTrend.className = "text-xs font-semibold text-zinc-500 transition-opacity duration-300 mt-1";
      updateWithTransition(dom.statTokensTrend, "—");
    }
  }

  if (dom.statAvgResponse) {
    updateWithTransition(dom.statAvgResponse, "—");
  }
  if (dom.statSuccessRate) {
    updateWithTransition(dom.statSuccessRate, "—");
  }
}

export function renderCharts(daily) {
  const labels = daily.map((d) => {
    const date = new Date(d.date);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });
  const requestData = daily.map((d) => d.requests);
  const tokenData = daily.map((d) => d.tokens);

  const ctx1 = dom.requestChartCanvas?.getContext("2d");
  const ctx2 = dom.tokenChartCanvas?.getContext("2d");

  if (state.requestChart) {
    state.requestChart.destroy();
    state.requestChart = null;
  }
  if (state.tokenChart) {
    state.tokenChart.destroy();
    state.tokenChart = null;
  }

  if (ctx1) {
    state.requestChart = new Chart(ctx1, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Requests",
            data: requestData,
            backgroundColor: "rgba(168, 85, 247, 0.4)",
            borderColor: "#a855f7",
            borderWidth: 1.5,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: "rgba(255,255,255,0.04)" },
            ticks: { color: "#71717a" },
          },
          x: {
            grid: { display: false },
            ticks: { color: "#71717a", maxRotation: 45 },
          },
        },
      },
    });
  }

  if (ctx2) {
    state.tokenChart = new Chart(ctx2, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Tokens",
            data: tokenData,
            borderColor: "#fbbf24",
            backgroundColor: "rgba(251, 191, 36, 0.1)",
            fill: true,
            tension: 0.3,
            pointBackgroundColor: "#fbbf24",
            pointRadius: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: "rgba(255,255,255,0.04)" },
            ticks: { color: "#71717a" },
          },
          x: {
            grid: { display: false },
            ticks: { color: "#71717a", maxRotation: 45 },
          },
        },
      },
    });
  }
}

export function renderBreakdowns(models, domains, hours) {
  const ctx3 = dom.modelChartCanvas?.getContext("2d");
  if (state.modelChart) {
    state.modelChart.destroy();
    state.modelChart = null;
  }

  if (ctx3 && models && models.length > 0) {
    const colors = ["#a855f7", "#34d399", "#fbbf24", "#60a5fa", "#f472b6"];
    state.modelChart = new Chart(ctx3, {
      type: "doughnut",
      data: {
        labels: models.map((m) => m.name),
        datasets: [
          {
            data: models.map((m) => m.count),
            backgroundColor: colors.slice(0, models.length),
            borderWidth: 1,
            borderColor: "rgba(0,0,0,0.2)",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "#a1a1aa",
              font: { size: 9 },
              boxWidth: 10,
              padding: 6,
            },
          },
        },
        cutout: "60%",
      },
    });
  } else if (ctx3) {
    state.modelChart = new Chart(ctx3, {
      type: "doughnut",
      data: {
        labels: ["No Data"],
        datasets: [{ data: [1], backgroundColor: ["#2a2a2e"], borderWidth: 0 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
      },
    });
  }

  if (dom.topDomainsContainer) {
    dom.topDomainsContainer.innerHTML = "";
    if (domains && domains.length > 0) {
      const sorted = domains.sort((a, b) => b.count - a.count).slice(0, 5);
      sorted.forEach((d) => {
        const div = document.createElement("div");
        div.className = "flex justify-between py-2 border-b border-white/5 text-sm";
        div.innerHTML = `<span class="text-zinc-300 font-medium">${d.name}</span><span class="text-zinc-500 font-bold">${d.count}</span>`;
        dom.topDomainsContainer.appendChild(div);
      });
    } else {
      dom.topDomainsContainer.innerHTML = '<div class="text-sm text-zinc-500 text-center py-4">No domains</div>';
    }
  }

  if (dom.busiestHoursContainer) {
    dom.busiestHoursContainer.innerHTML = "";
    if (hours && hours.length > 0) {
      const sorted = hours.sort((a, b) => b.count - a.count).slice(0, 5);
      sorted.forEach((h) => {
        const div = document.createElement("div");
        div.className = "flex justify-between py-2 border-b border-white/5 text-sm";
        const hourLabel = `${String(h.hour).padStart(2, "0")}:00`;
        div.innerHTML = `<span class="text-zinc-300 font-medium">${hourLabel}</span><span class="text-zinc-500 font-bold">${h.count}</span>`;
        dom.busiestHoursContainer.appendChild(div);
      });
    } else {
      dom.busiestHoursContainer.innerHTML = '<div class="text-sm text-zinc-500 text-center py-4">No data</div>';
    }
  }
}