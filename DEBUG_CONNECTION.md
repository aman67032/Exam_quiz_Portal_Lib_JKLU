# Debug: "Failed to load papers" Error

## Quick Diagnostic Steps

### Step 1: Check Browser Console

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Look for error messages when loading papers
4. Check for:
   - Network errors
   - CORS errors
   - API errors

### Step 2: Check Network Tab

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Refresh the page
4. Look for request to: `/papers/public/all`
5. Check:
   - **Status Code**: Should be 200 (success) or 500 (server error)
   - **Request URL**: Should be `https://exam-portal-backend-jklu-solomaze.vercel.app/papers/public/all`
   - **Response**: Check what the server returned

### Step 3: Test Backend Directly

Open these URLs in your browser:

1. **Health Check:**
   ```
   https://exam-portal-backend-jklu-solomaze.vercel.app/health
   ```
   Expected: `{"status": "ok"}`

2. **Public Papers API:**
   ```
   https://exam-portal-backend-jklu-solomaze.vercel.app/papers/public/all
   ```
   Expected: `[]` (empty array) or `[{...}, {...}]` (array of papers)

3. **Wake Endpoint:**
   ```
   https://exam-portal-backend-jklu-solomaze.vercel.app/wake
   ```
   Expected: `{"message": "Backend is awake"}` or similar

### Step 4: Check Railway Backend

1. Go to Railway Dashboard
2. Select your Backend Service
3. Go to **Deployments** → **View Logs**
4. Check for:
   - Database connection errors
   - API errors
   - Startup messages

### Step 5: Check Database Connection

1. Railway Dashboard → Backend Service → **Variables**
2. Verify `DATABASE_URL` is set
3. Should be: `postgresql://postgres:yvFPUoOUFxjaiLqtimFIZRDgcqavpCeU@yamabiko.proxy.rlwy.net:21623/railway`

## Common Error Scenarios

### Error: "Backend server is not responding"

**Cause:** Backend is not running or not accessible

**Solution:**
1. Check Railway Dashboard → Backend Service status
2. Check if service is running (green status)
3. View logs for errors
4. Redeploy if needed

### Error: "Server error (500)"

**Cause:** Backend is running but has an error (likely database connection)

**Solution:**
1. Check Railway backend logs
2. Look for database connection errors
3. Verify `DATABASE_URL` is correct
4. Check if Railway PostgreSQL is running

### Error: "API endpoint not found (404)"

**Cause:** Endpoint doesn't exist or URL is wrong

**Solution:**
1. Verify backend URL is correct
2. Check if endpoint `/papers/public/all` exists
3. Test endpoint directly in browser

### Error: Network/CORS Error

**Cause:** CORS or network issue

**Solution:**
1. Backend has CORS enabled (`allow_origins=["*"]`)
2. Check browser console for CORS errors
3. Verify backend URL is correct

## Quick Fixes

### Fix 1: Backend Not Running

1. Railway Dashboard → Backend Service
2. Check service status
3. If stopped, restart/redeploy

### Fix 2: Database Not Connected

1. Railway Dashboard → Backend Service → Variables
2. Set `DATABASE_URL` to Railway PostgreSQL URL
3. Redeploy backend

### Fix 3: Database Empty

If API returns `[]` (empty array):
- This is normal for new database
- Add papers through admin dashboard
- Or migrate data from Neon

## Test Commands

### Using curl (if available):

```bash
# Test health
curl https://exam-portal-backend-jklu-solomaze.vercel.app/health

# Test papers API
curl https://exam-portal-backend-jklu-solomaze.vercel.app/papers/public/all

# Test with verbose output
curl -v https://exam-portal-backend-jklu-solomaze.vercel.app/papers/public/all
```

### Using Browser:

Just open the URLs directly in your browser to see the response.

## Expected Behavior

### If Backend is Working:
- `/health` returns: `{"status": "ok"}`
- `/papers/public/all` returns: `[]` or `[{...}]`
- Frontend should load (even if empty)

### If Backend is Not Working:
- URLs return error or timeout
- Frontend shows error message
- Browser console shows errors

## Next Steps

1. **Check browser console** for specific error
2. **Test backend URLs** directly
3. **Check Railway logs** for backend errors
4. **Verify DATABASE_URL** in Railway
5. **Redeploy backend** if needed

---

**Most Common Issue:** Backend not connected to database or database connection error. Check Railway backend logs and `DATABASE_URL` variable.

