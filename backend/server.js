'use strict';
/**
 * GBLMS backend — zero dependencies, Node >= 18.
 *   npm start      ->  http://localhost:4000 (settings in backend/.env)
 * Data lives in ./data/db.json (created + seeded on first run).
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

/* ───────────────────────── .env (no dependency needed) ───────────────────────── */
// reads backend/.env when the server is started directly; variables already set in the real environment win
if (require.main === module) {
  try {
    for (const line of fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/)) {
      const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
      if (!m || line.trim().startsWith('#')) continue;
      let v = m[2]; if (/^(['"]).*\1$/.test(v)) v = v.slice(1, -1);
      if (process.env[m[1]] === undefined) process.env[m[1]] = v;
    }
  } catch (_) { /* no .env file: defaults are used */ }
}

/* ───────────────────────── config ───────────────────────── */
const port = process.env.PORT || 4000;
// Hosting platforms (Render, Railway, Heroku…) need the server on 0.0.0.0, otherwise they report "No open ports detected".
// On a known host it is always 0.0.0.0 (even if HOST=localhost was copied from .env into the dashboard).
// On your own computer it stays on localhost for safety unless HOST says otherwise.
const ON_HOST = !!(process.env.RENDER || process.env.RAILWAY_ENVIRONMENT || process.env.DYNO);
const HOST = ON_HOST ? '0.0.0.0' : (process.env.HOST || (process.env.PORT ? '0.0.0.0' : 'localhost'));
// project layout: gblms/frontend (public website) · gblms/admin (admin + member portal) · gblms/backend (this file, API, data)
const ROOT = path.join(__dirname, '..');
const FRONTEND_DIR = path.join(ROOT, 'frontend');
const ADMIN_DIR = path.join(ROOT, 'admin');
const STATIC_DIRS = [FRONTEND_DIR, ADMIN_DIR]; // the website is looked up first, then the admin portal
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const COOKIE = 'gblms_sid';
const SESSION_MS = 7 * 24 * 3600e3;
const DAY = 24 * 3600e3;
const RULES = { LOAN_DAYS: 14, RENEW_DAYS: 7, MAX_RENEWALS: 2, MAX_LOANS: 3, FINE_PER_DAY: 5 };
const NOTICE_CATS = ['Academic', 'Library', 'Events'];
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB) || 50;
const MAX_UPLOAD = MAX_UPLOAD_MB * 1024 * 1024, MAX_AVATAR = 2 * 1024 * 1024;
const MAX_COVER = 8 * 1024 * 1024;           // book covers / logo (the admin page also shrinks them before upload)
const SEMESTERS = 12;
// text shown on the public website; every value can be changed from Admin → Website
const SITE_DEFAULTS = {
  email: 'library@gonouniversity.edu.bd', phone: '+880 1XXX-XXXXXX',
  address: 'Gono Bishwabidyalay, Mirzanagar, Savar, Dhaka, Bangladesh', hours: 'Sat–Thu, 8:00 AM – 8:00 PM',
  mapUrl: 'https://www.google.com/maps/search/?api=1&query=Gono+Bishwabidyalay+Savar',
  heroEyebrow: 'GONO BISHWABIDYALAYA', heroTitle: 'Your Library, Reimagined as Liquid Glass.',
  heroText: 'GBLMS — the Gono Bishwabidyalay Library Management System. Search, locate, borrow and research across print and digital collections.',
  footerText: 'Gono Bishwabidyalay Library Management System. Knowledge, within reach.',
  copyright: '© 2026 Gono Bishwabidyalay · GBLMS. All rights reserved.',
  social: { facebook: '', youtube: '', linkedin: '', whatsapp: '', x: '', instagram: '' },
  links: [{ label: 'IEEE Xplore', url: 'https://ieeexplore.ieee.org' }, { label: 'SpringerLink', url: 'https://link.springer.com' },
    { label: 'ScienceDirect', url: 'https://www.sciencedirect.com' }, { label: 'JSTOR', url: 'https://www.jstor.org' }, { label: 'DOAJ', url: 'https://doaj.org' }]
};

// About / Services / Helpdesk page content; every value can be changed from Admin → Pages
const ICONS = ['book', 'search', 'wifi', 'print', 'study', 'research', 'laptop', 'users', 'cap', 'clock', 'globe', 'help'];
const PAGES_DEFAULTS = {
  about: {
    eyebrow: 'About the Library', title: 'A home for learning at Gono Bishwabidyalay',
    intro: 'The central library supports teaching, learning and research with print collections, digital resources and a calm place to study.',
    history: 'Gono Bishwabidyalay was founded to widen access to higher education. From a small reading room the library has grown into a central collection serving every department, with print books, journals, past question papers and an expanding digital library.',
    vision: 'To be a welcoming, technology-enabled library where every student and researcher can find, use and create knowledge.',
    mission: 'To collect, organise and share quality learning resources, teach information skills, and give every member quick, fair and friendly service.',
    values: [{ title: 'Access for all', text: 'Resources and help are open to every student, teacher and staff member.' },
      { title: 'Accuracy', text: 'A well-organised catalogue so you find the right item quickly.' },
      { title: 'Service', text: 'Friendly, prompt support from the library team.' }],
    stats: [{ label: 'Print volumes', value: '25,000+' }, { label: 'E-resources', value: '1,000+' }, { label: 'Reading seats', value: '300' }, { label: 'Departments served', value: '10' }],
    teamTitle: 'Library management team', teamIntro: 'The people who run the library and are happy to help. Reach them on social media or WhatsApp.',
    team: [{ name: 'Chief Librarian', role: 'Head of the Library', bio: 'Leads collection development, services and library policy.', facebook: '', whatsapp: '', linkedin: '' },
      { name: 'Assistant Librarian', role: 'Cataloguing & OPAC', bio: 'Maintains the catalogue and helps with research queries.', facebook: '', whatsapp: '', linkedin: '' },
      { name: 'Library Officer', role: 'Circulation desk', bio: 'Handles borrowing, returns, renewals and reservations.', facebook: '', whatsapp: '', linkedin: '' }]
  },
  services: {
    eyebrow: 'Services', title: 'Everything the library offers',
    intro: 'From borrowing a textbook to getting help with a research paper, these are the services available to members.',
    items: [
      { icon: 'book', title: 'Lending & circulation', text: 'Borrow books with your library account, renew online and reserve titles that are on loan.' },
      { icon: 'search', title: 'OPAC catalogue', text: 'Search the whole collection by title, author, subject or ISBN and see live availability.' },
      { icon: 'laptop', title: 'E-library', text: 'Read or download e-books, journals, lecture notes, question banks and more provided by the university.' },
      { icon: 'study', title: 'Reading halls', text: 'Quiet reading areas and group study tables for individual and team work.' },
      { icon: 'print', title: 'Photocopy & print', text: 'Low-cost photocopying and printing at the service counter.' },
      { icon: 'research', title: 'Research support', text: 'Help with literature search, referencing and accessing licensed databases.' },
      { icon: 'wifi', title: 'Wi-Fi & computers', text: 'Internet-connected computers and campus Wi-Fi inside the library.' },
      { icon: 'cap', title: 'Information skills sessions', text: 'Short orientation and workshop sessions for new students and researchers.' }
    ]
  },
  helpdesk: {
    eyebrow: 'Helpdesk', title: 'We are here to help',
    intro: 'Ask a question, report a problem or request a book. The library team replies by email.',
    topics: ['General question', 'Account or login problem', 'Book request / purchase suggestion', 'E-library access', 'Fines and payments', 'Complaint or feedback'],
    faqs: [
      { q: 'How do I get a library account?', a: 'Use Log in → User → Create an account and fill in your student details. You can start borrowing and reading e-resources immediately.' },
      { q: 'How many books can I borrow and for how long?', a: 'The current limits are shown on the Services page and in your portal. Loans can be renewed if nobody has reserved the book.' },
      { q: 'How is the fine calculated?', a: 'A daily fine applies for each day a book is overdue. You can see any outstanding fine in My loans, and pay it at the circulation desk.' },
      { q: 'I cannot open an e-library file. What should I do?', a: 'Log in first — files are for members only. If it still fails, send us the title and what you see on the screen using the form on this page.' },
      { q: 'Can I suggest a book for the library?', a: 'Yes. Choose “Book request / purchase suggestion” in the form and include the title, author and edition.' }
    ]
  }
};
const RES_TYPES = ['Book', 'Notes', 'Question bank', 'Journal', 'Other'];
const DEFAULT_DEPTS = ['CSE', 'EEE', 'Civil Engineering', 'BBA', 'Economics', 'English', 'Law', 'Pharmacy', 'Public Health', 'Journalism & Media'];
// downloadable file types (no html/svg/js, so an uploaded file can never run as a page)
const FILE_TYPES = { '.pdf': 'application/pdf', '.epub': 'application/epub+zip', '.txt': 'text/plain; charset=utf-8',
  '.doc': 'application/msword', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.ppt': 'application/vnd.ms-powerpoint', '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.xls': 'application/vnd.ms-excel', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };
const INLINE_EXT = new Set(['.pdf', '.txt', '.jpg', '.jpeg', '.png']);
const IMG_MIME = { '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

/* ───────────────────────── tiny helpers ───────────────────────── */
class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
const bad = (m, s = 400) => new HttpError(s, m);
const now = () => Date.now();
const iso = t => new Date(t).toISOString();
const clean = (v, max = 200) => String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
function need(v, label, min = 1, max = 200) {
  const s = clean(v, max + 1);
  if (s.length < min) throw bad(`${label} is required`);
  if (s.length > max) throw bad(`${label} is too long`);
  return s;
}
const isEmail = s => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
const normPhone = s => String(s ?? '').replace(/[\s\-().]/g, '');

/* ───────────────────────── database (JSON file) ───────────────────────── */
let db;
let timer = null;
function flush() {
  clearTimeout(timer); timer = null;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db));
  fs.renameSync(tmp, DB_FILE);
}
const save = () => { if (!timer) timer = setTimeout(flush, 40); };
const nextId = k => (db.seq[k] = (db.seq[k] || 0) + 1);
['exit', 'SIGINT', 'SIGTERM'].forEach(sig => process.on(sig, () => { try { if (timer) flush(); } catch (_) {} if (sig !== 'exit') process.exit(0); }));

function hashPw(pw, salt = crypto.randomBytes(16).toString('hex')) {
  return { salt, hash: crypto.scryptSync(pw, salt, 64).toString('hex') };
}
function checkPw(pw, u) {
  const h = crypto.scryptSync(pw, u.salt, 64);
  const o = Buffer.from(u.hash, 'hex');
  return h.length === o.length && crypto.timingSafeEqual(h, o);
}

function ensureShape() {
  for (const k of ['users', 'books', 'loans', 'reservations', 'notices', 'messages', 'resources']) db[k] = db[k] || [];
  db.sessions = db.sessions || {}; db.seq = db.seq || {};
  db.settings = db.settings || {};
  if (!Array.isArray(db.settings.departments) || !db.settings.departments.length) db.settings.departments = [...DEFAULT_DEPTS];
  db.settings.site = { ...SITE_DEFAULTS, ...(db.settings.site || {}), social: { ...SITE_DEFAULTS.social, ...((db.settings.site || {}).social || {}) } };
  if (!Array.isArray(db.settings.site.links)) db.settings.site.links = SITE_DEFAULTS.links.map(x => ({ ...x }));
  const pg = db.settings.pages || {};
  db.settings.pages = {};
  for (const k of Object.keys(PAGES_DEFAULTS)) db.settings.pages[k] = { ...JSON.parse(JSON.stringify(PAGES_DEFAULTS[k])), ...(pg[k] || {}) };
  for (const m of db.settings.pages.about.team || []) if (!m.id) { m.id = crypto.randomBytes(6).toString('hex'); save(); }   // every team member gets a stable id (photos are stored against it)
  Object.assign(RULES, db.settings.rules || {});
  db.settings.rules = { ...RULES };
}
function seed() {
  db = { seq: {}, users: [], books: [], loans: [], reservations: [], notices: [], messages: [], resources: [], sessions: {}, settings: {} };
  ensureShape();
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const adminPw = process.env.ADMIN_PASSWORD || 'admin123';
  const mk = (name, email, username, role, pw, extra = {}) => {
    const u = { id: nextId('user'), name, email, username, role, studentId: '', phone: '', dept: '', batch: '', semester: null, avatarFile: '', avatarV: 0,
      active: true, createdAt: iso(now()), ...extra, ...hashPw(pw) };
    db.users.push(u); return u;
  };
  mk('Library Admin', 'admin@gono.edu.bd', 'admin', 'admin', adminPw);
  const demo = mk('Demo Student', 'student@gono.edu.bd', 'student', 'user', 'student123',
    { studentId: 'CSE-2026-001', phone: '01700000000', dept: 'CSE', batch: '2026', semester: 1 });

  const B = (title, author, category, rack, copies, year, isNew = false, isbn = '') =>
    db.books.push({ id: nextId('book'), title, author, category, rack, copies, year, isbn, isNew, addedAt: iso(now() - db.books.length * 3600e3) });
  // core catalogue
  B('Introduction to Algorithms', 'Cormen, Leiserson, Rivest & Stein', 'CSE', 'C-12', 3, 2022);
  B('Database System Concepts', 'Silberschatz, Korth & Sudarshan', 'CSE', 'C-14', 2, 2019);
  B('Clean Code', 'Robert C. Martin', 'CSE', 'C-2', 2, 2008);
  B('Operating System Concepts', 'Silberschatz, Galvin & Gagne', 'CSE', 'C-3', 2, 2018);
  B('Computer Networks', 'Andrew S. Tanenbaum & David Wetherall', 'CSE', 'C-5', 2, 2010);
  B('Artificial Intelligence: A Modern Approach', 'Stuart Russell & Peter Norvig', 'CSE', 'C-7', 2, 2020);
  B('Principles of Economics', 'N. Gregory Mankiw', 'Business', 'A-2', 2, 2020);
  B('Zero to One', 'Peter Thiel', 'Business', 'A-3', 2, 2014);
  B('The Lean Startup', 'Eric Ries', 'Business', 'A-4', 2, 2011);
  B('Sapiens: A Brief History of Humankind', 'Yuval Noah Harari', 'History', 'B-2', 2, 2011);
  B('The Hobbit', 'J.R.R. Tolkien', 'Fiction', 'B-4', 2, 1937);
  B('Pride and Prejudice', 'Jane Austen', 'Fiction', 'B-5', 2, 1813);
  B('Nineteen Eighty-Four', 'George Orwell', 'Fiction', 'B-6', 2, 1949);
  B('Constitutional Law of Bangladesh', 'Mahmudul Islam', 'Law', 'A-1', 2, 2012);
  B('Thinking, Fast and Slow', 'Daniel Kahneman', 'Psychology', 'D-1', 2, 2011);
  // new arrivals
  B('Nexus', 'Yuval Noah Harari', 'History', 'N-1', 2, 2024, true);
  B('AI Engineering', 'Chip Huyen', 'CSE', 'N-2', 2, 2025, true);
  B('Co-Intelligence', 'Ethan Mollick', 'Business', 'N-3', 2, 2024, true);
  B('James', 'Percival Everett', 'Fiction', 'N-4', 2, 2024, true);
  B('The Anxious Generation', 'Jonathan Haidt', 'Psychology', 'N-5', 2, 2024, true);
  B('Orbital', 'Samantha Harvey', 'Fiction', 'N-6', 2, 2023, true);
  B('The Wager', 'David Grann', 'History', 'N-7', 2, 2023, true);
  B('Power and Progress', 'Daron Acemoglu & Simon Johnson', 'Economics', 'N-8', 2, 2023, true);
  B('The Coming Wave', 'Mustafa Suleyman', 'Technology', 'N-9', 2, 2023, true);
  B('Fundamentals of Software Architecture', 'Mark Richards & Neal Ford', 'CSE', 'N-10', 2, 2025, true);
  B('Prophet Song', 'Paul Lynch', 'Fiction', 'N-11', 2, 2023, true);
  B('Poverty, by America', 'Matthew Desmond', 'Sociology', 'N-12', 2, 2023, true);

  [['Extended library hours during mid-term exams', 'Library', '2026-10-10'],
   ['Mid-term question bank updated for CSE', 'Academic', '2026-10-08'],
   ['Book fair and author talk at the central library', 'Events', '2026-10-20'],
   ['Return overdue books to avoid fines', 'Library', '2026-10-05'],
   ['New IEEE Xplore access guide for students', 'Academic', '2026-10-02']]
    .forEach(([title, category, date]) => db.notices.push({ id: nextId('notice'), title, category, date }));

  // a couple of demo loans so the student portal isn't empty
  const loan = (title, daysLeft) => {
    const b = db.books.find(x => x.title === title);
    db.loans.push({ id: nextId('loan'), userId: demo.id, bookId: b.id, borrowedAt: iso(now() - (RULES.LOAN_DAYS - daysLeft) * DAY),
      dueAt: iso(now() + daysLeft * DAY), returnedAt: null, renewals: 0, fine: 0, finePaid: false });
  };
  loan('Introduction to Algorithms', 2);
  loan('Operating System Concepts', 9);
  flush();
  console.log('\n  First run: database seeded.');
  console.log(`  Admin  ->  admin   / ${adminPw}${process.env.ADMIN_PASSWORD ? '' : '   (change it! set ADMIN_PASSWORD before first run)'}`);
  console.log('  Demo   ->  student@gono.edu.bd / student123\n');
}
function loadDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) return seed();
  db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  ensureShape();
}

