import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchSqmDashboard,
  filterDocsForClient,
  getSqmClient,
  loadSqmPurchaseOrder,
  loadSqmQuotation,
  updateSqmClient,
} from '../lib/sqmDb.js';
import { fmtDateIso, fmtInr, fmtWhen } from '../lib/formatUi.js';
import { normalizePoState, normalizeQuotState } from '../lib/sqmNormalize.js';
import { poStateForClient, quotStateForClient } from '../lib/sqmClientSeed.js';

export function CustomersPanel({
  onOpenQuotation,
  onOpenPurchaseOrder,
  onNewQuotationForClient,
  onNewPoForClient,
  showToast,
}) {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [edit, setEdit] = useState(null);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const dash = await fetchSqmDashboard();
      setClients(dash.clients);
      setQuotations(dash.quotations);
      setPurchaseOrders(dash.purchaseOrders);
    } catch (e) {
      console.error(e);
      showToast('Could not load customers.', 'err');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => {
      const blob = [
        c.displayName,
        c.place,
        c.mobile,
        c.gstin,
        c.id,
      ]
        .join(' ')
        .toLowerCase();
      return blob.includes(q);
    });
  }, [clients, search]);

  useEffect(() => {
    if (!selectedId && filtered.length) setSelectedId(filtered[0].id);
    if (selectedId && !filtered.find((c) => c.id === selectedId)) {
      setSelectedId(filtered[0]?.id ?? '');
    }
  }, [filtered, selectedId]);

  useEffect(() => {
    if (!selectedId) {
      setEdit(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const c = await getSqmClient(selectedId);
        if (!cancelled && c) {
          setEdit({
            displayName: c.displayName || '',
            place: c.place || '',
            mobile: c.mobile || '',
            gstin: c.gstin || '',
            placeOfSupply: c.placeOfSupply || '',
          });
        }
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const clientQuotations = useMemo(
    () => filterDocsForClient(quotations, selectedId),
    [quotations, selectedId]
  );
  const clientPos = useMemo(
    () => filterDocsForClient(purchaseOrders, selectedId),
    [purchaseOrders, selectedId]
  );

  async function saveClientEdits() {
    if (!selectedId || !edit) return;
    setSaving(true);
    try {
      await updateSqmClient(selectedId, edit);
      showToast('Customer updated.');
      await refresh();
    } catch (e) {
      console.error(e);
      showToast('Could not update customer.', 'err');
    } finally {
      setSaving(false);
    }
  }

  async function openDoc(kind, docId) {
    try {
      if (kind === 'quotation') {
        const rec = await loadSqmQuotation(docId);
        onOpenQuotation(normalizeQuotState(rec.payload), docId);
      } else {
        const rec = await loadSqmPurchaseOrder(docId);
        onOpenPurchaseOrder(normalizePoState(rec.payload), docId);
      }
    } catch (e) {
      console.error(e);
      showToast('Could not open document.', 'err');
    }
  }

  function handleNewQuot() {
    if (!edit) return;
    onNewQuotationForClient(
      { id: selectedId, ...edit },
      quotStateForClient({ displayName: edit.displayName, place: edit.place })
    );
  }

  function handleNewPo() {
    if (!edit) return;
    onNewPoForClient(
      { id: selectedId, ...edit },
      poStateForClient({
        displayName: edit.displayName,
        place: edit.place,
        mobile: edit.mobile,
        gstin: edit.gstin,
        placeOfSupply: edit.placeOfSupply,
      })
    );
  }

  return (
    <div className="crm-page crm-customers-layout">
      <div className="crm-page-head">
        <div>
          <h1 className="crm-page-title">Customers</h1>
          <p className="crm-page-sub">
            View and edit client details, quotations, and purchase orders.
          </p>
        </div>
        <button type="button" className="btn btn-print" onClick={refresh} disabled={loading}>
          Refresh
        </button>
      </div>

      <div className="crm-customers-split">
        <aside className="crm-client-list">
          <input
            type="search"
            className="crm-search"
            placeholder="Search customers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <ul className="crm-client-ul">
            {filtered.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className={
                    'crm-client-item' + (c.id === selectedId ? ' is-active' : '')
                  }
                  onClick={() => setSelectedId(c.id)}
                >
                  <span className="crm-client-item-name">
                    {c.displayName || 'Unnamed'}
                  </span>
                  <span className="crm-client-item-meta">
                    {c.place ? c.place.split(/\r?\n/)[0] : '—'}
                  </span>
                </button>
              </li>
            ))}
            {!loading && filtered.length === 0 ? (
              <li className="crm-empty">No customers match your search.</li>
            ) : null}
          </ul>
        </aside>

        <div className="crm-client-detail">
          {!selectedId || !edit ? (
            <p className="crm-empty">Select a customer to view details.</p>
          ) : (
            <>
              <div className="crm-detail-card">
                <h2 className="crm-section-title">Customer details</h2>
                <div className="crm-form-grid">
                  <label>
                    Name
                    <input
                      value={edit.displayName}
                      onChange={(e) =>
                        setEdit({ ...edit, displayName: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Mobile
                    <input
                      value={edit.mobile}
                      onChange={(e) =>
                        setEdit({ ...edit, mobile: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    GSTIN
                    <input
                      value={edit.gstin}
                      onChange={(e) =>
                        setEdit({ ...edit, gstin: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Place of supply
                    <input
                      value={edit.placeOfSupply}
                      onChange={(e) =>
                        setEdit({ ...edit, placeOfSupply: e.target.value })
                      }
                    />
                  </label>
                  <label className="crm-span-2">
                    Address / place
                    <textarea
                      rows={3}
                      value={edit.place}
                      onChange={(e) =>
                        setEdit({ ...edit, place: e.target.value })
                      }
                    />
                  </label>
                </div>
                <div className="crm-detail-actions">
                  <button
                    type="button"
                    className="btn btn-share"
                    disabled={saving}
                    onClick={saveClientEdits}
                  >
                    {saving ? 'Saving…' : 'Save customer'}
                  </button>
                  <button type="button" className="btn btn-add" onClick={handleNewQuot}>
                    + Quotation
                  </button>
                  <button type="button" className="btn btn-add" onClick={handleNewPo}>
                    + Purchase order
                  </button>
                </div>
              </div>

              <DocTable
                title="Quotations"
                rows={clientQuotations}
                onOpen={(id) => openDoc('quotation', id)}
              />
              <DocTable
                title="Purchase orders"
                rows={clientPos}
                onOpen={(id) => openDoc('purchase_order', id)}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DocTable({ title, rows, onOpen }) {
  return (
    <section className="crm-section crm-detail-card">
      <h2 className="crm-section-title">{title}</h2>
      <div className="crm-table-wrap">
        <table className="crm-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Updated</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="crm-empty">
                  None yet for this customer.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.refLabel || '—'}</td>
                  <td>{fmtDateIso(row.docDate)}</td>
                  <td className="crm-num">{fmtInr(row.summaryTotal)}</td>
                  <td>
                    <span
                      className={
                        'crm-status ' +
                        (row.status === 'sent' ? 'crm-status-sent' : '')
                      }
                    >
                      {row.status === 'sent' ? 'Sent' : 'Saved'}
                    </span>
                  </td>
                  <td>{fmtWhen(row.updatedAt)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-print crm-btn-sm"
                      onClick={() => onOpen(row.id)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
