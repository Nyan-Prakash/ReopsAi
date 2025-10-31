# University Operations AI Assistant
## Comprehensive PRD + Implementation Specification

**Version:** 1.0
**Last Updated:** 2025-10-30
**Status:** Draft for Implementation
**Target Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, MSW (stub mode)

---

## Table of Contents

### Part 1: Foundation & Architecture
0. [Product North Star & Goals](#0-product-north-star--goals)
1. [Information Architecture](#1-information-architecture)
2. [App Routes Map](#2-app-routes-map)
3. [Design System](#3-design-system)
4. [Data Model](#4-data-model)

### Part 2: Student & Public Surface
5. Student Self-Service Pages
6. AI Chatbot Architecture
7. Forms & Validation
8. Mobile & Accessibility

### Part 3: Staff Workspace
9. Inbox & Queue Management
10. Case Workspace
11. AI Composer & Macros
12. Department-Specific Features

### Part 4: Manager & Admin
13. Manager Dashboards
14. Admin Configuration
15. Knowledge Management
16. Audit & Compliance

### Part 5: AI & Integration
17. AI Prompts & Models
18. Type Definitions
19. API Contracts (Stub)
20. MSW Handlers & Seeding

### Part 6: Delivery Artifacts
21. Test Plan
22. Demo Script
23. RBAC Matrix
24. UX Copy Deck
25. Mock Data Catalog

---

## 0. Product North Star & Goals

### Vision Statement
A campus-grade AI-first operations platform that deflects trivial questions, accelerates resolutions, predicts SLA risk, and coordinates cross-department responses from one unified console—competitive with Zendesk Suite Professional across ticketing, knowledge, analytics, automation, and admin tooling.

### Primary User Personas

| Persona | Needs | Success Metrics |
|---------|-------|----------------|
| **Student/Applicant** | Self-service answers, quick ticket creation, status tracking | Deflection rate >60%, CSAT >4.2/5 |
| **Staff Agent** | Unified inbox, AI drafting, student 360°, macros | Handle time <8min, First Reply <2h |
| **Manager** | SLA visibility, workload balance, quality monitoring | Breach rate <5%, utilization 70–85% |
| **Admin** | RBAC, form builder, workflow automation, branding | Zero-config onboarding, audit compliance |
| **Knowledge Manager** | Authoring, review workflow, freshness tracking | Article staleness <90 days, AI citation rate >40% |

### Departments in Scope
1. **Admissions** — Document review, status inquiries, deadline questions
2. **Finance** — Billing, refunds, payment plans, 1098-T, account holds
3. **Registrar** — Enrollment verification, transcripts, schedule changes, grades
4. **Housing** — Room assignments, meal plans, maintenance requests
5. **IT** — Password resets, Wi-Fi, software licensing, hardware support

### Non-Goals (Demo Scope)
- ❌ No production PII or real student data
- ❌ No actual SIS/payment gateway writes
- ❌ No telephony integration (calls simulated as channel type)
- ❌ No outbound email sending (SMTP mocked)
- ❌ No SAML/SSO (auth stubbed with role selector)

### Demo Success Criteria
- ✅ End-to-end student chat → AI escalation → staff case resolution with realistic data flow
- ✅ Manager sees cross-department SLA risk + performs mock rebalancing action
- ✅ Admin configures routing workflow; dry-run shows evaluation path
- ✅ Knowledge Manager publishes article; AI cites it with link in subsequent chat
- ✅ RTL (Arabic) student experience with proper layout mirroring

### Competitive Positioning

| Capability | Table Stakes (Zendesk-class) | Our Differentiators |
|------------|------------------------------|---------------------|
| Unified Inbox | ✓ Multi-channel views | ✓ + Cross-dept contextualization |
| AI Chatbot | ✓ Intent classification | ✓ + Policy-aware citations + cross-dept reasoning |
| Knowledge Base | ✓ Search & authoring | ✓ + Auto-draft from ticket patterns + freshness SLA |
| Macros | ✓ Canned responses | ✓ + AI tone-check + policy variable insertion |
| SLA Management | ✓ Breach alerts | ✓ + Predictive risk scoring + auto-rebalancing suggestions |
| Reporting | ✓ Agent metrics | ✓ + Deflection analytics + cross-queue insights |
| Workflows | ✓ Trigger-action rules | ✓ + Dry-run test bench with trace visualization |
| Multilingual | ✓ Translated UI | ✓ + RTL layout engine + locale-aware number/date formatting |

---

## 1. Information Architecture

### 1.1 Conceptual Model

```
University Operations Platform
├─ Students (external actors)
│  └─ submit Requests via Chat, Forms, or Email
├─ Cases (central work item)
│  ├─ routed to → Queues (by department + skills)
│  ├─ assigned to → Agents (staff members)
│  ├─ governed by → SLA Policies
│  └─ contain → Messages, Attachments, Internal Notes, Timeline Events
├─ Knowledge Base
│  ├─ Articles (searchable corpus for AI + humans)
│  └─ Citations (linked from AI responses)
├─ Service Catalog
│  ├─ Service Definitions (tied to dynamic forms)
│  └─ Form Schemas (JSON-driven, validated via Zod)
├─ Workflows
│  ├─ Triggers (new case, field change, time-based)
│  ├─ Conditions (IF department=Finance AND balance>1000)
│  └─ Actions (route, SLA override, request document, notify)
├─ Users
│  ├─ Roles (Student, Agent, Manager, Admin, KM)
│  └─ Departments (scope for agents)
└─ Audit Logs (immutable event stream)
```

### 1.2 Role Definitions

| Role | Scope | Key Permissions | UI Workspace |
|------|-------|----------------|--------------|
| **Student** | Self only | Create requests, view own cases, chat with AI | `/help`, `/chat`, `/requests` |
| **Agent** | Department(s) | View assigned/queue cases, reply, apply macros, add internal notes | `/inbox`, `/cases/:id`, `/knowledge` |
| **Manager** | Department(s) | All agent perms + reassign, view metrics, approve exceptions | `/manager/*`, `/inbox` (all dept) |
| **Admin** | Platform-wide | User management, form/workflow config, branding, audit access | `/admin/*` |
| **Knowledge Manager** | Platform-wide | Author/publish articles, manage review queue, view AI citation stats | `/km/*` |

### 1.3 Department & Queue Structure

Each department has:
- **Primary Queue** (default intake)
- **Priority Queue** (SLA < 2h, auto-escalated)
- **Approval Queue** (refunds >$500, grade changes, housing swaps)
- **WIP Limit** (configurable; triggers rebalancing alert)

**Skills taxonomy** (for routing):
```typescript
type Skill =
  // Admissions
  | "admissions:documents" | "admissions:decisions" | "admissions:transfers"
  // Finance
  | "finance:billing" | "finance:refunds" | "finance:payment_plans" | "finance:1098t"
  // Registrar
  | "registrar:enrollment" | "registrar:transcripts" | "registrar:grades"
  // Housing
  | "housing:assignments" | "housing:maintenance" | "housing:meal_plans"
  // IT
  | "it:accounts" | "it:network" | "it:software" | "it:hardware";
```

### 1.4 Entity Relationships (Logical)

```
Student (1) ──< (N) Cases
Case (1) ──< (N) Messages
Case (N) ──> (1) Queue
Case (N) ──> (0..1) Agent (assignee)
Case (N) ──< (N) Attachments
Case (1) ──< (N) TimelineEvents
Case (N) ──< (N) Tags

Agent (N) ──> (N) Departments
Agent (N) ──< (N) Skills

Article (1) ──< (N) ArticleVersions
Article (N) ──< (N) Citations (from AI responses)

Workflow (1) ──< (N) WorkflowNodes
WorkflowNode (trigger|condition|action) ──> references Queues, Departments, Skills

SLA_Policy (N) ──> (1) Department
SLA_Policy defines → firstResponseMinutes, resolutionMinutes, priorityMultiplier
```

### 1.5 Data Sovereignty & Audit

- **Audit Event** created for:
  - Case status transitions (New → In Progress → Waiting → Resolved → Closed)
  - Assignment/reassignment
  - Internal notes (who viewed, created)
  - Admin config changes (workflow publish, form schema update, role grant)
  - AI actions (draft generated, citation inserted, escalation)
- **PII Masking**: email, phone, SSN patterns redacted in UI for Agents; full access for Managers/Admins only with audit trail
- **Retention**: Cases soft-deleted after 7 years; audit logs immutable for 10 years (compliance theater for demo)

---

## 2. App Routes Map

### 2.1 Next.js App Router Structure

```
app/
├─ (public)/
│  ├─ layout.tsx                    # Public shell (no auth)
│  ├─ page.tsx                      # → /help (Help Center home)
│  ├─ help/
│  │  ├─ page.tsx                   # Help Center search
│  │  └─ [slug]/
│  │     └─ page.tsx                # Article detail
│  ├─ catalog/
│  │  └─ page.tsx                   # Service catalog tiles
│  ├─ request/
│  │  └─ [serviceId]/
│  │     └─ page.tsx                # Dynamic service request form
│  └─ chat/
│     └─ page.tsx                   # AI Student Assistant
│
├─ (authenticated)/
│  ├─ layout.tsx                    # Auth shell + sidebar nav
│  ├─ requests/
│  │  └─ page.tsx                   # My Requests (student view)
│  │
│  ├─ inbox/
│  │  └─ page.tsx                   # Unified Inbox (agent/manager)
│  ├─ cases/
│  │  └─ [id]/
│  │     └─ page.tsx                # Case workspace (3-pane)
│  ├─ queues/
│  │  └─ page.tsx                   # Queue board (kanban-style)
│  ├─ approvals/
│  │  └─ page.tsx                   # Approval center
│  ├─ knowledge/
│  │  └─ page.tsx                   # Agent KB search (side panel)
│  ├─ reports/
│  │  └─ agent/
│  │     └─ page.tsx                # Personal efficiency metrics
│  │
│  ├─ manager/
│  │  ├─ overview/
│  │  │  └─ page.tsx                # Live ops snapshot
│  │  ├─ queues/
│  │  │  └─ page.tsx                # Queue health heatmap
│  │  ├─ quality/
│  │  │  └─ page.tsx                # QA & coaching
│  │  ├─ trends/
│  │  │  └─ page.tsx                # Analytics & deflection
│  │  └─ alerts/
│  │     └─ page.tsx                # Surge/anomaly alerts
│  │
│  ├─ admin/
│  │  ├─ users/
│  │  │  └─ page.tsx                # User & role management
│  │  ├─ forms/
│  │  │  ├─ page.tsx                # Form list
│  │  │  └─ [id]/
│  │  │     └─ page.tsx             # Form builder (drag-drop JSON schema)
│  │  ├─ workflows/
│  │  │  ├─ page.tsx                # Workflow list
│  │  │  └─ [id]/
│  │  │     └─ page.tsx             # Workflow graph editor + dry-run
│  │  ├─ integrations/
│  │  │  └─ page.tsx                # Connector cards (OAuth mocked)
│  │  ├─ branding/
│  │  │  └─ page.tsx                # Logo, theme, domain config
│  │  ├─ audit/
│  │  │  └─ page.tsx                # Audit log viewer
│  │  └─ datalake/
│  │     └─ page.tsx                # Export scheduler
│  │
│  └─ km/
│     ├─ articles/
│     │  └─ page.tsx                # Article list (Draft/Review/Published)
│     ├─ editor/
│     │  └─ [id]/
│     │     └─ page.tsx             # Block-based article editor
│     ├─ reviews/
│     │  └─ page.tsx                # Review queue
│     └─ broadcasts/
│        └─ page.tsx                # Broadcast composer (announcements)
│
├─ api/
│  ├─ cases/
│  │  ├─ route.ts                   # GET (list), POST (create)
│  │  └─ [id]/
│  │     ├─ route.ts                # GET (detail), PATCH (update)
│  │     ├─ messages/route.ts       # POST (reply)
│  │     └─ assign/route.ts         # POST (assign agent)
│  ├─ inbox/
│  │  ├─ views/route.ts             # GET (saved filters)
│  │  └─ batch/route.ts             # POST (bulk actions)
│  ├─ queues/
│  │  ├─ route.ts                   # GET (all queues with counts)
│  │  └─ rebalance/route.ts         # POST (auto-assign logic)
│  ├─ manager/
│  │  ├─ overview/route.ts          # GET (snapshot metrics)
│  │  ├─ queues/route.ts            # GET (queue health)
│  │  ├─ trends/route.ts            # GET (time-series data)
│  │  └─ alerts/route.ts            # GET, PATCH (acknowledge)
│  ├─ admin/
│  │  ├─ forms/route.ts             # GET, POST (form schemas)
│  │  ├─ workflows/
│  │  │  ├─ route.ts                # GET, POST
│  │  │  └─ dryrun/route.ts         # POST (test eval)
│  │  ├─ users/route.ts             # GET, POST, PATCH
│  │  └─ audit/route.ts             # GET (log query)
│  ├─ km/
│  │  └─ articles/
│  │     ├─ route.ts                # GET, POST
│  │     └─ [id]/route.ts           # GET, PATCH, DELETE
│  ├─ ai/
│  │  ├─ chat/route.ts              # POST (student chatbot)
│  │  ├─ draft/route.ts             # POST (agent composer assist)
│  │  └─ classify/route.ts          # POST (intent + dept routing)
│  ├─ search/route.ts               # GET (global Cmd-K search)
│  └─ export/route.ts               # GET (CSV generation)
│
└─ globals.css
```

### 2.2 Navigation Structure

#### Public Navigation (unauthenticated)
```
┌─ Header ──────────────────────────────────┐
│ [Logo]  Help Center  |  Catalog  |  Chat │
│                          [Sign In Button] │
└───────────────────────────────────────────┘
```

#### Authenticated Navigation (Agent/Manager/Admin)
```
┌─ Sidebar ─────────┬─ Main Content ───────┐
│ [Logo]            │                       │
│                   │                       │
│ 🎫 Inbox          │  <Page Content>       │
│ 📋 Queues         │                       │
│ ✅ Approvals      │                       │
│ 📚 Knowledge      │                       │
│ 📊 My Reports     │                       │
│                   │                       │
│ ─────────────     │                       │
│ 👔 Manager        │ (if role=Manager)     │
│ ⚙️  Admin         │ (if role=Admin)       │
│ ✏️  Knowledge Mgmt│ (if role=KM)          │
│                   │                       │
│ ─────────────     │                       │
│ [Profile Menu]    │                       │
│ 🌙 Dark Mode      │                       │
│ 🌐 EN | AR        │                       │
└───────────────────┴───────────────────────┘
```

### 2.3 Route Guards & Redirects

| Route Pattern | Required Role | Redirect if Unauthorized |
|---------------|---------------|--------------------------|
| `/help/*`, `/catalog`, `/chat` | Public | — |
| `/requests` | Student | `/help` |
| `/inbox`, `/cases/*`, `/queues` | Agent, Manager, Admin | `/help` |
| `/manager/*` | Manager, Admin | `/inbox` |
| `/admin/*` | Admin | `/inbox` |
| `/km/*` | KM, Admin | `/inbox` |

**Protected route middleware** (middleware.ts):
```typescript
export function middleware(req: NextRequest) {
  const token = req.cookies.get('session')?.value;
  const role = parseRole(token); // stub: decode role from cookie

  if (req.nextUrl.pathname.startsWith('/manager') && !['Manager', 'Admin'].includes(role)) {
    return NextResponse.redirect(new URL('/inbox', req.url));
  }
  // ... repeat for /admin, /km
}
```

---

## 3. Design System

### 3.1 Design Tokens (Tailwind Config)

```javascript
// tailwind.config.ts excerpt
module.exports = {
  theme: {
    extend: {
      colors: {
        // CSS variables bound to light/dark themes
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // Semantic status colors
        success: "hsl(142 76% 36%)",
        warning: "hsl(38 92% 50%)",
        error: "hsl(0 84% 60%)",
        info: "hsl(199 89% 48%)",
        // SLA risk levels
        sla: {
          green: "hsl(142 76% 36%)",
          yellow: "hsl(45 93% 47%)",
          red: "hsl(0 84% 60%)",
        },
        // Department brand colors (used in badges, queue headers)
        dept: {
          admissions: "hsl(262 83% 58%)",
          finance: "hsl(142 71% 45%)",
          registrar: "hsl(221 83% 53%)",
          housing: "hsl(24 95% 53%)",
          it: "hsl(199 89% 48%)",
        },
      },
      spacing: {
        // 4px base grid
        0.5: "2px",
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        6: "24px",
        8: "32px",
        12: "48px",
        16: "64px",
      },
      borderRadius: {
        lg: "12px",
        md: "8px",
        sm: "4px",
      },
      fontSize: {
        xs: ["12px", { lineHeight: "16px" }],
        sm: ["14px", { lineHeight: "20px" }],
        base: ["16px", { lineHeight: "24px" }],
        lg: ["18px", { lineHeight: "28px" }],
        xl: ["20px", { lineHeight: "28px" }],
        "2xl": ["24px", { lineHeight: "32px" }],
        "3xl": ["30px", { lineHeight: "36px" }],
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
    },
  },
};
```

### 3.2 Component Primitives (shadcn/ui)

All UI built on these shadcn components:

| Primitive | Use Cases | Key Props |
|-----------|-----------|-----------|
| **Button** | Actions, form submits | `variant`: default, destructive, outline, ghost, link |
| **Card** | Metric tiles, case cards | — |
| **Table** | Inbox, queues, audit logs | Sortable headers, row selection |
| **Tabs** | Case workspace (Thread/Notes/Timeline), Settings | — |
| **Sheet** | Side panels (student 360, knowledge search) | `side`: left, right |
| **Dialog** | Modals (assign agent, close case confirmation) | — |
| **DropdownMenu** | Bulk actions, profile menu | — |
| **Command** | Global search (Cmd-K) | Indexed routes + cases + articles |
| **Badge** | Status chips, SLA risk, department tags | `variant`: default, secondary, destructive, outline |
| **Tooltip** | Icon buttons, truncated text hover | — |
| **Toast** | Success/error notifications | Position: bottom-right |
| **Alert** | Inline warnings (SLA breach, missing info) | `variant`: default, destructive |
| **Separator** | Visual dividers | `orientation`: horizontal, vertical |
| **Input**, **Textarea** | Forms | — |
| **Checkbox**, **Switch** | Preferences, multi-select | — |
| **Select** | Dropdowns (assign agent, department filter) | — |
| **Form** | Wraps react-hook-form + Zod validation | — |
| **Skeleton** | Loading states | — |

### 3.3 Layout Grid & Spacing

- **Base unit**: 4px (Tailwind's `space-1`)
- **Container max-width**: 1440px (`max-w-screen-2xl`)
- **Sidebar width**: 240px (fixed on desktop; drawer on mobile)
- **Gutter**: 24px (`px-6`)
- **Card padding**: 16px (`p-4`)
- **Section spacing**: 32px (`space-y-8`)

**Responsive breakpoints**:
```typescript
const breakpoints = {
  sm: '640px',   // mobile landscape
  md: '768px',   // tablet
  lg: '1024px',  // laptop
  xl: '1280px',  // desktop
  '2xl': '1440px' // wide desktop
};
```

### 3.4 Motion & Transitions

**Framer Motion** for:
- Page transitions (fade + slide 200ms ease-out)
- Sheet/Dialog enter/exit (slide 150ms)
- Dropdown menus (scale + opacity 100ms)
- Toast notifications (slide-in-right 200ms, auto-dismiss 5s)

**CSS transitions** for:
- Hover states (150ms ease)
- Focus rings (100ms ease)
- Button active states (50ms ease)

**Reduced motion**:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 3.5 Typography Scale

```css
:root {
  --font-inter: 'Inter', sans-serif; /* variable font */
  --font-jetbrains-mono: 'JetBrains Mono', monospace;
}

.text-display {
  font-size: 30px;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.text-heading {
  font-size: 24px;
  font-weight: 600;
}

.text-subheading {
  font-size: 18px;
  font-weight: 500;
}

.text-body {
  font-size: 16px;
  font-weight: 400;
  line-height: 1.5;
}

.text-label {
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.01em;
}

.text-caption {
  font-size: 12px;
  font-weight: 400;
  color: hsl(var(--muted-foreground));
}
```

### 3.6 Iconography

**Library**: `lucide-react` (tree-shakeable, 24×24 default)

**Conventions**:
- Status icons: CheckCircle2 (success), AlertCircle (warning), XCircle (error), Info (info)
- Navigation: Home, Inbox, LayoutGrid (queues), CheckSquare (approvals), BookOpen (KB), BarChart3 (reports), Settings (admin)
- Actions: Send, Edit3, Trash2, MoreHorizontal, RefreshCw, Download, Upload
- RTL mirroring: ArrowLeft ↔ ArrowRight, ChevronLeft ↔ ChevronRight (handled by CSS `transform: scaleX(-1)`)

### 3.7 Micro-Interactions

| Interaction | Pattern | Implementation |
|-------------|---------|----------------|
| **Optimistic Updates** | Add message to thread immediately; show spinner badge; remove on success | Zustand store + rollback on error |
| **Inline Edits** | Double-click text → contentEditable; Esc to cancel, Enter to save | `<EditableText>` component |
| **Drag-Drop** | Queue kanban cards; hover shows drop zone highlight | `@dnd-kit/core` + accessible fallback buttons |
| **Bulk Selection** | Checkbox column; sticky header row actions bar slides in | Table state in Zustand |
| **Toast Stacking** | Max 3 visible; queue older; auto-dismiss 5s unless error | shadcn Toast + Sonner library |
| **Skeleton Loading** | Replace content with skeleton matching layout (table rows, cards) | Suspend + Skeleton components |
| **Empty States** | Illustration + primary action button + secondary link | `<EmptyState>` component |

### 3.8 RTL (Right-to-Left) Support

**Directionality**:
```typescript
// app/layout.tsx
export default function RootLayout({ children }: { children: React.Node }) {
  const locale = useLocale(); // 'en' | 'ar'
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir}>
      <body className={cn(inter.variable, dir === 'rtl' && 'font-arabic')}>
        {children}
      </body>
    </html>
  );
}
```

**CSS for RTL**:
```css
[dir="rtl"] {
  /* Flip layout */
  .sidebar { left: auto; right: 0; }
  .sheet-right { left: 0; right: auto; }

  /* Mirror icons */
  .icon-directional { transform: scaleX(-1); }

  /* Text alignment */
  text-align: right;
}

/* Logical properties (preferred) */
.card {
  padding-inline-start: 16px;
  padding-inline-end: 16px;
  margin-inline-start: auto;
}
```

**Number & Date Formatting**:
```typescript
const formatNumber = (num: number, locale: string) =>
  new Intl.NumberFormat(locale).format(num);

const formatDate = (date: Date, locale: string) =>
  new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);

// Arabic: ٢٠٢٥/١٠/٣٠ ٣:٤٥ م
// English: Oct 30, 2025, 3:45 PM
```

**Font stacks**:
```css
:root {
  --font-arabic: 'Noto Sans Arabic', 'Tajawal', sans-serif;
}
```

### 3.9 Accessibility (a11y) Standards

**WCAG 2.1 AA compliance** targets:

| Criterion | Implementation |
|-----------|----------------|
| **Color Contrast** | 4.5:1 for body text, 3:1 for large text; verified via `@axe-core/react` |
| **Keyboard Navigation** | All interactive elements focusable; Tab order logical; focus visible (2px ring) |
| **Focus Trapping** | Dialogs/Sheets trap focus; Esc to close |
| **Screen Readers** | Semantic HTML (`<nav>`, `<main>`, `<article>`); `aria-label` for icon buttons; `aria-live` for toasts/new messages |
| **Forms** | Labels explicitly bound (`htmlFor`); error messages linked via `aria-describedby` |
| **Images** | Alt text for all images; decorative images `alt=""` |
| **Tables** | `<th scope="col">` for headers; row selection announced |
| **Motion** | Respect `prefers-reduced-motion` |

**Keyboard shortcuts** (registered globally via `useHotkeys`):
- `Cmd/Ctrl-K`: Global search
- `Cmd/Ctrl-/`: Shortcut help dialog
- `Inbox`: `A` (assign), `M` (macro), `E` (escalate), `J/K` (next/prev row)
- `Case`: `Cmd-Enter` (send message), `Shift-Enter` (newline in composer), `I` (toggle internal note)

---

## 4. Data Model

### 4.1 Core Entities (Conceptual Schema)

#### User
```typescript
interface User {
  id: string;                    // UUID
  email: string;
  name: string;
  role: 'Student' | 'Agent' | 'Manager' | 'Admin' | 'KM';
  departments?: Department[];    // for Agents/Managers
  skills?: Skill[];              // for Agents
  locale: 'en' | 'ar';
  timezone: string;              // IANA tz
  avatarUrl?: string;
  createdAt: Date;
  lastLoginAt?: Date;
}
```

#### StudentProfile
```typescript
interface StudentProfile {
  id: string;                    // same as User.id
  studentId: string;             // e.g., "S2025001234"
  program: string;               // "Computer Science, BS"
  term: string;                  // "Fall 2025"
  status: 'Applicant' | 'Enrolled' | 'Graduated' | 'Withdrawn';
  holds: Hold[];
  balance: number;               // USD cents
  documents: Document[];
  applications: Application[];
}

interface Hold {
  type: 'Financial' | 'Academic' | 'Disciplinary' | 'Registration';
  reason: string;
  placedAt: Date;
  releasedAt?: Date;
}

interface Document {
  type: 'Transcript' | 'Tax Form' | 'ID' | 'Recommendation' | 'Other';
  status: 'Pending' | 'Received' | 'Verified' | 'Rejected';
  uploadedAt?: Date;
  reviewedAt?: Date;
}
```

#### Case
```typescript
interface Case {
  id: string;                    // "CASE-20251030-0042"
  studentId: string;
  department: Department;
  queue: QueueId;
  channel: 'Chat' | 'Email' | 'Phone' | 'Form' | 'Walk-in';
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  status: 'New' | 'Open' | 'Waiting' | 'Resolved' | 'Closed';
  subject: string;               // auto-generated or user-entered
  summary?: string;              // AI-generated on creation
  assignee?: string;             // User.id
  tags: string[];
  sla: SLA;
  relatedEntities: RelatedEntity[]; // linked invoices, applications, etc.
  createdAt: Date;
  updatedAt: Date;
  firstReplyAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
}

interface SLA {
  firstResponseDueAt: Date;
  resolutionDueAt: Date;
  riskLevel: 'green' | 'yellow' | 'red'; // <50%, 50-80%, >80% elapsed
  breached: boolean;
}

interface RelatedEntity {
  type: 'Invoice' | 'Application' | 'Transcript Request' | 'Housing Contract';
  id: string;
  label: string;                 // "Invoice #INV-2025-10-001"
}
```

#### Message
```typescript
interface Message {
  id: string;
  caseId: string;
  authorId: string;
  authorRole: 'Student' | 'Agent' | 'System';
  channel: Case['channel'];
  body: string;                  // markdown-formatted
  attachments: Attachment[];
  isInternalNote: boolean;       // only visible to Agent/Manager/Admin
  aiGenerated: boolean;          // flag for AI drafts
  citations?: Citation[];        // KB article links
  createdAt: Date;
}

interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  url: string;                   // presigned S3 URL (mocked)
}

interface Citation {
  articleId: string;
  articleTitle: string;
  snippetText: string;
  url: string;                   // /help/[slug]#section
}
```

#### Queue
```typescript
interface Queue {
  id: string;                    // "admissions:primary"
  department: Department;
  name: string;                  // "Admissions - Primary Intake"
  type: 'Primary' | 'Priority' | 'Approval';
  skills: Skill[];
  wipLimit: number;              // triggers rebalancing alert
  slaPolicy: SLAPolicy;
  itemCount: number;             // real-time count
  oldestItemAge?: number;        // minutes
}

interface SLAPolicy {
  firstResponseMinutes: number;  // e.g., 120 (2h)
  resolutionMinutes: number;     // e.g., 1440 (24h)
  priorityMultiplier: number;    // 0.5 for urgent
}
```

#### Article (Knowledge Base)
```typescript
interface Article {
  id: string;
  slug: string;                  // URL-safe, e.g., "payment-plans-overview"
  title: string;
  locale: 'en' | 'ar';
  status: 'Draft' | 'Review' | 'Published' | 'Archived';
  blocks: ContentBlock[];        // rich content (headings, paragraphs, lists, callouts)
  tags: string[];
  department?: Department;
  authorId: string;
  reviewerId?: string;
  publishedAt?: Date;
  updatedAt: Date;
  viewCount: number;
  helpfulVotes: number;
  unhelpfulVotes: number;
  freshnessDeadline?: Date;      // SLA for review
}

interface ContentBlock {
  type: 'heading' | 'paragraph' | 'list' | 'callout' | 'code' | 'table';
  content: string | object;      // markdown or structured data
  id: string;                    // for anchor links
}
```

#### FormSchema
```typescript
interface FormSchema {
  id: string;
  serviceId: string;             // links to Service Catalog
  version: number;
  name: string;                  // "Payment Plan Request"
  department: Department;
  fields: FormField[];
  validations: ValidationRule[];
  visibilityRules: VisibilityRule[];
  createdAt: Date;
  publishedAt?: Date;
}

interface FormField {
  id: string;
  type: 'text' | 'email' | 'number' | 'date' | 'select' | 'textarea' | 'file';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: { value: string; label: string }[]; // for select
  validation?: string;           // Zod schema snippet (JSON-serialized)
}

interface ValidationRule {
  fieldId: string;
  rule: 'required' | 'email' | 'min' | 'max' | 'regex';
  params?: any;
  message: string;
}

interface VisibilityRule {
  fieldId: string;               // target field to show/hide
  condition: {
    watchFieldId: string;
    operator: '==' | '!=' | '>' | '<';
    value: any;
  };
}
```

#### Workflow
```typescript
interface Workflow {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  version: number;
  trigger: TriggerNode;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: Date;
  publishedAt?: Date;
}

type WorkflowNode =
  | TriggerNode
  | ConditionNode
  | ActionNode;

interface TriggerNode {
  type: 'trigger';
  event: 'case:created' | 'case:updated' | 'case:message_added' | 'scheduled';
  filters?: Record<string, any>; // e.g., { department: 'Finance' }
}

interface ConditionNode {
  type: 'condition';
  logic: 'AND' | 'OR';
  rules: {
    field: string;               // e.g., "case.balance"
    operator: '==' | '!=' | '>' | '<' | 'contains';
    value: any;
  }[];
}

interface ActionNode {
  type: 'action';
  action: 'route_to_queue' | 'assign_agent' | 'set_priority' | 'request_document' | 'send_macro' | 'notify_manager';
  params: Record<string, any>;
}

interface WorkflowEdge {
  from: string;                  // node ID
  to: string;
  condition?: 'true' | 'false';  // for condition branches
}
```

### 4.2 API Boundary Contracts (REST-ish)

All endpoints return:
```typescript
interface APIResponse<T> {
  data?: T;
  error?: { code: string; message: string; details?: any };
  meta?: { total?: number; page?: number; perPage?: number };
}
```

**Example: GET /api/cases**
```typescript
// Request
GET /api/cases?department=Finance&status=Open&page=1&perPage=50

// Response
{
  "data": Case[],
  "meta": { "total": 127, "page": 1, "perPage": 50 }
}
```

**Example: POST /api/cases**
```typescript
// Request
POST /api/cases
{
  "studentId": "S2025001234",
  "department": "Finance",
  "channel": "Chat",
  "subject": "Payment plan inquiry",
  "summary": "Student asking about 3-month payment plan eligibility for $2,400 balance.",
  "relatedEntities": [
    { "type": "Invoice", "id": "INV-2025-10-001", "label": "Fall 2025 Tuition" }
  ],
  "conversationTranscript": [...] // from AI chat
}

// Response
{
  "data": {
    "id": "CASE-20251030-0042",
    "status": "New",
    "sla": {
      "firstResponseDueAt": "2025-10-30T17:30:00Z",
      "resolutionDueAt": "2025-10-31T15:30:00Z",
      "riskLevel": "green",
      "breached": false
    },
    ...
  }
}
```

**Example: POST /api/ai/chat**
```typescript
// Request
POST /api/ai/chat
{
  "studentId": "S2025001234",
  "conversationHistory": [
    { "role": "user", "content": "أريد خطة دفع" },
    { "role": "assistant", "content": "..." }
  ],
  "message": "هل يمكنني تقسيم ٢٤٠٠ دولار على ٣ أشهر؟"
}

// Response (mocked)
{
  "data": {
    "reply": "نعم، يمكنك التقدم بطلب خطة دفع لمدة 3 أشهر. وفقًا لسياستنا...",
    "confidence": 0.92,
    "citations": [
      {
        "articleId": "art_payment_plans",
        "articleTitle": "Payment Plans Overview",
        "snippetText": "Students with balances over $1,000 may request...",
        "url": "/help/payment-plans-overview#eligibility"
      }
    ],
    "suggestedActions": [
      {
        "type": "start_payment_plan",
        "label": "Start Payment Plan Request",
        "params": { "balance": 2400, "months": 3 }
      }
    ],
    "escalate": false
  }
}
```

### 4.3 State Management (Zustand Stores)

**App-wide stores**:
- `useAuthStore`: current user, role, departments, logout
- `useUIStore`: sidebar collapsed, theme (light/dark), locale (en/ar), global search open
- `useCaseStore`: active case detail, optimistic message queue, draft state
- `useInboxStore`: filters, saved views, selected rows, bulk action state
- `useNotificationStore`: toast queue, unread counts

Example:
```typescript
// store/useAuthStore.ts
interface AuthState {
  user: User | null;
  role: Role | null;
  departments: Department[];
  login: (email: string, role: Role) => void; // stub
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  departments: [],
  login: (email, role) => {
    // Mock: fetch user profile, set cookie
    set({ user: mockUsers.find(u => u.email === email), role });
  },
  logout: () => {
    set({ user: null, role: null, departments: [] });
  },
}));
```

---

## 5. Student/Public Surfaces

### 5.1 Pages & Routes

#### "/" - Help Center Landing
- **Purpose**: Entry point for student self-service
- **Components**:
  - Hero section with search bar (global KB search)
  - Top 6 popular articles (analytics-driven)
  - Quick links to service catalog
  - Language toggle (en/ar)
  - Recent announcements banner (max 3)
- **Route**: `/` (public)
- **Data**: `GET /kb?featured=true`, `GET /announcements?limit=3`

#### "/kb" - Knowledge Base Browse
- **Purpose**: Searchable, filterable article library
- **Components**:
  - Search input (debounced 300ms)
  - Filters: category, department, tags
  - Sort: relevance, date, views
  - Article grid/list toggle
  - Pagination (20/page)
- **Route**: `/kb` (public)
- **Data**: `GET /kb?q={query}&category={cat}&dept={dept}&page={n}`

#### "/kb/[articleId]" - Article Detail
- **Purpose**: Full article view with helpful/not-helpful feedback
- **Components**:
  - Article metadata (author, updated date, views)
  - Rich text content (supports images, videos, code blocks)
  - "Was this helpful?" Y/N buttons
  - Related articles (3-5)
  - Breadcrumb navigation
  - "Still need help?" → Service catalog CTA
- **Route**: `/kb/:articleId` (public)
- **Data**: `GET /kb/:articleId`, `POST /kb/:articleId/feedback`

#### "/catalog" - Service Catalog
- **Purpose**: Browse & submit service requests by department
- **Components**:
  - Department tabs (Admissions, Finance, Registrar, IT, Other)
  - Service cards with description & est. response time
  - Search within catalog
  - Request form modal/page (dynamic fields per service)
- **Route**: `/catalog` (public)
- **Data**: `GET /catalog?dept={dept}`

#### "/request/[id]" - Request Status Tracking
- **Purpose**: Track submitted request lifecycle
- **Components**:
  - Status timeline (Submitted → In Progress → Resolved)
  - Request details (read-only)
  - Agent notes (public-facing only)
  - Reopen button (if resolved <7 days)
  - Email confirmation link entry (for anonymous tracking)
- **Route**: `/request/:id?token={token}` (public with token)
- **Data**: `GET /request/:id`, `PATCH /request/:id/reopen`

#### "/chat" - Student Assistant (STUB)
- **Purpose**: PLACEHOLDER UI frame for future AI chatbot
- **Components**:
  - Chat bubble UI (greyed out / disabled input)
  - Placeholder message: "Chat assistant coming soon"
  - **Escalate to Ticket** button (active) → opens catalog form with pre-filled context
  - Disclaimer: "For immediate help, visit /kb or /catalog"
- **Route**: `/chat` (public)
- **Data**: `POST /chat/escalate` (creates ticket)
- **Note**: NO bot logic, NO message streaming—UI shell only

---

### 5.2 Core Flows

#### Flow A: Search → Read → Self-Solve
1. Student lands on `/` or `/kb`
2. Searches "how to pay tuition"
3. Clicks article "Tuition Payment Methods"
4. Reads content
5. Clicks "Helpful" → analytics event fired
6. Exits or browses related articles

#### Flow B: Browse → Catalog → Submit Request
1. Student visits `/catalog`
2. Selects "Finance" tab
3. Clicks "Tuition Payment Plan" service card
4. Fills dynamic form (name, email, student ID, reason, amount)
5. Submits → `POST /request` → receives ticket ID & email confirmation
6. Redirected to `/request/:id` status page

#### Flow C: Missing Info Request Loop
1. Agent marks ticket "Awaiting Student Info"
2. System sends email/SMS (placeholder stubs: log to console + MSW intercept)
3. Email contains link: `/request/:id?token={uuid}`
4. Student clicks link, sees form to add info
5. Submits → ticket status → "In Progress"
6. Agent receives notification (stub)

#### Flow D: Escalate from Chat Stub
1. Student visits `/chat`
2. Clicks "Escalate to Ticket" button
3. Modal opens with pre-filled context: "Student requested help via chat"
4. Student selects department & service, adds details
5. Submits → `POST /chat/escalate` → creates ticket
6. Redirected to `/request/:id`

---

### 5.3 Validation & Forms

#### Reusable Form Field Patterns
```typescript
// Schema-driven validation (Zod)
export const StudentRequestSchema = z.object({
  name: z.string().min(2, "Name required").max(100),
  email: z.string().email("Invalid email"),
  studentId: z.string().regex(/^S\d{7}$/, "Format: S1234567").optional(),
  department: z.enum(["Admissions", "Finance", "Registrar", "IT", "Other"]),
  serviceId: z.string().uuid(),
  description: z.string().min(10, "Min 10 chars").max(2000),
  attachments: z.array(z.instanceof(File)).max(3, "Max 3 files"),
  consent: z.boolean().refine(val => val === true, "Consent required")
});
```

#### Department-Specific Templates
- **Admissions**: name, email, program, term, transcript (file)
- **Finance**: name, email, studentId, amount, paymentMethod, reason
- **Registrar**: name, email, studentId, courseCode, semester, requestType
- **Other**: name, email, category (dropdown), description

---

### 5.4 Accessibility & Mobile

#### A11y Rules
- All interactive elements: `aria-label` or visible text
- Form fields: associated `<label>` or `aria-labelledby`
- Color contrast ratio ≥ 4.5:1 (WCAG AA)
- Focus visible: `ring-2 ring-offset-2 ring-blue-500`
- Keyboard nav: Tab order logical, Enter/Space activate buttons
- Screen reader: semantic HTML (`<main>`, `<nav>`, `<article>`)
- Skip to main content link (visually hidden, keyboard visible)

#### Mobile Breakpoints
- **sm**: 640px (single column, larger touch targets 44×44px)
- **md**: 768px (2-col grid for articles/services)
- **lg**: 1024px (3-col, sidebar filters)
- Hamburger menu for nav <768px
- Fixed bottom CTA bar on mobile catalog

---

### 5.5 i18n & RTL

#### Language Toggle
- Dropdown in header: English | العربية
- Sets cookie `locale=en|ar`
- Reloads page or updates context (Next.js i18n routing)

#### RTL Layout Rules
```css
/* Tailwind RTL plugin */
html[dir="rtl"] .text-left { text-align: right; }
html[dir="rtl"] .ml-4 { margin-right: 1rem; margin-left: 0; }
/* Use logical properties where possible */
.padding-inline-start { /* auto-flips */ }
```

#### Sample i18n Keys (en)
```json
{
  "nav.home": "Home",
  "nav.kb": "Knowledge Base",
  "nav.catalog": "Service Catalog",
  "search.placeholder": "Search for help...",
  "article.helpful": "Was this helpful?",
  "form.submit": "Submit Request",
  "form.required": "Required field",
  "ticket.status.submitted": "Submitted",
  "ticket.status.inProgress": "In Progress",
  "ticket.status.resolved": "Resolved",
  "chat.placeholder": "Chat assistant coming soon",
  "chat.escalate": "Create Ticket Instead",
  "error.network": "Network error. Please try again.",
  "success.submitted": "Request submitted successfully!",
  "catalog.dept.admissions": "Admissions",
  "catalog.dept.finance": "Finance",
  "catalog.dept.registrar": "Registrar",
  "catalog.dept.it": "IT Support",
  "catalog.dept.other": "Other"
}
```

#### Sample i18n Keys (ar) - Representative Only
```json
{
  "nav.home": "الرئيسية",
  "nav.kb": "قاعدة المعرفة",
  "nav.catalog": "كتالوج الخدمات",
  "search.placeholder": "ابحث عن مساعدة...",
  "article.helpful": "هل كان هذا مفيداً؟",
  "form.submit": "إرسال الطلب",
  "form.required": "حقل مطلوب",
  "ticket.status.submitted": "تم الإرسال",
  "ticket.status.inProgress": "قيد المعالجة",
  "ticket.status.resolved": "تم الحل"
}
```

---

### 5.6 Acceptance Criteria

#### "/" - Help Center Landing
- [ ] Search bar visible, functional (debounced, hits `GET /kb`)
- [ ] Top 6 featured articles display with titles, summaries
- [ ] Language toggle switches between en/ar, updates UI
- [ ] Announcements banner shows max 3 items
- [ ] Mobile: single column, touch-friendly targets

#### "/kb" - Knowledge Base
- [ ] Search returns filtered results within 500ms (MSW delay)
- [ ] Filters (category, dept) update results without page reload
- [ ] Pagination works, shows "Page X of Y"
- [ ] Article cards clickable → navigate to `/kb/:id`
- [ ] Keyboard navigable, screen reader announces result count

#### "/kb/[articleId]" - Article Detail
- [ ] Article content renders (headings, lists, images)
- [ ] "Helpful" buttons fire analytics event (console log)
- [ ] Related articles display (3-5)
- [ ] Breadcrumb shows Home > KB > Category > Article
- [ ] CTA "Still need help?" links to `/catalog`

#### "/catalog" - Service Catalog
- [ ] Department tabs switch content without reload
- [ ] Service cards show title, description, est. time
- [ ] Clicking service opens request form (modal or page)
- [ ] Form validates (Zod schema), shows inline errors
- [ ] Submit creates ticket, redirects to `/request/:id`

#### "/request/[id]" - Status Tracking
- [ ] Timeline shows current status with visual indicator
- [ ] Request details display (read-only)
- [ ] Reopen button visible if status=Resolved & <7 days
- [ ] Token-based access works (no auth required)
- [ ] Mobile: vertical timeline, collapsible details

#### "/chat" - Assistant Stub
- [ ] UI frame renders (chat bubbles, input disabled)
- [ ] Placeholder message displays
- [ ] "Escalate to Ticket" button opens catalog form
- [ ] Form pre-fills context: "Escalated from chat"
- [ ] Submit creates ticket via `POST /chat/escalate`

---

[END PART 1/6]
