'use strict';
/* GBLMS public pages — About, OPAC, E-Library, Services, Helpdesk. All content comes from the API (editable in Admin). */
const prose = t => `<p class="prose">${esc(t)}</p>`;
const heroHtml = c => `<div class="hero"><span class="eyebrow">${esc(c.eyebrow)}</span><h1>${esc(c.title)}</h1><p>${esc(c.intro)}</p></div>`;
const qs = () => new URLSearchParams(location.search);
function setQs(obj, push) {
  const u = new URLSearchParams(); for (const [k, v] of Object.entries(obj)) if (v !== '' && v != null && v !== 'All' && v !== false && !(k === 'page' && v === 1)) u.set(k, v === true ? '1' : v);
  const url = location.pathname + (u.toString() ? '?' + u : ''); history[push ? 'pushState' : 'replaceState'](null, '', url);
}
const skeletons = n => Array.from({ length: n }, () => '<div class="skel"></div>').join('');
function pager(el, total, limit, page, go) {
  const pages = Math.max(1, Math.ceil(total / limit)); if (pages <= 1) { el.innerHTML = ''; return; }
  el.innerHTML = `<button class="btn sm" ${page <= 1 ? 'disabled' : ''} data-p="${page - 1}">← Previous</button><span class="mute">Page ${page} of ${pages}</span><button class="btn sm" ${page >= pages ? 'disabled' : ''} data-p="${page + 1}">Next →</button>`;
  el.onclick = e => { const b = e.target.closest('[data-p]'); if (b) { go(Number(b.dataset.p)); scrollTo({ top: Math.max(0, el.parentElement.offsetTop - 120), behavior: 'smooth' }); } };
}

