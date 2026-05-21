/** Restore counters after loading from Firestore. */
export function normalizeQuotState(raw) {
  const state = { ...raw };
  let maxRow = 0;
  let maxBlock = 0;
  for (const b of state.blocks || []) {
    maxBlock = Math.max(maxBlock, Number(b.id) || 0);
    for (const r of b.rows || []) {
      maxRow = Math.max(maxRow, Number(r.id) || 0);
    }
  }
  state.rowIdCounter = maxRow || 1;
  state.quoteBlockCounter = maxBlock || 1;
  state.activeBlockId = state.blocks?.[0]?.id ?? 1;
  return state;
}

export function normalizePoState(raw) {
  const state = { ...raw };
  let maxRow = 0;
  for (const r of state.rows || []) {
    maxRow = Math.max(maxRow, Number(r.id) || 0);
  }
  state.rowIdCounter = maxRow || 1;
  return state;
}
