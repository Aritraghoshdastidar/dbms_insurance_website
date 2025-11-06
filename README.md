# Insurance workflow automation software

**Project ID:** P04  
**Course:** UE23CS341A  
**Academic Year:** 2025  
**Semester:** 5th Sem  
**Campus:** RR  
**Branch:** AIML  
**Section:** B  
**Team:** Logicore

## 📋 Project Description

This app has insurance companies and users who want to get insurance as users. This should be able to 2/4 wheeler and personal healthcare ploicies.

This repository contains the source code and documentation for the Insurance workflow automation software project, developed as part of the UE23CS341A course at PES University.

## 🧑‍💻 Development Team (Logicore)

- [@Aritraghoshdastidar](https://github.com/Aritraghoshdastidar) - Scrum Master
- [@bshrikrishna](https://github.com/bshrikrishna) - Developer Team
- [@archi829](https://github.com/archi829) - Developer Team
- [@pes1ug23am077-aiml](https://github.com/pes1ug23am077-aiml) - Developer Team

## 👨‍🏫 Teaching Assistant

- [@Amrutha-PES](https://github.com/Amrutha-PES)
- [@VenomBlood1207](https://github.com/VenomBlood1207)

## 👨‍⚖️ Faculty Supervisor

- [@Arpitha035](https://github.com/Arpitha035)


## 🚀 Getting Started (Local-only)

This project is configured to run locally without any Git metadata or remote connections.

### Prerequisites
- Node.js 18+ and npm
- MySQL 8+

### 1) Backend setup

#### First: Configure MySQL Connection

**CRITICAL:** You must set your MySQL password before the backend will work!

1. **Find your MySQL root password** (what you use to login to MySQL Workbench or command line)
   
2. **Update .env file**:
   - Open `.env` in the project root
   - Find the line: `DB_PASSWORD=YOUR_MYSQL_ROOT_PASSWORD_HERE`
   - Replace `YOUR_MYSQL_ROOT_PASSWORD_HERE` with your actual password
   - Save the file

3. **Test your connection** (optional):
   - Run `test-mysql.bat` to verify MySQL credentials work
   - Or manually test: `mysql -u root -p` (enter your password when prompted)

#### Common MySQL Passwords by Installation:
- **XAMPP**: Usually empty `""` or `"root"`
- **WAMP**: Check WAMP control panel
- **Manual Install**: Whatever you set during installation
- **Can't remember?** See `MYSQL_SETUP.md` for password reset instructions

#### Then: Setup Database and Start Server

1. Create the MySQL database and schema:
   - Open MySQL command line: `mysql -u root -p` (enter your password)
   - Run: `source database_scripts/dbms_database_fixed.sql;`
   - Or import using MySQL Workbench: File → Run SQL Script → select `dbms_database_fixed.sql`
   - This creates database `dbms_database` with tables, triggers, and sample data

2. Install backend dependencies and start the API:

   Windows PowerShell (from the project root):

   ```powershell
   npm install
   npm start
   ```

   **Expected output:**
   ```
   ✅ Backend API server running at http://localhost:3001
   🔗 Connected to MySQL database 'dbms_database'.
   ```

   **If you see a warning instead:**
   ```
   ⚠️ Could not connect to MySQL: Access denied...
   ```
   → Your DB_PASSWORD in .env is incorrect. Update it and restart.

   The API will run at http://localhost:3001. Health check: http://localhost:3001/api/health

### 2) Frontend setup
1. Install dependencies and start the React app:

   ```powershell
   cd insurance-frontend
   npm install
   npm start
   ```

   The UI will run at http://localhost:3000

### Default local accounts
- Admin example: Use the admin `ADM002` with the seeded email `j.adjuster@insurance.com` and the password hash already present in the database (set your own if needed).
- Customer example: Register a new user via the UI or use seeded users.

## 📁 Project Structure (key parts)

```
project/
├── server.js                    # Express API server
├── package.json                 # Backend dependencies and scripts
├── database_scripts/
│   └── dbms_database_fixed.sql  # MySQL schema + seed + triggers (targets dbms_database)
├── insurance-frontend/          # React app
│   ├── package.json
│   └── src/
│       ├── App.js               # Routes + Layout
│       └── components/          # UI pages (Dashboards, Workflows, Reports)
└── uploads/                     # Temp uploads for document processor
```

## 🛠️ Notes
- **MySQL Setup Critical**: The `.env` file MUST have your correct MySQL password. See `MYSQL_SETUP.md` if you need help.
- Backend DB config is read from `.env` (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME=dbms_database). 
- The workflow engine and admin/customer APIs assume the schema in `dbms_database_fixed.sql`.
- Extra pages (Documents, Alerts, Metrics, Overdue) are accessible from the top navbar after logging in.

## 📚 Documentation

- [API Documentation](docs/api.md)
- [User Guide](docs/user-guide.md)
- [Developer Guide](docs/developer-guide.md)

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📄 License

This project is developed for educational purposes as part of the PES University UE23CS341A curriculum.

---

**Course:** UE23CS341A  
**Institution:** PES University  
**Academic Year:** 2025  
**Semester:** 5th Sem