/* ───────────────────────── domain logic ───────────────────────── */
const activeLoans = bookId => db.loans.filter(l => l.bookId === bookId && !l.returnedAt).length;
const isOverdue = l => !l.returnedAt && Date.parse(l.dueAt) < now();
const daysLate = (l, at = now()) => Math.max(0, Math.ceil((at - Date.parse(l.dueAt)) / DAY));
const readyFor = bookId => db.reservations.filter(r => r.bookId === bookId && r.status === 'ready');
const queuedFor = bookId => db.reservations.filter(r => r.bookId === bookId && r.status === 'queued');
const availableOf = b => Math.max(0, b.copies - activeLoans(b.id));

function bookView(b) {
  return { id: b.id, title: b.title, author: b.author, category: b.category, rack: b.rack, isbn: b.isbn, year: b.year, publisher: b.publisher || '', edition: b.edition || '', language: b.language || '', subject: b.subject || '', description: b.description || '',
    copies: b.copies, available: availableOf(b), reservations: queuedFor(b.id).length + readyFor(b.id).length, isNew: !!b.isNew, featured: !!b.featured, addedAt: b.addedAt,
    cover: b.cover ? `/files/bc/${b.id}?v=${b.cover.v}` : null, hasFile: !!b.file, fileName: b.file ? b.file.name : '', fileSize: b.file ? b.file.size : 0, downloads: b.downloads || 0 };
}
function userView(u) {
  return { id: u.id, name: u.name, email: u.email, username: u.username, role: u.role, studentId: u.studentId || '', phone: u.phone || '', dept: u.dept || '',
    batch: u.batch || '', semester: u.semester || null, avatar: u.avatarFile ? `/files/u/${u.id}?v=${u.avatarV || 0}` : null, active: u.active, createdAt: u.createdAt };
}
function resourceView(r) {
  return { id: r.id, title: r.title, author: r.author, type: r.type, category: r.category, dept: r.dept, description: r.description, visible: r.visible !== false,
    hasFile: !!r.file, fileName: r.file ? r.file.name : '', fileSize: r.file ? r.file.size : 0, ext: r.file ? r.file.ext : '',
    downloads: r.downloads || 0, cover: r.cover ? `/files/rc/${r.id}?v=${r.cover.v}` : null, createdAt: r.createdAt, updatedAt: r.updatedAt };
}
const COVER_KINDS = ['jpg', 'png', 'webp'], COVER_MIME = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
function setCover(owner, buf) { // owner = a book or an e-library item
  if (!buf.length) throw bad('The image is empty');
  const kind = sniff(buf);
  if (!COVER_KINDS.includes(kind)) throw bad('The cover must be a JPG, PNG or WebP image', 415);
  dropFile(owner.cover && owner.cover.stored);
  owner.cover = { stored: storeFile(buf), kind, v: now() };
}
function clearCover(owner) { dropFile(owner.cover && owner.cover.stored); owner.cover = null; }
const siteView = () => ({ ...db.settings.site, logo: db.settings.logo ? `/files/site/logo?v=${db.settings.logo.v}` : null });

