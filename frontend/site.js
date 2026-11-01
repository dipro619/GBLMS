'use strict';
/* GBLMS public pages — shared header, footer, theme and helpers */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fsize = b => !b ? '' : b < 1024 ? b + ' B' : b < 1048576 ? Math.round(b / 1024) + ' KB' : (b / 1048576).toFixed(1) + ' MB';
const debounce = (f, ms = 300) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => f(...a), ms); }; };
async function api(path, opt = {}) {
  const r = await fetch('/api' + path, { credentials: 'same-origin', ...opt, headers: opt.body ? { 'Content-Type': 'application/json' } : {}, body: opt.body ? JSON.stringify(opt.body) : undefined });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Something went wrong. Please try again.');
  return d;
}
function toast(msg) { const t = Object.assign(document.createElement('div'), { className: 'toast', textContent: msg, role: 'status' }); document.body.append(t); setTimeout(() => t.remove(), 3500); }

const P = {
  book: 'M12 6.04A8.97 8.97 0 0 0 6 3.75c-1.05 0-2.06.18-3 .51v14.25A9 9 0 0 1 6 18c2.3 0 4.4.87 6 2.29m0-14.25a8.97 8.97 0 0 1 6-2.29c1.05 0 2.06.18 3 .51v14.25A9 9 0 0 0 18 18a8.97 8.97 0 0 0-6 2.29m0-14.25v14.25',
  search: 'm21 21-5.2-5.2m0 0A7.5 7.5 0 1 0 5.2 5.2a7.5 7.5 0 0 0 10.6 10.6Z',
  wifi: 'M8.3 15a5.25 5.25 0 0 1 7.4 0M5.1 11.9a9.75 9.75 0 0 1 13.8 0M1.9 8.7a14.25 14.25 0 0 1 20.2 0M12 19h.01',
  print: 'M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v7H7z',
  study: 'M4 19.5V5a2 2 0 0 1 2-2h12v14H6a2 2 0 0 0-2 2Zm0 0A2 2 0 0 0 6 21h12M9 7h6',
  research: 'M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3',
  laptop: 'M4 5h16v11H4zM2 19h20',
  users: 'M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM20 19v-1.5a3.5 3.5 0 0 0-2.5-3.35M15.5 4.3a3.5 3.5 0 0 1 0 6.4',
  cap: 'm2 9 10-5 10 5-10 5L2 9Zm4 2.5V16c0 1.1 2.7 3 6 3s6-1.9 6-3v-4.5M22 9v6',
  clock: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z',
  help: 'M9.1 9a3 3 0 1 1 4.6 2.5c-.9.6-1.7 1.2-1.7 2.5M12 17.5v.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z',
  mail: 'M3 6h18v12H3zM3 7l9 7 9-7',
  pin: 'M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11ZM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  moon: 'M21 14.5A9 9 0 0 1 9.5 3a9 9 0 1 0 11.5 11.5Z',
  menu: 'M4 6h16M4 12h16M4 18h16', x: 'M6 6l12 12M18 6 6 18',
  facebook: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z',
  linkedin: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  whatsapp: 'M7.9 20A9 9 0 1 0 4 16.1L2 22zM9 9.5c0 3 2.5 5.5 5.5 5.5l1.5-1.5-2-1-1 .8c-1-.4-1.9-1.3-2.3-2.3l.8-1-1-2z',
  chevron: 'm6 9 6 6 6-6',
  filter: 'M4 6h16M7 12h10M10 18h4',
  file: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5ZM14 3v5h5',
  download: 'M12 4v11m0 0-4-4m4 4 4-4M5 20h14'
};
/* social networks: same icons and brand colours as the home page */
const SOC = [
  ['facebook', 'Facebook', '#1877F2', 'M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z'],
  ['youtube', 'YouTube', '#FF0000', 'M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3z'],
  ['linkedin', 'LinkedIn', '#0A66C2', 'M4.5 3A1.8 1.8 0 1 0 4.5 6.6 1.8 1.8 0 0 0 4.5 3zM3 8.5h3.1V21H3zM9 8.5h3v1.7c.5-.9 1.7-2 3.5-2 3.4 0 4 2.2 4 5.1V21h-3.1v-6.6c0-1.5 0-3.4-2.1-3.4s-2.4 1.6-2.4 3.3V21H9z'],
  ['whatsapp', 'WhatsApp', '#25D366', 'M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm5.8 14.1c-.2.7-1.4 1.3-1.9 1.3-.5.1-1.1.1-1.8-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5-4.5s-1.2-1.6-1.2-3.1.8-2.2 1.1-2.5c.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.3.5-.4.4c-.1.2-.3.3-.1.6.2.3.7 1.2 1.5 1.9 1 .9 1.9 1.2 2.2 1.3.3.1.4.1.6-.1l.8-1c.2-.2.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.8-.1 1.5z'],
  ['x', 'X', '#888888', 'M17.8 3h3l-6.5 7.5L22 21h-6l-4.7-6.1L5.9 21h-3l7-8L2 3h6.1l4.3 5.6zm-1 16.2h1.7L7.3 4.7H5.5z'],
  ['instagram', 'Instagram', '#E4405F', null]
];
const socSvg = x => x[3] ? `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${x[3]}"/></svg>`
  : '<svg class="st" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle class="dot" cx="17.3" cy="6.7" r="1.1"/></svg>';
