# Backend Server Setup Guide

This guide will help you set up the MySQL backend server for the Sunny Beach restaurant application.

## Prerequisites

1. **XAMPP** installed and running
2. **Node.js** (v16 or higher) installed

## Step 1: Start XAMPP MySQL

1. Open XAMPP Control Panel
2. Start the **MySQL** service
3. Ensure MySQL is running on port `3306` (default)

## Step 2: Configure Backend Server

1. **Navigate to server folder:**
   ```bash
   cd project/server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file** (optional - defaults will work for XAMPP):
   Create a file named `.env` in the `server` folder with:
   ```env
   PORT=3001
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=sunny_beach
   JWT_SECRET=your-secret-jwt-key-change-this-in-production
   ```

   **Note:** If `DB_PASSWORD` is empty, leave it blank. For XAMPP default installation, the root user typically has no password.

## Step 3: Start the Backend Server

```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

The server will:
- ✅ Connect to MySQL database
- ✅ Create database `sunny_beach` if it doesn't exist
- ✅ Create all necessary tables
- ✅ Insert default admin user: `admin@gmail.com` / `admin123`
- ✅ Insert default table types and food items

## Step 4: Verify Server is Running

Open your browser and visit: `http://localhost:3001`

You should see:
```json
{
  "message": "Sunny Beach Restaurant API",
  "status": "running",
  "version": "1.0.0"
}
```

## Step 5: Frontend Configuration

The frontend is already configured to use the backend API. The default API URL is `http://localhost:3001/api`.

If you need to change it, create a `.env` file in the `project` root with:
```env
VITE_API_URL=http://localhost:3001/api
```

## Testing the Backend

### Test Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gmail.com","password":"admin123"}'
```

### Test Signup
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Default Data

The server automatically creates:

- **Admin User:**
  - Email: `admin@gmail.com`
  - Password: `admin123`

- **Table Types:**
  - Parasol (1-4 people, 15 DT/hour)
  - Mini Cabane (1-5 people, 25 DT/hour)
  - Cabane (6-20 people, 35 DT/hour)

- **Food Items:**
  - Various appetizers, main courses, desserts, and drinks

## Troubleshooting

### Database Connection Failed
- ✅ Make sure XAMPP MySQL is running
- ✅ Check if MySQL is on port 3306
- ✅ Verify database credentials in `.env` file

### Port Already in Use
- Change `PORT` in `.env` file to a different port (e.g., 3002)
- Update `VITE_API_URL` in frontend `.env` if you change the port

### Tables Not Created
- Check server console for error messages
- Ensure you have proper MySQL permissions
- Try manually creating the database in phpMyAdmin

## API Endpoints

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires Bearer token)

## Next Steps

Once the backend is running, you can:
1. Start the frontend: `cd project && npm run dev`
2. Login with admin credentials: `admin@gmail.com` / `admin123`
3. Access the admin dashboard
