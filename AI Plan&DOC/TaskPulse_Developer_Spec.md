
# 🧠 TaskPulse Developer Specification

## 📌 Overview

**TaskPulse** is an AI-powered productivity dashboard targeting individual users such as professionals and students. The app integrates task management, scheduling (via Google Calendar), file organization, AI-driven natural language processing, and productivity analytics into a single, seamless experience. The core problem it solves is **workflow fragmentation**, aiming to save users **2+ hours weekly**.

---

## 🎯 Project Goals

- Save users a minimum of **2 hours per week**
- Automate task creation using **natural language commands**
- Deliver a **drag-and-drop interface** that is intuitive and user-friendly
- Provide **weekly AI productivity reports**
- Maintain **real-time sync** across all devices

---

## 🧩 Core Features

### 1. 🗂 Task Management
- Create, edit, delete tasks
- Assign priority levels (High, Medium, Low)
- Mark tasks as complete
- Recurring tasks (`Could`)
- Group tasks within projects

### 2. 📆 Calendar Integration
- Link Google Calendar using OAuth2
- Sync tasks/events to and from Calendar
- Real-time two-way synchronization
- List/Day/Week calendar views
- Reminder alerts for upcoming events (`Should`)

### 3. 🤖 AI-Powered Interaction
- AI Chat for task breakdowns
- Natural language task/event creation
- AI-suggested scheduling with smart deadlines
- Accept/decline suggestions
- Google Gemini NLP integration
- Fallback to manual inputs if NLP fails

### 4. 📎 File Organization
- Attach files to tasks/events/projects
- Preview and delete attachments
- Store securely using Supabase or Google
- Enforce 10MB file limit
- Fallback storage via Google Drive

### 5. 📁 Project Workspace
- Create projects to group related tasks and events
- Add project-level file attachments
- Overview display for each project

### 6. ⏱ Time Tracking & Productivity
- Start/stop timers for tasks
- Log and analyze time spent
- Weekly productivity reports
- Insight into task completion and time usage

---

## ✅ Functional Requirements (Summary)

| ID     | Feature Description                                  | Priority |
|--------|------------------------------------------------------|----------|
| FR-1   | User account creation (email/password)               | Must     |
| FR-2   | Secure login/logout                                  | Must     |
| FR-6   | AI chat task breakdown                               | Must     |
| FR-15  | Link Google Calendar account                         | Must     |
| FR-17  | Real-time Calendar sync                              | Must     |
| FR-22  | Task timer feature                                   | Must     |
| FR-24  | Create projects                                      | Must     |
| FR-30  | Natural language task/event creation                 | Should   |
| FR-33  | List/Day/Week view toggling for Calendar             | Must     |

See full requirements in **Appendix A** of the source document.

---

## 🛠 Non-Functional Requirements (Summary)

| ID     | Description                                           | Priority |
|--------|-------------------------------------------------------|----------|
| NFR-1  | Real-time data sync with < 2s delay                   | Should   |
| NFR-2  | Simple, visually appealing drag-and-drop interface    | Must     |
| NFR-4  | GDPR compliance                                       | Must     |
| NFR-5  | Fast loading times (< 2s)                             | Should   |
| NFR-7  | Cross-platform support (browsers, devices)            | Should   |
| NFR-8  | Encrypted user data and secure authentication         | Must     |
| NFR-11 | Clear error handling and feedback                     | Must     |

---

## 🔐 Authentication and Security

- OAuth2 login for Google Calendar
- Email/password login system (Supabase Auth)
- GDPR compliant data privacy (right to be forgotten, encryption)
- Session security via JWT tokens
- Encrypted data at rest (AES) and in transit (TLS)

---

## 🧠 AI & Natural Language Processing

- NLP via **Google Gemini API**
- AI Chat for parsing: “Schedule team meeting at 4 PM”
- Smart task breakdown: “Write essay” → “Research,” “Draft,” “Review”
- Time slot auto-assignment based on availability
- 90% interpretation accuracy goal
- Testing via `pytest`
- Fallback manual form when NLP confidence < threshold

---

## 🔄 Backend / Data Architecture

