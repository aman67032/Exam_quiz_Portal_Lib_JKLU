# Learn JKLU — Student Exam Portal & Coding Hour (Frontend)

Modern **Next.js 15** frontend for **Learn JKLU** (JK Lakshmipat University Past Question Paper Archive & Coding Hour Portal), styled in a **Warm Editorial Minimalist** aesthetic with **Light Mode by default**, smooth `anime.js` transitions, and instant PDF preview/streaming.

## Tech Stack

- **Framework:** Next.js 15 (App Router) + React 18 + TypeScript
- **Styling:** Tailwind CSS (Light default `#FAF9F6` / Dark `#0A0A0C`)
- **Animations:** `anime.js` & Framer Motion
- **Icons:** Lucide React
- **Backend API:** Express.js + PostgreSQL 16 (`http://localhost:8000`)

## Development Server

```bash
cd Exam_quiz_Portal_Lib_JKLU
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Directory Structure

```text
Exam_quiz_Portal_Lib_JKLU/
├── public/                        # Static public assets served at '/'
│   ├── black_jklu_logo.png        # JKLU official logo for Light theme
│   ├── white_jklu_logo.png        # JKLU official logo for Dark theme
│   ├── manifest.json
│   ├── robots.txt
│   └── sitemap.xml
├── src/
│   ├── app/                       # Next.js 15 App Router entrypoints
│   │   ├── [[...slug]]/
│   │   │   └── page.tsx
│   │   ├── ClientRouterApp.tsx
│   │   └── layout.tsx
│   ├── views/                     # Full-page route views grouped by domain
│   │   ├── public/
│   │   │   ├── LandingPage.tsx    # '/' Landing page
│   │   │   └── PublicHome.tsx     # '/home' Question Paper Archive
│   │   ├── auth/
│   │   │   ├── Login.tsx          # '/login' Student login
│   │   │   ├── Register.tsx       # '/register' Student registration
│   │   │   ├── ForgotPassword.tsx # '/forgot-password' Password recovery
│   │   │   └── AdminLogin.tsx     # '/admin-login' Faculty/Admin login
│   │   ├── student/
│   │   │   ├── StudentDashboard.tsx # '/dashboard' Paper upload & status
│   │   │   └── Profile.tsx        # '/profile' Student profile & settings
│   │   ├── coding-hour/
│   │   │   ├── CodingHourPage.tsx # '/coding-hour/:courseId' Weekly contests
│   │   │   └── ChallengePage.tsx  # '/coding-hour/:courseId/challenge/:id'
│   │   └── admin/
│   │       ├── AdminDashboard.tsx # '/admin' Paper & user moderation
│   │       └── CodingHourAdmin.tsx# '/admin/contests' Coding Hour management
│   ├── components/                # Reusable UI, layout, and domain components
│   │   ├── layout/
│   │   │   ├── Footer.tsx
│   │   │   ├── JKLULogo.tsx
│   │   │   └── ThemeSwitcher.tsx
│   │   ├── papers/
│   │   │   ├── PaperCard.tsx
│   │   │   └── FilePreviewModal.tsx
│   │   ├── guards/
│   │   │   └── AdminRoute.tsx
│   │   └── ui/
│   │       ├── ErrorBoundary.tsx
│   │       ├── Loader.tsx
│   │       ├── MaintenanceMode.tsx
│   │       └── Toast.tsx
│   ├── contexts/                  # Global React Context providers
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── hooks/                     # Custom React hooks
│   │   └── useDebounce.ts
│   ├── utils/                     # API client & helper services
│   │   ├── api.ts
│   │   ├── keepAlive.ts
│   │   └── uploads.ts
│   ├── assets/                    # Bundled images & generated artwork
│   │   ├── generated/
│   │   │   ├── editorial_hero.jpg
│   │   │   └── coding_hour_editorial.jpg
│   │   └── portal-logo.png
│   ├── styles/                    # Global CSS & Tailwind directives
│   │   └── globals.css
│   └── App.tsx                    # Central client router
├── next.config.mjs
├── tailwind.config.js
├── postcss.config.js
└── tsconfig.json
```
