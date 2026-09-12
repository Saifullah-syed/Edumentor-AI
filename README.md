# EduMentor AI: AI-Powered Academic & Career Advisor

**EduMentor AI** is a full-stack, enterprise-grade university advising and career intelligence platform designed to empower undergraduate students with personalized course selections, industry-aligned career roadmaps, real-time skill-gap analysis, customized study curricula, and intelligent resume evaluations. It also equips university academic advisors with administrative cohort oversight, common curriculum gap telemetry, and course catalog management.

---

## 📑 Table of Contents
1. [Project Overview & Problem Statement](#1-project-overview--problem-statement)
2. [Key Features & Capabilities](#2-key-features--capabilities)
3. [System Architecture & Data Flow](#3-system-architecture--data-flow)
4. [Technology Stack](#4-technology-stack)
5. [Role-Based Access Control (RBAC) & Security](#5-role-based-access-control-rbac--security)
6. [Database Schema & Dual-Engine Architecture](#6-database-schema--dual-engine-architecture)
7. [AI Integration & Responsible AI Guardrails](#7-ai-integration--responsible-ai-guardrails)
8. [Demo Accounts & Evaluation Credentials](#8-demo-accounts--evaluation-credentials)
9. [Local Setup & Running Instructions](#9-local-setup--running-instructions)
10. [Academic Defense & Viva Guide](#10-academic-defense--viva-guide)

---

## 1. Project Overview & Problem Statement

### The Problem
University students frequently struggle with:
* Determining which elective courses to take to align with industry expectations.
* Identifying missing or deficient skills required for competitive entry-level roles.
* Transitioning from textbook concepts to production-grade portfolio projects.
* Receiving frequent, highly personalized guidance given limited faculty advising hours.

### The Solution
**EduMentor AI** bridges this gap by marrying student academic records (completed courses, grades, GPA, declared skills) with real-world industry career benchmarks. Powered by Google Gemini AI, EduMentor AI formulates contextualized academic recommendations, structured milestone roadmaps, weekly learning plans, and ATS resume evaluations.

---

## 2. Key Features & Capabilities

### 🎓 Student Experience
1. **Interactive Academic Dashboard**: Displays degree trajectory (e.g. 68% progress), cumulative GPA, active career track, current skill badges, skill gap breakdown, and recommended next actions.
2. **AI Academic Advisor Chat**: An interactive advising terminal utilizing Gemini AI with dynamic context injection (student's completed courses, current skills, and career goal). Includes conversation history, suggested prompt pills, and responsible AI disclaimers.
3. **Interactive Career Roadmap**: 7-stage sequential learning pathway (e.g., Data Scientist: Python → SQL → Statistics → Machine Learning → Deep Learning → Projects → Interview Prep) with difficulty badges, learning resources, and persistent milestone completion checkboxes.
4. **Skill Gap Analysis Matrix**: Directly compares student proficiencies against target career recruitment benchmarks, categorizing competencies into `MATCH`, `NEEDS IMPROVEMENT (GAP)`, and `MISSING`, complemented by AI action plans.
5. **Personalized Weekly Learning Plan**: Generates a custom week-by-week curriculum based on desired duration (4, 8, or 12 weeks) and available study time (e.g., 10 hrs/week), complete with tasks and completion tracking.
6. **AI Resume Analyzer**: Secure in-memory file uploader supporting PDF, DOCX, and TXT files. Computes an ATS Compatibility Score (0–100), career alignment percentage, strengths, missing keywords, and recommended portfolio capstone projects.
7. **Profile & Coursework Manager**: Allows students to manage their degree, program, cumulative GPA, enrolled courses, and verified skills.

### 🛡️ Admin / Academic Advisor Experience
1. **Cohort Analytics Command Center**: Real-time aggregation of total students, cohort average progress, cumulative GPA, and career track distribution.
2. **Common Skill Gaps Telemetry**: Pinpoints the most prevalent skill deficiencies across the entire cohort (e.g., SQL and Statistics) to guide departmental workshops.
3. **Student Advisement Roster**: Searchable student directory with an inspection modal to review individual student coursework dossiers and skill sets.
4. **Course Catalog Administration**: Full CRUD operations on university courses (course codes, credit hours, departments, and difficulty levels).
5. **Career Track & Benchmark Management**: Configure career pathways and define required competency benchmarks (proficiencies and requirement tiers).

---

## 3. System Architecture & Data Flow

EduMentor AI is engineered as a decoupled full-stack application following a clean service-repository pattern:

```
┌─────────────────────────────────────────────────────────────┐
│                       CLIENT TIER                           │
│  React 18 + Vite + TypeScript + Tailwind CSS + Lucide Icons │
│  - AuthContext (JWT session, RBAC role guard, demo logins)  │
│  - Centralized Axios Client (/api proxy, Bearer headers)    │
└──────────────────────────────▲──────────────────────────────┘
                               │ HTTP / JSON REST APIs
┌──────────────────────────────▼──────────────────────────────┐
│                       SERVER TIER                           │
│  Node.js + Express + ES Modules                             │
│  ├── Controllers (Auth, Student, Advisor, Roadmap, Admin)   │
│  ├── Middleware (authenticateToken, requireRole, Multer)    │
│  └── Services:                                              │
│      ├── Gemini AI Service (Context injection + Fallback)   │
│      └── Resume Parser Service (pdf-parse & mammoth)        │
└──────────────────────────────▲──────────────────────────────┘
                               │ Parameterized SQL ($1, $2)
┌──────────────────────────────▼──────────────────────────────┐
│                      DATABASE TIER                          │
│  Dual-Engine DB Abstraction (PostgreSQL / Embedded SQLite)  │
│  ├── 15 Relational Tables with Foreign Keys & Cascades      │
│  └── Automated Schema & Seed Scripts                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Technology Stack

* **Frontend**: React 18, TypeScript, Tailwind CSS v4, Vite, Lucide React icons, Axios.
* **Backend**: Node.js (v22), Express, CORS, JSON Web Tokens (`jsonwebtoken`), Bcrypt (`bcryptjs`), Multer.
* **Document Extraction**: `pdf-parse` (for PDF resumes), `mammoth` (for DOCX resumes).
* **Database**:
  * **Primary**: PostgreSQL (via `pg` connection pool with SSL support).
  * **Embedded Fallback**: Node.js 22 built-in `node:sqlite` for zero-configuration, instant offline lab grading and presentations.
* **Generative AI**: Google Gemini API (`gemini-1.5-flash` / `gemini-2.0-flash` via `@google/generative-ai`), paired with an intelligent local fallback advisor engine.

---

## 5. Role-Based Access Control (RBAC) & Security

1. **Strict Backend Authorization**: A student can **never** access administrative functionality simply by altering frontend state or URL routes. Every administrative route (`/api/admin/*`) strictly enforces `authenticateToken` followed by `requireRole('admin')`, returning `403 Forbidden` for student tokens.
2. **Password Security**: Passwords are encrypted using `bcryptjs` with 10 salt rounds. Plaintext passwords are never stored or logged.
3. **Stateless Session Tokens**: Authenticated requests require a signed JWT token passed via the HTTP `Authorization: Bearer <token>` header.
4. **Confidential File Processing**: Uploaded resumes are processed in memory using Multer memory storage and immediately discarded after text extraction. Files are never exposed publicly or stored unencrypted on disk.
5. **SQL Injection Prevention**: All database interactions use parameterized queries (`$1, $2, ...` in Postgres and `?` in SQLite).

---

## 6. Database Schema & Dual-Engine Architecture

The relational schema (`server/src/db/schema.sql`) contains 15 tables with complete foreign key constraints, cascade deletes, and indexing:

1. `users`: User identity, email, password hash, and role (`student` or `admin`).
2. `student_profiles`: Academic standing, university, program, degree, GPA, progress, and career target.
3. `careers`: Industry career specializations (salary, industry, outlook).
4. `career_skills`: Benchmark skill requirements and proficiencies for each career track.
5. `courses`: University course catalog (code, title, credits, department, difficulty).
6. `student_courses`: Enrolled student coursework, grades, and statuses (`completed`, `in_progress`, `planned`).
7. `skills`: Technical, analytical, tool, and soft skill taxonomies.
8. `student_skills`: Verified student competencies and proficiency levels.
9. `career_roadmaps`: Sequential career learning milestones.
10. `roadmap_items`: Roadmap steps, topics, descriptions, resources, and completion statuses.
11. `learning_plans`: Student weekly study schedules (hours/week, duration).
12. `learning_plan_items`: Weekly objectives, task checklists, and completion flags.
13. `ai_conversations`: Advising chat sessions.
14. `ai_messages`: User messages and AI responses with disclaimer flags.
15. `resume_analyses`: ATS scores, career alignment percentages, strengths, weaknesses, and recommended projects.

---

## 7. AI Integration & Responsible AI Guardrails

### Dynamic Context Injection
When a student queries the AI Advisor, the backend dynamically queries the student's profile, completed courses, current skills, and target career, formatting a high-context prompt for Gemini:

> *"You are EduMentor AI, an expert academic advisor. Advising Alex Johnson, B.S. in Computer Science. Completed courses: CS101, CS201, CS305, MATH220. Current skills: Python (Advanced), SQL (Beginner), Statistics (Beginner). Provide actionable, personalized advice for their target career as a Data Scientist."*

### Responsible AI Notice
Every response from EduMentor AI explicitly carries the notice:
> *"⚠️ Responsible AI Notice: Recommendations are AI-generated based on your profile. Important graduation audits and course registration requirements should always be confirmed with your official university department advisor."*

### Zero-Failure Local Fallback
If an examiner runs the project offline or without a `GEMINI_API_KEY`, EduMentor AI's intelligent deterministic advisor engine activates automatically. It provides realistic, context-aware advice, structured JSON roadmaps, and resume ATS evaluations without crashing or hanging.

---

## 8. Accounts & Evaluation Credentials

EduMentor AI comes pre-seeded with realistic university data and evaluation accounts:

| Role | Name | Email | Password | Details |
| :--- | :--- | :--- | :--- | :--- |
| **Demo Student** | Saifullah | `saifullah@student.edu` | `Student123!` | One-click demo login on Sign In screen |
| **Admin / Advisor** | Saifullah (Admin) | `admin@saifullah.ai` | `saifullah@123` | Direct login with full administrative control |

---

## 9. Local Setup & Running Instructions

### Prerequisites
* Node.js v18+ (Node.js v22 recommended)
* npm v9+
* Optional: PostgreSQL 14+ (if omitted, the app runs on the built-in embedded SQLite database)

### Installation
1. Clone or extract the repository:
   ```bash
   cd "Edumentor AI"
   ```
2. Install all dependencies across root, client, and server:
   ```bash
   npm run install:all
   ```

### Configuration (`.env`)
Create a `.env` file in the root directory (or use the provided default `.env`):
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=edumentor_super_secret_jwt_key_academic_2026_secure
JWT_EXPIRES_IN=7d

# Optional PostgreSQL Connection (Leave blank for zero-setup SQLite)
DATABASE_URL=

# Optional Google Gemini API Key (Leave blank for offline advisor engine)
GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash
```

### Seed Database
Seed demo students, courses, careers, and roadmaps:
```bash
npm run seed
```

### Start Development Server
Launch both the backend API server and frontend Vite application concurrently:
```bash
npm run dev
```
* **Frontend Application**: `http://localhost:5173`
* **Backend REST API**: `http://localhost:5000/api`

### Run Automated E2E Test Suite
Execute the 36-step automated test suite verifying all features and RBAC security:
```bash
node server/test_e2e.js
```

---

## 10. Academic Defense & Viva Guide

When explaining this application during your academic viva or project demonstration, emphasize these key design decisions:

1. **Why Full-Stack Architecture?**
   * Separates client presentation from business logic and database persistence.
   * Ensures sensitive secrets (e.g., `GEMINI_API_KEY` and database credentials) never leak to client-side JavaScript.
2. **Why Role-Based Access Control (RBAC)?**
   * Guarantees that students cannot view or tamper with administrative cohort statistics or catalog courses.
   * Authorization is verified on the server tier using cryptographically signed JWTs.
3. **How does Gemini AI Personalization Work?**
   * Rather than asking a generic LLM, the backend queries the database for the student's unique academic standing and injects it into the prompt.
4. **How does the Database Layer handle Resilience?**
   * Uses standard ANSI SQL queries that execute on PostgreSQL in production while providing an embedded zero-configuration fallback for offline evaluation.
5. **What was done differently from previous projects?**
   * Integrated responsible AI disclaimers, true multi-tier role authorization, interactive state persistence (toggling milestones), document text extraction from PDFs/DOCXs, and comprehensive automated test coverage.
