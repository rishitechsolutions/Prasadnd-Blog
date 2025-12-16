# Admin Dashboard Setup Guide

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
cd admin
npm install
```

### Step 2: Start the Server

```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

### Step 3: Access the Dashboard

1. Open your browser and navigate to: `http://localhost:3000/admin`
2. Login with default credentials:
   - **Username**: `admin`
   - **Password**: `admin123`

⚠️ **IMPORTANT**: Change the default password immediately after first login!

## 📋 Features

### ✅ Completed Features

1. **Authentication System**
   - Secure login/logout
   - Session management
   - Password hashing with bcrypt

2. **Dashboard Overview**
   - Statistics (articles count, media count, pages)
   - Beautiful UI matching your theme (#003966)

3. **Pages Management**
   - Edit content for all pages (Who I Am, Education, Profession, Contact)
   - HTML content editor

4. **Articles Management**
   - Create, Read, Update, Delete articles
   - Category management (Education, Travel, Hobbies, Experience)
   - Image URL support
   - Date formatting

5. **Media Library**
   - Upload images (drag & drop or click)
   - View all uploaded media
   - Delete media files
   - File size display

## 🎨 Theme Colors

The dashboard uses your portfolio theme colors:
- Primary: `#003966`
- Primary Dark: `#002d4d`
- Matches your website's aesthetic

## 📁 Project Structure

```
admin/
├── server.js              # Main Express server
├── database.js            # SQLite database setup
├── views/                 # HTML templates
│   ├── login.html
│   └── dashboard.html
├── public/                # Static assets
│   ├── css/
│   │   └── admin.css     # Dashboard styles
│   └── js/
│       ├── login.js      # Login functionality
│       └── dashboard.js  # Dashboard functionality
├── uploads/              # Uploaded images
└── database.db          # SQLite database (created automatically)
```

## 🔐 Security Notes

1. **Change Default Password**: Update the admin password in the database after first login
2. **Session Secret**: Change the session secret in `server.js` for production
3. **HTTPS**: Use HTTPS in production and set `secure: true` in session config

## 🔄 Next Steps

### To Connect Frontend to Backend:

1. **Update HTML files** to fetch content from API instead of static content
2. **Create API endpoints** in your frontend to load dynamic content
3. **Update article display** in `beyond-work.html` to load from database

### Example: Loading Articles Dynamically

In your `beyond-work.html`, you can add:

```javascript
// Fetch articles from API
fetch('/api/articles/public')  // Create public endpoint
    .then(res => res.json())
    .then(articles => {
        // Render articles dynamically
    });
```

## 🐛 Troubleshooting

### Port Already in Use
If port 3000 is busy, change `PORT` in `server.js`

### Database Errors
Delete `database.db` and restart server to recreate database

### File Upload Issues
Ensure `uploads/` directory has write permissions

## 📝 API Endpoints

### Authentication
- `POST /api/login` - Login
- `POST /api/logout` - Logout

### Pages
- `GET /api/pages` - Get all pages
- `GET /api/pages/:pageName` - Get specific page
- `POST /api/pages/:pageName` - Update page content

### Articles
- `GET /api/articles` - Get all articles
- `GET /api/articles/:id` - Get specific article
- `POST /api/articles` - Create article
- `PUT /api/articles/:id` - Update article
- `DELETE /api/articles/:id` - Delete article

### Media
- `GET /api/media` - Get all media
- `POST /api/media/upload` - Upload file
- `DELETE /api/media/:id` - Delete media

## 🎯 Future Enhancements

- [ ] User management (multiple admins)
- [ ] Content versioning
- [ ] Rich text editor (WYSIWYG)
- [ ] Image cropping/resizing
- [ ] Bulk operations
- [ ] Activity logs
- [ ] Backup/restore functionality

---

**Built with ❤️ for your portfolio website**

