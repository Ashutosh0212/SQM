import { DEFAULT_TERMS_TEXT } from '../lib/termsDefault.js';
import { syncBasicRatePair } from '../lib/money.js';

/** @typedef {{ id:number; notes:string; rows: QuoteRow[] }} QuoteBlock */
/** @typedef {{ id:number; make:string; model:string; desc:string; basic:string; rate:string; qty:string }} QuoteRow */

function sampleRows() {
  return [
    {
      id: 1,
      make: 'Voltas',
      model: '185 V Vertis Emerald',
      desc: '1.5 Ton 5 Star Inverter',
      basic: '33050.84',
      rate: '39000',
      qty: '1',
    },
    {
      id: 2,
      make: 'Voltas',
      model: '183 V CAW',
      desc: '1.5 Ton 3 Star Inverter',
      basic: '25000',
      rate: '29500',
      qty: '1',
    },
  ];
}

/** Fresh document (used on reset). */
export function createInitialState() {
  return {
    meta: {
      clientName: '',
      place: '',
      quoteDate: new Date().toISOString().slice(0, 10),
      subject: '',
      terms: DEFAULT_TERMS_TEXT,
    },
    quoteBlockCounter: 1,
    rowIdCounter: 2,
    activeBlockId: 1,
    blocks: [{ id: 1, notes: '', rows: sampleRows() }],
  };
}

/**
 * @param {any} state
 * @param {any} action
 */
export function quotationReducer(state, action) {
  switch (action.type) {
    case 'SET_META':
      return { ...state, meta: { ...state.meta, ...action.patch } };

    case 'SET_ACTIVE_BLOCK':
      return { ...state, activeBlockId: action.blockId };

    case 'BLOCK_NOTES': {
      const blocks = state.blocks.map((b) =>
        b.id === action.blockId ? { ...b, notes: action.notes } : b
      );
      return { ...state, blocks };
    }

    case 'ADD_ROW': {
      const bid = action.blockId ?? state.activeBlockId;
      const nextRowId = state.rowIdCounter + 1;
      const blocks = state.blocks.map((b) => {
        if (b.id !== bid) return b;
        return {
          ...b,
          rows: [
            ...b.rows,
            {
              id: nextRowId,
              make: '',
              model: '',
              desc: '',
              basic: '',
              rate: '',
              qty: '1',
            },
          ],
        };
      });
      return { ...state, rowIdCounter: nextRowId, blocks };
    }

    case 'DELETE_ROW': {
      const blocks = state.blocks.map((b) =>
        b.id === action.blockId
          ? { ...b, rows: b.rows.filter((r) => r.id !== action.rowId) }
          : b
      );
      return { ...state, blocks };
    }

    case 'UPDATE_ROW': {
      const blocks = state.blocks.map((b) => {
        if (b.id !== action.blockId) return b;
        const rows = b.rows.map((r) => {
          if (r.id !== action.rowId) return r;
          if (action.field === 'qty') {
            return { ...r, qty: action.value };
          }
          if (action.field === 'basic' || action.field === 'rate') {
            let next = { ...r, [action.field]: action.value };
            next = syncBasicRatePair(next, action.field);
            return next;
          }
          return { ...r, [action.field]: action.value };
        });
        return { ...b, rows };
      });
      return { ...state, blocks };
    }

    case 'ADD_BLOCK': {
      const nid = state.quoteBlockCounter + 1;
      return {
        ...state,
        quoteBlockCounter: nid,
        activeBlockId: nid,
        blocks: [...state.blocks, { id: nid, notes: '', rows: [] }],
      };
    }

    case 'REMOVE_BLOCK': {
      if (state.blocks.length <= 1) return state;
      const blocks = state.blocks.filter((b) => b.id !== action.blockId);
      let activeBlockId = state.activeBlockId;
      if (activeBlockId === action.blockId) activeBlockId = blocks[0].id;
      return { ...state, blocks, activeBlockId };
    }

    case 'CLEAR': {
      return createInitialState();
    }

    case 'LOAD':
      return action.payload;

    default:
      return state;
  }
}
