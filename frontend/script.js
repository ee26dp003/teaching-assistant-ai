// script.js
const API_BASE_URL = "";
const HISTORY_KEY = "teaching-assistant-history";
const MAX_HISTORY = 30;

const questionInput = document.getElementById("question-input");
const askButton = document.getElementById("ask-button");
const validationMessage = document.getElementById("validation-message");
const statusArea = document.getElementById("status-area");
const statusText = document.getElementById("status-text");
const answerBox = document.getElementById("answer-box");
const errorMessage = document.getElementById("error-message");
const themeToggle = document.getElementById("theme-toggle");
const themeToggleIcon = themeToggle.querySelector(".theme-toggle-icon");
const themeToggleLabel = themeToggle.querySelector(".theme-toggle-label");
const queryChips = document.querySelectorAll(".query-chip");

const tabSuggested = document.getElementById("tab-suggested");
const tabHistory = document.getElementById("tab-history");
const panelSuggested = document.getElementById("panel-suggested");
const panelHistory = document.getElementById("panel-history");
const historyList = document.getElementById("history-list");
const clearHistoryButton = document.getElementById("clear-history");

let chartInstances = [];

// --- Theme (dark = default, light = alt) ----------------------------------
function applyTheme(theme) {
  if (theme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
    themeToggleIcon.textContent = "●";
    themeToggleLabel.textContent = "Dark";
  } else {
    document.documentElement.removeAttribute("data-theme");
    themeToggleIcon.textContent = "☀";
    themeToggleLabel.textContent = "Light";
  }
}

function initTheme() {
  const saved = localStorage.getItem("teaching-assistant-theme");
  applyTheme(saved === "light" ? "light" : "dark");
}

themeToggle.addEventListener("click", () => {
  const isLight = document.documentElement.getAttribute("data-theme") === "light";
  const next = isLight ? "dark" : "light";
  applyTheme(next);
  localStorage.setItem("teaching-assistant-theme", next);
});

initTheme();

// --- Suggested queries ------------------------------------------------------
queryChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    questionInput.value = chip.textContent.trim();
    questionInput.focus();
  });
});

// --- Sidebar tabs ------------------------------------------------------------
function switchTab(tab) {
  const isHistory = tab === "history";
  tabHistory.classList.toggle("active", isHistory);
  tabSuggested.classList.toggle("active", !isHistory);
  panelHistory.classList.toggle("hidden", !isHistory);
  panelSuggested.classList.toggle("hidden", isHistory);
}

tabSuggested.addEventListener("click", () => switchTab("suggested"));
tabHistory.addEventListener("click", () => switchTab("history"));

// --- Question history (stored in this browser only) -------------------------
function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(history) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // If storage is full or unavailable, just skip saving silently —
    // history is a convenience feature, not core functionality.
  }
}

function addToHistory(question, answer) {
  const history = loadHistory();
  history.unshift({ question, answer, time: Date.now() });
  const trimmed = history.slice(0, MAX_HISTORY);
  saveHistory(trimmed);
  renderHistory();
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderHistory() {
  const history = loadHistory();

  if (history.length === 0) {
    historyList.innerHTML = '<p class="history-empty">Questions you ask will show up here.</p>';
    clearHistoryButton.classList.add("hidden");
    return;
  }

  clearHistoryButton.classList.remove("hidden");
  historyList.innerHTML = "";

  history.forEach((entry, index) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "history-item";
    item.innerHTML = `
      <div class="history-item-question"></div>
      <div class="history-item-time"></div>
    `;
    item.querySelector(".history-item-question").textContent = entry.question;
    item.querySelector(".history-item-time").textContent = formatTime(entry.time);

    item.addEventListener("click", () => {
      questionInput.value = entry.question;
      setAnswer(entry.answer);
      clearError();
      clearValidationError();
    });

    historyList.appendChild(item);
  });
}

clearHistoryButton.addEventListener("click", () => {
  saveHistory([]);
  renderHistory();
});

renderHistory();

// --- Question / answer flow ----------------------------------------------
function showValidationError(text) {
  validationMessage.textContent = text;
  validationMessage.classList.remove("hidden");
}

function clearValidationError() {
  validationMessage.textContent = "";
  validationMessage.classList.add("hidden");
}

function showError(text) {
  errorMessage.textContent = text;
  errorMessage.classList.remove("hidden");
}

function clearError() {
  errorMessage.textContent = "";
  errorMessage.classList.add("hidden");
}

function setLoading(isLoading) {
  askButton.disabled = isLoading;
  statusArea.classList.toggle("hidden", !isLoading);
  if (isLoading) {
    statusText.textContent = "Generating...";
  }
}

