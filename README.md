# Fleet Management System

A full-stack web application for attendance and fleet management with driver and admin roles.

## Features

- User authentication (Driver and Admin roles)
- Driver clock-in/out with geolocation
- Break management
- Overtime calculation
- Attendance history and reports
- Admin dashboard for driver management

## Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/fleet-management
   JWT_SECRET=your-secret-key-here
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user

### Driver Attendance
- POST `/api/attendance/clock-in` - Clock in with location
- POST `/api/attendance/clock-out` - Clock out with location
- POST `/api/attendance/break/start` - Start break
- POST `/api/attendance/break/end` - End break
- GET `/api/attendance/history` - Get attendance history

### Admin Routes
- GET `/api/drivers` - Get all drivers
- GET `/api/drivers/:id` - Get driver by ID
- PUT `/api/drivers/:id` - Update driver
- DELETE `/api/drivers/:id` - Delete driver
- GET `/api/attendance/admin/records` - Get all attendance records
- GET `/api/attendance/admin/overtime` - Get overtime report

## Technologies Used

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Express Validator
- Bcrypt.js

## Security Features

- Password hashing
- JWT authentication
- Role-based access control
- Input validation
- Secure API endpoints 