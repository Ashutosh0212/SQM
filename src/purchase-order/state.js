import { applyPoRowField, rowsFromGrandTotal } from './calc.js';

function defaultRows() {
  return [
    {
      id: 1,
      item: 'VOLTAS WATER COOLER 60/120 PSS',
      qty: '10',
      unit: 'PCS',
      rate: '40254.24',
      discountPct: '',
      discountAmt: '',
      cdPct: '',
      cdAmt: '',
      taxPct: '18',
    },
  ];
}

function addDaysIso(iso, days) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function createInitialPoState() {
  const today = new Date().toISOString().slice(0, 10);
  return {
    meta: {
      poNo: '537',
      poDate: today,
      expiryDate: addDaysIso(today, 30),
    },
    company: {
      name: 'SHIVATRONICS',
      address:
        'B-31, SAI REGENCY COMPLEX, RAVI NAGAR SQ,\nNAGPUR, Maharashtra',
      gstin: '27ABFPG1936K1ZM',
      mobile: '9370573221',
      placeOfSupply: 'Maharashtra',
    },
    partyDetails: {
      name: 'SAI ENVIRO',
      address:
        'Plot No. 45, Wardha Road\nNagpur, Maharashtra — 440015',
      mobile: '+91 712 255 1234',
      gstin: '27AAAAA0000A1Z5',
      placeOfSupply: 'Maharashtra (27)',
    },
    rowIdCounter: 1,
    rows: defaultRows(),
    signatoryLabel: 'Authorised Signature for SHIVATRONICS',
  };
}

export function poReducer(state, action) {
  switch (action.type) {
    case 'SET_META':
      return { ...state, meta: { ...state.meta, ...action.patch } };

    case 'SET_COMPANY':
      return { ...state, company: { ...state.company, ...action.patch } };

    case 'SET_PARTY_DETAILS':
      return {
        ...state,
        partyDetails: { ...state.partyDetails, ...action.patch },
      };

    case 'SET_SIGNATORY':
      return { ...state, signatoryLabel: action.label };

    case 'ADD_ROW': {
      const nextId = state.rowIdCounter + 1;
      return {
        ...state,
        rowIdCounter: nextId,
        rows: [
          ...state.rows,
          {
            id: nextId,
            item: '',
            qty: '1',
            unit: 'PCS',
            rate: '',
            discountPct: '',
            discountAmt: '',
            cdPct: '',
            cdAmt: '',
            taxPct: '18',
          },
        ],
      };
    }

    case 'DELETE_ROW':
      return {
        ...state,
        rows: state.rows.filter((r) => r.id !== action.rowId),
      };

    case 'UPDATE_ROW': {
      const rows = state.rows.map((r) =>
        r.id === action.rowId
          ? applyPoRowField(r, action.field, action.value)
          : r
      );
      return { ...state, rows };
    }

    case 'SET_GRAND_TOTAL':
      return { ...state, rows: rowsFromGrandTotal(state.rows, action.value) };

    case 'CLEAR':
      return createInitialPoState();

    case 'LOAD':
      return action.payload;

    default:
      return state;
  }
}
