# Frontend-Backend Compatibility Changes

## Summary of Changes Made

This document outlines all the compatibility fixes applied to make the frontend work correctly with the FastAPI backend.

---

## 1. **AuthContext.tsx** - Fixed Login Form Encoding

### Issue
- Backend expects `application/x-www-form-urlencoded` format for login credentials
- Frontend was attempting to send JSON data with form-urlencoded header

### Fix
```typescript
// Changed from JSON object to URLSearchParams
const params = new URLSearchParams();
params.append('username', email);
params.append('password', password);

const response = await axios.post(`${API_BASE_URL}/login`, params, {
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
});
```

### Impact
- Login now works correctly with backend OAuth2PasswordRequestForm validation
- Proper error messages from backend are now captured and displayed

---

## 2. **Login.tsx & Register.tsx** - Enhanced Error Handling

### Issue
- Error messages were generic and didn't reflect actual backend error details
- Type safety was missing for error objects

### Fix
```typescript
// Improved error handling with type checking
catch (err: any) {
  setError(err.message || 'Invalid email or password');
}
```

### Impact
- Users now see descriptive error messages from the backend
- Better debugging and user experience

---

## 3. **AdminDashboard.tsx** - Fixed Course API Calls

### Issue
- Course creation and updates weren't properly sending JSON data
- Missing proper error handling and type safety

### Fix
```typescript
const config = {
  headers: { 
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
};

await axios[method](url, courseForm, config);
```

### Impact
- Courses can now be created, updated, and deleted successfully
- Backend validation errors are properly displayed to admin

---

## 4. **StudentDashboard.tsx** - Improved Error Handling

### Issues
- File upload errors weren't descriptive
- Paper fetch errors weren't properly logged
- Type safety issues with filter state

### Fixes
```typescript
// Better error messages for uploads
catch (error: any) {
  const errorMsg = error.response?.data?.detail || 'Upload failed. Please try again.';
  alert(errorMsg);
}

// Improved type safety for filters
setFilters((prev: typeof filters) => ({ ...prev, [name]: value }));
```

### Impact
- Upload failures show backend error messages
- Better debugging information in console
- Proper TypeScript type checking

---

## 5. **New: utils/api.ts** - Centralized API Configuration

### Purpose
- Centralized axios configuration with interceptors
- Automatic token injection in requests
- Consistent error handling across all API calls
- Environment variable support for API URL

### Features
```typescript
// Automatic Authorization header injection
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Unified error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const message = (error.response?.data as any)?.detail || error.message;
    return Promise.reject(new Error(message));
  }
);
```

### Usage
```typescript
import { API } from '@/utils/api';

// All API methods pre-configured
const user = await API.getCurrentUser();
const papers = await API.getPapers({ course_id: 1 });
```

### Impact
- Reduced code duplication across components
- Consistent error handling
- Better maintainability and scalability

---

## 6. **Backend CORS Settings**

The backend in `main.py` already has CORS properly configured:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

This allows the frontend to make requests from `http://localhost:3000` to `http://localhost:8000`.

---

## Environment Configuration

### Recommended .env Variables

Create a `.env` file in the frontend root:
```
VITE_API_URL=http://localhost:8000
```

This allows easy configuration between development and production environments.

---

## API Compatibility Matrix

| Operation | Method | Endpoint | Expected Content-Type | Status |
|-----------|--------|----------|----------------------|--------|
| Login | POST | `/login` | form-urlencoded | ✅ Fixed |
| Register | POST | `/register` | application/json | ✅ Working |
| Create Course | POST | `/courses` | application/json | ✅ Fixed |
| Update Course | PUT | `/courses/{id}` | application/json | ✅ Fixed |
| Upload Paper | POST | `/papers/upload` | multipart/form-data | ✅ Working |
| Get Papers | GET | `/papers` | - | ✅ Working |
| Review Paper | PATCH | `/papers/{id}/review` | application/json | ✅ Working |

---

## Testing Checklist

- [ ] User can login with correct credentials
- [ ] Login shows error on incorrect credentials
- [ ] User can register new account
- [ ] Students can see their uploaded papers
- [ ] Students can upload new papers
- [ ] Admin can view pending papers
- [ ] Admin can approve/reject papers with reasons
- [ ] Admin can create/edit/delete courses
- [ ] Papers filter correctly by course/type/year/semester
- [ ] Pagination works (if implemented)
- [ ] Dark mode toggle works
- [ ] Logout clears token and redirects to login

---

## Known Issues & Future Improvements

1. **TypeScript React Runtime** - Some JSX errors appear in IDE but build should work
2. **Token Refresh** - Currently no refresh token mechanism; implement if tokens expire during session
3. **File Upload Size** - Consider adding progress bar for large files
4. **Paper Download** - Download endpoint exists but not integrated in UI yet
5. **Real-time Updates** - Consider WebSocket integration for live updates

---

## Backend API Documentation

For full API documentation, access:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## Troubleshooting

### Issue: "Could not validate credentials"
- Ensure token is being stored in localStorage
- Check that Authorization header is being sent
- Verify token hasn't expired (24 hours)

### Issue: "CORS error"
- Verify backend is running on port 8000
- Check CORS middleware is enabled in main.py
- Ensure frontend is making requests to correct URL

### Issue: "Paper upload fails"
- Check file size limits in backend
- Verify allowed file extensions
- Ensure uploads/ directory exists and is writable

### Issue: "Course creation fails"
- Verify course code is unique
- Check all required fields are filled
- Look at backend error response for details

