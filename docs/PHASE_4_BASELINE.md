# Sonam Phase 4 Baseline Documentation

## Overview

**Sonam Phase 4: Active AI Manager & Workflow Automation** represents the production baseline for Sonam as an **Active Personal Work Manager**.

In Phase 4, Sonam continuously organizes work, tracks follow-ups, remembers personal preferences, surfaces Next Best Actions, evaluates project health, and generates proactive notifications while strictly requiring explicit confirmation for meaningful write operations.

---

## 1. Feature Architecture

### Phase 1: Core Task Management
- Task CRUD, status management (`PENDING`, `IN_PROGRESS`, `COMPLETED`, `OVERDUE`, `SNOOZED`), priorities (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), and deadlines.
- Projects management with progress counters.
- Single-user local setup with PostgreSQL + Prisma.
- 1-minute background task reminder worker (`reminderService.ts`).

### Phase 2: AI Brain & Manager Mode
- OpenAI integration (configurable `OPENAI_MODEL`, defaulting to `gpt-4o-mini`).
- Zod-validated tool execution system (`AIToolExecutor`).
- Natural language task parsing and project decomposition.
- Action Cards confirmation system (`AiActionCardPayload`).
- Sonam chat UI with speech synthesis & voice input.

### Phase 3: Connected Personal Work Assistant
- Google OAuth connection with Calendar free-time calculator and event creator.
- Gmail message search & thread summarization with prompt-injection defense.
- Procurement Workspace (`/procurement`) with vendor management, web research, duplicate detection, and quotation comparison engine.

### Phase 4: Active AI Manager & Workflow Automation
- **Personal Work Memory (`WorkMemory`)**: Persistent storage of preferences, facts, routines, and decisions with dynamic injection into AI context.
- **Follow-Up Tracking System (`FollowUp`)**: Automated tracking for vendor quotations, task dependencies, and email replies with status lifecycle (`PENDING` → `DUE` → `COMPLETED`).
- **Proactive Manager Engine (`proactiveManagerService`)**: Smart Priority score calculation, **Next Best Action** (*"Ab mujhe kya karna chahiye?"*) with rationale pills, **Daily Manager Briefing**, and **Project Health Evaluator** (`ON_TRACK`, `AT_RISK`, `BLOCKED`, `COMPLETED`).
- **Notification Center & Lifecycle (`Notification`)**: Proactive alert notifications with 30-minute deduplication cooldowns (`UNREAD`, `READ`, `DISMISSED`).
- **Auditable Activity Timeline (`ActivityLog`)**: Audit log tracking all user and AI actions (`who`, `what`, `when`, `entity`, `action`, `result`).
- **Work Manager Control Center (`/manager`)**: Visual control center dashboard displaying Next Best Action, Proactive Insights, Active Follow-ups, Project Health, and Activity Timeline.
- **Autonomy Mode Control**: User setting (`MANUAL`, `ASSISTED`, `PROACTIVE`) defaulting to `ASSISTED`.

---

## 2. Database Models (`server/prisma/schema.prisma`)

