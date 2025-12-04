# Paper Portal System - Complete Architecture Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Backend Logic (FastAPI)](#backend-logic-fastapi)
4. [Frontend Logic (React/TypeScript)](#frontend-logic-reacttypescript)
5. [Integration Logic](#integration-logic)
6. [Database Schema](#database-schema)
7. [Authentication & Authorization](#authentication--authorization)
8. [File Storage System](#file-storage-system)
9. [API Endpoints Reference](#api-endpoints-reference)
10. [Key Features & Workflows](#key-features--workflows)

---

## System Overview

**Paper Portal** is a full-stack academic paper management system that allows students to upload, share, and access exam papers, assignments, and course materials. The system includes role-based access control with separate interfaces for students and administrators.

### Technology Stack

**Backend:**
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL (Neon DB with SSL/TLS)
- **ORM**: SQLAlchemy
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt (via passlib)
- **Email Service**: Resend API / SMTP (Gmail, SendGrid, etc.)

**Frontend:**
- **Framework**: React 18 with TypeScript
- **Routing**: React Router v6
- **State Management**: React Context API
- **HTTP Client**: Axios
- **UI/Animations**: Tailwind CSS, Framer Motion
- **Build Tool**: Vite

**Deployment:**
- **Backend**: Vercel (or compatible cloud platform)
- **Frontend**: Vercel (or compatible static hosting)
- **Database**: Neon.tech (PostgreSQL)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Landing    │  │   Student    │  │    Admin     │      │
│  │    Page      │  │  Dashboard   │  │  Dashboard   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         AuthContext (JWT Token Management)           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         API Client (Axios with Interceptors)          │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────┬─────────────────────────────────────┘
                       │ HTTPS/REST API
                       │ (JWT Bearer Token)
┌──────────────────────▼─────────────────────────────────────┐
│                    Backend (FastAPI)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Authentication Layer                     │  │
│  │  - JWT Token Generation & Validation                  │  │
│  │  - Password Hashing (bcrypt)                         │  │
│  │  - Role-Based Access Control (Admin/Student)         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Business Logic Layer                      │  │
│  │  - User Management                                     │  │
│  │  - Paper Upload/Review                                │  │
│  │  - Course Management                                  │  │
│  │  - File Storage (Database)                             │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Data Access Layer (SQLAlchemy)           │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────┬─────────────────────────────────────┘
                       │ SQL (SSL/TLS)
┌──────────────────────▼─────────────────────────────────────┐
│              Database (Neon PostgreSQL)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    users     │  │   papers     │  │   courses    │      │
│  │              │  │              │  │              │      │
│  │ - File Data  │  │ - File Data  │  │ - Metadata   │      │
│  │   (BYTEA)    │  │   (BYTEA)    │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## Backend Logic (FastAPI)

### Core Architecture

The backend is built using FastAPI with a modular structure:

#### 1. **Application Initialization** (`main.py`)

```python
# Key Components:
- Database Engine Setup (Neon DB with SSL)
- SQLAlchemy Session Management
- CORS Middleware Configuration
- OAuth2 Password Bearer Scheme
- Password Hashing Context
- Email Service Configuration (Resend/SMTP)
```

**Database Connection:**
- Detects Neon DB URLs and enables SSL/TLS
- Falls back to SQLite for local development
- Connection pooling with auto-reconnect
- Automatic column backfill for schema migrations

**Email Configuration:**
- Primary: Resend API (recommended)
- Fallback: SMTP (Gmail, SendGrid, etc.)
- Console output for development/testing

#### 2. **Database Models** (SQLAlchemy ORM)

**User Model:**
```python
- id (Primary Key)
- email (Unique, Indexed)
- name, password_hash
- is_admin (Boolean)
- Profile fields: age, year, university, department, roll_no, student_id
- File storage: photo_data, id_card_data (BYTEA/LargeBinary)
- Verification: id_verified, verified_by, verified_at
- admin_feedback (JSON) - For rejection messages
- created_at (Timestamp)
```

**Paper Model:**
```python
- id (Primary Key)
- course_id (Foreign Key → courses)
- uploaded_by (Foreign Key → users)
- title, description
- paper_type (Enum: quiz, midterm, endterm, assignment, project, other)
- year, semester
- file_name, file_size
- file_data (BYTEA/LargeBinary) - Actual file content
- file_path (String) - Reference path for backward compatibility
- status (Enum: pending, approved, rejected)
- reviewed_by, reviewed_at
- rejection_reason (Text) - Legacy field
- admin_feedback (JSON) - Structured feedback
- uploaded_at, updated_at (Timestamps)
- Composite Indexes: (status, uploaded_at), (course_id, status), (paper_type, year)
```

**Course Model:**
```python
- id (Primary Key)
- code (Unique, Indexed)
- name, description
- created_at, updated_at
- Relationship: papers (One-to-Many)
```

#### 3. **Authentication System**

**JWT Token Flow:**
1. User logs in with email/password
2. Backend validates credentials
3. Generates JWT token with user email as subject
4. Token expires in 24 hours (configurable)
5. Frontend stores token in localStorage
6. Subsequent requests include token in `Authorization: Bearer <token>` header

**Password Security:**
- Passwords hashed using bcrypt
- Minimum 6 characters required
- Email domain restriction: `@jklu.edu.in` only

**Role-Based Access:**
- **Students**: Can upload papers, view own papers, access approved papers
- **Admins**: Full access including paper review, user verification, course management

#### 4. **File Storage System**

**Storage Strategy:**
- **Primary**: Database storage (BYTEA columns)
  - `users.photo_data` - Profile photos
  - `users.id_card_data` - ID card images/PDFs
  - `papers.file_data` - Paper documents
- **Fallback**: Filesystem (for backward compatibility with old files)

**Upload Flow:**
1. File received via multipart/form-data
2. File content read into memory
3. Binary data stored in database BYTEA column
4. Reference path stored in `file_path`/`photo_path`/`id_card_path`
5. File size and metadata stored

**Serving Files:**
- Endpoint: `/uploads/{filename}`
- Checks database first (BYTEA columns)
- Falls back to filesystem if not found in DB
- Returns appropriate MIME type
- Security: Validates file is within uploads directory

#### 5. **API Endpoints Structure**

**Authentication Endpoints:**
- `POST /register` - Student registration
- `POST /login` - Student login
- `POST /admin-login` - Admin login (OAuth2 form)
- `GET /me` - Get current user info
- `POST /forgot-password` - Request password reset OTP
- `POST /reset-password` - Reset password with OTP

**User Profile Endpoints:**
- `PUT /profile` - Update profile fields
- `POST /profile/id-card` - Upload ID card

**Course Endpoints:**
- `GET /courses` - List all courses
- `POST /courses` - Create course (Admin only)
- `PUT /courses/{id}` - Update course (Admin only)
- `DELETE /courses/{id}` - Delete course (Admin only)
- `POST /courses/check-or-create` - Check if course exists
- `POST /courses/admin/create-with-paper` - Create course during paper upload

**Paper Endpoints:**
- `POST /papers/upload` - Upload paper (Student, requires login)
- `GET /papers` - Get papers (filtered, role-based, requires login)
  - **Logged-in students:** All approved papers + their own papers (any status)
  - **Admins:** All papers (any status, can filter by status)
- `GET /papers/public/all` - Get all approved papers (public, no authentication required)
- `GET /papers/pending` - Get pending papers (Admin only)
- `GET /papers/{id}` - Get specific paper (requires login)
- `GET /papers/{id}/download` - Download paper file
  - **Public:** Only approved papers
  - **Logged-in users:** Approved papers + their own papers
  - **Admins:** All papers
- `GET /papers/{id}/preview` - Get paper preview metadata
  - **Public:** Only approved papers
  - **Logged-in users:** Approved papers + their own papers
  - **Admins:** All papers
- `PATCH /papers/{id}/review` - Review paper (Admin only)
- `PUT /papers/{id}/edit` - Edit paper details (Admin only)
- `DELETE /papers/{id}` - Delete paper (Admin only)

**Admin Endpoints:**
- `GET /admin/dashboard` - Get dashboard statistics
- `GET /admin/verification-requests` - Get pending ID verifications
- `POST /admin/verify-user/{id}` - Approve/reject user verification
- `GET /admin/diagnose/files` - File storage diagnostics

**Health & Utility:**
- `GET /health` - Health check with DB status
- `GET /wake` - Wake-up endpoint for cold starts
- `GET /health/email` - Email service status

#### 6. **Error Handling & Validation**

- **Pydantic Models**: Request/response validation
- **HTTP Exceptions**: Proper status codes (400, 401, 403, 404, 500)
- **Database Errors**: Graceful handling with user-friendly messages
- **File Validation**: Type checking, size limits
- **Email Validation**: Domain restriction, format validation

#### 7. **Background Tasks**

- **Keep-Alive Task**: Prevents auto-shutdown on free tier platforms
  - Runs every 5 minutes
  - Maintains active event loop
  - Logs heartbeat messages

- **Password Reset Cleanup**: Removes expired OTPs from memory storage

---

## Frontend Logic (React/TypeScript)

### Core Architecture

The frontend is a Single Page Application (SPA) built with React 18 and TypeScript.

#### 1. **Application Structure**

```
src/
├── App.tsx                 # Main app component with routing
├── main.tsx                # Entry point
├── contexts/
│   ├── AuthContext.tsx     # Authentication state management
│   └── ThemeContext.tsx    # Dark/light theme management
├── components/
│   ├── LandingPage.tsx     # Public landing page
│   ├── Login.tsx           # Student login
│   ├── AdminLogin.tsx      # Admin login
│   ├── Register.tsx        # Student registration
│   ├── ForgotPassword.tsx   # Password reset
│   ├── StudentDashboard.tsx # Student paper upload interface
│   ├── PublicHome.tsx      # Student paper browsing
│   ├── Profile.tsx         # User profile management
│   ├── AdminDashboard.tsx  # Admin interface
│   ├── PaperCard.tsx       # Reusable paper card component
│   ├── FilePreviewModal.tsx # File preview modal
│   └── ... (other UI components)
├── utils/
│   ├── api.ts              # API client (Axios)
│   ├── uploads.ts          # File URL builder
│   └── keepAlive.ts        # Backend keep-alive service
└── hooks/
    └── useDebounce.ts      # Search debouncing hook
```

#### 2. **State Management**

**AuthContext:**
- Manages user authentication state
- Stores JWT token in localStorage
- Provides `login()`, `register()`, `logout()` methods
- Auto-fetches user info on app load
- Handles token validation and refresh

**ThemeContext:**
- Manages dark/light theme preference
- Persists theme choice in localStorage
- Provides theme toggle functionality

#### 3. **Routing Logic** (React Router v6)

**Public Routes (No Authentication Required):**
- `/` - Landing page (always accessible, shows "Get Started" button)
- `/home` - Public home page (browse papers, accessible to everyone)
- `/login` - Student login (redirects to `/home` if already logged in)
- `/register` - Student registration (redirects to `/home` if already logged in)
- `/admin-login` - Admin login (redirects to `/admin` if admin, `/home` if student)
- `/forgot-password` - Password reset (redirects to `/home` if already logged in)

**Protected Student Routes (Requires Login):**
- `/dashboard` - Upload papers (redirects to `/login` if not logged in)
- `/profile` - Manage profile & ID card (redirects to `/login` if not logged in)

**Protected Admin Routes (Requires Admin Login):**
- `/admin` - Admin dashboard (redirects to `/admin-login` if not admin)

**Route Guards:**
- Landing page and public home are always accessible
- Dashboard and profile require authentication (redirect to `/login` if not logged in)
- Auth pages redirect to appropriate dashboard if already logged in
- Role-based redirects (admin vs student)

#### 4. **API Client** (`utils/api.ts`)

**Axios Configuration:**
- Base URL from environment variables
- Request interceptor: Adds JWT token to headers
- Response interceptor: Handles errors, backend wake-up

**API Methods:**
- Auth: `login()`, `register()`, `adminLogin()`, `getCurrentUser()`
- Password: `forgotPassword()`, `resetPassword()`
- Profile: `updateProfile()`, `uploadIdCard()`
- Courses: `getCourses()`, `createCourse()`, `updateCourse()`, `deleteCourse()`
- Papers: `uploadPaper()`, `getPapers()`, `getPublicPapers()`, `downloadPaper()`, `previewPaper()`, `reviewPaper()`
- Admin: `getDashboardStats()`, `getVerificationRequests()`, `verifyUser()`

**Error Handling:**
- Network errors trigger backend wake-up attempt
- User-friendly error messages
- Automatic retry for connection failures

#### 5. **File Upload Logic**

**Student Dashboard Upload:**
1. User selects file (PDF, DOCX, images)
2. Fills form: course, title, description, type, year, semester
3. Validates ID verification status
4. Creates FormData with file and metadata
5. Sends POST to `/papers/upload`
6. Shows success/error toast
7. Refreshes paper list

**File Preview:**
- Modal component for viewing files
- Supports PDF, images (JPG, PNG)
- Uses `/papers/{id}/preview` endpoint
- Handles file download

#### 6. **Search & Filtering**

**PublicHome Component:**
- Real-time search with debouncing (300ms)
- Search fields: title, description, course, uploader
- Filters: course code, paper type, year
- Client-side filtering for performance

**Student Dashboard:**
- Filter own papers by course, type, year, semester
- Status filter (pending, approved, rejected)

#### 7. **UI Components**

**PaperCard:**
- Displays paper metadata
- Preview button (opens modal)
- Download button
- Status badges (pending/approved/rejected)
- Admin feedback display

**FilePreviewModal:**
- Embedded PDF viewer
- Image preview
- Download option
- Responsive design

**Toast Notifications:**
- Success/error/info messages
- Auto-dismiss after 3 seconds
- Non-blocking UI

**Loader:**
- Full-screen loading state
- Backend wake-up message
- Smooth animations

#### 8. **Keep-Alive Service**

**Purpose:** Prevents backend from sleeping on free tier platforms

**Implementation:**
- Sends periodic requests to `/wake` endpoint
- Runs every 4 minutes
- Handles connection errors gracefully
- Stops on component unmount

#### 9. **File URL Building**

**`buildUploadUrl()` Function:**
- Constructs full URL for file access
- Handles relative/absolute paths
- URL-encodes special characters
- Removes redundant `uploads/` prefixes
- Returns empty string for null/undefined paths

---

## Integration Logic

### Frontend-Backend Communication Flow

#### 1. **Authentication Flow**

```
┌──────────┐                    ┌──────────┐                    ┌──────────┐
│ Frontend │                    │ Backend  │                    │ Database │
└────┬─────┘                    └────┬─────┘                    └────┬─────┘
     │                                │                                │
     │ POST /login                    │                                │
     │ {email, password}              │                                │
     ├───────────────────────────────>│                                │
     │                                │ Query user by email            │
     │                                ├───────────────────────────────>│
     │                                │<───────────────────────────────┤
     │                                │ Verify password (bcrypt)       │
     │                                │ Generate JWT token             │
     │                                │                                │
     │ {access_token, token_type}     │                                │
     │<───────────────────────────────┤                                │
     │                                │                                │
     │ Store token in localStorage    │                                │
     │ GET /me (with Bearer token)    │                                │
     │ Authorization: Bearer <token>  │                                │
     ├───────────────────────────────>│                                │
     │                                │ Validate JWT token             │
     │                                │ Query user by email            │
     │                                ├───────────────────────────────>│
     │                                │<───────────────────────────────┤
     │ {user object}                  │                                │
     │<───────────────────────────────┤                                │
     │                                │                                │
     │ Update AuthContext state       │                                │
     │ Redirect to dashboard          │                                │
```

#### 2. **Paper Upload Flow**

```
┌──────────┐                    ┌──────────┐                    ┌──────────┐
│ Frontend │                    │ Backend  │                    │ Database │
└────┬─────┘                    └────┬─────┘                    └────┬─────┘
     │                                │                                │
     │ User fills upload form         │                                │
     │ Selects file                   │                                │
     │                                │                                │
     │ POST /papers/upload             │                                │
     │ FormData:                      │                                │
     │ - file (binary)                │                                │
     │ - course_id/course_code        │                                │
     │ - title, description            │                                │
     │ - paper_type, year, semester   │                                │
     │ Authorization: Bearer <token>  │                                │
     ├───────────────────────────────>│                                │
     │                                │ Validate JWT & user            │
     │                                │ Check course exists            │
     │                                ├───────────────────────────────>│
     │                                │<───────────────────────────────┤
     │                                │ Create course if needed        │
     │                                │ Read file into memory          │
     │                                │ Create Paper record            │
     │                                │ Store file_data (BYTEA)        │
     │                                ├───────────────────────────────>│
     │                                │<───────────────────────────────┤
     │ {message, paper_id}            │                                │
     │<───────────────────────────────┤                                │
     │                                │                                │
     │ Show success toast             │                                │
     │ Refresh paper list             │                                │
```

#### 3. **File Access Flow**

```
┌──────────┐                    ┌──────────┐                    ┌──────────┐
│ Frontend │                    │ Backend  │                    │ Database │
└────┬─────┘                    └────┬─────┘                    └────┬─────┘
     │                                │                                │
     │ User clicks preview/download   │                                │
     │                                │                                │
     │ GET /papers/{id}/preview       │                                │
     │ Authorization: Bearer <token>  │                                │
     ├───────────────────────────────>│                                │
     │                                │ Validate JWT & permissions     │
     │                                │ Query paper by ID              │
     │                                ├───────────────────────────────>│
     │                                │<───────────────────────────────┤
     │                                │ Check file_data exists         │
     │                                │                                │
     │ {file_name, mime_type, ...}    │                                │
     │<───────────────────────────────┤                                │
     │                                │                                │
     │ GET /papers/{id}/download      │                                │
     │ Authorization: Bearer <token>  │                                │
     ├───────────────────────────────>│                                │
     │                                │ Validate permissions           │
     │                                │ Query paper                    │
     │                                ├───────────────────────────────>│
     │                                │<───────────────────────────────┤
     │                                │ Retrieve file_data (BYTEA)     │
     │                                │                                │
     │ Binary file data               │                                │
     │<───────────────────────────────┤                                │
     │                                │                                │
     │ Create blob URL                │                                │
     │ Open in preview modal          │                                │
     │ or trigger download            │                                │
```

#### 4. **Admin Review Flow**

```
┌──────────┐                    ┌──────────┐                    ┌──────────┐
│ Frontend │                    │ Backend  │                    │ Database │
└────┬─────┘                    └────┬─────┘                    └────┬─────┘
     │                                │                                │
     │ Admin views pending papers     │                                │
     │                                │                                │
     │ GET /papers/pending            │                                │
     │ Authorization: Bearer <token>  │                                │
     ├───────────────────────────────>│                                │
     │                                │ Validate admin role            │
     │                                │ Query pending papers           │
     │                                ├───────────────────────────────>│
     │                                │<───────────────────────────────┤
     │ [Paper objects]               │                                │
     │<───────────────────────────────┤                                │
     │                                │                                │
     │ Admin reviews & approves/      │                                │
     │ rejects with feedback          │                                │
     │                                │                                │
     │ PATCH /papers/{id}/review      │                                │
     │ {status, admin_feedback}       │                                │
     │ Authorization: Bearer <token>  │                                │
     ├───────────────────────────────>│                                │
     │                                │ Validate admin role            │
     │                                │ Update paper status            │
     │                                │ Store admin_feedback (JSON)    │
     │                                │ Set reviewed_by, reviewed_at   │
     │                                ├───────────────────────────────>│
     │                                │<───────────────────────────────┤
     │ {message}                     │                                │
     │<───────────────────────────────┤                                │
     │                                │                                │
     │ Show success toast             │                                │
     │ Refresh pending papers list    │                                │
```

### Data Flow Patterns

#### 1. **State Synchronization**
- Frontend maintains local state for UI responsiveness
- Backend is source of truth for data
- Periodic refresh or manual refresh after mutations
- Optimistic updates where appropriate

#### 2. **Error Handling**
- Network errors: Attempt backend wake-up, show user-friendly message
- Authentication errors: Clear token, redirect to login
- Validation errors: Display field-specific messages
- Server errors: Show generic error, log details

#### 3. **Performance Optimizations**
- **Lazy Loading**: Heavy components loaded on demand
- **Debouncing**: Search queries debounced (300ms)
- **Eager Loading**: Backend uses SQLAlchemy `joinedload()` to prevent N+1 queries
- **Database Indexes**: Composite indexes on common query patterns
- **Connection Pooling**: Database connection reuse

#### 4. **Security Measures**
- **JWT Tokens**: Stateless authentication
- **HTTPS**: All communication encrypted
- **CORS**: Configured for specific origins
- **Input Validation**: Both frontend and backend validation
- **File Type Validation**: Whitelist of allowed file types
- **Path Traversal Protection**: File access restricted to uploads directory
- **Role-Based Access**: Admin endpoints protected

---

## Database Schema

### Tables

#### `users`
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    name VARCHAR NOT NULL,
    password_hash VARCHAR NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    age INTEGER,
    year VARCHAR(20),
    university VARCHAR(255),
    department VARCHAR(255),
    roll_no VARCHAR(100),
    student_id VARCHAR(100),
    photo_path VARCHAR(500),
    id_card_path VARCHAR(500),
    photo_data BYTEA,
    id_card_data BYTEA,
    id_verified BOOLEAN DEFAULT FALSE,
    verified_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMP,
    email_verified BOOLEAN DEFAULT FALSE,
    admin_feedback JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

#### `courses`
```sql
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_courses_code ON courses(code);
```

#### `papers`
```sql
CREATE TABLE papers (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    paper_type VARCHAR NOT NULL, -- Enum: quiz, midterm, endterm, assignment, project, other
    year INTEGER,
    semester VARCHAR(20),
    file_path VARCHAR(500),
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER,
    file_data BYTEA,
    status VARCHAR NOT NULL DEFAULT 'pending', -- Enum: pending, approved, rejected
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    rejection_reason TEXT,
    admin_feedback JSONB,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_papers_course_id ON papers(course_id);
CREATE INDEX idx_papers_uploaded_by ON papers(uploaded_by);
CREATE INDEX idx_papers_status ON papers(status);
CREATE INDEX idx_papers_paper_type ON papers(paper_type);
CREATE INDEX idx_papers_year ON papers(year);
CREATE INDEX idx_paper_status_uploaded ON papers(status, uploaded_at);
CREATE INDEX idx_paper_course_status ON papers(course_id, status);
CREATE INDEX idx_paper_type_year ON papers(paper_type, year);
```

### Relationships

- **users** → **papers** (One-to-Many): A user can upload multiple papers
- **courses** → **papers** (One-to-Many): A course can have multiple papers
- **users** → **users** (Self-referential): Admin verifies users (`verified_by`)

---

## Authentication & Authorization

### JWT Token Structure

```json
{
  "sub": "user@jklu.edu.in",
  "exp": 1234567890
}
```

- **sub**: User email (subject)
- **exp**: Expiration timestamp (24 hours from issue)

### Authentication Flow

1. **Registration/Login:**
   - User provides email and password
   - Backend validates credentials
   - Generates JWT token
   - Returns token to frontend
   - Frontend stores in localStorage

2. **Authenticated Requests:**
   - Frontend includes token in `Authorization` header
   - Backend validates token signature and expiration
   - Extracts user email from token
   - Queries database for user
   - Attaches user object to request context

3. **Role-Based Access:**
   - `is_admin` flag checked for admin endpoints
   - Students can only access their own papers
   - Admins can access all papers

### Password Reset Flow

1. User requests password reset
2. Backend generates 6-digit OTP
3. OTP stored in memory with 10-minute expiration
4. OTP sent via email (Resend/SMTP)
5. User submits OTP and new password
6. Backend validates OTP and updates password
7. OTP removed from storage

---

## File Storage System

### Storage Architecture

**Primary Storage: Database (BYTEA columns)**
- Files stored as binary data in PostgreSQL
- Persistent across deployments
- Included in database backups
- No filesystem dependencies

**Fallback: Filesystem**
- Legacy files from before migration
- Backend checks database first, then filesystem
- Maintains backward compatibility

### File Types Supported

**Papers:**
- PDF (`.pdf`)
- Images (`.jpg`, `.jpeg`, `.png`)
- Documents (`.doc`, `.docx`)

**User Files:**
- Profile Photos: `.jpg`, `.jpeg`, `.png`
- ID Cards: `.jpg`, `.jpeg`, `.png`, `.pdf`

### File Access URLs

**Pattern:** `/uploads/{filename}`

**Backend Logic:**
1. Extract filename from URL
2. Check database BYTEA columns first
3. If not found, check filesystem
4. Return file with appropriate MIME type
5. Security: Validate file is within uploads directory

**Frontend Usage:**
```typescript
const fileUrl = buildUploadUrl(paper.file_path);
// Returns: https://api.example.com/uploads/filename.pdf
```

---

## API Endpoints Reference

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | No | Register new student |
| POST | `/login` | No | Student login |
| POST | `/admin-login` | No | Admin login (OAuth2 form) |
| GET | `/me` | Yes | Get current user info |
| POST | `/forgot-password` | No | Request password reset OTP |
| POST | `/reset-password` | No | Reset password with OTP |

### User Profile

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| PUT | `/profile` | Yes | Update profile fields |
| POST | `/profile/id-card` | Yes | Upload ID card |

### Courses

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/courses` | Yes | Any | List all courses |
| POST | `/courses` | Yes | Admin | Create course |
| GET | `/courses/{id}` | Yes | Any | Get course details |
| PUT | `/courses/{id}` | Yes | Admin | Update course |
| DELETE | `/courses/{id}` | Yes | Admin | Delete course |
| POST | `/courses/check-or-create` | Yes | Any | Check if course exists |
| POST | `/courses/admin/create-with-paper` | Yes | Admin | Create course during upload |

### Papers

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/papers/upload` | Yes | Student | Upload paper |
| GET | `/papers` | Yes | Any | Get papers (filtered) |
| GET | `/papers/public/all` | No | Public | Get all approved papers |
| GET | `/papers/pending` | Yes | Admin | Get pending papers |
| GET | `/papers/{id}` | Yes | Any | Get paper details |
| GET | `/papers/{id}/download` | Optional | Any | Download paper file |
| GET | `/papers/{id}/preview` | Optional | Any | Get preview metadata |
| PATCH | `/papers/{id}/review` | Yes | Admin | Review paper (approve/reject) |
| PUT | `/papers/{id}/edit` | Yes | Admin | Edit paper details |
| DELETE | `/papers/{id}` | Yes | Admin | Delete paper |

### Admin

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/admin/dashboard` | Yes | Admin | Get dashboard stats |
| GET | `/admin/verification-requests` | Yes | Admin | Get pending verifications |
| POST | `/admin/verify-user/{id}` | Yes | Admin | Approve/reject user |
| GET | `/admin/diagnose/files` | Yes | Admin | File storage diagnostics |

### Health & Utility

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | Health check |
| GET | `/wake` | No | Wake-up endpoint |
| GET | `/health/email` | No | Email service status |
| GET | `/uploads/{filename}` | Optional | Serve uploaded files |

---

## Key Features & Workflows

### 1. Landing Page & Navigation

**Workflow:**
1. User visits landing page (`/`)
2. Sees "Get Started" button (always visible, no login required)
3. Clicks "Get Started" → Navigates to public home (`/home`)
4. Can browse papers without logging in
5. To upload papers or access profile, clicks "Login" in header
6. After login, redirected to `/home` (can now see all approved papers + own papers)

**Landing Page Features:**
- Always accessible (no redirects)
- Single "Get Started" button linking to `/home`
- No authentication required to view
- Information about system features

### 2. Student Registration & Login

**Workflow:**
1. User clicks "Login" from public home or landing page
2. Enters email (@jklu.edu.in) and password
3. Backend validates credentials
4. JWT token returned and stored
5. User redirected to `/home` (not dashboard)
6. Can now see all approved papers + their own papers

**Validation:**
- Email must end with `@jklu.edu.in`
- Password minimum 6 characters
- Email uniqueness check (for registration)

**Access After Login:**
- `/home` - Can see all approved papers + own papers
- `/dashboard` - Upload papers (requires login)
- `/profile` - Manage profile (requires login)

### 3. Paper Upload

**Workflow:**
1. Student navigates to dashboard
2. Checks ID verification status (required)
3. Selects file to upload
4. Fills form: course, title, description, type, year, semester
5. Submits upload
6. Backend validates file type and size
7. File stored in database
8. Paper status set to "pending"
9. Student sees success message

**Validation:**
- ID card must be verified
- File type must be allowed
- Course must exist (or auto-created)
- Required fields: title, course, file

### 4. Paper Review (Admin)

**Workflow:**
1. Admin logs in to dashboard
2. Views "Pending Papers" tab
3. Reviews paper details and file
4. Approves or rejects with feedback
5. Paper status updated
6. Student sees updated status in dashboard

**Feedback System:**
- Structured JSON feedback for rejections
- Includes message, timestamp, admin ID
- Displayed to student in dashboard

### 5. User Verification (Admin)

**Workflow:**
1. Student uploads ID card in profile
2. Admin views verification requests
3. Reviews ID card image
4. Approves or rejects with feedback
5. User verification status updated
6. Student can now upload papers (if approved)

### 6. Paper Browsing & Search (Public Home)

**Workflow:**
1. User navigates to "Home" page (public, no login required)
2. **If not logged in:** Views only approved papers
3. **If logged in:** Views all approved papers + their own papers (any status)
4. Uses search bar (debounced)
5. Applies filters (course, type, year)
6. Clicks paper to preview or download
7. File opens in modal or downloads

**Access Control:**
- **Public (Not Logged In):** Can view and download only approved papers
- **Logged In Users:** Can view and download all approved papers + their own papers (pending/rejected)
- **Admins:** Can view and download all papers (any status)

**Search Features:**
- Real-time search with debouncing
- Search across title, description, course, uploader
- Multiple filter combinations
- Client-side filtering for performance

**Frontend-Backend Integration:**
- **Not logged in:** Uses `GET /papers/public/all` (approved papers only)
- **Logged in:** Uses `GET /papers` (all approved + own papers)
- Preview/download endpoints check authentication and paper status

### 7. Course Management (Admin)

**Workflow:**
1. Admin navigates to "Courses" tab
2. Views list of all courses
3. Creates new course (code, name, description)
4. Edits existing course
5. Deletes course (cascades to papers)

**Auto-Creation:**
- Courses can be auto-created during paper upload
- Student provides course code and name
- Admin can later edit course details

### 8. Password Reset

**Workflow:**
1. User clicks "Forgot Password"
2. Enters email address
3. Backend generates 6-digit OTP
4. OTP sent via email (Resend/SMTP)
5. User enters OTP and new password
6. Backend validates OTP and updates password
7. User can login with new password

**Security:**
- OTP expires in 10 minutes
- OTP stored in memory (not database)
- One-time use OTP

### 9. File Preview & Download

**Workflow:**
1. User clicks "Preview" or "Download" on paper card
2. Frontend requests preview metadata (`GET /papers/{id}/preview`)
3. Backend checks access permissions:
   - **Public:** Only approved papers
   - **Logged-in users:** Approved papers + their own papers
   - **Admins:** All papers
4. Backend returns file info (name, type, size)
5. Frontend requests file download (`GET /papers/{id}/download`)
6. Backend validates permissions again
7. Creates blob URL from binary data
8. Opens file in modal (PDF viewer or image viewer) or triggers download

**Access Control:**
- **Public users:** Can only preview/download approved papers
- **Logged-in users:** Can preview/download approved papers + their own papers (any status)
- **Admins:** Can preview/download all papers (any status)

**Supported Formats:**
- PDF: Embedded viewer
- Images: Direct display
- Other: Download only

**Backend Logic:**
- Files stored in database (BYTEA columns)
- Checks paper status and user permissions
- Returns appropriate MIME type
- Handles both database and filesystem storage (backward compatibility)

---

## Environment Variables

### Backend (.env)

```bash
# Database
DATABASE_URL=postgresql://user:password@host/dbname

# Security
SECRET_KEY=your-secret-key-here

# Email (Resend - Recommended)
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Email (SMTP - Fallback)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com

# Optional: External Email Service
EMAIL_SERVICE_URL=http://localhost:4000

# Upload Directory (for backward compatibility)
UPLOAD_DIR=uploads
```

### Frontend (.env)

```bash
# Backend API URL
VITE_API_URL=https://web-production-6beea.up.railway.app
# or
VITE_BACKEND_URL=https://web-production-6beea.up.railway.app
```

---

## Deployment Notes

### Backend (Railway)

1. **Build Command:** (Not needed for Python)
2. **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. **Environment Variables:** Set all required env vars
4. **Health Check:** `/health` endpoint
5. **Keep-Alive:** Background task prevents auto-shutdown

### Frontend (Vercel)

1. **Build Command:** `npm run build`
2. **Output Directory:** `dist`
3. **Environment Variables:** Set `VITE_API_URL`
4. **Rewrites:** All routes to `index.html` (SPA)

### Database (Neon.tech)

1. **SSL/TLS:** Required and auto-configured
2. **Connection Pooling:** Enabled
3. **Backups:** Automatic daily backups
4. **Storage:** All files stored in BYTEA columns

---

## Security Considerations

1. **JWT Tokens:** Short expiration (24 hours)
2. **Password Hashing:** bcrypt with salt
3. **HTTPS:** All communication encrypted
4. **CORS:** Configured for specific origins
5. **Input Validation:** Both frontend and backend
6. **File Type Validation:** Whitelist approach
7. **Path Traversal Protection:** File access restricted
8. **Role-Based Access:** Admin endpoints protected
9. **Email Domain Restriction:** @jklu.edu.in only
10. **SQL Injection Prevention:** SQLAlchemy ORM parameterized queries

---

## Performance Optimizations

1. **Database Indexes:** Composite indexes on common queries
2. **Eager Loading:** SQLAlchemy `joinedload()` prevents N+1 queries
3. **Connection Pooling:** Reuse database connections
4. **Lazy Loading:** Heavy components loaded on demand
5. **Debouncing:** Search queries debounced (300ms)
6. **Client-Side Filtering:** Reduces API calls
7. **File Caching:** Browser caches file URLs
8. **Keep-Alive:** Prevents cold starts

---

## Troubleshooting

### Common Issues

1. **Backend Connection Errors:**
   - Check `VITE_API_URL` in frontend .env
   - Verify backend is running
   - Check CORS configuration

2. **File Not Found:**
   - Check if file exists in database (BYTEA column)
   - Verify file_path is correct
   - Check filesystem fallback for legacy files

3. **Authentication Errors:**
   - Verify JWT token is valid
   - Check token expiration
   - Ensure token is in Authorization header

4. **Email Not Sending:**
   - Check Resend API key or SMTP credentials
   - Verify email service status (`/health/email`)
   - Check console for email errors

5. **Database Connection Errors:**
   - Verify DATABASE_URL is correct
   - Check SSL/TLS settings for Neon DB
   - Verify database is accessible

---

## Future Enhancements

1. **File Compression:** Compress files before storage
2. **CDN Integration:** Serve files via CDN
3. **Redis Caching:** Cache frequently accessed data
4. **WebSocket Support:** Real-time notifications
5. **Advanced Search:** Full-text search with Elasticsearch
6. **Analytics Dashboard:** Usage statistics
7. **Bulk Operations:** Bulk upload/download
8. **Version Control:** Paper versioning
9. **Comments System:** Student comments on papers
10. **Rating System:** Paper ratings and reviews

---

## Conclusion

This documentation provides a comprehensive overview of the Paper Portal system architecture, covering both frontend and backend logic, their integration, and key workflows. The system is designed for scalability, security, and user experience, with a focus on academic paper management for educational institutions.

For questions or contributions, please refer to the project repository or contact the development team.

---

**Last Updated:** November 2025  
**Version:** 2.0.0

