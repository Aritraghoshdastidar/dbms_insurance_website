# 🔐 New Admin Account Created

## Login Credentials

**Email:** `admin@example.com`  
**Password:** `admin`

## How to Add This Admin to Your Database

### Option 1: Quick SQL Command (Recommended)

Run this in your MySQL client:

```powershell
mysql -u insurance_app -p dbms_database < database_scripts/add_admin_user.sql
```

Or if using root:
```powershell
mysql -u root -p dbms_database < database_scripts/add_admin_user.sql
```

### Option 2: Manual Insert (MySQL Workbench or Command Line)

1. Open MySQL Workbench or command line
2. Connect to your database
3. Run the SQL file: `database_scripts/add_admin_user.sql`

Or copy-paste this directly:

```sql
USE dbms_database;

INSERT INTO administrator (admin_id, name, email, phone, role, password)
VALUES (
    'ADM_MAIN',
    'Main Administrator',
    'admin@example.com',
    '9999999999',
    'System Admin',
    '$2b$10$0LjN/okUr3S.6G8hNtYc7urAUWodXfojkSwkQg5/kDhGtpSx5g1dO'
)
ON DUPLICATE KEY UPDATE
    email = 'admin@example.com',
    password = '$2b$10$0LjN/okUr3S.6G8hNtYc7urAUWodXfojkSwkQg5/kDhGtpSx5g1dO';
```

## Verify Admin Was Created

After running the SQL, verify:

```sql
SELECT admin_id, name, email, role FROM administrator WHERE email = 'admin@example.com';
```

You should see:
- admin_id: ADM_MAIN
- name: Main Administrator
- email: admin@example.com
- role: System Admin

## Login to Website

1. Start backend: `npm start` (from project root)
2. Start frontend: `cd insurance-frontend && npm start`
3. Open browser to: http://localhost:3000
4. You'll see the login page
5. Check "Login as Admin" checkbox
6. Enter:
   - Email: `admin@example.com`
   - Password: `admin`
7. Click Login

## Browser Behavior

The frontend will now:
- ✅ Start WITHOUT automatically opening a browser tab
- ✅ Show login page as default route
- ✅ You manually open http://localhost:3000 when ready

To disable this behavior and auto-open browser again, run:
```powershell
npm run start:open
```

## Security Note

⚠️ **Change this password in production!** The password "admin" is only for development/testing.

To create a stronger password hash later, edit `hash_password.js` and run `node hash_password.js`
