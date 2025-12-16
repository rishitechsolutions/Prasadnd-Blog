# Render Deployment Guide - Step by Step

## Prerequisites

1. Your code must be in a **GitHub repository** (Render deploys from GitHub)
2. A GitHub account (free)
3. A Render account (free)

---

## Step 1: Push Your Code to GitHub

If you haven't already:

1. **Create a GitHub repository**:
   - Go to https://github.com
   - Click "New repository"
   - Name it: `portfolio-website` (or any name)
   - Make it **Public** or **Private** (both work)
   - Click "Create repository"

2. **Push your code**:
   ```bash
   # In your portfolio-website folder
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/portfolio-website.git
   git push -u origin main
   ```

   Or use GitHub Desktop/Git GUI if you prefer.

---

## Step 2: Sign Up for Render

1. Go to **https://render.com**
2. Click **"Get Started for Free"**
3. Sign up with your **GitHub account** (recommended - easier setup)
   - Or use email if you prefer
4. **No credit card required** ✅

---

## Step 3: Create a New Web Service

1. Once logged in, click **"New +"** button (top right)
2. Select **"Web Service"**

---

## Step 4: Connect Your Repository

1. Click **"Connect account"** or **"Connect GitHub"** if not connected
2. Authorize Render to access your GitHub repositories
3. Select your repository: `portfolio-website` (or your repo name)
4. Click **"Connect"**

---

## Step 5: Configure Your Service

Fill in the following settings:

### Basic Settings:
- **Name**: `portfolio-admin` (or any name you like)
- **Region**: Choose closest to you (e.g., `Oregon (US West)`)
- **Branch**: `main` (or `master` if that's your branch)

### Build & Deploy Settings:
- **Root Directory**: `admin` ⚠️ **IMPORTANT!** This tells Render where your Node.js app is
- **Runtime**: `Node` (should auto-detect)
- **Build Command**: `npm install`
- **Start Command**: `node server.js`

### Plan:
- **Free** (select this - it's free!)

---

## Step 6: Environment Variables (Optional but Recommended)

Click **"Advanced"** → **"Add Environment Variable"**

Add these if you want to customize:

```
NODE_ENV=production
PORT=10000
```

**Note**: Render automatically sets `PORT`, so you might not need to change it. But if your server.js hardcodes port 3000, you'll need to update it (see Step 7).

---

## Step 7: Update Server Port (If Needed)

Render provides a dynamic port via `process.env.PORT`. Let's make sure your server uses it:

**Check your `admin/server.js`**:

If it says:
```javascript
const PORT = 3000;
```

Change it to:
```javascript
const PORT = process.env.PORT || 3000;
```

This allows Render to set the port automatically.

---

## Step 8: Deploy!

1. Scroll down and click **"Create Web Service"**
2. Render will start building and deploying your app
3. You'll see build logs in real-time
4. Wait 2-5 minutes for deployment to complete

---

## Step 9: Get Your Admin URL

Once deployment is complete:

1. You'll see a green "Live" status
2. Your admin URL will be displayed at the top, like:
   ```
   https://portfolio-admin.onrender.com
   ```
3. **Your admin dashboard**: `https://portfolio-admin.onrender.com/admin`

---

## Step 10: Test Your Admin Dashboard

1. Open: `https://portfolio-admin.onrender.com/admin`
2. Login with:
   - **Username**: `admin`
   - **Password**: `admin123`
3. You should see your dashboard! 🎉

---

## Important Notes

### Sleep Mode (Free Tier)
- Your service will **sleep after 15 minutes** of inactivity
- First request after sleep takes **30-60 seconds** to wake up
- This is normal and free! ✅

### Database
- Your SQLite database is stored in the `admin` folder
- On Render, it persists between deployments
- For production, consider upgrading to a PostgreSQL database (Render offers free PostgreSQL)

### File Uploads
- Uploaded files go to `admin/uploads/`
- These persist on Render
- Make sure `uploads` folder exists (you have `.gitkeep` already)

---

## Troubleshooting

### Build Fails
- Check build logs in Render dashboard
- Common issues:
  - Missing `package.json` in `admin` folder ✅ (you have it)
  - Wrong root directory (should be `admin`)
  - Node version mismatch

### Service Won't Start
- Check logs in Render dashboard
- Common issues:
  - Port not set correctly (should use `process.env.PORT`)
  - Missing dependencies
  - Database path issues

### Can't Access Admin
- Make sure URL is: `https://your-service.onrender.com/admin` (not just root)
- Check if service is sleeping (first request takes time)
- Check Render logs for errors

### Images Not Loading
- Verify `/assets` path is correct
- Check that static file serving is configured in `server.js`

---

## Quick Checklist

Before deploying, make sure:

- [ ] Code is pushed to GitHub
- [ ] `admin/package.json` exists
- [ ] `admin/server.js` uses `process.env.PORT || 3000`
- [ ] `admin/uploads/` folder exists
- [ ] Root directory is set to `admin` in Render
- [ ] Build command: `npm install`
- [ ] Start command: `node server.js`

---

## Your Admin URLs

After deployment:

- **Admin Dashboard**: `https://portfolio-admin.onrender.com/admin`
- **API Endpoints**: `https://portfolio-admin.onrender.com/api/*`
- **Uploads**: `https://portfolio-admin.onrender.com/uploads/*`

---

## Next Steps

1. ✅ Deploy to Render
2. ✅ Test admin dashboard
3. 🔄 Connect your Netlify site to fetch content from Render API (optional)
4. 🔒 Change default admin password
5. 📝 Start managing your content!

---

## Need Help?

If you encounter issues:
1. Check Render logs (in dashboard)
2. Check browser console for errors
3. Verify all settings match this guide
4. Make sure `admin` folder structure is correct

Good luck! 🚀

