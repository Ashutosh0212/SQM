import { useState } from 'react';
import { staffSignIn } from '../lib/firebaseAuth.js';

export function LoginScreen() {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(ev) {
    ev.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await staffSignIn(user, pass);
    } catch (e) {
      console.error(e);
      const code = e?.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
        setErr('Invalid user ID or password.');
      } else if (code === 'auth/too-many-requests') {
        setErr('Too many attempts. Try again later.');
      } else if (code === 'auth/network-request-failed') {
        setErr('Network error. Check your connection.');
      } else {
        setErr(e?.message || 'Sign-in failed.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div id="login-screen">
      <div className="login-card">
        <h2>Shivatronics</h2>
        <p className="login-sub">Sign in to open the quotation and purchase order builder.</p>
        <form id="login-form" onSubmit={onSubmit}>
          <label>
            User ID
            <input
              type="text"
              name="login-user"
              autoComplete="username"
              autoCapitalize="off"
              spellCheck={false}
              required
              value={user}
              onChange={(e) => setUser(e.target.value)}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              name="login-pass"
              autoComplete="current-password"
              required
              value={pass}
              onChange={(e) => setPass(e.target.value)}
            />
          </label>
          <p id="login-err">{err}</p>
          <button
            type="submit"
            className="btn btn-submit btn-login"
            disabled={busy}
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="login-note">
          Cloud save uses your existing Firebase staff account. User ID must be{' '}
          <strong>admin</strong>; use the same password as in Firebase Authentication
          for <strong>admin@gmail.com</strong>.
        </p>
      </div>
    </div>
  );
}
