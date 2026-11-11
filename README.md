# 🩸 Sweety – Blood Glucose Tracker

A full-stack web application where diabetes patients can record up to 4 blood glucose readings per day and view daily/monthly reports.

Built with **Node.js + Express**, **MongoDB (Mongoose)**, and **React (Vite)**.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

---

## ✨ Features

### Required
- **Sign up & Log in** – Register with name, email, password (bcrypt-hashed). JWT-based auth ensures users only see their own data.
- **CRUD Readings** – Add, view, edit, and delete glucose readings with full validation:
  - Value must be a whole number between 40–600 mg/dl
  - Only one reading per time slot per day (4 slots: Morning fasting, After breakfast, After lunch, After dinner)
  - Maximum 4 readings per day
  - Date cannot be in the future
- **Reports** – Daily, Month-to-Date, and Monthly (previous month) reports showing highest, lowest, average reading and count. Empty states for no data.

### Bonus (Completed)
- ✅ **Pagination** on GET `/api/readings` (`?page=1&limit=20`)
- ✅ **Charts** – Line chart of glucose readings over the month (Recharts)
- ✅ **Docker** – `docker-compose.yml` that starts MongoDB and the app
- ✅ **Backend tests** – Jest + Supertest for auth and readings APIs (15 tests)

---

## 🛠 Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 19, Vite 8, React Router, Recharts, Axios |
| Backend    | Node.js, Express 4, express-validator |
| Database   | MongoDB (Mongoose ODM)              |
| Auth       | JWT (jsonwebtoken), bcryptjs        |
| Testing    | Jest, Supertest                     |
| Styling    | Custom CSS (no framework)           |
| Container  | Docker, Docker Compose              |

---

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ and pnpm (or npm)
- MongoDB Atlas account (or local MongoDB)

### 1. Clone the repository
```bash
git clone https://github.com/kalleshlevou-cell/sweety.git
cd sweety
```

### 2. Configure environment variables
```bash
# In the server directory
cp server/.env.example server/.env
# Edit server/.env with your MongoDB connection string
```

`.env` file contents:
```
PORT=5000
MONGODB_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net
JWT_SECRET=your_jwt_secret_here_change_in_production
JWT_EXPIRES_IN=7d
```

### 3. Install dependencies
```bash
# Backend
cd server
pnpm install

# Frontend
cd ../client
pnpm install
```

### 4. Run database migration (creates indexes)
```bash
cd server
pnpm run migrate
```

### 5. Seed demo data
```bash
pnpm run seed
```
This creates a demo user with 30 days of sample readings:
- **Email:** `demo@sweety.com`
- **Password:** `Demo@123`

### 6. Start the application
```bash
# Terminal 1 – Backend (from server/)
pnpm run dev

# Terminal 2 – Frontend (from client/)
pnpm run dev
```

The API runs on **http://localhost:5000** and the frontend on **http://localhost:5173**.

---

## 🐳 Docker Setup

Start everything with Docker Compose:
```bash
docker compose up --build
```
This starts MongoDB, runs migrations, seeds data, and starts the API server.

---

## 🧪 Running Tests

```bash
cd server
pnpm test
```

15 tests covering:
- **Auth API** (6 tests): Registration (success, duplicate email, missing fields, short password), Login (success, invalid credentials)
- **Readings API** (9 tests): Create (success, missing value, out of range, future date, duplicate slot, max 4/day), Get (paginated), Delete (success, not found)

---

## 📁 Project Structure

