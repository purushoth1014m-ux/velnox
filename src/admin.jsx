import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
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

async function readResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'The server could not complete the request.');
  return data;
}

function Admin() {
  const [signedIn, setSignedIn] = useState(false);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState('');
  const [rows, setRows] = useState([]);
  const [next, setNext] = useState(null);

  async function load(before = null, signal) {
    const response = await fetch(before ? `${endpoint}?before=${encodeURIComponent(before)}` : endpoint, { signal });
    if (response.status === 401) {
      setSignedIn(false);
      setRows([]);
      return;
    }
    const data = await readResponse(response);
    setSignedIn(true);
    setRows(previous => before ? [...previous, ...data.enquiries] : data.enquiries);
    setNext(data.next);
  }

  useEffect(() => {
    const controller = new AbortController();
    load(null, controller.signal).catch(error => {
      if (!controller.signal.aborted) setMessage(error.message);
    }).finally(() => {
      if (!controller.signal.aborted) setBusy(false);
    });
    return () => controller.abort();
  }, []);

  async function run(action) {
    setBusy(true);
    setMessage('');
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
      {signedIn ? <>
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="text-sm">Newest first · India time</p>
          <button type="button" onClick={() => run(() => load())} disabled={busy} className="rounded-full border px-4 py-2 text-sm">Refresh</button>
        </div>
        {!rows.length && <p className="rounded-lg bg-white p-5">No enquiries yet.</p>}
        <ul className="grid gap-4">
          {rows.map(({ id, createdAt, details }) => <li key={id} className="min-w-0 rounded-lg border border-[#203b2a]/15 bg-white p-5">
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
          </li>)}
        </ul>
        {next && <button type="button" onClick={() => run(() => load(next))} disabled={busy} className="mt-5 rounded-full border px-4 py-2 text-sm">Load older enquiries</button>}
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
