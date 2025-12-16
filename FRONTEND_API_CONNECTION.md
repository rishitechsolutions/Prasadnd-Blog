# Frontend-Admin API Connection Guide

## ✅ What's Been Done

Your portfolio website is now connected to the admin dashboard API! Changes made in the admin dashboard will automatically appear on your live website.

## 🔧 How It Works

### 1. **Public API Endpoints** (Created in `admin/server.js`)
   - `/api/public/settings` - Gets logo and profile picture URLs
   - `/api/public/social-links` - Gets all social media links
   - `/api/public/articles` - Gets all published articles

### 2. **Frontend API Client** (`api-client.js`)
   - Automatically fetches content from the admin API
   - Updates logo, profile picture, and social links on all pages
   - Dynamically loads articles on the "Beyond Work" page

### 3. **Configuration** (`api-config.js`)
   - Contains your Render admin dashboard URL
   - Easy to update if you change your Render URL

## 🚀 What Updates Automatically

### ✅ Logo
- When you change the logo in the admin dashboard → Updates on all pages immediately

### ✅ Profile Picture
- When you change the profile picture in admin → Updates on homepage immediately

### ✅ Social Links
- When you add/edit/delete social links in admin → Updates in sidebar on all pages immediately

### ✅ Articles (Beyond Work Page)
- When you add/edit/delete articles in admin → Updates on "Beyond Work" page immediately
- Only published articles are shown

## 📝 Setup Instructions

### Step 1: Update API URL (if needed)

If your Render URL is different, edit `api-config.js`:

```javascript
window.API_BASE_URL = 'https://your-render-url.onrender.com';
```

### Step 2: Deploy Changes

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Connect frontend to admin API"
   git push
   ```

2. **Netlify will auto-deploy** your frontend changes

3. **Render admin dashboard** is already running (no changes needed there)

### Step 3: Test It!

1. Go to your admin dashboard: `https://your-render-url.onrender.com/admin`
2. Change the logo or profile picture
3. Visit your live website - changes should appear immediately! 🎉

## 🔍 How to Verify It's Working

1. **Open browser console** (F12) on your website
2. Look for any errors (should be none)
3. Check Network tab - you should see requests to `/api/public/settings` and `/api/public/social-links`

## 🐛 Troubleshooting

### Changes Not Appearing?

1. **Check API URL:**
   - Make sure `api-config.js` has the correct Render URL
   - Test the API directly: `https://your-render-url.onrender.com/api/public/settings`

2. **Check CORS:**
   - The admin server has CORS enabled for all origins
   - If you want to restrict it, edit `admin/server.js` and change:
     ```javascript
     res.header('Access-Control-Allow-Origin', '*');
     ```
     to:
     ```javascript
     res.header('Access-Control-Allow-Origin', 'https://your-netlify-site.netlify.app');
     ```

3. **Check Browser Console:**
   - Open DevTools (F12) → Console tab
   - Look for any JavaScript errors

4. **Check Network Tab:**
   - Open DevTools (F12) → Network tab
   - Refresh the page
   - Look for requests to `/api/public/*`
   - Check if they return 200 status

### API Returns Empty Data?

- Make sure you've saved settings in the admin dashboard first
- The API returns defaults if nothing is saved
- Try initializing settings: Go to admin dashboard → Settings → The system auto-loads from your website files

### Articles Not Showing?

- Make sure articles are marked as "Published" in the admin dashboard
- Check that articles have a title and content
- Verify the "Beyond Work" page is loading (check browser console)

## 📊 Current Status

| Feature | Status | Notes |
|---------|--------|-------|
| Logo Updates | ✅ Working | Updates on all pages |
| Profile Picture Updates | ✅ Working | Updates on homepage |
| Social Links Updates | ✅ Working | Updates in sidebar |
| Articles Dynamic Loading | ✅ Working | Only on Beyond Work page |
| Page Content Editing | ⏳ Not Connected | Still static HTML (can be added later) |

## 🎯 Next Steps (Optional)

If you want to make more content dynamic:

1. **Page Content Editor:**
   - Connect page content (Who I Am, Education, etc.) to the database
   - Allow editing page content from admin dashboard

2. **Work Experience:**
   - Make work experience entries editable from admin
   - Add/remove/edit jobs dynamically

3. **Education:**
   - Make education entries editable from admin
   - Add/remove/edit degrees dynamically

4. **Certifications:**
   - Make certifications editable from admin
   - Add/remove/edit certifications dynamically

## 🔒 Security Notes

- Public API endpoints don't require authentication (by design)
- They only return published/public content
- Admin endpoints still require authentication
- Consider restricting CORS to your Netlify domain in production

## 📞 Need Help?

- Check browser console for errors
- Verify API endpoints are accessible
- Make sure both Netlify (frontend) and Render (backend) are running
- Test API directly: `https://your-render-url.onrender.com/api/public/settings`

---

**🎉 You're all set!** Your website now loads content dynamically from the admin dashboard.