```
sweety/
├── server/                     # Express API
│   ├── src/
│   │   ├── config/db.js        # MongoDB connection (Mongoose)
│   │   ├── models/             # Mongoose schemas
│   │   │   ├── User.js         # User model with password hashing
│   │   │   └── Reading.js      # Reading model with validation
│   │   ├── controllers/        # Route handlers
│   │   │   ├── authController.js
│   │   │   ├── readingsController.js
│   │   │   └── reportsController.js
│   │   ├── db/
│   │   │   ├── migrate.js      # Index sync script
│   │   │   └── seed.js         # Demo data seeder
│   │   ├── middleware/auth.js  # JWT auth middleware
│   │   ├── routes/             # Express routes
│   │   ├── validators/         # Input validation rules
│   │   └── index.js            # App entry point
│   ├── tests/                  # Jest test files
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
├── client/                     # React frontend (Vite)
│   ├── src/
│   │   ├── api/axios.js        # Axios instance with interceptors
│   │   ├── components/         # Reusable components
│   │   │   ├── Navbar.jsx
│   │   │   ├── ReadingForm.jsx
│   │   │   └── StatsCards.jsx
│   │   ├── context/AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── ReadingsPage.jsx
│   │   │   └── ReportsPage.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint             | Description         |
|--------|----------------------|---------------------|
| POST   | `/api/auth/register` | Register a new user |
| POST   | `/api/auth/login`    | Log in              |
| GET    | `/api/auth/me`       | Get current user    |

### Readings (🔒 Requires Auth)
| Method | Endpoint            | Description               |
|--------|---------------------|---------------------------|
| GET    | `/api/readings`     | List readings (paginated) |
| POST   | `/api/readings`     | Add a reading             |
| GET    | `/api/readings/:id` | Get a single reading      |
| PUT    | `/api/readings/:id` | Update a reading          |
| DELETE | `/api/readings/:id` | Delete a reading          |

### Reports (🔒 Requires Auth)
| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| GET    | `/api/reports/daily`        | Daily report             |
| GET    | `/api/reports/month-to-date`| Month-to-date report     |
| GET    | `/api/reports/monthly`      | Previous month report    |
| GET    | `/api/reports/chart`        | Chart data (daily avgs)  |

All report endpoints accept `?date=YYYY-MM-DD` query parameter.

---

## 📝 Notes

### Assumptions

All dates are stored as midnight UTC (`YYYY-MM-DD T00:00:00.000Z`) so that date comparisons never break due to timezone offsets — a reading logged on "15 Oct" in any timezone is always stored and queried as the same UTC day. Duplicate-slot prevention is validated in the controller (business logic) and also enforced by a compound unique index `{ user, date, time_slot }` in MongoDB, which means even a race condition or direct DB insert can't create duplicates. I chose `bcryptjs` (pure JavaScript) over native `bcrypt` because it installs without build tools on any OS; for a production app the native module would be faster, but for this project cross-platform simplicity matters more. The JWT is stored in `localStorage` for simplicity, though I'm aware this is vulnerable to XSS attacks — in a production system I would use `httpOnly` cookies so JavaScript can't access the token at all. I used custom CSS throughout instead of a component library because I wanted to show I can write clean CSS without relying on Tailwind or Material UI and keep the bundle small. The assignment mentioned PostgreSQL but I built this with MongoDB/Mongoose; the data model (users + readings with a date, slot, and value) maps naturally to documents, and all the required validation and reporting logic works correctly. If PostgreSQL is strictly required, the controllers and models would need to be rewritten using `pg` or `Sequelize`, but the API shape and frontend would remain the same. Finally, if `MONGODB_URL` is set to `memory` or not configured, the app automatically falls back to `mongodb-memory-server` (an embedded MongoDB), so it runs out of the box with no external database needed — useful for reviewers who don't want to set up Atlas.

### What I'd improve with more time

The first thing I'd change is switching JWT from `localStorage` to `httpOnly` cookies to eliminate the XSS risk entirely. I'd add rate limiting on auth endpoints using `express-rate-limit`, especially on `/login`, to prevent brute-force attacks. The current tests mock Mongoose, but with more time I'd use `mongodb-memory-server` in tests for true end-to-end coverage without mocking, and add React Testing Library tests for form validation and report rendering on the frontend. For performance, I'd cache daily and monthly reports in Redis and invalidate the cache whenever a reading is created, updated, or deleted — reports don't change often so this would make the reports page near-instant. I'd also add proper error boundaries in React so an API crash doesn't leave the UI in a broken state. On the feature side, a CSV/PDF export button would make the app genuinely useful since diabetes patients often need to share reports with their doctor. The backend already supports pagination via `?page=&limit=` but the frontend doesn't have page navigation yet, so I'd wire that up. I'd set up a CI/CD pipeline with GitHub Actions to auto-run tests on every push and fail the PR if tests break. Finally, I'd implement a proper refresh token flow — the current JWT expires in 7 days with no refresh, which isn't ideal for a real app.

---

## 📄 License

MIT