/* ───────── About ───────── */
async function pageAbout() {
  const [pg, site] = await Promise.all([api('/pages'), api('/site')]), a = pg.about;
  document.title = a.title + ' · GBLMS';
  $('#main').innerHTML = `<div class="wrap">${heroHtml(a)}
    <section class="grid stats" aria-label="Library in numbers">${a.stats.map(s => `<div class="glass stat"><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join('')}</section>
    <section class="sec" id="history"><h2>Our history</h2><div class="glass card">${prose(a.history)}</div></section>
    <section class="sec grid two"><div class="glass card" id="vision"><div class="ico-chip">${ico('globe')}</div><h3>Vision</h3>${prose(a.vision)}</div><div class="glass card" id="mission"><div class="ico-chip">${ico('cap')}</div><h3>Mission</h3>${prose(a.mission)}</div></section>
    ${a.values.length ? `<section class="sec" id="values"><h2>What we value</h2><div class="grid">${a.values.map(v => `<div class="glass card"><h3>${esc(v.title)}</h3><p class="mute">${esc(v.text)}</p></div>`).join('')}</div></section>` : ''}
    ${a.team.length ? `<section class="sec" id="team"><h2>${esc(a.teamTitle || 'Library management team')}</h2>${a.teamIntro ? `<p class="lead">${esc(a.teamIntro)}</p>` : ''}<div class="grid">${a.team.map(m => `<article class="glass card member lift"><span class="avatar">${m.photo ? `<img src="${esc(m.photo)}" alt="${esc(m.name)}" loading="lazy">` : `<span aria-hidden="true">${esc(m.name.trim()[0].toUpperCase())}</span>`}</span><h3>${esc(m.name)}</h3><small>${esc(m.role)}</small>${m.bio ? `<p>${esc(m.bio)}</p>` : ''}
      ${socialRow(m, { all: false, cls: 'soc sm', label: m.name + ' on social media' })}</article>`).join('')}</div></section>` : ''}
    <section class="sec"><h2>Visit us</h2><div class="glass card facts">
      <div class="fact"><span class="ico-chip">${ico('pin')}</span><div><b>Address</b><span>${esc(site.address)}</span></div></div>
      <div class="fact"><span class="ico-chip">${ico('clock')}</span><div><b>Opening hours</b><span>${esc(site.hours)}</span></div></div>
      <div class="fact"><span class="ico-chip">${ico('phone')}</span><div><b>Phone</b><a href="tel:${esc(site.phone.replace(/[^\d+]/g, ''))}">${esc(site.phone)}</a></div></div>
      <div class="fact"><span class="ico-chip">${ico('mail')}</span><div><b>Email</b><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></div></div></div>
      <div class="actions">${site.mapUrl ? `<a class="btn" href="${esc(site.mapUrl)}" target="_blank" rel="noopener">${ico('pin')} Open in Maps</a>` : ''}<a class="btn solid" href="/helpdesk">Contact the library</a></div></section></div>`;
}

/* ───────── OPAC ───────── */
async function pageOpac() {
  const [cats, langs] = await Promise.all([api('/categories'), api('/languages')]);
  const s = Object.assign({ q: '', field: 'all', category: 'All', language: 'All', yearFrom: '', yearTo: '', available: false, sort: 'title', page: 1 }, Object.fromEntries(qs()));
  s.page = Number(s.page) || 1; s.available = s.available === '1' || s.available === true;
  document.title = 'OPAC Search · GBLMS';
  $('#main').innerHTML = `<div class="wrap">${heroHtml({ eyebrow: 'OPAC', title: 'Search the library catalogue', intro: 'Find any print or digital title by title, author, subject or ISBN, and see live availability.' })}
    <form class="glass searchbar" id="f" role="search"><div class="row main">
      <label class="field"><span class="sr">Search in</span><select name="field" aria-label="Search in"><option value="all">All fields</option><option value="title">Title</option><option value="author">Author</option><option value="subject">Subject</option><option value="isbn">ISBN</option><option value="publisher">Publisher</option></select></label>
      <label class="field"><span class="sr">Search</span><input name="q" type="search" placeholder="Type a title, author, subject or ISBN…" enterkeyhint="search" autocomplete="off"></label>
      <button class="btn solid" type="submit">${ico('search')} Search</button></div>
      <div class="advbar"><button class="btn sm filt-toggle" id="advbtn" type="button" aria-expanded="false" aria-controls="advpanel">${ico('filter')}<span>Filters &amp; sorting</span><span class="filt-count" id="advcount" hidden></span>${ico('chevron', 'ic chev')}</button></div>
      <div class="adv" id="advpanel"><div class="adv-in" inert>
        <div class="filters">
          <label class="field">Category / section<select name="category"><option>All</option>${cats.map(c => `<option>${esc(c)}</option>`).join('')}</select></label>
          <label class="field">Language<select name="language"><option>All</option>${langs.map(c => `<option>${esc(c)}</option>`).join('')}</select></label>
          <label class="field">Year from<input name="yearFrom" type="number" inputmode="numeric" min="1000" max="2100" placeholder="e.g. 2015"></label>
          <label class="field">Year to<input name="yearTo" type="number" inputmode="numeric" min="1000" max="2100" placeholder="e.g. 2026"></label>
          <label class="field">Sort by<select name="sort"><option value="title">Title A–Z</option><option value="author">Author A–Z</option><option value="newest">Newest first</option><option value="added">Recently added</option></select></label>
          <div class="field filt-avail"><span class="lbl-spacer" aria-hidden="true">Availability</span><label class="check"><input type="checkbox" name="available"> Available now only</label></div>
        </div>
        <div class="filt-actions"><button class="btn sm" type="button" id="advreset">Reset filters</button></div>
      </div></div></form>
    <div class="resbar"><span id="count" aria-live="polite"></span></div><div class="books" id="res"></div><div class="pager" id="pg"></div></div>`;
  const f = $('#f'), limit = 20;
  for (const [k, v] of Object.entries(s)) { const el = f.elements[k]; if (el) el.type === 'checkbox' ? el.checked = v : el.value = v; }
  const panel = $('#advpanel'), abtn = $('#advbtn');
  const setAdv = open => { panel.classList.toggle('open', open); abtn.setAttribute('aria-expanded', open); panel.firstElementChild.inert = !open; };
  abtn.onclick = () => setAdv(abtn.getAttribute('aria-expanded') !== 'true');
  const activeCount = () => ['category', 'language'].filter(k => f[k].value !== 'All').length + ['yearFrom', 'yearTo'].filter(k => f[k].value).length + (f.available.checked ? 1 : 0) + (f.sort.value !== 'title' ? 1 : 0);
  const badge = () => { const n = activeCount(), c = $('#advcount'); c.hidden = !n; c.textContent = n; };
  $('#advreset').onclick = () => { f.category.value = 'All'; f.language.value = 'All'; f.yearFrom.value = ''; f.yearTo.value = ''; f.sort.value = 'title'; f.available.checked = false; load(1, true); };
  if (s.advanced || activeCount()) setAdv(true);
  let list = [];
  const read = () => ({ q: f.q.value.trim(), field: f.field.value, category: f.category.value, language: f.language.value, yearFrom: f.yearFrom.value, yearTo: f.yearTo.value, available: f.available.checked, sort: f.sort.value });
  async function load(page = 1, push = false) {
    const st = { ...read(), page }; setQs(st, push); badge(); $('#res').innerHTML = skeletons(8);
    const p = new URLSearchParams({ limit, page, sort: st.sort, field: st.field }); for (const k of ['q', 'category', 'language', 'yearFrom', 'yearTo']) if (st[k] && st[k] !== 'All') p.set(k, st[k]); if (st.available) p.set('available', '1');
    try {
      const r = await api('/books?' + p); list = r.books;
      $('#count').textContent = r.total ? `${r.total} ${r.total === 1 ? 'title' : 'titles'} found` : '';
      $('#res').innerHTML = r.books.length ? r.books.map((b, i) => `<button class="glass lift book" data-i="${i}" aria-label="${esc(b.title)} — details">${coverHtml(b, b.hasFile ? 'E-copy' : '')}<h3>${esc(b.title)}</h3><span class="by">${esc(b.author)}</span>
        <span class="meta"><span class="badge ${b.available ? '' : 'warn'}">${b.available ? b.available + ' available' : 'All on loan'}</span></span></button>`).join('')
        : `<div class="empty glass" style="grid-column:1/-1"><b>No titles found</b>Try fewer words, a different field, or clear the filters.</div>`;
      pager($('#pg'), r.total, limit, page, n => load(n, true));
    } catch (e) { $('#res').innerHTML = `<div class="empty glass" style="grid-column:1/-1"><b>Could not load the catalogue</b>${esc(e.message)}</div>`; }
  }
  f.onsubmit = e => { e.preventDefault(); load(1, true); };
  f.addEventListener('change', e => { if (e.target.name !== 'q') load(1, true); });
  $('#res').onclick = e => { const b = e.target.closest('[data-i]'); if (b) bookDialog(list[Number(b.dataset.i)]); };
  addEventListener('popstate', () => location.reload());
  load(s.page);
}
function bookDialog(b) {
  const u = GB.user, row = (k, v) => v ? `<dt>${k}</dt><dd>${esc(v)}</dd>` : '';
  openDialog(`<div class="dlg"><button class="ibtn x" data-x aria-label="Close">${ico('x')}</button>${coverHtml(b)}<div><h2>${esc(b.title)}</h2><p class="mute">${esc(b.author)}</p>
    <span class="badge ${b.available ? '' : 'warn'}">${b.available ? `${b.available} of ${b.copies} copies available` : `All ${b.copies} copies on loan`}</span>
    <dl class="dl">${row('Category', b.category)}${row('Subject', b.subject)}${row('Publisher', b.publisher)}${row('Edition', b.edition)}${row('Year', b.year)}${row('Language', b.language)}${row('ISBN', b.isbn)}${row('Shelf / rack', b.rack)}</dl>
    ${b.description ? `<p class="prose mute">${esc(b.description)}</p>` : ''}
    <div class="actions">${b.hasFile ? (u ? `<a class="btn solid" href="/files/b/${b.id}" target="_blank" rel="noopener">Read PDF</a><a class="btn" href="/files/b/${b.id}?download=1">Download ${fsize(b.fileSize)}</a>` : `<a class="btn solid" href="${loginHref}">Log in to read the PDF</a>`) : ''}
    ${u ? `<a class="btn ${b.hasFile ? '' : 'solid'}" href="/portal#${u.role === 'admin' ? 'books' : 'browse'}">${u.role === 'admin' ? 'Edit in admin panel' : (b.available ? 'Borrow in my portal' : 'Reserve in my portal')}</a>` : `<a class="btn ${b.hasFile ? '' : 'solid'}" href="${loginHref}">Log in to borrow</a>`}</div></div></div>`);
}

/* ───────── E-Library ───────── */
const TYPE_LABEL = { All: 'All', Book: 'Books', Notes: 'Notes & sheets', 'Question bank': 'Question banks', Journal: 'Journals', Other: 'Other' };
async function pageElibrary() {
  const s = Object.assign({ type: 'All', dept: 'All', q: '', page: 1 }, Object.fromEntries(qs())); s.page = Number(s.page) || 1;
  document.title = 'E-Library · GBLMS';
  $('#main').innerHTML = `<div class="wrap">${heroHtml({ eyebrow: 'E-Library', title: 'Books, journals, notes and more', intro: 'Digital books, journals, lecture notes, sheets and question banks provided by the university. Browse freely; sign in to read or download.' })}
    <form class="glass searchbar" id="f" role="search"><div class="row" style="grid-template-columns:1fr"><div class="filters" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr))">
      <label class="field"><span class="sr">Search</span><input name="q" type="search" placeholder="Search title, author, subject…" enterkeyhint="search" autocomplete="off"></label>
      <label class="field"><span class="sr">Department</span><select name="dept" aria-label="Department"><option>All</option></select></label></div></div></form>
    <div class="chips" id="chips" role="tablist" aria-label="Resource type" style="margin-top:12px"></div>
    <div class="resbar"><span id="count" aria-live="polite"></span>${GB.user ? '' : `<a class="btn sm" href="${loginHref}">Log in to open files</a>`}</div>
    <div class="books" id="res"></div><div class="pager" id="pg"></div></div>`;
  const f = $('#f'), limit = 20; let list = [], meta = null;
  f.q.value = s.q;
  async function load(page = 1, push = false) {
    const st = { q: f.q.value.trim(), dept: f.dept.value, type: s.type, page }; setQs(st, push); $('#res').innerHTML = skeletons(8);
    const p = new URLSearchParams({ limit, page }); if (st.q) p.set('q', st.q); if (st.dept !== 'All') p.set('dept', st.dept); if (st.type !== 'All') p.set('type', st.type);
    try {
      const r = await api('/elibrary?' + p); list = r.items;
      if (!meta) { meta = r; f.dept.innerHTML = '<option>All</option>' + r.departments.map(d => `<option>${esc(d)}</option>`).join(''); f.dept.value = s.dept; if (f.dept.value !== s.dept) f.dept.value = 'All'; }
      $('#chips').innerHTML = ['All', ...r.types].map(t => `<button class="chip ${s.type === t ? 'on' : ''}" role="tab" aria-selected="${s.type === t}" data-t="${esc(t)}">${TYPE_LABEL[t] || esc(t)}<small>${t === 'All' ? r.all : (r.counts[t] || 0)}</small></button>`).join('');
      $('#count').textContent = r.total ? `${r.total} ${r.total === 1 ? 'item' : 'items'}` : '';
      $('#res').innerHTML = r.items.length ? r.items.map((x, i) => `<button class="glass lift book" data-i="${i}" aria-label="${esc(x.title)} — details">${coverHtml(x, (x.ext || '').replace('.', '').toUpperCase())}<h3>${esc(x.title)}</h3><span class="by">${esc(x.author || x.category || '')}</span>
        <span class="meta"><span class="badge mute">${esc(TYPE_LABEL[x.type] ? x.type : x.type)}</span>${x.dept ? `<span class="badge mute">${esc(x.dept)}</span>` : ''}</span></button>`).join('')
        : `<div class="empty glass" style="grid-column:1/-1"><b>Nothing here yet</b>${r.all ? 'No items match your filters.' : 'The library has not published any digital items yet. Please check back soon.'}</div>`;
      pager($('#pg'), r.total, limit, page, n => load(n, true));
    } catch (e) { $('#res').innerHTML = `<div class="empty glass" style="grid-column:1/-1"><b>Could not load the E-Library</b>${esc(e.message)}</div>`; }
  }
  f.onsubmit = e => { e.preventDefault(); load(1, true); };
  f.q.oninput = debounce(() => load(1)); f.dept.onchange = () => load(1, true);
  $('#chips').onclick = e => { const b = e.target.closest('[data-t]'); if (b) { s.type = b.dataset.t; load(1, true); } };
  $('#res').onclick = e => { const b = e.target.closest('[data-i]'); if (b) itemDialog(list[Number(b.dataset.i)]); };
  addEventListener('popstate', () => location.reload());
  load(s.page);
}
function itemDialog(x) {
  const u = GB.user, row = (k, v) => v ? `<dt>${k}</dt><dd>${esc(v)}</dd>` : '';
  openDialog(`<div class="dlg"><button class="ibtn x" data-x aria-label="Close">${ico('x')}</button>${coverHtml(x, (x.ext || '').replace('.', '').toUpperCase())}<div><h2>${esc(x.title)}</h2>${x.author ? `<p class="mute">${esc(x.author)}</p>` : ''}
    <dl class="dl">${row('Type', x.type)}${row('Category', x.category)}${row('Department', x.dept)}${row('File', ((x.ext || '').replace('.', '').toUpperCase() + ' · ' + fsize(x.fileSize)).replace(/^ · /, ''))}</dl>
    ${x.description ? `<p class="prose mute">${esc(x.description)}</p>` : ''}
    <div class="actions">${u ? `<a class="btn solid" href="${esc(x.readUrl)}" target="_blank" rel="noopener">Read online</a><a class="btn" href="${esc(x.downloadUrl)}">${ico('download')} Download</a>` : `<a class="btn solid" href="${loginHref}">Log in to read or download</a>`}</div></div></div>`);
}

/* ───────── Services ───────── */
async function pageServices() {
  const [pg, site] = await Promise.all([api('/pages'), api('/site')]), v = pg.services, r = pg.rules;
  document.title = v.title + ' · GBLMS';
  $('#main').innerHTML = `<div class="wrap">${heroHtml(v)}
    <section class="grid" aria-label="Services">${v.items.map(i => `<article class="glass card lift"><div class="ico-chip">${ico(i.icon)}</div><h3>${esc(i.title)}</h3><p class="mute">${esc(i.text)}</p></article>`).join('')}</section>
    <section class="sec"><h2>Borrowing rules at a glance</h2><p class="lead">These limits are set by the library and always shown here as currently in force.</p>
      <div class="grid stats"><div class="glass stat"><b>${r.LOAN_DAYS}</b><span>days per loan</span></div><div class="glass stat"><b>${r.MAX_LOANS}</b><span>books at a time</span></div>
      <div class="glass stat"><b>${r.MAX_RENEWALS}×${r.RENEW_DAYS}</b><span>renewals × days</span></div><div class="glass stat"><b>৳${r.FINE_PER_DAY}</b><span>fine per overdue day</span></div></div></section>
    <section class="sec"><div class="glass card facts"><div class="fact"><span class="ico-chip">${ico('clock')}</span><div><b>Opening hours</b><span>${esc(site.hours)}</span></div></div>
      <div class="fact"><span class="ico-chip">${ico('pin')}</span><div><b>Where</b><span>${esc(site.address)}</span></div></div></div>
      <div class="actions"><a class="btn solid" href="/opac">Search the catalogue</a><a class="btn" href="/elibrary">Browse the E-Library</a><a class="btn" href="/helpdesk">Ask the Helpdesk</a></div></section></div>`;
}


/* smooth open/close for the FAQ accordion (native <details> snaps open and shut) */
function faqAnimate(root) {
  if (!root) return;
  const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches, DUR = 380, EASE = 'cubic-bezier(.16,1,.3,1)';
  $$('details.faq', root).forEach(d => {
    const sum = d.firstElementChild, ans = $('.ans', d), inn = $('.ans-in', d); let run = null;
    const finish = open => { d.classList.remove('closing'); if (!open) d.open = false; ans.style.height = ans.style.opacity = ''; run = null; };
    sum.addEventListener('click', e => {
      e.preventDefault();
      const opening = !d.open || d.classList.contains('closing');
      if (run) run.cancel();
      const from = ans.getBoundingClientRect().height;
      if (opening) { d.open = true; d.classList.remove('closing'); } else d.classList.add('closing');
      sum.setAttribute('aria-expanded', opening);
      if (calm()) { finish(opening); return; }
      const to = opening ? inn.scrollHeight : 0, start = from;
      ans.style.overflow = 'hidden';
      run = ans.animate([{ height: start + 'px', opacity: opening ? 0 : 1 }, { height: to + 'px', opacity: opening ? 1 : 0 }], { duration: DUR, easing: EASE });
      inn.animate([{ transform: opening ? 'translateY(-8px)' : 'translateY(0)' }, { transform: opening ? 'translateY(0)' : 'translateY(-8px)' }], { duration: DUR, easing: EASE });
      run.onfinish = () => finish(opening); run.oncancel = () => { };
    });
    sum.setAttribute('aria-expanded', d.open);
  });
}

/* ───────── Helpdesk (Contact) ───────── */
async function pageHelpdesk() {
  const [pg, site] = await Promise.all([api('/pages'), api('/site')]), h = pg.helpdesk;
  document.title = 'Helpdesk · GBLMS';
  $('#main').innerHTML = `<div class="wrap">${heroHtml(h)}
    <section class="grid two help-grid">
      <form class="glass card help-form" id="cf" novalidate aria-labelledby="cft"><h2 id="cft">Send us a message</h2>
        <div class="formgrid"><label class="field">Your name<input name="name" required autocomplete="name" maxlength="80"></label><label class="field">Email<input name="email" type="email" required autocomplete="email" inputmode="email" maxlength="120"></label></div>
        <label class="field">Topic<select name="topic">${h.topics.map(t => `<option>${esc(t)}</option>`).join('')}</select></label>
        <label class="field grow">Message<textarea name="message" required minlength="5" maxlength="2000" placeholder="How can we help?"></textarea></label>
        <p class="msgline" id="msg" role="status" aria-live="polite"></p><button class="btn solid" id="send" type="submit">Send message</button></form>
      <div class="glass card help-info"><h2>Contact details</h2><div class="help-facts">
        <div class="fact"><span class="ico-chip">${ico('phone')}</span><div><b>Phone</b><a href="tel:${esc(site.phone.replace(/[^\d+]/g, ''))}">${esc(site.phone)}</a></div></div>
        <div class="fact"><span class="ico-chip">${ico('mail')}</span><div><b>Email</b><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></div></div>
        <div class="fact"><span class="ico-chip">${ico('pin')}</span><div><b>Address</b><span>${esc(site.address)}</span></div></div>
        <div class="fact"><span class="ico-chip">${ico('clock')}</span><div><b>Opening hours</b><span>${esc(site.hours)}</span></div></div></div>
        ${site.mapUrl ? `<a class="btn" href="${esc(site.mapUrl)}" target="_blank" rel="noopener">${ico('pin')} Open in Maps</a>` : ''}</div></section>
    ${h.faqs.length ? `<section class="sec" id="faq"><h2>Frequently asked questions</h2><div class="faqs" style="margin-top:16px">${h.faqs.map(x => `<details class="glass faq"><summary>${esc(x.q)}</summary><div class="ans"><div class="ans-in">${esc(x.a)}</div></div></details>`).join('')}</div></section>` : ''}</div>`;
  faqAnimate($('#faq'));
  const f = $('#cf'), msg = $('#msg');
  if (GB.user) { f.elements.name.value = GB.user.name || ''; f.email.value = GB.user.email || ''; }
  f.onsubmit = async e => {
    e.preventDefault(); msg.className = 'msgline';
    if (f.elements.name.value.trim().length < 2 || !f.email.validity.valid || f.message.value.trim().length < 5) { msg.className = 'msgline err'; msg.textContent = 'Please enter your name, a valid email and a message.'; return; }
    const btn = $('#send'); btn.disabled = true; btn.textContent = 'Sending…';
    try { await api('/contact', { method: 'POST', body: { name: f.elements.name.value, email: f.email.value, topic: f.topic.value, message: f.message.value } }); f.message.value = ''; msg.className = 'msgline ok'; msg.textContent = 'Thank you! Your message has been sent. We will reply by email.'; }
    catch (err) { msg.className = 'msgline err'; msg.textContent = err.message; }
    btn.disabled = false; btn.textContent = 'Send message';
  };
}

(async () => {
  const fn = { about: pageAbout, opac: pageOpac, elibrary: pageElibrary, services: pageServices, helpdesk: pageHelpdesk }[document.body.dataset.page];
  await initChrome();
  try { await fn(); } catch (e) { $('#main').innerHTML = `<div class="wrap"><div class="empty glass" style="margin-top:40px"><b>Could not load this page</b>${esc(e.message)}</div></div>`; }
  if (location.hash && $(location.hash)) $(location.hash).scrollIntoView();
})();
