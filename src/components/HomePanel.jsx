import { useCallback, useEffect, useState } from 'react';
import { fetchSqmDashboard } from '../lib/sqmDb.js';
import { fmtDateIso, fmtInr, fmtWhen } from '../lib/formatUi.js';

export function HomePanel({ onOpenDocument, onNavigate, showToast }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const dash = await fetchSqmDashboard();
      setData(dash);
    } catch (e) {
      console.error(e);
      showToast('Could not load dashboard.', 'err');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const clients = data?.clients ?? [];
  const quotations = data?.quotations ?? [];
  const pos = data?.purchaseOrders ?? [];
  const activity = data?.activity ?? [];
  const sentCount =
    quotations.filter((q) => q.status === 'sent').length +
    pos.filter((p) => p.status === 'sent').length;

  return (
    <div className="crm-page">
      <div className="crm-page-head">
        <div>
          <h1 className="crm-page-title">Home</h1>
          <p className="crm-page-sub">
            Overview of clients, quotations, and purchase orders saved to the cloud.
          </p>
        </div>
        <button type="button" className="btn btn-print" onClick={refresh} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="crm-stat-grid">
        <div className="crm-stat-card">
          <span className="crm-stat-label">Clients</span>
          <span className="crm-stat-value">{clients.length}</span>
        </div>
        <div className="crm-stat-card">
          <span className="crm-stat-label">Quotations</span>
          <span className="crm-stat-value">{quotations.length}</span>
        </div>
        <div className="crm-stat-card">
          <span className="crm-stat-label">Purchase orders</span>
          <span className="crm-stat-value">{pos.length}</span>
        </div>
        <div className="crm-stat-card crm-stat-accent">
          <span className="crm-stat-label">Sent / shared</span>
          <span className="crm-stat-value">{sentCount}</span>
        </div>
      </div>

      <div className="crm-quick-actions">
        <button type="button" className="btn btn-add" onClick={() => onNavigate('quotation')}>
          + New quotation
        </button>
        <button type="button" className="btn btn-add" onClick={() => onNavigate('po')}>
          + New purchase order
        </button>
        <button type="button" className="btn btn-print" onClick={() => onNavigate('customers')}>
          Manage customers
        </button>
      </div>

      <section className="crm-section">
        <h2 className="crm-section-title">Recent activity</h2>
        <div className="crm-table-wrap">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Client / party</th>
                <th>Reference</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Updated</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="crm-empty">
                    Loading…
                  </td>
                </tr>
              ) : activity.length === 0 ? (
                <tr>
                  <td colSpan={8} className="crm-empty">
                    No saved documents yet. Create a quotation or purchase order and use
                    Save to cloud.
                  </td>
                </tr>
              ) : (
                activity.slice(0, 25).map((row) => (
                  <tr key={`${row.kind}-${row.id}`}>
                    <td>
                      <span
                        className={
                          'crm-badge ' +
                          (row.kind === 'quotation' ? 'crm-badge-q' : 'crm-badge-po')
                        }
                      >
                        {row.kind === 'quotation' ? 'Quotation' : 'PO'}
                      </span>
                    </td>
                    <td>{row.clientLabel}</td>
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
                        onClick={() => onOpenDocument(row.kind, row.id)}
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="crm-section">
        <h2 className="crm-section-title">Clients (latest)</h2>
        <div className="crm-table-wrap">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Place</th>
                <th>Mobile</th>
                <th>GSTIN</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="crm-empty">
                    Clients appear when you save a quotation or purchase order.
                  </td>
                </tr>
              ) : (
                clients.slice(0, 12).map((c) => (
                  <tr key={c.id}>
                    <td>{c.displayName || '—'}</td>
                    <td className="crm-cell-pre">{c.place || '—'}</td>
                    <td>{c.mobile || '—'}</td>
                    <td>{c.gstin || '—'}</td>
                    <td>
                      {fmtWhen(
                        c.updatedAt?.toDate?.() ?? c.updatedAt ?? null
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