/* ───────────────────────── profile + file helpers ───────────────────────── */
// Validates the student-profile fields. `required` = registration (everything must be filled in).
function profileFields(body, cur = {}, required = false) {
  const pick = k => body[k] !== undefined ? body[k] : cur[k];
  const studentId = clean(pick('studentId'), 40);
  if (required && !studentId) throw bad('Student ID is required');
  if (studentId && db.users.some(u => u.id !== cur.id && u.studentId && u.studentId.toLowerCase() === studentId.toLowerCase()))
    throw bad('This Student ID is already registered', 409);
  const phone = normPhone(pick('phone'));
  if ((required || phone) && !/^\+?\d{10,15}$/.test(phone)) throw bad('Enter a valid phone number (10 to 15 digits)');
  let dept = clean(pick('dept'), 60);
  if (required && !dept) throw bad('Department is required');
  if (dept && dept !== (cur.dept || '')) {
    const hit = db.settings.departments.find(d => d.toLowerCase() === dept.toLowerCase());
    if (!hit) throw bad('Choose a department from the list');
    dept = hit;
  }
  const batch = clean(pick('batch'), 20);
  if (required && !batch) throw bad('Batch is required');
  const sraw = pick('semester');
  const semester = sraw === '' || sraw == null ? null : Number(sraw);
  if ((required && semester === null) || (semester !== null && (!Number.isInteger(semester) || semester < 1 || semester > SEMESTERS))) throw bad(`Semester must be from 1 to ${SEMESTERS}`);
  return { studentId, phone, dept, batch, semester };
}
function emailFree(email, selfId) {
  if (!isEmail(email)) throw bad('Enter a valid email address');
  if (db.users.some(u => u.id !== selfId && u.email === email)) throw bad('An account with this email already exists', 409);
}
function sniff(buf) { // identify a file by its first bytes
  const h = buf.subarray(0, 12);
  if (h.subarray(0, 4).toString('latin1') === '%PDF') return 'pdf';
  if (h[0] === 0x89 && h.subarray(1, 4).toString('latin1') === 'PNG') return 'png';
  if (h[0] === 0xff && h[1] === 0xd8 && h[2] === 0xff) return 'jpg';
  if (h.subarray(0, 4).toString('latin1') === 'RIFF' && h.subarray(8, 12).toString('latin1') === 'WEBP') return 'webp';
  if (h[0] === 0x50 && h[1] === 0x4b && h[2] === 3 && h[3] === 4) return 'zip';          // docx / pptx / xlsx / epub
  if (h[0] === 0xd0 && h[1] === 0xcf && h[2] === 0x11 && h[3] === 0xe0) return 'ole';    // doc / ppt / xls
  return buf.subarray(0, 4096).includes(0) ? 'bin' : 'text';
}
const KIND_OK = { '.pdf': ['pdf'], '.png': ['png'], '.jpg': ['jpg'], '.jpeg': ['jpg'], '.txt': ['text'], '.epub': ['zip'], '.docx': ['zip'], '.pptx': ['zip'], '.xlsx': ['zip'],
  '.doc': ['ole'], '.ppt': ['ole'], '.xls': ['ole'] };
function storeFile(buf) { // returns the stored file name (random, so user input never touches the file system path)
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const name = crypto.randomBytes(16).toString('hex');
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
  return name;
}
function dropFile(name) { if (name && /^[0-9a-f]{32}$/.test(name)) fs.rm(path.join(UPLOAD_DIR, name), () => {}); }
function loanView(l) {
  const b = db.books.find(x => x.id === l.bookId), u = db.users.find(x => x.id === l.userId);
  const od = isOverdue(l);
  return { id: l.id, bookId: l.bookId, title: b ? b.title : '(deleted)', author: b ? b.author : '', category: b ? b.category : '',
    userId: l.userId, member: u ? u.name : '(deleted)', memberEmail: u ? u.email : '',
    borrowedAt: l.borrowedAt, dueAt: l.dueAt, returnedAt: l.returnedAt, renewals: l.renewals,
    overdue: od, daysLate: od ? daysLate(l) : 0, fine: l.returnedAt ? l.fine : (od ? daysLate(l) * RULES.FINE_PER_DAY : 0), finePaid: l.finePaid };
}
function promote(bookId) {
  const b = db.books.find(x => x.id === bookId); if (!b) return;
  let free = availableOf(b) - readyFor(bookId).length;
  for (const r of queuedFor(bookId).sort((a, c) => a.id - c.id)) {
    if (free <= 0) break;
    r.status = 'ready'; r.readyAt = iso(now()); free--;
  }
}
function outstandingFine(userId) {
  return db.loans.filter(l => l.userId === userId).reduce((s, l) => s + (l.returnedAt ? (l.finePaid ? 0 : l.fine) : (isOverdue(l) ? daysLate(l) * RULES.FINE_PER_DAY : 0)), 0);
}
function doBorrow(user, book) {
  if (!user.active) throw bad('This account is suspended', 403);
  const mine = db.loans.filter(l => l.userId === user.id && !l.returnedAt);
  if (mine.length >= RULES.MAX_LOANS) throw bad(`Loan limit reached (${RULES.MAX_LOANS} books)`, 409);
  if (mine.some(l => l.bookId === book.id)) throw bad('You already have this book', 409);
  if (mine.some(isOverdue)) throw bad('Return your overdue books first', 403);
  const ready = readyFor(book.id), myRes = ready.find(r => r.userId === user.id);
  if (availableOf(book) - (ready.length - (myRes ? 1 : 0)) < 1) throw bad('No copy is available right now. Reserve it instead.', 409);
  db.reservations.filter(r => r.userId === user.id && r.bookId === book.id && ['ready', 'queued'].includes(r.status)).forEach(r => { r.status = 'fulfilled'; });
  const l = { id: nextId('loan'), userId: user.id, bookId: book.id, borrowedAt: iso(now()), dueAt: iso(now() + RULES.LOAN_DAYS * DAY),
    returnedAt: null, renewals: 0, fine: 0, finePaid: false };
  db.loans.push(l); save(); return l;
}

/* ───────────────────────── auth ───────────────────────── */
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
function parseCookies(h) { const o = {}; (h || '').split(';').forEach(p => { const i = p.indexOf('='); if (i > 0) o[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); }); return o; }
function startSession(res, user) {
  const tok = crypto.randomBytes(32).toString('hex');
  db.sessions[sha(tok)] = { userId: user.id, exp: now() + SESSION_MS };
  save();
  res.setHeader('Set-Cookie', `${COOKIE}=${tok}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_MS / 1000}`);
}
function sessionUser(req) {
  const tok = parseCookies(req.headers.cookie)[COOKIE]; if (!tok) return null;
  const s = db.sessions[sha(tok)];
  if (!s || s.exp < now()) return null;
  const u = db.users.find(x => x.id === s.userId);
  return u && u.active ? u : null;
}
const attempts = new Map();
function throttle(key, max, windowMs) {
  const t = now(), a = (attempts.get(key) || []).filter(x => t - x < windowMs);
  if (a.length >= max) throw bad('Too many attempts. Please wait a few minutes.', 429);
  a.push(t); attempts.set(key, a);
}
setInterval(() => { const t = now(); for (const [k, v] of attempts) if (!v.some(x => t - x < 900e3)) attempts.delete(k); for (const [k, s] of Object.entries(db.sessions)) if (s.exp < t) delete db.sessions[k]; }, 600e3).unref();