```prisma
model User {
  id                      String            @id @default(uuid())
  name                    String            @default("Dev User")
  email                   String            @unique @default("user@example.com")
  timezone                String            @default("Asia/Kolkata")
  workStartHour           String            @default("09:00")
  workEndHour             String            @default("18:00")
  defaultReminderInterval ReminderInterval  @default(MINUTES_15)
  enableNotifications     Boolean           @default(true)
  autonomyMode            AutonomyMode      @default(ASSISTED)
  createdAt               DateTime          @default(now())
  updatedAt               DateTime          @updatedAt
  tasks                   Task[]
  projects                Project[]
  vendors                 Vendor[]
  quotations              Quotation[]
  googleAuthToken         GoogleAuthToken?
  memories                WorkMemory[]
  followUps               FollowUp[]
  notifications           Notification[]
  activityLogs            ActivityLog[]
}

model WorkMemory {
  id         String     @id @default(uuid())
  userId     String
  type       MemoryType @default(WORK_CONTEXT)
  key        String
  value      String
  source     String?
  confidence Float?     @default(1.0)
  expiresAt  DateTime?
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt
  user       User       @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model FollowUp {
  id            String         @id @default(uuid())
  userId        String
  vendorId      String?
  taskId        String?
  emailThreadId String?
  title         String
  reason        String?
  dueAt         DateTime
  status        FollowUpStatus @default(PENDING)
  lastContactAt DateTime?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  vendor        Vendor?        @relation(fields: [vendorId], references: [id], onDelete: SetNull)
  task          Task?          @relation(fields: [taskId], references: [id], onDelete: SetNull)
}

model Notification {
  id          String             @id @default(uuid())
  userId      String
  type        String
  priority    TaskPriority       @default(MEDIUM)
  title       String
  description String?
  entityType  String?
  entityId    String?
  status      NotificationStatus @default(UNREAD)
  expiresAt   DateTime?
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt
  user        User               @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model ActivityLog {
  id          String   @id @default(uuid())
  userId      String
  type        String
  entityType  String?
  entityId    String?
  description String
  metadata    Json?
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## 3. API Routes Overview

- `/api/health`: Application health check and version verification (`4.0.0-phase4`).
- `/api/tasks`: Task CRUD, completion, snooze, reschedule.
- `/api/projects`: Project CRUD and task breakdown.
- `/api/stats`: Dashboard metrics & summary calculation.
- `/api/settings`: User profile, working hours, and autonomy mode configuration.
- `/api/ai`: OpenAI chat endpoint, task parser, task decomposer.
- `/api/google`: Google OAuth status, connect URL, disconnect, calendar free time.
- `/api/vendors`: Vendor CRUD, web research, duplicate detection, quotation comparison.
- `/api/manager`: Next Best Action, Daily Briefing, Proactive Insights, Project Health.
- `/api/memory`: WorkMemory CRUD and search.
- `/api/followups`: FollowUp CRUD and completion.
- `/api/notifications`: Notification list, mark read, dismiss.
- `/api/activity`: Auditable activity stream log.

---

## 4. Security & Autonomy Policy

1. **Multi-Tenant User Isolation**: Every database query is scoped strictly to `userId === current_user_id`. Attempted cross-tenant access returns `404 / NOT_FOUND` or clean authorization exceptions.
2. **Action Card Confirmation Policy**: Write operations (`CREATE_TASK`, `RESCHEDULE_TASK`, `CREATE_CALENDAR_EVENT`, `CREATE_VENDORS`, `CREATE_FOLLOWUP`, `CREATE_MEMORY`, `DRAFT_EMAIL`) **always** present interactive confirmation Action Cards to the user before executing data mutations.
3. **Secret Protection**: API keys (`OPENAI_API_KEY`), Google OAuth tokens (`access_token`, `refresh_token`), and database strings are kept strictly on the backend server and never returned in API responses or exposed to client bundles.
4. **Prompt Injection Protection**: External Gmail body text and public web research content are treated strictly as UNTRUSTED DATA context in AI system prompts.

---

## 5. Environment Variables & Setup Commands

```env
# Server .env / Root .env
DATABASE_URL="postgresql://postgres:admin@localhost:5432/sonam_db?schema=public"
PORT=5000
CLIENT_ORIGIN="http://localhost:5173"
DEFAULT_USER_ID="user_dev_01"

# OpenAI AI Configuration
OPENAI_API_KEY="your_openai_api_key_here"
OPENAI_MODEL="gpt-4o-mini"

# Optional Google OAuth Integration
GOOGLE_CLIENT_ID="your_google_client_id_here"
GOOGLE_CLIENT_SECRET="your_google_client_secret_here"
GOOGLE_REDIRECT_URI="http://localhost:5000/api/google/callback"
```

```bash
# Setup commands
npm run prisma:generate
npm run prisma:db-push
npm run build
npm run dev
```

---

## 6. Known Limitations

- Google OAuth requires developer app registration in Google Cloud Console (`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`). When credentials are omitted, calendar and email features return clean `NOT TESTED — CREDENTIALS REQUIRED` status without crashing.
- Browser notifications require notification permission approval in desktop browsers.
