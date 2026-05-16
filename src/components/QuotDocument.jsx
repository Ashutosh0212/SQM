import { forwardRef, useLayoutEffect, useMemo, useRef } from 'react';
import { blockTotal, fmt, rowLineTotal } from '../lib/money.js';
import { fmtDisplayDate, parseTermsBullets } from '../lib/share.js';

const SEAL_SRC = encodeURI(
  `${import.meta.env.BASE_URL}Shiavtronics sign and seal.png`
);

function resizeCellTextarea(el) {
  if (!el) return;
  el.style.height = '0';
  el.style.height = `${el.scrollHeight}px`;
}

function CellTextarea({ value, placeholder, onChange, onFocus }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    resizeCellTextarea(ref.current);
  }, [value]);

  return (
    <textarea
      ref={ref}
      className="cell-text"
      rows={1}
      spellCheck
      placeholder={placeholder}
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
        resizeCellTextarea(e.target);
      }}
      onFocus={onFocus}
    />
  );
}

export const QuotDocument = forwardRef(function QuotDocument({ state, dispatch }, ref) {
  const bullets = useMemo(
    () => parseTermsBullets(state.meta.terms),
    [state.meta.terms]
  );
  const subjOk = !!(state.meta.subject || '').trim();
  const nameDisp = state.meta.clientName.trim() || '\u2014';
  const placeDisp = state.meta.place.trim();
  const dateDisp = fmtDisplayDate(state.meta.quoteDate);

  return (
    <div id="quotation-page" ref={ref}>
      <div id="quotation-page-inner">
        <div id="content-area">
          <div className="content-stack">
            <div className="meta-row">
              <div className="to-col">
                <div className="to-label">To</div>
                <div className="to-name">{nameDisp}</div>
                <div className="to-place">{placeDisp}</div>
              </div>
              <div className="date-block">
                <div className="date-label">Date</div>
                <div className="date-val">{dateDisp}</div>
              </div>
            </div>

            <div
              className="subject-line"
              style={{ display: subjOk ? 'block' : 'none' }}
            >
              <strong>Sub:</strong> {(state.meta.subject || '').trim()}
            </div>

            <div id="quote-blocks">
              {state.blocks.map((block, blockIndex) => (
                <section
                  key={block.id}
                  className={
                    'quote-block' +
                    (block.id === state.activeBlockId ? ' is-active' : '')
                  }
                  data-quote-block-id={String(block.id)}
                  onFocusCapture={() =>
                    dispatch({ type: 'SET_ACTIVE_BLOCK', blockId: block.id })
                  }
                  tabIndex={-1}
                >
                  <div className="quote-block-bar screen-only-print-hide">
                    <span className="quote-block-label">
                      {'Quotation ' + (blockIndex + 1)}
                    </span>
                    <button
                      type="button"
                      className="btn-quote-remove"
                      title="Remove this quotation table"
                      disabled={state.blocks.length <= 1}
                      onClick={() =>
                        dispatch({ type: 'REMOVE_BLOCK', blockId: block.id })
                      }
                    >
                      Remove table
                    </button>
                  </div>
                  <textarea
                    className="quote-block-notes cell-text"
                    spellCheck
                    rows={2}
                    placeholder="Optional heading or notes above this quotation (e.g. option B, revised scope)…"
                    value={block.notes}
                    onChange={(e) =>
                      dispatch({
                        type: 'BLOCK_NOTES',
                        blockId: block.id,
                        notes: e.target.value,
                      })
                    }
                    onFocus={() =>
                      dispatch({ type: 'SET_ACTIVE_BLOCK', blockId: block.id })
                    }
                  />
                  <div className="items-table-wrap">
                    <table className="items-table">
                      <colgroup>
                        <col className="col-sr" />
                        <col className="col-make" />
                        <col className="col-model" />
                        <col className="col-desc" />
                        <col className="col-basic" />
                        <col className="col-rate" />
                        <col className="col-qty" />
                        <col className="col-total" />
                        <col className="col-del del-col" />
                      </colgroup>
                      <thead>
                        <tr>
                          <th className="col-sr" style={{ textAlign: 'center' }}>
                            Sr.
                          </th>
                          <th className="col-make">Make</th>
                          <th className="col-model">Model</th>
                          <th className="col-desc">Description</th>
                          <th className="col-basic r">Basic (excl. GST)</th>
                          <th className="col-rate r">Rate (incl. 18% GST)</th>
                          <th className="col-qty r">Qty</th>
                          <th className="col-total r">Total</th>
                          <th
                            className="col-del del-col"
                            aria-label="Actions"
                          />
                        </tr>
                      </thead>
                      <tbody id={`items-body-${block.id}`}>
                        {block.rows.map((row, ri) => (
                          <tr
                            key={row.id}
                            onFocus={() =>
                              dispatch({
                                type: 'SET_ACTIVE_BLOCK',
                                blockId: block.id,
                              })
                            }
                          >
                            <td style={{ textAlign:'center', color:'#64748b', fontSize:9 }}>
                              {ri + 1}
                            </td>
                            {['make', 'model', 'desc'].map((field) => (
                              <td key={field} className="wrap">
                                <CellTextarea
                                  placeholder={
                                    field === 'make'
                                      ? 'Voltas'
                                      : field === 'model'
                                        ? '185 V Vertis'
                                        : '1.5 Ton 5 Star Inverter'
                                  }
                                  value={row[field]}
                                  onChange={(value) =>
                                    dispatch({
                                      type: 'UPDATE_ROW',
                                      blockId: block.id,
                                      rowId: row.id,
                                      field,
                                      value,
                                    })
                                  }
                                  onFocus={() =>
                                    dispatch({
                                      type: 'SET_ACTIVE_BLOCK',
                                      blockId: block.id,
                                    })
                                  }
                                />
                              </td>
                            ))}
                            {(['basic', 'rate', 'qty'] ).map((field) => (
                              <td key={field} className="r">
                                <input
                                  type="number"
                                  data-field={field}
                                  placeholder={field === 'qty' ? '1' : '0.00'}
                                  min="0"
                                  step={field === 'qty' ? '1' : '0.01'}
                                  value={row[field]}
                                  onChange={(e) =>
                                    dispatch({
                                      type: 'UPDATE_ROW',
                                      blockId: block.id,
                                      rowId: row.id,
                                      field,
                                      value: e.target.value,
                                    })
                                  }
                                />
                              </td>
                            ))}
                            <td className="r bold">{fmt(rowLineTotal(row))}</td>
                            <td className="del-col">
                              <button
                                type="button"
                                className="del-row"
                                title="Remove"
                                onClick={() =>
                                  dispatch({
                                    type: 'DELETE_ROW',
                                    blockId: block.id,
                                    rowId: row.id,
                                  })
                                }
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="total-section">
                    <div className="total-box">
                      <div className="t-row grand">
                        <span className="t-l">Total</span>
                        <span className="t-v" id={`grand-total-${block.id}`}>
                          {fmt(blockTotal(block))}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
              ))}
            </div>

            <div className="terms-section">
              <div className="terms-title">Terms & Conditions</div>
              <ul id="disp-terms-list">
                {bullets.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>

            <div className="footer-row">
              <div className="bank-block">
                <div className="bank-title">Bank Details</div>
                <p>
                  Kotak Mahindra Bank<br />
                  Account No: 0211197122<br />
                  GST No: 27ABFPG1936K1ZM
                </p>
              </div>
              <div className="sign-block">
                <div className="sign-seal-wrap" aria-hidden="true">
                  <img className="sign-seal-img" src={SEAL_SRC} alt="" />
                </div>
                <div className="sign-line">For Shivatronics</div>
                <div>(Authorised Signatory)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
