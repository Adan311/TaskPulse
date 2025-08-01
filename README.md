# TaskPulse: Your All-in-One Productivity Hub

In today's digital world, productivity is fragmented. We juggle countless tabs and applications—a to-do list here, a calendar there, separate apps for notes, project boards, and file storage. This constant context-switching drains focus and creates digital clutter.

**TaskPulse** is the solution. It's a unified, full-stack productivity platform designed to consolidate your entire workflow into a single, elegant application. By seamlessly integrating task management, calendar scheduling, AI assistance, and real-time collaboration, TaskPulse eliminates the need for multiple tools, allowing you to manage your work and life from one central hub.

## 🎯 Core Features

TaskPulse blends personal productivity and team collaboration into a single, powerful system. Here’s what you can do:

| Category | What You Can Do |
|----------|-----------------|
| **Task Management** | Build powerful workflows with customizable boards, recurring tasks, and smart filters. Never miss a deadline again. |
| **Calendar & Scheduling** | Seamlessly sync with Google Calendar in real-time. Drag, drop, and schedule your entire week without leaving the app. |
| **AI Assistant** | Speak your mind. Create tasks, schedule meetings, and organize projects using natural language, powered by Google Gemini. |
| **Time Tracking** | Boost focus with a built-in Pomodoro timer. Automatically log work sessions and gain insights into how you spend your time. |
| **Files & Notes** | Keep everything organized. Attach files directly to tasks and projects, and capture ideas with a fully-integrated notes system. |
| **Collaboration** | Work together effortlessly. Share projects and see updates from your team happen live, with no need to refresh. |
| **Accessibility & PWA** | Stay productive on any device. TaskPulse is fully responsive, keyboard-navigable, and works offline as a Progressive Web App. |




## 🏗️ Architecture & Tech

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Backend-as-a-Service | Supabase Postgres, Auth, Storage, Realtime |
| Edge / Functions | Supabase Edge Functions (Deno) |
| AI Services | Google Gemini API (text generation & NLU) |
| External APIs | Google Calendar API |
| CI / CD | GitHub Actions – lint, test, build |
| Testing | Vitest (unit), Playwright (E2E), Axe (accessibility) |




## ⚡ Quickstart (Local Dev)

### 1. Prerequisites

* Node 18+
* Supabase project (free tier is fine)
* Google Cloud project with Calendar & Gemini APIs enabled

### 2. Environment Variables

Create `.env.local` at project root:

```env
# Supabase
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<public_anon_key>

# Google APIs
VITE_GEMINI_API_KEY=<gemini_api_key>
VITE_GOOGLE_CAL_CLIENT_ID=<oauth_client_id>
VITE_GOOGLE_CAL_API_KEY=<calendar_key>
```

### 3. Install & Run
```bash
npm install          # install deps
npm run dev          # start Vite dev server
```

A browser window should open at `http://localhost:8080`.




## 🔌 APIs & External Services

| Service | Purpose |
|---------|---------|
| Supabase | Database, Auth, Storage, Realtime |
| Google Calendar API | Two-way calendar sync |
| Google Gemini API | AI assistant & NL task creation |
| Clerk (optional) | Future upgrade path for auth |

---

## 🧪 Testing & Quality Assurance

| Suite | Command | Notes |
|-------|---------|-------|
| Unit | `npm run test:unit` | Vitest + jsdom |
| Integration | `npm run test:integration` | Supabase client mocked |
| E2E | `npm run test:e2e` | Playwright UI tests |
| Coverage | `npm run test:coverage` | Generates HTML report |

Detailed strategy and results live in [`Plan&DOC/TESTING_SUMMARY.md`](Plan&DOC/TESTING_SUMMARY.md).




## 📂 Folder Map

```
.
├── src/
│   ├── backend/         # Core backend services, API logic, and database schema
│   │   ├── api/           # End-to-end services for each feature (e.g., tasks, projects)
│   │   └── database/      # Supabase schema and migration definitions
│   │
│   ├── frontend/        # All React-based UI components and application pages
│   │   ├── components/    # Reusable UI components (buttons, forms, etc.)
│   │   ├── features/      # Components scoped to a specific feature (e.g., calendar, notes)
│   │   ├── pages/         # Top-level page components (e.g., Dashboard, Settings)
│   │   ├── hooks/         # Custom React hooks for shared logic
│   │   └── context/       # React context providers for global state
│   │
│   ├── shared/          # Utilities and services used by both frontend and backend
│   │
│   └── tests/           # All automated tests, organized by type
│       ├── unit/          # Unit tests for individual functions and components
│       ├── integration/   # Tests for services interacting with the (mocked) database
│       ├── e2e/           # End-to-end user journey tests with Playwright
│       ├── accessibility/ # Automated accessibility checks with Axe
│       └── security/      # Security-focused tests
│
│
└── Plan&DOC/            # Project planning, documentation, and diagrams
```

## ⚙️ Useful Scripts

| Script | What it does |
|--------|--------------|
| `npm run dev` | Start Vite dev server with hot reload |
| `npm run build` | Production build |
| `npm run preview` | Preview prod build locally |
| `npm run test:unit` | Unit tests with Vitest |
| `npm run test:integration` | Integration tests |
| `npm run test:e2e` | Playwright E2E tests |
| `npm run test:coverage` | Generate coverage report |

---


## 🏆 Project Status & Key Achievements

This project has successfully reached its Minimum Viable Product (MVP) goals and is considered production-ready.

-   **100% MVP Complete**: All core features as defined by the MoSCoW requirements are fully implemented and polished.
-   **Professional-Grade Testing**: Achieved a 100% pass rate across **217+** unit, integration, security, and E2E tests.
-   **Exceeded Requirements**: Implemented advanced features like two-way Google Calendar synchronization, which went beyond the initial project scope.
-   **Production-Ready AI**: The AI Assistant, powered by Google Gemini, is fully integrated, operational, and capable of complex commands.
-   **Accessibility & Compliance**: The application is fully WCAG 2.1 AA compliant and includes robust, GDPR-ready features.

## 📖 Further Reading

- Detailed test results: [`Plan&DOC/TESTING_SUMMARY.md`](Plan&DOC/TESTING_SUMMARY.md)
- Project Progress: [`Plan&DOC/PROJECT_PROGRESS.md`](Plan&DOC/PROJECT_PROGRESS.md)
- Test runner guide: [`src/tests/README.md`](src/tests/README.md)