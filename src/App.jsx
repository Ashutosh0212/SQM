import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { AppNav } from './components/AppNav.jsx';
import { CustomersPanel } from './components/CustomersPanel.jsx';
import { EditorSidebar } from './components/EditorSidebar.jsx';
import { HomePanel } from './components/HomePanel.jsx';
import { LoginScreen } from './components/LoginScreen.jsx';
import { PoDocument } from './components/PoDocument.jsx';
import { PoEditorSidebar } from './components/PoEditorSidebar.jsx';
import { QuotDocument } from './components/QuotDocument.jsx';
import { firebaseSignOut, subscribeAuth } from './lib/firebaseAuth.js';
import { buildPoPdfBlob, buildQuotationPdfBlob } from './lib/pdf.js';
import { buildPoShareSummary, poPdfStem } from './lib/poShare.js';
import {
  buildShareSummaryFromState,
  quotationPdfStem,
} from './lib/share.js';
import {
  loadSqmPurchaseOrder,
  loadSqmQuotation,
  markSqmPurchaseOrderSent,
  markSqmQuotationSent,
  saveSqmPurchaseOrder,
  saveSqmQuotation,
} from './lib/sqmDb.js';
import { normalizePoState, normalizeQuotState } from './lib/sqmNormalize.js';
import { createInitialPoState, poReducer } from './purchase-order/state.js';
import { createInitialState, quotationReducer } from './quotation/state.js';

/** @typedef {'home' | 'customers' | 'quotation' | 'po'} MainView */