/* ───────────────────────── routes ───────────────────────── */
const routes = [];
const route = (method, pattern, access, fn, opts = {}) => routes.push({ method, re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), access, fn, raw: opts.raw || 0 });
const intParam = (p, k = 'id') => { const n = Number(p[k]); if (!Number.isInteger(n)) throw bad('Invalid id'); return n; };
const findBook = id => db.books.find(b => b.id === id) || (() => { throw bad('Book not found', 404); })();
const findLoan = id => db.loans.find(l => l.id === id) || (() => { throw bad('Loan not found', 404); })();

const BUILD = '2026-10-18.6';
route('GET', '/api/health', null, () => ({ ok: true, build: BUILD, time: iso(now()) }));
route('GET', '/api/rules', null, () => RULES);
route('GET', '/api/settings/public', null, () => ({ departments: db.settings.departments, semesters: SEMESTERS, rules: RULES, resourceTypes: RES_TYPES,
  maxUploadMB: MAX_UPLOAD_MB, fileTypes: Object.keys(FILE_TYPES) }));

/* — auth — */
route('POST', '/api/auth/register', null, ({ req, res, body }) => {
  throttle('reg:' + req.socket.remoteAddress, 30, 3600e3);
  const name = need(body.name, 'Name', 2, 80), email = need(body.email, 'Email', 5, 120).toLowerCase();
  const pw = String(body.password || '');
  emailFree(email);
  const prof = profileFields(body, {}, true);
  if (pw.length < 8 || pw.length > 100) throw bad('Password must be at least 8 characters');
  const u = { id: nextId('user'), name, email, username: '', role: 'user', ...prof, avatarFile: '', avatarV: 0, active: true, createdAt: iso(now()), ...hashPw(pw) };
  db.users.push(u); save(); startSession(res, u);
  return { user: userView(u) };
});
route('POST', '/api/auth/login', null, ({ req, res, body }) => {
  const id = clean(body.id, 120).toLowerCase(), pw = String(body.password || ''), role = body.role;
  throttle('login:' + req.socket.remoteAddress + ':' + id, 8, 900e3);
  const u = db.users.find(x => x.email === id || (x.username && x.username === id));
  if (!u || !checkPw(pw, u) || (role && u.role !== role)) throw bad(role === 'admin' ? 'Invalid admin credentials' : 'Invalid email or password', 401);
  if (!u.active) throw bad('This account is suspended. Contact the library.', 403);
  startSession(res, u);
  return { user: userView(u) };
});
route('POST', '/api/auth/logout', null, ({ req, res }) => {
  const tok = parseCookies(req.headers.cookie)[COOKIE];
  if (tok) { delete db.sessions[sha(tok)]; save(); }
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
  return { ok: true };
});
route('GET', '/api/auth/me', null, ({ user }) => ({ user: user ? userView(user) : null }));
route('POST', '/api/auth/password', 'user', ({ user, body }) => {
  if (!checkPw(String(body.current || ''), user)) throw bad('Current password is incorrect', 403);
  const pw = String(body.password || '');
  if (pw.length < 8 || pw.length > 100) throw bad('New password must be at least 8 characters');
  Object.assign(user, hashPw(pw)); save(); return { ok: true };
});
route('PATCH', '/api/me', 'user', ({ user, body }) => {
  const name = body.name !== undefined ? need(body.name, 'Name', 2, 80) : user.name;
  const prof = profileFields(body, user);
  Object.assign(user, { name }, prof);
  save(); return { user: userView(user) };
});
route('PUT', '/api/me/avatar', 'user', ({ user, body }) => {
  const kind = sniff(body);
  if (!['jpg', 'png', 'webp'].includes(kind)) throw bad('Profile photo must be a JPG, PNG or WebP image', 415);
  dropFile(user.avatarFile);
  user.avatarFile = storeFile(body); user.avatarKind = kind; user.avatarV = now(); save();
  return { user: userView(user) };
}, { raw: MAX_AVATAR });
route('DELETE', '/api/me/avatar', 'user', ({ user }) => {
  dropFile(user.avatarFile); user.avatarFile = ''; user.avatarKind = ''; user.avatarV = now(); save();
  return { user: userView(user) };
});

/* — catalogue (public) — */
route('GET', '/api/categories', null, () => [...new Set(db.books.map(b => b.category))].sort());
route('GET', '/api/books', null, ({ query }) => {
  const q = clean(query.get('q'), 100).toLowerCase(), cat = clean(query.get('category'), 60), field = clean(query.get('field'), 20) || 'all';
  const onlyAvail = query.get('available') === '1', sort = clean(query.get('sort'), 20), lang = clean(query.get('language'), 40);
  const yFrom = Number(query.get('yearFrom')) || 0, yTo = Number(query.get('yearTo')) || 0;
  const limit = Math.min(Math.max(Number(query.get('limit')) || 50, 1), 100), page = Math.max(Number(query.get('page')) || 1, 1);
  const hay = b => ({ title: b.title, author: b.author, isbn: b.isbn, subject: `${b.subject || ''} ${b.category}`, publisher: b.publisher || '' })[field] ??
    `${b.title} ${b.author} ${b.isbn} ${b.category} ${b.subject || ''} ${b.publisher || ''}`;
  let list = db.books.filter(b => (!cat || cat === 'All' || b.category === cat) && (!lang || lang === 'All' || (b.language || '') === lang) &&
    (!yFrom || (b.year && b.year >= yFrom)) && (!yTo || (b.year && b.year <= yTo)) &&
    (!q || (field === 'isbn' ? String(hay(b)).replace(/[-\s]/g, '').toLowerCase().includes(q.replace(/[-\s]/g, '')) : String(hay(b)).toLowerCase().includes(q))));
  if (onlyAvail) list = list.filter(b => availableOf(b) > 0);
  const by = { title: (a, b) => a.title.localeCompare(b.title), author: (a, b) => a.author.localeCompare(b.author), newest: (a, b) => (b.year || 0) - (a.year || 0) || a.title.localeCompare(b.title),
    added: (a, b) => b.addedAt.localeCompare(a.addedAt) };
  list.sort(by[sort] || by.title);
  return { total: list.length, page, limit, books: list.slice((page - 1) * limit, page * limit).map(bookView) };
});
route('GET', '/api/languages', null, () => [...new Set(db.books.map(b => b.language).filter(Boolean))].sort());
route('GET', '/api/books/new', null, () => db.books.filter(b => b.isNew).sort((a, b) => b.addedAt.localeCompare(a.addedAt)).map(bookView));
route('GET', '/api/books/:id', null, ({ params }) => bookView(findBook(intParam(params))));
route('GET', '/api/notices', null, ({ query }) => {
  const c = clean(query.get('category'), 40);
  return db.notices.filter(n => !c || c === 'All' || n.category === c).sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
});
route('POST', '/api/contact', null, ({ req, body }) => {
  throttle('msg:' + req.socket.remoteAddress, 5, 3600e3);
  const email = need(body.email, 'Email', 5, 120).toLowerCase();
  if (!isEmail(email)) throw bad('Enter a valid email address');
  db.messages.push({ id: nextId('message'), name: need(body.name, 'Name', 2, 80), email, topic: clean(body.topic, 80), phone: clean(body.phone, 30), message: need(body.message, 'Message', 5, 2000), createdAt: iso(now()), read: false });
  save(); return { ok: true };
});

/* — member actions — */
route('GET', '/api/me/summary', 'user', ({ user }) => {
  const mine = db.loans.filter(l => l.userId === user.id && !l.returnedAt);
  return { borrowed: mine.length, dueSoon: mine.filter(l => Date.parse(l.dueAt) - now() < 3 * DAY).length,
    reservations: db.reservations.filter(r => r.userId === user.id && ['queued', 'ready'].includes(r.status)).length,
    fines: outstandingFine(user.id), maxLoans: RULES.MAX_LOANS };
});
route('GET', '/api/me/loans', 'user', ({ user }) => db.loans.filter(l => l.userId === user.id).sort((a, b) => b.id - a.id).map(loanView));
route('GET', '/api/me/reservations', 'user', ({ user }) => db.reservations.filter(r => r.userId === user.id && ['queued', 'ready'].includes(r.status)).sort((a, b) => b.id - a.id).map(r => {
  const b = db.books.find(x => x.id === r.bookId);
  const pos = r.status === 'queued' ? queuedFor(r.bookId).sort((x, y) => x.id - y.id).findIndex(x => x.id === r.id) + 1 : 0;
  return { id: r.id, bookId: r.bookId, title: b ? b.title : '(deleted)', author: b ? b.author : '', status: r.status, position: pos, createdAt: r.createdAt };
}));
route('POST', '/api/books/:id/borrow', 'user', ({ user, params }) => loanView(doBorrow(user, findBook(intParam(params)))));
route('POST', '/api/books/:id/reserve', 'user', ({ user, params }) => {
  const b = findBook(intParam(params));
  if (db.loans.some(l => l.userId === user.id && l.bookId === b.id && !l.returnedAt)) throw bad('You already have this book', 409);
  if (db.reservations.some(r => r.userId === user.id && r.bookId === b.id && ['queued', 'ready'].includes(r.status))) throw bad('You already reserved this book', 409);
  if (availableOf(b) - readyFor(b.id).length > 0) throw bad('A copy is available — you can borrow it now', 409);
  const r = { id: nextId('reservation'), userId: user.id, bookId: b.id, status: 'queued', createdAt: iso(now()) };
  db.reservations.push(r); promote(b.id); save(); return { id: r.id, status: r.status };
});
route('DELETE', '/api/reservations/:id', 'user', ({ user, params }) => {
  const r = db.reservations.find(x => x.id === intParam(params));
  if (!r || (r.userId !== user.id && user.role !== 'admin')) throw bad('Reservation not found', 404);
  r.status = 'cancelled'; promote(r.bookId); save(); return { ok: true };
});
route('POST', '/api/loans/:id/renew', 'user', ({ user, params }) => {
  const l = findLoan(intParam(params));
  if (l.userId !== user.id) throw bad('Loan not found', 404);
  if (l.returnedAt) throw bad('Already returned', 409);
  if (isOverdue(l)) throw bad('Overdue books cannot be renewed', 409);
  if (l.renewals >= RULES.MAX_RENEWALS) throw bad(`Renewal limit reached (${RULES.MAX_RENEWALS})`, 409);
  if (queuedFor(l.bookId).length + readyFor(l.bookId).length > 0) throw bad('Another member has reserved this book', 409);
  l.dueAt = iso(Date.parse(l.dueAt) + RULES.RENEW_DAYS * DAY); l.renewals++; save(); return loanView(l);
});

