import { poTotals } from '../purchase-order/calc.js';
import { fmtDisplayDate, sanitizeShareFilename } from './share.js';
import { fmtPoMoney } from '../purchase-order/calc.js';

export function poPdfStem(state) {
  const name = (state.partyDetails.name || '').trim();
  const no = (state.meta.poNo || '').trim();
  const stem = [name, no && `PO-${no}`].filter(Boolean).join(' ');
  return sanitizeShareFilename(stem || 'Purchase-Order');
}

export function buildPoShareSummary(state) {
  const { amount } = poTotals(state.rows);
  const lines = [];
  lines.push('Shivatronics — Purchase Order');
  lines.push(`PO No: ${state.meta.poNo || '—'}`);
  lines.push(`Date: ${fmtDisplayDate(state.meta.poDate)}`);
  if (state.partyDetails.name) lines.push(`Party: ${state.partyDetails.name}`);
  lines.push(`Total: ${fmtPoMoney(amount)}`);
  return lines.join('\n');
}
