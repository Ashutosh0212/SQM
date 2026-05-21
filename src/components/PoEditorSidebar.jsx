export function PoEditorSidebar({ state, dispatch, onReset }) {
  return (
    <div className="editor-panel sidebar-editor">
      <h1>Shivatronics — Purchase Order</h1>

      <div className="ctrl-group">
        <label>PO number</label>
        <input
          type="text"
          className="ctrl-narrow"
          value={state.meta.poNo}
          onChange={(e) =>
            dispatch({ type: 'SET_META', patch: { poNo: e.target.value } })
          }
        />
      </div>
      <div className="ctrl-group">
        <label>PO date</label>
        <input
          type="date"
          className="ctrl-date"
          value={state.meta.poDate}
          onChange={(e) =>
            dispatch({ type: 'SET_META', patch: { poDate: e.target.value } })
          }
        />
      </div>
      <div className="ctrl-group">
        <label>Expiry date</label>
        <input
          type="date"
          className="ctrl-date"
          value={state.meta.expiryDate}
          onChange={(e) =>
            dispatch({
              type: 'SET_META',
              patch: { expiryDate: e.target.value },
            })
          }
        />
      </div>

      <p className="editor-row-hint" style={{ marginTop: '0.35rem' }}>
        Company header, party details, and line items are editable in the preview
        on the right.
      </p>

      <div className="editor-actions" style={{ marginTop: '0.5rem' }}>
        <button
          type="button"
          className="btn btn-add"
          onClick={() => dispatch({ type: 'ADD_ROW' })}
        >
          + Add line item
        </button>
        <button type="button" className="btn btn-clear" onClick={onReset}>
          &#10005; Reset PO
        </button>
      </div>
    </div>
  );
}
