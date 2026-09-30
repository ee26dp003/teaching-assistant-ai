// script.js
const API_BASE_URL = "";

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

// --- Theme (notebook / chalkboard) ---------------------------------------
function applyTheme(theme) {
  if (theme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    themeToggleIcon.textContent = "🖍️";
    themeToggleLabel.textContent = "Notebook";
  } else {
    document.documentElement.removeAttribute("data-theme");
    themeToggleIcon.textContent = "✏️";
    themeToggleLabel.textContent = "Chalkboard";
  }
}

function initTheme() {
  const saved = localStorage.getItem("teaching-assistant-theme");
  if (saved) {
    applyTheme(saved);
    return;
  }
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(prefersDark ? "dark" : "light");
}

themeToggle.addEventListener("click", () => {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const next = isDark ? "light" : "dark";
  applyTheme(next);
  localStorage.setItem("teaching-assistant-theme", next);
});

initTheme();

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
    statusText.textContent = "Thinking...";
  }
}

function setAnswer(text) {
  if (!window.marked) {
    answerBox.textContent = text;
    return;
  }

  const mathSegments = [];
  const protectedText = text.replace(/\$\$[\s\S]+?\$\$|\$[^$\n]+?\$/g, (match) => {
    const index = mathSegments.push(match) - 1;
    return `@@MATH${index}@@`;
  });

  let html = window.marked.parse(protectedText);
  html = html.replace(/@@MATH(\d+)@@/g, (_, index) => mathSegments[Number(index)]);

  answerBox.innerHTML = html;

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
