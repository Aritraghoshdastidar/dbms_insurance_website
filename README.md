# Insurance workflow automation software

# Insurance Workflow Automation — Local Development README

This README explains how to run the backend API and frontend locally, set up the database, and exercise the notification features. It is intentionally concise and focused on running the project — no course or team information is included.

## Prerequisites
- Node.js 18+ and npm
- MySQL 8+
- A terminal (PowerShell on Windows)

## Quick overview
- Backend: `server.js` (Express, uses `mysql2/promise`)
- Frontend: `insurance-frontend/` (React)
- Database scripts: `database_scripts/` (contains DDL, triggers, and seed data)
- Notifications are stored in the `reminder` table (see `02_create_tables.sql`) and created by triggers in `03_create_triggers.sql`.

## 1) Database setup

1. Start your MySQL server and note the root password.

2. Create the database and schema. From PowerShell, either import the single combined SQL file or run the scripts in order.

Option A — import the combined SQL file (recommended if present):
```powershell
# PowerShell: pipe the SQL file contents to mysql.exe (avoids < redirection issues)
Get-Content -Raw "${PWD}\database_scripts\dbms_database_fixed.sql" | "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
```

Option B — run scripts individually (in order) using mysql client:
```powershell
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p < "C:\PESU\dbms\project\database_scripts\01_create_database.sql"
# Repeat for 02_create_tables.sql, 03_create_triggers.sql, etc., or open mysql and run SOURCE commands
```

Notes:
- The table that holds notifications is named `reminder` (not `reminder_notification`) — see `database_scripts/02_create_tables.sql`.
- If you have trouble with the mysql.exe path, install MySQL client or add it to PATH or run via MySQL Workbench.

## 2) Backend (API) setup

1. Create a `.env` file in project root if not present (sample variables used by `server.js`):
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_ROOT_PASSWORD
DB_NAME=dbms_database
JWT_SECRET=some_change_this_secret
PORT=3001
```

2. Install and start the backend (from project root):
```powershell
npm install
npm start
```

3. Health check: open http://localhost:3001/api/health (server logs should show a start message)

## 3) Frontend setup

1. Start the React app:
```powershell
cd insurance-frontend
npm install
npm start
```

2. App will typically run at http://localhost:3000

## 4) How notifications work (summary)
- Storage: `reminder` table (see `database_scripts/02_create_tables.sql`)
- Generation: DB triggers in `database_scripts/03_create_triggers.sql` insert into `reminder` on events such as claim updates, payment success, policy insertion, and renewal reminders.
- Backend: two customer endpoints are provided in `server.js`:
  - `GET /api/notifications` — returns the logged-in customer's reminders from `reminder`
  - `PUT /api/notifications/:notificationId/read` — marks a reminder as read
- Frontend: `insurance-frontend/src/components/NotificationsPanel.js` polls `GET /api/notifications` (every 15s) and marks reminders read via the PUT endpoint.

Authentication: the server uses JWT tokens. The login endpoint issues a token with a payload that includes `customer_id`. The frontend stores the token in `localStorage` and sends it in the `Authorization: Bearer <token>` header for protected API calls.

## 5) Common troubleshooting
- MySQL connection errors: verify `.env` DB_PASSWORD and the mysql client path. Use `Get-Content -Raw` piping if PowerShell rejects `< file.sql` redirection.
- If renewal reminders have `customer_id = NULL`, run the backfill script `database_scripts/10_fix_renewal_customer_link.sql` (it backfills and updates the trigger to attach renewal reminders when customer links are created).

## 6) Useful commands
- Run a quick query to inspect recent reminders (PowerShell):
```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p -e `
"SELECT notification_id, notification_date, status, type, customer_id, message FROM dbms_database.reminder ORDER BY notification_date DESC LIMIT 20;"
```

- Mark notification read (via API using PowerShell):
```powershell
$token = "<paste-jwt-here>"
Invoke-RestMethod -Uri "http://localhost:3001/api/notifications/NOTIF_ID/read" -Method Put -Headers @{ Authorization = "Bearer $token" }
```

## 7) Project layout (short)
- `server.js` — Express API and middleware (auth, admin checks, notifications endpoints)
- `database_scripts/` — SQL DDL, triggers, seed data, and fix scripts
- `insurance-frontend/` — React app and components (NotificationsPanel, Dashboard, etc.)

## 8) Tests (if any)
- Run `npm test` from project root (backend) if tests are present.


