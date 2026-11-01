'use strict';
/* GBLMS AI assistant — one chatbot for EVERY page (home, About, OPAC, E-Library, Services, Helpdesk, Portal).
   Answers in English or Bengali (follows the language button), uses live data from the server
   (opening hours, contact details, borrowing rules and a real catalogue search) and keeps the conversation
   while you move between pages. */
(() => {
  if (window.__gbChat) return; window.__gbChat = true;
  const $ = (s, r = document) => r.querySelector(s);
  const getLang = () => { try { return localStorage.getItem('lang') === 'bn' ? 'bn' : 'en'; } catch (_) { return 'en'; } };
  const BD = '০১২৩৪৫৬৭৮৯', bd = v => String(v).replace(/\d/g, d => BD[d]);
  const store = {
    get: k => { try { return JSON.parse(sessionStorage.getItem(k)); } catch (_) { return null; } },
    set: (k, v) => { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (_) { } }
  };

  /* ───────── texts ───────── */
  const UI = {
    en: {
      title: 'GBLMS Assistant', open: 'Open AI chatbot', close: 'Close chat', mic: 'Voice input', send: 'Send message', ph: 'Ask anything…',
      hello: "Hi! I'm the Gono Bishwabidyalay library assistant. Ask me about books, opening hours, borrowing rules, the E-Library or how to contact us.",
      noVoice: 'Voice input is not supported in this browser.', listening: 'Listening…',
      chips: [['Library hours', 'library hours'], ['Borrowing rules', 'borrowing rules'], ['Find a book', 'find a book'], ['E-Library', 'e-library'], ['Contact', 'contact']]
    },
    bn: {
      title: 'জিবিএলএমএস সহকারী', open: 'এআই চ্যাটবট খুলুন', close: 'চ্যাট বন্ধ করুন', mic: 'ভয়েস ইনপুট', send: 'বার্তা পাঠান', ph: 'যেকোনো কিছু জিজ্ঞাসা করুন…',
      hello: 'হ্যালো! আমি গণ বিশ্ববিদ্যালয় লাইব্রেরির সহকারী। বই, খোলার সময়, ধার নেওয়ার নিয়ম, ই-লাইব্রেরি বা যোগাযোগ সম্পর্কে জিজ্ঞাসা করুন।',
      noVoice: 'এই ব্রাউজারে ভয়েস ইনপুট সমর্থিত নয়।', listening: 'শুনছি…',
      chips: [['লাইব্রেরির সময়', 'লাইব্রেরির সময়'], ['ধার নেওয়ার নিয়ম', 'ধার নেওয়ার নিয়ম'], ['বই খুঁজুন', 'বই খুঁজুন'], ['ই-লাইব্রেরি', 'ই-লাইব্রেরি'], ['যোগাযোগ', 'যোগাযোগ']]
    }
  };
  const DEF_HOURS = 'Sat–Thu, 8:00 AM – 8:00 PM', DEF_HOURS_BN = 'শনি–বৃহস্পতি, সকাল ৮:০০ – রাত ৮:০০';
  const DEF_ADDR = 'Gono Bishwabidyalay, Mirzanagar, Savar, Dhaka, Bangladesh', DEF_ADDR_BN = 'গণ বিশ্ববিদ্যালয়, মির্জানগর, সাভার, ঢাকা, বাংলাদেশ';

  /* ───────── data ───────── */
  const api = p => fetch('/api' + p, { credentials: 'same-origin' }).then(r => r.ok ? r.json() : Promise.reject(new Error(r.status)));
  let siteP, pagesP;
  const getSite = () => siteP || (siteP = api('/site').catch(() => { siteP = null; return null; }));
  const getPages = () => pagesP || (pagesP = api('/pages').catch(() => { pagesP = null; return null; }));

  /* ───────── the assistant's brain ───────── */
  const STOP = /\b(please|pls|can|could|you|me|i|to|a|an|the|of|for|about|on|by|is|are|there|any|have|has|do|does|got|want|need|looking|look|find|search|show|get|give|book|books|titles?|copy|copies|available|availability)\b|বই|বইগুলো|খুঁজে|খুঁজুন|খুঁজ|দাও|দিন|দেখাও|দেখান|আছে|কি|কী|চাই|একটি|সম্পর্কে|নিয়ে|লেখা/gi;
  const has = (q, re) => re.test(q);
  async function answer(raw, L) {
    const q = raw.toLowerCase().trim(), bn = L === 'bn', out = { text: '', links: [] };
    const link = (t, h, sub, go) => out.links.push({ t, h, sub, go });
    const site = await getSite();
    if (has(q, /^(hi|hello|hey|hola|salam|assalam|হ্যালো|হাই|সালাম|আসসালামু|নমস্কার)\b/)) { out.text = bn ? 'হ্যালো! আজ আমি কীভাবে সাহায্য করতে পারি?' : 'Hello! How can I help you today?'; return out; }
    if (has(q, /\b(thanks?|thank you|thx)\b|ধন্যবাদ|শুকরিয়া/)) { out.text = bn ? 'আপনাকেও ধন্যবাদ! আর কিছু জানার থাকলে বলুন।' : "You're welcome! Ask me anything else any time."; return out; }

    const explicitBook = has(q, /\b(find|search|look(ing)? for|show me|do you have|have you got|any books?|books? (on|about|by))\b|বই|খুঁজ/) && !has(q, /\b(rules?|hours?|e-?library|borrow|renew|fine)\b|নিয়ম|সময়|ই-লাইব্রেরি|ধার|জরিমানা/);
    const term = raw.replace(STOP, ' ').replace(/[?!.,;:“”"']/g, ' ').replace(/\s+/g, ' ').trim();
    if (explicitBook) {
      if (term.length >= 2) return searchBooks(term, bn);
      out.text = bn ? 'কোন বই খুঁজছেন? শিরোনাম, লেখক, বিষয় বা আইএসবিএন লিখুন।' : 'Which book are you looking for? Type a title, author, subject or ISBN.';
      link(bn ? 'ওপ্যাক সার্চ খুলুন' : 'Open the OPAC search', '/opac', '', true); return out;
    }
    if (has(q, /\b(hours?|open(ing)?|clos(e|ing)|timings?|schedule|when)\b|সময়|খোলা|বন্ধ|কখন/)) {
      const h = site && site.hours ? (bn && site.hours === DEF_HOURS ? DEF_HOURS_BN : site.hours) : null;
      out.text = h ? (bn ? `লাইব্রেরি খোলা থাকে: ${h}।` : `The library is open ${h}.`) : (bn ? 'খোলার সময় এই মুহূর্তে আনতে পারছি না। যোগাযোগ পেজ দেখুন।' : "I couldn't load the opening hours right now. Please check the Helpdesk page.");
      link(bn ? 'যোগাযোগ ও ঠিকানা' : 'Contact & location', '/helpdesk', '', true); return out;
    }
    if (has(q, /\b(borrow|loans?|rules?|renew(al)?s?|fines?|due|overdue|late|return|limit|reserve|reservation)\b|ধার|নিয়ম|জরিমানা|ফেরত|নবায়ন|রিজার্ভ/)) {
      const pg = await getPages(), r = pg && pg.rules;
      if (r) out.text = bn
        ? `একসাথে সর্বোচ্চ ${bd(r.MAX_LOANS)}টি বই ${bd(r.LOAN_DAYS)} দিনের জন্য ধার নিতে পারবেন। কেউ রিজার্ভ না করে থাকলে প্রতিবার ${bd(r.RENEW_DAYS)} দিন করে সর্বোচ্চ ${bd(r.MAX_RENEWALS)} বার নবায়ন করা যায়। মেয়াদ পার হলে প্রতিদিন ৳${bd(r.FINE_PER_DAY)} জরিমানা।`
        : `You can borrow up to ${r.MAX_LOANS} books at a time for ${r.LOAN_DAYS} days. If nobody has reserved a book you can renew it up to ${r.MAX_RENEWALS} times, ${r.RENEW_DAYS} days each. The fine is ৳${r.FINE_PER_DAY} for every overdue day.`;
      else out.text = bn ? 'নিয়মগুলো এখন আনতে পারছি না। সেবাসমূহ পেজ দেখুন।' : "I couldn't load the rules right now. Please see the Services page.";
      link(bn ? 'সেবাসমূহ পেজ' : 'Services page', '/services', '', true); return out;
    }
    if (has(q, /e-?library|e-?books?|pdf|journals?|notes?|sheets?|question banks?|past papers?|digital|ই-লাইব্রেরি|ই-বুক|নোট|জার্নাল|প্রশ্ন/)) {
      out.text = bn ? 'ই-লাইব্রেরিতে বিশ্ববিদ্যালয় প্রদত্ত ডিজিটাল বই, জার্নাল, লেকচার নোট, শিট ও প্রশ্নব্যাংক আছে। ঘুরে দেখা সবার জন্য খোলা; পড়তে বা ডাউনলোড করতে লগ ইন করতে হবে।'
        : 'The E-Library has digital books, journals, lecture notes, sheets and question banks from the university. Anyone can browse; you need to log in to read or download.';
      link(bn ? 'ই-লাইব্রেরি খুলুন' : 'Open the E-Library', '/elibrary', '', true);
      link(bn ? 'প্রশ্নব্যাংক' : 'Question banks', '/elibrary?type=Question%20bank'); link(bn ? 'নোট ও শিট' : 'Notes & sheets', '/elibrary?type=Notes'); return out;
    }
    if (has(q, /\b(contact|phone|call|e-?mail|mail|address|where|location|map|reach|message)\b|যোগাযোগ|ফোন|ইমেইল|ঠিকানা|কোথায়|অবস্থান/)) {
      if (site) {
        const addr = bn && site.address === DEF_ADDR ? DEF_ADDR_BN : site.address, hrs = bn && site.hours === DEF_HOURS ? DEF_HOURS_BN : site.hours;
        out.text = bn ? `ফোন: ${site.phone}\nইমেইল: ${site.email}\nঠিকানা: ${addr}\nসময়: ${hrs}` : `Phone: ${site.phone}\nEmail: ${site.email}\nAddress: ${addr}\nHours: ${hrs}`;
        if (site.mapUrl) link(bn ? 'ম্যাপে দেখুন' : 'Open in Maps', site.mapUrl);
      } else out.text = bn ? 'যোগাযোগের তথ্য এখন আনতে পারছি না।' : "I couldn't load the contact details right now.";
      link(bn ? 'বার্তা পাঠান (হেল্পডেস্ক)' : 'Send a message (Helpdesk)', '/helpdesk', '', true); return out;
    }
    if (has(q, /account|register|sign ?up|log ?in|login|password|member|অ্যাকাউন্ট|রেজিস্টার|লগ ইন|পাসওয়ার্ড|সদস্য/)) {
      out.text = bn ? 'লগ ইন বোতামে চাপ দিন → ইউজার → “অ্যাকাউন্ট তৈরি করুন” বেছে স্টুডেন্ট আইডি, ইমেইল, ফোন, বিভাগ, ব্যাচ ও সেমিস্টার দিন। তারপর সঙ্গে সঙ্গে বই ধার নিতে ও ই-রিসোর্স পড়তে পারবেন।'
        : 'Press Log in → User → “Create an account”, then fill in your student ID, email, phone, department, batch and semester. You can borrow books and read e-resources straight away.';
      link(bn ? 'আমার পোর্টাল' : 'My portal', '/portal', '', true); return out;
    }
    if (has(q, /services?|wi-?fi|print|photocopy|research|reading|study|room|seat|computer|সেবা|ওয়াই|প্রিন্ট|ফটোকপি|গবেষণা|রুম|আসন|কম্পিউটার/)) {
      out.text = bn ? 'আমাদের সেবার মধ্যে আছে: ধার ও সার্কুলেশন, ওপ্যাক ক্যাটালগ, ই-লাইব্রেরি, পাঠকক্ষ ও গ্রুপ স্টাডি টেবিল, ফটোকপি ও প্রিন্ট, গবেষণা সহায়তা, ওয়াই-ফাই ও কম্পিউটার এবং তথ্যদক্ষতা সেশন।'
        : 'We offer lending & circulation, the OPAC catalogue, the E-Library, reading halls and group study tables, photocopy & print, research support, Wi-Fi & computers, and information-skills sessions.';
      link(bn ? 'সব সেবা দেখুন' : 'See all services', '/services', '', true); return out;
    }
    if (has(q, /about|history|vision|mission|team|librarian|সম্পর্কে|ইতিহাস|ভিশন|মিশন|গ্রন্থাগারিক|টিম/)) {
      out.text = bn ? 'লাইব্রেরির ইতিহাস, ভিশন, মিশন ও ব্যবস্থাপনা টিম সম্পর্কে জানতে “লাইব্রেরি সম্পর্কে” পেজ দেখুন।' : 'You can read about the library’s history, vision, mission and management team on the About page.';
      link(bn ? 'লাইব্রেরি সম্পর্কে' : 'About Library', '/about', '', true); return out;
    }
    // anything else: treat it as a catalogue search
    if (term.length >= 2 && raw.length <= 80) return searchBooks(term, bn, true);
    out.text = bn ? 'আমি বই খোঁজা, খোলার সময়, ধার নেওয়ার নিয়ম, ই-লাইব্রেরি ও যোগাযোগে সাহায্য করতে পারি। নিচের পরামর্শগুলো থেকে একটি বেছে নিন!' : 'I can help with finding books, opening hours, borrowing rules, the E-Library and contact details. Try one of the suggestions!';
    return out;
  }
  async function searchBooks(term, bn, soft) {
    const out = { text: '', links: [] };
    try {
      const r = await api('/books?limit=4&q=' + encodeURIComponent(term));
      if (r.books && r.books.length) {
        out.text = bn ? `“${term}” এর জন্য ${bd(r.total)}টি ফলাফল পেয়েছি:` : `I found ${r.total} ${r.total === 1 ? 'title' : 'titles'} for “${term}”:`;
        for (const b of r.books) out.links.push({ t: b.title, h: '/opac?q=' + encodeURIComponent(b.title) + '&field=title', sub: `${b.author || ''}${b.author ? ' · ' : ''}${b.available ? (bn ? `${bd(b.available)}টি পাওয়া যাচ্ছে` : `${b.available} available`) : (bn ? 'সব ধার দেওয়া আছে' : 'all on loan')}${b.hasFile ? (bn ? ' · ই-কপি আছে' : ' · e-copy') : ''}` });
        if (r.total > r.books.length) out.links.push({ t: bn ? `সব ${bd(r.total)}টি ফলাফল দেখুন` : `See all ${r.total} results`, h: '/opac?q=' + encodeURIComponent(term), go: true });
        return out;
      }
    } catch (_) { out.text = bn ? 'ক্যাটালগ এখন খোলা যাচ্ছে না। কিছুক্ষণ পর আবার চেষ্টা করুন।' : "I can't reach the catalogue right now. Please try again in a moment."; return out; }
    out.text = soft
      ? (bn ? 'এটা ঠিক বুঝতে পারিনি, আর ক্যাটালগেও “' + term + '” নামে কিছু পাইনি। বই, সময়, নিয়ম বা যোগাযোগ নিয়ে জিজ্ঞাসা করে দেখুন।' : `I'm not sure what you mean, and I found nothing in the catalogue for “${term}”. Try asking about books, hours, rules or contact details.`)
      : (bn ? `ক্যাটালগে “${term}” নামে কোনো বই পাইনি। অন্য শব্দ দিয়ে চেষ্টা করুন বা ওপ্যাকে উন্নত সার্চ ব্যবহার করুন।` : `I found no titles for “${term}”. Try different words, or use the advanced OPAC search.`);
    out.links.push({ t: bn ? 'ওপ্যাক সার্চ খুলুন' : 'Open the OPAC search', h: '/opac?advanced=1', go: true });
    return out;
  }

  /* ───────── interface ───────── */
  const MIC = 'M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z';
  const SEND = 'M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5';
  const CHAT = 'M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.502 49.188 49.188 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z';
  const svg = d => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
  let L = getLang(), btn, dr, msgs, inp, hist = store.get('gb-chat') || [];

  function build() {
    document.querySelectorAll('#chatbtn, #drawer').forEach(e => e.remove());          // never two chatbots on one page
    document.body.insertAdjacentHTML('beforeend', `<button id="chatbtn" type="button" aria-expanded="false" aria-controls="drawer">${svg(CHAT)}</button>
      <div id="drawer" class="glass" role="dialog" aria-modal="false" aria-hidden="true" inert>
        <div class="drawer-head"><div class="drawer-head-info"><span class="drawer-status-dot"></span><b id="cbTitle"></b></div>
          <button class="drawer-close" type="button" id="cbClose"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 18 18 6M6 6l12 12"/></svg></button></div>
        <div class="cb-chips" id="cbChips"></div>
        <div id="msgs" role="log" aria-live="polite"></div>
        <form class="chat-input-bar" id="cbForm" autocomplete="off"><input id="cin" type="text" maxlength="200" enterkeyhint="send">
          <button class="chat-btn" id="mic" type="button">${svg(MIC)}</button>
          <button class="chat-btn chat-send-btn" id="send" type="submit">${svg(SEND)}</button></form>
      </div>`);
    btn = $('#chatbtn'); dr = $('#drawer'); msgs = $('#msgs'); inp = $('#cin');
    btn.onclick = () => toggle(); $('#cbClose').onclick = () => toggle(false);
    $('#cbForm').onsubmit = e => { e.preventDefault(); const v = inp.value; inp.value = ''; ask(v); };
    $('#cbChips').onclick = e => { const c = e.target.closest('[data-q]'); if (c) ask(c.dataset.q); };
    $('#mic').onclick = listen;
    addEventListener('keydown', e => { if (e.key === 'Escape' && dr.classList.contains('show')) { toggle(false); btn.focus(); } });
    labels(); hist.length ? hist.forEach(m => paint(m)) : greet();
    if (store.get('gb-chat-open')) toggle(true, true);
  }
  function labels() {
    const t = UI[L];
    btn.setAttribute('aria-label', t.open); btn.title = t.open; dr.setAttribute('aria-label', t.title); $('#cbTitle').textContent = t.title;
    $('#cbClose').setAttribute('aria-label', t.close); $('#cbClose').title = t.close; $('#mic').setAttribute('aria-label', t.mic); $('#mic').title = t.mic;
    $('#send').setAttribute('aria-label', t.send); $('#send').title = t.send; inp.placeholder = t.ph;
    $('#cbChips').innerHTML = ''; t.chips.forEach(([label, q]) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'cb-chip'; b.dataset.q = q; b.textContent = label; $('#cbChips').append(b); });
  }
  function toggle(open, quiet) {
    const on = open === undefined ? !dr.classList.contains('show') : open;
    dr.classList.toggle('show', on); dr.inert = !on; dr.setAttribute('aria-hidden', !on); btn.setAttribute('aria-expanded', on); store.set('gb-chat-open', on);
    if (on) { msgs.scrollTop = msgs.scrollHeight; if (!quiet && matchMedia('(hover: hover)').matches) setTimeout(() => inp.focus(), 60); }
  }
  function paint(m) {
    const d = document.createElement('div'); d.className = 'cb-m ' + (m.r === 'u' ? 'u' : 'a');
    d.append(document.createTextNode(m.t));
    if (m.l && m.l.length) {
      const box = document.createElement('div'); box.className = 'cb-links';
      for (const x of m.l) {
        const a = document.createElement('a'); a.className = 'cb-link' + (x.go ? ' go' : ''); a.href = x.h;
        if (/^https?:/i.test(x.h)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
        a.append(document.createTextNode(x.t)); if (x.sub) { const s = document.createElement('small'); s.textContent = x.sub; a.append(s); }
        box.append(a);
      }
      d.append(box);
    }
    msgs.append(d); msgs.scrollTop = msgs.scrollHeight; return d;
  }
  function push(m) { hist.push(m); hist = hist.slice(-40); store.set('gb-chat', hist); return paint(m); }
  function greet() { hist = []; msgs.textContent = ''; push({ r: 'a', t: UI[L].hello, g: 1 }); }
  async function ask(raw) {
    raw = (raw || '').trim(); if (!raw) return; L = getLang();
    push({ r: 'u', t: raw });
    const dots = document.createElement('div'); dots.className = 'cb-m a typing'; dots.setAttribute('aria-label', '…'); dots.innerHTML = '<i></i><i></i><i></i>'; msgs.append(dots); msgs.scrollTop = msgs.scrollHeight;
    let res; const wait = new Promise(r => setTimeout(r, 450));
    const useL = /[\u0980-\u09FF]/.test(raw) ? 'bn' : L;
    try { [res] = await Promise.all([answer(raw, useL), wait]); } catch (_) { res = { text: useL === 'bn' ? 'দুঃখিত, কিছু ভুল হয়েছে। আবার চেষ্টা করুন।' : 'Sorry, something went wrong. Please try again.', links: [] }; await wait; }
    dots.remove(); push({ r: 'a', t: res.text, l: res.links });
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  function listen() {
    L = getLang(); toggle(true, true);
    if (!SR) { push({ r: 'a', t: UI[L].noVoice }); return; }
    const r = new SR(), mic = $('#mic'); r.lang = L === 'bn' ? 'bn-BD' : 'en-US'; mic.classList.add('listening'); inp.placeholder = UI[L].listening;
    r.onresult = e => ask(e.results[0][0].transcript);
    r.onend = r.onerror = () => { mic.classList.remove('listening'); inp.placeholder = UI[L].ph; };
    try { r.start(); } catch (_) { }
  }
  /* the language button (on any page) re-labels the assistant; if only the greeting is showing it is re-written too */
  addEventListener('gb:lang', () => { L = getLang(); if (!dr) return; labels(); if (hist.length === 1 && hist[0].g) greet(); });
  addEventListener('storage', e => { if (e.key === 'lang' && dr) { L = getLang(); labels(); if (hist.length === 1 && hist[0].g) greet(); } });

  window.toggleChat = toggle; window.listen = listen;          // the home page's "AI Chatbot & Voice" card calls these
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
