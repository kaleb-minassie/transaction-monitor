// Browser interface for the compiled C++ risk engine.
(async function () {
  "use strict";

  if (document.getElementById("cpp-risk-lab")) return;

  const section = document.createElement("section");
  section.id = "cpp-risk-lab";
  section.className = "risk-lab";
  section.setAttribute("aria-labelledby", "lab-title");

  section.innerHTML = `
    <div class="lab-top">
      <div>
        <span class="lab-kicker">TRANSACTION INTELLIGENCE / C++</span>
        <h2 id="lab-title">Batch Risk Lab.</h2>
        <p>
          Explore simulated purchases. Adjust your threshold
          and see which transactions need a closer look.
        </p>
      </div>
      <span id="lab-status" class="lab-status" role="status">
        Loading analyzer…
      </span>
    </div>

    <div class="lab-controls">
      <label>
        SIMULATED PURCHASES
        <select id="lab-size">
          <option value="100">100 transactions</option>
          <option value="1000" selected>1,000 transactions</option>
          <option value="10000">10,000 transactions</option>
        </select>
      </label>

      <label for="lab-threshold">
        REVIEW THRESHOLD
        <span id="lab-threshold-value">$1,000</span>
        <input
          id="lab-threshold"
          type="range"
          min="250"
          max="2000"
          step="50"
          value="1000"
        >
      </label>

      <button id="lab-run" type="button" disabled>
        Analyze batch ↗
      </button>
    </div>

    <div class="lab-stats" aria-live="polite" aria-atomic="true">
      <div class="lab-stat">
        <span>ANALYZED</span>
        <strong id="lab-total">—</strong>
      </div>
      <div class="lab-stat">
        <span>NEEDS REVIEW</span>
        <strong id="lab-flagged">—</strong>
      </div>
      <div class="lab-stat">
        <span>APPROVED</span>
        <strong id="lab-approved">—</strong>
      </div>
      <div class="lab-stat">
        <span>MEAN RULE SCORE / 100</span>
        <strong id="lab-score">—</strong>
      </div>
    </div>

    <div class="lab-spectrum" aria-hidden="true">
      <div id="lab-clear" class="lab-clear"></div>
      <div id="lab-review" class="lab-review"></div>
    </div>

    <div class="lab-legend">
      <span id="lab-clear-label">Approved: —</span>
      <span id="lab-review-label">Review: —</span>
      <span id="lab-time"></span>
    </div>

    <div class="lab-table-wrap">
      <table>
        <caption>First six simulated purchases</caption>
        <thead>
          <tr>
            <th scope="col">MERCHANT</th>
            <th scope="col">AMOUNT</th>
            <th scope="col">RULE SCORE</th>
            <th scope="col">DECISION / REASONS</th>
          </tr>
        </thead>
        <tbody id="lab-rows"></tbody>
      </table>
    </div>

    <p class="lab-note">
      Simulated purchases only. Scores represent weighted rule
      matches, not fraud probabilities. Amount: 40 points ·
      International: 35 · Electronics ≥ $750: 25.
    </p>
  `;

  const anchor = document.getElementById("rules");

  if (anchor) {
    anchor.before(section);
  } else {
    (document.querySelector("main") || document.body)
      .appendChild(section);
  }

  const byId = id => section.querySelector("#" + id);

  let engine;
  let batch = [];
  let seed = 42;

  // Repeatable sample generation.
  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  function generate(count) {
    const merchants = [
      "Corner Market",
      "Northline Electronics",
      "Global Travel",
      "Neighborhood Cafe"
    ];

    return Array.from({ length: count }, () => {
      const merchant = Math.floor(random() * merchants.length);

      return {
        merchant: merchants[merchant],
        cents: Math.floor(random() * 239901) + 100,
        international: random() < 0.14 ? 1 : 0,
        electronics: merchant === 1 ? 1 : 0
      };
    });
  }

  function reasons(flags) {
    return [
      flags & 1 ? "Over threshold" : "",
      flags & 2 ? "International" : "",
      flags & 4 ? "Electronics ≥ $750" : ""
    ].filter(Boolean).join(" · ") || "No rules matched";
  }

  function analyze() {
    if (!engine) return;

    const threshold = Number(byId("lab-threshold").value) * 100;

    let flagged = 0;
    let totalScore = 0;

    const start = performance.now();

    const results = batch.map(item => {
      // These functions execute the compiled C++ code.
      const flags = engine.risk_flags(
        item.cents,
        threshold,
        item.international,
        item.electronics
      );

      const score = engine.risk_score(
        item.cents,
        threshold,
        item.international,
        item.electronics
      );

      if (flags < 0 || score < 0) {
        throw new Error("Invalid analyzer input");
      }

      if (flags) flagged++;
      totalScore += score;

      return { item, flags, score };
    });

    const elapsed = performance.now() - start;
    const approved = batch.length - flagged;
    const clearPercent = approved / batch.length * 100;

    byId("lab-total").textContent = batch.length.toLocaleString();
    byId("lab-flagged").textContent = flagged.toLocaleString();
    byId("lab-approved").textContent = approved.toLocaleString();

    byId("lab-score").textContent =
      (totalScore / batch.length).toFixed(1);

    byId("lab-clear").style.width = clearPercent + "%";
    byId("lab-review").style.width = (100 - clearPercent) + "%";

    byId("lab-clear-label").textContent =
      "Approved: " + clearPercent.toFixed(1) + "%";

    byId("lab-review-label").textContent =
      "Review: " + (100 - clearPercent).toFixed(1) + "%";

    byId("lab-time").textContent =
      "Analysis loop: " + elapsed.toFixed(2) + " ms";

    byId("lab-rows").innerHTML = results.slice(0, 6).map(
      ({ item, flags, score }) => `
        <tr>
          <td>${item.merchant}</td>
          <td>$${(item.cents / 100).toFixed(2)}</td>
          <td>${score} / 100</td>
          <td>
            <span class="lab-pill ${flags ? "review" : ""}">
              ${flags ? "REVIEW" : "APPROVED"}
            </span>
            <div class="lab-reasons">${reasons(flags)}</div>
          </td>
        </tr>
      `
    ).join("");
  }

  function newBatch() {
    batch = generate(Number(byId("lab-size").value));
    analyze();
  }

  byId("lab-run").addEventListener("click", newBatch);
  byId("lab-size").addEventListener("change", newBatch);

  byId("lab-threshold").addEventListener("input", () => {
    byId("lab-threshold-value").textContent =
      "$" + Number(byId("lab-threshold").value).toLocaleString();

    analyze();
  });

  try {
    // Compiled C++ WebAssembly module. Keep this string intact.
    const wasmBase64 = "AGFzbQEAAAABCQFgBH9/f38BfwMDAgAABQMBAAIGCAF/AUGAiAQLByQDBm1lbW9yeQIACnJpc2tfZmxhZ3MAAApyaXNrX3Njb3JlAAEKvAECSgEBf0F/IQQCQCAAQQFIDQAgAUEBSA0AIAIgA3JBAUsNACAAIAFLIgRBAnIgBCACGyIEQQRyIAQgAxsgBCAAQffJBEsbIQQLIAQLbwEBf0F/IQQCQCAAQQFIDQAgAUEBSA0AIAMgAnJBAUsNAEEAIAAgAUsiBEECciAEIAIbIgRBBHIgBCADGyAEIABB98kESxsiAEEBcWtBKHEiBEEjaiAEIABBAnEbIgQgBEEZaiAAQQRJGyEECyAECwBHBG5hbWUAERByaXNrX2VuZ2luZS53YXNtARkCAApyaXNrX2ZsYWdzAQpyaXNrX3Njb3JlBxIBAA9fX3N0YWNrX3BvaW50ZXIAOAlwcm9kdWNlcnMBDHByb2Nlc3NlZC1ieQEMVWJ1bnR1IGNsYW5nETE4LjEuMyAoMXVidW50dTEpACwPdGFyZ2V0X2ZlYXR1cmVzAisPbXV0YWJsZS1nbG9iYWxzKwhzaWduLWV4dA==";

    const bytes = Uint8Array.from(
      atob(wasmBase64),
      character => character.charCodeAt(0)
    );

    const result = await WebAssembly.instantiate(bytes, {});
    engine = result.instance.exports;

    byId("lab-status").textContent = "● C++ engine ready";
    byId("lab-run").disabled = false;

    newBatch();
  } catch (error) {
    byId("lab-status").textContent = "Analyzer unavailable";
    byId("lab-size").disabled = true;
    byId("lab-threshold").disabled = true;

    byId("lab-time").textContent =
      "This browser could not load WebAssembly. Try a current browser.";

    console.error("C++ Risk Lab failed to load:", error);
  }
})();
