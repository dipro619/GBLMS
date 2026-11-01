'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = d => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const taka = n => '৳' + (n || 0);
const debounce = (f, ms = 250) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => f(...a), ms); }; };

/* theme (shares the key used by the website) */
const root = document.documentElement;
if (localStorage.theme) root.dataset.theme = localStorage.theme;
else if (matchMedia('(prefers-color-scheme:dark)').matches) root.dataset.theme = 'dark';
$('#theme').onclick = () => { const t = root.dataset.theme === 'dark' ? 'light' : 'dark'; root.dataset.theme = t; localStorage.theme = t; };

/* api + ui helpers */
async function api(path, { method = 'GET', body } = {}) {
  const r = await fetch('/api' + path, { method, credentials: 'same-origin', headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) { if (r.status === 401) location.href = '/'; throw new Error(d.error || 'Request failed'); }
  return d;
}
function toast(msg, type = 'ok') {
  const t = document.createElement('div'); t.className = 'toast ' + type; t.textContent = msg; $('#toasts').append(t);
  setTimeout(() => t.remove(), 3800);
}
async function run(fn, okMsg) {
  try { const r = await fn(); if (okMsg) toast(okMsg); return r; } catch (e) { toast(e.message, 'err'); return null; }
}
function table(cols, rows, empty = 'Nothing here yet.') {
  if (!rows.length) return `<div class="empty">${esc(empty)}</div>`;
  return `<div class="tblwrap"><table class="tbl"><thead><tr>${cols.map(c => `<th>${esc(c.h)}</th>`).join('')}</tr></thead><tbody>${
    rows.map(r => `<tr>${cols.map(c => `<td data-label="${esc(c.h)}"${c.acts ? ' class="acts"' : ''}>${c.acts ? c.r(r) : `<span class="cv">${c.r(r)}</span>`}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function form(title, fields, values, submitLabel, onSubmit) {
  const dlg = $('#dlg');
  const f = x => {
    const v = values[x.name] ?? '';
    if (x.type === 'checkbox') return `<label class="check"><input type="checkbox" name="${x.name}" ${v ? 'checked' : ''}> ${esc(x.label)}</label>`;
    const input = x.type === 'select'
      ? `<select name="${x.name}" ${x.req ? 'required' : ''}>${x.options.map(o => `<option value="${esc(o.v)}" ${String(o.v) === String(v) ? 'selected' : ''}>${esc(o.t)}</option>`).join('')}</select>`
      : x.type === 'textarea' ? `<textarea name="${x.name}" rows="${x.rows || 4}" ${x.req ? 'required' : ''}>${esc(v)}</textarea>`
      : x.type === 'file' ? `<input name="${x.name}" type="file" accept="${esc(x.accept || '')}" ${x.req ? 'required' : ''}>`
      : `<input name="${x.name}" type="${x.type || 'text'}" value="${esc(v)}" ${x.req ? 'required' : ''} ${x.list ? `list="${x.list}"` : ''} ${x.min != null ? `min="${x.min}"` : ''} autocomplete="${x.type === 'password' ? 'new-password' : 'off'}">`;
    return `<label>${esc(x.label)}${input}${x.hint ? `<small class="hint">${esc(x.hint)}</small>` : ''}</label>`;
  };
  // keep the order the fields were declared in; consecutive "half" fields share a two-column row
  let html = '', row = [];
  const flush = () => { if (row.length) { html += `<div class="grid2">${row.map(f).join('')}</div>`; row = []; } };
  fields.forEach(x => { if (x.half) row.push(x); else { flush(); html += f(x); } }); flush();
  dlg.innerHTML = `<h3>${esc(title)}</h3><form>${html}<p class="err" id="ferr"></p><div class="row"><button type="button" class="btn" id="fcancel">Cancel</button><button class="btn solid" id="fok">${esc(submitLabel)}</button></div></form>`;
  $('#fcancel').onclick = () => dlg.close();
  $('form', dlg).onsubmit = async e => {
    e.preventDefault();
    const data = {}; fields.forEach(x => { const el = e.target.elements[x.name]; data[x.name] = x.type === 'checkbox' ? el.checked : x.type === 'file' ? (el.files[0] || null) : el.value; });
    const btn = $('#fok'); btn.disabled = true; $('#ferr').textContent = '';
    try { await onSubmit(data, btn); dlg.close(); } catch (err) { $('#ferr').textContent = err.message; btn.disabled = false; btn.textContent = submitLabel; }
  };
  dlg.showModal();
}

/* file upload with progress (raw body, so large PDFs are not base64-inflated) */
function upload(path, file, btn) {
  return new Promise((resolve, reject) => {
    const x = new XMLHttpRequest(); x.open('PUT', '/api' + path); x.withCredentials = true;
    x.upload.onprogress = e => { if (e.lengthComputable && btn) btn.textContent = `Uploading… ${Math.round(e.loaded / e.total * 100)}%`; };
    x.onload = () => { let d = {}; try { d = JSON.parse(x.responseText); } catch (_) {} x.status >= 200 && x.status < 300 ? resolve(d) : reject(new Error(d.error || 'Upload failed')); };
    x.onerror = () => reject(new Error('Upload failed. Check your connection and the file size.'));
    x.send(file);
  });
}
// phone photos are often several MB: crop to a square and shrink before uploading
async function shrinkPhoto(file) {
  try {
    const bmp = await createImageBitmap(file), side = Math.min(bmp.width, bmp.height), out = Math.min(side, 360);
    const c = document.createElement('canvas'); c.width = c.height = out;
    c.getContext('2d').drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, out, out);
    return await new Promise(res => c.toBlob(b => res(b || file), 'image/jpeg', 0.88));
  } catch (_) { return file; }
}

// covers and logos: scale down big phone/camera photos before uploading (JPEG covers get a white background, PNG logos keep transparency)
async function shrinkImage(file, max = 900, mime = 'image/jpeg') {
  try {
    const bmp = await createImageBitmap(file), k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    const x = c.getContext('2d'); if (mime === 'image/jpeg') { x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); }
    x.drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise(res => c.toBlob(b => res(b || file), mime, 0.88));
  } catch (_) { return file; }
}
const coverHtml = (x, cls = 'cover') => x.cover ? `<img class="${cls}" src="${esc(x.cover)}" alt="" loading="lazy">` : '';
const IMG_ACCEPT = 'image/jpeg,image/png,image/webp';

/* profile helpers */
const ordn = n => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th'));
const semName = n => n ? ordn(n) + ' semester' : '—';
const fsize = b => b < 1024 ? b + ' B' : b < 1048576 ? Math.round(b / 1024) + ' KB' : (b / 1048576).toFixed(1) + ' MB';
const avatarHtml = (u, cls = '') => `<span class="avatar ${cls}">${u.avatar ? `<img src="${esc(u.avatar)}" alt="">` : esc((u.name.trim()[0] || '?').toUpperCase())}</span>`;
let cfg = { departments: [], semesters: 12, resourceTypes: ['Book', 'Notes', 'Other'], maxUploadMB: 50, fileTypes: [] };
const deptOpts = (cur, first = 'Select department') => { const l = [...cfg.departments]; if (cur && !l.includes(cur)) l.push(cur); return [{ v: '', t: first }, ...l.map(d => ({ v: d, t: d }))]; };
const semOpts = () => [{ v: '', t: 'Select semester' }, ...Array.from({ length: cfg.semesters }, (_, i) => ({ v: i + 1, t: ordn(i + 1) + ' semester' }))];
const selectHtml = (name, opts, val, req) => `<select name="${name}" ${req ? 'required' : ''}>${opts.map(o => `<option value="${esc(o.v)}" ${String(o.v) === String(val ?? '') ? 'selected' : ''}>${esc(o.t)}</option>`).join('')}</select>`;
const profileDone = u => u.studentId && u.phone && u.dept && u.batch && u.semester;

/* ───────── shared state ───────── */
let me, current = null, hashQuery = '';
const state = { bq: '', bcat: 'All', bavail: false, lf: 'active', rq: '', rt: 'All', rd: 'All' };

/* ───────── member views ───────── */
const bookCard = b => {
  const avail = b.available > 0;
  return `<article class="glass book">${coverHtml(b)}<h4>${esc(b.title)}</h4><small>${esc(b.author)}</small><small>${esc(b.category)}${b.rack ? ' · Rack ' + esc(b.rack) : ''}${b.year ? ' · ' + b.year : ''}</small>
    ${b.hasFile ? `<div class="act"><a class="btn sm solid" href="/files/b/${b.id}" target="_blank" rel="noopener">Read PDF</a><a class="btn sm" href="/files/b/${b.id}?download=1">Download · ${fsize(b.fileSize)}</a></div>` : ''}
    <div class="act"><span class="badge ${avail ? '' : 'warn'}">${avail ? b.available + ' available' : 'All on loan'}</span>
    ${me.role === 'user' ? (avail ? `<button class="btn sm solid" data-act="borrow" data-id="${b.id}">Borrow</button>` : `<button class="btn sm" data-act="reserve" data-id="${b.id}">Reserve</button>`) : ''}</div></article>`;
};
async function viewHome() {
  const [s, loans] = await Promise.all([api('/me/summary'), api('/me/loans')]);
  const active = loans.filter(l => !l.returnedAt);
  $('#view').innerHTML = `${profileDone(me) ? '' : '<div class="glass card banner"><b>Complete your profile</b><span>Add your phone, department, batch and semester so the library can reach you.</span><button class="btn sm solid" data-act="goto-profile">Open profile</button></div>'}<div class="stats">
    <div class="glass stat"><span>Books borrowed</span><b>${s.borrowed}<small style="font-size:16px;color:var(--mute)"> / ${s.maxLoans}</small></b></div>
    <div class="glass stat ${s.dueSoon ? 'warn' : ''}"><span>Due within 3 days</span><b>${s.dueSoon}</b></div>
    <div class="glass stat"><span>Reservations</span><b>${s.reservations}</b></div>
    <div class="glass stat ${s.fines ? 'bad' : ''}"><span>Outstanding fines</span><b>${taka(s.fines)}</b></div></div>
    <div class="glass card"><h3>Currently borrowed</h3>${loanTable(active, true)}</div>`;
}
const loanTable = (rows, canRenew) => table([
  { h: 'Book', r: l => `<b>${esc(l.title)}</b><small>${esc(l.author)}</small>` },
  { h: 'Borrowed', r: l => fmt(l.borrowedAt) },
  { h: 'Due', r: l => fmt(l.dueAt) },
  { h: 'Status', r: l => l.returnedAt ? `<span class="badge mute">Returned ${fmt(l.returnedAt)}</span>` : l.overdue ? `<span class="badge bad">Overdue ${l.daysLate}d · ${taka(l.fine)}</span>` : '<span class="badge">On loan</span>' },
  ...(canRenew ? [{ h: '', acts: true, r: l => l.returnedAt ? '' : `<button class="btn sm" data-act="renew" data-id="${l.id}">Renew</button>` }] : [])
], rows, 'You have no books on loan.');
async function viewBrowse() {
  const cats = await api('/categories');
  $('#view').innerHTML = `<div class="glass card"><div class="bar"><input class="grow" id="q" type="search" placeholder="Search title, author or ISBN…" value="${esc(state.bq)}">
    <select id="cat"><option>All</option>${cats.map(c => `<option ${c === state.bcat ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
    <label style="display:flex;align-items:center;gap:8px;font-size:14px;font-weight:500;color:var(--ink)"><input type="checkbox" id="av" ${state.bavail ? 'checked' : ''}> Available only</label></div>
    <div id="res" class="books"></div></div>`;
  const load = async () => {
    state.bq = $('#q').value; state.bcat = $('#cat').value; state.bavail = $('#av').checked;
    const r = await run(() => api(`/books?limit=100&q=${encodeURIComponent(state.bq)}&category=${encodeURIComponent(state.bcat)}${state.bavail ? '&available=1' : ''}`));
    if (r) $('#res').innerHTML = r.books.map(bookCard).join('') || '<div class="empty" style="grid-column:1/-1">No books found.</div>';
  };
  $('#q').oninput = debounce(load); $('#cat').onchange = load; $('#av').onchange = load; load();
}
async function viewLoans() {
  const loans = await api('/me/loans');
  $('#view').innerHTML = `<div class="glass card"><h3>Active loans</h3>${loanTable(loans.filter(l => !l.returnedAt), true)}</div><div class="glass card"><h3>History</h3>${loanTable(loans.filter(l => l.returnedAt), false)}</div>`;
}
async function viewReservations() {
  const rs = await api('/me/reservations');
  $('#view').innerHTML = `<div class="glass card"><h3>My reservations</h3>${table([
    { h: 'Book', r: r => `<b>${esc(r.title)}</b><small>${esc(r.author)}</small>` },
    { h: 'Reserved', r: r => fmt(r.createdAt) },
    { h: 'Status', r: r => r.status === 'ready' ? '<span class="badge">Ready — borrow it now</span>' : `<span class="badge warn">Queue position ${r.position}</span>` },
    { h: '', acts: true, r: r => `${r.status === 'ready' ? `<button class="btn sm solid" data-act="borrow" data-id="${r.bookId}">Borrow</button>` : ''}<button class="btn sm danger" data-act="cancel-res" data-id="${r.id}">Cancel</button>` }
  ], rs, 'No active reservations.')}</div>`;
}
function viewProfile() {
  const isUser = me.role === 'user';
  $('#view').innerHTML = `<div class="glass card"><h3>Profile photo</h3><div class="photo-row">${avatarHtml(me, 'xl')}<div class="photo-act">
    <input type="file" id="photo" accept="image/png,image/jpeg,image/webp" hidden>
    <button class="btn solid" id="chg">${me.avatar ? 'Change photo' : 'Upload photo'}</button>${me.avatar ? '<button class="btn danger" id="rm">Remove</button>' : ''}
    <small class="hint">Shown in the top bar and on the website so you can see you are signed in. Any image works; it is resized for you.</small></div></div></div>
    <div class="glass card"><h3>Details</h3><form class="form" id="pf"><label>Full name<input name="name" value="${esc(me.name)}" required></label>
    <label>Email<input value="${esc(me.email)}" disabled></label>
    ${isUser ? `<label>Student ID<input name="studentId" value="${esc(me.studentId)}" required></label>` : ''}
    <label>Phone number<input name="phone" type="tel" value="${esc(me.phone)}" ${isUser ? 'required' : ''} placeholder="01XXXXXXXXX"></label>
    ${isUser ? `<label>Department${selectHtml('dept', deptOpts(me.dept), me.dept, true)}</label>
    <div class="grid2"><label>Batch<input name="batch" value="${esc(me.batch)}" required></label><label>Semester${selectHtml('semester', semOpts(), me.semester, true)}</label></div>` : ''}
    <button class="btn solid" style="justify-self:start">Save profile</button></form></div>
    <div class="glass card"><h3>Change password</h3><form class="form" id="pw"><label>Current password<input type="password" name="current" required autocomplete="current-password"></label>
    <label>New password (min 8 characters)<input type="password" name="password" minlength="8" required autocomplete="new-password"></label><button class="btn solid" style="justify-self:start">Update password</button></form></div>`;
  $('#chg').onclick = () => $('#photo').click();
  $('#photo').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    if (!/^image\//.test(f.type)) return toast('Please choose an image file', 'err');
    const blob = await shrinkPhoto(f);
    const r = await run(() => upload('/me/avatar', blob), 'Photo updated'); if (r) { me = r.user; header(); viewProfile(); }
  };
  if ($('#rm')) $('#rm').onclick = async () => { const r = await run(() => api('/me/avatar', { method: 'DELETE' }), 'Photo removed'); if (r) { me = r.user; header(); viewProfile(); } };
  $('#pf').onsubmit = async e => { e.preventDefault(); const d = Object.fromEntries(new FormData(e.target));
    const r = await run(() => api('/me', { method: 'PATCH', body: d }), 'Profile saved'); if (r) { me = r.user; header(); } };
  $('#pw').onsubmit = async e => { e.preventDefault(); const d = Object.fromEntries(new FormData(e.target));
    if (await run(() => api('/auth/password', { method: 'POST', body: d }), 'Password updated')) e.target.reset(); };
}

/* E-library (members): read or download the real files the admin uploaded */
const resCard = r => {
  const canRead = ['.pdf', '.txt', '.jpg', '.jpeg', '.png'].includes(r.ext);
  return `<article class="glass book">${coverHtml(r)}<h4>${esc(r.title)}</h4>${r.author ? `<small>${esc(r.author)}</small>` : ''}
    <small><span class="badge">${esc(r.type)}</span> ${r.dept ? `<span class="badge mute">${esc(r.dept)}</span>` : ''} ${esc(r.ext.slice(1).toUpperCase())} · ${fsize(r.fileSize)}</small>
    ${r.description ? `<p class="desc">${esc(r.description)}</p>` : ''}
    <div class="act">${canRead ? `<a class="btn sm solid" href="/files/r/${r.id}" target="_blank" rel="noopener">Read</a>` : ''}<a class="btn sm" href="/files/r/${r.id}?download=1">Download</a></div></article>`;
};
async function viewLibrary() {
  $('#view').innerHTML = `<div class="glass card"><div class="bar"><input class="grow" id="q" type="search" placeholder="Search notes and e-books…" value="${esc(state.rq)}">
    <select id="rt"><option>All</option>${cfg.resourceTypes.map(t => `<option ${t === state.rt ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>
    <select id="rd"><option value="All">All departments</option>${cfg.departments.map(d => `<option ${d === state.rd ? 'selected' : ''}>${esc(d)}</option>`).join('')}</select></div>
    <div id="res" class="books"></div></div>`;
  const load = async () => {
    state.rq = $('#q').value; state.rt = $('#rt').value; state.rd = $('#rd').value;
    const r = await run(() => api(`/resources?q=${encodeURIComponent(state.rq)}&type=${encodeURIComponent(state.rt)}&dept=${encodeURIComponent(state.rd)}`));
    if (r) $('#res').innerHTML = r.map(resCard).join('') || '<div class="empty" style="grid-column:1/-1">No e-books or notes yet. The library staff will upload them here.</div>';
  };
  $('#q').oninput = debounce(load); $('#rt').onchange = load; $('#rd').onchange = load; load();
}

/* ───────── admin views ───────── */
async function viewOverview() {
  const [s, od] = await Promise.all([api('/admin/stats'), api('/admin/loans?filter=overdue')]);
  $('#view').innerHTML = `<div class="stats">
    <div class="glass stat"><span>Titles / copies</span><b>${s.titles}<small style="font-size:16px;color:var(--mute)"> / ${s.copies}</small></b></div>
    <div class="glass stat"><span>Active loans</span><b>${s.activeLoans}</b></div>
    <div class="glass stat ${s.overdue ? 'bad' : ''}"><span>Overdue</span><b>${s.overdue}</b></div>
    <div class="glass stat"><span>Members</span><b>${s.members}</b></div>
    <div class="glass stat"><span>Open reservations</span><b>${s.reservations}</b></div>
    <div class="glass stat ${s.unpaidFines ? 'warn' : ''}"><span>Unpaid fines</span><b>${taka(s.unpaidFines)}</b></div></div>
    <div class="glass card"><h3>Overdue loans</h3>${adminLoans(od)}</div>`;
}
const adminLoans = rows => table([
  { h: 'Book', r: l => `<b>${esc(l.title)}</b>` },
  { h: 'Member', r: l => `${esc(l.member)}<small>${esc(l.memberEmail)}</small>` },
  { h: 'Due', r: l => fmt(l.dueAt) },
  { h: 'Status', r: l => l.returnedAt ? `<span class="badge mute">Returned ${fmt(l.returnedAt)}</span>${l.fine ? ` <span class="badge ${l.finePaid ? '' : 'warn'}">${taka(l.fine)} ${l.finePaid ? 'paid' : 'unpaid'}</span>` : ''}` : l.overdue ? `<span class="badge bad">Overdue ${l.daysLate}d · ${taka(l.fine)}</span>` : '<span class="badge">On loan</span>' },
  { h: '', acts: true, r: l => !l.returnedAt ? `<button class="btn sm" data-act="return" data-id="${l.id}">Mark returned</button>` : (l.fine && !l.finePaid ? `<button class="btn sm" data-act="pay" data-id="${l.id}">Fine paid</button>` : '') }
], rows, 'No loans match.');
async function viewBooks() {
  $('#view').innerHTML = `<div class="glass card"><div class="bar"><input class="grow" id="q" type="search" placeholder="Search books…" value="${esc(state.bq)}"><button class="btn solid" id="add">+ Add book</button></div><div id="res"></div></div>`;
  const load = async () => {
    state.bq = $('#q').value;
    const r = await run(() => api(`/books?limit=100&q=${encodeURIComponent(state.bq)}`)); if (!r) return;
    $('#res').innerHTML = table([
      { h: 'Title', r: b => `<span class="who-cell">${b.cover ? `<img class="thumb" src="${esc(b.cover)}" alt="">` : '<span class="thumb none">No cover</span>'}<span><b>${esc(b.title)}</b>${b.isNew ? ' <span class="badge">New</span>' : ''}${b.featured ? ' <span class="badge warn">Featured</span>' : ''}<small>${esc(b.author)}</small></span></span>` },
      { h: 'Category', r: b => esc(b.category) }, { h: 'Rack', r: b => esc(b.rack) || '—' },
      { h: 'Book PDF', r: b => b.hasFile ? `<a class="badge" href="/files/b/${b.id}" target="_blank" rel="noopener">PDF · ${fsize(b.fileSize)}</a><small>${b.downloads} opened</small>` : '<span class="badge mute">No PDF</span>' },
      { h: 'Copies', r: b => `${b.available} / ${b.copies}` },
      { h: '', acts: true, r: b => `<button class="btn sm" data-act="edit-book" data-id="${b.id}">Edit</button><button class="btn sm danger" data-act="del-book" data-id="${b.id}">Delete</button>` }
    ], r.books, 'No books found.');
    window._books = r.books;
  };
  $('#q').oninput = debounce(load); $('#add').onclick = () => bookForm(); load();
  if (hashQuery) { $('#q').value = hashQuery; state.bq = hashQuery; hashQuery = ''; load(); }
}
async function bookForm(b) {
  const cats = await api('/categories');
  let cur = b; // after the first save the dialog keeps editing the same record (no duplicates if an upload has to be retried)
  form(b ? 'Edit book' : 'Add book', [
    { name: 'title', label: 'Title', req: true }, { name: 'author', label: 'Author', req: true },
    { name: 'category', label: 'Category / section', req: true, list: 'catlist' },
    { name: 'rack', label: 'Rack', half: true }, { name: 'year', label: 'Year', type: 'number', half: true },
    { name: 'isbn', label: 'ISBN', half: true }, { name: 'copies', label: 'Copies', type: 'number', min: 0, req: true, half: true },
    { name: 'publisher', label: 'Publisher', half: true }, { name: 'edition', label: 'Edition', half: true },
    { name: 'language', label: 'Language', list: 'langlist', half: true }, { name: 'subject', label: 'Subject / keywords', half: true },
    { name: 'description', label: 'Summary (shown in the catalogue)', type: 'textarea', rows: 3 },
    { name: 'cover', label: b && b.cover ? 'Replace book cover (JPG)' : 'Book cover (JPG)', type: 'file', accept: IMG_ACCEPT, hint: 'Shown on the website and in the portal. Big photos are shrunk automatically.' },
    { name: 'pdf', label: b && b.hasFile ? `Replace book PDF (now: ${b.fileName})` : 'Book PDF', type: 'file', accept: 'application/pdf,.pdf', hint: `Students can read it in the browser or download it. Up to ${cfg.maxUploadMB} MB.` },
    ...(b && b.cover ? [{ name: 'removeCover', label: 'Remove the current cover', type: 'checkbox' }] : []),
    ...(b && b.hasFile ? [{ name: 'removePdf', label: 'Remove the current PDF', type: 'checkbox' }] : []),
    { name: 'isNew', label: 'Show in New Arrivals', type: 'checkbox' },
    { name: 'featured', label: 'Show in the “Curated Masterworks” slider on the website', type: 'checkbox' }
  ], b || { copies: 1, isNew: true }, b ? 'Save changes' : 'Add book', async (d, btn) => {
    const { cover, pdf, removeCover, removePdf, ...meta } = d;
    meta.year = meta.year === '' ? null : meta.year;
    if (pdf && !/\.pdf$/i.test(pdf.name)) throw new Error('The book file must be a PDF');
    if (pdf && pdf.size > cfg.maxUploadMB * 1048576) throw new Error(`The PDF is too large (limit ${cfg.maxUploadMB} MB)`);
    if (cover && !/^image\//.test(cover.type)) throw new Error('The cover must be an image (JPG)');
    const saved = await api(cur ? `/books/${cur.id}` : '/books', { method: cur ? 'PUT' : 'POST', body: meta }); cur = saved;
    try {
      if (removeCover && !cover) await api(`/admin/books/${saved.id}/cover`, { method: 'DELETE' });
      if (removePdf && !pdf) await api(`/admin/books/${saved.id}/file`, { method: 'DELETE' });
      if (cover) await upload(`/admin/books/${saved.id}/cover`, await shrinkImage(cover), btn);
      if (pdf) await upload(`/admin/books/${saved.id}/file?name=${encodeURIComponent(pdf.name)}`, pdf, btn);
    } catch (e) { viewBooks(); throw new Error('The book was saved, but a file did not upload: ' + e.message + ' Choose the file again and press Save.'); }
    toast(b ? 'Book updated' : 'Book added'); viewBooks();
  });
  $('#dlg form').insertAdjacentHTML('afterbegin', `<datalist id="langlist">${['English', 'Bangla', 'Arabic', 'Hindi'].map(c => `<option value="${c}">`).join('')}</datalist><datalist id="catlist">${cats.map(c => `<option value="${esc(c)}">`).join('')}</datalist>`);
}
async function viewLoansAdmin() {
  $('#view').innerHTML = `<div class="glass card"><div class="bar"><div class="chips" id="lf">${['active', 'overdue', 'fines', 'all'].map(f => `<button class="chip ${state.lf === f ? 'on' : ''}" data-f="${f}">${{ active: 'On loan', overdue: 'Overdue', fines: 'Unpaid fines', all: 'All' }[f]}</button>`).join('')}</div><span style="flex:1"></span><button class="btn solid" id="issue">+ Issue book</button></div><div id="res"></div></div>`;
  const load = async () => { const r = await run(() => api('/admin/loans?filter=' + state.lf)); if (r) $('#res').innerHTML = adminLoans(r); };
  $('#lf').onclick = e => { const f = e.target.dataset.f; if (!f) return; state.lf = f; $$('#lf .chip').forEach(c => c.classList.toggle('on', c.dataset.f === f)); load(); };
  $('#issue').onclick = async () => {
    const { books } = await api('/books?limit=100&available=1');
    form('Issue a book', [{ name: 'email', label: 'Member email', type: 'email', req: true },
      { name: 'bookId', label: 'Book', type: 'select', req: true, options: books.map(b => ({ v: b.id, t: `${b.title} (${b.available} left)` })) }],
      {}, 'Issue', async d => { await api('/admin/loans', { method: 'POST', body: d }); toast('Book issued'); load(); });
  };
  load();
}
async function viewResources() {
  const rs = await api('/admin/resources'); window._res = rs;
  $('#view').innerHTML = `<div class="glass card"><div class="bar"><h3 style="margin:0;flex:1">E-library: books and notes</h3><button class="btn solid" id="addr">+ Upload file</button></div>${table([
    { h: 'Title', r: x => `<span class="who-cell">${x.cover ? `<img class="thumb" src="${esc(x.cover)}" alt="">` : '<span class="thumb none">No cover</span>'}<span><b>${esc(x.title)}</b><small>${esc(x.author) || '—'}</small></span></span>` },
    { h: 'Type', r: x => `<span class="badge">${esc(x.type)}</span>` },
    { h: 'Department', r: x => esc(x.dept) || 'All' },
    { h: 'File', r: x => x.hasFile ? `${esc(x.fileName)}<small>${fsize(x.fileSize)}</small>` : '<span class="badge warn">No file</span>' },
    { h: 'Status', r: x => x.visible ? '<span class="badge">Visible</span>' : '<span class="badge mute">Hidden</span>' },
    { h: 'Downloads', r: x => x.downloads },
    { h: '', acts: true, r: x => `${x.hasFile ? `<a class="btn sm" href="/files/r/${x.id}" target="_blank" rel="noopener">Open</a>` : ''}<button class="btn sm" data-act="edit-res" data-id="${x.id}">Edit</button><button class="btn sm danger" data-act="del-res" data-id="${x.id}">Delete</button>` }
  ], rs, 'Nothing uploaded yet. Click “Upload file” to add a PDF book, notes or a question bank.')}</div>`;
  $('#addr').onclick = () => resForm();
}
function resForm(r) {
  const accept = cfg.fileTypes.join(',');
  form(r ? 'Edit e-library item' : 'Upload to the e-library', [
    { name: 'title', label: 'Title', req: true }, { name: 'author', label: 'Author / teacher' },
    { name: 'type', label: 'Type', type: 'select', half: true, options: cfg.resourceTypes.map(t => ({ v: t, t })) },
    { name: 'dept', label: 'Department', type: 'select', half: true, options: deptOpts(r && r.dept, 'All departments') },
    { name: 'category', label: 'Subject / category' },
    { name: 'description', label: 'Description', type: 'textarea', rows: 3 },
    { name: 'file', label: r ? 'Replace file (optional)' : 'File', type: 'file', accept, req: !r, hint: `PDF, Word, PowerPoint, Excel, EPUB, TXT or image. Up to ${cfg.maxUploadMB} MB.` },
    { name: 'cover', label: r && r.cover ? 'Replace cover image (JPG)' : 'Cover image (JPG, optional)', type: 'file', accept: IMG_ACCEPT },
    ...(r && r.cover ? [{ name: 'removeCover', label: 'Remove the current cover', type: 'checkbox' }] : []),
    { name: 'visible', label: 'Visible to members', type: 'checkbox' }
  ], r ? { ...r } : { type: 'Book', visible: true }, r ? 'Save changes' : 'Upload', async (d, btn) => {
    const { file, cover, removeCover, ...meta } = d;
    if (file && file.size > cfg.maxUploadMB * 1048576) throw new Error(`File is too large (limit ${cfg.maxUploadMB} MB)`);
    const saved = await api(r ? `/admin/resources/${r.id}` : '/admin/resources', { method: r ? 'PUT' : 'POST', body: meta });
    if (file || cover || removeCover) {
      try {
        if (removeCover && !cover) await api(`/admin/resources/${saved.id}/cover`, { method: 'DELETE' });
        if (file) await upload(`/admin/resources/${saved.id}/file?name=${encodeURIComponent(file.name)}`, file, btn);
        if (cover) await upload(`/admin/resources/${saved.id}/cover`, await shrinkImage(cover), btn);
      }
      catch (e) { if (!r) await api(`/admin/resources/${saved.id}`, { method: 'DELETE' }).catch(() => {}); throw e; }
    }
    toast(r ? 'Item updated' : 'Uploaded to the e-library'); viewResources();
  });
}
async function viewMembers() {
  const us = await api('/admin/users'); window._users = us;
  $('#view').innerHTML = `<div class="glass card"><div class="bar"><h3 style="margin:0;flex:1">Members</h3><button class="btn solid" id="addm">+ Add member</button></div>${table([
    { h: 'Name', r: u => `<span class="who-cell">${avatarHtml(u, 'sm')}<span><b>${esc(u.name)}</b><small>${esc(u.email)}${u.phone ? ' · ' + esc(u.phone) : ''}</small></span></span>` },
    { h: 'Role', r: u => `<span class="badge ${u.role === 'admin' ? 'warn' : ''}">${u.role}</span>` },
    { h: 'Student ID', r: u => esc(u.studentId) || '—' },
    { h: 'Dept · batch · sem', r: u => u.dept || u.batch || u.semester ? `${esc(u.dept) || '—'}<small>Batch ${esc(u.batch) || '—'} · ${u.semester ? ordn(u.semester) + ' sem' : '—'}</small>` : '—' },
    { h: 'Loans', r: u => u.activeLoans }, { h: 'Fines', r: u => taka(u.fines) },
    { h: 'Status', r: u => u.active ? '<span class="badge">Active</span>' : '<span class="badge bad">Suspended</span>' },
    { h: '', acts: true, r: u => `<button class="btn sm" data-act="edit-member" data-id="${u.id}">Edit</button>${u.id === me.id ? '' : `<button class="btn sm ${u.active ? 'danger' : ''}" data-act="toggle-user" data-id="${u.id}" data-active="${u.active ? 1 : 0}">${u.active ? 'Suspend' : 'Activate'}</button><button class="btn sm danger" data-act="del-member" data-id="${u.id}">Delete</button>` }` }
  ], us)}</div>`;
  $('#addm').onclick = () => memberForm();
}
function memberForm(u) {
  const self = u && u.id === me.id;
  form(u ? 'Edit member' : 'Add member', [
    { name: 'name', label: 'Full name', req: true }, { name: 'email', label: 'Email', type: 'email', req: true },
    { name: 'studentId', label: 'Student ID', half: true }, { name: 'phone', label: 'Phone number', type: 'tel', half: true },
    { name: 'dept', label: 'Department', type: 'select', options: deptOpts(u && u.dept) },
    { name: 'batch', label: 'Batch', half: true }, { name: 'semester', label: 'Semester', type: 'select', half: true, options: semOpts() },
    ...(self ? [] : [{ name: 'role', label: 'Role', type: 'select', options: [{ v: 'user', t: 'Member (student)' }, { v: 'admin', t: 'Administrator' }] }]),
    { name: 'password', label: u ? 'New password' : 'Password', type: 'password', req: !u, hint: u ? 'Leave blank to keep the current password.' : 'At least 8 characters.' }
  ], u ? { ...u, password: '' } : { role: 'user' }, u ? 'Save changes' : 'Add member', async d => {
    if (u && !d.password) delete d.password;
    await api(u ? `/admin/users/${u.id}` : '/admin/users', { method: u ? 'PATCH' : 'POST', body: d });
    toast(u ? 'Member updated' : 'Member added'); viewMembers();
  });
}
async function viewSettings() {
  cfg = { ...cfg, ...(await api('/settings/public')) }; const R = cfg.rules;
  const num = (k, label, lo, hi) => `<label>${label}<input type="number" name="${k}" min="${lo}" max="${hi}" value="${R[k]}" required></label>`;
  $('#view').innerHTML = `<div class="glass card"><h3>Library rules</h3><form class="form" id="rf">
    ${num('LOAN_DAYS', 'Loan period (days)', 1, 365)}${num('RENEW_DAYS', 'Days added per renewal', 1, 365)}${num('MAX_RENEWALS', 'Renewals allowed per loan', 0, 20)}${num('MAX_LOANS', 'Books a member can borrow at once', 1, 50)}${num('FINE_PER_DAY', 'Late fine per day (৳)', 0, 10000)}
    <button class="btn solid" style="justify-self:start">Save rules</button></form></div>
    <div class="glass card"><h3>Departments</h3><form class="form" id="df"><label>One department per line<textarea name="departments" rows="9" required>${esc(cfg.departments.join('\n'))}</textarea>
    <small class="hint">These appear in the registration form, profiles and e-library filters. Members already assigned to a removed department keep it.</small></label>
    <button class="btn solid" style="justify-self:start">Save departments</button></form></div>`;
  $('#rf').onsubmit = async e => { e.preventDefault(); const d = Object.fromEntries(new FormData(e.target));
    const r = await run(() => api('/admin/settings', { method: 'PUT', body: { rules: d } }), 'Rules saved'); if (r) cfg.rules = r.rules; };
  $('#df').onsubmit = async e => { e.preventDefault();
    const r = await run(() => api('/admin/settings', { method: 'PUT', body: { departments: e.target.departments.value } }), 'Departments saved'); if (r) { cfg.departments = r.departments; viewSettings(); } };
}
async function viewNotices() {
  const ns = await api('/notices');
  $('#view').innerHTML = `<div class="glass card"><div class="bar"><h3 style="margin:0;flex:1">Notice board</h3><button class="btn solid" id="addn">+ New notice</button></div>${ns.map(n => `<div class="notice-row"><div class="grow"><span class="badge">${esc(n.category)}</span> <small style="color:var(--mute)">${fmt(n.date)}</small><div><b>${esc(n.title)}</b></div></div>
    <button class="btn sm" data-act="edit-notice" data-id="${n.id}">Edit</button><button class="btn sm danger" data-act="del-notice" data-id="${n.id}">Delete</button></div>`).join('') || '<div class="empty">No notices.</div>'}</div>`;
  window._notices = ns; $('#addn').onclick = () => noticeForm();
}
function noticeForm(n) {
  form(n ? 'Edit notice' : 'New notice', [{ name: 'title', label: 'Title', req: true },
    { name: 'category', label: 'Category', type: 'select', options: ['Library', 'Academic', 'Events'].map(c => ({ v: c, t: c })) },
    { name: 'date', label: 'Date', type: 'date', req: true }], n || { date: new Date().toISOString().slice(0, 10) }, n ? 'Save' : 'Publish',
    async d => { await api(n ? `/notices/${n.id}` : '/notices', { method: n ? 'PUT' : 'POST', body: d }); toast('Notice saved'); viewNotices(); });
}
async function viewSite() {
  const s = await api('/site'), S = s.social || {};
  const inp = (n, label, v, extra = '') => `<label>${label}<input name="${n}" value="${esc(v)}" ${extra}></label>`;
  $('#view').innerHTML = `<div class="glass card"><h3>Logo</h3><div class="photo-row">${s.logo ? `<img class="logo-prev" src="${esc(s.logo)}" alt="">` : '<span class="thumb none">No logo</span>'}<div class="photo-act">
    <input type="file" id="logo" accept="${IMG_ACCEPT}" hidden><button class="btn solid" id="chglogo">${s.logo ? 'Change logo' : 'Upload logo'}</button>${s.logo ? '<button class="btn danger" id="rmlogo">Remove</button>' : ''}
    <small class="hint">Replaces the small book icon next to “GBLMS” on the website and in the portal. A PNG with a transparent background looks best.</small></div></div></div>
    <form class="form wide" id="sf"><div class="glass card"><h3>Contact details</h3>
    <div class="grid2">${inp('phone', 'Phone number', s.phone)}${inp('email', 'Contact email', s.email, 'type="email"')}</div>
    ${inp('address', 'Address', s.address)}${inp('hours', 'Opening hours', s.hours)}${inp('mapUrl', 'Map link (Google Maps)', s.mapUrl, 'type="url" placeholder="https://"')}
    <small class="hint">These appear in the footer of the website.</small></div>
    <div class="glass card"><h3>Home page</h3>${inp('heroEyebrow', 'Small heading', s.heroEyebrow)}${inp('heroTitle', 'Main title', s.heroTitle)}
    <label>Intro text<textarea name="heroText" rows="3">${esc(s.heroText)}</textarea></label></div>
    <div class="glass card"><h3>Footer</h3><label>About text<textarea name="footerText" rows="2">${esc(s.footerText)}</textarea></label>${inp('copyright', 'Copyright line', s.copyright)}</div>
    <div class="glass card"><h3>Social media links</h3>
    <div class="grid2">${[['facebook', 'Facebook'], ['youtube', 'YouTube'], ['linkedin', 'LinkedIn'], ['whatsapp', 'WhatsApp'], ['x', 'X (Twitter)'], ['instagram', 'Instagram']].map(([k, l]) => inp('s_' + k, l, S[k], 'type="url" placeholder="https://"')).join('')}</div>
    <small class="hint">All icons always show in the website footer. An icon without a link looks dimmed and does nothing until you add its link here.</small></div>
    <div class="glass card"><h3>Resources &amp; databases (footer links)</h3><label>One link per line, written as: Name | https://link<textarea name="links" rows="7">${esc((s.links || []).map(l => l.label + ' | ' + l.url).join('\n'))}</textarea></label></div>
    <button class="btn solid" style="justify-self:start">Save website content</button></form>`;
  $('#chglogo').onclick = () => $('#logo').click();
  $('#logo').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    if (!/^image\//.test(f.type)) return toast('Please choose an image file', 'err');
    if (await run(async () => upload('/admin/site/logo', await shrinkImage(f, 600, 'image/png')), 'Logo updated')) { applyLogo(); viewSite(); }
  };
  if ($('#rmlogo')) $('#rmlogo').onclick = async () => { if (await run(() => api('/admin/site/logo', { method: 'DELETE' }), 'Logo removed')) { applyLogo(); viewSite(); } };
  $('#sf').onsubmit = async e => {
    e.preventDefault(); const d = Object.fromEntries(new FormData(e.target)), social = {};
    for (const k of Object.keys(d)) if (k.startsWith('s_')) { social[k.slice(2)] = d[k]; delete d[k]; }
    if (await run(() => api('/admin/site', { method: 'PUT', body: { ...d, social } }), 'Website updated — refresh the home page to see it')) viewSite();
  };
}
async function applyLogo() { // swap the small book icon in the portal header for the uploaded logo
  const s = await api('/site').catch(() => null), a = $('.top .brand'); if (!s || !a) return;
  const old = a.querySelector('.logo-img, svg');
  if (s.logo) { if (old && old.tagName === 'svg') old.replaceWith(Object.assign(document.createElement('img'), { className: 'logo-img', src: s.logo, alt: '' })); else if (old) old.src = s.logo; }
  else if (old && old.tagName === 'IMG') old.outerHTML = a.dataset.svg;
}
async function viewMessages() {
  const ms = await api('/admin/messages');
  $('#view').innerHTML = `<div class="glass card"><h3>Messages from the contact form</h3>${ms.map(m => `<div class="msg ${m.read ? '' : 'unread'}"><div class="grow"><b class="s">${esc(m.name)}</b> <small style="color:var(--mute)">&lt;${esc(m.email)}&gt; · ${fmt(m.createdAt)}</small>${m.topic ? ` <span class="badge">${esc(m.topic)}</span>` : ''}<p>${esc(m.message)}</p></div>
    ${m.read ? '' : `<button class="btn sm" data-act="read-msg" data-id="${m.id}">Mark read</button>`}<button class="btn sm danger" data-act="del-msg" data-id="${m.id}">Delete</button></div>`).join('') || '<div class="empty">No messages yet.</div>'}</div>`;
}


/* ───────── page content (About, Services, Helpdesk) ───────── */
function repHtml(key, rows, cols, addLabel) {
  const row = r => `<div class="rep-row">${cols.map(c => c.type === 'hidden' ? `<input type="hidden" data-k="${c.k}" value="${esc(r[c.k])}">`
    : c.type === 'photo' ? `<div class="wide photo-cell"><span class="avatar xl" data-prev>${r[c.k] ? `<img src="${esc(r[c.k])}" alt="">` : esc((r.name || '?').trim()[0].toUpperCase() || '?')}</span>
        <div class="photo-act"><input type="file" accept="${IMG_ACCEPT}" data-photo hidden><button type="button" class="btn sm solid" data-pick>${r[c.k] ? 'Change photo' : 'Upload photo'}</button><button type="button" class="btn sm danger" data-unpick ${r[c.k] ? '' : 'hidden'}>Remove photo</button>
        <small class="hint">Optional. A square photo of the face works best; it is cropped and resized for you.</small></div></div>`
    : c.type === 'select'
    ? `<label>${c.label}<select data-k="${c.k}">${c.options.map(o => `<option ${o === r[c.k] ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></label>`
    : c.type === 'textarea' ? `<label class="wide">${c.label}<textarea data-k="${c.k}" rows="2">${esc(r[c.k])}</textarea></label>`
    : `<label>${c.label}<input data-k="${c.k}" value="${esc(r[c.k])}" ${c.ph ? `placeholder="${esc(c.ph)}"` : ''}></label>`).join('')}<div class="rep-act"><button type="button" class="btn sm" data-up aria-label="Move up">↑</button><button type="button" class="btn sm" data-down aria-label="Move down">↓</button><button type="button" class="btn sm danger" data-rm>Remove</button></div></div>`;
  return `<div class="rep" data-rep="${key}" data-empty="${esc(row({}))}">${rows.map(row).join('')}</div><button type="button" class="btn sm" data-add="${key}">+ ${addLabel}</button>`;
}
const repGet = (root, key) => $$(`[data-rep="${key}"] .rep-row`, root).map(r => Object.fromEntries($$('[data-k]', r).map(el => [el.dataset.k, el.value])));
async function viewPages() {
  const pg = await api('/pages'), A = pg.about, S = pg.services, H = pg.helpdesk;
  const inp = (n, label, v) => `<label>${label}<input name="${n}" value="${esc(v)}"></label>`, area = (n, label, v, rows = 3) => `<label>${label}<textarea name="${n}" rows="${rows}">${esc(v)}</textarea></label>`;
  const top = (o, name) => `<div class="grid2">${inp('eyebrow', 'Small heading', o.eyebrow)}${inp('title', 'Page title', o.title)}</div>${area('intro', 'Intro text', o.intro, 3)}`;
  $('#view').innerHTML = `<div class="chips" id="ptabs" style="margin-bottom:14px">${[['about', 'About Library'], ['services', 'Services'], ['helpdesk', 'Helpdesk']].map(([k, t], i) => `<button class="chip ${i ? '' : 'on'}" data-p="${k}">${t}</button>`).join('')}</div>
  <form class="form wide pform" id="p-about"><div class="glass card"><h3>About Library page <a class="btn sm" href="/about" target="_blank" rel="noopener">View page</a></h3>${top(A)}
    ${area('history', 'History', A.history, 6)}<div class="grid2">${area('vision', 'Vision', A.vision, 3)}${area('mission', 'Mission', A.mission, 3)}</div></div>
    <div class="glass card"><h3>Library in numbers</h3>${repHtml('stats', A.stats, [{ k: 'value', label: 'Number (e.g. 25,000+)' }, { k: 'label', label: 'Label' }], 'Add number')}</div>
    <div class="glass card"><h3>What we value</h3>${repHtml('values', A.values, [{ k: 'title', label: 'Title' }, { k: 'text', label: 'Description', type: 'textarea' }], 'Add value')}</div>
    <div class="glass card"><h3>Management team</h3><div class="grid2">${inp('teamTitle', 'Section heading', A.teamTitle || '')}${inp('teamIntro', 'Short intro (optional)', A.teamIntro || '')}</div>
    <small class="hint">Photo and social links are optional; only the icons you fill in appear on that member’s card. Facebook, LinkedIn, Instagram, X and YouTube: paste the profile link. WhatsApp: a number with country code (for example 8801XXXXXXXXX) or a wa.me link. Use ↑ ↓ to change the order.</small>
    ${repHtml('team', A.team, [{ k: 'id', type: 'hidden' }, { k: 'photo', type: 'photo' }, { k: 'name', label: 'Name' }, { k: 'role', label: 'Role / position' }, { k: 'bio', label: 'About (short)', type: 'textarea' },
      { k: 'facebook', label: 'Facebook', ph: 'https://facebook.com/…' }, { k: 'whatsapp', label: 'WhatsApp', ph: '8801XXXXXXXXX' }, { k: 'linkedin', label: 'LinkedIn', ph: 'https://linkedin.com/in/…' },
      { k: 'instagram', label: 'Instagram', ph: 'https://instagram.com/…' }, { k: 'x', label: 'X (Twitter)', ph: 'https://x.com/…' }, { k: 'youtube', label: 'YouTube', ph: 'https://youtube.com/@…' }], 'Add team member')}</div>
    <button class="btn solid" style="justify-self:start">Save About page</button></form>
  <form class="form wide pform" id="p-services" hidden><div class="glass card"><h3>Services page <a class="btn sm" href="/services" target="_blank" rel="noopener">View page</a></h3>${top(S)}
    <small class="hint">The borrowing rules shown on this page come from the Settings tab.</small></div>
    <div class="glass card"><h3>Services</h3>${repHtml('items', S.items, [{ k: 'icon', label: 'Icon', type: 'select', options: pg.icons }, { k: 'title', label: 'Title' }, { k: 'text', label: 'Description', type: 'textarea' }], 'Add service')}</div>
    <button class="btn solid" style="justify-self:start">Save Services page</button></form>
  <form class="form wide pform" id="p-helpdesk" hidden><div class="glass card"><h3>Helpdesk page <a class="btn sm" href="/helpdesk" target="_blank" rel="noopener">View page</a></h3>${top(H)}
    ${area('topics', 'Message topics (one per line — shown in the contact form drop-down)', H.topics.join('\n'), 6)}
    <small class="hint">Phone, email, address, opening hours and map link are edited in the Website tab.</small></div>
    <div class="glass card"><h3>Frequently asked questions</h3>${repHtml('faqs', H.faqs, [{ k: 'q', label: 'Question' }, { k: 'a', label: 'Answer', type: 'textarea' }], 'Add question')}</div>
    <button class="btn solid" style="justify-self:start">Save Helpdesk page</button></form>`;
  $('#ptabs').onclick = e => { const b = e.target.closest('[data-p]'); if (!b) return; $$('#ptabs .chip').forEach(c => c.classList.toggle('on', c === b)); $$('.pform').forEach(f => f.hidden = f.id !== 'p-' + b.dataset.p); };
  $('#view').onchange = async e => {   // a team photo was chosen: show it now, upload it when the page is saved
    const inp = e.target.closest('[data-photo]'); if (!inp) return;
    const f = inp.files[0]; inp.value = ''; if (!f) return;
    if (!/^image\//.test(f.type)) return toast('Please choose an image file', 'err');
    const row = inp.closest('.rep-row'), blob = await shrinkPhoto(f);
    row._file = blob; row.dataset.rm = ''; row.dataset.url && URL.revokeObjectURL(row.dataset.url); row.dataset.url = URL.createObjectURL(blob);
    $('[data-prev]', row).innerHTML = `<img src="${row.dataset.url}" alt="">`; $('[data-pick]', row).textContent = 'Change photo'; $('[data-unpick]', row).hidden = false;
  };
  $('#view').onclick = e => {
    const pick = e.target.closest('[data-pick]'), unpick = e.target.closest('[data-unpick]');
    if (pick) pick.closest('.rep-row').querySelector('[data-photo]').click();
    if (unpick) { const row = unpick.closest('.rep-row'); row._file = null; row.dataset.rm = '1'; const n = $('[data-k="name"]', row).value.trim(); $('[data-prev]', row).textContent = (n[0] || '?').toUpperCase(); $('[data-pick]', row).textContent = 'Upload photo'; unpick.hidden = true; }
    const add = e.target.closest('[data-add]'), rm = e.target.closest('[data-rm]');
    if (add) $(`[data-rep="${add.dataset.add}"]`).insertAdjacentHTML('beforeend', $(`[data-rep="${add.dataset.add}"]`).dataset.empty);
    if (rm) rm.closest('.rep-row').remove();
    const up = e.target.closest('[data-up]'), dn = e.target.closest('[data-down]');
    if (up) { const r = up.closest('.rep-row'); if (r.previousElementSibling) r.parentElement.insertBefore(r, r.previousElementSibling); }
    if (dn) { const r = dn.closest('.rep-row'); if (r.nextElementSibling) r.parentElement.insertBefore(r.nextElementSibling, r); }
  };
  const head = f => ({ eyebrow: f.eyebrow.value, title: f.elements.title.value, intro: f.intro.value });
  const save = (id, build) => { $('#p-' + id).onsubmit = async e => { e.preventDefault(); const f = e.target; if (await run(() => api('/admin/pages', { method: 'PUT', body: { [id]: build(f) } }), 'Page saved — it is live now')) { /* stay on the same tab */ } }; };
  $('#p-about').onsubmit = async e => {
    e.preventDefault(); const f = e.target;
    const rows = $$('[data-rep="team"] .rep-row', f).filter(r => $('[data-k="name"]', r).value.trim());   // the server drops nameless rows, so the order matches
    const team = rows.map(r => Object.fromEntries($$('[data-k]', r).filter(el => el.dataset.k !== 'photo').map(el => [el.dataset.k, el.value])));
    const out = await run(async () => {
      const r = await api('/admin/pages', { method: 'PUT', body: { about: { ...head(f), history: f.history.value, vision: f.vision.value, mission: f.mission.value, teamTitle: f.teamTitle.value, teamIntro: f.teamIntro.value, stats: repGet(f, 'stats'), values: repGet(f, 'values'), team } } });
      for (let i = 0; i < rows.length; i++) {
        const m = r.about.team[i]; if (!m) continue;
        if (rows[i]._file) await upload(`/admin/team/${m.id}/photo`, rows[i]._file);
        else if (rows[i].dataset.rm === '1' && m.photo) await api(`/admin/team/${m.id}/photo`, { method: 'DELETE' });
      }
      return r;
    }, 'Page saved — it is live now');
    if (out) viewPages();
  };
  save('services', f => ({ ...head(f), items: repGet(f, 'items') }));
  save('helpdesk', f => ({ ...head(f), topics: f.topics.value, faqs: repGet(f, 'faqs') }));
}

/* ───────── shell ───────── */
const TABS = {
  user: [['home', 'My library', viewHome], ['browse', 'Browse books', viewBrowse], ['library', 'E-library', viewLibrary], ['loans', 'My loans', viewLoans], ['reservations', 'Reservations', viewReservations], ['profile', 'Profile', viewProfile]],
  admin: [['overview', 'Overview', viewOverview], ['books', 'Books', viewBooks], ['library', 'E-library', viewResources], ['loans', 'Loans', viewLoansAdmin], ['members', 'Members', viewMembers], ['notices', 'Notices', viewNotices], ['messages', 'Messages', viewMessages], ['pages', 'Pages', viewPages], ['site', 'Website', viewSite], ['settings', 'Settings', viewSettings], ['profile', 'Profile', viewProfile]]
};
function header() {
  $('#who').innerHTML = `<a class="who-link" href="#profile" data-act="goto-profile" title="My profile">${avatarHtml(me)}<div><b>${esc(me.name)}</b><small>${me.role === 'admin' ? 'Administrator' : 'Member'}</small></div></a>`;
  $('#eyebrow').textContent = me.role === 'admin' ? 'ADMIN PORTAL' : 'MEMBER PORTAL';
}
async function show(id) {
  const t = TABS[me.role].find(x => x[0] === id) || TABS[me.role][0];
  current = t[0]; history.replaceState(null, '', '#' + t[0]);
  $$('#tabs .tab').forEach(b => b.classList.toggle('on', b.dataset.t === t[0]));
  $('#title').textContent = t[1];
  $('#sub').textContent = me.role === 'admin' ? 'Manage the catalogue, e-library, loans, members, notices, website content and settings.' : `Welcome back, ${me.name.split(' ')[0]}.`;
  $('#view').innerHTML = '<div class="loading">Loading…</div>';
  try { await t[2](); } catch (e) { $('#view').innerHTML = `<div class="glass card empty">${esc(e.message)}</div>`; }
}
async function badge() {
  if (me.role !== 'admin') return;
  const s = await api('/admin/stats').catch(() => null);
  $$('#tabs .dot').forEach(d => d.remove());
  if (s && s.unreadMessages) $('#tabs [data-t=messages]').insertAdjacentHTML('beforeend', `<span class="dot">${s.unreadMessages}</span>`);
}

/* ───────── actions (event delegation) ───────── */
document.addEventListener('click', async e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const a = el.dataset.act, id = Number(el.dataset.id), refresh = () => { show(current); badge(); };
  const post = (p, ok) => run(() => api(p, { method: 'POST' }), ok).then(r => r && refresh());
  if (a === 'borrow') { const r = await run(() => api(`/books/${id}/borrow`, { method: 'POST' })); if (r) { toast('Borrowed — due ' + fmt(r.dueAt)); refresh(); } }
  else if (a === 'reserve') post(`/books/${id}/reserve`, 'Reserved — you will be first in line when it returns');
  else if (a === 'renew') post(`/loans/${id}/renew`, 'Loan renewed');
  else if (a === 'cancel-res') run(() => api(`/reservations/${id}`, { method: 'DELETE' }), 'Reservation cancelled').then(r => r && refresh());
  else if (a === 'return') post(`/loans/${id}/return`, 'Marked as returned');
  else if (a === 'pay') post(`/loans/${id}/pay-fine`, 'Fine recorded as paid');
  else if (a === 'edit-book') bookForm(window._books.find(b => b.id === id));
  else if (a === 'del-book') { if (confirm('Delete this book permanently?')) run(() => api(`/books/${id}`, { method: 'DELETE' }), 'Book deleted').then(r => r && refresh()); }
  else if (a === 'goto-profile') { e.preventDefault(); show('profile'); }
  else if (a === 'edit-res') resForm(window._res.find(x => x.id === id));
  else if (a === 'del-res') { if (confirm('Delete this file permanently?')) run(() => api(`/admin/resources/${id}`, { method: 'DELETE' }), 'File deleted').then(r => r && refresh()); }
  else if (a === 'edit-member') memberForm(window._users.find(x => x.id === id));
  else if (a === 'del-member') { if (confirm('Delete this member? Their loan history stays in the records.')) run(() => api(`/admin/users/${id}`, { method: 'DELETE' }), 'Member deleted').then(r => r && refresh()); }
  else if (a === 'toggle-user') run(() => api(`/admin/users/${id}`, { method: 'PATCH', body: { active: el.dataset.active !== '1' } }), 'Member updated').then(r => r && refresh());
  else if (a === 'edit-notice') noticeForm(window._notices.find(n => n.id === id));
  else if (a === 'del-notice') { if (confirm('Delete this notice?')) run(() => api(`/notices/${id}`, { method: 'DELETE' }), 'Notice deleted').then(r => r && refresh()); }
  else if (a === 'read-msg') run(() => api(`/admin/messages/${id}`, { method: 'PATCH', body: { read: true } })).then(r => r && refresh());
  else if (a === 'del-msg') { if (confirm('Delete this message?')) run(() => api(`/admin/messages/${id}`, { method: 'DELETE' })).then(r => r && refresh()); }
});
$('#logout').onclick = async () => { await api('/auth/logout', { method: 'POST' }).catch(() => {}); location.href = '/'; };

/* ───────── boot ───────── */
(async () => {
  try { me = (await api('/auth/me')).user; } catch (_) { return; }
  if (!me) return void (location.href = '/');
  try { cfg = { ...cfg, ...(await api('/settings/public')) }; } catch (_) {}
  header();
  { const br = $('.top .brand'); br.dataset.svg = br.querySelector('svg').outerHTML; applyLogo(); }
  $('#tabs').innerHTML = TABS[me.role].map(t => `<button class="tab" data-t="${t[0]}">${t[1]}</button>`).join('');
  $('#tabs').onclick = e => { const t = e.target.closest('.tab'); if (t) show(t.dataset.t); };
  const m = location.hash.match(/^#browse=(.*)$/);
  let start = location.hash.slice(1);
  if (m) { hashQuery = decodeURIComponent(m[1]); state.bq = hashQuery; start = me.role === 'admin' ? 'books' : 'browse'; }
  await show(start); badge();
})();
