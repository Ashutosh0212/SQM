import { forwardRef, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { amountInWordsInr } from '../lib/amountInWords.js';
import { fmtDisplayDate } from '../lib/share.js';
import {
  amountEditStr,
  amountPlainStr,
  cdAmtEditStr,
  discAmtEditStr,
  fmtPoNum,
  poRowCalc,
  poTotals,
} from '../purchase-order/calc.js';

/** Keeps free typing until blur, then recalculates rate from amount. */
function PoAmountInput({ row, rowId, dispatch }) {
  const [draft, setDraft] = useState(null);
  const computed = amountEditStr(row);
  const value = draft !== null ? draft : computed;

  return (
    <input
      type="text"
      inputMode="decimal"
      className="po-cell-num po-cell-amt"
      value={value}
      title="Edit amount — rate updates when you leave this field"
      onFocus={() => setDraft(computed || '')}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const v = (draft ?? computed).trim();
        dispatch({ type: 'UPDATE_ROW', rowId, field: 'amount', value: v });
        setDraft(null);
      }}
    />
  );
}

/** Grand total — editable; scales all line amounts on blur. */
function PoGrandTotalInput({ total, dispatch }) {
  const [draft, setDraft] = useState(null);
  const computed = amountPlainStr(total);

  return (
    <input
      type="text"
      inputMode="decimal"
      className="po-grand-total-input"
      value={draft !== null ? draft : computed}
      title="Edit total — line rates adjust when you leave this field"
      onFocus={() => setDraft(computed || '')}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        dispatch({ type: 'SET_GRAND_TOTAL', value: (draft ?? computed).trim() });
        setDraft(null);
      }}
    />
  );
}

const LOGO_SRC = encodeURI(`${import.meta.env.BASE_URL}Shivatronics logo.png`);
const SEAL_SRC = encodeURI(
  `${import.meta.env.BASE_URL}Shiavtronics sign and seal.png`
);

function resizeCellTextarea(el) {
  if (!el) return;
  el.style.height = '0';
  el.style.height = `${el.scrollHeight}px`;
}

/** Discount or CD: editable amount (top) and % (bottom). */
function PoDiscCdCell({
  row,
  rowId,
  dispatch,
  pctField,
  amtField,
  computedAmt,
  colClass,
}) {
  const [amtDraft, setAmtDraft] = useState(null);
  const computed = pctField === 'discountPct' ? discAmtEditStr : cdAmtEditStr;
  const displayAmt = computed(row, computedAmt);
  const amtValue = amtDraft !== null ? amtDraft : displayAmt;

  return (
    <td className={`${colClass} r`}>
      <input
        type="text"
        inputMode="decimal"
        className="po-cell-num po-disc-amt"
        value={amtValue}
        placeholder="0"
        title="Edit amount — % updates when you leave this field"
        onFocus={() => setAmtDraft(displayAmt || '')}
        onChange={(e) => setAmtDraft(e.target.value)}
        onBlur={() => {
          dispatch({
            type: 'UPDATE_ROW',
            rowId,
            field: amtField,
            value: (amtDraft ?? displayAmt).trim(),
          });
          setAmtDraft(null);
        }}
      />
      <div className="po-tax-pct-wrap">
        <input
          type="text"
          className="po-tax-pct"
          value={row[pctField] ?? ''}
          placeholder="0"
          onChange={(e) =>
            dispatch({
              type: 'UPDATE_ROW',
              rowId,
              field: pctField,
              value: e.target.value,
            })
          }
        />
        <span>%</span>
      </div>
    </td>
  );
}

function PoCellTextarea({ value, placeholder, onChange, className = 'po-cell-text' }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    resizeCellTextarea(ref.current);
  }, [value]);
  return (
    <textarea
      ref={ref}
      className={className}
      rows={1}
      spellCheck
      placeholder={placeholder}
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
        resizeCellTextarea(e.target);
      }}
    />
  );
}

function PartyBlock({ party, dispatch }) {
  const addressRef = useRef(null);
  const set = (patch) => dispatch({ type: 'SET_PARTY_DETAILS', patch });

  useLayoutEffect(() => {
    resizeCellTextarea(addressRef.current);
  }, [party.address]);

  return (
    <div className="po-party-body">
      <input
        className="po-party-line po-party-name"
        value={party.name}
        placeholder="Company name"
        onChange={(e) => set({ name: e.target.value })}
      />
      <textarea
        ref={addressRef}
        className="po-party-line"
        rows={2}
        value={party.address}
        placeholder="Address"
        onChange={(e) => {
          set({ address: e.target.value });
          resizeCellTextarea(e.target);
        }}
      />
      <div className="po-party-field">
        <span className="po-party-lbl">Mobile</span>
        <input
          className="po-party-val"
          value={party.mobile}
          onChange={(e) => set({ mobile: e.target.value })}
        />
      </div>
      <div className="po-party-field">
        <span className="po-party-lbl">GSTIN</span>
        <input
          className="po-party-val"
          value={party.gstin}
          onChange={(e) => set({ gstin: e.target.value })}
        />
      </div>
      <div className="po-party-field">
        <span className="po-party-lbl">Place of Supply</span>
        <input
          className="po-party-val"
          value={party.placeOfSupply}
          onChange={(e) => set({ placeOfSupply: e.target.value })}
        />
      </div>
    </div>
  );
}

