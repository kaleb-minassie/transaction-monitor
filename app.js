/* Money Guide assistant
   Leave this empty for the guided demo. After deploying the Worker below,
   paste its public URL here, without "/chat". Never put an API key here. */
const MONEY_GUIDE_API_URL = "";

(() => {
  const byId = id => document.getElementById(id);
  const panel = byId("guide-panel");
  const backdrop = byId("guide-backdrop");
  const launcher = byId("guide-open");
  const closeButton = byId("guide-close");
  const messages = byId("guide-messages");
  const input = byId("guide-input");
  const form = byId("guide-form");
  const sendButton = byId("guide-send");
  const mode = byId("guide-mode");

  const endpoint = MONEY_GUIDE_API_URL.replace(/\/+$/, "");
  const aiConnected = /^https:\/\/[^\s/]+/.test(endpoint);
  const history = []; // Conversation exists only in this browser tab.

  let waiting = false;
  let previousFocus = null;

  mode.textContent = aiConnected ? "AI connected" : "Demo guide";
  mode.classList.toggle("live", aiConnected);

  function addMessage(text, role = "assistant") {
    const row = document.createElement("div");
    row.className = `guide-row ${role}`;

    if (role === "assistant") {
      const avatar = document.createElement("span");
      avatar.className = "guide-avatar";
      avatar.textContent = "✦";
      avatar.setAttribute("aria-hidden", "true");
      row.appendChild(avatar);
    }

    const bubble = document.createElement("div");
    bubble.className = "guide-bubble";

    // textContent prevents a user or AI response from injecting HTML.
    bubble.textContent = text;

    row.appendChild(bubble);
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
    return row;
  }

  function openGuide() {
    previousFocus = document.activeElement;
    panel.hidden = false;
    backdrop.hidden = false;
    launcher.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    input.focus();
  }

  function closeGuide() {
    panel.hidden = true;
    backdrop.hidden = true;
    launcher.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    (previousFocus?.isConnected ? previousFocus : launcher).focus();
  }

  launcher.addEventListener("click", openGuide);
  closeButton.addEventListener("click", closeGuide);
  backdrop.addEventListener("click", closeGuide);

  document.addEventListener("keydown", event => {
    if (panel.hidden) return;

    if (event.key === "Escape") {
      closeGuide();
      return;
    }

    // Keep keyboard focus inside the open dialog.
    if (event.key === "Tab") {
      const controls = [...panel.querySelectorAll("button:not(:disabled), textarea")]
        .filter(element => element.offsetParent !== null);

      if (event.shiftKey && document.activeElement === controls[0]) {
        event.preventDefault();
        controls.at(-1).focus();
      } else if (!event.shiftKey && document.activeElement === controls.at(-1)) {
        event.preventDefault();
        controls[0].focus();
      }
    }
  });

  function guidedAnswer(question) {
    const q = question.toLowerCase();

    if (/flag|review|risk|decision|approved/.test(q)) {
      return "This demo recommends review when the amount exceeds your threshold, the country is outside the US, or an electronics purchase is $750 or more. These are sample rules, not a real fraud decision.";
    }

    if (/threshold|limit/.test(q)) {
      return "A threshold is the amount you enter in the form. The amount rule triggers only when the purchase is greater than that value. Other rules can still trigger a review.";
    }

    if (/work|demo|dashboard|start|navigate/.test(q)) {
      return "Go to the Transaction dashboard, enter a fictional purchase, and click Analyze transaction. You will see a decision, matching rules, updated counts, and recent activity.";
    }

    if (/rule|international|electronics/.test(q)) {
      return "The three sample rules check the amount threshold, purchases outside the US, and electronics purchases of at least $750. See the Risk rules section below the dashboard.";
    }

    if (/balance|my account|transfer|card/.test(q)) {
      return "This portfolio demo has no access to real accounts, balances, cards, or transfers. Use your bank’s official app or support channel for account-specific help.";
    }

    return "I can guide you through this demo and its rules. Broader AI answers become available after the separate AI service is connected.";
  }

  async function ask(question) {
    if (waiting) return;

    const message = question.trim().slice(0, 500);
    if (!message) return;

    input.value = "";
    addMessage(message, "user");

    if (!aiConnected) {
      addMessage(guidedAnswer(message));
      return;
    }

    waiting = true;
    sendButton.disabled = true;
    const loading = addMessage("Thinking…");

    try {
      // Only the typed chat is sent. Transaction form values stay local.
      const response = await fetch(`${endpoint}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
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
        { role: "user", content: message },
        { role: "assistant", content: data.answer }
      );

      addMessage(data.answer);
    } catch (error) {
      addMessage(
        `${error.message} Please try again shortly.`,
        "error"
      );
    } finally {
      loading.remove();
      waiting = false;
      sendButton.disabled = false;
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

  document.querySelector(".guide-prompts").addEventListener("click", event => {
    const button = event.target.closest("[data-guide-question]");
    if (button) ask(button.dataset.guideQuestion);
  });

  addMessage(
    aiConnected
      ? "Hi, I’m Money Guide. Ask about this demo or a general banking concept. I cannot view real accounts or give personal financial advice."
      : "Hi, I’m Money Guide. I can explain the transaction demo and help you navigate it. Live AI answers will be available when the AI service is connected."
  );
})();
