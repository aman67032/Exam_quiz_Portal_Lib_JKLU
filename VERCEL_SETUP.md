# Vercel Deployment Setup - Connect to Railway Backend

## ✅ Frontend Code Fixed

All hardcoded `localhost:8000` URLs have been updated to use environment variables:
- ✅ `StudentDashboard.tsx`
- ✅ `Profile.tsx`
- ✅ `FilePreviewModal.tsx`
- ✅ All other components already use environment variables

## 🔧 Step 1: Set Environment Variable in Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. Go to your Vercel project: https://vercel.com/dashboard
2. Click on your project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Add:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://web-production-e22a6.up.railway.app`
   - **Environment**: Select all (Production, Preview, Development)
6. Click **Save**

### Option B: Via Vercel CLI

```bash
vercel env add VITE_API_URL
# When prompted, enter: https://web-production-e22a6.up.railway.app
# Select all environments
```

## 🚀 Step 2: Redeploy Frontend

After adding the environment variable:

1. **Option A**: Push a new commit to trigger auto-deploy
   ```bash
   git add .
   git commit -m "Update API URL configuration"
   git push
   ```

2. **Option B**: Manual redeploy in Vercel
   - Go to Vercel Dashboard → Your Project → Deployments
   - Click "..." on latest deployment → "Redeploy"

## ✅ Step 3: Verify It Works

1. Visit your Vercel frontend URL
2. Open browser DevTools (F12) → Console
3. Try logging in or making an API call
4. Check Network tab - requests should go to:
   `https://web-production-e22a6.up.railway.app`

## 🔍 Troubleshooting

### Issue: Still using localhost
**Solution**: 
- Make sure you redeployed after adding the environment variable
- Environment variables are only available at build time
- Clear browser cache and hard refresh (Ctrl+Shift+R)

### Issue: CORS errors
**Solution**: 
- Backend already has CORS configured with `allow_origins=["*"]`
- If you see CORS errors, check Railway backend logs

### Issue: API not responding
**Solution**:
- Check if Railway backend is running: https://web-production-e22a6.up.railway.app/health
- Check Railway logs for errors
- Verify environment variables in Railway are set correctly

## 📝 Environment Variable Reference

| Variable | Value | Required |
|----------|-------|----------|
| `VITE_API_URL` | `https://web-production-e22a6.up.railway.app` | Yes |
| `VITE_BACKEND_URL` | Same as above (alternative) | Optional |

## 🎯 Quick Checklist

- [ ] Added `VITE_API_URL` in Vercel Environment Variables
- [ ] Redeployed frontend (automatic or manual)
- [ ] Tested login/API calls
- [ ] Verified requests go to Railway backend
- [ ] Checked browser console for errors

## 🔗 Links

- **Backend URL**: https://web-production-e22a6.up.railway.app
- **Backend Health Check**: https://web-production-e22a6.up.railway.app/health
- **Backend API Docs**: https://web-production-e22a6.up.railway.app/docs
- **Vercel Dashboard**: https://vercel.com/dashboard

