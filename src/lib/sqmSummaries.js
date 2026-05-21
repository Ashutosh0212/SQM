import { blockTotal } from './money.js';
import { poTotals } from '../purchase-order/calc.js';

export function quotSummary(state) {
  let total = 0;
  for (const block of state.blocks || []) {
    total += blockTotal(block);
  }
  const subject = String(state.meta?.subject || '').trim();
  const clientName = String(state.meta?.clientName || '').trim();
  return {
    summaryTotal: Math.round(total * 100) / 100,
    docDate: state.meta?.quoteDate || '',
    refLabel: subject || clientName.split(/\r?\n/)[0] || '',
  };
}

export function poSummary(state) {
  const { amount } = poTotals(state.rows || []);
  return {
    summaryTotal: Math.round(amount * 100) / 100,
    docDate: state.meta?.poDate || '',
    refLabel: String(state.meta?.poNo || '').trim() || 'PO',
  };
}
