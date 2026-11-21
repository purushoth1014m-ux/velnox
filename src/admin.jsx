import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowDownRight, ArrowUpRight, Inbox, LogOut, PackagePlus, Truck } from 'lucide-react';
import { AdminShipments } from './AdminShipments.jsx';
import { readResponse } from './admin-api.js';
import { enquiryStatuses } from './enquiry-status.js';
import './index.css';
import './admin.css';

const endpoint = '/api/admin-enquiries';
const dateFormat = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata',
});
const formatDate = date => dateFormat.format(new Date(date));
const labels = {
  name: 'Name', company: 'Company', email: 'Email', phone: 'Phone / WhatsApp',
  product: 'Product', quantity: 'Quantity', country: 'Destination',
  timing: 'Preferred timing', packaging: 'Preferred packaging', requirements: 'Additional requirements',
};

function Admin() {
  const [signedIn, setSignedIn] = useState(false);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [rows, setRows] = useState([]);
  const [next, setNext] = useState(null);
  const [filters, setFilters] = useState({ q: '', status: '' });
  const [tab, setTab] = useState('enquiries');
  const [shipmentEnquiry, setShipmentEnquiry] = useState(null);

  function onSessionExpired() {
    setSignedIn(false);
    setRows([]);
    setNext(null);
    setMessage('Your admin session expired. Sign in again.');
  }

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
      setTab('enquiries');
      setShipmentEnquiry(null);
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
        onSessionExpired();
        return;
      }
      await readResponse(response);
      await load();
      setNotice(`Enquiry #${id} marked ${enquiryStatuses[status]}.`);
    });
  }

  return <div className="admin-shell">
    <header className="admin-header">
      <a href="./index.html" className="admin-brand">
        <img src="./images/velnox-export-logo.png" alt="Velnox Export" width="62" height="62"/>
        <span>Export operations</span>
      </a>
      <div className="admin-actions">
        <a href="./index.html" className="admin-button admin-site-link">View site <ArrowUpRight size={15}/></a>
        {signedIn && <button type="button" onClick={signOut} disabled={busy} className="admin-button"><LogOut size={15}/> Sign out</button>}
      </div>
    </header>
    {signedIn && <nav aria-label="Admin sections" className="admin-nav">
      <button type="button" aria-current={tab==='enquiries'?'page':undefined} onClick={() => setTab('enquiries')}><Inbox size={17}/> Enquiries</button>
      <button type="button" aria-current={tab==='shipments'?'page':undefined} onClick={() => {if(tab!=='shipments')setShipmentEnquiry(null);setTab('shipments')}}><Truck size={18}/> Shipments</button>
    </nav>}
    <main className="admin-main">
      {signedIn && tab==='shipments' ? <AdminShipments enquiryId={shipmentEnquiry} formatDate={formatDate} onSessionExpired={onSessionExpired}/> :
      <div className={signedIn?'admin-workspace':'admin-login'}>
      <div className="admin-heading">
        <div><h1>{signedIn?'Enquiries':'Admin sign-in'}</h1><p>{signedIn?'Review buyer requests and manage follow-ups.':'Sign in to manage enquiries and shipments.'}</p></div>
        {signedIn && <button type="button" onClick={() => run(() => load())} disabled={busy} className="admin-button">Refresh</button>}
      </div>
      {message && <p role="alert" className="admin-feedback admin-error">{message}</p>}
      {notice && <p role="status" className="admin-feedback">{notice}</p>}
      {signedIn ? <>
        <form onSubmit={search} className="admin-panel admin-toolbar admin-enquiry-filters">
          <label>Search enquiries
            <input name="q" type="search" defaultValue={filters.q} maxLength={180} placeholder="Name, email, product or reference"/>
          </label>
          <label>Status
            <select name="status" defaultValue={filters.status}>
              <option value="">All statuses</option>
              {Object.entries(enquiryStatuses).map(([value,label])=><option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <button type="submit" disabled={busy} className="admin-button admin-primary">Apply filters</button>
        </form>
        <p className="admin-meta">Newest first · India time</p>
        {!busy && !rows.length && <div className="admin-panel admin-empty"><Inbox size={25}/><p>{filters.q||filters.status?'No enquiries match your filters.':'No enquiries yet.'}</p></div>}
        <ul className="admin-list">
          {rows.map(({ id, createdAt, details, status, statusChangedAt }) => <li key={id} className="admin-panel admin-record">
            <div className="admin-record-head">
              <span className="admin-meta">Enquiry #{id} · <time dateTime={createdAt}>{formatDate(createdAt)}</time></span>
              <span className={`admin-badge status-${status}`}>{enquiryStatuses[status]}</span>
            </div>
            <details>
              <summary>{details.product} · {details.name}</summary>
              <dl className="admin-details">
                {Object.entries(labels).map(([key, label]) => details[key] && <div key={key}>
                  <dt>{label}</dt>
                  <dd>{details[key]}</dd>
                </div>)}
              </dl>
            </details>
            <div className="admin-record-footer">
              <label className="admin-inline" htmlFor={`status-${id}`}>Update status<span className="sr-only"> for enquiry {id}</span>
              <select id={`status-${id}`} value={status} disabled={busy} onChange={event => changeStatus(id,status,event.target.value)}>
                {Object.entries(enquiryStatuses).map(([value,label])=><option key={value} value={value}>{label}</option>)}
              </select></label>
              {statusChangedAt&&<p>Updated <time dateTime={statusChangedAt}>{formatDate(statusChangedAt)}</time></p>}
              <button type="button" className="admin-button admin-link-shipment" onClick={() => {setShipmentEnquiry(id);setTab('shipments')}} disabled={busy}><PackagePlus size={16}/> Add shipment</button>
            </div>
          </li>)}
        </ul>
        {next && <button type="button" onClick={() => run(() => load({before:next}))} disabled={busy} className="admin-button">Load older enquiries <ArrowDownRight size={15}/></button>}
      </> : <form onSubmit={signIn} className="admin-panel admin-login-form">
        <label>Admin password<input name="password" autoComplete="current-password" type="password" required/></label>
        <button type="submit" disabled={busy} className="admin-button admin-primary">Sign in</button>
      </form>}
      {busy && <p role="status" className="admin-meta">Loading…</p>}
      </div>}
    </main>
  </div>;
}

createRoot(document.getElementById('root')).render(<Admin/>);
