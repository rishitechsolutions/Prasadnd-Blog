# Frontend API Connection — Admin Removed

Note: the admin dashboard and backend server have been removed from this repository. The frontend currently serves static content and does not depend on any backend API by default.

Summary:
- The frontend uses static HTML/CSS/JS assets in this repo.
- `api-config.js` defaults to `window.API_DISABLED = true` so no API calls are made.

If you want to reconnect a backend API later:

1. Deploy a compatible backend that exposes the public endpoints (for example `/api/public/settings`, `/api/public/social-links`, `/api/public/articles`).
2. Update `api-config.js` to set `window.API_DISABLED = false` and set `window.API_BASE_URL` to your backend URL:

```javascript
window.API_DISABLED = false;
window.API_BASE_URL = 'https://your-backend.example.com';
```

3. Ensure CORS is configured on the backend to allow your site origin.

Notes for frontend developers:
- `api-client.js` contains logic to fetch settings, social links, and articles when `window.API_DISABLED` is `false`.
- The site is safe to host as a purely static site on Netlify or any static host.

If you want, I can provide a short checklist to connect a new backend and safely re-enable dynamic content.

