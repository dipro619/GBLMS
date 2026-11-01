'use strict';
// Integration tests: `npm test`  (uses a temporary database, never touches ./data)
const os = require('os'), fs = require('fs'), path = require('path'), assert = require('assert');
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'gblms-'));
const { createServer } = require('./server');

(async () => {
  const srv = createServer();
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + srv.address().port;
  const client = () => {
    let cookie = '';
    return async (method, url, body) => {
      const r = await fetch(base + url, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { cookie } : {}) }, body: body ? JSON.stringify(body) : undefined });
      const sc = r.headers.get('set-cookie'); if (sc) cookie = sc.split(';')[0];
      return { status: r.status, data: await r.json().catch(() => null) };
    };
  };
  let passed = 0;
  const t = async (name, fn) => { try { await fn(); passed++; console.log('  ✓', name); } catch (e) { console.error('  ✗', name, '\n   ', e.message); process.exitCode = 1; } };

  const anon = client(), admin = client(), stu = client(), stu2 = client();
  const reg = (name, email, sid, extra = {}) => ({ name, email, studentId: sid, phone: '01712-345678', dept: 'CSE', batch: '45', semester: 3, password: 'longenough1', ...extra });
  // raw-body helper for file uploads, shares the cookie of an existing client via a login
  const rawClient = () => {
    let cookie = '';
    const f = async (method, url, body, headers = {}) => {
      const r = await fetch(base + url, { method, headers: { ...(cookie ? { cookie } : {}), ...headers }, body });
      const sc = r.headers.get('set-cookie'); if (sc) cookie = sc.split(';')[0];
      return r;
    };
    f.login = async (id, password, role) => { await f('POST', '/api/auth/login', JSON.stringify({ id, password, role }), { 'Content-Type': 'application/json' }); };
    return f;
  };

  await t('public catalogue, search and new arrivals', async () => {
    assert.equal((await anon('GET', '/api/health')).data.ok, true);
    const all = (await anon('GET', '/api/books?limit=100')).data; assert.ok(all.total >= 25);
    assert.equal((await anon('GET', '/api/books?q=harari')).data.total, 2);
    assert.equal((await anon('GET', '/api/books/new')).data.length, 12);
    assert.ok((await anon('GET', '/api/categories')).data.includes('Law'));
    assert.ok((await anon('GET', '/api/notices')).data.length >= 5);
  });
  await t('protected routes reject anonymous users', async () => {
    assert.equal((await anon('GET', '/api/me/loans')).status, 401);
    assert.equal((await anon('POST', '/api/books', { title: 'x' })).status, 401);
  });
  await t('admin / user login separation', async () => {
    assert.equal((await admin('POST', '/api/auth/login', { id: 'admin', password: 'wrong', role: 'admin' })).status, 401);
    assert.equal((await admin('POST', '/api/auth/login', { id: 'student@gono.edu.bd', password: 'student123', role: 'admin' })).status, 401);
    assert.equal((await admin('POST', '/api/auth/login', { id: 'admin', password: 'admin123', role: 'admin' })).status, 200);
    assert.equal((await stu('POST', '/api/auth/login', { id: 'student@gono.edu.bd', password: 'student123', role: 'user' })).status, 200);
    assert.equal((await stu('GET', '/api/admin/stats')).status, 403);
    assert.equal((await admin('GET', '/api/auth/me')).data.user.role, 'admin');
  });
  await t('registration validates input and logs in', async () => {
    assert.equal((await stu2('POST', '/api/auth/register', { name: 'A', email: 'bad', password: 'x' })).status, 400);
    // every student detail is required
    for (const missing of ['studentId', 'phone', 'dept', 'batch', 'semester']) {
      const r = await stu2('POST', '/api/auth/register', reg('Rafi Ahmed', 'rafi@example.com', 'CSE-45-001', { [missing]: '' }));
      assert.equal(r.status, 400, missing + ' should be required');
    }
    assert.equal((await stu2('POST', '/api/auth/register', reg('Rafi Ahmed', 'rafi@example.com', 'CSE-45-001', { phone: '12ab' }))).status, 400);
    assert.equal((await stu2('POST', '/api/auth/register', reg('Rafi Ahmed', 'rafi@example.com', 'CSE-45-001', { dept: 'Astrology' }))).status, 400);
    assert.equal((await stu2('POST', '/api/auth/register', reg('Rafi Ahmed', 'rafi@example.com', 'CSE-45-001', { semester: 13 }))).status, 400);
    assert.equal((await stu2('POST', '/api/auth/register', reg('Rafi Ahmed', 'rafi@example.com', 'CSE-45-001'))).status, 200);
    assert.equal((await anon('POST', '/api/auth/register', reg('Other', 'rafi@example.com', 'CSE-45-002'))).status, 409); // email taken
    assert.equal((await anon('POST', '/api/auth/register', reg('Other', 'other@example.com', 'cse-45-001'))).status, 409); // student id taken (case-insensitive)
    const me = (await stu2('GET', '/api/auth/me')).data.user;
    assert.equal(me.email, 'rafi@example.com');
    assert.deepEqual([me.studentId, me.phone, me.dept, me.batch, me.semester], ['CSE-45-001', '01712345678', 'CSE', '45', 3]);
  });
  const book = (await anon('GET', '/api/books?q=Nexus')).data.books[0];
  await t('borrow, loan limit and duplicate protection', async () => {
    assert.equal((await stu2('POST', `/api/books/${book.id}/borrow`)).status, 200);
    assert.equal((await stu2('POST', `/api/books/${book.id}/borrow`)).status, 409);
    const others = (await anon('GET', '/api/books?limit=5&q=Clean')).data.books;
    assert.equal((await stu2('POST', `/api/books/${others[0].id}/borrow`)).status, 200);
    const o2 = (await anon('GET', '/api/books?q=Orbital')).data.books[0];
    assert.equal((await stu2('POST', `/api/books/${o2.id}/borrow`)).status, 200);
    const o3 = (await anon('GET', '/api/books?q=Wager')).data.books[0];
    assert.equal((await stu2('POST', `/api/books/${o3.id}/borrow`)).status, 409); // limit of 3
    assert.equal((await stu2('GET', '/api/me/summary')).data.borrowed, 3);
  });
  await t('reservations queue and promotion on return', async () => {
    // exhaust both copies of "The Coming Wave"
    const cw = (await anon('GET', '/api/books?q=Coming Wave')).data.books[0];
    assert.equal((await stu('POST', `/api/books/${cw.id}/borrow`)).status, 200);
    assert.equal((await admin('POST', '/api/admin/loans', { email: 'rafi@example.com', bookId: cw.id })).status, 409); // limit reached
    const third = client();
    assert.equal((await third('POST', '/api/auth/register', reg('Third Member', 'third@example.com', 'EEE-44-007', { dept: 'EEE' }))).status, 200);
    assert.equal((await third('POST', `/api/books/${cw.id}/borrow`)).status, 200);
    assert.equal((await stu2('POST', `/api/books/${cw.id}/borrow`)).status, 409);
    assert.equal((await stu2('POST', `/api/books/${cw.id}/reserve`)).status, 200);
    assert.equal((await stu2('POST', `/api/books/${cw.id}/reserve`)).status, 409);
    const loans = (await admin('GET', '/api/admin/loans?filter=active')).data.filter(l => l.bookId === cw.id);
    assert.equal((await admin('POST', `/api/loans/${loans[0].id}/return`)).status, 200);
    const rs = (await stu2('GET', '/api/me/reservations')).data; assert.equal(rs[0].status, 'ready');
  });
  await t('renewals respect rules', async () => {
    const loans = (await stu('GET', '/api/me/loans')).data.filter(l => !l.returnedAt);
    const l = loans.find(x => x.title === 'Operating System Concepts');
    const r1 = await stu('POST', `/api/loans/${l.id}/renew`); assert.equal(r1.status, 200);
    assert.ok(Date.parse(r1.data.dueAt) > Date.parse(l.dueAt));
    assert.equal((await stu('POST', `/api/loans/${l.id}/renew`)).status, 200);
    assert.equal((await stu('POST', `/api/loans/${l.id}/renew`)).status, 409); // max 2
    assert.equal((await stu2('POST', `/api/loans/${l.id}/renew`)).status, 404); // not yours
  });
  await t('admin book CRUD and safeguards', async () => {
    const c = await admin('POST', '/api/books', { title: 'Test Book', author: 'Tester', category: 'CSE', copies: 1 });
    assert.equal(c.status, 200);
    assert.equal((await admin('POST', '/api/books', { title: '', author: 'x', category: 'x' })).status, 400);
    assert.equal((await admin('PUT', `/api/books/${c.data.id}`, { copies: 4 })).data.copies, 4);
    assert.equal((await admin('DELETE', `/api/books/${c.data.id}`)).status, 200);
    assert.equal((await admin('DELETE', `/api/books/${book.id}`)).status, 409); // active loan
  });
  await t('notices, contact form and messages', async () => {
    const n = await admin('POST', '/api/notices', { title: 'Library closed on Friday', category: 'Library', date: '2026-10-30' });
    assert.equal(n.status, 200);
    assert.equal((await admin('POST', '/api/notices', { title: 'Bad cat', category: 'Nope' })).status, 400);
    assert.equal((await anon('GET', '/api/notices?category=Library')).data[0].title, 'Library closed on Friday');
    assert.equal((await admin('DELETE', `/api/notices/${n.data.id}`)).status, 200);
    assert.equal((await anon('POST', '/api/contact', { name: 'Visitor', email: 'v@example.com', message: 'Hello library' })).status, 200);
    assert.equal((await admin('GET', '/api/admin/messages')).data[0].name, 'Visitor');
  });
  await t('suspended members cannot log in', async () => {
    const us = (await admin('GET', '/api/admin/users')).data, u = us.find(x => x.email === 'third@example.com');
    assert.equal((await admin('PATCH', `/api/admin/users/${u.id}`, { active: false })).status, 200);
    assert.equal((await anon('POST', '/api/auth/login', { id: 'third@example.com', password: 'longenough1' })).status, 403);
  });
  await t('security: origin check, JSON only, static traversal, 404', async () => {
    const r = await fetch(base + '/api/auth/logout', { method: 'POST', headers: { Origin: 'http://evil.example' } }); assert.equal(r.status, 403);
    const r2 = await fetch(base + '/api/contact', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: 'x' }); assert.equal(r2.status, 415);
    assert.equal((await fetch(base + '/..%2fserver.js')).status, 404);
    assert.equal((await fetch(base + '/%2e%2e/server.js')).status, 404);
    assert.equal((await fetch(base + '/nope')).status, 404);
    assert.equal((await fetch(base + '/')).status, 200);
    assert.equal((await fetch(base + '/portal')).status, 200);
  });
  await t('members can edit their profile; ids stay unique', async () => {
    const r = await stu2('PATCH', '/api/me', { phone: '+8801811223344', dept: 'BBA', batch: '46', semester: 4 });
    assert.equal(r.status, 200); assert.equal(r.data.user.dept, 'BBA'); assert.equal(r.data.user.semester, 4);
    assert.equal((await stu2('PATCH', '/api/me', { studentId: 'EEE-44-007' })).status, 409);
    assert.equal((await stu2('PATCH', '/api/me', { dept: 'Nope' })).status, 400);
    assert.equal((await stu2('PATCH', '/api/me', { name: 'R' })).status, 400);
  });
  await t('profile photo upload, serving and removal', async () => {
    const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64, 1)]);
    const u = rawClient(); await u.login('rafi@example.com', 'longenough1', 'user');
    assert.equal((await u('PUT', '/api/me/avatar', Buffer.from('<svg onload=alert(1)>'), {})).status, 415);
    const up = await u('PUT', '/api/me/avatar', png, {}); assert.equal(up.status, 200);
    const url = (await up.json()).user.avatar; assert.ok(url.startsWith('/files/u/'));
    const got = await u('GET', url); assert.equal(got.status, 200); assert.equal(got.headers.get('content-type'), 'image/png');
    assert.equal((await fetch(base + url)).status, 401); // not for anonymous visitors
    const big = await u('PUT', '/api/me/avatar', Buffer.alloc(3 * 1024 * 1024, 1), {}); assert.equal(big.status, 413);
    const del = await u('DELETE', '/api/me/avatar'); assert.equal((await del.json()).user.avatar, null);
  });
  await t('e-library: admin uploads real files, members read and download', async () => {
    const pdf = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
    const a = rawClient(); await a.login('admin', 'admin123', 'admin');
    const J = { 'Content-Type': 'application/json' };
    const c = await a('POST', '/api/admin/resources', JSON.stringify({ title: 'Data Structures Notes', author: 'Dept. of CSE', type: 'Notes', dept: 'CSE', category: 'CSE' }), J);
    assert.equal(c.status, 200); const res = await c.json(); assert.equal(res.hasFile, false);
    assert.equal((await a('POST', '/api/admin/resources', JSON.stringify({ title: 'x', type: 'Nope' }), J)).status, 400);
    assert.equal((await a('PUT', `/api/admin/resources/${res.id}/file?name=evil.html`, Buffer.from('<script>1</script>'))).status, 415);
    assert.equal((await a('PUT', `/api/admin/resources/${res.id}/file?name=fake.pdf`, Buffer.from('not a pdf'))).status, 415);
    const up = await a('PUT', `/api/admin/resources/${res.id}/file?name=${encodeURIComponent('DS notes.pdf')}`, pdf); assert.equal(up.status, 200);
    const v = await up.json(); assert.equal(v.hasFile, true); assert.equal(v.fileSize, pdf.length); assert.equal(v.fileName, 'DS notes.pdf');
    // member side
    const m = rawClient(); await m.login('rafi@example.com', 'longenough1', 'user');
    const list = await (await m('GET', '/api/resources?q=structures')).json(); assert.equal(list.length, 1);
    const f = await m('GET', `/files/r/${res.id}`); assert.equal(f.status, 200);
    assert.equal(f.headers.get('content-type'), 'application/pdf'); assert.match(f.headers.get('content-disposition'), /^inline/);
    assert.deepEqual(Buffer.from(await f.arrayBuffer()), pdf);
    const d = await m('GET', `/files/r/${res.id}?download=1`); assert.match(d.headers.get('content-disposition'), /^attachment/); await d.arrayBuffer();
    const rg = await m('GET', `/files/r/${res.id}`, undefined, { Range: 'bytes=0-3' }); assert.equal(rg.status, 206); assert.equal(await rg.text(), '%PDF');
    assert.equal((await fetch(base + `/files/r/${res.id}`)).status, 401);
    assert.equal((await m('POST', '/api/admin/resources', '{}', J)).status, 403);
    assert.equal((await m('PUT', `/api/admin/resources/${res.id}/file?name=a.pdf`, pdf)).status, 403);
    const shown = (await (await a('GET', '/api/admin/resources')).json()).find(x => x.id === res.id); assert.equal(shown.downloads, 2);
    // hide it, then delete it
    await a('PUT', `/api/admin/resources/${res.id}`, JSON.stringify({ visible: false }), J);
    assert.equal((await (await m('GET', '/api/resources')).json()).length, 0);
    assert.equal((await m('GET', `/files/r/${res.id}`)).status, 404);
    assert.equal((await a('DELETE', `/api/admin/resources/${res.id}`)).status, 200);
    assert.equal((await a('GET', `/files/r/${res.id}`)).status, 404);
  });
  await t('admin can add, edit and delete members', async () => {
    const add = await admin('POST', '/api/admin/users', reg('Added By Admin', 'added@example.com', 'LAW-43-010', { dept: 'Law' }));
    assert.equal(add.status, 200);
    const id = add.data.id;
    const ed = await admin('PATCH', `/api/admin/users/${id}`, { name: 'Added Person', semester: 7, phone: '01999888777', password: 'brandnewpass1' });
    assert.equal(ed.status, 200); assert.equal(ed.data.semester, 7);
    assert.equal((await admin('PATCH', `/api/admin/users/${id}`, { email: 'rafi@example.com' })).status, 409);
    const them = client();
    assert.equal((await them('POST', '/api/auth/login', { id: 'added@example.com', password: 'brandnewpass1' })).status, 200);
    assert.equal((await admin('DELETE', `/api/admin/users/${id}`)).status, 200);
    assert.equal((await them('GET', '/api/auth/me')).data.user, null);
    const me = (await admin('GET', '/api/auth/me')).data.user;
    assert.equal((await admin('DELETE', `/api/admin/users/${me.id}`)).status, 409);
    assert.equal((await admin('PATCH', `/api/admin/users/${me.id}`, { role: 'user' })).status, 409);
    const rafi = (await admin('GET', '/api/admin/users')).data.find(x => x.email === 'rafi@example.com');
    assert.equal((await admin('DELETE', `/api/admin/users/${rafi.id}`)).status, 409); // still has books on loan
  });
  await t('admin settings: library rules and departments', async () => {
    assert.equal((await stu('PUT', '/api/admin/settings', { departments: ['X'] })).status, 403);
    assert.equal((await admin('PUT', '/api/admin/settings', { rules: { LOAN_DAYS: 0 } })).status, 400);
    const r = await admin('PUT', '/api/admin/settings', { rules: { FINE_PER_DAY: 10 }, departments: ['CSE', 'BBA', 'Law', 'EEE', 'Pharmacy', 'Physics'] });
    assert.equal(r.status, 200); assert.equal(r.data.rules.FINE_PER_DAY, 10);
    const pub = (await anon('GET', '/api/settings/public')).data;
    assert.equal(pub.rules.FINE_PER_DAY, 10); assert.ok(pub.departments.includes('Physics')); assert.equal(pub.semesters, 12);
    assert.equal((await anon('POST', '/api/auth/register', reg('Phys Student', 'phys@example.com', 'PHY-1', { dept: 'Physics' }))).status, 200);
    await admin('PUT', '/api/admin/settings', { rules: { FINE_PER_DAY: 5 } });
  });
  await t('books: cover (JPG) + PDF upload, public cover, member read/download', async () => {
    const pdf = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
    const jpg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(200, 7)]);
    const a = rawClient(); await a.login('admin', 'admin123', 'admin');
    const J = { 'Content-Type': 'application/json' };
    const c = await a('POST', '/api/books', JSON.stringify({ title: 'Digital Logic Design', author: 'M. Mano', category: 'EEE', copies: 2, featured: true }), J);
    assert.equal(c.status, 200); const book = await c.json(); assert.equal(book.hasFile, false); assert.equal(book.cover, null); assert.equal(book.featured, true);
    // validation
    assert.equal((await a('PUT', `/api/admin/books/${book.id}/cover`, Buffer.from('<svg onload=1>'))).status, 415);
    assert.equal((await a('PUT', `/api/admin/books/${book.id}/file?name=x.pdf`, Buffer.from('not a pdf'))).status, 415);
    assert.equal((await a('PUT', `/api/admin/books/${book.id}/file?name=x.pdf`, Buffer.alloc(0))).status, 400);
    // upload
    const cv = await a('PUT', `/api/admin/books/${book.id}/cover`, jpg); assert.equal(cv.status, 200);
    const up = await a('PUT', `/api/admin/books/${book.id}/file?name=${encodeURIComponent('Digital Logic.pdf')}`, pdf); assert.equal(up.status, 200);
    const v = await up.json(); assert.ok(v.cover.startsWith(`/files/bc/${book.id}?v=`)); assert.equal(v.hasFile, true); assert.equal(v.fileSize, pdf.length);
    // editing text fields keeps the files
    const ed = await (await a('PUT', `/api/books/${book.id}`, JSON.stringify({ rack: 'E-9' }), J)).json(); assert.equal(ed.hasFile, true); assert.ok(ed.cover);
    // the cover is public (it is shown on the website), the PDF is not
    const pubCover = await fetch(base + v.cover); assert.equal(pubCover.status, 200); assert.equal(pubCover.headers.get('content-type'), 'image/jpeg'); await pubCover.arrayBuffer();
    assert.equal((await fetch(base + `/files/b/${book.id}`)).status, 401);
    const listed = (await anon('GET', '/api/books?q=digital+logic')).data.books[0]; assert.equal(listed.hasFile, true); assert.ok(listed.cover); assert.equal(listed.fileName, 'Digital Logic.pdf');
    // a logged-in student reads and downloads
    const m = rawClient(); await m.login('rafi@example.com', 'longenough1', 'user');
    const f = await m('GET', `/files/b/${book.id}`); assert.equal(f.status, 200); assert.equal(f.headers.get('content-type'), 'application/pdf'); assert.match(f.headers.get('content-disposition'), /^inline/);
    assert.deepEqual(Buffer.from(await f.arrayBuffer()), pdf);
    const d = await m('GET', `/files/b/${book.id}?download=1`); assert.match(d.headers.get('content-disposition'), /^attachment; filename\*=UTF-8''Digital%20Logic\.pdf/); await d.arrayBuffer();
    // students cannot upload
    assert.equal((await m('PUT', `/api/admin/books/${book.id}/cover`, jpg)).status, 403);
    assert.equal((await m('PUT', `/api/admin/books/${book.id}/file?name=a.pdf`, pdf)).status, 403);
    assert.equal((await a('GET', '/api/books/' + book.id)).status, 200);
    assert.equal((await (await a('GET', `/api/books/${book.id}`)).json()).downloads, 2);
    // remove cover + pdf, then delete the book
    assert.equal((await (await a('DELETE', `/api/admin/books/${book.id}/cover`)).json()).cover, null);
    assert.equal((await (await a('DELETE', `/api/admin/books/${book.id}/file`)).json()).hasFile, false);
    assert.equal((await fetch(base + `/files/bc/${book.id}`)).status, 404);
    await a('PUT', `/api/admin/books/${book.id}/file?name=again.pdf`, pdf);
    assert.equal((await a('DELETE', `/api/books/${book.id}`)).status, 200);
  });
  await t('e-library items can have a cover image too', async () => {
    const jpg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(100, 3)]);
    const a = rawClient(); await a.login('admin', 'admin123', 'admin');
    const r = await (await a('POST', '/api/admin/resources', JSON.stringify({ title: 'Cover test', type: 'Book' }), { 'Content-Type': 'application/json' })).json();
    const up = await (await a('PUT', `/api/admin/resources/${r.id}/cover`, jpg)).json(); assert.ok(up.cover.startsWith('/files/rc/'));
    assert.equal((await fetch(base + up.cover)).status, 200);
    await a('DELETE', `/api/admin/resources/${r.id}`); assert.equal((await fetch(base + up.cover)).status, 404);
  });
  await t('website content: phone, address, links, logo are editable from the admin panel', async () => {
    const pub = (await anon('GET', '/api/site')).data;
    assert.equal(pub.phone, '+880 1XXX-XXXXXX'); assert.equal(pub.logo, null); assert.ok(pub.links.length >= 5);
    assert.equal((await stu('PUT', '/api/admin/site', { phone: '1' })).status, 403);
    assert.equal((await client()('PUT', '/api/admin/site', { phone: '1' })).status, 401);
    assert.equal((await admin('PUT', '/api/admin/site', { social: { facebook: 'javascript:alert(1)' } })).status, 400);
    assert.equal((await admin('PUT', '/api/admin/site', { email: 'nope' })).status, 400);
    assert.equal((await admin('PUT', '/api/admin/site', { links: 'bad link without url' })).status, 400);
    const r = await admin('PUT', '/api/admin/site', { phone: '+880 1711-000000', address: 'New campus, Savar', heroTitle: 'Welcome to GBLMS',
      social: { facebook: 'https://facebook.com/gonolib' }, links: 'IEEE | https://ieeexplore.ieee.org\nhttps://example.org/db' });
    assert.equal(r.status, 200); assert.equal(r.data.phone, '+880 1711-000000');
    const after = (await anon('GET', '/api/site')).data;
    assert.equal(after.address, 'New campus, Savar'); assert.equal(after.social.facebook, 'https://facebook.com/gonolib'); assert.equal(after.social.x, '');
    assert.deepEqual(after.links.map(x => x.label), ['IEEE', 'example.org/db']); assert.equal(after.email, 'library@gonouniversity.edu.bd');
    // logo
    const a = rawClient(); await a.login('admin', 'admin123', 'admin');
    const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47]), Buffer.alloc(50, 1)]);
    assert.equal((await a('PUT', '/api/admin/site/logo', Buffer.from('<svg/>'))).status, 415);
    const lg = await (await a('PUT', '/api/admin/site/logo', png)).json(); assert.ok(lg.logo.startsWith('/files/site/logo'));
    const got = await fetch(base + lg.logo); assert.equal(got.status, 200); assert.equal(got.headers.get('content-type'), 'image/png'); await got.arrayBuffer();
    assert.equal((await (await a('DELETE', '/api/admin/site/logo')).json()).logo, null);
    assert.equal((await fetch(base + '/files/site/logo')).status, 404);
  });
  await t('public pages are served (about, opac, elibrary, services, helpdesk)', async () => {
    for (const p of ['/about', '/opac', '/elibrary', '/services', '/helpdesk', '/site.css', '/site.js', '/pages.js']) {
      const r = await fetch(base + p); assert.equal(r.status, 200, p); await r.arrayBuffer();
    }
    for (const p of ['/site.js', '/site.css', '/nav.css', '/pages.js', '/portal.js']) { const r = await fetch(base + p); assert.equal(r.headers.get('cache-control'), 'no-cache', p); await r.arrayBuffer(); } // updated files are picked up at once, never served stale
    assert.ok(typeof (await anon('GET', '/api/health')).data.build === 'string');
    const home = await (await fetch(base + '/')).text(); assert.ok(home.includes('/nav.css'));
    const html = await (await fetch(base + '/opac')).text(); assert.ok(html.includes('viewport-fit=cover') && html.includes('data-page="opac"'));
  });
  await t('OPAC: field search, filters, sorting and richer book details', async () => {
    const a = rawClient(); await a.login('admin', 'admin123', 'admin'); const J = { 'Content-Type': 'application/json' };
    const c = await (await a('POST', '/api/books', JSON.stringify({ title: 'Quantum Basics', author: 'Zed Khan', category: 'Physics', copies: 1, year: 2021, isbn: '978-984-1234-56-7',
      publisher: 'Gono Press', edition: '2nd', language: 'English', subject: 'Quantum mechanics', description: 'A short introduction.' }), J)).json();
    assert.equal(c.publisher, 'Gono Press'); assert.equal(c.edition, '2nd'); assert.equal(c.language, 'English'); assert.equal(c.description, 'A short introduction.');
    const n = async q => (await anon('GET', '/api/books?' + q)).data.total;
    assert.equal(await n('q=quantum&field=title'), 1); assert.equal(await n('q=quantum&field=author'), 0); assert.equal(await n('q=zed&field=author'), 1);
    assert.equal(await n('q=9789841234567&field=isbn'), 1); assert.equal(await n('q=978-984&field=isbn'), 1);
    assert.equal(await n('q=mechanics&field=subject'), 1); assert.equal(await n('q=gono+press'), 1);
    assert.equal(await n('language=English'), 1); assert.equal(await n('q=quantum&yearFrom=2020&yearTo=2022'), 1); assert.equal(await n('q=quantum&yearFrom=2022'), 0); assert.equal(await n('q=quantum&yearTo=2020'), 0);
    assert.deepEqual((await anon('GET', '/api/languages')).data, ['English']);
    const byYear = (await anon('GET', '/api/books?sort=newest&limit=3')).data.books; assert.ok((byYear[0].year || 0) >= (byYear[1].year || 0));
    // admin can change the details any time
    const ed = await (await a('PUT', `/api/books/${c.id}`, JSON.stringify({ title: 'Quantum Basics (Revised)', edition: '3rd' }), J)).json();
    assert.equal(ed.title, 'Quantum Basics (Revised)'); assert.equal(ed.edition, '3rd'); assert.equal(ed.publisher, 'Gono Press');
  });
  await t('public E-Library lists books, notes, journals; opening files needs login', async () => {
    const a = rawClient(); await a.login('admin', 'admin123', 'admin'); const J = { 'Content-Type': 'application/json' };
    const pdf = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
    assert.equal((await anon('GET', '/api/elibrary')).data.items.every(x => x.readUrl), true);
    const before = (await anon('GET', '/api/elibrary')).data.all;
    for (const [title, type, dept] of [['Data Structures Notes', 'Notes', 'CSE'], ['IEEE Journal 2026', 'Journal', ''], ['Law Question Bank', 'Question bank', 'Law']]) {
      const r = await (await a('POST', '/api/admin/resources', JSON.stringify({ title, type, dept, author: 'Dept', description: 'x' }), J)).json();
      assert.equal((await a('PUT', `/api/admin/resources/${r.id}/file?name=${encodeURIComponent(title)}.pdf`, pdf)).status, 200);
    }
    const bk = await (await a('POST', '/api/books', JSON.stringify({ title: 'Public Ebook', author: 'A', category: 'Law', copies: 1 }), J)).json();
    assert.equal((await a('PUT', `/api/admin/books/${bk.id}/file?name=e.pdf`, pdf)).status, 200);
    const all = (await anon('GET', '/api/elibrary')).data; assert.equal(all.all, before + 4);
    assert.equal(all.counts.Notes, 1); assert.equal(all.counts.Journal, 1); assert.equal(all.counts['Question bank'], 1); assert.ok(all.counts.Book >= 1);
    assert.equal((await anon('GET', '/api/elibrary?type=Journal')).data.total, 1);
    assert.equal((await anon('GET', '/api/elibrary?type=Notes&dept=CSE')).data.total, 1); assert.equal((await anon('GET', '/api/elibrary?dept=Law')).data.total >= 2, true);
    assert.equal((await anon('GET', '/api/elibrary?q=public+ebook')).data.items[0].kind, 'book');
    const item = all.items.find(x => x.title === 'IEEE Journal 2026'); assert.equal(item.fileSize, pdf.length);
    assert.equal((await fetch(base + item.readUrl)).status, 401);          // metadata is public, the file is not
    assert.equal((await fetch(base + `/files/b/${bk.id}`)).status, 401);
    // hidden items disappear from the public list
    const r0 = (await a('GET', '/api/admin/resources')); const list = await r0.json(); const j = list.find(x => x.title === 'IEEE Journal 2026');
    await a('PUT', `/api/admin/resources/${j.id}`, JSON.stringify({ visible: false }), J);
    assert.equal((await anon('GET', '/api/elibrary?type=Journal')).data.total, 0);
  });
  await t('About / Services / Helpdesk content: public read, admin edit, validation', async () => {
    const a = admin, nobody = client();
    const pub = (await anon('GET', '/api/pages')).data;
    assert.ok(pub.about.history.length > 50 && pub.services.items.length >= 6 && pub.helpdesk.faqs.length >= 3 && pub.helpdesk.topics.length >= 3 && pub.icons.includes('book') && pub.rules.LOAN_DAYS);
    assert.equal((await nobody('PUT', '/api/admin/pages', { about: { title: 'x' } })).status, 401);
    assert.equal((await stu2('PUT', '/api/admin/pages', { about: { title: 'x' } })).status, 403);
    const up = (await a('PUT', '/api/admin/pages', { about: { title: 'New title', team: [{ name: 'Dr. Rahman', role: 'Librarian', bio: 'Hi' }, { name: '' }] },
      services: { items: [{ icon: 'nope', title: 'Binding', text: 'We bind theses.' }] }, helpdesk: { topics: 'Billing\nOther\nBilling', faqs: [{ q: 'Q1?', a: 'A1' }] } })).data;
    assert.equal(up.about.title, 'New title'); assert.equal(up.about.team.length, 1); assert.equal(up.about.intro, pub.about.intro);
    assert.equal(up.services.items[0].icon, 'book'); assert.deepEqual(up.helpdesk.topics, ['Billing', 'Other']);
    assert.equal((await anon('GET', '/api/pages')).data.about.title, 'New title');       // visible to visitors at once
    assert.equal((await a('PUT', '/api/admin/pages', { about: { title: '   ' } })).status, 400);
    assert.equal((await a('PUT', '/api/admin/pages', { helpdesk: { topics: '' } })).status, 400);
    assert.equal((await a('PUT', '/api/admin/pages', { services: { items: 'nope' } })).status, 400);
    assert.equal((await a('PUT', '/api/admin/pages', { about: { stats: Array.from({ length: 9 }, (_, i) => ({ label: 'L' + i, value: '1' })) } })).status, 400);
    // script in content is stored as text only (pages escape it when drawing)
    const x = (await a('PUT', '/api/admin/pages', { about: { vision: '<img src=x onerror=alert(1)>' } })).data; assert.equal(x.about.vision, '<img src=x onerror=alert(1)>');
    const js = await (await fetch(base + '/pages.js')).text(); assert.ok(js.includes('prose(a.vision)') && js.includes('const prose = t => `<p class="prose">${esc(t)}</p>`'));
  });
  await t('management team: Facebook / WhatsApp / LinkedIn links are validated and editable', async () => {
    const put = body => admin('PUT', '/api/admin/pages', { about: body });
    const ok = await put({ teamTitle: 'Management team', teamIntro: '', team: [
      { name: 'Dr. Hasan', role: 'Chief Librarian', bio: 'Hello', facebook: 'facebook.com/dr.hasan', whatsapp: '+880 1712-345678', linkedin: 'https://www.linkedin.com/in/hasan' },
      { name: 'Ms. Akter', role: 'Officer', whatsapp: 'https://wa.me/8801911222333' }, { name: 'No links', role: 'Clerk' }] });
    assert.equal(ok.status, 200); const tm = ok.data.about.team;
    assert.equal(tm[0].facebook, 'https://facebook.com/dr.hasan'); assert.equal(tm[0].whatsapp, 'https://wa.me/8801712345678'); assert.equal(tm[0].linkedin, 'https://www.linkedin.com/in/hasan');
    assert.equal(tm[1].whatsapp, 'https://wa.me/8801911222333'); assert.equal(tm[2].facebook, ''); assert.equal(ok.data.about.teamTitle, 'Management team'); assert.equal(ok.data.about.teamIntro, '');
    assert.equal((await anon('GET', '/api/pages')).data.about.team[0].name, 'Dr. Hasan');
    for (const bad of [{ facebook: 'javascript:alert(1)' }, { facebook: 'https://evil.example/x' }, { linkedin: 'https://facebook.com/x' }, { whatsapp: '12' }, { whatsapp: 'https://evil.example/8801' }, { facebook: 'https://facebook.com.evil.example/x' }])
      assert.equal((await put({ team: [{ name: 'X', role: 'Y', ...bad }] })).status, 400, JSON.stringify(bad));
    assert.equal((await anon('GET', '/api/pages')).data.about.team.length, 3);     // rejected edits changed nothing
  });
  await t('management team: each member can have a photo; all six social networks are accepted', async () => {
    const jpg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(120, 5)]), png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(40, 2)]);
    const a = rawClient(); await a.login('admin@gono.edu.bd', 'admin123', 'admin'); const J = { 'Content-Type': 'application/json' };   // (by email: the plain "admin" login is rate-limited after the earlier tests)
    const put = async about => { const r = await a('PUT', '/api/admin/pages', JSON.stringify({ about }), J); return { status: r.status, data: await r.json() }; };
    let r = await put({ team: [{ name: 'Photo One', role: 'Chief', instagram: 'instagram.com/one', x: 'https://x.com/one', youtube: 'https://youtube.com/@one', facebook: 'https://facebook.com/one', linkedin: 'https://linkedin.com/in/one', whatsapp: '8801700000001' }, { name: 'Photo Two', role: 'Officer' }] });
    assert.equal(r.status, 200); let [m1, m2] = r.data.about.team;
    assert.ok(/^[0-9a-f]{12}$/.test(m1.id) && m1.id !== m2.id); assert.equal(m1.photo, null); assert.equal(m1.instagram, 'https://instagram.com/one'); assert.equal(m1.x, 'https://x.com/one'); assert.equal(m1.youtube, 'https://youtube.com/@one');
    // validation: wrong host for a network, non-images, unknown member, not an admin
    assert.equal((await put({ team: [{ name: 'X', instagram: 'https://facebook.com/x' }] })).status, 400);
    assert.equal((await put({ team: [{ name: 'X', x: 'https://evil.example/x' }] })).status, 400);
    assert.equal((await a('PUT', `/api/admin/team/${m1.id}/photo`, Buffer.from('<svg onload=1>'))).status, 415);
    assert.equal((await a('PUT', `/api/admin/team/${m1.id}/photo`, Buffer.alloc(0))).status, 400);
    assert.equal((await a('PUT', '/api/admin/team/aaaaaaaaaaaa/photo', jpg)).status, 404);
    assert.equal((await stu('PUT', `/api/admin/team/${m1.id}/photo`, { x: 1 })).status, 403);
    assert.equal((await client()('PUT', `/api/admin/team/${m1.id}/photo`, { x: 1 })).status, 401);
    // upload: public, served as an image, and shown in the public page data without internal file names
    const up = await a('PUT', `/api/admin/team/${m1.id}/photo`, jpg); assert.equal(up.status, 200); const pg = await up.json();
    assert.ok(pg.about.team[0].photo.startsWith(`/files/tm/${m1.id}?v=`)); assert.equal(pg.about.team[1].photo, null); assert.ok(!JSON.stringify(pg).includes('stored'));
    const pub = await fetch(base + pg.about.team[0].photo); assert.equal(pub.status, 200); assert.equal(pub.headers.get('content-type'), 'image/jpeg'); assert.equal(Buffer.from(await pub.arrayBuffer()).length, jpg.length);
    assert.ok(!JSON.stringify((await anon('GET', '/api/pages')).data).includes('stored'));
    assert.equal((await fetch(base + `/files/tm/${m2.id}`)).status, 404);              // member without a photo
    assert.equal((await fetch(base + '/files/tm/../x')).status, 404);
    // replacing with a PNG works; saving the page text keeps the photo and the id
    assert.equal((await a('PUT', `/api/admin/team/${m1.id}/photo`, png)).status, 200);
    assert.equal((await fetch(base + `/files/tm/${m1.id}`)).headers.get('content-type'), 'image/png');
    r = await put({ team: [{ id: m2.id, name: 'Photo Two', role: 'Officer (new title)' }, { id: m1.id, name: 'Photo One', role: 'Chief' }, { name: 'Brand new', role: 'Clerk' }] });   // reordered + a new member
    assert.equal(r.status, 200); assert.deepEqual(r.data.about.team.map(m => m.id).slice(0, 2), [m2.id, m1.id]); assert.ok(r.data.about.team[1].photo); assert.equal(r.data.about.team[2].photo, null);
    // removing the photo
    const del = await a('DELETE', `/api/admin/team/${m1.id}/photo`); assert.equal(del.status, 200); assert.equal((await del.json()).about.team[1].photo, null);
    assert.equal((await fetch(base + `/files/tm/${m1.id}`)).status, 404);
    // a member removed from the list takes their photo with them
    await a('PUT', `/api/admin/team/${m2.id}/photo`, jpg); r = await put({ team: [{ id: m1.id, name: 'Photo One', role: 'Chief' }] });
    assert.equal(r.data.about.team.length, 1); assert.equal((await fetch(base + `/files/tm/${m2.id}`)).status, 404);
    // site-wide social links: all six networks can be set; the website draws only the ones that have a link
    const site = await a('PUT', '/api/admin/site', JSON.stringify({ social: { instagram: 'https://instagram.com/gblms', x: 'https://x.com/gblms' } }), J); assert.equal(site.status, 200);
    const sv = await (await fetch(base + '/api/site')).json(); assert.deepEqual(Object.keys(sv.social).sort(), ['facebook', 'instagram', 'linkedin', 'whatsapp', 'x', 'youtube']); assert.equal(sv.social.instagram, 'https://instagram.com/gblms');
    const siteJs = await (await fetch(base + '/site.js')).text(); assert.ok(siteJs.includes('all = false') && siteJs.includes('Quick Links') && siteJs.includes('class="fbar"'));
    const home = await (await fetch(base + '/')).text(); assert.ok(home.includes("'Instagram'") && home.includes('.filter(([, u]) => u)') && !home.includes('link not added yet'));
    const css = await (await fetch(base + '/site.css')).text(); assert.ok(/\.member \.avatar[^}]*border-radius: 22px/.test(css));  // team photos: rounded squares
    assert.equal((await fetch(base + '/portal')).status, 200); assert.equal((await fetch(base + '/portal.js')).status, 200); // admin folder is served too
  });
  await t('helpdesk contact form keeps the chosen topic', async () => {
    const a = admin;
    assert.equal((await client()('POST', '/api/contact', { name: 'Nadia', email: 'nadia@example.com', topic: 'E-library access', message: 'I cannot open a file.' })).status, 200);
    const m = (await a('GET', '/api/admin/messages')).data.find(x => x.email === 'nadia@example.com'); assert.equal(m.topic, 'E-library access');
  });
  await t('logout ends the session', async () => {
    await stu('POST', '/api/auth/logout'); assert.equal((await stu('GET', '/api/me/loans')).status, 401);
  });
  console.log(`\n  ${passed} test groups passed`);
  srv.close(); setTimeout(() => process.exit(process.exitCode || 0), 100);
})();