- **Supabase** for:
  - Postgres DB (tasks, events, users, logs)
  - File Storage (attachments, project files)
  - Realtime sync (pub/sub model)
- API Retry logic for sync failures
- Fallback: local SQLite storage (offline support)
- Logging: API calls, AI results, errors

---

## 🧪 Testing Strategy

| Area        | Tools         | Coverage Goal         |
|-------------|---------------|------------------------|
| AI/NLP      | Pytest        | 90% command accuracy  |
| UI          | Cypress       | 100% E2E coverage     |
| API         | Postman       | 99% sync reliability  |
| Manual QA   | Sprint tests  | Peer reviewed testing |

- Test AI in Sprint 7
- Test UI components in Sprint 3–5
- Run full integration and regression tests in Sprint 8

---

## 🧠 Risk Management

| ID  | Risk                           | Severity | Mitigation                            |
|-----|--------------------------------|----------|----------------------------------------|
| R1  | AI misinterprets commands      | High     | Add validation + fallback manual input |
| R2  | Supabase down                  | Medium   | Local save fallback, retry API         |
| R3  | Calendar sync fails            | Medium   | Manual override                        |
| R6  | Delay in development schedule  | Medium   | 2–3 day buffer in each sprint          |
| R9  | Lack of test coverage          | High     | QA audits, enforce test checklists     |

---

## 🧱 Tech Stack

- **Frontend**: React (TypeScript), TailwindCSS
- **Backend**: Supabase (Postgres + Storage)
- **AI/NLP**: Google Gemini (or OpenAI as fallback)
- **Testing**: Cypress, Postman, Pytest
- **Auth**: Supabase Auth (OAuth2, JWT)
- **Deployment**: Vercel/Netlify (Frontend), Supabase Hosting

---

## 🕒 Agile Timeline (Hybrid Agile-Waterfall)

| Sprint | Dates               | Deliverables                                 |
|--------|---------------------|----------------------------------------------|
| 1      | Mar 1–15, 2025      | Research, Define Requirements                |
| 2      | Mar 17–30, 2025     | Dev Environment Setup, AT2 Submission        |
| 3      | Mar 26–Apr 9, 2025  | User Auth System, Initial Planning           |
| 4      | Apr 10–25, 2025     | UI Design + Calendar Component               |
| 5      | Apr 25–May 9, 2025  | Google Calendar Sync + Project System        |
| 6      | May 10–21, 2025     | Timer System + Time Logs                     |
| 7      | May 21–Jun 10, 2025 | AI Chat, NLP Commands                        |
| 8      | Jun 11–29, 2025     | Testing, Cleanup, Final Touches              |
| Final  | Jun 30–Jul 23, 2025 | AT3 Documentation, AT4 Demo Film             |

---

## 📒 Appendix: User Stories (Summary)

- **S1**: Talk to AI to break down tasks
- **S2**: Sync tasks with Google Calendar
- **S3**: Attach files to tasks/events
- **S4**: Create, login, logout accounts
- **S5**: Group tasks/events into projects
- **S6**: Use visually intuitive drag-and-drop UI

---

## 📚 Documentation & Repository

- **Central GitHub Repo**
- `/docs` folder for technical specifications
- GitHub Wiki for developer and user guides
- Issues and sprints tracked using **JIRA**

---

## 👨‍💻 Developer Notes

- Use Agile retrospectives and PS Group feedback biweekly
- Align all new features to MoSCoW and Risk Mitigation matrix
- Use `env` secrets for API keys
- Log all critical actions for debugging and audit

---

> Developed as part of COM668 (Ulster University) 2025 Final Project — Author: Adan Naveed (B00905612)

## 📌 Full Functional Requirements

