# Learn JKLU — Past Question Paper Archive Portal

Official **JK Lakshmipat University (JKLU)** Past Question Paper Archive built by the **Council of Technical Affairs**.

- **Leadership**: Aman Pratap Singh (General Secretary) · Aditya Singh Nayal (Secretary)
- **Archive Coverage**: **654 verified question papers** across **306 courses** (2020–2026) from JKLU AURA / Examinations Cell

---

## Architecture

This repository is organized as a full-stack monorepo:

```text
exam portal/
├── Exam_quiz_Portal_Lib_JKLU/   # Next.js 15 + React 19 + Tailwind CSS + WebGPU (AeroShards) Frontend
├── backend/                     # Pure JavaScript (ESM) Express.js + Prisma ORM + Redis Cloud L2 Backend
├── .gitignore                   # Ignores pastpaper/, pastpaper_bin/, .env*, node_modules/, .next/, storage/
└── README.md
```

### 1. Frontend (`Exam_quiz_Portal_Lib_JKLU/`)
- **Framework**: Next.js 15 (App Router + SPA routing), React 19, TypeScript, Tailwind CSS.
- **3D WebGPU Background**: Custom [`AeroShards`](Exam_quiz_Portal_Lib_JKLU/src/components/layout/AeroShards.tsx) (`vgpu` + `@vgpu/wgsl/prepare`) interactive glass shard background on `/home`.
- **Smart Search & Pagination**: Server-side paginated catalog (`24` papers/page) with instant acronym expansion (`DSA`, `RL`, `DAA`, `OS`, `DBMS`, `LADE`, `FRM`, etc.), typo tolerance, and multi-faceted filters (Programme, Exam Type, Semester, Year, Course, Sort).
- **PDF Preview & Download**: Inline PDF preview modal and direct streaming downloads.

### 2. Backend (`backend/`)
- **Runtime**: Pure JavaScript (`.js`, Node ESM) Express.js server designed for high concurrency.
- **Database**: **Neon Serverless PostgreSQL** + **Prisma ORM** (`backend/prisma/schema.prisma`) storing compressed `.bin` PDF blobs (`BYTEA`) and normalized course/paper/audit metadata.
- **Caching**: Two-tier **Singleflight L1 in-memory cache** + **Redis Cloud L2 cache** (`30 MB`-safe mode).
- **Smart Academic Search Engine** (`backend/src/config/searchEngine.js`): Acronym dictionary + automatic course initialism generation + Damerau-Levenshtein / bigram typo tolerance.

---

## Local Setup

### Prerequisites
- Node.js `>= 20`
- PostgreSQL database URL (e.g. Neon)
- Optional Redis URL for L2 cache

### 1. Backend Setup
```bash
cd backend
cp .env.example .env
# Fill in DATABASE_URL, JWT_SECRET, DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD, and optional REDIS_URL
npm install
npx prisma generate
npm run dev
```
The backend starts on `http://localhost:8000`.

### 2. Frontend Setup
```bash
cd Exam_quiz_Portal_Lib_JKLU
npm install
# Create .env.local with NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```
The frontend starts on `http://localhost:3000`.

---

## Security Note
- Never commit `.env`, `.env.local`, `pastpaper/`, `pastpaper_bin/`, or `backend/storage/`. All of these are excluded via the root [`.gitignore`](.gitignore).
