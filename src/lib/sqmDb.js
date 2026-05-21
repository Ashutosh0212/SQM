import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db } from './firebase.js';
import { poSummary, quotSummary } from './sqmSummaries.js';
import {
  SQM_CLIENTS,
  SQM_PURCHASE_ORDERS,
  SQM_QUOTATIONS,
} from './sqmCollections.js';

function uid() {
  const u = auth.currentUser?.uid;
  if (!u) throw new Error('Not signed in');
  return u;
}

export function clientIdFromParty({ name = '', place = '' } = {}) {
  const nameLine = String(name).trim().split(/\r?\n/)[0].trim();
  const placeLine = String(place).trim().split(/\r?\n/)[0].trim();
  const label = [nameLine, placeLine]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  const slug = label
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 72);
  return slug || 'unnamed_client';
}

/** @param {{ name?: string; place?: string; mobile?: string; gstin?: string; address?: string; placeOfSupply?: string }} client */
export async function upsertSqmClient(client) {
  const id = clientIdFromParty(client);
  const ref = doc(db, SQM_CLIENTS, id);
  await setDoc(
    ref,
    {
      displayName: String(client.name ?? '').trim(),
      place: String(client.place ?? client.address ?? '').trim(),
      mobile: String(client.mobile ?? '').trim(),
      gstin: String(client.gstin ?? '').trim(),
      placeOfSupply: String(client.placeOfSupply ?? '').trim(),
      updatedAt: serverTimestamp(),
      updatedBy: uid(),
    },
    { merge: true }
  );
  return id;
}

function stripUndefined(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export async function saveSqmQuotation(quotState, existingDocId = null) {
  const clientId = await upsertSqmClient({
    name: quotState.meta?.clientName,
    place: quotState.meta?.place,
  });
  const docId =
    existingDocId ||
    `q_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const ref = doc(db, SQM_QUOTATIONS, docId);
  const payload = stripUndefined(quotState);
  const clientLabel =
    [payload.meta?.clientName, payload.meta?.place]
      .map((s) => String(s || '').trim())
      .filter(Boolean)
      .join(' — ') || 'Unnamed client';

  const summary = quotSummary(quotState);
  await setDoc(
    ref,
    {
      type: 'quotation',
      clientId,
      clientLabel,
      payload,
      ...summary,
      status: 'saved',
      updatedAt: serverTimestamp(),
      updatedBy: uid(),
      createdBy: uid(),
    },
    { merge: true }
  );
  return { docId, clientId };
}

export async function saveSqmPurchaseOrder(poState, existingDocId = null) {
  const p = poState.partyDetails || {};
  const clientId = await upsertSqmClient({
    name: p.name,
    place: p.address,
    mobile: p.mobile,
    gstin: p.gstin,
    placeOfSupply: p.placeOfSupply,
  });
  const docId =
    existingDocId ||
    `po_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const ref = doc(db, SQM_PURCHASE_ORDERS, docId);
  const payload = stripUndefined(poState);
  const clientLabel =
    String(p.name || '').trim() || 'Unnamed party';

  const summary = poSummary(poState);
  await setDoc(
    ref,
    {
      type: 'purchase_order',
      clientId,
      clientLabel,
      payload,
      ...summary,
      status: 'saved',
      updatedAt: serverTimestamp(),
      updatedBy: uid(),
      createdBy: uid(),
    },
    { merge: true }
  );
  return { docId, clientId };
}

export async function markSqmQuotationSent(docId) {
  await updateDoc(doc(db, SQM_QUOTATIONS, docId), {
    status: 'sent',
    sentAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function markSqmPurchaseOrderSent(docId) {
  await updateDoc(doc(db, SQM_PURCHASE_ORDERS, docId), {
    status: 'sent',
    sentAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

function mapDocRow(d, docKind) {
  const data = d.data();
  return {
    id: d.id,
    kind: docKind,
    clientLabel: data.clientLabel || '—',
    clientId: data.clientId || '',
    updatedAt: data.updatedAt?.toDate?.() ?? null,
    sentAt: data.sentAt?.toDate?.() ?? null,
    status: data.status || 'saved',
    summaryTotal: data.summaryTotal ?? null,
    docDate: data.docDate || '',
    refLabel: data.refLabel || '',
  };
}

/** @param {string} coll */
async function listRecent(coll, docKind, max = 80) {
  const q = query(
    collection(db, coll),
    orderBy('updatedAt', 'desc'),
    limit(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapDocRow(d, docKind));
}

export function listSqmQuotations(max = 80) {
  return listRecent(SQM_QUOTATIONS, 'quotation', max);
}

export function listSqmPurchaseOrders(max = 80) {
  return listRecent(SQM_PURCHASE_ORDERS, 'purchase_order', max);
}

export async function fetchSqmDashboard() {
  const [clients, quotations, purchaseOrders] = await Promise.all([
    listSqmClients(120),
    listSqmQuotations(80),
    listSqmPurchaseOrders(80),
  ]);
  const activity = [...quotations, ...purchaseOrders].sort(
    (a, b) => (b.updatedAt?.getTime?.() ?? 0) - (a.updatedAt?.getTime?.() ?? 0)
  );
  return { clients, quotations, purchaseOrders, activity };
}

export async function getSqmClient(clientId) {
  const snap = await getDoc(doc(db, SQM_CLIENTS, clientId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function updateSqmClient(clientId, patch) {
  await setDoc(
    doc(db, SQM_CLIENTS, clientId),
    {
      ...patch,
      updatedAt: serverTimestamp(),
      updatedBy: uid(),
    },
    { merge: true }
  );
}

export function filterDocsForClient(docs, clientId) {
  return docs.filter((d) => d.clientId === clientId);
}

export async function loadSqmQuotation(docId) {
  const snap = await getDoc(doc(db, SQM_QUOTATIONS, docId));
  if (!snap.exists()) throw new Error('Quotation not found');
  return { id: snap.id, ...snap.data() };
}

export async function loadSqmPurchaseOrder(docId) {
  const snap = await getDoc(doc(db, SQM_PURCHASE_ORDERS, docId));
  if (!snap.exists()) throw new Error('Purchase order not found');
  return { id: snap.id, ...snap.data() };
}

export async function listSqmClients(max = 120) {
  const q = query(
    collection(db, SQM_CLIENTS),
    orderBy('updatedAt', 'desc'),
    limit(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
