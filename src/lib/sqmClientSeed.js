import { createInitialPoState } from '../purchase-order/state.js';
import { createInitialState } from '../quotation/state.js';

/** New quotation pre-filled from a saved client record. */
export function quotStateForClient(client) {
  const base = createInitialState();
  return {
    ...base,
    meta: {
      ...base.meta,
      clientName: client.displayName || '',
      place: client.place || '',
    },
  };
}

/** New PO with party details from client. */
export function poStateForClient(client) {
  const base = createInitialPoState();
  const party = {
    name: client.displayName || '',
    address: client.place || '',
    mobile: client.mobile || '',
    gstin: client.gstin || '',
    placeOfSupply: client.placeOfSupply || '',
  };
  return { ...base, partyDetails: { ...party } };
}