// --- Chart rendering (from ```chart fenced blocks) ---------------------------
function destroyExistingCharts() {
  chartInstances.forEach((chart) => chart.destroy());
  chartInstances = [];
}

function extractChartBlocks(text) {
  const charts = [];
  const withoutCharts = text.replace(/```chart\s*([\s\S]+?)```/g, (_, jsonText) => {
    const index = charts.length;
    let parsed = null;
    try {
      parsed = JSON.parse(jsonText.trim());
    } catch {
      parsed = null; // Malformed JSON from the model — we'll just drop this block.
    }
    if (!parsed) {
      return ""; // Skip silently rather than showing broken raw JSON to the student.
    }
    charts.push(parsed);
    return `@@CHART${index}@@`;
  });
  return { withoutCharts, charts };
}

function buildChartConfig(spec) {
  const type = ["line", "bar", "scatter"].includes(spec.type) ? spec.type : "line";
  const palette = ["#4fd8ea", "#b98eff", "#ffb86b", "#7ee787"];

  const datasets = (spec.series || []).map((s, i) => ({
    label: s.name || `Series ${i + 1}`,
    data: (s.points || []).map((p) => ({ x: p.x, y: p.y })),
    borderColor: palette[i % palette.length],
    backgroundColor: palette[i % palette.length],
    fill: false,
    tension: type === "line" ? 0.25 : 0,
    pointRadius: type === "scatter" ? 4 : 2,
  }));

  return {
    type: type === "scatter" ? "scatter" : type,
    data: { datasets },
    options: {
      responsive: true,
      plugins: {
        title: { display: !!spec.title, text: spec.title || "" },
        legend: { display: datasets.length > 1 },
      },
      scales: {
        x: {
          type: "linear",
          title: { display: !!spec.xLabel, text: spec.xLabel || "" },
        },
        y: {
          title: { display: !!spec.yLabel, text: spec.yLabel || "" },
        },
      },
    },
  };
}

function setAnswer(text) {
  if (!window.marked) {
    answerBox.textContent = text;
    return;
  }

  // 1. Pull out chart blocks first so Markdown/math processing never sees
  //    their raw JSON (which would otherwise get mangled by underscores,
  //    asterisks, etc. inside it).
  const { withoutCharts, charts } = extractChartBlocks(text);

  // 2. Protect math segments from Markdown mangling (same approach as before).
  const mathSegments = [];
  const protectedText = withoutCharts.replace(/\$\$[\s\S]+?\$\$|\$[^$\n]+?\$/g, (match) => {
    const index = mathSegments.push(match) - 1;
    return `@@MATH${index}@@`;
  });

  let html = window.marked.parse(protectedText);
  html = html.replace(/@@MATH(\d+)@@/g, (_, index) => mathSegments[Number(index)]);

  // 3. Turn each @@CHARTn@@ placeholder into a canvas container.
  charts.forEach((_, index) => {
    const canvasId = `chart-canvas-${index}`;
    const placeholder = `@@CHART${index}@@`;
    const chartHtml = `<div class="chart-container"><canvas id="${canvasId}"></canvas></div>`;
    html = html.split(placeholder).join(chartHtml);
  });

  answerBox.innerHTML = html;

  // 4. Render each chart into its canvas now that the elements exist in the DOM.
  destroyExistingCharts();
  if (window.Chart) {
    charts.forEach((spec, index) => {
      const canvas = document.getElementById(`chart-canvas-${index}`);
      if (!canvas) return;
      try {
        const chart = new window.Chart(canvas, buildChartConfig(spec));
        chartInstances.push(chart);
      } catch (err) {
        console.error("Chart rendering error:", err);
      }
    });
  }

  if (window.MathJax && window.MathJax.typesetPromise) {
    window.MathJax.typesetPromise([answerBox]).catch((err) => {
      console.error("MathJax rendering error:", err);
    });
  }
}

async function handleAskQuestion() {
  const question = questionInput.value.trim();

  clearValidationError();
  clearError();

  if (!question) {
    showValidationError("Please enter a question.");
    return;
  }

  setLoading(true);

  try {
    const response = await fetch(`${API_BASE_URL}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      let detail = "The AI service is currently unavailable. Please try again.";
      try {
        const errorBody = await response.json();
        if (errorBody && errorBody.detail) {
          detail = typeof errorBody.detail === "string" ? errorBody.detail : detail;
        }
      } catch {
        // Response body wasn't JSON — fall back to the default message.
      }
      throw new Error(detail);
    }

    const data = await response.json();
    setAnswer(data.answer);
    addToHistory(question, data.answer);
  } catch (err) {
    showError(err.message || "Something went wrong. Please try again.");
  } finally {
    setLoading(false);
  }
}

askButton.addEventListener("click", handleAskQuestion);

questionInput.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    handleAskQuestion();
  }
});
