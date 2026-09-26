// All browser demo data remains in memory and disappears when the page reloads.
const $ = (id) => document.getElementById(id);
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const transactions=[];
$('transaction-form').addEventListener('submit', event => {
  event.preventDefault();
  const amount=Number($('amount').value), threshold=Number($('threshold').value);
  if (!Number.isFinite(amount)||amount<=0||!Number.isFinite(threshold)||threshold<=0) return;
  const merchant=$('merchant').value.trim(), country=$('country').value.trim().toUpperCase(), category=$('category').value;
  const reasons=[];
  if(amount>threshold) reasons.push(`Amount exceeds the $${threshold.toFixed(2)} threshold`);
  if(country!=='US') reasons.push(`International transaction (${country})`);
  if(category==='Electronics'&&amount>=750) reasons.push('Electronics purchase is $750 or more');
  const item={merchant,amount,flagged:reasons.length>0}; transactions.unshift(item);
  $('transaction-result').className='result-card';
  $('transaction-result').innerHTML=`<span class="badge ${item.flagged?'warn':'ok'}">${item.flagged?'REVIEW':'APPROVED'}</span><h3>$${amount.toFixed(2)}</h3><p>${escapeHtml(merchant)} · ${escapeHtml($('account').value.trim())} · ${escapeHtml(country)}</p>${reasons.length?`<ul class="reasons">${reasons.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul>`:'<p>No risk rules matched this transaction.</p>'}`;
  $('txn-count').textContent=transactions.length; $('flag-count').textContent=transactions.filter(x=>x.flagged).length;
  $('transaction-log').innerHTML=transactions.slice(0,5).map(x=>`<div class="log-row"><span>${escapeHtml(x.merchant)}</span><span>$${x.amount.toFixed(2)} · ${x.flagged?'Review':'Approved'}</span></div>`).join('');
});
