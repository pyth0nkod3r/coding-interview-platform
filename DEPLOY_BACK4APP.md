# Back4App Deployment Guide

Step-by-step guide to deploy the Interview Platform to Back4App.

## Prerequisites

- GitHub repository: `https://github.com/pyth0nkod3r/coding-interview-platform` ✅
- Dockerfile in repo root ✅

---

## Step 1: Create Free PostgreSQL Database (Supabase)

Back4App's free tier has limited database options. Use **Supabase** for a free PostgreSQL:

1. Go to [supabase.com](https://supabase.com) → Sign up (free)
2. Create new project:
   - **Name**: `interview-platform`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
3. Wait for project to provision (~2 minutes)
4. Go to **Settings** → **Database** → **Connection string**
5. Copy the **URI** connection string:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

> **Save this connection string** - you'll need it for Back4App!

---

## Step 2: Create Back4App Account

1. Go to [back4app.com](https://back4app.com)
2. Sign up with GitHub (easiest)
3. Verify your email

---

## Step 3: Create Container App

1. From Back4App dashboard, click **"+ New App"**
2. Select **"Containers"** (not Backend as a Service)
3. Click **"Connect GitHub"** and authorize
4. Select repository: `pyth0nkod3r/coding-interview-platform`
5. Configure:
   - **Branch**: `main`
   - **Dockerfile Path**: `./Dockerfile`
   - **Port**: `80`

---

## Step 4: Configure Environment Variables

In the Back4App container settings, add these environment variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres` |
| `JWT_SECRET` | `your-super-secret-jwt-key-make-it-long-and-random` |
| `PORT` | `3001` |

> **Generate a secure JWT_SECRET**: 
> ```bash
> openssl rand -base64 32
> ```

---

## Step 5: Deploy

1. Click **"Deploy"** or **"Create App"**
2. Wait for build to complete (5-10 minutes first time)
3. Check build logs for any errors

---

## Step 6: Run Database Migrations

After first deploy, the database tables need to be created. 

**Option A**: The entrypoint script runs migrations automatically.

**Option B**: If migrations fail, you can run them manually via Supabase SQL Editor:
1. Go to Supabase → SQL Editor
2. Run the Prisma migration SQL (I can generate this for you)

---

## Step 7: Verify Deployment

Once deployed, Back4App provides a URL like:
```
https://your-app-name.b4a.run
```

Test these endpoints:
- **Frontend**: `https://your-app-name.b4a.run/`
- **Health**: `https://your-app-name.b4a.run/health`
- **API**: `https://your-app-name.b4a.run/api/v1/health`

---

## Troubleshooting

### Build Fails
- Check Dockerfile is at repo root
- Verify all files are committed and pushed

### Database Connection Error
- Verify DATABASE_URL is correct
- Check Supabase project is running
- Ensure password has no special characters that need escaping

### App Crashes on Start
- Check Back4App logs for errors
- Verify all environment variables are set

---

## Free Tier Limits

| Resource | Limit |
|----------|-------|
| Back4App Container | 0.25 CPU, 256 MB RAM |
| Supabase Database | 500 MB storage, 2 GB bandwidth |

This is sufficient for demos and low-traffic usage.
