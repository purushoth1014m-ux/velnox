import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { enquiryStatuses } from './enquiry-status.js';
import './index.css';

const endpoint = '/api/admin-enquiries';
const dateFormat = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata',
});
const labels = {
  name: 'Name', company: 'Company', email: 'Email', phone: 'Phone / WhatsApp',
  product: 'Product', quantity: 'Quantity', country: 'Destination',
  timing: 'Preferred timing', packaging: 'Preferred packaging', requirements: 'Additional requirements',
};
const statusColors = {
  new: 'bg-emerald-50 text-emerald-800',
  follow_up: 'bg-amber-50 text-amber-900',
  closed: 'bg-slate-100 text-slate-700',
};

async function readResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'The server could not complete the request.');
  return data;
}

function Admin() {
  const [signedIn, setSignedIn] = useState(false);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [rows, setRows] = useState([]);
  const [next, setNext] = useState(null);
  const [filters, setFilters] = useState({ q: '', status: '' });

  async function load({ before, query = filters, signal } = {}) {
    const params = new URLSearchParams();
    if (before) params.set('before', before);
    if (query.q) params.set('q', query.q);
    if (query.status) params.set('status', query.status);
    const response = await fetch(`${endpoint}?${params}`, { signal });
    if (response.status === 401) {
      setSignedIn(false);
      setRows([]);
      setNext(null);
      return;
    }
    const data = await readResponse(response);
    setSignedIn(true);
    setRows(previous => before ? [...previous, ...data.enquiries] : data.enquiries);
    setNext(data.next);
    setFilters(query);
  }

  useEffect(() => {
    const controller = new AbortController();
    load({signal: controller.signal}).catch(error => {
      if (!controller.signal.aborted) setMessage(error.message);
    }).finally(() => {
      if (!controller.signal.aborted) setBusy(false);
    });
    return () => controller.abort();
  }, []);

  async function run(action) {
    setBusy(true);
    setMessage('');
    setNotice('');
    try { await action(); }
    catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }

  function signIn(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const password = new FormData(form).get('password');
    form.reset();
    run(async () => {
      await readResponse(await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      }));
      await load();
    });
  }

  function signOut() {
    run(async () => {
      await readResponse(await fetch(endpoint, { method: 'DELETE' }));
      setSignedIn(false);
      setRows([]);
      setNext(null);
      setFilters({ q: '', status: '' });
    });
  }

  function search(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const query = { q: form.get('q').trim(), status: form.get('status') };
    run(() => load({ query }));
  }

  function changeStatus(id, previousStatus, status) {
    run(async () => {
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, previousStatus, status }),
      });
      if (response.status === 401) {
        setSignedIn(false);
        setRows([]);
        setNext(null);
        throw new Error('Your admin session expired. Sign in again.');
      }
      await readResponse(response);
      await load();
      setNotice(`Enquiry #${id} marked ${enquiryStatuses[status]}.`);
    });
  }

  return <main className="min-h-screen bg-[#f6f3e9] px-5 py-8 text-[#203b2a] sm:py-14">
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#203b2a]/20 pb-5">
        <a href="./index.html" className="text-sm font-semibold">Velnox Export</a>
        {signedIn && <button type="button" onClick={signOut} disabled={busy} className="rounded-full border px-4 py-2 text-sm">Sign out</button>}
      </div>
      <h1 className="my-7 text-3xl font-semibold sm:text-4xl">Enquiries</h1>
      {message && <p role="alert" className="mb-5 rounded-lg border border-red-700/30 bg-red-50 p-3 text-sm text-red-800">{message}</p>}
      {notice && <p role="status" className="mb-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
      {signedIn ? <>
        <form onSubmit={search} className="mb-5 grid gap-3 rounded-lg border border-[#203b2a]/15 bg-white p-4 sm:grid-cols-[1fr_10rem_auto] sm:items-end">
          <label className="grid gap-1 text-sm font-medium">Search enquiries
            <input name="q" type="search" defaultValue={filters.q} maxLength={180} placeholder="Name, email, product or reference" className="w-full rounded-lg border border-[#203b2a]/35 px-3 py-2 font-normal"/>
          </label>
          <label className="grid gap-1 text-sm font-medium">Status
            <select name="status" defaultValue={filters.status} className="w-full rounded-lg border border-[#203b2a]/35 px-3 py-2 font-normal">
              <option value="">All statuses</option>
              {Object.entries(enquiryStatuses).map(([value,label])=><option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <button type="submit" disabled={busy} className="rounded-full bg-[#234d31] px-4 py-2 text-sm text-white disabled:opacity-60">Apply</button>
        </form>
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="text-sm">Newest first · India time</p>
          <button type="button" onClick={() => run(() => load())} disabled={busy} className="rounded-full border px-4 py-2 text-sm">Refresh</button>
        </div>
        {!rows.length && <p className="rounded-lg bg-white p-5">{filters.q||filters.status?'No enquiries match your filters.':'No enquiries yet.'}</p>}
        <ul className="grid gap-4">
          {rows.map(({ id, createdAt, details, status, statusChangedAt }) => <li key={id} className="min-w-0 rounded-lg border border-[#203b2a]/15 bg-white p-5">
            <span className={`mb-3 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${statusColors[status]}`}>{enquiryStatuses[status]}</span>
            <details>
              <summary className="cursor-pointer break-words font-semibold">{details.product} · {details.name}</summary>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                {Object.entries(labels).map(([key, label]) => details[key] && <div key={key}>
                  <dt className="font-medium text-[#49644e]">{label}</dt>
                  <dd className="whitespace-pre-wrap break-words">{details[key]}</dd>
                </div>)}
              </dl>
            </details>
            <p className="mt-3 text-xs">Enquiry #{id} · <time dateTime={createdAt}>{dateFormat.format(new Date(createdAt))}</time></p>
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[#203b2a]/10 pt-3">
              <label htmlFor={`status-${id}`} className="text-sm font-medium">Update status<span className="sr-only"> for enquiry {id}</span></label>
              <select id={`status-${id}`} value={status} disabled={busy} onChange={event => changeStatus(id,status,event.target.value)} className="rounded-lg border border-[#203b2a]/35 px-2 py-1.5 text-sm disabled:opacity-60">
                {Object.entries(enquiryStatuses).map(([value,label])=><option key={value} value={value}>{label}</option>)}
              </select>
              {statusChangedAt&&<p className="text-xs">Updated <time dateTime={statusChangedAt}>{dateFormat.format(new Date(statusChangedAt))}</time></p>}
            </div>
          </li>)}
        </ul>
        {next && <button type="button" onClick={() => run(() => load({before:next}))} disabled={busy} className="mt-5 rounded-full border px-4 py-2 text-sm">Load older enquiries</button>}
      </> : <form onSubmit={signIn} className="grid max-w-sm gap-3 rounded-lg border border-[#203b2a]/15 bg-white p-5">
        <label htmlFor="admin-password" className="text-sm font-medium">Admin password</label>
        <input id="admin-password" name="password" autoComplete="current-password" type="password" required className="rounded-lg border border-[#203b2a]/35 px-3 py-2"/>
        <button type="submit" disabled={busy} className="rounded-full bg-[#234d31] px-4 py-2 text-white disabled:opacity-60">Sign in</button>
      </form>}
      {busy && <p role="status" className="mt-3 text-sm">Loading…</p>}
    </div>
  </main>;
}

createRoot(document.getElementById('root')).render(<Admin/>);
