# Netlify + GitHub Auto-Deployment Setup Guide

This guide will help you connect your portfolio website to Netlify with automatic deployments from GitHub.

## 📋 Prerequisites

- ✅ Your code is pushed to GitHub (you already have: `https://github.com/siva4569/portfolio-website.git`)
- ✅ A Netlify account (free tier works perfectly)

---

## 🚀 Step-by-Step Setup

### Step 1: Log in to Netlify

1. Go to [https://app.netlify.com](https://app.netlify.com)
2. Sign in with your GitHub account (recommended) or create a new account

### Step 2: Add New Site from Git

1. Click **"Add new site"** button (top right)
2. Select **"Import an existing project"**
3. Choose **"Deploy with GitHub"** (or GitLab/Bitbucket if you prefer)

### Step 3: Authorize Netlify

1. You'll be asked to authorize Netlify to access your GitHub
2. Click **"Authorize Netlify"**
3. You may need to enter your GitHub password
4. Netlify will request permissions - click **"Authorize netlify"**

### Step 4: Select Your Repository

1. Netlify will show a list of your GitHub repositories
2. Find and select: **`portfolio-website`**
3. If you don't see it:
   - Make sure the repo is not private (or upgrade Netlify plan)
   - Or use manual deploy (see alternative method below)

### Step 5: Configure Build Settings

Since your portfolio is a **static website** (HTML/CSS/JS), configure these settings:

#### Build Settings:
- **Branch to deploy:** `main` (or `master` - check your default branch)
- **Base directory:** Leave empty (or `./` if you want to be explicit)
- **Build command:** Leave empty (no build needed for static site)
- **Publish directory:** Leave empty (Netlify will auto-detect `index.html`)

#### Your settings should look like:
```
Branch to deploy: main
Base directory: (empty)
Build command: (empty)
Publish directory: (empty)
```

### Step 6: Deploy!

1. Click **"Deploy site"**
2. Netlify will start deploying your site
3. Wait 1-2 minutes for the first deployment
4. You'll see a success message with your site URL

---

## ✅ After Deployment

### Your Site URL
- Netlify will give you a URL like: `https://random-name-123.netlify.app`
- You can customize it in **Site settings → Change site name**

### Auto-Deployment is Now Active! 🎉

Every time you push to GitHub:
```bash
git add .
git commit -m "Your changes"
git push
```

Netlify will **automatically**:
1. Detect the push
2. Pull the latest code
3. Deploy the new version
4. Update your live site (usually takes 1-2 minutes)

---

## 🔧 Advanced Settings (Optional)

### Custom Domain
1. Go to **Site settings → Domain management**
2. Click **"Add custom domain"**
3. Follow the DNS setup instructions

### Environment Variables
If you need any (not required for static sites):
1. Go to **Site settings → Environment variables**
2. Add any variables your site needs

### Build Hooks
For manual deployments or CI/CD:
1. Go to **Site settings → Build & deploy → Build hooks**
2. Create a build hook URL
3. Use it to trigger deployments via API

---

## 🔄 Manual Deploy (Alternative Method)

If you can't connect via GitHub (e.g., private repo on free plan):

### Option 1: Drag & Drop
1. In Netlify dashboard, go to **"Sites"**
2. Drag your project folder (omit any large folders like `node_modules`)
3. Drop it in the deploy area
4. ⚠️ **Note:** This is manual - you need to drag & drop each time

### Option 2: Netlify CLI
1. Install Netlify CLI: `npm install -g netlify-cli`
2. Login: `netlify login`
3. Deploy: `netlify deploy --prod`
4. ⚠️ **Note:** Still manual, but faster than drag & drop

---

## 📝 Important Notes

### What Gets Deployed?
- ✅ All HTML files (`index.html`, `contact.html`, etc.)
- ✅ CSS (`styles.css`)
- ✅ JavaScript (`script.js`)
- ✅ Assets folder (`assets/`)

This repository now contains only the frontend. Any backend or admin functionality has been removed from this repo.

---

## 🐛 Troubleshooting

### "Repository not found"
- Make sure the repo is public, OR
- Upgrade Netlify plan for private repos, OR
- Use manual deploy method

### "Build failed"
- Check Netlify build logs
- Make sure `index.html` is in the root directory
- Verify all file paths are correct

### "Site not updating"
- Check if auto-deploy is enabled: **Site settings → Build & deploy → Continuous Deployment**
- Verify you pushed to the correct branch
- Check Netlify deploy logs for errors

### "404 on subpages"
- Create a `_redirects` file in root (see below)

---

## 📄 Optional: Create `_redirects` File

If you want clean URLs or handle 404s, create this file:

**File:** `_redirects` (in root directory)
```
/*    /index.html   200
```

This tells Netlify to serve `index.html` for all routes (useful for SPAs).

---

## 🎯 Quick Reference

### Enable Auto-Deploy:
✅ Already enabled by default when connected to GitHub

### Disable Auto-Deploy:
1. Site settings → Build & deploy → Continuous Deployment
2. Toggle off "Stop auto publishing"

### Deploy Specific Branch:
1. Site settings → Build & deploy → Continuous Deployment
2. Edit branch settings
3. Add branch and configure

### View Deploy Logs:
- Click on any deploy in the **Deploys** tab
- See build logs, deploy logs, and functions logs

---

## ✨ Summary

Once connected:
- ✅ Push to GitHub → Auto-deploys to Netlify
- ✅ Changes go live in 1-2 minutes
- ✅ No manual steps needed
- ✅ Free forever (with limitations)

**Your workflow:**
```
Edit files locally
    ↓
git add .
git commit -m "message"
git push
    ↓
Netlify auto-deploys (1-2 min)
    ↓
Live site updated! 🎉
```

---

## 📞 Need Help?

- Netlify Docs: [https://docs.netlify.com](https://docs.netlify.com)
- Netlify Support: [https://www.netlify.com/support](https://www.netlify.com/support)