/* — admin — */
route('GET', '/api/admin/stats', 'admin', () => {
  const act = db.loans.filter(l => !l.returnedAt);
  return { titles: db.books.length, copies: db.books.reduce((s, b) => s + b.copies, 0), activeLoans: act.length, overdue: act.filter(isOverdue).length,
    members: db.users.filter(u => u.role === 'user').length, reservations: db.reservations.filter(r => ['queued', 'ready'].includes(r.status)).length,
    unpaidFines: db.loans.reduce((s, l) => s + (l.returnedAt && !l.finePaid ? l.fine : 0), 0) + act.filter(isOverdue).reduce((s, l) => s + daysLate(l) * RULES.FINE_PER_DAY, 0),
    unreadMessages: db.messages.filter(m => !m.read).length };
});
function bookInput(body, existing = {}) {
  const copies = body.copies === undefined ? (existing.copies ?? 1) : Number(body.copies);
  if (!Number.isInteger(copies) || copies < 0 || copies > 999) throw bad('Copies must be a whole number from 0 to 999');
  const year = body.year === '' || body.year == null ? (existing.year ?? null) : Number(body.year);
  if (year !== null && (!Number.isInteger(year) || year < 1000 || year > 2100)) throw bad('Enter a valid year');
  return { title: need(body.title ?? existing.title, 'Title', 1, 200), author: need(body.author ?? existing.author, 'Author', 1, 200),
    category: need(body.category ?? existing.category, 'Category', 1, 60), rack: clean(body.rack ?? existing.rack ?? '', 20),
    isbn: clean(body.isbn ?? existing.isbn ?? '', 20), year, copies,
    publisher: clean(body.publisher ?? existing.publisher ?? '', 120), edition: clean(body.edition ?? existing.edition ?? '', 40), language: clean(body.language ?? existing.language ?? '', 40),
    subject: clean(body.subject ?? existing.subject ?? '', 160), description: clean(body.description ?? existing.description ?? '', 2000), isNew: body.isNew === undefined ? !!existing.isNew : !!body.isNew, featured: body.featured === undefined ? !!existing.featured : !!body.featured };
}
route('POST', '/api/books', 'admin', ({ body }) => {
  const b = { id: nextId('book'), ...bookInput(body), addedAt: iso(now()) };
  db.books.push(b); save(); return bookView(b);
});
route('PUT', '/api/books/:id', 'admin', ({ params, body }) => {
  const b = findBook(intParam(params)), v = bookInput(body, b);
  if (v.copies < activeLoans(b.id)) throw bad(`${activeLoans(b.id)} copies are currently on loan`, 409);
  Object.assign(b, v); promote(b.id); save(); return bookView(b);
});
route('DELETE', '/api/books/:id', 'admin', ({ params }) => {
  const b = findBook(intParam(params));
  if (activeLoans(b.id)) throw bad('This book has active loans', 409);
  db.books = db.books.filter(x => x !== b);
  dropFile(b.cover && b.cover.stored); dropFile(b.file && b.file.stored);
  db.reservations.filter(r => r.bookId === b.id).forEach(r => { r.status = 'cancelled'; });
  save(); return { ok: true };
});
route('PUT', '/api/admin/books/:id/cover', 'admin', ({ params, body }) => { const b = findBook(intParam(params)); setCover(b, body); save(); return bookView(b); }, { raw: MAX_COVER });
route('DELETE', '/api/admin/books/:id/cover', 'admin', ({ params }) => { const b = findBook(intParam(params)); clearCover(b); save(); return bookView(b); });
route('PUT', '/api/admin/books/:id/file', 'admin', ({ params, query, body }) => {
  const b = findBook(intParam(params));
  const name = clean(query.get('name'), 200).replace(/[\\/]/g, '_') || 'book.pdf';
  if (!body.length) throw bad('The PDF is empty');
  if (sniff(body) !== 'pdf') throw bad('The book file must be a real PDF', 415);
  dropFile(b.file && b.file.stored);
  b.file = { name: /\.pdf$/i.test(name) ? name : name + '.pdf', size: body.length, stored: storeFile(body) }; save();
  return bookView(b);
}, { raw: MAX_UPLOAD });
route('DELETE', '/api/admin/books/:id/file', 'admin', ({ params }) => { const b = findBook(intParam(params)); dropFile(b.file && b.file.stored); b.file = null; save(); return bookView(b); });
route('GET', '/api/admin/loans', 'admin', ({ query }) => {
  const f = query.get('filter') || 'active';
  let list = db.loans.map(l => l);
  if (f === 'active') list = list.filter(l => !l.returnedAt);
  else if (f === 'overdue') list = list.filter(isOverdue);
  else if (f === 'fines') list = list.filter(l => l.returnedAt && l.fine > 0 && !l.finePaid);
  return list.sort((a, b) => b.id - a.id).slice(0, 300).map(loanView);
});
route('POST', '/api/admin/loans', 'admin', ({ body }) => {
  const email = clean(body.email, 120).toLowerCase();
  const u = db.users.find(x => x.email === email && x.role === 'user');
  if (!u) throw bad('No member with that email', 404);
  return loanView(doBorrow(u, findBook(Number(body.bookId))));
});
route('POST', '/api/loans/:id/return', 'admin', ({ params }) => {
  const l = findLoan(intParam(params));
  if (l.returnedAt) throw bad('Already returned', 409);
  l.returnedAt = iso(now()); l.fine = daysLate(l) * RULES.FINE_PER_DAY; l.finePaid = l.fine === 0;
  promote(l.bookId); save(); return loanView(l);
});
route('POST', '/api/loans/:id/pay-fine', 'admin', ({ params }) => {
  const l = findLoan(intParam(params));
  if (!l.returnedAt) throw bad('Return the book first', 409);
  l.finePaid = true; save(); return loanView(l);
});
route('GET', '/api/admin/users', 'admin', () => db.users.map(u => ({ ...userView(u),
  activeLoans: db.loans.filter(l => l.userId === u.id && !l.returnedAt).length, fines: outstandingFine(u.id) })));
const findUser = id => db.users.find(x => x.id === id) || (() => { throw bad('User not found', 404); })();
function pwOk(pw) { if (pw.length < 8 || pw.length > 100) throw bad('Password must be at least 8 characters'); return pw; }
route('POST', '/api/admin/users', 'admin', ({ body }) => {
  const name = need(body.name, 'Name', 2, 80), email = need(body.email, 'Email', 5, 120).toLowerCase();
  emailFree(email);
  const role = body.role === 'admin' ? 'admin' : 'user';
  const prof = profileFields(body, {}, role === 'user');
  const u = { id: nextId('user'), name, email, username: '', role, ...prof, avatarFile: '', avatarV: 0, active: true, createdAt: iso(now()), ...hashPw(pwOk(String(body.password || ''))) };
  db.users.push(u); save(); return userView(u);
});
route('PATCH', '/api/admin/users/:id', 'admin', ({ user, params, body }) => {
  const u = findUser(intParam(params));
  const self = u.id === user.id;
  if (self && (body.active !== undefined || body.role !== undefined)) throw bad('You cannot change your own role or status', 409);
  if (body.name !== undefined) u.name = need(body.name, 'Name', 2, 80);
  if (body.email !== undefined) { const email = need(body.email, 'Email', 5, 120).toLowerCase(); emailFree(email, u.id); u.email = email; }
  Object.assign(u, profileFields(body, u));
  if (body.password) Object.assign(u, hashPw(pwOk(String(body.password))));
  if (body.role !== undefined) { if (!['user', 'admin'].includes(body.role)) throw bad('Invalid role'); u.role = body.role; }
  if (body.active !== undefined) u.active = !!body.active;
  if (!u.active || body.password) for (const [k, s2] of Object.entries(db.sessions)) if (s2.userId === u.id && !(self && body.password)) delete db.sessions[k];
  save(); return userView(u);
});
route('DELETE', '/api/admin/users/:id', 'admin', ({ user, params }) => {
  const u = findUser(intParam(params));
  if (u.id === user.id) throw bad('You cannot delete your own account', 409);
  if (db.loans.some(l => l.userId === u.id && !l.returnedAt)) throw bad('This member still has books on loan', 409);
  const held = db.reservations.filter(r => r.userId === u.id && ['queued', 'ready'].includes(r.status));
  held.forEach(r => { r.status = 'cancelled'; });
  db.users = db.users.filter(x => x !== u);
  for (const [k, s2] of Object.entries(db.sessions)) if (s2.userId === u.id) delete db.sessions[k];
  dropFile(u.avatarFile); held.forEach(r => promote(r.bookId)); save(); return { ok: true };
});

