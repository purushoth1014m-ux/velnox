import React, { useEffect, useRef, useState } from 'react';
import { ArrowDownRight, ArrowRight, ArrowUpRight, PackagePlus, Pencil, Truck } from 'lucide-react';
import { readResponse } from './admin-api.js';
import { shipmentStatuses } from './shipment-status.js';

const endpoint = '/api/admin-shipments';
const fields = [
  ['origin','Origin country',100,true], ['destination','Destination country',100,true],
  ['carrier','Carrier',120], ['trackingNumber','Tracking number / bill of lading',120],
  ['trackingUrl','Carrier tracking URL',1500],
];

export function AdminShipments({ enquiryId, formatDate, onSessionExpired }) {
  const [rows, setRows] = useState([]);
  const [next, setNext] = useState(null);
  const [filter, setFilter] = useState('');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editor, setEditor] = useState(enquiryId ? { enquiryId } : null);
  const submission = useRef(null);
  const editorRef = useRef(null);

  async function load(status = filter, before, signal) {
    const params = new URLSearchParams();
    if (status) params.set('status',status);
    if (before) params.set('before',before);
    const data = await readResponse(await fetch(`${endpoint}?${params}`, { signal }));
    setRows(previous => before ? [...previous,...data.shipments] : data.shipments);
    setNext(data.next);
    setFilter(status);
  }

  function report(error) {
    if (error.status === 401) onSessionExpired();
    else setError(error.message);
  }

  useEffect(() => {
    const controller = new AbortController();
    load('', undefined, controller.signal).catch(error => {
      if (!controller.signal.aborted) report(error);
    }).finally(() => {
      if (!controller.signal.aborted) setBusy(false);
    });
    return () => controller.abort();
  }, []);

  async function run(action) {
    setBusy(true);
    setError('');
    setNotice('');
    try { await action(); }
    catch (error) { report(error); }
    finally { setBusy(false); }
  }

  function openEditor(shipment) {
    submission.current = null;
    setError('');
    setNotice('');
    setEditor(shipment);
  }

  useEffect(() => {
    if (!editor) return;
    editorRef.current?.scrollIntoView({ block:'nearest' });
    editorRef.current?.querySelector('input')?.focus({ preventScroll:true });
  }, [editor]);

  function save(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const editing = Boolean(editor.id);
    if (!editing) submission.current ??= crypto.randomUUID();
    const body = editing ? { ...values, id: editor.id, version: editor.version }
      : { ...values, submissionId: submission.current };
    run(async () => {
      const saved = await readResponse(await fetch(endpoint, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify(body),
      }));
      setEditor(null);
      setNotice(`Shipment #${saved.id} saved.`);
      await load();
    });
  }

  return <div className="admin-workspace">
    <div className="admin-heading">
      <div><h1>Shipments</h1><p>Track routes, customs progress and deliveries.</p></div>
      <button type="button" className="admin-button admin-primary" onClick={() => openEditor({})} disabled={busy}><PackagePlus size={17}/> Add shipment</button>
    </div>
    {error && <p role="alert" className="admin-feedback admin-error">{error}</p>}
    {notice && <p role="status" className="admin-feedback">{notice}</p>}
    {editor && <form className="admin-panel admin-editor" key={editor.id || 'new'} ref={editorRef} onSubmit={save}>
      <h2>{editor.id ? `Edit shipment #${editor.id}` : 'New shipment'}</h2>
      <fieldset disabled={busy} className="admin-fields">
        {fields.map(([name,label,limit,required]) => <label key={name} className={name==='trackingUrl'?'admin-wide':''}>{label}
          <input name={name} type={name==='trackingUrl'?'url':'text'} maxLength={limit} required={required} defaultValue={editor.details?.[name]} placeholder={name==='trackingUrl'?'https://…':undefined}/>
        </label>)}
        <label>Enquiry reference (optional)
          <input name="enquiryId" inputMode="numeric" pattern="[0-9]+" maxLength={19} defaultValue={editor.enquiryId ?? ''} placeholder="e.g. 12"/>
        </label>
        <label>Shipment status
          <select name="status" defaultValue={editor.status || 'booked'}>{Object.entries(shipmentStatuses).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select>
        </label>
        <label className="admin-wide">Latest update / note<textarea name="note" maxLength={1200} rows={3} defaultValue={editor.details?.note}/></label>
      </fieldset>
      <div className="admin-actions">
        <button type="submit" className="admin-button admin-primary" disabled={busy}>{busy?'Saving…':'Save shipment'}</button>
        <button type="button" className="admin-button" disabled={busy} onClick={() => setEditor(null)}>Cancel</button>
      </div>
    </form>}
    <div className="admin-panel admin-toolbar">
      <label>Shipment status
        <select value={filter} disabled={busy} onChange={event => run(() => load(event.target.value))}>
          <option value="">All statuses</option>
          {Object.entries(shipmentStatuses).map(([key,label])=><option key={key} value={key}>{label}</option>)}
        </select>
      </label>
      <button type="button" className="admin-button" disabled={busy} onClick={() => run(() => load())}>Refresh</button>
    </div>
    {!busy && !rows.length && <div className="admin-panel admin-empty"><Truck size={25}/><p>{filter?'No shipments match this status.':'No shipments have been added yet.'}</p></div>}
    <ul className="admin-list">
      {rows.map(row=><li key={row.id} className="admin-panel admin-record">
        <div className="admin-record-head"><span className="admin-meta">Shipment #{row.id}{row.enquiryId && ` · Enquiry #${row.enquiryId}`}</span><span className={`admin-badge status-${row.status}`}>{shipmentStatuses[row.status]}</span></div>
        <h2 className="admin-route"><span>{row.details.origin}</span><ArrowRight size={18} aria-hidden="true"/><span>{row.details.destination}</span></h2>
        {(row.details.carrier||row.details.trackingNumber) && <p className="admin-record-text">{[row.details.carrier,row.details.trackingNumber].filter(Boolean).join(' · ')}</p>}
        {row.details.note && <p className="admin-record-text admin-note">{row.details.note}</p>}
        <div className="admin-record-footer">
          <span>Updated <time dateTime={row.updatedAt}>{formatDate(row.updatedAt)}</time></span>
          <div className="admin-actions">
            {row.details.trackingUrl && <a className="admin-button" href={row.details.trackingUrl} target="_blank" rel="noopener noreferrer">Carrier tracking <ArrowUpRight size={15}/></a>}
            <button type="button" className="admin-button" disabled={busy} onClick={() => openEditor(row)}><Pencil size={15}/> Edit</button>
          </div>
        </div>
      </li>)}
    </ul>
    {next && <button type="button" className="admin-button" disabled={busy} onClick={() => run(() => load(filter,next))}>Load older shipments <ArrowDownRight size={15}/></button>}
    {busy && <p className="admin-meta" role="status">Loading…</p>}
  </div>;
}
