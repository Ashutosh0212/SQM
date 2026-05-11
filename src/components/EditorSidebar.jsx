export function EditorSidebar({ meta, dispatch, onReset, onSignOut }) {
  return (
    <div className="editor-panel sidebar-editor">
      <h1>Shivatronics — Quotation Builder</h1>
      <div className="ctrl-group">
        <label>To (Client)</label>
        <textarea
          className="ctrl-wide"
          rows={3}
          placeholder="Patil Rail Infrastructure Pvt Ltd"
          value={meta.clientName}
          onChange={(e) =>
            dispatch({ type: 'SET_META', patch: { clientName: e.target.value } })
          }
        />
      </div>
      <div className="ctrl-group">
        <label>City / Place</label>
        <textarea
          className="ctrl-narrow"
          rows={2}
          placeholder="Chandrapur"
          value={meta.place}
          onChange={(e) =>
            dispatch({ type: 'SET_META', patch: { place: e.target.value } })
          }
        />
      </div>
      <div className="ctrl-group">
        <label>Date</label>
        <input
          type="date"
          className="ctrl-date"
          value={meta.quoteDate}
          onChange={(e) =>
            dispatch({ type: 'SET_META', patch: { quoteDate: e.target.value } })
          }
        />
      </div>
      <div className="ctrl-group">
        <label>Subject (optional)</label>
        <textarea
          className="ctrl-subj"
          rows={2}
          placeholder="Supply of Air Conditioners"
          value={meta.subject}
          onChange={(e) =>
            dispatch({ type: 'SET_META', patch: { subject: e.target.value } })
          }
        />
      </div>
      <div className="ctrl-group" style={{ flex: '1 1 100%', minWidth: 0 }}>
        <label>Terms &amp; conditions</label>
        <p className="terms-editor-hint">
          One line per bullet; leading &ldquo;&bull;&rdquo; or &ldquo;-&rdquo;
          is optional. Updates the quotation preview on the right.
        </p>
        <textarea
          className="ctrl-terms ctrl-wide"
          rows={6}
          placeholder="Above rates are inclusive of GST"
          value={meta.terms}
          onChange={(e) =>
            dispatch({ type: 'SET_META', patch: { terms: e.target.value } })
          }
        />
      </div>
      <p className="editor-row-hint">
        + Add Item inserts a line in the quotation outlined in blue (click a
        table to switch). + Add quotation table adds another full pricing grid
        and its own total for multiple quotes in one PDF.
      </p>
      <div className="editor-actions">
        <button
          type="button"
          className="btn btn-add"
          onClick={() => dispatch({ type: 'ADD_ROW' })}
        >
          + Add Item
        </button>
        <button
          type="button"
          className="btn btn-add"
          onClick={() => dispatch({ type: 'ADD_BLOCK' })}
        >
          + Add quotation table
        </button>
        <button type="button" className="btn btn-clear" onClick={onReset}>
          &#10005; Reset
        </button>
        <button type="button" className="btn btn-print" onClick={onSignOut}>
          Sign out
        </button>
      </div>
    </div>
  );
}
