# IntegratedManagementSystemForOrganization1
IT Agile Development final project repository.  

We are creating an integrated digital management system that will centralize organizational services such as membership management, document storage, electronic voting, communication management, meeting scheduling, and financial record keeping.
# Integrated Management System for Organization X

A full-stack web portal for managing organizational members, documents, meetings, electronic voting, and financial records. Built with Node.js, Express, PostgreSQL, and vanilla JavaScript as part of an Agile development project across multiple sprints.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Database Setup](#database-setup)
  - [Mac — TablePlus](#mac--tableplus)
  - [Windows — pgAdmin](#windows--pgadmin)
- [Schema Explained](#schema-explained)
- [Environment Variables](#environment-variables)
- [Installation & Running](#installation--running)
- [Project Structure](#project-structure)
- [Team](#team)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Frontend | Vanilla JavaScript, HTML, CSS |
| Authentication | Session-based (express-session) + Email OTP (2FA) |
| Email | Nodemailer (Gmail SMTP) |
| File uploads | Multer |

---

## Prerequisites

Before running the project, make sure you have installed:

- [Node.js](https://nodejs.org/) v18 or later
- [PostgreSQL](https://www.postgresql.org/download/) v14 or later
- A database client — see below for setup instructions per platform

---

## Database Setup

### Mac — TablePlus

> **Mac users must use TablePlus.** It is the recommended database client for this project on macOS.

**Step 1 — Download TablePlus**

Go to [https://tableplus.com](https://tableplus.com) and download the free Mac version. Install it like any other Mac app.

**Step 2 — Create a PostgreSQL role**

Open Terminal and run:

```bash
createuser -s your_mac_username
```

Replace `your_mac_username` with your actual Mac username (the name shown in Terminal before the `%` sign). This creates a PostgreSQL superuser role matching your system account.

If you are unsure of your username, run `whoami` in Terminal.

**Step 3 — Create the database**

```bash
createdb databaseForOrganizationTemp
```

**Step 4 — Connect in TablePlus**

Open TablePlus and click the `+` button to create a new connection. Fill in:

| Field | Value |
|---|---|
| Connection Type | PostgreSQL |
| Name | Organization X (or anything you like) |
| Host | localhost |
| Port | 5432 |
| User | your_mac_username |
| Password | (leave blank if you have no password set) |
| Database | databaseForOrganizationTemp |

Click **Test** to confirm the connection works, then **Connect**.

**Step 5 — Run the schema**

In Terminal, navigate to the project root folder and run:

```bash
psql -U your_mac_username -d databaseForOrganizationTemp -f schema.sql
```

This creates all the base tables. Then open a new SQL query in TablePlus and run the following to create the remaining tables that are not in `schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS polls (
    id          SERIAL PRIMARY KEY,
    title       TEXT NOT NULL,
    description TEXT,
    start_date  TIMESTAMPTZ NOT NULL,
    end_date    TIMESTAMPTZ NOT NULL,
    status      TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'closed')),
    access      TEXT DEFAULT 'members' CHECK (access IN ('members', 'admin')),
    created_by  INTEGER REFERENCES members(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS poll_options (
    id          SERIAL PRIMARY KEY,
    poll_id     INTEGER REFERENCES polls(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    vote_count  INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS votes (
    id         SERIAL PRIMARY KEY,
    member_id  INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    poll_id    INTEGER NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_id  INTEGER NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
    voted_at   TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(member_id, poll_id)
);

CREATE INDEX IF NOT EXISTS idx_votes_poll   ON votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_member ON votes(member_id);

CREATE TABLE IF NOT EXISTS financial_transactions (
    id          SERIAL PRIMARY KEY,
    type        TEXT NOT NULL CHECK (type IN ('income', 'expenditure')),
    amount      NUMERIC(12,2) NOT NULL,
    date        DATE NOT NULL,
    category    TEXT DEFAULT 'Other',
    description TEXT,
    recorded_by INTEGER REFERENCES members(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

The `meetings` table is created automatically when the server starts for the first time — no manual SQL needed.

---

### Windows — pgAdmin

**Step 1 — Install pgAdmin**

Download pgAdmin 4 from [https://www.pgadmin.org/download/](https://www.pgadmin.org/download/) and install it. pgAdmin comes bundled with PostgreSQL or can be installed separately.

**Step 2 — Create the database**

1. Open pgAdmin and expand the server tree on the left.
2. Right-click **Databases** → **Create** → **Database**.
3. Set the database name to `databaseForOrganizationTemp` and click **Save**.

**Step 3 — Run the schema**

1. Click on `databaseForOrganizationTemp` in the left panel to select it.
2. Click the **Query Tool** button in the toolbar (or press `Alt+Shift+Q`).
3. Open `schema.sql` from the project folder: **File → Open File** and select `schema.sql`.
4. Click the **Execute / Run** button (or press `F5`).

You should see `Query returned successfully` in the Messages panel.

**Step 4 — Run the additional tables**

Still in the Query Tool, clear the editor, paste the SQL block from Step 5 of the Mac instructions above (the `CREATE TABLE IF NOT EXISTS polls ...` block), and run it.

**Step 5 — Update your `.env`**

On Windows, PostgreSQL typically requires a password. Make sure your `.env` file has the correct credentials — see the Environment Variables section below.

---

## Schema Explained

The database has the following tables. All foreign keys use `ON DELETE CASCADE` or `ON DELETE SET NULL` where appropriate so that deleting a member does not orphan related records.

### `members`
Stores all registered users of the system.

| Column | Type | Description |
|---|---|---|
| `id` | SERIAL | Auto-incrementing primary key |
| `full_name` | VARCHAR(255) | Member's full name |
| `email` | VARCHAR(255) UNIQUE | Login email address |
| `password` | VARCHAR(255) | Bcrypt-hashed password |
| `role` | VARCHAR(50) | Role in the organisation: `admin`, `member`, `president`, `vice_president`, `secretary`, `treasurer`, `technical_lead` |
| `reset_token` | VARCHAR(255) | Token for password reset emails |
| `reset_token_expires` | TIMESTAMP | Expiry time for the reset token |
| `created_at` | TIMESTAMP | When the account was registered |

### `documents`
Stores uploaded files managed by admins.

| Column | Type | Description |
|---|---|---|
| `id` | SERIAL | Primary key |
| `title` | TEXT | Human-readable document title |
| `filename` | TEXT | Original filename |
| `filepath` | TEXT | Path to the stored file on disk |
| `category` | TEXT | Document category (e.g. Financial, Policy, Meeting Minutes) |
| `access` | TEXT | Who can see it: `members` or `admin` |
| `uploaded_by` | INTEGER | FK → `members.id` — who uploaded it |
| `uploaded_at` | TIMESTAMPTZ | Upload timestamp |

Indexed on `category` and `access` for fast filtering.

### `polls`
Stores voting polls created by admins.

| Column | Type | Description |
|---|---|---|
| `id` | SERIAL | Primary key |
| `title` | TEXT | Poll question or title |
| `description` | TEXT | Optional longer description |
| `start_date` | TIMESTAMPTZ | When voting opens |
| `end_date` | TIMESTAMPTZ | When voting closes |
| `status` | TEXT | `scheduled`, `active`, or `closed` — auto-updated on each request |
| `access` | TEXT | `members` or `admin` |
| `created_by` | INTEGER | FK → `members.id` |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

### `poll_options`
Each row is one answer option belonging to a poll.

| Column | Type | Description |
|---|---|---|
| `id` | SERIAL | Primary key |
| `poll_id` | INTEGER | FK → `polls.id` (CASCADE delete) |
| `option_text` | TEXT | The answer option label |
| `vote_count` | INTEGER | Running total — incremented atomically on each vote |

### `votes`
Records each member's vote. The unique constraint on `(member_id, poll_id)` enforces one vote per person per poll at the database level.

| Column | Type | Description |
|---|---|---|
| `id` | SERIAL | Primary key |
| `member_id` | INTEGER | FK → `members.id` |
| `poll_id` | INTEGER | FK → `polls.id` |
| `option_id` | INTEGER | FK → `poll_options.id` — the chosen option |
| `voted_at` | TIMESTAMPTZ | When the vote was cast |

**Unique constraint:** `UNIQUE(member_id, poll_id)` — a duplicate vote returns a 409 response.

### `meetings`
Created automatically on first server start by `meetingController.js`. Stores all scheduled meetings.

| Column | Type | Description |
|---|---|---|
| `id` | SERIAL | Primary key |
| `title` | VARCHAR(255) | Meeting title |
| `date` | DATE | Meeting date |
| `time` | TIME | Meeting time |
| `duration` | VARCHAR(20) | e.g. `1 hr`, `30 min` |
| `type` | VARCHAR(20) | `in-person`, `virtual`, or `hybrid` |
| `location` | VARCHAR(500) | Room name or meeting link URL |
| `agenda` | TEXT | Optional agenda text |
| `status` | VARCHAR(20) | `scheduled`, `completed`, `cancelled`, or `archived` |
| `minutes` | TEXT | Meeting minutes recorded after the meeting |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `created_by` | INTEGER | FK → `members.id` |

### `financial_transactions`
Stores income and expenditure records managed by admins.

| Column | Type | Description |
|---|---|---|
| `id` | SERIAL | Primary key |
| `type` | TEXT | `income` or `expenditure` |
| `amount` | NUMERIC(12,2) | Transaction amount |
| `date` | DATE | Transaction date |
| `category` | TEXT | e.g. Membership Fee, Venue Hire, Equipment |
| `description` | TEXT | Optional notes |
| `recorded_by` | INTEGER | FK → `members.id` |
| `created_at` | TIMESTAMPTZ | When the record was created |

---

## Environment Variables

Create a `.env` file in the project root. **Never commit this file to GitHub** — it is listed in `.gitignore`.

```env
# PostgreSQL connection
DB_HOST=localhost
DB_PORT=5432
DB_NAME=databaseForOrganizationTemp
DB_USER=your_postgres_username
DB_PASSWORD=your_postgres_password

# Email (Gmail SMTP — for OTP login and meeting notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_gmail_address@gmail.com
SMTP_PASS=your_gmail_app_password

# Session
SESSION_SECRET=scrum13-secret-key
```

> **Gmail App Password:** Gmail requires an App Password rather than your regular account password. Go to your Google Account → Security → 2-Step Verification → App Passwords, create one for this app, and paste it as `SMTP_PASS`.

---

## Installation & Running

```bash
# 1. Clone the repository
git clone https://github.com/Kalvarez09/IntegratedManagementSystemForOrganization1.git
cd IntegratedManagementSystemForOrganization1

# 2. Install dependencies
npm install

# 3. Create your .env file (see Environment Variables above)

# 4. Set up the database (see Database Setup above)

# 5. Start the server
npm start
```

The server runs on `http://localhost:3001` by default. Open that URL in your browser and you will be redirected to the login page.

> **First time?** Register an account, then manually update your role to `admin` in TablePlus or pgAdmin by editing the `role` column in the `members` table. All subsequent admin actions (adding members, creating polls, uploading documents) can be done through the dashboard.

---

## Project Structure

```
├── client/
│   ├── css/                  # Stylesheets
│   ├── images/               # Team photos and icons
│   ├── js/                   # Frontend JavaScript
│   │   ├── dashboard.js      # Admin dashboard SPA logic
│   │   ├── meetings.js       # Admin meeting management
│   │   ├── Memberindex.js    # Shared member page logic (auth, topbar)
│   │   ├── polls.js          # Member voting UI
│   │   └── login.js          # Login + OTP verification
│   └── pages/
│       ├── Admin/            # Admin dashboard HTML
│       ├── Member/           # Member portal HTML pages
│       └── MainPage/         # Login, register, home, about
├── server/
│   ├── controllers/          # Route handler functions
│   ├── database/             # PostgreSQL pool connection
│   ├── routes/               # Express route definitions
│   └── services/             # Notification service (email)
├── uploads/
│   └── documents/            # Uploaded document files
├── .env                      # Environment variables (not committed)
├── .gitignore
├── index.js                  # Express app entry point
├── package.json
└── schema.sql                # Base database schema
```

---
