# GBLMS – Gono Bishwabidyalay Library Management System

Website, admin panel and backend, kept in three separate folders. **No `npm install` needed** – the server uses only Node's built-in modules.

## Run it

```bash
cd gblms/backend
npm start            # or: node server.js
```

Open **http://localhost:4000** (needs Node 18 or newer – check with `node -v`).

| Want to… | Do this |
|---|---|
| Change settings | edit `.env` (copy of `.env.example`): `PORT`, `HOST`, `ADMIN_PASSWORD`, `MAX_UPLOAD_MB`, `DATA_DIR` |
| Use another port | `PORT=3001 npm start` (Windows PowerShell: `$env:PORT=3001; npm start`) |
| Set your own admin password | set `ADMIN_PASSWORD` **before the first run** |
| Start fresh | stop the server and delete `data/db.json` (and `data/uploads/` if you want the files gone too) |
| Allow bigger uploads | `MAX_UPLOAD_MB=100 npm start` (default 50) |
| Run the tests | `npm test` |

## Logins (created on first run)

| Role | Sign in with | Password |
|---|---|---|
| Admin | username `admin` | `admin123` |
| Demo member | `student@gono.edu.bd` | `student123` |

New students create their own account from **Log in → User → Create an account**. The form asks for full name, student ID, email, phone number, department, batch and semester (all required, student ID and email must be unique). Existing accounts can fill in the new details from the **Profile** tab.

## How it works

* **Website** (`/`) – same design as before. Catalogue search, New Arrivals and the Notice Board now load from the database. Click **Log in** → Admin or User. Clicking a book while logged out asks you to log in; while logged in it opens the portal.
* **Portal** (`/portal`) – responsive dashboard.
  * *Members:* browse and search, borrow, renew, reserve, cancel reservations, loan history, fines, profile and password.
  * *Admin:* overview stats, add/edit/delete books (and choose what shows in New Arrivals), **upload and manage e-library files**, issue and return books, mark fines paid, **add / edit / suspend / delete members and reset their passwords**, manage notices, read contact-form messages, and change the **library rules and department list** from the Settings tab.
  * *Everyone:* a profile photo (shown in the portal header and, in place of "Log in", in the website menu once signed in).
* **Books with cover and PDF** – in **Admin → Books → Add book** (any category/section) you can attach a **book cover (JPG)** and the **book PDF**. The book then appears on the website with its cover and **Read** / **Download** buttons (visitors who are not logged in are asked to log in first; students can read it in the browser or download it). Tick *Show in Curated Masterworks* to put a book in the home-page slider. E-library items can have a cover too.
* **Website content (Admin → Website)** – change the phone number, email, address, opening hours, map link, home-page heading and intro, footer text, copyright line, social-media links (Facebook, YouTube, LinkedIn, WhatsApp, X, Instagram – an icon appears in the footer only when you add its link; with no links there are no icons), the footer resource links and the site logo. Notices, library rules and departments are in their own tabs.
* **E-library** – the admin uploads real files (PDF, Word, PowerPoint, Excel, EPUB, TXT, images) as *Book / Notes / Question bank / Journal / Other*, tagged with a department. Members open them in the browser (**Read**) or **Download** them. Files can be hidden, replaced or deleted at any time. Only logged-in users can reach the files.
* **Library rules** (now editable in **Admin → Settings**; the defaults live in `RULES` at the top of `server.js`): 14-day loans, 2 renewals of 7 days, max 3 books, ৳5/day fine, no borrowing while overdue. Reservations queue, and the first person in line is promoted when a copy returns.


## Public pages (new)

| Page | Address | What it shows |
|---|---|---|
| About Library | `/about` | history, vision, mission, numbers, values, team, how to visit |
| OPAC Search | `/opac` | catalogue search by all fields / title / author / subject / ISBN / publisher, filters (category, language, year, available now), sorting, book details |
| E-Library | `/elibrary` | every digital item the university provides: books (with PDF), notes & sheets, question banks, journals. Anyone can browse; reading or downloading needs a login |
| Services | `/services` | service cards + the borrowing rules currently in force (from Settings) |
| Helpdesk | `/helpdesk` | phone, email, address, hours, message form with topics, FAQ |

Every page has the same menu, **footer, social icons and hover effects** as the home page (drop-down lists on desktop, expandable lists on phones) and the **Log in** box opens on the page you are on – you are not sent back to the home page. All five are responsive (phone, tablet, desktop), support light/dark mode and keyboard use.

**Team photos are shown as rounded squares. Everything on them is editable from the admin panel (`/portal`):**

