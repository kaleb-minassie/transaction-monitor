// This public demo uses fictional values and keeps its activity in memory.
const $ = id => document.getElementById(id);

const escapeHtml = value => String(value).replace(
  /[&<>"']/g,
  char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])
);

const transactions = [];

function updateDashboard() {
  const flagged = transactions.filter(item => item.flagged).length;

  $('txn-count').textContent = transactions.length;
  $('flag-count').textContent = flagged;
  $('approved-count').textContent = transactions.length - flagged;
  $('clear-activity').disabled = transactions.length === 0;

  if (!transactions.length) {
    $('transaction-log').innerHTML =
      '<p class="activity-empty">No transactions yet. Analyze a purchase to begin.</p>';
    return;
  }

  // Show the five most recent transactions from this browser session.
  $('transaction-log').innerHTML = transactions.slice(0, 5).map(item => `
    <div class="activity-row">
      <span>
        <strong>${escapeHtml(item.merchant)}</strong>
        <small>${escapeHtml(item.account)} · ${escapeHtml(item.country)}</small>
      </span>
      <span>$${item.amount.toFixed(2)}</span>
      <span class="status-text ${item.flagged ? 'review' : 'approved'}">
        ${item.flagged ? 'Review' : 'Approved'}
      </span>
    </div>
  `).join('');
}

$('transaction-form').addEventListener('submit', event => {
  event.preventDefault();

  const amount = Number($('amount').value);
  const threshold = Number($('threshold').value);
  const merchant = $('merchant').value.trim();
  const account = $('account').value.trim();
  const country = $('country').value.trim().toUpperCase();
  const category = $('category').value;

  if (
    !merchant ||
    !account ||
    !/^[A-Z]{2}$/.test(country) ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !Number.isFinite(threshold) ||
    threshold <= 0
  ) {
    return;
  }

  // These illustrative rules match the separate Java project's sample rules.
  const reasons = [];

  if (amount > threshold) {
    reasons.push(`Amount exceeds the $${threshold.toFixed(2)} threshold`);
  }

  if (country !== 'US') {
    reasons.push(`International transaction (${country})`);
  }

  if (category === 'Electronics' && amount >= 750) {
    reasons.push('Electronics purchase is $750 or more');
  }

  const item = {
    account,
    merchant,
    country,
    category,
    amount,
    flagged: reasons.length > 0,
    time: new Date().toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit'
    })
  };

  transactions.unshift(item);

  $('transaction-result').className = 'result-card';
  $('transaction-result').innerHTML = `
    <div class="result-head">
      <span class="badge ${item.flagged ? 'warn' : 'ok'}">
        ${item.flagged ? 'REVIEW' : 'APPROVED'}
      </span>
      <span class="result-time">${escapeHtml(item.time)}</span>
    </div>

    <div class="result-amount">$${amount.toFixed(2)}</div>
    <p class="result-merchant">${escapeHtml(merchant)}</p>
    <p class="result-meta">
      ${escapeHtml(account)} · ${escapeHtml(category)} · ${escapeHtml(country)}
    </p>

    <div class="result-rule-title">
      ${reasons.length ? 'RULES THAT MATCHED' : 'RULE CHECK'}
    </div>

    ${reasons.length
      ? `<ul class="reasons">${reasons.map(reason =>
          `<li>${escapeHtml(reason)}</li>`
        ).join('')}</ul>`
      : '<p class="no-reasons">No risk rules matched this transaction.</p>'}
  `;

  updateDashboard();
});

// These buttons fill the form with examples. They do not submit automatically.
const samples = {
  approved: {
    account: 'acct-2201',
    merchant: 'Corner Market',
    amount: '42.50',
    category: 'Groceries',
    country: 'US',
    threshold: '1000'
  },
  international: {
    account: 'acct-3308',
    merchant: 'Global Travel Co.',
    amount: '420.00',
    category: 'Travel',
    country: 'GB',
    threshold: '1000'
  }
};

document.querySelectorAll('[data-sample]').forEach(button => {
  button.addEventListener('click', () => {
    const sample = samples[button.dataset.sample];

    for (const [key, value] of Object.entries(sample)) {
      $(key).value = value;
    }

    $('amount').focus();
  });
});

// Clearing activity affects this browser session only.
$('clear-activity').addEventListener('click', () => {
  transactions.length = 0;

  $('transaction-result').className = 'result-empty';
  $('transaction-result').innerHTML =
    '<span class="empty-icon" aria-hidden="true">◈</span>' +
    '<strong>Ready to analyze</strong>' +
    '<p>Submit a transaction to see its decision and the rules behind it.</p>';

  updateDashboard();
});