// all = false (default): only the networks that have a link are drawn, nothing at all if none; all = true: draw every network (unlinked ones dimmed)
function socialRow(links = {}, { all = false, cls = 'soc', label = '' } = {}) {
  const list = SOC.filter(x => all || links[x[0]]);
  return list.length ? `<div class="${cls}"${label ? ` aria-label="${esc(label)}"` : ''}>${list.map(x => links[x[0]]
    ? `<a href="${esc(links[x[0]])}" target="_blank" rel="noopener noreferrer" aria-label="${x[1]}" title="${x[1]}" style="--c:${x[2]}">${socSvg(x)}</a>`
    : `<a class="off" aria-disabled="true" tabindex="-1" role="img" aria-label="${x[1]} (link not added yet)" title="${x[1]} (not added yet)" style="--c:${x[2]}">${socSvg(x)}</a>`).join('')}</div>` : '';
}

const ico = (n, cls = 'ic') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[n] || P.book}"/></svg>`;

/* theme: same key as the website and the portal */
const root = document.documentElement;
if (localStorage.theme) root.dataset.theme = localStorage.theme; else if (matchMedia('(prefers-color-scheme:dark)').matches) root.dataset.theme = 'dark';

const MENU = [
  { h: '/', t: 'Home', k: 'home' },
  { h: '/about', t: 'About Library', k: 'about', sub: [['History', '/about#history'], ['Vision', '/about#vision'], ['Mission', '/about#mission'], ['Team', '/about#team']] },
  { h: '/opac', t: 'OPAC Search', k: 'opac', sub: [['Title', '/opac?field=title'], ['Author', '/opac?field=author'], ['ISBN', '/opac?field=isbn'], ['Advanced', '/opac?advanced=1']] },
  { h: '/elibrary', t: 'E-Library', k: 'elibrary', sub: [['Books', '/elibrary?type=Book'], ['Journals', '/elibrary?type=Journal'], ['Notes & sheets', '/elibrary?type=Notes'], ['Question banks', '/elibrary?type=Question%20bank']] },
  { h: '/services', t: 'Services', k: 'services' },
  { h: '/helpdesk', t: 'Helpdesk', k: 'helpdesk' }
];
const NAV = MENU.map(m => [m.h, m.t, m.k]);
const GB = window.GB = { user: null, site: null };
const loginHref = '#login'; // every "Log in" link opens the login box on the page you are on

