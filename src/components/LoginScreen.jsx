import { useState } from 'react';
import {
  EXPECTED_LOGIN_SHA256,
  hashCredential,
  LOGIN_SESSION_KEY,
} from '../lib/auth.js';

export function LoginScreen({ onAuthenticated }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');

  async function onSubmit(ev) {
    ev.preventDefault();
    setErr('');
    try {
      const hex = await hashCredential(user, pass);
      if (hex === EXPECTED_LOGIN_SHA256) {
        try {
          sessionStorage.setItem(LOGIN_SESSION_KEY, '1');
        } catch {
          /* ignore */
        }
        onAuthenticated();
      } else {
        setErr('Invalid user ID or password.');
      }
    } catch (e) {
      setErr('Sign-in unavailable in this browser.');
      console.error(e);
    }
  }

  return (
    <div id="login-screen">
      <div className="login-card">
        <h2>Shivatronics</h2>
        <p className="login-sub">Sign in to open the quotation builder.</p>
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
          <button type="submit" className="btn btn-submit btn-login">
            Sign in
          </button>
        </form>
        <p className="login-note">
          Purely client-side unlock: use a strong password and replace the
          login hash before publishing.
        </p>
      </div>
    </div>
  );
}
