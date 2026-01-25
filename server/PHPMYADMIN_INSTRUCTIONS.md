# How to Import SQL into phpMyAdmin (XAMPP)

## Step-by-Step Instructions:

### 1. **Open phpMyAdmin**
   - Open your browser
   - Go to: `http://localhost/phpmyadmin`
   - Or: `http://localhost:80/phpmyadmin`

### 2. **Import the SQL File**
   - Click on the **"Import"** tab at the top
   - Click **"Choose File"** button
   - Select the file: `server/database.sql` or `server/database_with_real_bcrypt.sql`
   - Click **"Go"** button at the bottom

### 3. **Verify the Database**
   - After import, you should see the database `sunny_beach` in the left sidebar
   - Click on `sunny_beach` to see all tables:
     - `users`
     - `contact_messages`
     - `table_types`
     - `reservations`
     - `food_items`
     - `food_orders`
     - `food_order_items`

### 4. **Verify Admin User**
   - Click on the `users` table
   - Click the **"Browse"** tab
   - You should see `admin@gmail.com` with `is_admin = 1`

---

## Alternative: Manual Copy-Paste Method

1. **Open phpMyAdmin**: `http://localhost/phpmyadmin`

2. **Click on "SQL" tab** at the top

3. **Copy the entire content** from `database.sql` or `database_with_real_bcrypt.sql`

4. **Paste it** into the SQL query box

5. **Click "Go"** button

---

## Note About Admin Password

The admin password in the SQL file is hashed with bcrypt. The password is: **`admin123`**

If you want to generate a new bcrypt hash:
- Visit: https://bcrypt-generator.com/
- Enter password: `admin123`
- Rounds: `10`
- Copy the generated hash
- Replace the password value in the INSERT statement

---

## Troubleshooting

**If you get foreign key errors:**
- Make sure tables are created in order (users first, then others)
- The SQL file already has the correct order

**If database already exists:**
- The SQL uses `CREATE DATABASE IF NOT EXISTS` so it's safe to run multiple times

**If admin user already exists:**
- The SQL uses `ON DUPLICATE KEY UPDATE` to avoid errors
- Or you can manually delete the admin user first, then re-run the INSERT

---

## Quick Test After Import

1. **Start your server**: `npm start` (from `server` folder)
2. **Test in Postman**:
   - POST `http://localhost:3001/api/auth/login`
   - Body: `{"email": "admin@gmail.com", "password": "admin123"}`
   - Should return a token and user data