/* — e-library: real files (PDF books, notes, ...) — */
const findRes = id => db.resources.find(r => r.id === id) || (() => { throw bad('Resource not found', 404); })();
function resourceInput(body, cur = {}) {
  const type = clean(body.type ?? cur.type ?? 'Book', 30);
  if (!RES_TYPES.includes(type)) throw bad('Type must be one of: ' + RES_TYPES.join(', '));
  return { title: need(body.title ?? cur.title, 'Title', 1, 200), author: clean(body.author ?? cur.author ?? '', 200), type,
    category: clean(body.category ?? cur.category ?? '', 60), dept: clean(body.dept ?? cur.dept ?? '', 60),
    description: clean(body.description ?? cur.description ?? '', 1000), visible: body.visible === undefined ? cur.visible !== false : !!body.visible };
}
// public catalogue of everything the university provides digitally; opening or downloading a file still needs a login
function libraryItems() {
  const res = db.resources.filter(r => r.visible !== false && r.file).map(r => ({ key: 'r' + r.id, kind: 'resource', id: r.id, title: r.title, author: r.author, type: r.type, category: r.category,
    dept: r.dept, description: r.description, cover: r.cover ? `/files/rc/${r.id}?v=${r.cover.v}` : null, ext: r.file.ext, fileSize: r.file.size, createdAt: r.createdAt,
    readUrl: `/files/r/${r.id}`, downloadUrl: `/files/r/${r.id}?download=1` }));
  const books = db.books.filter(b => b.file).map(b => ({ key: 'b' + b.id, kind: 'book', id: b.id, title: b.title, author: b.author, type: 'Book', category: b.category, dept: '',
    description: b.description || '', cover: b.cover ? `/files/bc/${b.id}?v=${b.cover.v}` : null, ext: '.pdf', fileSize: b.file.size, createdAt: b.addedAt,
    readUrl: `/files/b/${b.id}`, downloadUrl: `/files/b/${b.id}?download=1` }));
  return [...res, ...books].sort((x, y) => String(y.createdAt).localeCompare(String(x.createdAt)));
}
route('GET', '/api/elibrary', null, ({ query }) => {
  const q = clean(query.get('q'), 100).toLowerCase(), type = clean(query.get('type'), 30), dept = clean(query.get('dept'), 60);
  const limit = Math.min(Math.max(Number(query.get('limit')) || 24, 1), 100), page = Math.max(Number(query.get('page')) || 1, 1);
  const all = libraryItems(), counts = {}; for (const r of all) counts[r.type] = (counts[r.type] || 0) + 1;
  const list = all.filter(r => (!type || type === 'All' || r.type === type) && (!dept || dept === 'All' || r.dept === dept || !r.dept) &&
    (!q || `${r.title} ${r.author} ${r.category} ${r.dept} ${r.description}`.toLowerCase().includes(q)));
  return { total: list.length, all: all.length, page, limit, counts, types: RES_TYPES, departments: db.settings.departments, items: list.slice((page - 1) * limit, page * limit) };
});
route('GET', '/api/resources', 'user', ({ query }) => {
  const q = clean(query.get('q'), 100).toLowerCase(), type = clean(query.get('type'), 30), dept = clean(query.get('dept'), 60);
  return db.resources.filter(r => r.visible !== false && r.file && (!type || type === 'All' || r.type === type) && (!dept || dept === 'All' || r.dept === dept || !r.dept) &&
    (!q || `${r.title} ${r.author} ${r.category} ${r.dept} ${r.description}`.toLowerCase().includes(q)))
    .sort((a, b) => b.id - a.id).map(resourceView);
});
route('GET', '/api/admin/resources', 'admin', () => [...db.resources].sort((a, b) => b.id - a.id).map(resourceView));
route('POST', '/api/admin/resources', 'admin', ({ body }) => {
  const r = { id: nextId('resource'), ...resourceInput(body), file: null, downloads: 0, createdAt: iso(now()), updatedAt: iso(now()) };
  db.resources.push(r); save(); return resourceView(r);
});
route('PUT', '/api/admin/resources/:id', 'admin', ({ params, body }) => {
  const r = findRes(intParam(params)); Object.assign(r, resourceInput(body, r), { updatedAt: iso(now()) }); save(); return resourceView(r);
});
route('PUT', '/api/admin/resources/:id/file', 'admin', ({ params, query, body }) => {
  const r = findRes(intParam(params));
  const name = clean(query.get('name'), 200).replace(/[\\/]/g, '_') || 'file';
  const ext = path.extname(name).toLowerCase();
  if (!FILE_TYPES[ext]) throw bad('This file type is not allowed. Allowed: ' + Object.keys(FILE_TYPES).join(' '), 415);
  if (!body.length) throw bad('The file is empty');
  if (!KIND_OK[ext].includes(sniff(body))) throw bad(`This does not look like a real ${ext} file`, 415);
  dropFile(r.file && r.file.stored);
  r.file = { name, ext, size: body.length, stored: storeFile(body) }; r.updatedAt = iso(now()); save();
  return resourceView(r);
}, { raw: MAX_UPLOAD });
route('PUT', '/api/admin/resources/:id/cover', 'admin', ({ params, body }) => { const r = findRes(intParam(params)); setCover(r, body); save(); return resourceView(r); }, { raw: MAX_COVER });
route('DELETE', '/api/admin/resources/:id/cover', 'admin', ({ params }) => { const r = findRes(intParam(params)); clearCover(r); save(); return resourceView(r); });
route('DELETE', '/api/admin/resources/:id', 'admin', ({ params }) => {
  const r = findRes(intParam(params)); dropFile(r.file && r.file.stored); dropFile(r.cover && r.cover.stored);
  db.resources = db.resources.filter(x => x !== r); save(); return { ok: true };
});

/* — admin settings — */
route('PUT', '/api/admin/settings', 'admin', ({ body }) => {
  if (body.rules) {
    const lim = { LOAN_DAYS: [1, 365], RENEW_DAYS: [1, 365], MAX_RENEWALS: [0, 20], MAX_LOANS: [1, 50], FINE_PER_DAY: [0, 10000] }, next = {};
    for (const [k, [lo, hi]] of Object.entries(lim)) {
      const v = body.rules[k] === undefined ? RULES[k] : Number(body.rules[k]);
      if (!Number.isInteger(v) || v < lo || v > hi) throw bad(`${k.replace(/_/g, ' ').toLowerCase()} must be a whole number from ${lo} to ${hi}`);
      next[k] = v;
    }
    Object.assign(RULES, next); db.settings.rules = { ...RULES };
  }
  if (body.departments !== undefined) {
    const list = [...new Set((Array.isArray(body.departments) ? body.departments : String(body.departments).split('\n')).map(d => clean(d, 60)).filter(Boolean))];
    if (!list.length) throw bad('Add at least one department');
    if (list.length > 100) throw bad('Too many departments');
    db.settings.departments = list;
  }
  save(); return { departments: db.settings.departments, rules: RULES };
});
/* — website content (phone, address, hero text, footer, social links, logo) — */
const SITE_TEXT = { email: 120, phone: 40, address: 300, hours: 120, heroEyebrow: 60, heroTitle: 160, heroText: 400, footerText: 300, copyright: 200 };
function httpUrl(v, label) {
  const u = clean(v, 500); if (!u) return '';
  if (!/^https?:\/\/[^\s]+$/i.test(u)) throw bad(`${label} must be a full link starting with http:// or https://`);
  return u;
}
function siteInput(body, cur) {
  const out = {};
  for (const [k, max] of Object.entries(SITE_TEXT)) if (body[k] !== undefined) out[k] = clean(body[k], max);
  if (out.email && !isEmail(out.email.toLowerCase())) throw bad('Enter a valid contact email');
  if (body.mapUrl !== undefined) out.mapUrl = httpUrl(body.mapUrl, 'Map link');
  if (body.social && typeof body.social === 'object') {
    out.social = { ...cur.social };
    for (const k of Object.keys(SITE_DEFAULTS.social)) if (body.social[k] !== undefined) out.social[k] = httpUrl(body.social[k], k[0].toUpperCase() + k.slice(1) + ' link');
  }
  if (body.links !== undefined) {
    const raw = Array.isArray(body.links) ? body.links : String(body.links).split('\n').map(line => { const i = line.lastIndexOf('|'); return i < 0 ? { label: '', url: line } : { label: line.slice(0, i), url: line.slice(i + 1) }; });
    out.links = raw.map(x => ({ label: clean(x.label, 80), url: httpUrl(x.url, 'Resource link') })).filter(x => x.url).map(x => ({ label: x.label || x.url.replace(/^https?:\/\/(www\.)?/i, ''), url: x.url }));
    if (out.links.length > 30) throw bad('Too many resource links (30 at most)');
  }
  return out;
}
route('GET', '/api/site', null, () => siteView());
route('PUT', '/api/admin/site', 'admin', ({ body }) => { Object.assign(db.settings.site, siteInput(body, db.settings.site)); save(); return siteView(); });
route('PUT', '/api/admin/site/logo', 'admin', ({ body }) => {
  if (!body.length) throw bad('The image is empty');
  const kind = sniff(body); if (!COVER_KINDS.includes(kind)) throw bad('The logo must be a JPG, PNG or WebP image', 415);
  dropFile(db.settings.logo && db.settings.logo.stored);
  db.settings.logo = { stored: storeFile(body), kind, v: now() }; save(); return siteView();
}, { raw: MAX_COVER });
route('DELETE', '/api/admin/site/logo', 'admin', () => { dropFile(db.settings.logo && db.settings.logo.stored); db.settings.logo = null; save(); return siteView(); });
/* — About / Services / Helpdesk content — */
const pText = (v, max, label, req = true) => { const t = clean(v, max); if (req && !t) throw bad(label + ' cannot be empty'); return t; };
const pList = (arr, max, label, fn) => {
  if (!Array.isArray(arr)) throw bad(label + ' must be a list');
  if (arr.length > max) throw bad(`${label}: at most ${max} entries`);
  return arr.map(fn).filter(Boolean);
};

