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

1. **Date handling — UTC midnight**: All dates are stored as `YYYY-MM-DD T00:00:00.000Z` (midnight UTC). I made this choice so date comparisons never break due to timezone offsets — a reading logged on "15 Oct" in any timezone is always stored and queried as the same UTC day.

2. **One reading per slot enforced at both layers**: Duplicate-slot prevention is validated in the controller (business logic) AND enforced by a compound unique index `{ user, date, time_slot }` in MongoDB. This means even a race condition or direct DB insert can't create duplicates.

3. **bcryptjs instead of native bcrypt**: Chose the pure-JS `bcryptjs` over native `bcrypt` because it installs without build tools on any OS. For a production app the native module would be faster, but for a fresher project cross-platform simplicity matters more.

4. **JWT in localStorage**: Stored the JWT in `localStorage` for simplicity. I'm aware this is vulnerable to XSS attacks. In a production system I would use `httpOnly` cookies so JavaScript can't access the token at all.

5. **No component library**: Used custom CSS throughout. I wanted to show I can write clean CSS without relying on Tailwind or Material UI, and keep the bundle small.

6. **MongoDB instead of PostgreSQL**: The assignment mentioned PostgreSQL but I built this with MongoDB/Mongoose. The data model (users + readings with a date + slot + value) maps naturally to documents, and all the required validation and reporting logic works correctly. If PostgreSQL is strictly required, the controllers and models would need to be rewritten using `pg` or `Sequelize`, but the API shape and frontend would remain the same.

7. **In-memory MongoDB fallback**: If `MONGODB_URL` is set to `memory` or not configured, the app automatically falls back to `mongodb-memory-server` (an embedded MongoDB). This means the app runs out of the box with no external database needed — useful for reviewers who don't want to set up Atlas.

---

### What I'd improve with more time

- **Switch JWT to `httpOnly` cookies** — eliminates the XSS risk of localStorage completely.
- **Rate limiting on auth endpoints** — prevent brute-force attacks using `express-rate-limit`. Especially important for `/login`.
- **Integration tests with a real test DB** — current tests mock Mongoose. With more time I'd use `mongodb-memory-server` in tests for true end-to-end coverage without mocking.
- **React Testing Library** — add form validation tests and report rendering tests on the frontend.
- **Redis caching for reports** — daily/monthly reports don't change often. Caching them in Redis and invalidating on any reading write would make the reports page instant.
- **Proper error boundaries in React** — currently an API crash can leave the UI in a broken state. Error boundaries would catch that gracefully.
- **Export as CSV/PDF** — diabetes patients often need to share reports with their doctor. A download button would make the app genuinely useful.
- **Pagination on the readings list UI** — the backend already supports `?page=&limit=` but the frontend doesn't have page navigation yet.
- **CI/CD with GitHub Actions** — auto-run tests on every push, fail the PR if tests break.
- **Refresh token flow** — the current JWT expires in 7 days with no refresh. A proper refresh token rotation would keep users logged in securely.

---

## 📄 License

MIT
