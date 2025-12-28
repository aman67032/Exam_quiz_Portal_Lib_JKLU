# Localhost Development Setup

## ✅ Fixed Issues

All API endpoints now point to the production backend:
- **Backend URL**: `https://exampaperportal-production.up.railway.app`

## Files Updated

The following files were updated to use the correct backend URL:

1. ✅ `src/contexts/AuthContext.tsx` - Fixed login/register API calls
2. ✅ `src/components/OTPVerification.tsx` - Fixed OTP verification
3. ✅ `src/components/Profile.tsx` - Fixed profile API calls
4. ✅ `src/utils/api.ts` - Already correct (with logging)
5. ✅ `src/components/AdminLogin.tsx` - Already correct
6. ✅ `src/components/AdminDashboard.tsx` - Already correct
7. ✅ `src/utils/uploads.ts` - Already correct
8. ✅ `src/utils/keepAlive.ts` - Already correct

## How It Works

The frontend uses this priority order for the backend URL:

1. **Environment Variable**: `VITE_API_URL` (if set in `.env` file)
2. **Environment Variable**: `VITE_BACKEND_URL` (if set in `.env` file)
3. **Default Fallback**: `https://exampaperportal-production.up.railway.app`

## For Localhost Development

### Option 1: Use Default (Recommended)
No configuration needed! The frontend will automatically use the production backend URL when running on localhost.

### Option 2: Create `.env` File (Optional)
If you want to explicitly set it, create a `.env` file in `ExamPaperPortalFrontend/`:

```env
VITE_API_URL=https://exampaperportal-production.up.railway.app
```

**Note**: After creating/modifying `.env`, restart your dev server:
```bash
npm run dev
```

## Verify It's Working

1. **Start your dev server**:
   ```bash
   cd ExamPaperPortalFrontend
   npm run dev
   ```

2. **Check browser console** - You should see:
   ```
   🔗 Backend API URL: https://exampaperportal-production.up.railway.app
   ```

3. **Test Login/Signup**:
   - Try logging in with a valid `@jklu.edu.in` email
   - Try signing up with a new account
   - Check the Network tab in DevTools - requests should go to `exampaperportal-production.up.railway.app`

4. **Check Network Tab**:
   - Open DevTools (F12) → Network tab
   - Try to login/signup
   - Verify requests are going to: `https://exampaperportal-production.up.railway.app/login` or `/register`

## Troubleshooting

### Login/Signup Not Working?

1. **Check Console Logs**:
   - Open browser DevTools (F12)
   - Check Console tab for errors
   - Look for the backend URL log message

2. **Check Network Tab**:
   - Open DevTools (F12) → Network tab
   - Try login/signup
   - Check if requests are being made
   - Check response status codes

3. **Verify Backend is Running**:
   - Visit: `https://exampaperportal-production.up.railway.app/health`
   - Should return: `{"status": "ok"}`

4. **Check CORS**:
   - Backend should allow all origins
   - If you see CORS errors, check backend CORS configuration

5. **Clear Browser Cache**:
   - Clear localStorage: `localStorage.clear()`
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

## Environment Variables

If you need to override the backend URL, create a `.env` file:

```env
# Backend API URL
VITE_API_URL=https://exampaperportal-production.up.railway.app
```

**Important**: 
- Environment variables are only available at **build time**
- After changing `.env`, you **must restart** the dev server
- `.env` files are gitignored (don't commit them)

## Summary

✅ All files now use the correct production backend URL  
✅ Login and Signup should work on localhost  
✅ No `.env` file needed (uses default fallback)  
✅ Backend URL is logged in console for debugging  

