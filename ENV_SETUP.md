# Frontend Environment Variables Setup

## VITE_API_URL Configuration

### ✅ Correct: Backend URL

The `VITE_API_URL` should point to your **BACKEND** service (Render), not the frontend.

```env
VITE_API_URL=https://your-backend-app.onrender.com
```

### ❌ Wrong: Frontend URL

```env
# DON'T DO THIS
VITE_API_URL=https://your-frontend-app.vercel.app
```

## How to Find Your Backend URL

1. Go to **Render Dashboard**: https://dashboard.render.com
2. Click on your **Backend Web Service** (the one running FastAPI)
3. Your backend URL will be shown at the top, like:
   - `https://exam-portal-backend-xyz.onrender.com`
   - Or similar format

## Setup Steps

### For Local Development

1. Create `.env` file in `ExamPaperPortalFrontend/` folder:

```env
VITE_API_URL=https://your-backend-app.onrender.com
```

2. Restart your dev server:
```bash
npm run dev
```

### For Production (Vercel/Netlify/etc.)

1. Go to your hosting platform dashboard
2. Find **Environment Variables** settings
3. Add:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-backend-app.onrender.com`
4. Redeploy your frontend

## Example

If your Render backend is at:
```
https://exam-portal-backend-abc123.onrender.com
```

Then your `.env` should be:
```env
VITE_API_URL=https://exam-portal-backend-abc123.onrender.com
```

## Verify It's Working

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Try to login
4. Check the request URL - it should go to your Render backend, not localhost

Example request should be:
```
POST https://exam-portal-backend-abc123.onrender.com/admin-login
```

NOT:
```
POST http://localhost:8000/admin-login
```

## Quick Test

After setting up, test in browser console:

```javascript
console.log(import.meta.env.VITE_API_URL)
// Should show: https://your-backend-app.onrender.com
```

---

**Summary**: `VITE_API_URL` = Your **Backend** URL from Render ✅

