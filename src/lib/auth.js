/** Firebase staff email — must match isAdmin() bootstrap in firestore.rules */
export const FIREBASE_STAFF_EMAIL = 'admin@gmail.com';

export const LOGIN_SESSION_KEY = 'shivatronics_quote_auth_ok';
export const LOGIN_SALT = 'shivatronics-quotation-login-v2026';
export const EXPECTED_LOGIN_SHA256 =
  'fd43680b08c328b856851ffd56432ac7dcdd96395d79e7dfebb5fa08d202d644';

function hexFromBuffer(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => ('0' + b.toString(16)).slice(-2))
    .join('');
}

export function hashCredential(user, password) {
  const msg =
    LOGIN_SALT + '\n' + String(user || '').trim().toLowerCase() + '\n' + password;
  return crypto.subtle
    .digest('SHA-256', new TextEncoder().encode(msg))
    .then(hexFromBuffer);
}
