# Frontend Environment Variables Setup

## VITE_API_URL Configuration

### ✅ Correct: Backend URL

The `VITE_API_URL` should point to your **BACKEND** service (Railway), not the frontend.

```env
VITE_API_URL=https://exam-portal-backend-jklu-solomaze.vercel.app
```

### ❌ Wrong: Frontend URL

```env
# DON'T DO THIS
VITE_API_URL=https://your-frontend-app.vercel.app
```

## Backend URL

Your backend is hosted on Vercel:
- **Backend URL**: `https://exam-portal-backend-jklu-solomaze.vercel.app`
- **Health Check**: `https://exam-portal-backend-jklu-solomaze.vercel.app/health`
- **API Docs**: `https://exam-portal-backend-jklu-solomaze.vercel.app/docs`

## Setup Steps

### For Local Development

1. Create `.env` file in `ExamPaperPortalFrontend/` folder:

```env
VITE_API_URL=https://exam-portal-backend-jklu-solomaze.vercel.app
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
   - **Value**: `https://exam-portal-backend-jklu-solomaze.vercel.app`
4. Redeploy your frontend

## Example

Your backend is at:
```
https://exam-portal-backend-jklu-solomaze.vercel.app
```

Then your `.env` should be:
```env
VITE_API_URL=https://exam-portal-backend-jklu-solomaze.vercel.app
```

## Verify It's Working

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Try to login
4. Check the request URL - it should go to your Railway backend, not localhost

Example request should be:
```
POST https://exam-portal-backend-jklu-solomaze.vercel.app/admin-login
```

NOT:
```
POST http://localhost:8000/admin-login
```

## Quick Test

After setting up, test in browser console:

```javascript
console.log(import.meta.env.VITE_API_URL)
// Should show: https://exam-portal-backend-jklu-solomaze.vercel.app
```

---

**Summary**: `VITE_API_URL` = Your **Backend** URL on Vercel ✅

**Current Backend URL**: `https://exam-portal-backend-jklu-solomaze.vercel.app`

