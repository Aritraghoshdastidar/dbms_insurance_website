# 🔧 MySQL Setup Guide

## Problem
The backend cannot connect to MySQL because:
- MySQL root user requires a password
- Current .env file has incorrect credentials

## Solution Options

### Option 1: Find Your MySQL Root Password (Recommended)

1. **If you installed MySQL yourself**, you set a root password during installation
2. **If you're using XAMPP**, the default root password is usually empty or "root"
3. **If you're using WAMP**, check the MySQL configuration in WAMP control panel

Once you have your password:
1. Open `.env` file in the project root
2. Update the `DB_PASSWORD=` line with your actual password
3. Save and restart the server: `npm start`

### Option 2: Reset MySQL Root Password

If you forgot your password, follow these steps:

#### For Windows MySQL:

1. Stop MySQL service:
   ```powershell
   net stop MySQL80
   ```

2. Start MySQL without password check:
   ```powershell
   mysqld --skip-grant-tables
   ```

3. In a new PowerShell window, connect to MySQL:
   ```powershell
   mysql -u root
   ```

4. Reset the password:
   ```sql
   FLUSH PRIVILEGES;
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'newpassword';
   FLUSH PRIVILEGES;
   ```

5. Stop the mysqld process and restart MySQL service normally
6. Update `.env` with your new password

### Option 3: Create a Dedicated User (Most Secure)

1. Connect to MySQL as root (once you have the password):
   ```powershell
   mysql -u root -p
   ```

2. Run these commands:
   ```sql
   CREATE DATABASE IF NOT EXISTS dbms_database;
   CREATE USER 'insurance_app'@'localhost' IDENTIFIED BY 'Insurance123!';
   GRANT ALL PRIVILEGES ON dbms_database.* TO 'insurance_app'@'localhost';
   FLUSH PRIVILEGES;
   ```

3. Update your `.env`:
   ```
   DB_USER=insurance_app
   DB_PASSWORD=Insurance123!
   DB_NAME=dbms_database
   ```

## Quick Test After Setup

1. Start backend: `npm start`
2. Check health: Open browser to `http://localhost:3001/api/health`
3. Should see: `{"status":"ok","db":"dbms_database",...}`

## Current Configuration

Your `.env` file currently has:
- DB_USER=root
- DB_PASSWORD=root (← This is likely wrong for your system)
- DB_NAME=dbms_database

**YOU MUST UPDATE DB_PASSWORD** with your actual MySQL root password!
