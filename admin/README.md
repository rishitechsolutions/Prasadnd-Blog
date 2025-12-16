# Portfolio Admin Dashboard

A beautiful admin dashboard for managing your portfolio website content.

## Features

- 🔐 Secure authentication system
- 📝 Content management for all pages
- 🖼️ Image/media management
- 📰 Article management for Beyond Work section
- 🎨 Beautiful UI matching your theme colors

## Installation

1. Navigate to the admin folder:
```bash
cd admin
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

4. Access the dashboard:
- Open your browser and go to: `http://localhost:3000/admin`
- Default login credentials:
  - Username: `admin`
  - Password: `admin123` (change this after first login!)

## Project Structure

```
admin/
├── server.js           # Main server file
├── database.js         # Database setup and queries
├── routes/             # API routes
│   ├── auth.js         # Authentication routes
│   ├── content.js      # Content management routes
│   ├── media.js        # Media management routes
│   └── articles.js     # Article management routes
├── public/             # Static files
│   ├── css/            # Admin dashboard styles
│   ├── js/             # Admin dashboard scripts
│   └── uploads/        # Uploaded images
├── views/              # HTML templates
│   ├── login.html      # Login page
│   └── dashboard.html  # Main dashboard
└── package.json        # Dependencies
```

## Security Notes

⚠️ **Important**: Change the default admin password immediately after first login!

## Next Steps

1. Change default admin credentials
2. Upload your content
3. Customize pages as needed
4. Add articles to Beyond Work section

