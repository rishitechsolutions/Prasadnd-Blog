# Admin Dashboard Deployment Guide

## Admin Dashboard URL

### Local Development
- **URL**: `http://localhost:3000/admin`
- **Login**: `admin` / `admin123`

### Production Server Deployment

The admin URL depends on how you deploy your website. Here are common scenarios:

#### Scenario 1: Same Domain (Recommended)
If your portfolio website is at `https://yourdomain.com`, the admin would be:
- **URL**: `https://yourdomain.com/admin`
- **Login**: `admin` / `admin123` (change this!)

#### Scenario 2: Subdomain
If you prefer a separate subdomain:
- **URL**: `https://admin.yourdomain.com`
- Requires subdomain configuration in your hosting

#### Scenario 3: Different Port
If running on a different port:
- **URL**: `https://yourdomain.com:3000/admin`
- Not recommended for production (use reverse proxy instead)

## Deployment Options

### Option 1: Deploy with Your Website (Same Server)

1. **Upload all files** including the `admin` folder to your server
2. **Install Node.js** on your server (if not already installed)
3. **Navigate to admin folder** and install dependencies:
   ```bash
   cd admin
   npm install --production
   ```
4. **Start the server** using a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "portfolio-admin"
   pm2 save
   pm2 startup
   ```

5. **Configure reverse proxy** (Nginx example):
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       # Main website (static files)
       location / {
           root /path/to/portfolio-website;
           try_files $uri $uri/ =404;
       }
       
       # Admin dashboard
       location /admin {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
       
       # Admin API
       location /api {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
       }
       
       # Admin uploads
       location /uploads {
           proxy_pass http://localhost:3000;
       }
   }
   ```

6. **Access admin at**: `https://yourdomain.com/admin`

### Option 2: Separate Admin Server

1. Deploy admin to a separate server/subdomain
2. Configure CORS if needed
3. Access at: `https://admin.yourdomain.com`

### Option 3: Using cPanel/Shared Hosting

1. Upload admin folder to your hosting
2. Use Node.js Selector (if available) to set Node.js version
3. Install dependencies via SSH or terminal
4. Run via cron job or process manager
5. Access at: `https://yourdomain.com/admin`

## Environment Variables (Recommended)

Create a `.env` file in the `admin` folder:

```env
PORT=3000
NODE_ENV=production
SESSION_SECRET=your-very-secure-secret-key-here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
```

Update `server.js` to use environment variables:

```javascript
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'your-secret-key-change-this-in-production';
```

## Security Checklist

Before deploying to production:

- [ ] Change default admin password
- [ ] Update session secret in `server.js`
- [ ] Enable HTTPS (SSL certificate)
- [ ] Set secure cookie flags in session config
- [ ] Restrict admin access by IP (optional)
- [ ] Set up regular database backups
- [ ] Use environment variables for sensitive data
- [ ] Keep Node.js and dependencies updated

## Quick Start Commands

```bash
# Install dependencies
cd admin
npm install --production

# Start server (development)
npm start

# Start with PM2 (production)
pm2 start server.js --name portfolio-admin

# View logs
pm2 logs portfolio-admin

# Restart server
pm2 restart portfolio-admin

# Stop server
pm2 stop portfolio-admin
```

## Troubleshooting

### Port Already in Use
Change the PORT in `server.js` or use environment variable:
```bash
PORT=3001 npm start
```

### Cannot Access Admin
- Check if server is running: `pm2 list`
- Check firewall settings
- Verify reverse proxy configuration
- Check server logs: `pm2 logs portfolio-admin`

### Images Not Loading
- Verify `/assets` and `/uploads` are accessible
- Check file permissions
- Verify static file serving in server.js

## Support

For deployment issues, check:
- Server logs
- Nginx/Apache error logs
- PM2 logs
- Browser console for client-side errors