// Facebook / WhatsApp / LinkedIn for team members: accepts a link, a bare profile address, or (WhatsApp) a phone number
const SOCIAL_HOSTS = { facebook: ['facebook.com', 'fb.com', 'fb.me'], linkedin: ['linkedin.com', 'lnkd.in'], whatsapp: ['wa.me', 'whatsapp.com'],
  instagram: ['instagram.com', 'instagr.am'], x: ['x.com', 'twitter.com'], youtube: ['youtube.com', 'youtu.be'] };
const TEAM_SOCIAL = Object.keys(SOCIAL_HOSTS);
function socialLink(v, kind) {
  let u = clean(v, 300); if (!u) return '';
  if (kind === 'whatsapp' && /^\+?[\d\s\-().]{7,20}$/.test(u)) { const d = u.replace(/\D/g, ''); if (d.length < 7 || d.length > 15) throw bad('WhatsApp number must have 7 to 15 digits, with the country code'); return 'https://wa.me/' + d; }
  if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = 'https://' + u.replace(/^\/+/, '');
  if (!/^https?:\/\/[^\s]+$/i.test(u)) throw bad(`${kind[0].toUpperCase() + kind.slice(1)} must be a web link${kind === 'whatsapp' ? ' or a phone number' : ''}`);
  let host; try { host = new URL(u).hostname.toLowerCase().replace(/^www\./, ''); } catch (_) { throw bad(`${kind} link is not valid`); }
  if (!SOCIAL_HOSTS[kind].some(h => host === h || host.endsWith('.' + h))) throw bad(`That does not look like a ${kind[0].toUpperCase() + kind.slice(1)} link (expected ${SOCIAL_HOSTS[kind][0]})`);
  return u;
}
function pagesInput(body, cur) {
  const out = {};
  if (body.about) {
    const a = body.about, o = {};
    for (const [k, m] of Object.entries({ eyebrow: 60, title: 160, intro: 600, history: 3000, vision: 800, mission: 800 })) if (a[k] !== undefined) o[k] = pText(a[k], m, k);
    if (a.values !== undefined) o.values = pList(a.values, 8, 'Values', x => x && clean(x.title, 80) ? { title: clean(x.title, 80), text: clean(x.text, 300) } : null);
    if (a.stats !== undefined) o.stats = pList(a.stats, 8, 'Numbers', x => x && clean(x.label, 60) ? { label: clean(x.label, 60), value: clean(x.value, 30) } : null);
    if (a.teamTitle !== undefined) o.teamTitle = pText(a.teamTitle, 100, 'Team heading');
    if (a.teamIntro !== undefined) o.teamIntro = pText(a.teamIntro, 400, 'Team intro', false);
    if (a.team !== undefined) {
      const old = cur.about.team || [], seen = new Set();
      o.team = pList(a.team, 24, 'Team', x => {
        if (!x || !clean(x.name, 80)) return null;
        let prev = old.find(m => m.id === clean(x.id, 20) && !seen.has(m.id));            // the same person keeps their id and photo
        const id = prev ? prev.id : crypto.randomBytes(6).toString('hex'); seen.add(id);
        const m = { id, name: clean(x.name, 80), role: clean(x.role, 80), bio: clean(x.bio, 400), photo: prev ? prev.photo || null : null };
        for (const k of TEAM_SOCIAL) m[k] = socialLink(x[k], k);
        return m;
      });
    }
    out.about = { ...cur.about, ...o };
  }
  if (body.services) {
    const a = body.services, o = {};
    for (const [k, m] of Object.entries({ eyebrow: 60, title: 160, intro: 600 })) if (a[k] !== undefined) o[k] = pText(a[k], m, k);
    if (a.items !== undefined) o.items = pList(a.items, 30, 'Services', x => x && clean(x.title, 100) ? { icon: ICONS.includes(x.icon) ? x.icon : 'book', title: clean(x.title, 100), text: clean(x.text, 500) } : null);
    out.services = { ...cur.services, ...o };
  }
  if (body.helpdesk) {
    const a = body.helpdesk, o = {};
    for (const [k, m] of Object.entries({ eyebrow: 60, title: 160, intro: 600 })) if (a[k] !== undefined) o[k] = pText(a[k], m, k);
    if (a.topics !== undefined) { o.topics = [...new Set(pList(Array.isArray(a.topics) ? a.topics : String(a.topics).split('\n'), 20, 'Topics', t => clean(t, 80)))]; if (!o.topics.length) throw bad('Add at least one helpdesk topic'); }
    if (a.faqs !== undefined) o.faqs = pList(a.faqs, 40, 'FAQs', x => x && clean(x.q, 200) ? { q: clean(x.q, 200), a: clean(x.a, 1500) } : null);
    out.helpdesk = { ...cur.helpdesk, ...o };
  }
  return out;
}
const teamView = m => { const { photo, ...rest } = m; return { ...rest, photo: photo ? `/files/tm/${m.id}?v=${photo.v}` : null }; };
const pagesView = () => ({ ...db.settings.pages, about: { ...db.settings.pages.about, team: (db.settings.pages.about.team || []).map(teamView) }, icons: ICONS, rules: RULES });
route('GET', '/api/pages', null, () => pagesView());
route('PUT', '/api/admin/pages', 'admin', ({ body }) => {
  const prev = (db.settings.pages.about.team || []).slice();
  Object.assign(db.settings.pages, pagesInput(body, db.settings.pages));
  const keep = new Set((db.settings.pages.about.team || []).map(m => m.id));
  prev.filter(m => !keep.has(m.id)).forEach(m => dropFile(m.photo && m.photo.stored));      // a removed member takes the photo with them
  save(); return pagesView();
});
const findMember = id => (db.settings.pages.about.team || []).find(m => m.id === id) || (() => { throw bad('Team member not found. Save the About page first.', 404); })();
route('PUT', '/api/admin/team/:id/photo', 'admin', ({ params, body }) => {
  const m = findMember(params.id);
  if (!body.length) throw bad('The image is empty');
  const kind = sniff(body); if (!COVER_KINDS.includes(kind)) throw bad('The photo must be a JPG, PNG or WebP image', 415);
  dropFile(m.photo && m.photo.stored);
  m.photo = { stored: storeFile(body), kind, v: now() }; save(); return pagesView();
}, { raw: MAX_COVER });
route('DELETE', '/api/admin/team/:id/photo', 'admin', ({ params }) => { const m = findMember(params.id); dropFile(m.photo && m.photo.stored); m.photo = null; save(); return pagesView(); });
function noticeInput(body) {
  const category = clean(body.category, 20);
  if (!NOTICE_CATS.includes(category)) throw bad('Category must be Academic, Library or Events');
  const date = clean(body.date, 10) || iso(now()).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(Date.parse(date))) throw bad('Date must be YYYY-MM-DD');
  return { title: need(body.title, 'Title', 3, 200), category, date };
}
route('POST', '/api/notices', 'admin', ({ body }) => { const n = { id: nextId('notice'), ...noticeInput(body) }; db.notices.push(n); save(); return n; });
route('PUT', '/api/notices/:id', 'admin', ({ params, body }) => {
  const n = db.notices.find(x => x.id === intParam(params)); if (!n) throw bad('Notice not found', 404);
  Object.assign(n, noticeInput(body)); save(); return n;
});
route('DELETE', '/api/notices/:id', 'admin', ({ params }) => {
  const id = intParam(params), n = db.notices.length; db.notices = db.notices.filter(x => x.id !== id);
  if (db.notices.length === n) throw bad('Notice not found', 404); save(); return { ok: true };
});
route('GET', '/api/admin/messages', 'admin', () => [...db.messages].sort((a, b) => b.id - a.id));
route('PATCH', '/api/admin/messages/:id', 'admin', ({ params, body }) => {
  const m = db.messages.find(x => x.id === intParam(params)); if (!m) throw bad('Message not found', 404);
  m.read = body.read !== false; save(); return m;
});
route('DELETE', '/api/admin/messages/:id', 'admin', ({ params }) => { const id = intParam(params); db.messages = db.messages.filter(x => x.id !== id); save(); return { ok: true }; });

