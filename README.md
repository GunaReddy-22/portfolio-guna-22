# Guna Sai Portfolio & CMS

A high-performance personal portfolio website and full-stack Content Management System (CMS) engineered for **`https://gunasai.in`**.

The repository is cleanly organized into two autonomous workspaces:
- **`frontend/`**: Vite + TypeScript static web applications ready for **Vercel**.
- **`backend/`**: Express + TypeScript + MongoDB Atlas API and Feedback Engine ready for **Render**.

---

## 🏗️ Repository Architecture

```
portfolio-extra-masala/
├── frontend/                     # Vercel Deployment Workspace
│   ├── portfolio/                # Public portfolio website (gunasai.in)
│   ├── admin/                    # CMS React Admin Dashboard (admin.gunasai.in or /admin)
│   ├── build-dist.js             # Assembles unified production bundle
│   ├── vercel.json               # Vercel routing, rewrites, and security headers
│   ├── package.json              # Frontend dependencies and workspaces
│   └── README.md                 # Frontend setup and deployment guide
│
├── backend/                      # Render Deployment Workspace
│   ├── src/                      # API server, Mongoose models, Zod schemas, routes
│   ├── scripts/                  # Owner provisioning, data migration, Atlas seeding
│   ├── tests/                    # Vitest test suite (11 suites, 108 tests passing)
│   ├── original_portfolio/       # Preserved baseline HTML reference
│   ├── render.yaml               # Render Infrastructure-as-Code Blueprint
│   ├── package.json              # Backend dependencies and scripts
│   ├── tsconfig.json             # TypeScript compiler configuration
│   └── README.md                 # Backend setup and deployment guide
│
├── .gitignore                    # Git ignore rules for secrets and build artifacts
├── .env.example                  # Environment variables template
├── package.json                  # Root orchestrator scripts
└── README.md                     # Project documentation
```

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
Run in each workspace or install dependencies:
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` inside `backend/`:
```bash
cp backend/.env.example backend/.env
```
Ensure your MongoDB Atlas connection URI and Brevo API key are set in `backend/.env`.

### 3. Start Development Servers
From the root directory:
```bash
# Run Portfolio Website (http://localhost:3000)
npm run dev:frontend

# Run Admin Dashboard (http://localhost:3001)
npm run dev:admin

# Run Backend API Server (http://localhost:5000)
npm run dev:backend
```

---

## 🛠️ Testing & Building

### Run Backend Test Suite
```bash
npm run test:backend
# Or: cd backend && npm test
```
All 11 test suites and 108 tests pass 100% against an isolated in-memory test database.

### Build All Workspaces for Production
```bash
npm run build
```
- **Frontend** compiles the portfolio and admin dashboard into `frontend/dist/`.
- **Backend** compiles TypeScript into `backend/dist/`.

---

## 🌐 Production Deployment

### 1. Deploy Frontend to Vercel (`https://gunasai.in`)
1. In the Vercel dashboard, import your repository.
2. Set the **Root Directory** to `frontend`.
3. Set **Framework Preset** to `Vite` (or Other).
4. Set **Build Command** to `npm run build`.
5. Set **Output Directory** to `dist`.
6. Add Environment Variables:
   - `VITE_API_BASE_URL`: `https://api.gunasai.in`
   - `VITE_API_URL`: `https://api.gunasai.in`
7. Add Custom Domains:
   - `gunasai.in`
   - `www.gunasai.in`
   - `admin.gunasai.in` (optional dedicated dashboard domain)

### 2. Deploy Backend to Render (`https://api.gunasai.in`)
1. In the Render dashboard, create a new **Web Service**.
2. Select your repository.
3. Set the **Root Directory** to `backend`.
4. Set **Environment** to `Node`.
5. Set **Build Command** to `npm install && npm run build`.
6. Set **Start Command** to `npm start`.
7. Configure required environment variables (see `backend/.env.example`):
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `SESSION_SECRET`: Random 32+ character string
   - `PREVIEW_SECRET`: Random 32+ character string
   - `APP_ORIGIN`: `https://gunasai.in,https://www.gunasai.in,https://admin.gunasai.in,https://forms.gunasai.in`
   - `PUBLIC_SITE_URL`: `https://gunasai.in`
   - `FORMS_BASE_URL`: `https://forms.gunasai.in`
   - `EMAIL_PROVIDER`: `brevo`
   - `BREVO_API_KEY`: Your Brevo API key
   - `EMAIL_FROM`: `noreply.dev.guna@gmail.com`
8. In Custom Domains on Render, add `api.gunasai.in` and `forms.gunasai.in`.
9. In GoDaddy DNS, point the `CNAME` records to your Render hostname.
