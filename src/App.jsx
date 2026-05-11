import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { EditorSidebar } from './components/EditorSidebar.jsx';
import { LoginScreen } from './components/LoginScreen.jsx';
import { QuotDocument } from './components/QuotDocument.jsx';
import { LOGIN_SESSION_KEY } from './lib/auth.js';
import { buildQuotationPdfBlob } from './lib/pdf.js';
import {
  buildShareSummaryFromState,
  quotationPdfStem,
} from './lib/share.js';
import { createInitialState, quotationReducer } from './quotation/state.js';

function readAuthed() {
  try {
    return sessionStorage.getItem(LOGIN_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export default function App() {
  const [authed, setAuthed] = useState(readAuthed);
  const [state, dispatch] = useReducer(
    quotationReducer,
    undefined,
    createInitialState
  );
  const pageRef = useRef(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((msg, kind = 'ok') => {
    setToast({ msg, kind });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  function signOut() {
    try {
      sessionStorage.removeItem(LOGIN_SESSION_KEY);
    } catch {
      /* ignore */
    }
    setAuthed(false);
  }

  function handleReset() {
    if (
      window.confirm(
        'Reset the quotation to a fresh template? This clears all fields and tables.'
      )
    ) {
      dispatch({ type: 'CLEAR' });
    }
  }

  async function handleShare() {
    const text = buildShareSummaryFromState(state);
    const stem = quotationPdfStem(state);
    try {
      const blob = await buildQuotationPdfBlob(pageRef.current);
      const file = new File([blob], `${stem}.pdf`, {
        type: 'application/pdf',
      });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Shivatronics quotation',
          text,
        });
        showToast('Shared.');
        return;
      }
    } catch (e) {
      if (e?.name === 'AbortError') return;
      console.warn(e);
    }
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Shivatronics quotation', text });
        showToast('Summary shared (PDF not attached on this device).');
        return;
      }
    } catch (e) {
      if (e?.name === 'AbortError') return;
      console.warn(e);
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied summary to clipboard.');
    } catch (e) {
      console.error(e);
      showToast('Share and clipboard unavailable.', 'err');
    }
  }

  if (!authed) {
    return <LoginScreen onAuthenticated={() => setAuthed(true)} />;
  }

  const toastClass = toast
    ? `show ${toast.kind === 'err' ? 'err' : 'ok'}`
    : '';

  return (
    <>
      <div className="app-shell">
        <aside className="panel-left">
          <EditorSidebar
            meta={state.meta}
            dispatch={dispatch}
            onReset={handleReset}
            onSignOut={signOut}
          />
        </aside>
        <div className="panel-right">
          <div className="panel-right-toolbar">
            <span>Live preview</span>
            <span className="toolbar-spacer" />
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
            <QuotDocument ref={pageRef} state={state} dispatch={dispatch} />
          </div>
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
