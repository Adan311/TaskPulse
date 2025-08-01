# TaskPulse Testing Guide

This README gives you everything you need to know about testing in TaskPulse—how to run the tests, what’s covered, and why it matters. It’s designed for both academic review and for anyone new to the project.

For a full breakdown of testing achievements, see [Plan&DOC/TESTING_SUMMARY.md](../../Plan&DOC/TESTING_SUMMARY.md).

## 🗂️ What’s in this Folder?

- **config/** – Test configs (Vitest, Playwright, setup)
- **mocks/** – Mocked services (Supabase, API, auth)
- **unit/** – Unit tests for backend and frontend logic
- **integration/** – Integration tests for workflows and APIs
- **e2e/** – End-to-end tests (user journeys)
- **accessibility/** – Accessibility checks
- **security/** – Security-related tests
- **ai/** – AI feature tests
- **performance/** – Performance checks
- **reports/** – Test results and coverage

(Other folders: `utils/` and `fixtures/` are helpers and sample data for tests.)

## 🚀 How to Run the Tests

All tests for TaskPulse can be run using simple npm scripts. Make sure you’ve run `npm install` first to get all dependencies.

### Quick Start
```bash
# Run all unit tests
npm run test:unit

# Run tests in watch mode (auto re-run on save)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run all available tests (unit, integration, E2E, etc.)
npm run test:all
```

### Other Test Types
```bash
# End-to-End (E2E) tests (when implemented)
npm run test:e2e
npm run test:e2e:ui

# Accessibility tests
npm run test:accessibility

# Security tests
npm run test:security

# Integration tets
npm run test:integration
```

### Running Specific Tests
```bash
# Run a specific test file
npm run test:unit -- tests/unit/services/auth.service.test.ts

# Run with verbose output
npm run test:unit -- --reporter=verbose
```

### Typical Workflow
1. Start your dev server: `npm run dev`
2. In another terminal, run tests in watch mode: `npm run test:watch`
3. Check coverage or run full suite as needed

### CI/CD Pipeline
- All tests run with `npm run test:all` in CI
- Coverage reports generated automatically

## 🔧 Configuration, Coverage & Test Architecture

- **vitest.config.ts**: Main config for unit/integration tests (with coverage thresholds)
- **playwright.config.ts**: E2E test config
- **test-setup.ts**: Global setup and mocks

### Coverage & Goals
- Unit: 90%+ for services, 80%+ for components
- Integration: 100% of API endpoints
- E2E: 100% of critical user journeys
- Accessibility and security: Dedicated tests for both
- All tests run in CI for every code change

### Test Structure
- Unit tests: `tests/unit/services/` (CRUD, error handling, edge cases)
- Integration tests: `tests/integration/` (cross-feature workflows)
- E2E tests: `tests/e2e/` (user journeys, when implemented)
- Mocks: `tests/mocks/` (Supabase, API, auth)
- Fixtures: `tests/fixtures/` (sample data)

### Service Coverage
- Authentication, tasks, calendar, projects, notes, files, AI, time tracking
- All major and minor backend services are tested

---

**If you want to see the results and achievements, check [Plan&DOC/TESTING_SUMMARY.md](../../Plan&DOC/TESTING_SUMMARY.md).**