# LMS Platform — Online Learning Marketplace

[![NestJS](https://img.shields.io/badge/NestJS-11.x-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16.x-black?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.x-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TypeORM](https://img.shields.io/badge/TypeORM-1.1.x-FE0803?style=flat-square&logo=typeorm&logoColor=white)](https://typeorm.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

A production-oriented, full-stack online course and learning management platform. Built as an ad-hoc monorepo featuring a **NestJS 11** modular backend API and a **Next.js 16 (App Router)** client with modern **Shadcn UI** primitives and **Tailwind CSS v4**.

---

## Architecture Overview

```mermaid
flowchart TD
    subgraph ClientLayer ["Frontend Client (Next.js 16 App Router)"]
        Storefront["Storefront & Catalog<br/>(Server Components)"]
        AuthUI["Auth Dialogs & State<br/>(Zustand In-Memory + React Query)"]
        Player["Dedicated Course Player<br/>(HTML5 Video + Progress)"]
        InstructorPortal["Instructor Course Wizard<br/>(Curriculum Management)"]
        AdminPortal["Admin Moderation<br/>(Category & Course Governance)"]
    end

    subgraph APILayer ["Backend API Tier (NestJS 11 + Express + Node 22 LTS)"]
        Gateway["Global Prefix: /api<br/>Helmet | CORS | Morgan | ValidationPipe"]
        AuthModule["Auth Module<br/>(JWT + Google OAuth + Cookie Rotation)"]
        CoursesModule["Courses & Curriculum Module<br/>(CRUD + State Machine)"]
        OrdersModule["Orders & Payments Module<br/>(Razorpay SDK + Raw Body Webhook)"]
        MediaModule["Media Module<br/>(Signed Uploads + Signed Streams)"]
        ProgressModule["Progress & Quizzes Module<br/>(Tracking + Server Scoring)"]
    end

    subgraph DataLayer ["Persistence & External Cloud Services"]
        PostgreSQL[(PostgreSQL 16 Relational DB<br/>TypeORM Migrations)]
        Cloudinary[(Cloudinary Storage<br/>Images & Protected Video Delivery)]
        RazorpayAPI[(Razorpay Payment Gateway<br/>Checkout & Webhooks)]
    end

    ClientLayer -->|HTTPS REST API / JSON| Gateway
    Gateway --> AuthModule
    Gateway --> CoursesModule
    Gateway --> OrdersModule
    Gateway --> MediaModule
    Gateway --> ProgressModule

    AuthModule --> PostgreSQL
    CoursesModule --> PostgreSQL
    OrdersModule --> PostgreSQL
    OrdersModule --> RazorpayAPI
    MediaModule --> Cloudinary
    ProgressModule --> PostgreSQL
```

---

## Key Features

- **Multi-Role Capability Model:** Every user is a Learner by default; approved accounts acquire Instructor capabilities without losing course enrollments.
- **Hierarchical Curriculum Engine:** Courses organized into Sections and Lectures with customizable ordering and free video previews.
- **Direct-to-Cloud Signed Media:** Upload images ($\le 5\text{ MB}$) and large videos ($\le 1\text{ GB}$) directly to Cloudinary via signed chunked uploads, protecting server memory.
- **Protected Video Streaming:** Ephemeral, backend-signed Cloudinary streaming URLs verified against active course enrollments.
- **5-Stage Course Moderation Lifecycle:** `DRAFT` $\rightarrow$ `UNDER_REVIEW` $\rightarrow$ `PUBLISHED` / `REJECTED` / `ARCHIVED`.
- **Razorpay Checkout & Webhooks:** Cryptographic HMAC SHA-256 signature verification with raw request bodies and database webhook deduplication.
- **Interactive Quizzes:** Multiple-choice assessments evaluated entirely server-side (correct options never leaked in client APIs).
- **Session Security:** Short-lived in-memory access tokens with rotating `HttpOnly` refresh cookies and reuse-detection family revocation.

---

## Technology Stack

| Domain | Technology | Version | Purpose |
|---|---|---|---|
| **Backend Framework** | [NestJS](https://nestjs.com/) | `11.1.x` | Enterprise TypeScript REST API framework |
| **Backend Runtime** | [Node.js](https://nodejs.org/) | `22.x LTS` | Active LTS server JavaScript runtime |
| **Database** | [PostgreSQL](https://www.postgresql.org/) | `16.x` | Primary relational database |
| **ORM & Migrations** | [TypeORM](https://typeorm.io/) | `1.1.x` | Migration-driven data modeling (`synchronize: false`) |
| **Frontend Framework** | [Next.js](https://nextjs.org/) | `16.3.x` | React App Router framework with Server Components |
| **UI Library** | [React](https://react.dev/) | `19.2.x` | Component-driven declarative UI |
| **Styling Engine** | [Tailwind CSS](https://tailwindcss.com/) | `4.3.x` | Utility-first CSS via `@theme inline` |
| **Component Primitives**| [Radix UI / Shadcn](https://ui.shadcn.com/) | `4.18.x` | Accessible headless component primitives |
| **Client State / Cache** | [TanStack React Query](https://tanstack.com/query) | `5.x` | Server cache synchronization & mutations |
| **Client Auth Store** | [Zustand](https://github.com/pmndrs/zustand) | `5.x` | In-memory client authentication session store |
| **Media Delivery** | [Cloudinary](https://cloudinary.com/) | SDK | Direct signed video uploads & signed streaming URLs |
| **Payment Gateway** | [Razorpay](https://razorpay.com/) | SDK | Indian & international payment processing |
| **Containerization** | [Docker Compose](https://www.docker.com/) | `v2` | Local PostgreSQL instance management |

---

## Repository Structure

```text
lms-platform/
├── backend/                  # NestJS 11 Application
│   ├── src/
│   │   ├── config/           # Environment validation & schemas
│   │   ├── database/         # TypeORM CLI DataSource & Migrations
│   │   ├── modules/          # Feature modules (auth, users, courses, etc.)
│   │   ├── app.module.ts     # Root module configuration
│   │   └── main.ts           # Application bootstrap & security pipes
│   ├── test/                 # Integration and E2E test suites
│   ├── .env.example          # Backend environment template
│   └── package.json          # Backend dependencies and scripts
│
├── frontend/                 # Next.js 16 Application
│   ├── app/                  # App Router layouts and routes
│   ├── components/ui/        # 25 pre-installed Shadcn UI primitives
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utilities and API client
│   ├── .env.example          # Frontend environment template
│   └── package.json          # Frontend dependencies and scripts
│
├── docs/                     # Architectural Documentation
│   └── LMS_PROJECT_MASTER_PLAN.md   # Canonical Master Development Plan
│
├── docker-compose.yml        # Local PostgreSQL 16 container definition
└── README.md                 # Project documentation (this file)
```

---

## Getting Started

### Prerequisites
- **Node.js:** `v22.x LTS` installed ([nodejs.org](https://nodejs.org/))
- **Docker & Docker Compose:** Installed and running ([docker.com](https://www.docker.com/))
- **Git:** Configured with your credentials

---

### Step 1: Clone the Repository

```bash
git clone git@github-personal:Vikash7t/lms-platform.git
cd lms-platform
```

---

### Step 2: Start PostgreSQL with Docker

```bash
# Start local PostgreSQL 16 database
docker compose up -d

# Verify container status
docker compose ps
```

---

### Step 3: Configure Environment Variables

```bash
# Backend environment setup
cp backend/.env.example backend/.env

# Frontend environment setup
cp frontend/.env.example frontend/.env.local
```

Edit `backend/.env` with your desired configuration:
```env
PORT=8000
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://lms_user:lms_password@localhost:5432/lms_platform
JWT_SECRET=super_secret_jwt_access_key_min_32_chars_long
JWT_REFRESH_SECRET=super_secret_jwt_refresh_key_min_32_chars_long
```

---

### Step 4: Run the Backend API

```bash
cd backend
npm install
npm run start:dev
```
The NestJS API will start on: `http://localhost:8000/api`

---

### Step 5: Run the Frontend Application

```bash
cd ../frontend
npm install
npm run dev
```
The Next.js storefront will start on: `http://localhost:3000`

---

## Development Roadmap & Phase Progress

| Phase | Description | Status |
|:---:|---|:---:|
| **01** | Baseline Checkpoint, Dependency Hygiene & Hardened Environment Validation | ✅ **Completed** |
| **02** | Database Infrastructure (PostgreSQL 16, TypeORM Integration & Migrations) | ✅ **Completed** |
| **03** | Identity, Authentication (JWT + Google OAuth) & Multi-Role RBAC | ✅ **Completed** |
| **04** | Frontend State Architecture (React Query + Zustand) & Auth UI Dialogs | 🔄 **In Progress** |
| **05** | Category Taxonomy & Administrative Instructor Onboarding | ⏳ Planned |
| **06** | Course Domain & Hierarchical Curriculum Management (Sections/Lectures) | ⏳ Planned |
| **07** | Media Services (Cloudinary Direct Signed Uploads & Signed Streaming) | ⏳ Planned |
| **08** | Course Publishing State Machine & Administrator Moderation Portal | ⏳ Planned |
| **09** | Public Storefront Catalog, Faceted Search & Course Details Landing View | ⏳ Planned |
| **10** | Free Course Direct Enrollment & Learner Dashboard Slice | ⏳ Planned |
| **11** | Dedicated Distraction-Free Course Player & Lecture Progress Tracking | ⏳ Planned |
| **12** | Interactive Quizzes & Server-Side Comprehension Assessment Engine | ⏳ Planned |
| **13** | Razorpay Monetization, Multi-Payment Attempts & Webhook Deduplication | ⏳ Planned |
| **14** | Verified Student Course Reviews, Ratings & Instructor Analytics Roster | ⏳ Planned |
| **15** | Security Hardening, Automated Playwright E2E Suites & Production Docker | ⏳ Planned |

Detailed architectural specifications for every phase are documented in [docs/LMS_PROJECT_MASTER_PLAN.md](docs/LMS_PROJECT_MASTER_PLAN.md).

---

## Running Tests

```bash
# Run backend unit tests
cd backend
npm test

# Run backend typecheck
npx tsc --noEmit --incremental false

# Run frontend typecheck
cd ../frontend
npx tsc --noEmit --incremental false
```

---

## Documentation Index

- 📘 **[Canonical Master Development Plan](docs/LMS_PROJECT_MASTER_PLAN.md):** Complete 19-section architectural blueprint, entity catalogs, sequence diagrams, and security invariants.
- 📋 **[Project Discovery & Technical Audit Report](LMS_PROJECT_DISCOVERY_REPORT.md):** Repository discovery and technical architecture audit report.

---

## Author

- **Developer:** Vikash Singh ([@Vikash7t](https://github.com/Vikash7t))
