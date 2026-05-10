# Business Management System

A complete Node.js, Express, MongoDB, and vanilla HTML/CSS/JavaScript business management system.

## Features

- Admin authentication with JWT and bcrypt password hashing
- Dashboard analytics
- Inventory CRUD with stock, buying price, selling price, profit per item, and low stock alert
- Sales transactions with automatic stock deduction and profit calculation
- Expense management
- Customer management with purchase history API
- Employee management
- Profit and loss reports
- Excel export for sales, expenses, and inventory
- Responsive SaaS-style dashboard UI

## Local Setup

1. Install Node.js.
2. Open the project folder in VS Code.
3. Install dependencies:

```bash
npm install
```

4. Create your `.env` file:

```bash
cp .env.example .env
```

5. Update `.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_secret_key
ADMIN_NAME=Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin12345
```

6. Run locally:

```bash
npm run dev
```

7. Open:

```text
http://localhost:5000
```

## MongoDB Atlas Guide

1. Go to MongoDB Atlas.
2. Create a free cluster.
3. Create a database user.
4. Add your IP address in Network Access. For Render deployment, you may use `0.0.0.0/0`.
5. Click Connect > Drivers.
6. Copy your connection string.
7. Paste it in `.env` as `MONGO_URI`.

Example:

```env
MONGO_URI=mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/business_management_system
```

## Default Admin Account

The system automatically creates an admin account when the server starts if it does not exist yet.

Default from `.env.example`:

```text
Email: admin@example.com
Password: admin12345
```

Change these values in `.env` before deployment.

## Render Deployment Guide

1. Push this project to GitHub.
2. Go to Render.
3. Create New > Web Service.
4. Connect your GitHub repository.
5. Use these settings:

```text
Build Command: npm install
Start Command: npm start
```

6. Add environment variables in Render:

```env
PORT=10000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_secret_key
ADMIN_NAME=Admin
ADMIN_EMAIL=your_admin_email
ADMIN_PASSWORD=your_secure_password
```

7. Deploy.

## GitHub Upload Commands

```bash
git init
git add .
git commit -m "Initial Business Management System"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/business-management-system.git
git push -u origin main
```

## Main Pages

- `/` landing page
- `/login` admin login
- `/dashboard` protected dashboard frontend

## API Routes

Authentication:

- `POST /api/auth/login`
- `GET /api/auth/me`

Inventory:

- `GET /api/inventory`
- `POST /api/inventory`
- `PUT /api/inventory/:id`
- `DELETE /api/inventory/:id`

Sales:

- `GET /api/sales`
- `POST /api/sales`
- `DELETE /api/sales/:id`

Expenses:

- `GET /api/expenses`
- `POST /api/expenses`
- `PUT /api/expenses/:id`
- `DELETE /api/expenses/:id`

Customers:

- `GET /api/customers`
- `POST /api/customers`
- `PUT /api/customers/:id`
- `DELETE /api/customers/:id`
- `GET /api/customers/:id/purchases`

Employees:

- `GET /api/employees`
- `POST /api/employees`
- `PUT /api/employees/:id`
- `DELETE /api/employees/:id`

Reports:

- `GET /api/reports/dashboard`
- `GET /api/reports/profit-loss`
- `GET /api/reports/export/sales`
- `GET /api/reports/export/expenses`
- `GET /api/reports/export/inventory`