| ID     | Name                                     | Description                                                                 | Priority |
|--------|------------------------------------------|-----------------------------------------------------------------------------|----------|
| FR-1   | Create Account                            | Users can sign up with email and password                                   | Must     |
| FR-2   | Log In/Out                                | Users can securely log in and out                                           | Must     |
| FR-3   | Reset Password                            | Users can reset forgotten passwords                                         | Must     |
| FR-4   | Update Profile                            | Users can update personal details                                           | Must     |
| FR-5   | Delete Account                            | Users can delete their account and data                                     | Must     |
| FR-6   | AI Chat Feature                           | Break down large tasks into smaller subtasks                                | Must     |
| FR-7   | Upload and Attach Files                   | Attach files to tasks or events                                             | Must     |
| FR-8   | Preview Files                             | View attached files in the app                                              | Must     |
| FR-9   | Remove Files                              | Delete files from tasks or events                                           | Must     |
| FR-10  | Secure File Storage                       | Files stored securely in Supabase or Google                                 | Must     |
| FR-11  | Display Created Tasks                     | View all created tasks                                                      | Must     |
| FR-12  | Display Calendar Events                   | View events in calendar                                                     | Must     |
| FR-13  | Edit Tasks and Events                     | Modify task or event details                                                | Must     |
| FR-14  | Delete Tasks and Events                   | Remove tasks or events                                                      | Must     |
| FR-15  | Google Calendar Account Linking           | Connect Google Calendar                                                     | Must     |
| FR-16  | Auto Generate Events                      | Tasks create calendar events automatically                                  | Should   |
| FR-17  | Real-Time Google Calendar Sync            | Instant syncing of calendar events                                          | Must     |
| FR-18  | Set Task Priority                         | Assign priority levels to tasks                                             | Must     |
| FR-19  | Sort by Priority                          | System sorts tasks by priority                                              | Must     |
| FR-20  | Task Reminders                            | Alerts for upcoming tasks                                                   | Should   |
| FR-21  | Event Reminders                           | Alerts for upcoming events                                                  | Should   |
| FR-22  | Start Task Timer                          | Begin timer to track time spent on a task                                   | Must     |
| FR-23  | Log Time Spent                            | Logs total time spent on each task                                          | Should   |
| FR-24  | Create Projects                           | Create projects grouping tasks and events                                   | Must     |
| FR-25  | Assign Tasks/Events to Projects           | Link tasks/events to projects                                               | Must     |
| FR-26  | Attach Files to Projects                  | Add project-level attachments                                               | Must     |
| FR-27  | Display Project Contents                  | Show project overview                                                       | Must     |
| FR-28  | AI Task/Event Suggestions                 | Suggestions based on user discussions                                       | Must     |
| FR-29  | Accept/Reject AI Suggestions              | Users can accept or decline suggestions                                     | Should   |
| FR-30  | Natural Language Task/Event Creation      | Use natural language to create entries                                      | Should   |
| FR-31  | Task Completion Tracking                  | Mark tasks as done and track progress                                       | Should   |
| FR-32  | Recurring Tasks                           | Support for recurring schedules                                             | Could    |
| FR-33  | Custom Calendar Views                     | Toggle calendar views (List/Day/Week)                                       | Must     |

## 📌 Full Non-Functional Requirements

| ID      | Name                                | Description                                                                 | Priority |
|---------|-------------------------------------|-----------------------------------------------------------------------------|----------|
| NFR-1   | Real-Time Data Sync                 | Updates reflected across all devices within 2 seconds                       | Should   |
| NFR-2   | User Interface Usability            | Simple, visually appealing drag-and-drop design                             | Must     |
| NFR-3   | Light/Dark Mode                     | Support for theme switching                                                 | Must     |
| NFR-4   | GDPR Compliance                     | Compliance with data privacy laws                                           | Must     |
| NFR-5   | Fast Page Load                      | Pages load in under 2 seconds even under heavy load                         | Should   |
| NFR-6   | Help Documentation & Support        | Includes guides and help support                                            | Should   |
| NFR-7   | Cross-Platform Compatibility        | Works on all major browsers and devices                                     | Should   |
| NFR-8   | Data Encryption & Security          | Regular updates and encryption for user data                                | Must     |
| NFR-9   | System Testability                  | Built to allow extensive unit and integration testing                       | Should   |
| NFR-10  | Multi-Language Support              | English default with other languages supported later                        | Could    |
| NFR-11  | Error Handling and Feedback         | Friendly error messages and validation feedback                             | Must     |
| NFR-12  | Scalability/Performance Monitoring  | Capable of growing with user base and monitoring performance                | Could    |
| NFR-13  | Accessibility                       | Meets basic accessibility standards                                         | Should   |