const AUTOSAVE_MS = 45000;

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [mainView, setMainView] = useState(/** @type {MainView} */ ('home'));
  const [quotState, quotDispatch] = useReducer(
    quotationReducer,
    undefined,
    createInitialState
  );
  const [poState, poDispatch] = useReducer(
    poReducer,
    undefined,
    createInitialPoState
  );
  const [quotCloudId, setQuotCloudId] = useState(null);
  const [poCloudId, setPoCloudId] = useState(null);
  const [dashboardKey, setDashboardKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const quotPageRef = useRef(null);
  const poPageRef = useRef(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((msg, kind = 'ok') => {
    setToast({ msg, kind });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  const bumpDashboard = useCallback(() => {
    setDashboardKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const unsub = subscribeAuth((user) => {
      setAuthed(!!user);
      setAuthReady(true);
    });
    return unsub;
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    const onBeforePrint = () => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    };
    window.addEventListener('beforeprint', onBeforePrint);
    return () => window.removeEventListener('beforeprint', onBeforePrint);
  }, []);

  const saveQuotationCloud = useCallback(async () => {
    const { docId } = await saveSqmQuotation(quotState, quotCloudId);
    setQuotCloudId(docId);
    bumpDashboard();
    return docId;
  }, [quotState, quotCloudId, bumpDashboard]);

  const savePoCloud = useCallback(async () => {
    const { docId } = await saveSqmPurchaseOrder(poState, poCloudId);
    setPoCloudId(docId);
    bumpDashboard();
    return docId;
  }, [poState, poCloudId, bumpDashboard]);

  useEffect(() => {
    if (!authed || mainView !== 'quotation') return undefined;
    const t = setInterval(() => {
      saveSqmQuotation(quotState, quotCloudId)
        .then(({ docId }) => {
          setQuotCloudId(docId);
          bumpDashboard();
        })
        .catch((e) => console.warn('Autosave quotation', e));
    }, AUTOSAVE_MS);
    return () => clearInterval(t);
  }, [authed, mainView, quotState, quotCloudId, bumpDashboard]);

  useEffect(() => {
    if (!authed || mainView !== 'po') return undefined;
    const t = setInterval(() => {
      saveSqmPurchaseOrder(poState, poCloudId)
        .then(({ docId }) => {
          setPoCloudId(docId);
          bumpDashboard();
        })
        .catch((e) => console.warn('Autosave PO', e));
    }, AUTOSAVE_MS);
    return () => clearInterval(t);
  }, [authed, mainView, poState, poCloudId, bumpDashboard]);

  async function signOut() {
    try {
      await firebaseSignOut();
    } catch (e) {
      console.warn(e);
    }
    setQuotCloudId(null);
    setPoCloudId(null);
    setAuthed(false);
  }

  function handleQuotReset() {
    if (
      window.confirm(
        'Reset the quotation to a fresh template? This clears all fields and tables.'
      )
    ) {
      quotDispatch({ type: 'CLEAR' });
      setQuotCloudId(null);
    }
  }

  function handlePoReset() {
    if (
      window.confirm(
        'Reset the purchase order to a fresh template? This clears all fields.'
      )
    ) {
      poDispatch({ type: 'CLEAR' });
      setPoCloudId(null);
    }
  }

  async function openDocument(kind, docId) {
    try {
      if (kind === 'quotation') {
        const rec = await loadSqmQuotation(docId);
        quotDispatch({ type: 'LOAD', payload: normalizeQuotState(rec.payload) });
        setQuotCloudId(docId);
        setMainView('quotation');
      } else {
        const rec = await loadSqmPurchaseOrder(docId);
        poDispatch({ type: 'LOAD', payload: normalizePoState(rec.payload) });
        setPoCloudId(docId);
        setMainView('po');
      }
      showToast('Document opened.');
    } catch (e) {
      console.error(e);
      showToast('Could not open document.', 'err');
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (mainView === 'po') {
        await savePoCloud();
        showToast('Purchase order saved.');
      } else {
        await saveQuotationCloud();
        showToast('Quotation saved.');
      }
    } catch (e) {
      console.error(e);
      const msg =
        e?.code === 'permission-denied'
          ? 'Permission denied — check sign-in and Firestore rules.'
          : e?.message || 'Save failed.';
      showToast(msg, 'err');
    } finally {
      setSaving(false);
    }
  }

  async function handleShare() {
    const isPo = mainView === 'po';
    const text = isPo
      ? buildPoShareSummary(poState)
      : buildShareSummaryFromState(quotState);
    const stem = isPo ? poPdfStem(poState) : quotationPdfStem(quotState);
    const pageRef = isPo ? poPageRef : quotPageRef;
    const buildPdf = isPo ? buildPoPdfBlob : buildQuotationPdfBlob;
    const title = isPo ? 'Shivatronics purchase order' : 'Shivatronics quotation';

    let shared = false;
    try {
      const blob = await buildPdf(pageRef.current);
      const file = new File([blob], `${stem}.pdf`, {
        type: 'application/pdf',
      });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title, text });
        shared = true;
      }
    } catch (e) {
      if (e?.name === 'AbortError') return;
      console.warn(e);
    }
    if (!shared) {
      try {
        if (navigator.share) {
          await navigator.share({ title, text });
          shared = true;
        }
      } catch (e) {
        if (e?.name === 'AbortError') return;
        console.warn(e);
      }
    }
    if (!shared) {
      try {
        await navigator.clipboard.writeText(text);
        showToast('Copied summary to clipboard.');
      } catch (e) {
        showToast('Share and clipboard unavailable.', 'err');
        return;
      }
    } else {
      showToast('Shared.');
    }

    try {
      const docId = isPo ? await savePoCloud() : await saveQuotationCloud();
      if (isPo) await markSqmPurchaseOrderSent(docId);
      else await markSqmQuotationSent(docId);
      bumpDashboard();
    } catch (e) {
      console.warn('Post-share save', e);
    }
  }

  if (!authReady) {
    return (
      <div id="login-screen">
        <div className="login-card">
          <p className="login-sub">Connecting…</p>
        </div>
      </div>
    );
  }

  if (!authed) {
    return <LoginScreen />;
  }

  const toastClass = toast
    ? `show ${toast.kind === 'err' ? 'err' : 'ok'}`
    : '';

  const isBuilder = mainView === 'quotation' || mainView === 'po';
  const previewLabel =
    mainView === 'po' ? 'Purchase order preview' : 'Quotation preview';

  return (
    <>
      <div className="app-shell">
        <AppNav
          mainView={mainView}
          onNavigate={setMainView}
          onSignOut={signOut}
        />
        <div
          className={
            'app-body' + (isBuilder ? '' : ' app-body--crm')
          }
        >
          {mainView === 'home' ? (
            <HomePanel
              key={dashboardKey}
              onOpenDocument={openDocument}
              onNavigate={setMainView}
              showToast={showToast}
            />
          ) : null}
          {mainView === 'customers' ? (
            <CustomersPanel
              key={dashboardKey}
              showToast={showToast}
              onOpenQuotation={(payload, docId) => {
                quotDispatch({ type: 'LOAD', payload });
                setQuotCloudId(docId ?? null);
                setMainView('quotation');
              }}
              onOpenPurchaseOrder={(payload, docId) => {
                poDispatch({ type: 'LOAD', payload });
                setPoCloudId(docId ?? null);
                setMainView('po');
              }}
              onNewQuotationForClient={(_client, payload) => {
                quotDispatch({ type: 'LOAD', payload });
                setQuotCloudId(null);
                setMainView('quotation');
              }}
              onNewPoForClient={(_client, payload) => {
                poDispatch({ type: 'LOAD', payload });
                setPoCloudId(null);
                setMainView('po');
              }}
            />
          ) : null}
          {isBuilder ? (
            <>
              <aside className="panel-left">
                {mainView === 'quotation' ? (
                  <EditorSidebar
                    meta={quotState.meta}
                    dispatch={quotDispatch}
                    onReset={handleQuotReset}
                  />
                ) : (
                  <PoEditorSidebar
                    state={poState}
                    dispatch={poDispatch}
                    onReset={handlePoReset}
                  />
                )}
              </aside>
              <div className="panel-right">
                <div className="panel-right-toolbar">
                  <span>{previewLabel}</span>
                  <span className="toolbar-spacer" />
                  <button
                    type="button"
                    className="btn btn-login"
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.72rem' }}
                    disabled={saving}
                    onClick={handleSave}
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-share"
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.72rem' }}
                    onClick={handleShare}
                  >
                    Share
                  </button>
                  <button
                    type="button"
                    className="btn btn-print"
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.72rem' }}
                    onClick={() => window.print()}
                  >
                    &#128438; Print
                  </button>
                </div>
                <div className="live-preview-wrap" id="page-wrapper">
                  {mainView === 'quotation' ? (
                    <QuotDocument
                      ref={quotPageRef}
                      state={quotState}
                      dispatch={quotDispatch}
                    />
                  ) : (
                    <PoDocument
                      ref={poPageRef}
                      state={poState}
                      dispatch={poDispatch}
                    />
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
      <div
        id="app-toast"
        className={toast ? toastClass : ''}
        role="status"
        aria-live="polite"
      >
        {toast?.msg}
      </div>
    </>
  );
}
