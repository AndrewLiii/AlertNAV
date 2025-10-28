# Authentication Setup Guide

## Overview
This guide will help you set up email-based authentication for your AlertNAV application with user-specific data filtering.

## What's Been Created

### 1. Database Changes
- **Users Table**: Stores user information (email, timestamps)
- **iot_data Table Update**: Added `user_email` column to link data to users

### 2. API Routes
- `POST /api/auth/login` - Login with email (auto-creates users)
- `POST /api/auth/logout` - Logout and clear session
- `GET /api/auth/me` - Get current user info
- `GET /api/data` - Now filters data by logged-in user

### 3. Pages
- `/login` - Email-based login page
- `/` - Updated with user info and logout button

### 4. Middleware
- Protects all routes except `/login`
- Redirects unauthenticated users to login page

## Setup Steps

### Step 1: Install tsx (for running migrations)
```bash
npm install -D tsx
```

### Step 2: Run Database Migrations
```bash
npm run migrate
```

This will:
- Create the `users` table
- Add `user_email` column to `iot_data` table
- Create necessary indexes

### Step 3: Update Existing Data (Optional)
If you have existing data in `iot_data` that needs to be assigned to a user:

```sql
-- Assign all existing data to a default user
-- First, create the default user
INSERT INTO users (email) VALUES ('admin@alertnav.com')
ON CONFLICT (email) DO NOTHING;

-- Then assign all null user_email records to this user
UPDATE iot_data 
SET user_email = 'admin@alertnav.com' 
WHERE user_email IS NULL;
```

### Step 4: Test the Application
1. Stop your dev server if it's running (Ctrl+C)
2. Start it again: `npm run dev`
3. Visit http://localhost:3000
4. You should be redirected to `/login`
5. Enter any email address to login
6. You'll be redirected to the main page

## How It Works

### Authentication Flow
1. User enters email on login page
2. System checks if user exists in database
3. If not, creates new user automatically
4. Sets a secure HTTP-only cookie with email
5. Middleware checks cookie on every request
6. API routes filter data by authenticated user's email

### Data Isolation
- Each user only sees their own IoT device data
- Data is filtered at the database level for security
- When inserting new IoT data, include the `user_email` field

## Testing Different Users

You can test with multiple users:
1. Logout from current user
2. Login with a different email
3. Each user will see only their own data

## Important Notes

- **No Password Required**: This is a simple email-based auth (passwordless)
- **Production Considerations**: For production, consider adding:
  - Email verification
  - JWT tokens instead of simple cookies
  - Rate limiting on login endpoint
  - HTTPS only cookies
  
- **Adding Data for Users**: When inserting new IoT data, make sure to include the `user_email`:
  ```sql
  INSERT INTO iot_data (device_id, lat, lon, event, group, user_email, timestamp)
  VALUES ('device123', 40.7128, -74.0060, 'alert', 'group1', 'user@example.com', NOW());
  ```

## Troubleshooting

### Migration Fails
- Check your database credentials in `.env`
- Ensure your Aurora DB is accessible
- Check if tables already exist

### Can't Login
- Check browser console for errors
- Verify API routes are accessible
- Check cookie settings in browser

### No Data Showing
- Ensure your IoT data has `user_email` set
- Check that you're logged in as the correct user
- Verify data exists in database for that user

## Next Steps

Consider adding:
- User profile page
- Device management (add/remove devices)
- Sharing data between users
- Role-based access control (admin, viewer, etc.)