export const PoDocument = forwardRef(function PoDocument({ state, dispatch }, ref) {
  const totals = useMemo(() => poTotals(state.rows), [state.rows]);
  const amountWords = amountInWordsInr(totals.amount);

  return (
    <div id="po-page" className="po-page" ref={ref}>
      <header className="po-header">
        <h1 className="po-title">PURCHASE ORDER</h1>
        <div className="po-title-rule" aria-hidden="true" />
        <div className="po-header-row">
        <div className="po-header-left">
          <img className="po-logo" src={LOGO_SRC} alt="Shivatronics" />
          <div className="po-company-block">
            <input
              className="po-company-name"
              value={state.company.name}
              onChange={(e) =>
                dispatch({
                  type: 'SET_COMPANY',
                  patch: { name: e.target.value },
                })
              }
            />
            <textarea
              className="po-company-line"
              rows={2}
              value={state.company.address}
              onChange={(e) =>
                dispatch({
                  type: 'SET_COMPANY',
                  patch: { address: e.target.value },
                })
              }
            />
            <div className="po-company-meta">
              <span>GSTIN:</span>
              <input
                className="po-inline-input"
                value={state.company.gstin}
                onChange={(e) =>
                  dispatch({
                    type: 'SET_COMPANY',
                    patch: { gstin: e.target.value },
                  })
                }
              />
            </div>
            <div className="po-company-meta">
              <span>Mobile:</span>
              <input
                className="po-inline-input"
                value={state.company.mobile}
                onChange={(e) =>
                  dispatch({
                    type: 'SET_COMPANY',
                    patch: { mobile: e.target.value },
                  })
                }
              />
            </div>
            <div className="po-company-meta">
              <span>Place of Supply:</span>
              <input
                className="po-inline-input"
                value={state.company.placeOfSupply ?? ''}
                onChange={(e) =>
                  dispatch({
                    type: 'SET_COMPANY',
                    patch: { placeOfSupply: e.target.value },
                  })
                }
              />
            </div>
          </div>
        </div>
        <div className="po-header-right">
          <div className="po-meta-grid">
            <span className="po-meta-lbl">PO No.</span>
            <span className="po-meta-colon">:</span>
            <input
              className="po-meta-val"
              value={state.meta.poNo}
              onChange={(e) =>
                dispatch({
                  type: 'SET_META',
                  patch: { poNo: e.target.value },
                })
              }
            />
            <span className="po-meta-lbl">PO Date</span>
            <span className="po-meta-colon">:</span>
            <span className="po-meta-val po-meta-date">
              {fmtDisplayDate(state.meta.poDate)}
            </span>
            <span className="po-meta-lbl">Expiry Date</span>
            <span className="po-meta-colon">:</span>
            <span className="po-meta-val po-meta-date">
              {fmtDisplayDate(state.meta.expiryDate)}
            </span>
          </div>
        </div>
        </div>
      </header>

      <section className="po-parties">
        <div className="po-party-hdr">PARTY DETAILS</div>
        <PartyBlock party={state.partyDetails} dispatch={dispatch} />
      </section>

      <div className="po-table-wrap">
        <table className="po-items-table">
          <thead>
            <tr>
              <th className="po-col-sno">S.NO.</th>
              <th className="po-col-item">ITEMS</th>
              <th className="po-col-qty">QTY.</th>
              <th className="po-col-rate">RATE</th>
              <th className="po-col-disc">DISCOUNT</th>
              <th className="po-col-cd" title="Cash Discount">
                CD
              </th>
              <th className="po-col-tax">TAX</th>
              <th className="po-col-amt">AMOUNT</th>
              <th className="po-col-del screen-only-print-hide" aria-label="Remove" />
            </tr>
          </thead>
          <tbody>
            {state.rows.map((row, ri) => {
              const c = poRowCalc(row);
              return (
                <tr key={row.id}>
                  <td className="po-col-sno">{ri + 1}</td>
                  <td className="po-col-item wrap">
                    <PoCellTextarea
                      value={row.item}
                      placeholder="Item description"
                      onChange={(v) =>
                        dispatch({
                          type: 'UPDATE_ROW',
                          rowId: row.id,
                          field: 'item',
                          value: v,
                        })
                      }
                    />
                  </td>
                  <td className="po-col-qty">
                    <div className="po-qty-unit">
                      <input
                        type="text"
                        className="po-cell-num"
                        value={row.qty}
                        onChange={(e) =>
                          dispatch({
                            type: 'UPDATE_ROW',
                            rowId: row.id,
                            field: 'qty',
                            value: e.target.value,
                          })
                        }
                      />
                      <input
                        type="text"
                        className="po-cell-unit"
                        value={row.unit}
                        onChange={(e) =>
                          dispatch({
                            type: 'UPDATE_ROW',
                            rowId: row.id,
                            field: 'unit',
                            value: e.target.value,
                          })
                        }
                      />
                    </div>
                  </td>
                  <td className="po-col-rate r">
                    <input
                      type="text"
                      className="po-cell-num"
                      value={row.rate}
                      onChange={(e) =>
                        dispatch({
                          type: 'UPDATE_ROW',
                          rowId: row.id,
                          field: 'rate',
                          value: e.target.value,
                        })
                      }
                    />
                  </td>
                  <PoDiscCdCell
                    row={row}
                    rowId={row.id}
                    dispatch={dispatch}
                    pctField="discountPct"
                    amtField="discountAmt"
                    computedAmt={c.discAmt}
                    colClass="po-col-disc"
                  />
                  <PoDiscCdCell
                    row={row}
                    rowId={row.id}
                    dispatch={dispatch}
                    pctField="cdPct"
                    amtField="cdAmt"
                    computedAmt={c.cdAmt}
                    colClass="po-col-cd"
                  />
                  <td className="po-col-tax r">
                    <span className="po-tax-amt">{fmtPoNum(c.tax)}</span>
                    <div className="po-tax-pct-wrap">
                      <input
                        type="text"
                        className="po-tax-pct"
                        value={row.taxPct}
                        onChange={(e) =>
                          dispatch({
                            type: 'UPDATE_ROW',
                            rowId: row.id,
                            field: 'taxPct',
                            value: e.target.value,
                          })
                        }
                      />
                      <span>%</span>
                    </div>
                  </td>
                  <td className="po-col-amt r bold">
                    <PoAmountInput row={row} rowId={row.id} dispatch={dispatch} />
                  </td>
                  <td className="po-col-del screen-only-print-hide">
                    <button
                      type="button"
                      className="del-row"
                      title="Remove row"
                      disabled={state.rows.length <= 1}
                      onClick={() =>
                        dispatch({ type: 'DELETE_ROW', rowId: row.id })
                      }
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
            <tr className="po-subtotal-row">
              <td colSpan={2} className="r bold">
                SUBTOTAL
              </td>
              <td className="r">{fmtPoNum(totals.qtySum)}</td>
              <td />
              <td className="r">{fmtPoNum(totals.discSum)}</td>
              <td className="r">{fmtPoNum(totals.cdSum)}</td>
              <td className="r">{fmtPoNum(totals.tax)}</td>
              <td className="r bold">{fmtPoNum(totals.amount)}</td>
              <td className="screen-only-print-hide" />
            </tr>
          </tbody>
        </table>
      </div>

      <div className="po-bottom">
        <div className="po-summary-col">
          <div className="po-summary-row">
            <span>Taxable Amount</span>
            <span>{fmtPoNum(totals.taxable)}</span>
          </div>
          <div className="po-summary-row">
            <span>CGST @9%</span>
            <span>{fmtPoNum(totals.cgst)}</span>
          </div>
          <div className="po-summary-row">
            <span>SGST @9%</span>
            <span>{fmtPoNum(totals.sgst)}</span>
          </div>
          <div className="po-summary-total">
            <span>Total Amount</span>
            <div className="po-grand-total-wrap">
              <span className="po-grand-currency" aria-hidden="true">
                ₹
              </span>
              <PoGrandTotalInput total={totals.amount} dispatch={dispatch} />
            </div>
          </div>
          <div className="po-amount-words">
            {amountWords}
          </div>
        </div>
      </div>

      <footer className="po-footer">
        <div className="po-footer-spacer" />
        <div className="po-sign-block">
          <div className="sign-seal-wrap" aria-hidden="true">
            <img className="sign-seal-img" src={SEAL_SRC} alt="" />
          </div>
          <input
            className="po-sign-label"
            value={state.signatoryLabel}
            onChange={(e) =>
              dispatch({ type: 'SET_SIGNATORY', label: e.target.value })
            }
          />
        </div>
      </footer>
    </div>
  );
});
