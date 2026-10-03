// The public demo uses fictional values and keeps its activity in memory.
const $ = id => document.getElementById(id);

const escapeHtml = value => String(value).replace(
  /[&<>"']/g,
  char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char])
);

const transactions = [];

function updateDashboard() {
  const flagged = transactions.filter(item => item.flagged).length;

  $("txn-count").textContent = transactions.length;
  $("flag-count").textContent = flagged;
  $("approved-count").textContent = transactions.length - flagged;
  $("clear-activity").disabled = transactions.length === 0;

  if (!transactions.length) {
    $("transaction-log").innerHTML =
      '<p class="activity-empty">No transactions yet. Analyze a purchase to begin.</p>';
    return;
  }

  // Show only the five most recent transactions.
  $("transaction-log").innerHTML = transactions.slice(0, 5).map(item => `
    <div class="activity-row">
      <span>
        <strong>${escapeHtml(item.merchant)}</strong>
        <small>${escapeHtml(item.account)} · ${escapeHtml(item.country)}</small>
      </span>
      <span>$${item.amount.toFixed(2)}</span>
      <span class="status-text ${item.flagged ? "review" : "approved"}">
        ${item.flagged ? "Review" : "Approved"}
      </span>
    </div>
  `).join("");
}

$("transaction-form").addEventListener("submit", event => {
  event.preventDefault();

  const amount = Number($("amount").value);
  const threshold = Number($("threshold").value);
  const merchant = $("merchant").value.trim();
  const account = $("account").value.trim();
  const country = $("country").value.trim().toUpperCase();
  const category = $("category").value;

  if (
    !merchant || !account || !/^[A-Z]{2}$/.test(country) ||
    !Number.isFinite(amount) || amount <= 0 ||
    !Number.isFinite(threshold) || threshold <= 0
  ) {
    return;
  }

  // These illustrative rules match the separate Java project's sample rules.
  const reasons = [];

  if (amount > threshold) {
    reasons.push(`Amount exceeds the $${threshold.toFixed(2)} threshold`);
  }
  if (country !== "US") {
    reasons.push(`International transaction (${country})`);
  }
  if (category === "Electronics" && amount >= 750) {
    reasons.push("Electronics purchase is $750 or more");
  }

  const item = {
    account,
    merchant,
    country,
    category,
    amount,
    flagged: reasons.length > 0,
    time: new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    })
  };

  transactions.unshift(item);

  $("transaction-result").className = "result-card";
  $("transaction-result").innerHTML = `
    <div class="result-head">
      <span class="badge ${item.flagged ? "warn" : "ok"}">
        ${item.flagged ? "REVIEW" : "APPROVED"}
      </span>
      <span class="result-time">${escapeHtml(item.time)}</span>
    </div>
    <div class="result-amount">$${amount.toFixed(2)}</div>
    <p class="result-merchant">${escapeHtml(merchant)}</p>
    <p class="result-meta">
      ${escapeHtml(account)} · ${escapeHtml(category)} · ${escapeHtml(country)}
    </p>
    <div class="result-rule-title">
      ${reasons.length ? "RULES THAT MATCHED" : "RULE CHECK"}
    </div>
    ${reasons.length
      ? `<ul class="reasons">${reasons.map(reason =>
          `<li>${escapeHtml(reason)}</li>`
        ).join("")}</ul>`
      : '<p class="no-reasons">No risk rules matched this transaction.</p>'}
  `;

  updateDashboard();
});

// Quick-fill buttons demonstrate different decisions.
const samples = {
  approved: {
    account: "acct-2201",
    merchant: "Corner Market",
    amount: "42.50",
    category: "Groceries",
    country: "US",
    threshold: "1000"
  },
  international: {
    account: "acct-3308",
    merchant: "Global Travel Co.",
    amount: "420.00",
    category: "Travel",
    country: "GB",
    threshold: "1000"
  }
};

document.querySelectorAll("[data-sample]").forEach(button => {
  button.addEventListener("click", () => {
    const sample = samples[button.dataset.sample];

    for (const [key, value] of Object.entries(sample)) {
      $(key).value = value;
    }

    $("amount").focus();
  });
});

$("clear-activity").addEventListener("click", () => {
  transactions.length = 0;

  $("transaction-result").className = "result-empty";
  $("transaction-result").innerHTML =
    '<span class="empty-icon" aria-hidden="true">◈</span>' +
    "<strong>Ready to analyze</strong>" +
    "<p>Submit a transaction to see its decision and the rules behind it.</p>";

  updateDashboard();
});


/* Money Guide assistant
   Leave this URL empty for the guided demo.
   When you deploy the separate AI Worker, paste its URL here.
   Never paste an API key into this public file. */
window.MONEY_GUIDE_API_URL = "";