async function initChrome() {
  const page = document.body.dataset.page, cur = m => m.k === page ? ' aria-current="page"' : '';
  const items = MENU.map(m => `<li${m.sub ? ' class="has"' : ''}><a href="${m.h}"${cur(m)} tabindex="0">${m.t}</a>${m.sub ? `<ul>${m.sub.map(([t, h]) => `<li><a href="${h}">${t}</a></li>`).join('')}</ul>` : ''}</li>`).join('');
  const loginIco = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"/></svg>';
  // same markup as the home page header, so the menu, hover effects and Log in look identical everywhere
  document.body.insertAdjacentHTML('afterbegin', `<a class="skip" href="#main">Skip to content</a><div class="orb o1"></div><div class="orb o2"></div><div class="orb o3"></div>
  <nav class="glass" aria-label="Main"><a class="brand" href="/" aria-label="GBLMS home"><span id="logo" style="display:inline-flex">${ico('book', '')}</span>GBLMS</a>
    <ul class="menu" id="menu">${items}<li class="login"><a href="#login" id="loginBtn" tabindex="0" aria-haspopup="dialog">${loginIco}<span id="loginTxt">Log in</span></a></li></ul>
    <div class="act"><button class="ico" id="lang" type="button" aria-label="Language" style="font-size:13px;font-weight:600">বাং</button><button class="ico" id="theme" aria-label="Toggle dark or light mode"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${P.moon}"/></svg></button>
      <button class="ico" id="burger" aria-label="Menu" aria-expanded="false" aria-controls="menu"><svg class="hamburger" viewBox="0 0 24 24"><path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/></svg><svg class="cross" viewBox="0 0 24 24"><path d="M6 18 18 6M6 6l12 12"/></svg></button></div></nav>`);
  $('#main') || $('main').setAttribute('id', 'main');
  if (window.GBI18N) GBI18N.sync();
  document.body.insertAdjacentHTML('beforeend', '<footer id="footer"></footer>');
  $('#theme').onclick = () => { const t = root.dataset.theme === 'dark' ? 'light' : 'dark'; root.dataset.theme = t; localStorage.theme = t; };
  const mn = $('#menu'), bg = $('#burger'), closeAll = () => { mn.classList.remove('open'); bg.classList.remove('open'); bg.setAttribute('aria-expanded', false); $$('.menu ul.open, .menu .has.open').forEach(x => x.classList.remove('open')); };
  bg.onclick = () => { const o = mn.classList.toggle('open'); bg.setAttribute('aria-expanded', o); bg.classList.toggle('open', o); };
  mn.addEventListener('click', e => {
    const a = e.target.closest('a'); if (!a) return;
    const li = a.parentElement, sub = li.classList.contains('has') ? a.nextElementSibling : null;
    if (a.getAttribute('href') === '#login') { closeAll(); return; }               // the login box handler (below) opens the box
    if (sub) {
      const small = innerWidth <= 1280;
      // phone/tablet menu: first tap opens the list, second tap opens the page. Touch laptops: same, using the hover list
      if (small && !sub.classList.contains('open')) { e.preventDefault(); sub.classList.add('open'); return; }
      if (!small && matchMedia('(hover: none)').matches && !li.classList.contains('open')) { e.preventDefault(); $$('.menu .has.open').forEach(x => x.classList.remove('open')); li.classList.add('open'); return; }
    }
    closeAll();
  });
  document.addEventListener('click', e => { if (!e.target.closest('nav')) closeAll(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });
  addEventListener('resize', () => { if (innerWidth > 1280) closeAll(); });
  // every login link opens the login box right here instead of sending you to the home page
  document.addEventListener('click', e => { const a = e.target.closest('a[href="#login"]'); if (!a || GB.user) return; e.preventDefault(); const g = $('#gdlg'); if (g && g.open) g.close(); openLogin(); });

  const [me, site] = await Promise.all([api('/auth/me').catch(() => ({})), api('/site').catch(() => null)]);
  GB.user = me.user || null; GB.site = site;
  if (GB.user) { const a = $('#loginBtn'), n = (GB.user.name || 'Portal').trim().split(/\s+/)[0]; a.href = '/portal'; a.removeAttribute('aria-haspopup'); a.classList.add('me'); a.title = GB.user.name;
    a.innerHTML = `<span class="nav-av">${GB.user.avatar ? `<img src="${esc(GB.user.avatar)}" alt="">` : esc((GB.user.name || '?').trim()[0].toUpperCase())}</span><span id="loginTxt">${GB.user.role === 'admin' ? 'Admin panel' : esc(n)}</span>`; }
  else if (location.hash === '#login') { history.replaceState(null, '', location.pathname + location.search); openLogin(); }
  if (site) {
    if (site.logo) $('#logo').innerHTML = `<img class="logo-img" src="${esc(site.logo)}" alt="">`;
    const link = (h, t) => `<li><a href="${h}">${t}</a></li>`, linkIco = '<svg class="btn-ico" style="width:13px;height:13px;margin-left:5px" viewBox="0 0 24 24"><path d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/></svg>';
    const hasLinks = (site.links || []).length;
    // same footer as the home page: brand + social icons, quick links, resources, contact
    $('#footer').outerHTML = `<footer id="contact"><div class="wrap"><div class="glass fwrap"><div class="fgrid${hasLinks ? '' : ' f3'}">
      <div><a class="brand" href="/">${site.logo ? `<img class="logo-img" src="${esc(site.logo)}" alt="">` : ico('book', '')}GBLMS</a>
        <p>${esc(site.footerText)}</p>${socialRow(site.social, { label: 'Social media' })}</div>
      <div><h4>Quick Links</h4><ul>${NAV.map(([h, t]) => link(h, t)).join('')}${link('/portal', 'Student Panel')}</ul></div>
      ${hasLinks ? `<div><h4>Resources &amp; Databases</h4><ul>${site.links.map(l => `<li><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a></li>`).join('')}</ul></div>` : ''}
      <div><h4>Contact</h4>
        <p class="contact-line"><svg class="inline-ico" viewBox="0 0 24 24"><path d="${P.mail}"/></svg> <a href="mailto:${esc(site.email)}">${esc(site.email)}</a></p>
        <p class="contact-line"><svg class="inline-ico" viewBox="0 0 24 24"><path d="${P.phone}"/></svg> <a href="tel:${esc(site.phone.replace(/[^\d+]/g, ''))}">${esc(site.phone)}</a></p>
        <h4 style="margin-top:18px">Location</h4><p>${esc(site.address)}</p><p>${esc(site.hours)}</p>
        ${site.mapUrl ? `<p><a class="pill" style="padding:6px 14px;font-size:13px" href="${esc(site.mapUrl)}" target="_blank" rel="noopener"><span>Open in Maps</span> ${linkIco}</a></p>` : ''}
        <p><a class="pill" style="padding:6px 14px;font-size:13px" href="/helpdesk"><span>Send a message</span></a></p></div>
      </div><div class="fbar">${esc(site.copyright)}</div></div></div></footer>`;
  }
}

/* ───────── login box (same flow as the home page, but it stays on the current page) ───────── */
let loginCfg = null;
async function openLogin(note) {
  let d = $('#login');
  if (!d) {
    document.body.insertAdjacentHTML('beforeend', `<dialog id="login" aria-labelledby="lgT"><div class="lg"><button class="ibtn x" data-lx aria-label="Close">${ico('x')}</button>
      <span class="eyebrow">GBLMS</span><h2 id="lgT">Log in as</h2><p class="mute" id="lgP">Choose how you want to continue.</p>
      <div class="lg-opts" id="lgOpts"><button class="glass lift lg-opt" data-role="admin" type="button">${ico('users')}<b>Admin</b><small>Manage books, members and notices</small></button>
        <button class="glass lift lg-opt" data-role="user" type="button">${ico('cap')}<b>User</b><small>Borrow, reserve and read</small></button></div>
      <form id="lgForm" hidden novalidate><div class="lg-reg" id="lgReg" hidden>
        <label class="field">Full name<input name="name" autocomplete="name" maxlength="80"></label>
        <label class="field">Student ID<input name="studentId" autocomplete="off" maxlength="40"></label></div>
        <label class="field"><span id="lgIdL">Email</span><input name="id" autocomplete="username" required maxlength="120"></label>
        <div class="lg-reg" id="lgReg2" hidden><label class="field">Phone number<input name="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="20"></label>
          <label class="field">Department<select name="dept"><option value="">Select department</option></select></label>
          <div class="formgrid"><label class="field">Batch<input name="batch" placeholder="e.g. 45" maxlength="20"></label><label class="field">Semester<select name="semester"><option value="">Select</option></select></label></div></div>
        <label class="field">Password<input name="password" type="password" autocomplete="current-password" required maxlength="100"></label>
        <p class="msgline err" id="lgErr" role="alert"></p><button class="btn solid block" id="lgGo" type="submit">Log in</button>
        <div class="lg-links"><button type="button" id="lgBack">← Back</button><button type="button" id="lgSwitch">Create an account</button></div></form></div></dialog>`);
    d = $('#login'); const f = $('#lgForm'); let role = null, reg = false;
    const view = () => {
      $('#lgOpts').hidden = !!role; f.hidden = !role; $('#lgT').textContent = !role ? 'Log in as' : reg ? 'Create your account' : role === 'admin' ? 'Admin log in' : 'User log in';
      $('#lgP').textContent = !role ? (note || 'Choose how you want to continue.') : reg ? 'Fill in your student details to join the library.' : 'Enter your details to continue.';
      $('#lgReg').hidden = $('#lgReg2').hidden = !reg; $('#lgIdL').textContent = role === 'admin' ? 'Admin username' : 'Email'; f.elements.id.type = role === 'admin' ? 'text' : 'email';
      f.elements.password.autocomplete = reg ? 'new-password' : 'current-password'; $('#lgGo').textContent = reg ? 'Create account' : 'Log in';
      $('#lgSwitch').hidden = role === 'admin'; $('#lgSwitch').textContent = reg ? 'I already have an account' : 'Create an account'; $('#lgErr').textContent = '';
    };
    const fill = async () => {
      if (!loginCfg) { try { loginCfg = await api('/settings/public'); } catch (_) { return; } }
      f.elements.dept.innerHTML = '<option value="">Select department</option>' + loginCfg.departments.map(x => `<option>${esc(x)}</option>`).join('');
      f.elements.semester.innerHTML = '<option value="">Select</option>' + Array.from({ length: loginCfg.semesters }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('');
    };
    $('#lgOpts').onclick = e => { const b = e.target.closest('[data-role]'); if (!b) return; role = b.dataset.role; reg = false; view(); f.elements.id.focus(); };
    $('#lgBack').onclick = () => { role = null; reg = false; view(); };
    $('#lgSwitch').onclick = async () => { reg = !reg; view(); if (reg) await fill(); };
    d.addEventListener('click', e => { if (e.target === d || e.target.closest('[data-lx]')) d.close(); });
    f.onsubmit = async e => {
      e.preventDefault(); const v = Object.fromEntries(new FormData(f)), btn = $('#lgGo'), err = $('#lgErr'); err.textContent = '';
      if (!v.id.trim() || !v.password) { err.textContent = 'Please fill in all the fields.'; return; }
      btn.disabled = true; btn.textContent = 'Please wait…';
      try {
        if (reg) await api('/auth/register', { method: 'POST', body: { name: v.name, studentId: v.studentId, email: v.id, phone: v.phone, dept: v.dept, batch: v.batch, semester: v.semester, password: v.password } });
        else await api('/auth/login', { method: 'POST', body: { id: v.id.trim(), password: v.password, role } });
        location.reload(); // stay on this page; the header now shows your name
      } catch (x) { err.textContent = x.message; btn.disabled = false; btn.textContent = reg ? 'Create account' : 'Log in'; }
    };
    d._reset = () => { role = null; reg = false; f.reset(); view(); }; view();
  }
  d._reset(); if (note) $('#lgP').textContent = note; if (!d.open) d.showModal();
  setTimeout(() => { const b = $('.lg-opt', d); b && b.focus(); }, 30);
}

/* shared detail dialog */
function openDialog(html) {
  let d = $('#gdlg'); if (!d) { d = document.createElement('dialog'); d.id = 'gdlg'; document.body.append(d); d.addEventListener('click', e => { if (e.target === d || e.target.closest('[data-x]')) d.close(); }); }
  d.innerHTML = html; d.showModal(); return d;
}
const coverHtml = (x, tag = '') => `<div class="cov">${x.cover ? `<img src="${esc(x.cover)}" alt="Cover of ${esc(x.title)}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'ph',textContent:this.alt.slice(9)}))">` : `<div class="ph">${ico('book')}${esc(x.title)}</div>`}${tag ? `<span class="tag">${esc(tag)}</span>` : ''}</div>`;
