# KeepAlive — Render & Supabase 24/7 Cloud Monitor

A streamlined, purpose-built **Next.js (App Router) + React + Tailwind CSS** application designed to keep your **Render backend** warm and continuously monitor **Supabase database connectivity** 24/7 on Vercel—even when your laptop and browser are completely shut down.

---

## Features

- 🟢 **Render Keep-Alive & Health Checking**:
  - Sends automated periodic requests (default **10 minutes**) to your Render service (e.g. `https://my-backend.onrender.com/health`).
  - Keeps free-tier Render instances warm to prevent the 15-minute inactivity spin-down and eliminate slow 50-second cold starts.
  - Detects and flags suspected cold starts when latency is elevated.
- 🗄️ **Supabase Connectivity Monitoring**:
  - Sends authenticated lightweight health pings to your Supabase project REST endpoint (`/rest/v1/`).
  - Records real-time connection latency and status.
- ☁️ **Runs 24/7 in the Cloud (Browser-Independent)**:
  - All requests execute server-side in Node.js serverless functions (`/api/cron`).
  - No browser timers, no client-side sleep issues, and zero CORS restrictions.
- 📊 **Clean Dark Dashboard**:
  - Live status cards, latency metrics (ms), HTTP response codes, and latest JSON response preview.
  - Immediate "Test Now" manual triggers and Pause/Resume controls.
  - Zero-config local storage for development + 1-click Supabase PostgreSQL schema for production.

---

## Quick Start (Local Development)

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the local development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 24/7 Production Deployment (Vercel + Supabase)

### Step 1: Deploy to Vercel
1. Push this repository to GitHub.
2. Import the repository into [Vercel](https://vercel.com).
3. (Optional) In Vercel Project Settings > Environment Variables, add:
   - `CRON_SECRET`: Any random secure string (e.g. `my_super_secure_cron_token_123`)
   - `SUPABASE_URL`: `https://your-project.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key (from Supabase Dashboard > Settings > API)

### Step 2: Set Up Database Tables in Supabase (1-Minute Setup)
1. Open your **Supabase Dashboard** > **SQL Editor**.
2. Copy and paste the contents of [`schema.sql`](./schema.sql) and click **Run**.
3. This creates the `services` and `checks` tables with indexes.

### Step 3: Configure the 10-Minute Scheduler ($0 Free Setup)
Because the Vercel Free (Hobby) tier limits native crons to once daily, use a free external scheduler to ping your `/api/cron` endpoint every 10 minutes:

#### Option A: cron-job.org (Recommended - 100% Free)
1. Go to [cron-job.org](https://cron-job.org) and create a free account.
2. Click **Create Cronjob**:
   - **Title**: `Render & Supabase Keep-Alive`
   - **URL**: `https://your-app.vercel.app/api/cron`
   - **Schedule**: Every 10 minutes (`*/10 * * * *`)
   - **Request Method**: `GET` or `POST`
   - **Headers** (if `CRON_SECRET` is set):
     - Key: `Authorization`
     - Value: `Bearer your_super_secure_cron_token_123`
3. Click **Create**. Done! Your Render and Supabase services will now be checked 24/7 automatically.

#### Option B: GitHub Actions (Free)
Create `.github/workflows/cron.yml` in your repository:
```yaml
name: 10-Minute Keep-Alive Cron
on:
  schedule:
    - cron: '*/10 * * * *'
  workflow_dispatch:

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Keep-Alive API
        run: |
          curl -s -X POST https://your-app.vercel.app/api/cron \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

---

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── cron/route.js        # Protected 24/7 background scheduler
│   │   ├── render/route.js      # Render service CRUD & test trigger
│   │   ├── status/route.js      # Dashboard overview status & recent checks
│   │   └── supabase/route.js    # Supabase service CRUD & test trigger
│   ├── globals.css              # Dark theme & styling
│   ├── layout.jsx               # Navigation bar & layout shell
│   ├── page.jsx                 # Home dashboard with status cards & log feed
│   ├── render/page.jsx          # Dedicated Render configuration & diagnostics
│   └── supabase/page.jsx        # Dedicated Supabase configuration & diagnostics
├── components/
│   ├── Navbar.jsx               # Top navigation & 24/7 setup guide modal
│   ├── ServiceCard.jsx          # Dashboard card component
│   └── StatusBadge.jsx          # Realistic status badge component
├── lib/
│   ├── checker.js               # Node.js health checking & latency measurement
│   └── db.js                    # Dual-mode database client (Supabase + local store)
├── schema.sql                   # Supabase PostgreSQL schema
├── vercel.json                  # Vercel deployment config
└── package.json
```
