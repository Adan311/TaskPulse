# 🔗 Integration Testing Suite
*Phase 3: Real Database & API Integration Testing*

## 📋 Overview

This directory contains integration tests that validate real database operations, API endpoints, and cross-feature workflows using the actual Supabase database and MCP server.

## 🏗 Directory Structure

```
integration/
├── api/                           # API endpoint integration tests
│   ├── auth.integration.test.ts   # Authentication workflows
│   ├── tasks.integration.test.ts  # Task CRUD operations
│   ├── projects.integration.test.ts # Project management
│   ├── calendar.integration.test.ts # Calendar & events
│   ├── files.integration.test.ts  # File operations
│   ├── notes.integration.test.ts  # Notes management
│   └── ai.integration.test.ts     # AI service integration
├── database/                      # Database operation tests
│   ├── relationships.test.ts      # Foreign key relationships
│   ├── migrations.test.ts         # Database migrations
│   └── data-integrity.test.ts     # Data consistency
├── workflows/                     # Cross-feature workflow tests
│   ├── task-project-sync.test.ts  # Task-project synchronization
│   ├── calendar-integration.test.ts # Calendar workflows
│   └── complete-user-journey.test.ts # End-to-end workflows
└── fixtures/                      # Test data and helpers
    ├── test-users.json           # Sample user data
    ├── sample-tasks.json         # Sample task data
    └── integration-helpers.ts    # Test utilities
```

## 🎯 Testing Approach

### **Real Database Operations**
- Uses actual Supabase database with test data
- Tests real CRUD operations and data persistence
- Validates database relationships and constraints
- Tests transaction handling and rollbacks

### **MCP Server Integration**
- Leverages MCP server for database operations
- Tests service layer with real database connections
- Validates business logic with actual data
- Tests error handling with real database responses

### **Cross-Feature Validation**
- Tests interactions between different features
- Validates data consistency across services
- Tests complex workflows with multiple steps
- Validates external service integrations

## 🚀 Running Integration Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific test suites
npm run test:integration -- api
npm run test:integration -- database
npm run test:integration -- workflows

# Run with coverage
npm run test:integration:coverage

# Run in watch mode
npm run test:integration:watch
```

## 📊 Success Criteria

- **API Coverage:** 100% of endpoints tested
- **Database Coverage:** 95% of operations tested
- **Workflow Coverage:** 90% of user journeys tested
- **Performance:** <500ms average response time
- **Reliability:** 98%+ test pass rate

## 🔧 Test Configuration

Integration tests use:
- Real Supabase database (test environment)
- MCP server for database operations
- Test user authentication
- Cleanup utilities for test isolation
- Performance monitoring

---

*Integration tests validate real-world application behavior with actual database operations* 