# Guna CMS & Feedback Engine — Backend API (Render Deployment)

Standalone, production-ready Express + MongoDB Atlas backend serving:
1. Public Portfolio Content API (`/api/v1/public/*`)
2. Standalone Feedback Form Engine (`forms.gunasai.in/:slug` and `/feedback/:slug`)
3. CMS Admin Auth & Management API (`/api/v1/admin/*`)

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Build TypeScript
npm run build

# 3. Start development server with auto-reload
npm run dev

# 4. Or start production build
npm start
```

---

## 📦 How to Push to Your Backend GitHub Repository

Open your terminal inside this `backend/` directory:

```bash
# 1. Initialize git repository
git init
git add .
git commit -m "Initial commit: Guna CMS backend"

# 2. Add your GitHub remote (replace with your repo URL)
git branch -M main
git remote add origin https://github.com/your-username/gunasai-backend.git

# 3. Push to GitHub
git push -u origin main
```

---

## 🌐 How to Deploy to Render (Render.com)

1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** → **Web Service**.
2. Connect your **`gunasai-backend`** GitHub repository.
3. Configure the service settings:
   - **Name:** `guna-cms-backend`
   - **Environment:** `Node`
   - **Branch:** `main`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** `Free` (or Starter)
4. Add the **Environment Variables** in the Render Dashboard (from `.env.example`):
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/guna-cms?retryWrites=true&w=majority`
   - `SESSION_SECRET`: *(A cryptographically random 32+ character string)*
   - `PREVIEW_SECRET`: *(A cryptographically random 32+ character string)*
   - `APP_ORIGIN`: `https://gunasai.in,https://www.gunasai.in,https://forms.gunasai.in`
   - `PUBLIC_SITE_URL`: `https://gunasai.in`
   - `FORMS_DOMAIN`: `forms.gunasai.in`
   - `FORMS_BASE_URL`: `https://forms.gunasai.in`
   - `ADMIN_EMAIL`: `admin@gunasai.in`
   - `ADMIN_PASSWORD`: *(A strong initial password, min 12 characters)*
   - `EMAIL_PROVIDER`: `brevo`
   - `BREVO_API_KEY`: *(Your Brevo API key)*
   - `EMAIL_FROM`: `notifications@gunasai.in`
5. Click **Create Web Service**. Render will build and deploy your backend automatically!

---

## 🔗 Custom Domain Setup for `forms.gunasai.in` on Render

1. In Render Dashboard, open your web service → **Settings** → **Custom Domains**.
2. Click **Add Custom Domain** and enter: `forms.gunasai.in`.
3. Render will display a CNAME target (e.g., `guna-cms-backend.onrender.com`).
4. In your **GoDaddy DNS Manager**:
   - Add a `CNAME` record:
     - **Name:** `forms`
     - **Value:** `guna-cms-backend.onrender.com`
5. Render will automatically issue and renew a free Let's Encrypt SSL certificate!
