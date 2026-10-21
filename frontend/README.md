# Guna Sai Portfolio & Admin — Frontend (Vercel Deployment)

Self-contained frontend repository containing:
1. **Public Portfolio Website** (`/portfolio`): Authentic rich portfolio accessible at `https://gunasai.in/`.
2. **CMS Admin Dashboard** (`/admin`): Complete React CMS dashboard accessible at `https://gunasai.in/admin`.

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Run Portfolio locally
npm run dev:portfolio   # http://localhost:3000

# 3. Run Admin Dashboard locally
npm run dev:admin       # http://localhost:3001

# 4. Build both apps for production
npm run build
```

---

## 📦 How to Push to Your Frontend GitHub Repository

Open your terminal inside this `frontend/` directory:

```bash
# 1. Initialize git repository
git init
git add .
git commit -m "Initial commit: Guna Sai Frontend Portfolio and CMS Admin"

# 2. Add your GitHub remote (replace with your repo URL)
git branch -M main
git remote add origin https://github.com/your-username/gunasai-frontend.git

# 3. Push to GitHub
git push -u origin main
```

---

## 🌐 How to Deploy to Vercel (gunasai.in)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New...** → **Project**.
2. Select your **`gunasai-frontend`** repository.
3. Configure the project:
   - **Framework Preset:** `Vite` (or Other)
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
4. Set the **Backend Proxy URL** in `vercel.json`:
   - Replace `https://guna-cms-backend.onrender.com` with your actual Render backend URL.
5. Click **Deploy**!

---

## 🔗 Custom Domain Setup on Vercel

1. In Vercel Project → **Settings** → **Domains**.
2. Add:
   - `gunasai.in`
   - `www.gunasai.in`
3. Vercel will automatically assign SSL certificates and configure your custom domain!
