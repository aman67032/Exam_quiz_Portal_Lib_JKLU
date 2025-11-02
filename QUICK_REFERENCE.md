# Frontend-Backend Integration Quick Reference

## Starting the Development Environment

### 1. Start the Backend
```bash
cd /home/sury/proj/CouncilProjects/examsystem
python -m venv exams
source exams/bin/activate
pip install -r requirements.txt
python setup.py  # Initialize database
uvicorn main:app --reload
```

Backend will run on: `http://localhost:8000`

### 2. Start the Frontend
```bash
cd /home/sury/proj/CouncilProjects/examsystem/frontend
npm install
npm run dev
```

Frontend will run on: `http://localhost:5173`

---

## Key API Endpoints

### Authentication
- `POST /login` - Login with email/password (form-urlencoded)
- `POST /register` - Register new user (JSON)
- `GET /me` - Get current user info

### Courses
- `GET /courses` - Get all courses
- `POST /courses` - Create course (admin)
- `PUT /courses/{id}` - Update course (admin)
- `DELETE /courses/{id}` - Delete course (admin)

### Papers
- `POST /papers/upload` - Upload paper (multipart/form-data)
- `GET /papers` - Get papers with filters
- `GET /papers/pending` - Get pending papers (admin)
- `PATCH /papers/{id}/review` - Approve/reject paper (admin)
- `DELETE /papers/{id}` - Delete paper (admin)

### Admin Dashboard
- `GET /admin/dashboard` - Get statistics

---

## Important Data Formats

### Login Request (Form-Encoded)
```
username=user@example.com
password=password123
```

### Course Creation (JSON)
```json
{
  "code": "CS1108",
  "name": "Python Programming",
  "description": "Introduction to Python"
}
```

### Paper Upload (FormData)
```
file: <File>
course_id: 1
title: "Midterm Exam"
paper_type: "midterm"
year: 2024
semester: "Fall 2024"
description: "Optional description"
```

### Paper Review (JSON)
```json
{
  "status": "approved",
  "rejection_reason": null
}
```

---

## Common Component Usage

### Using the Auth Context
```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, login, logout, loading } = useAuth();
  
  if (loading) return <p>Loading...</p>;
  if (!user) return <p>Please login</p>;
  
  return <p>Welcome {user.name}</p>;
}
```

### Using the API Utility
```tsx
import { API } from '@/utils/api';

async function fetchCourses() {
  try {
    const response = await API.getCourses();
    console.log(response.data);
  } catch (error: any) {
    console.error(error.message);
  }
}
```

### Direct Axios Usage
```tsx
import axios from 'axios';

const token = localStorage.getItem('token');
const response = await axios.get(
  'http://localhost:8000/papers',
  { headers: { Authorization: `Bearer ${token}` } }
);
```

---

## Database Schema

### Users Table
- id (primary key)
- email (unique)
- name
- password_hash
- is_admin (boolean)
- created_at

### Courses Table
- id (primary key)
- code (unique)
- name
- description
- created_at
- updated_at

### Papers Table
- id (primary key)
- course_id (foreign key)
- uploaded_by (user id)
- title
- paper_type (enum: quiz, midterm, endterm, assignment, project)
- status (enum: pending, approved, rejected)
- file_path
- file_name
- file_size
- year
- semester
- rejection_reason
- uploaded_at
- reviewed_at
- reviewed_by

---

## Debugging Tips

### Check Network Requests
1. Open DevTools → Network tab
2. Look for failed requests
3. Check request headers and response body
4. Verify Authorization header is present

### Check Browser Console
1. Open DevTools → Console tab
2. Look for CORS errors
3. Check for JavaScript errors
4. Verify token is in localStorage

### Backend Logs
```bash
# Check terminal where uvicorn is running for request logs
# Enable debug logging by modifying main.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Database Inspection
```bash
# Connect to PostgreSQL
psql -U paper_portal_user -d paper_portal -h localhost

# List tables
\dt

# Query users
SELECT * FROM users;

# Query papers
SELECT * FROM papers;
```

---

## Error Messages

### Backend Error Codes
- 400 - Bad Request (validation error)
- 401 - Unauthorized (invalid token or credentials)
- 403 - Forbidden (insufficient permissions)
- 404 - Not Found (resource doesn't exist)
- 500 - Internal Server Error

### Common Frontend Errors
- "Could not validate credentials" - Token expired or invalid
- "Email already registered" - Email exists in database
- "Course code already exists" - Duplicate course code
- "Invalid file type" - File extension not allowed
- "File not found" - Paper has been deleted

---

## Performance Tips

1. **Lazy Load Routes** - Use React Router lazy loading for code splitting
2. **Debounce Filters** - Add debounce to filter inputs to reduce API calls
3. **Cache Data** - Implement React Query or SWR for data caching
4. **Pagination** - Implement pagination for large paper lists
5. **Image Optimization** - Compress uploaded images

---

## Security Reminders

1. **Never store sensitive data in localStorage** - Use httpOnly cookies if possible
2. **Validate input on frontend** - Also validate on backend
3. **Use HTTPS in production** - Enable SSL/TLS
4. **Rotate secrets** - Change SECRET_KEY in production
5. **Rate limiting** - Consider adding rate limiting middleware
6. **CORS** - Restrict to specific origins in production

---

## File Structure

```
frontend/
├── src/
│   ├── components/        # React components
│   │   ├── AdminDashboard.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── StudentDashboard.tsx
│   │   └── ThemeToggle.tsx
│   ├── contexts/          # React contexts
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── utils/             # Utility functions
│   │   └── api.ts         # API configuration
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── tailwind.config.js     # Tailwind configuration
├── tsconfig.json          # TypeScript configuration
└── vite.config.ts         # Vite configuration
```

---

## Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run lint            # Run ESLint
npm run preview         # Preview production build

# Backend
python setup.py         # Initialize database
uvicorn main:app --reload  # Start server
python -m pytest        # Run tests (if added)

# Database
createdb paper_portal   # Create database
dropdb paper_portal     # Drop database
psql -d paper_portal    # Connect to database
```

---

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Axios Documentation](https://axios-http.com/)