(() => {
  const byId = id => document.getElementById(id);
  const panel = byId("assistant-panel");
  const backdrop = byId("assistant-backdrop");
  const launcher = byId("assistant-launcher");
  const input = byId("assistant-input");
  const messages = byId("assistant-messages");
  const form = byId("assistant-form");
  const send = byId("assistant-send");

  const endpoint = String(window.MONEY_GUIDE_API_URL || "").replace(/\/+$/, "");
  const live = /^https:\/\/[^\s/]+(?:\/[^\s]*)?$/.test(endpoint);
  const history = [];

  let busy = false;
  let previousFocus = null;

  byId("assistant-mode").textContent = live ? "AI connected" : "Demo guide";
  byId("assistant-mode").classList.toggle("live", live);

  function addMessage(text, role = "assistant", href = "") {
    const row = document.createElement("div");
    row.className = `assistant-message ${role}`;

    if (role === "assistant") {
      const avatar = document.createElement("span");
      avatar.className = "assistant-avatar";
      avatar.setAttribute("aria-hidden", "true");
      avatar.textContent = "✦";
      row.appendChild(avatar);
    }

    const bubble = document.createElement("div");
    bubble.className = "assistant-bubble";

    // Display text safely instead of interpreting it as HTML.
    bubble.textContent = text;

    if (["#dashboard", "#rules", "#about"].includes(href)) {
      const link = document.createElement("a");
      link.href = href;
      link.textContent = "Go to section ↗";
      link.addEventListener("click", close);
      bubble.append(document.createElement("br"), link);
    }

    row.appendChild(bubble);
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
    return row;
  }

  function guidedAnswer(question) {
    const q = question.toLowerCase();

    if (/flag|review|assess|decision|approve|risk/.test(q)) {
      return {
        text: "The demo sends a purchase for review if its amount is above your threshold, its country is outside the US, or an electronics purchase is $750 or more. An approved result means none of those sample rules matched. This is not a real fraud decision.",
        href: "#dashboard"
      };
    }

    if (/threshold|limit/.test(q)) {
      return {
        text: "The threshold is the amount you set in the form. That rule triggers only when the purchase is greater than the threshold. Other rules can still trigger a review.",
        href: "#dashboard"
      };
    }

    if (/work|navigate|where|dashboard|demo|start/.test(q)) {
      return {
        text: "Open the dashboard, enter a fictional transaction, then select Analyze transaction. The decision, matched rules, counts, and recent activity update in this browser session. You can also try the sample buttons.",
        href: "#dashboard"
      };
    }

    if (/rule|international|electronic/.test(q)) {
      return {
        text: "The three sample rules are amount above your threshold, a country other than US, and electronics spending of $750 or more.",
        href: "#rules"
      };
    }

    if (/account|balance|transfer|payment status|my bank/.test(q)) {
      return {
        text: "This portfolio demo cannot access bank accounts, balances, transfers, or real transactions. Use your bank’s official app or support channel for account-specific questions."
      };
    }

    return {
      text: "This guided demo can explain the transaction rules and help you navigate the page. Broader AI answers become available after the separate AI service is deployed."
    };
  }

  function open() {
    previousFocus = document.activeElement;
    panel.hidden = false;
    backdrop.hidden = false;
    launcher.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    input.focus();
  }

  function close() {
    panel.hidden = true;
    backdrop.hidden = true;
    launcher.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    (previousFocus?.isConnected ? previousFocus : launcher).focus();
  }

  document.querySelectorAll("[data-open-assistant]").forEach(button => {
    button.addEventListener("click", open);
  });

  byId("assistant-close").addEventListener("click", close);
  backdrop.addEventListener("click", close);

  document.addEventListener("keydown", event => {
    if (panel.hidden) return;

    if (event.key === "Escape") {
      close();
      return;
    }

    if (event.key === "Tab") {
      const focusables = [
        ...panel.querySelectorAll("a[href], button:not(:disabled), textarea")
      ].filter(element => element.offsetParent !== null);

      const first = focusables[0];
      const last = focusables.at(-1);

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  async function ask(question) {
    if (busy) return;

    const text = question.trim().slice(0, 500);
    if (!text) return;

    input.value = "";
    addMessage(text, "user");

    if (!live) {
      const answer = guidedAnswer(text);
      addMessage(answer.text, "assistant", answer.href);
      return;
    }

    busy = true;
    send.disabled = true;

    const typing = document.createElement("div");
    typing.className = "assistant-message";
    typing.setAttribute("aria-label", "Assistant is typing");
    typing.innerHTML =
      '<span class="assistant-avatar" aria-hidden="true">✦</span>' +
      '<div class="assistant-bubble"><span class="assistant-typing" aria-hidden="true"><i></i><i></i><i></i></span></div>';

    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;

    try {
      // Only chat text is sent. Transaction form fields stay in the browser.
      const response = await fetch(`${endpoint}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: history.slice(-6)
        }),
        signal: AbortSignal.timeout(25000)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "The assistant is unavailable.");
      }

      if (typeof data.answer !== "string" || !data.answer.trim()) {
        throw new Error("The assistant returned an empty answer.");
      }

      history.push(
        { role: "user", content: text },
        { role: "assistant", content: data.answer }
      );

      addMessage(data.answer);
    } catch (error) {
      addMessage(`${error.message} Please try again shortly.`, "system");
    } finally {
      typing.remove();
      busy = false;
      send.disabled = false;
      input.focus();
    }
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    ask(input.value);
  });

  input.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  byId("assistant-suggestions").addEventListener("click", event => {
    const button = event.target.closest("[data-question]");
    if (button) ask(button.dataset.question);
  });

  addMessage(
    live
      ? "Hi, I’m Money Guide. Ask about this demo or general banking concepts. I cannot view real accounts or provide personal financial advice."
      : "Hi, I’m Money Guide. I can walk you through the transaction demo and explain its rules. Broader AI answers will be available when the AI service is connected."
  );
})();
