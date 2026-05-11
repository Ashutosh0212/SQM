export const GST_PERCENT = 18;
export const GST_MULT = 1 + GST_PERCENT / 100;

export function roundMoney(v) {
  return Math.round(v * 100) / 100;
}

/** Rate = Basic × (1 + GST%); Basic = Rate ÷ (1 + GST%) */
export function syncBasicRatePair(row, sourceField) {
  const next = { ...row };
  if (sourceField === 'basic') {
    const tb = String(next.basic ?? '').trim();
    if (tb === '') return next;
    const b = parseFloat(tb);
    if (Number.isNaN(b)) return next;
    next.rate = String(roundMoney(b * GST_MULT));
  } else if (sourceField === 'rate') {
    const tr = String(next.rate ?? '').trim();
    if (tr === '') return next;
    const r = parseFloat(tr);
    if (Number.isNaN(r)) return next;
    next.basic = String(roundMoney(r / GST_MULT));
  }
  return next;
}

export function fmt(n) {
  if (n === 0) return '₹0';
  const rounded = Math.round(n * 100) / 100;
  return (
    '₹' +
    rounded.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
  );
}

export function rowLineTotal(row) {
  const rate = parseFloat(row.rate) || 0;
  const qtyRaw = parseFloat(row.qty);
  const qty = Number.isNaN(qtyRaw) || qtyRaw === 0 ? 1 : qtyRaw;
  return rate * qty;
}

export function blockTotal(block) {
  return block.rows.reduce((s, r) => s + rowLineTotal(r), 0);
}