/* ───────────────────────── http plumbing ───────────────────────── */
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.woff2': 'font/woff2' };
const CSP = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'";
function secure(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin'); res.setHeader('Content-Security-Policy', CSP);
}
function send(res, status, obj) {
  const s = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Length': Buffer.byteLength(s) });
  res.end(s);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > 1e6) { reject(bad('Request too large', 413)); req.destroy(); } else chunks.push(c); });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      if (!/^application\/json/i.test(req.headers['content-type'] || '')) return reject(bad('Content-Type must be application/json', 415));
      try { const v = JSON.parse(Buffer.concat(chunks).toString('utf8')); resolve(v && typeof v === 'object' && !Array.isArray(v) ? v : {}); }
      catch (_) { reject(bad('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}
function readRaw(req, res, max) { // binary upload body (files, photos)
  return new Promise((resolve, reject) => {
    const declared = Number(req.headers['content-length']);
    if (declared > max) { res.setHeader('Connection', 'close'); return reject(bad(`File is too large (limit ${Math.round(max / 1048576)} MB)`, 413)); }
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > max) { res.setHeader('Connection', 'close'); reject(bad(`File is too large (limit ${Math.round(max / 1048576)} MB)`, 413)); req.pause(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
async function handleApi(req, res, url) {
  try {
    if (req.method !== 'GET' && req.headers.origin) {
      let o; try { o = new URL(req.headers.origin).host; } catch (_) { o = ''; }
      if (o !== req.headers.host) throw bad('Cross-origin request blocked', 403);
    }
    const r = routes.find(x => x.method === req.method && x.re.test(url.pathname));
    if (!r) {
      if (routes.some(x => x.re.test(url.pathname))) throw bad('Method not allowed', 405);
      throw bad('Not found', 404);
    }
    const params = url.pathname.match(r.re).groups || {};
    const user = sessionUser(req);
    if (r.access && !user) throw bad('Please log in', 401);
    if (r.access === 'admin' && user.role !== 'admin') throw bad('Admins only', 403);
    const body = req.method === 'GET' || req.method === 'HEAD' ? {} : r.raw ? await readRaw(req, res, r.raw) : await readBody(req);
    send(res, 200, await r.fn({ req, res, params, query: url.searchParams, body, user }));
  } catch (e) {
    if (e instanceof HttpError) return send(res, e.status, { error: e.message });
    console.error(e); send(res, 500, { error: 'Something went wrong on the server' });
  }
}

const gzCache = new Map();
function serveStatic(req, res, url) {
  let p;
  try { p = decodeURIComponent(url.pathname); } catch (_) { return send(res, 400, { error: 'Bad request' }); }
  if (p === '/') p = '/index.html';
  else if (!path.extname(p)) p += '.html';
  if (path.basename(p).startsWith('.')) return send(res, 404, { error: 'Not found' });
  // find the file in frontend/ first, then admin/ (never outside those folders)
  let file = null;
  for (const dir of STATIC_DIRS) {
    const f = path.normalize(path.join(dir, p));
    if (!f.startsWith(dir + path.sep)) continue;
    try { if (fs.statSync(f).isFile()) { file = f; break; } } catch (_) {}
  }
  if (!file) file = path.join(FRONTEND_DIR, '.missing');
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end('<!doctype html><meta charset=utf-8><title>404</title><body style="font-family:system-ui;text-align:center;padding:15vh 20px"><h1>404</h1><p>Page not found.</p><a href="/">Back to GBLMS</a>'); }
    const ext = path.extname(file).toLowerCase(), type = MIME[ext] || 'application/octet-stream';
    const etag = `"${st.size}-${Math.floor(st.mtimeMs)}"`;
    const headers = { 'Content-Type': type, ETag: etag, 'Cache-Control': ['.html', '.js', '.css'].includes(ext) ? 'no-cache' : 'public, max-age=3600' };
    if (req.headers['if-none-match'] === etag) { res.writeHead(304, headers); return res.end(); }
    const compressible = /text|javascript|json|svg/.test(type) && /\bgzip\b/.test(req.headers['accept-encoding'] || '');
    fs.readFile(file, (e2, buf) => {
      if (e2) return send(res, 500, { error: 'Read error' });
      if (compressible) {
        let z = gzCache.get(file); if (!z || z.etag !== etag) { z = { etag, buf: zlib.gzipSync(buf) }; gzCache.set(file, z); }
        res.writeHead(200, { ...headers, 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding', 'Content-Length': z.buf.length }); return res.end(req.method === 'HEAD' ? undefined : z.buf);
      }
      res.writeHead(200, { ...headers, 'Content-Length': buf.length }); res.end(req.method === 'HEAD' ? undefined : buf);
    });
  });
}

// Files: /files/r/<id> e-library item · /files/b/<id> book PDF · /files/u/<id> profile photo  (these need a login)
//        /files/bc/<id> book cover · /files/rc/<id> e-library cover · /files/tm/<id> team photo · /files/site/logo   (public: they are shown on the website)
const PUBLIC_FILES = new Set(['bc', 'rc', 'logo', 'tm']);
function serveFile(req, res, url) {
  const m = url.pathname.match(/^\/files\/(?:(r|u|b|bc|rc)\/(\d+)|(tm)\/([0-9a-f]{12})|site\/(logo))$/);
  if (!m || (req.method !== 'GET' && req.method !== 'HEAD')) return send(res, 404, { error: 'Not found' });
  const kind = m[1] || m[3] || 'logo', id = Number(m[2]);
  const user = sessionUser(req);
  if (!PUBLIC_FILES.has(kind) && !user) return send(res, 401, { error: 'Please log in' });
  let stored, type, name = '', inline = true, cache = 'private, no-store';
  const countable = () => !req.headers.range && req.method === 'GET' && user && user.role !== 'admin';
  if (kind === 'u') {
    const u = db.users.find(x => x.id === id);
    if (!u || !u.avatarFile) return send(res, 404, { error: 'Not found' });
    stored = u.avatarFile; type = IMG_MIME[{ jpg: '.jpg', png: '.png', webp: '.webp' }[u.avatarKind] || '.jpg']; cache = 'private, max-age=86400';
  } else if (kind === 'tm') {
    const o = ((db.settings.pages.about.team || []).find(x => x.id === m[4]) || {}).photo;
    if (!o) return send(res, 404, { error: 'Not found' });
    stored = o.stored; type = COVER_MIME[o.kind]; cache = 'public, max-age=86400';
  } else if (kind === 'bc' || kind === 'rc' || kind === 'logo') {
    const o = kind === 'logo' ? db.settings.logo : (kind === 'bc' ? db.books : db.resources).find(x => x.id === id)?.cover;
    const owner = kind === 'rc' ? db.resources.find(x => x.id === id) : null;
    if (!o || (owner && owner.visible === false && !(user && user.role === 'admin'))) return send(res, 404, { error: 'Not found' });
    stored = o.stored; type = COVER_MIME[o.kind]; cache = 'public, max-age=86400';
  } else if (kind === 'b') {
    const b = db.books.find(x => x.id === id);
    if (!b || !b.file) return send(res, 404, { error: 'Not found' });
    stored = b.file.stored; type = 'application/pdf'; name = b.file.name; inline = url.searchParams.get('download') !== '1';
    if (countable()) { b.downloads = (b.downloads || 0) + 1; save(); }
  } else {
    const r = db.resources.find(x => x.id === id);
    if (!r || !r.file || (r.visible === false && user.role !== 'admin')) return send(res, 404, { error: 'Not found' });
    stored = r.file.stored; type = FILE_TYPES[r.file.ext]; name = r.file.name;
    inline = INLINE_EXT.has(r.file.ext) && url.searchParams.get('download') !== '1';
    if (countable()) { r.downloads = (r.downloads || 0) + 1; save(); }
  }
  const file = path.join(UPLOAD_DIR, stored);
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, { error: 'File is missing on the server' });
    const headers = { 'Content-Type': type || 'application/octet-stream', 'Cache-Control': cache, 'Accept-Ranges': 'bytes',
      'Content-Security-Policy': "default-src 'none'; img-src data:; style-src 'unsafe-inline'" };
    if (name) headers['Content-Disposition'] = `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(name)}`;
    let start = 0, end = st.size - 1, status = 200;
    const rg = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
    if (rg && (rg[1] || rg[2])) {
      if (rg[1]) { start = Number(rg[1]); if (rg[2]) end = Math.min(Number(rg[2]), end); } else { start = Math.max(0, st.size - Number(rg[2])); }
      if (start > end || start >= st.size) { res.writeHead(416, { 'Content-Range': `bytes */${st.size}` }); return res.end(); }
      status = 206; headers['Content-Range'] = `bytes ${start}-${end}/${st.size}`;
    }
    headers['Content-Length'] = end - start + 1;
    res.writeHead(status, headers);
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file, { start, end }).on('error', () => res.destroy()).pipe(res);
  });
}

function createServer() {
  return http.createServer((req, res) => {
    secure(res);
    let url; try { url = new URL(req.url, 'http://x'); } catch (_) { return send(res, 400, { error: 'Bad request' }); }
    if (url.pathname.startsWith('/api/')) return handleApi(req, res, url);
    if (url.pathname.startsWith('/files/')) return serveFile(req, res, url);
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'Method not allowed' });
    serveStatic(req, res, url);
  });
}

loadDb();
if (require.main === module) {
  const server = createServer();
  server.on('error', e => { console.error(e.code === 'EADDRINUSE' ? `Port ${port} is busy. Try:  PORT=3001 npm start` : e); process.exit(1); });
  server.listen(port, HOST, () => console.log(`  Listening on   ->  ${HOST}:${port}\n  GBLMS running  ->  http://localhost:${port}\n  Admin portal   ->  http://localhost:${port}/portal\n`));
}
module.exports = { createServer, RULES };