* **Pages tab** – About (text, numbers, values, **management team: add / remove / reorder members, upload each member's own photo, and give each one Facebook / WhatsApp / LinkedIn / Instagram / X / YouTube links**), Services (cards), Helpdesk (topics, FAQ). Saved changes are live immediately. A new member's photo is uploaded when you press **Save About page**.
* **Books tab** – title, author, category, rack, year, ISBN, copies, publisher, edition, language, subject, summary; **replace or remove the cover** and the PDF at any time.
* **E-library tab** – upload, hide, replace or delete files and covers.
* **Website tab** – phone, email, address, hours, map, logo, footer, social and resource links. **Settings tab** – loan rules and departments.

New API routes: `GET /api/pages`, `PUT /api/admin/pages`, `GET /api/elibrary` (public list, files stay login-only), `GET /api/languages`; `GET /api/books` accepts `field`, `language`, `yearFrom`, `yearTo`, `sort`; `POST /api/contact` accepts `topic`.

## If you replaced an older copy and still see the old menu

1. Stop the old server (Ctrl+C in its terminal) and start it again with `npm start`.
2. Open `http://localhost:4000/api/health` – it must show `"build":"2026-10-18.6"`. If it does not, you are still running the old folder.
3. Press **Ctrl+F5** (Cmd+Shift+R on Mac) once. Scripts and styles are now always re-checked, so this is only needed once.

## Project layout

```
gblms/
├── frontend/   public website: index.html (home), about / opac / elibrary / services / helpdesk .html,
│               site.css, site.js, pages.js, nav.css, theme.css, i18n.js, chat.js/.css
├── admin/      admin + member portal (/portal): portal.html, portal.js, portal.css
└── backend/    server.js (REST API, auth, static server), test.js (npm test),
                package.json, README.md, .gitignore, .env / .env.example,
                data/db.json (database) and data/uploads/ (uploaded files – back these up together)
```

Run every command from the `backend/` folder. The server serves `../frontend` first and then `../admin`, so every address stays the same (`/`, `/about`, `/portal` …). The admin portal reuses `theme.css`, `i18n.js` and the chat files from `frontend/`.

**Hosting (e.g. Render):** set *Root Directory* to `backend`, *Build Command* `npm install` (or empty), *Start Command* `npm start`, and add the environment variables `ADMIN_PASSWORD` (and `HOST=0.0.0.0` if the platform is not detected).

## API summary (JSON, cookie session)

```
POST /api/auth/login | register | logout      GET /api/auth/me
GET  /api/books?q=&category=&available=1      GET /api/books/new   GET /api/categories
GET  /api/notices?category=                   POST /api/contact
POST /api/books/:id/borrow | reserve          POST /api/loans/:id/renew
GET  /api/me/summary | loans | reservations   DELETE /api/reservations/:id
-- admin only --
POST/PUT/DELETE /api/books[/:id]              GET /api/admin/stats | loans | users | messages
POST /api/admin/users   PATCH|DELETE /api/admin/users/:id   (members: add, edit, reset password, delete)
GET/POST /api/admin/resources   PUT|DELETE /api/admin/resources/:id   PUT /api/admin/resources/:id/file?name=x.pdf  (raw bytes)
PUT|DELETE /api/admin/books/:id/cover   PUT|DELETE /api/admin/books/:id/file?name=x.pdf  (raw bytes)   GET /files/b/:id[?download=1] (login)   GET /files/bc/:id (public cover)
PUT|DELETE /api/admin/resources/:id/cover                     PUT|DELETE /api/admin/team/:memberId/photo   GET /files/tm/:memberId (public team photo)
GET /api/site   PUT /api/admin/site   PUT|DELETE /api/admin/site/logo
PUT /api/admin/settings                       GET /api/settings/public   GET /api/resources   GET /files/r/:id[?download=1]
PUT|DELETE /api/me/avatar   PATCH /api/me     (profile photo and details)
POST /api/admin/loans (issue)                 POST /api/loans/:id/return | pay-fine
PATCH /api/admin/users/:id                    POST/PUT/DELETE /api/notices[/:id]
```

## Security notes

Uploads are limited by size and type, checked by their real file signature (a renamed `.exe` or `.html` is rejected), stored under random names outside the public folder, and served only to logged-in users with `nosniff` and a locked-down CSP.

Passwords are hashed with scrypt; sessions use random HttpOnly cookies; login, register and contact are rate-limited; cross-origin writes are rejected; static serving blocks path traversal. By default the server only listens on `localhost`. **Change the admin password before using this on a real network**, and put it behind HTTPS for production.

## Still demo-only

The AI chatbot, floor-map search and plagiarism checker on the website are front-end demos, as before.
