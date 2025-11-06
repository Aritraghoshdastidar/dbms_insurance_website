# ✅ Setup Complete - Quick Start Guide

## 🎯 What's Ready

### 1. New Admin Account
- **Email:** `admin@example.com`
- **Password:** `admin`

### 2. Frontend Behavior
- ✅ Opens to LOGIN page by default
- ✅ Does NOT auto-open browser (you open http://localhost:3000 manually)
- ✅ Root path `/` redirects to login if not authenticated

### 3. No Git Tracking
- ✅ All Git files removed
- ✅ Your `.env` and credentials are safe
- ✅ Nothing will be pushed anywhere

---

## 🚀 Start the Application (3 Steps)

### Step 1: Add Admin to Database

**Option A - Easy Way (Double-click):**
```
Double-click: add-admin.bat
```
Follow the prompts and enter your MySQL password.

**Option B - Manual Way:**
```powershell
mysql -u root -p dbms_database < database_scripts/add_admin_user.sql
```

### Step 2: Start Backend
```powershell
# From project root (c:\PESU\dbms\project)
npm start
```

**Expected output:**
```
✅ Backend API server running at http://localhost:3001
🔗 Connected to MySQL database 'dbms_database'.
```

### Step 3: Start Frontend
```powershell
# Open NEW terminal
cd insurance-frontend
npm start
```

**You'll see:**
```
Compiled successfully!

You can now view insurance-frontend-official in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

**Note:** Browser will NOT auto-open. Manually open: http://localhost:3000

---

## 🔐 Login to Admin Dashboard

1. Open http://localhost:3000
2. You'll see the **Login Page**
3. Check the box: ☑ **Login as Admin**
4. Enter:
   - Email: `admin@example.com`
   - Password: `admin`
5. Click **Login**

You'll be redirected to the **Admin Dashboard** where you can:
- Approve/Decline Claims
- Approve Policies
- Manage Workflows
- View all admin features

---

## 📋 What Changed

### Files Created:
1. `database_scripts/add_admin_user.sql` - SQL to insert admin
2. `add-admin.bat` - Quick setup script
3. `ADMIN_LOGIN.md` - Detailed admin setup docs
4. `insurance-frontend/.env` - Frontend config (prevents browser auto-open)

### Files Updated:
1. `insurance-frontend/package.json` - Modified start script
2. `insurance-frontend/src/App.js` - Added root route redirect to login

### Key Features:
- ✅ Admin: admin@example.com / admin
- ✅ Frontend starts at login page
- ✅ Browser doesn't auto-open
- ✅ All routes redirect properly
- ✅ No Git tracking

---

## 🎓 Other Accounts

### Customer Account (Example)
- Register via the website, or
- Use seeded customers from database

### Create More Admins
1. Edit `hash_password.js` (change password)
2. Run: `node hash_password.js`
3. Copy the hash
4. Insert into `administrator` table with new email

---

## 🔧 Troubleshooting

### "Access denied" error?
→ Check `.env` file has correct `DB_PASSWORD`

### Can't add admin?
→ Run SQL manually in MySQL Workbench:
   File → Run SQL Script → `database_scripts/add_admin_user.sql`

### Browser still auto-opens?
→ Check `insurance-frontend/.env` has `BROWSER=none`

### Wrong page on startup?
→ Clear browser cache and localStorage, restart frontend

---

## ⚡ Quick Commands Reference

```powershell
# Backend
npm start                          # Start backend server
npm test                          # Run tests

# Frontend  
cd insurance-frontend
npm start                         # Start frontend (no browser)
npm run start:open               # Start frontend (auto-open browser)
npm run build                    # Build for production

# Database
mysql -u root -p dbms_database    # Connect to database
.\add-admin.bat                   # Add admin user script
.\test-mysql.bat                  # Test MySQL connection
```

---

## 🎉 You're All Set!

Your insurance workflow automation system is ready to use with:
- Working admin login
- Clean login page startup
- No Git tracking
- All features accessible

**Start both servers and navigate to http://localhost:3000 to begin!**
