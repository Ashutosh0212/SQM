import { blockTotal, fmt, rowLineTotal } from './money.js';

export function sanitizeShareFilename(base) {
  return String(base).replace(/[^a-zA-Z0-9._\- ]+/g, '_').trim().slice(0, 80) || 'Quotation';
}

/** Human-readable stem for downloadable PDF filenames. */
export function quotationPdfStem(state) {
  const stem = joinLines(state.meta.clientName).trim();
  return sanitizeShareFilename(stem);
}

export function fmtDisplayDate(iso) {
  if (!iso) return '—';
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function joinLines(lines) {
  const s = String(lines || '');
  return s.split(/\r?\n/).length
    ? s
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .join(' ')
    : '';
}

export function parseTermsBullets(raw) {
  const out = [];
  String(raw || '')
    .split(/\r?\n/)
    .forEach((line) => {
      const t = line.replace(/^\s*[\u2022\u00B7•\-*]\s*/, '').trim();
      if (t) out.push(t);
    });
  return out;
}

/** @param {ReturnType<import('../quotation/state.js').createInitialState>} state */
export function buildShareSummaryFromState(state) {
  const raw =
    joinLines(state.meta.clientName).trim() || '(No client)';
  const place = joinLines(state.meta.place || '');
  const date = fmtDisplayDate(state.meta.quoteDate);
  const dateDisp = date === '—' ? '(No date)' : date;
  const subj = joinLines(state.meta.subject || '');
  const totalsBits = [];
  const itemLines = [];
  state.blocks.forEach((block, bix) => {
    const qn = bix + 1;
    totalsBits.push('Q' + qn + ' ' + fmt(blockTotal(block)));
    block.rows.forEach((row, idx) => {
      const qtyParsed = parseFloat(row.qty);
      const qty = Number.isNaN(qtyParsed) ? 0 : qtyParsed;
      const qtyStr = qty % 1 === 0 ? String(Math.round(qty)) : String(qty);
      let label = row.make.trim() || row.model.trim()
        ? [row.make, row.model].filter(Boolean).join(' ').trim()
        : '';
      const desc = row.desc.trim();
      if (!label && desc) label = desc.length > 48 ? desc.slice(0, 45) + '…' : desc;
      if (!label) label = `Item ${idx + 1}`;
      const lt = rowLineTotal(row);
      itemLines.push(
        `Q${qn} • ${label} — Qty ${qtyStr} — ${fmt(lt)}`
      );
    });
  });
  const total = totalsBits.length ? totalsBits.join(' | ') : '₹0';
  const out = [];
  out.push('Shivatronics quotation');
  out.push(`Client: ${raw}`);
  if (place) out.push(`Place: ${place}`);
  out.push(`Date: ${dateDisp}`);
  if (subj) out.push(`Subject: ${subj}`);
  if (itemLines.length) {
    out.push('');
    const maxLines = 8;
    itemLines.slice(0, maxLines).forEach((L) => out.push(L));
    if (itemLines.length > maxLines)
      out.push(`… +${itemLines.length - maxLines} more lines`);
    out.push('');
  }
  out.push(`Totals (incl. GST): ${total}`);
  return out.join('\n');
}
