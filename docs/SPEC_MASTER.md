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

## 9. Inbox & Queue Management

### 9.1 Layout Blueprint

**Screen zones** (desktop, 1440px viewport):

```
┌─ Saved Views (32px height) ──────────────────────────────────────┐
│ [All Cases] [My Open] [SLA Reds] [+ New View]          [Search] │
├─ Filter Bar (48px height) ───────────────────────────────────────┤
│ Dept: [All ▾] Status: [Open ▾] Priority: [All ▾] SLA: [All ▾]   │
│ Channel: [All ▾] Tags: [Filter...] Owner: [Me ▾] Date: [7d ▾]   │
├─ Table Header (40px) ─────────────────────────────────────────────┤
│ [☐] Dept | Subject | Student | Priority | SLA Due | Status | ... │
├─ Table Body (virtualized, ~700px) ───────────────────────────────┤
│ [☐] FIN | Payment plan req... | Ahmed Ali | High | 2h 15m | ... │
│ [☐] ADM | Transcript missing | Sara K. | Normal | 1d 3h | ...   │
│ ... (50 rows per page, virtualized if >200 visible)              │
├─ Pagination (48px) ───────────────────────────────────────────────┤
│ Showing 1-50 of 2,143        [< Prev] Page 1 of 43 [Next >]     │
└───────────────────────────────────────────────────────────────────┘

[Bulk Action Bar - slides up when rows selected] (56px height, sticky bottom)
│ 3 selected   [Assign] [Set Status] [Set Priority] [Add Tag] [Merge] [More ▾] │
```

**Components**:
- `<Table>` (shadcn/ui) with `role="table"`, sortable headers
- `<Badge>` for dept chips (dept colors from §3), status, priority, SLA risk
- `<Checkbox>` column for bulk selection (`aria-label="Select case {ticketNumber}"`)
- `<DropdownMenu>` row overflow (3-dot icon, right-aligned)
- `<Sheet>` for filter panel (mobile) or inline filter bar (desktop)
- `<Command>` for saved view switcher (Cmd-K style)
- `<Tooltip>` on SLA badges showing policy details

**Density**: Compact (32px row height), comfortable (40px), spacious (48px) - user preference saved to Zustand.

**Columns** (configurable, user can hide/reorder):
1. Select (32px) - checkbox
2. Dept (64px) - badge with icon
3. Subject (300px) - truncate with tooltip
4. Student (120px) - name, hover shows email
5. Priority (80px) - badge with icon
6. SLA Due (100px) - countdown + risk color
7. Status (100px) - badge
8. Assignee (100px) - avatar + name or "Unassigned"
9. Updated (100px) - relative time (e.g., "2h ago")
10. Actions (40px) - overflow menu

---

### 9.2 Filters & Saved Views

#### Query Serialization
URL search params encode active filters:
```
/inbox?dept=Finance&status=Open&priority=High&sla=red&owner=me&page=1
```

**Zod schema**:
```typescript
const InboxFiltersSchema = z.object({
  dept: z.enum(["All", "Admissions", "Finance", "Registrar", "Housing", "IT"]).default("All"),
  status: z.enum(["All", "New", "Open", "Waiting", "Resolved", "Closed"]).default("All"),
  priority: z.enum(["All", "Low", "Normal", "High", "Urgent"]).default("All"),
  slaRisk: z.enum(["All", "green", "yellow", "red"]).default("All"),
  channel: z.enum(["All", "Chat", "Email", "Phone", "Form", "Walk-in"]).default("All"),
  tags: z.array(z.string()).default([]),
  owner: z.enum(["All", "me", "unassigned"]).or(z.string()).default("All"), // user ID
  dateRange: z.enum(["7d", "30d", "90d", "all"]).default("7d"),
  page: z.number().int().positive().default(1),
  sort: z.enum(["sla_asc", "updated_desc", "priority_desc"]).default("sla_asc")
});
```

#### Saved View Schema
```typescript
interface SavedView {
  id: string;
  name: string;
  filters: z.infer<typeof InboxFiltersSchema>;
  columns: string[]; // column IDs to show
  isDefault: boolean;
  userId: string;
  createdAt: string;
}
```

**Default views per role**:
- Agent: "My Open Cases" (owner=me, status=Open), "Today's SLA Reds" (slaRisk=red, dateRange=7d)
- Manager: "Dept Overview" (dept=myDept, status!=Closed), "Unassigned High Priority" (owner=unassigned, priority=High|Urgent)

**CRUD**:
- Create: Click "+ New View", modal captures name + saves current filters
- Update: Edit icon on view chip → modal
- Delete: Trash icon (confirm dialog if default)
- Set default: Star icon (one per user)

**Example views**:
```typescript
const exampleViews: SavedView[] = [
  {
    id: "view-001",
    name: "Today's SLA Reds",
    filters: { slaRisk: "red", status: "Open", dateRange: "7d", page: 1, sort: "sla_asc" },
    columns: ["dept", "subject", "student", "sla", "assignee"],
    isDefault: false,
    userId: "agent-001",
    createdAt: "2025-01-20T10:00:00Z"
  },
  {
    id: "view-002",
    name: "Admissions: Docs Pending",
    filters: { dept: "Admissions", tags: ["documents_pending"], status: "Waiting", page: 1 },
    columns: ["subject", "student", "updated", "assignee"],
    isDefault: true,
    userId: "agent-002",
    createdAt: "2025-01-18T09:00:00Z"
  }
];
```

---

### 9.3 Bulk Actions

**Available actions** (shown when ≥1 row selected):
1. **Assign** → modal with agent dropdown (filtered by dept + skills), shows current workload
2. **Set Status** → dropdown (New/Open/Waiting/Resolved/Closed), if "Waiting" requires reason input
3. **Set Priority** → dropdown (Low/Normal/High/Urgent)
4. **Add Tag** → tag input (autocomplete from existing tags)
5. **Merge Cases** → multi-step wizard (select source of truth, preview consolidated timeline)
6. **Split Thread** → select message range → creates new case
7. **Request Missing Info** → macro dropdown, sends template email

**Optimistic updates**:
- UI immediately reflects changes (status badge color, assignee avatar)
- Show spinner badge on affected rows
- On success: toast "3 cases updated"
- On error: rollback + toast "Failed to update 3 cases. Retry?"

**Permissions**:
- Agents: can assign to self or dept peers; cannot set Closed status
- Managers: can assign to any agent; can override SLA
- Admins: unrestricted

**State transitions** (bulk):
```
Idle → BulkSelected (≥1 row checked)
BulkSelected → ActionPending (API call in flight)
ActionPending → Success (toast, deselect) | Error (rollback, show errors)
```

---

### 9.4 Merge / Split Semantics

#### Merge Cases
**Use case**: Student submitted duplicate requests (e.g., two payment plan tickets)

**Flow**:
1. Select 2+ cases → click "Merge" → wizard opens
2. Step 1: Choose source of truth (primary case) - others become children
3. Step 2: Preview consolidated timeline (all messages + events in chronological order)
4. Step 3: Confirm → API merges

**Source of truth rules**:
- Primary case retains ID, ticket number, created date
- Child cases marked `status: "Merged"`, `mergedInto: primaryCaseId`
- Timeline: all messages from children appended with header `[From TKT-20250042]`
- Tags: union of all tags
- Assignee: primary case assignee preserved
- SLA: recalculate from primary case creation (most conservative)

**Audit events generated**:
```typescript
{
  type: "case.merged",
  caseId: "CASE-001",
  mergedCases: ["CASE-042", "CASE-043"],
  performedBy: "agent-005",
  timestamp: "2025-01-30T14:00:00Z"
}
```

**Rollback strategy**:
- Undo button in toast (30s window)
- Restores child cases to prior status
- Removes merged timeline entries
- Logs `case.merge_undone` audit event

#### Split Thread
**Use case**: Case contains two unrelated topics (e.g., payment plan + transcript request)

**Flow**:
1. Open case → Timeline tab → select message range (checkboxes on left)
2. Click "Split to New Case" → modal
3. Choose department for new case → auto-subject from first message
4. Confirm → creates new case, moves selected messages, links cases as "Related"

**Linking rules**:
- Original case: add timeline event `Messages 3-5 split to TKT-20250099`
- New case: add timeline event `Split from TKT-20250001`
- Both cases show in Related sidebar

**No rollback** (warn user in confirmation dialog)

---

### 9.5 SLA Visuals

**SLA Badge** (shown in table + case header):
```tsx
<Badge variant={slaRiskColor} className="font-mono">
  <Clock className="h-3 w-3" />
  {countdown} {/* e.g., "2h 15m" or "OVERDUE 3h" */}
</Badge>
```

**Risk levels** (from §3 design tokens):
- `green`: <50% elapsed (bg-sla-green)
- `yellow`: 50-80% elapsed (bg-sla-yellow, pulse animation)
- `red`: >80% elapsed or breached (bg-sla-red, urgent pulse)

**Tooltip content**:
```
First Response Due: Jan 30, 2025 5:30 PM
Resolution Due: Jan 31, 2025 5:30 PM
Policy: Finance Standard (2h / 24h)
Risk: HIGH (87% elapsed)
```

**At-risk prediction column** (optional, ML stub):
- Boolean pill: "At Risk" (orange) if predicted to breach based on queue depth + agent velocity
- Tooltip: "Predicted breach in 4h based on current queue load"

**SLA actions** (overflow menu):
- Pause SLA (sets status to "Waiting", requires reason)
- Resume SLA (recalculates due time)
- Override SLA (Manager/Admin only, extends deadline, logs audit event)

---

### 9.6 Keyboard Map

**Navigation**:
- `J` / `K` - Next / Previous row (highlights, scrolls into view)
- `G` then `G` - Go to top
- `Shift-G` - Go to bottom
- `Enter` - Open selected case in new tab
- `G` - Open selected case in current tab

**Selection**:
- `X` - Toggle checkbox on highlighted row
- `Shift-X` - Select range from last selected to current
- `Ctrl-A` - Select all visible rows
- `Esc` - Deselect all

**Actions** (require ≥1 selection):
- `A` - Assign modal
- `M` - Macro dropdown (bulk)
- `E` - Escalate (set priority to Urgent)
- `S` - Set status dropdown
- `T` - Add tag input

**Other**:
- `/` - Focus search input
- `?` - Show keyboard shortcuts help dialog
- `R` - Refresh table (re-fetches)

**Conflict resolution**:
- `J/K` disabled when modal/dropdown open
- `Enter` in search input triggers search, not case open
- Cmd/Ctrl modifiers for browser defaults preserved

---

### 9.7 State Machine

```mermaid
stateDiagram-v2
    [*] --> Loading
    Loading --> Interactive: Data loaded
    Loading --> Error: Fetch failed
    Error --> Loading: Retry

    Interactive --> Selecting: Check row
    Selecting --> BulkActionsVisible: ≥1 selected
    BulkActionsVisible --> ActionPending: Click action
    ActionPending --> Success: API success
    ActionPending --> ActionError: API fail
    Success --> Interactive: Deselect + toast
    ActionError --> BulkActionsVisible: Show error, keep selection

    Interactive --> Filtering: Change filter
    Filtering --> Loading: Debounce 250ms

    Interactive --> Sorting: Click column header
    Sorting --> Loading: Immediate
```

**State storage** (Zustand):
```typescript
interface InboxState {
  filters: InboxFilters;
  selectedRows: Set<string>; // case IDs
  highlightedRow: string | null;
  bulkActionPending: boolean;
  lastAction: { type: string; caseIds: string[] } | null; // for undo
  density: "compact" | "comfortable" | "spacious";
  visibleColumns: string[];
}
```

---

### 9.8 Pagination & Performance

**Server-side pagination**:
- Default: 50 rows per page
- Max: 100 rows per page
- Response includes `meta: { total, page, pages }`

**Client virtualization**:
- Use `@tanstack/react-virtual` when >200 visible rows
- Render only visible rows + 10 overscan
- Row height fixed per density setting (32/40/48px)

**Filter debounce**:
- Text inputs: 250ms
- Dropdowns: immediate
- URL updates on debounce end (allows back button)

**Optimizations**:
- Memoize row components with `React.memo`
- Virtualize checkbox column separately (common re-render hotspot)
- Prefetch next page on scroll to 80% (cache in React Query)

---

### 9.9 Error / Empty / Skeleton States

**Loading skeleton**:
```tsx
<Table>
  <TableHeader>...</TableHeader>
  <TableBody>
    {[...Array(10)].map((_, i) => (
      <TableRow key={i}>
        <TableCell><Skeleton className="h-4 w-4" /></TableCell>
        <TableCell><Skeleton className="h-5 w-12" /></TableCell>
        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
        ...
      </TableRow>
    ))}
  </TableBody>
</Table>
```

**Empty states**:
- No cases match filters:
  ```
  Icon: 🔍
  Heading: "No cases found"
  Body: "Try adjusting your filters or search terms."
  CTA: [Clear Filters]
  ```
- No cases at all (new agent):
  ```
  Icon: 📥
  Heading: "Your inbox is empty"
  Body: "New cases will appear here when assigned to you or your queues."
  ```

**Error state**:
```
Icon: ⚠️
Heading: "Failed to load cases"
Body: "Network error. Please check your connection and try again."
CTA: [Retry]
```

---

### 9.10 Data & MSW

#### API Endpoint
**GET /api/inbox**

Request:
```
GET /api/inbox?dept=Finance&status=Open&slaRisk=red&page=1&limit=50&sort=sla_asc
```

Response:
```json
{
  "data": [
    {
      "id": "CASE-20250001",
      "ticketNumber": "TKT-20250001",
      "department": "Finance",
      "subject": "Payment plan request for $2,400 balance",
      "studentId": "S1234567",
      "studentName": "Ahmed Ali",
      "studentEmail": "ahmed.ali@university.edu",
      "priority": "High",
      "status": "Open",
      "channel": "Chat",
      "sla": {
        "firstResponseDueAt": "2025-01-30T17:30:00Z",
        "resolutionDueAt": "2025-01-31T17:30:00Z",
        "riskLevel": "red",
        "breached": false,
        "percentElapsed": 87
      },
      "assignee": {
        "id": "agent-002",
        "name": "Sarah Johnson",
        "avatarUrl": "/avatars/agent-002.jpg"
      },
      "tags": ["payment_plan", "financial_hardship"],
      "createdAt": "2025-01-30T09:15:00Z",
      "updatedAt": "2025-01-30T14:22:00Z"
    }
    // ... 49 more cases
  ],
  "meta": {
    "total": 2143,
    "page": 1,
    "pages": 43,
    "perPage": 50
  }
}
```

#### MSW Seed Recipe

**Total cases**: ~2,000 (deterministic seed)

**Distribution**:
- Admissions: 25% (500)
- Finance: 30% (600)
- Registrar: 20% (400)
- Housing: 15% (300)
- IT: 10% (200)

**Priority skew**:
- Low: 10%
- Normal: 60%
- High: 25%
- Urgent: 5%

**SLA risk distribution**:
- Green: 70%
- Yellow: 18%
- Red: 12% (240 cases)

**Seasonal spike** (for demo):
- August: +40% cases (fall enrollment)
- January: +35% cases (spring enrollment)
- Seed data assumes "current date" = Jan 30, 2025

**Duplicates** (for merge demo):
- 5% cases (100) have duplicate flag
- Seed 10 pairs of exact duplicates (same student, similar subject, <24h apart)

**Special views**:
- "Waiting for Student": 150 cases with `status: "Waiting"`, `tags: ["awaiting_student_info"]`
- "Breached SLA": 50 cases with `sla.breached: true`

**MSW Handler**:
```typescript
export const getInboxHandler = http.get('/api/inbox', async ({ request }) => {
  await delay(300);

  const url = new URL(request.url);
  const filters = parseInboxFilters(url.searchParams);

  let filtered = allCases.filter(matchesFilters(filters));
  filtered = sortCases(filtered, filters.sort);

  const paginated = paginateResults(filtered, filters.page, filters.limit);

  return HttpResponse.json({
    data: paginated,
    meta: {
      total: filtered.length,
      page: filters.page,
      pages: Math.ceil(filtered.length / filters.limit),
      perPage: filters.limit
    }
  });
});
```

**First 5 seed cases** (examples):
```typescript
const seedCases = [
  {
    id: "CASE-20250001",
    ticketNumber: "TKT-20250001",
    department: "Finance",
    subject: "Payment plan request for $2,400 balance",
    studentId: "S1234567",
    studentName: "Ahmed Ali",
    priority: "High",
    status: "Open",
    sla: { riskLevel: "red", percentElapsed: 87, breached: false },
    assignee: { id: "agent-002", name: "Sarah Johnson" },
    tags: ["payment_plan"],
    createdAt: "2025-01-30T09:15:00Z",
    updatedAt: "2025-01-30T14:22:00Z"
  },
  {
    id: "CASE-20250002",
    ticketNumber: "TKT-20250002",
    department: "Admissions",
    subject: "Missing high school transcript",
    studentId: "S2345678",
    studentName: "Sara Khalil",
    priority: "Normal",
    status: "Waiting",
    sla: { riskLevel: "yellow", percentElapsed: 65, breached: false },
    assignee: null,
    tags: ["documents_pending", "transcript"],
    createdAt: "2025-01-29T11:00:00Z",
    updatedAt: "2025-01-30T10:15:00Z"
  },
  {
    id: "CASE-20250003",
    ticketNumber: "TKT-20250003",
    department: "Registrar",
    subject: "Enrollment verification letter request",
    studentId: "S3456789",
    studentName: "Mohammed Hassan",
    priority: "Normal",
    status: "Open",
    sla: { riskLevel: "green", percentElapsed: 30, breached: false },
    assignee: { id: "agent-003", name: "David Lee" },
    tags: ["verification"],
    createdAt: "2025-01-30T08:00:00Z",
    updatedAt: "2025-01-30T08:00:00Z"
  },
  {
    id: "CASE-20250004",
    ticketNumber: "TKT-20250004",
    department: "IT",
    subject: "Cannot access student portal - password reset",
    studentId: "S4567890",
    studentName: "Layla Ibrahim",
    priority: "Urgent",
    status: "Open",
    sla: { riskLevel: "yellow", percentElapsed: 55, breached: false },
    assignee: { id: "agent-004", name: "Emily Chen" },
    tags: ["password", "portal_access"],
    createdAt: "2025-01-30T13:00:00Z",
    updatedAt: "2025-01-30T13:45:00Z"
  },
  {
    id: "CASE-20250005",
    ticketNumber: "TKT-20250005",
    department: "Finance",
    subject: "Refund request for dropped course BIO 201",
    studentId: "S5678901",
    studentName: "Omar Farid",
    priority: "Normal",
    status: "Resolved",
    sla: { riskLevel: "green", percentElapsed: 45, breached: false },
    assignee: { id: "agent-002", name: "Sarah Johnson" },
    tags: ["refund", "course_drop"],
    createdAt: "2025-01-28T10:00:00Z",
    updatedAt: "2025-01-29T16:30:00Z"
  }
];
```

---

### 9.11 Telemetry

**Event naming**: `reops.inbox.<action>`

**Events**:
```typescript
// Filter changes
{
  event: "reops.inbox.filter_applied",
  props: {
    filter_type: "department" | "status" | "priority" | "sla" | "tags" | "owner" | "date",
    filter_value: string,
    result_count: number
  }
}

// Saved view
{
  event: "reops.inbox.view_saved",
  props: {
    view_name: string,
    filter_count: number,
    is_default: boolean
  }
}

// Bulk actions
{
  event: "reops.inbox.bulk_assign",
  props: {
    case_count: number,
    assignee_id: string,
    from_status: string[]
  }
}

{
  event: "reops.inbox.bulk_status_change",
  props: {
    case_count: number,
    new_status: string,
    previous_statuses: string[]
  }
}

// Merge
{
  event: "reops.inbox.merge_success",
  props: {
    primary_case_id: string,
    merged_case_ids: string[],
    merged_count: number
  }
}

{
  event: "reops.inbox.merge_undo",
  props: {
    primary_case_id: string,
    restored_case_ids: string[]
  }
}

// Keyboard usage
{
  event: "reops.inbox.keyboard_shortcut_used",
  props: {
    shortcut: "j" | "k" | "x" | "a" | "m" | "e" | "g",
    context: "table" | "modal"
  }
}
```

**Where events fire**:
- Filter changes: on debounce end (after 250ms)
- Bulk actions: on API success
- Merge: on confirm + on undo
- Keyboard: on keydown (debounced per shortcut)

---

### 9.12 i18n Keys

**English**:
```json
{
  "inbox.title": "Inbox",
  "inbox.search.placeholder": "Search cases...",
  "inbox.filter.department": "Department",
  "inbox.filter.status": "Status",
  "inbox.filter.priority": "Priority",
  "inbox.filter.sla": "SLA Risk",
  "inbox.filter.channel": "Channel",
  "inbox.filter.tags": "Tags",
  "inbox.filter.owner": "Owner",
  "inbox.filter.dateRange": "Date Range",
  "inbox.filter.clear": "Clear Filters",
  "inbox.view.new": "New View",
  "inbox.view.save": "Save Current View",
  "inbox.view.delete": "Delete View",
  "inbox.view.setDefault": "Set as Default",
  "inbox.bulk.selected": "{count} selected",
  "inbox.bulk.assign": "Assign",
  "inbox.bulk.setStatus": "Set Status",
  "inbox.bulk.setPriority": "Set Priority",
  "inbox.bulk.addTag": "Add Tag",
  "inbox.bulk.merge": "Merge Cases",
  "inbox.bulk.split": "Split Thread",
  "inbox.bulk.requestInfo": "Request Missing Info",
  "inbox.table.dept": "Dept",
  "inbox.table.subject": "Subject",
  "inbox.table.student": "Student",
  "inbox.table.priority": "Priority",
  "inbox.table.slaDue": "SLA Due",
  "inbox.table.status": "Status",
  "inbox.table.assignee": "Assignee",
  "inbox.table.updated": "Updated",
  "inbox.empty.title": "No cases found",
  "inbox.empty.description": "Try adjusting your filters or search terms.",
  "inbox.empty.clearFilters": "Clear Filters",
  "inbox.error.title": "Failed to load cases",
  "inbox.error.retry": "Retry",
  "inbox.sla.overdue": "OVERDUE",
  "inbox.sla.atRisk": "At Risk",
  "inbox.pagination.showing": "Showing {start}-{end} of {total}",
  "inbox.keyboard.help": "Keyboard Shortcuts"
}
```

**Arabic**:
```json
{
  "inbox.title": "صندوق الوارد",
  "inbox.search.placeholder": "البحث في الحالات...",
  "inbox.filter.department": "القسم",
  "inbox.filter.status": "الحالة",
  "inbox.filter.priority": "الأولوية",
  "inbox.filter.sla": "مخاطر اتفاقية مستوى الخدمة",
  "inbox.filter.clear": "مسح الفلاتر",
  "inbox.bulk.selected": "{count} محدد",
  "inbox.bulk.assign": "تعيين",
  "inbox.bulk.merge": "دمج الحالات",
  "inbox.table.subject": "الموضوع",
  "inbox.table.student": "الطالب",
  "inbox.table.priority": "الأولوية",
  "inbox.table.status": "الحالة",
  "inbox.empty.title": "لم يتم العثور على حالات",
  "inbox.empty.clearFilters": "مسح الفلاتر",
  "inbox.sla.overdue": "متأخر"
}
```

---

### 9.13 Acceptance Criteria

- [ ] Table loads with default filters (dept=All, status=Open, 50 rows)
- [ ] Filters update URL search params and persist on page reload
- [ ] Debounced search triggers after 250ms of typing
- [ ] Saved view can be created, set as default, edited, deleted
- [ ] Default view loads on initial page visit
- [ ] Selecting rows shows bulk action bar with correct button states
- [ ] Bulk assign opens modal with agent list filtered by department
- [ ] Bulk status change validates transitions (cannot set Closed without Manager role)
- [ ] Merge wizard shows consolidated timeline preview before confirm
- [ ] Merge creates audit events and shows undo toast for 30s
- [ ] Undo merge restores child cases and removes merged timeline entries
- [ ] SLA badge shows correct risk color (green/yellow/red) based on percentElapsed
- [ ] SLA countdown updates every minute (client-side timer)
- [ ] SLA tooltip shows policy details and predicted breach time
- [ ] Keyboard shortcuts work: J/K navigate, X toggles selection, A opens assign modal
- [ ] Keyboard shortcuts disabled when modal is open
- [ ] Pagination shows correct page numbers and total count
- [ ] Virtualization activates when >200 rows visible (check DevTools for render count)
- [ ] Empty state shows when no cases match filters with "Clear Filters" CTA
- [ ] Error state shows retry button and successfully refetches on click
- [ ] Loading skeleton matches table structure (same column count)
- [ ] Telemetry events fire on filter change, bulk action, merge (check console logs)
- [ ] Arabic locale flips table direction (RTL) and translates column headers
- [ ] Row overflow menu shows context-appropriate actions (e.g., no "Merge" for single selection)

---

## 10. Case Workspace

### 10.1 Layout Blueprint

**3-pane layout** (desktop, 1440px viewport):

```
┌─ Header (56px) ──────────────────────────────────────────────────┐
│ [← Back to Inbox]  TKT-20250001 | Finance | High Priority        │
│                                  [Assign] [Status ▾] [More ▾]    │
├─ Left Pane (320px, Sheet) ───┬─ Center Pane (flex) ──┬─ Right Pane (360px) ─┐
│ Case Meta                     │ Tabs:                 │ Knowledge Panel       │
│ ┌─────────────────────────┐   │ [Thread] [Notes] [Timeline] │                       │
│ │ Status: Open            │   │                       │ 🔍 Search KB...       │
│ │ Priority: High          │   │ Messages (scrollable) │                       │
│ │ SLA: 2h 15m ⚠️         │   │ ┌───────────────────┐ │ Suggested Articles:   │
│ │ Created: 2h ago         │   │ │ Student: Ahmed    │ │ • Payment Plans       │
│ │ Updated: 15m ago        │   │ │ 2h ago            │ │ • Refund Policy       │
│ └─────────────────────────┘   │ │ I need payment... │ │                       │
│                               │ └───────────────────┘ │ ───────────────────   │
│ Student 360                   │ ┌───────────────────┐ │ Macros                │
│ ┌─────────────────────────┐   │ │ Agent: Sarah      │ │ ▸ Payment Plan Approval│
│ │ Ahmed Ali                │   │ │ 1h ago           │ │ ▸ Request Documents   │
│ │ S1234567                 │   │ │ We can offer...   │ │ ▸ Escalate to Manager │
│ │ CS, Fall 2025            │   │ └───────────────────┘ │                       │
│ │ ⚠️ Hold: Financial      │   │                       │ ───────────────────   │
│ │ Balance: $2,400          │   │ Composer              │ Similar Cases         │
│ └─────────────────────────┘   │ ┌───────────────────┐ │ • TKT-20250099        │
│                               │ │ [AI Draft] [Tone] │ │ • TKT-20249887        │
│ Related Entities              │ │ Type message...   │ │                       │
│ • Invoice INV-2025-001        │ │ [📎] [🔗] [Send]  │ │                       │
│ • Application APP-2024-567    │ └───────────────────┘ │                       │
└───────────────────────────────┴───────────────────────┴───────────────────────┘
```

**Components**:
- Left pane: `<Sheet>` (collapsible on mobile, fixed on desktop)
  - `<Card>` for case meta, student 360, related entities
  - `<Badge>` for status, priority, dept, holds
  - `<Progress>` bar for SLA visual
- Center pane:
  - `<Tabs>` (Thread, Internal Notes, Timeline)
  - `<ScrollArea>` for messages
  - `<Separator>` between messages
  - `<Textarea>` composer with `<Toolbar>` (AI draft, tone, formatting)
  - `<Button>` send (Cmd-Enter)
- Right pane: `<Sheet>` (collapsible)
  - `<Command>` for KB search
  - `<Accordion>` for macros, similar cases
  - `<Card>` for article previews

**Mobile** (<768px):
- Stack vertically: header → center → bottom sheet (student 360)
- Right pane accessed via floating action button
- Tabs sticky at top of center pane

---

### 10.2 Status & SLA Interactions

#### Status Dropdown
**Available statuses** (from §4 Data Model):
- New → Open (auto on first agent reply)
- Open → Waiting (requires reason: "Awaiting student info", "Waiting on other dept", "Manager review")
- Waiting → Open (resume)
- Open → Resolved (requires resolution note)
- Resolved → Closed (auto after 7 days or manual)
- Resolved → Open (reopen, within 7 days)

**Validation**:
- Cannot skip statuses (e.g., New → Resolved requires Open first)
- Agents cannot set Closed (Manager/Admin only)
- Waiting requires reason input (dropdown + optional note)

**SLA pause/resume rules**:
- `status: "Waiting"` → SLA clock pauses
- `status: "Open"` (from Waiting) → SLA clock resumes with recalculated deadline
  - Formula: `newDueAt = now + (originalDueAt - pausedAt)`
- Breach check runs on resume; if already breached, stays breached

**Breach banner**:
```tsx
{case.sla.breached && (
  <Alert variant="destructive" className="mb-4">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>SLA Breached</AlertTitle>
    <AlertDescription>
      This case exceeded the response deadline {formatDistanceToNow(case.sla.firstResponseDueAt)} ago.
      <Button variant="link" onClick={handleEscalate}>Escalate to Manager</Button>
    </AlertDescription>
  </Alert>
)}
```

**One-click escalate**:
- Sets `priority: "Urgent"`
- Notifies manager (stub: console log)
- Logs audit event

---

### 10.3 Assign & Roles

**Assign dropdown**:
- Filtered by case department + agent skills
- Shows current workload: `Sarah Johnson (12 open cases)`
- Self-assign shortcut: "Assign to Me" button
- Unassign option (returns to queue)

**Skills hints**:
- Agents with matching skills highlighted (green indicator)
- Tooltip: "Has skill: finance:payment_plans"

**Workload count**:
- Real-time from `/api/agents/:id/workload`
- Shows open + in-progress cases only

**Permission rules**:
- Agents: can assign to self or dept peers
- Managers: can assign to any agent in their departments
- Admins: unrestricted

**State change**:
```typescript
// Optimistic update
setCaseAssignee(newAgent);
setAuditEvent({ type: "case.assigned", assignee: newAgent.id });

// API call
await patchCase(caseId, { assigneeId: newAgent.id });

// On error: rollback
if (error) {
  setCaseAssignee(previousAgent);
  removeAuditEvent();
  toast.error("Failed to assign. Please try again.");
}
```

---

### 10.4 Attachments

**Upload flow**:
1. Drag-drop file or click 📎 icon → file input
2. Validate: max 10MB, allowed types (pdf, jpg, png, docx, xlsx)
3. Virus scan stub (mock 2s delay, always passes)
4. Upload to mock S3 (MSW returns presigned URL)
5. Add attachment to message or case

**UI during upload**:
```tsx
<div className="flex items-center gap-2 p-2 border rounded">
  <FileIcon className="h-4 w-4" />
  <span className="flex-1 truncate">{file.name}</span>
  <Progress value={uploadProgress} className="w-20" />
  <Button variant="ghost" size="sm" onClick={cancelUpload}>✕</Button>
</div>
```

**Image preview**:
- Thumbnails in message thread
- Click → lightbox modal with zoom

**Download**:
- Click filename → triggers download
- Logs audit event: `attachment.downloaded` with `{ attachmentId, userId, caseId }`

**Max files per case**: 20 (enforced by API)

---

### 10.5 Internal Notes Permissions

**Visibility**:
- **Agents**: can create, view own + team notes
- **Managers**: can view all notes in their departments
- **Admins**: unrestricted
- **Students**: never visible

**UI indicator**:
```tsx
<div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
  <div className="flex items-center gap-2">
    <Lock className="h-4 w-4 text-yellow-700" />
    <span className="text-sm font-medium text-yellow-700">Internal Note</span>
  </div>
  <p className="text-sm text-yellow-900 mt-1">
    This is only visible to staff. Student will not see this.
  </p>
</div>
```

**Composer toggle**:
- Checkbox "Mark as Internal Note" above composer
- Keyboard shortcut: `I`
- Default: unchecked (external message)

**Redaction in exports**:
- When student requests case transcript (future feature), internal notes excluded
- Audit log shows redaction event

---

### 10.6 Timeline Events

**System-generated events** (auto-logged):
```typescript
type TimelineEvent =
  | { type: "case.created"; createdBy: string; channel: string }
  | { type: "case.status_changed"; from: Status; to: Status; reason?: string }
  | { type: "case.assigned"; assignee: string; previousAssignee?: string }
  | { type: "case.priority_changed"; from: Priority; to: Priority }
  | { type: "case.sla_paused"; reason: string }
  | { type: "case.sla_resumed"; newDueAt: string }
  | { type: "case.sla_breached"; breachType: "firstResponse" | "resolution" }
  | { type: "case.ai_draft_applied"; draftId: string; citations: string[] }
  | { type: "case.macro_sent"; macroId: string; macroName: string }
  | { type: "case.document_requested"; documentType: string }
  | { type: "case.merged_into"; targetCaseId: string }
  | { type: "case.split_from"; sourceCaseId: string; messageIds: string[] };
```

**Rendering**:
```tsx
<div className="flex gap-3 text-sm">
  <div className="flex flex-col items-center">
    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
      <Icon className="h-4 w-4" />
    </div>
    <div className="flex-1 w-0.5 bg-border" />
  </div>
  <div className="flex-1 pb-4">
    <p className="font-medium">{event.title}</p>
    <p className="text-muted-foreground">{event.description}</p>
    <span className="text-xs text-muted-foreground">{formatRelativeTime(event.timestamp)}</span>
  </div>
</div>
```

**Example timeline** (Finance payment plan case):
```
🎫 Case created via Chat | 2h ago
   Student: Ahmed Ali submitted payment plan request

👤 Assigned to Sarah Johnson | 2h ago
   Auto-assigned based on Finance queue rules

🤖 AI draft generated | 1h ago
   Draft included 1 citation from "Payment Plans Overview"

📤 Agent replied to student | 1h ago
   Sarah: "We can offer you a 6-month plan..."

⏸️ Status changed to Waiting | 30m ago
   Reason: Awaiting student confirmation

▶️ Status changed to Open | 15m ago
   Student responded confirming acceptance

✅ Status changed to Resolved | 5m ago
   Resolution: Payment plan approved
```

---

### 10.7 Keyboard Map

**Composer**:
- `Cmd/Ctrl-Enter` - Send message
- `Shift-Enter` - New line (don't send)
- `Cmd/Ctrl-B` - Bold selected text
- `Cmd/Ctrl-I` - Italic selected text
- `Cmd/Ctrl-K` - Insert link modal
- `I` (outside composer) - Toggle internal note checkbox

**Navigation**:
- `Cmd/Ctrl-Shift-K` - Open knowledge panel search
- `Cmd/Ctrl-Shift-M` - Open macros dropdown
- `Esc` - Close modals/dropdowns

**Tabs**:
- `Cmd/Ctrl-1` - Switch to Thread tab
- `Cmd/Ctrl-2` - Switch to Internal Notes tab
- `Cmd/Ctrl-3` - Switch to Timeline tab

**Actions**:
- `A` - Assign modal
- `S` - Status dropdown
- `P` - Priority dropdown

**Conflict resolution**:
- When composer focused, only composer shortcuts active
- When modal open, all background shortcuts disabled
- Browser shortcuts (Cmd-T, Cmd-W) preserved

---

### 10.8 State Machine

```mermaid
stateDiagram-v2
    [*] --> Loading
    Loading --> Loaded: Case data fetched
    Loading --> Error: Fetch failed
    Error --> Loading: Retry

    Loaded --> Replying: Type in composer
    Replying --> SendingMessage: Click Send
    SendingMessage --> Loaded: Success
    SendingMessage --> ReplyError: API fail
    ReplyError --> Replying: Retry

    Loaded --> ChangingStatus: Click status dropdown
    ChangingStatus --> Loaded: Status updated
    ChangingStatus --> Error: API fail

    Loaded --> Assigning: Click assign
    Assigning --> Loaded: Assignment success

    Loaded --> UploadingAttachment: Drag file
    UploadingAttachment --> Loaded: Upload complete
    UploadingAttachment --> Error: Upload fail
```

**State storage** (Zustand):
```typescript
interface CaseState {
  case: Case | null;
  messages: Message[];
  timeline: TimelineEvent[];
  draftMessage: string;
  isInternalNote: boolean;
  selectedTab: "thread" | "notes" | "timeline";
  uploadingFiles: { id: string; name: string; progress: number }[];
  optimisticUpdates: {
    status?: Status;
    assignee?: Agent;
    messages?: Message[];
  };
}
```

**Optimistic update example**:
```typescript
// User clicks Send
const optimisticMessage = {
  id: `temp-${Date.now()}`,
  caseId: case.id,
  authorId: currentUser.id,
  body: draftMessage,
  isInternalNote,
  createdAt: new Date().toISOString(),
  pending: true
};

// Add to UI immediately
addMessage(optimisticMessage);
clearDraft();

// API call
try {
  const savedMessage = await postMessage(case.id, { body: draftMessage, isInternalNote });
  replaceMessage(optimisticMessage.id, savedMessage);
} catch (error) {
  removeMessage(optimisticMessage.id);
  restoreDraft(draftMessage);
  toast.error("Failed to send message. Please try again.");
}
```

---

### 10.9 Error / Empty / Skeleton States

**Loading skeleton**:
```tsx
<div className="space-y-4">
  {/* Header skeleton */}
  <div className="flex items-center justify-between">
    <Skeleton className="h-8 w-48" />
    <Skeleton className="h-8 w-32" />
  </div>

  {/* Thread skeleton */}
  {[...Array(3)].map((_, i) => (
    <div key={i} className="flex gap-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  ))}
</div>
```

**Empty states**:
- No messages yet:
  ```
  Icon: 💬
  Heading: "No messages"
  Body: "Be the first to reply to this case."
  ```
- No knowledge articles found:
  ```
  Icon: 📚
  Heading: "No articles found"
  Body: "Try different search terms or browse the knowledge base."
  CTA: [Browse KB]
  ```
- No similar cases:
  ```
  Body: "No similar cases found."
  ```

**Error states**:
- Case not found (404):
  ```
  Icon: 🔍
  Heading: "Case not found"
  Body: "This case may have been deleted or you don't have permission to view it."
  CTA: [Back to Inbox]
  ```
- Attachment upload failed:
  ```
  Toast: "Failed to upload {filename}. File may be too large or an unsupported type."
  CTA: [Retry]
  ```

---

### 10.10 Data & MSW

#### API Endpoints

**GET /api/cases/:id**

Response:
```json
{
  "data": {
    "id": "CASE-20250001",
    "ticketNumber": "TKT-20250001",
    "department": "Finance",
    "subject": "Payment plan request for $2,400 balance",
    "status": "Open",
    "priority": "High",
    "channel": "Chat",
    "studentId": "S1234567",
    "assignee": {
      "id": "agent-002",
      "name": "Sarah Johnson",
      "email": "sarah.johnson@university.edu",
      "avatarUrl": "/avatars/agent-002.jpg"
    },
    "tags": ["payment_plan", "financial_hardship"],
    "sla": {
      "firstResponseDueAt": "2025-01-30T17:30:00Z",
      "resolutionDueAt": "2025-01-31T17:30:00Z",
      "riskLevel": "red",
      "breached": false,
      "percentElapsed": 87,
      "pausedAt": null
    },
    "createdAt": "2025-01-30T09:15:00Z",
    "updatedAt": "2025-01-30T14:22:00Z",
    "resolvedAt": null,
    "closedAt": null,
    "messages": [
      {
        "id": "msg-001",
        "authorId": "S1234567",
        "authorRole": "Student",
        "authorName": "Ahmed Ali",
        "body": "I need help setting up a payment plan for my $2,400 balance. Can I pay over 6 months?",
        "isInternalNote": false,
        "aiGenerated": false,
        "attachments": [],
        "createdAt": "2025-01-30T09:15:00Z"
      },
      {
        "id": "msg-002",
        "authorId": "agent-002",
        "authorRole": "Agent",
        "authorName": "Sarah Johnson",
        "body": "Hi Ahmed, yes we can offer you a 6-month payment plan. Based on your balance of $2,400, your monthly installment would be $400. I'll need to verify your account has no holds before I can process this. Let me check...",
        "isInternalNote": false,
        "aiGenerated": true,
        "citations": [
          {
            "articleId": "kb-002",
            "articleTitle": "Payment Plan Eligibility",
            "snippetText": "Students with balances over $1,000 may request...",
            "url": "/kb/payment-plan-eligibility"
          }
        ],
        "attachments": [],
        "createdAt": "2025-01-30T10:30:00Z"
      }
    ],
    "timeline": [
      {
        "type": "case.created",
        "createdBy": "S1234567",
        "channel": "Chat",
        "timestamp": "2025-01-30T09:15:00Z"
      },
      {
        "type": "case.assigned",
        "assignee": "agent-002",
        "assigneeName": "Sarah Johnson",
        "previousAssignee": null,
        "timestamp": "2025-01-30T09:16:00Z"
      },
      {
        "type": "case.ai_draft_applied",
        "draftId": "draft-001",
        "citations": ["kb-002"],
        "timestamp": "2025-01-30T10:28:00Z"
      }
    ],
    "studentProfile": {
      "id": "S1234567",
      "name": "Ahmed Ali",
      "email": "ahmed.ali@university.edu",
      "phone": "+1-555-0123",
      "program": "Computer Science, BS",
      "term": "Fall 2025",
      "status": "Enrolled",
      "holds": [
        {
          "type": "Financial",
          "reason": "Outstanding balance",
          "placedAt": "2025-01-15T00:00:00Z"
        }
      ],
      "balance": 2400
    },
    "relatedEntities": [
      {
        "type": "Invoice",
        "id": "INV-2025-10-001",
        "label": "Fall 2025 Tuition",
        "amount": 2400,
        "dueDate": "2025-02-01"
      }
    ]
  }
}
```

**POST /api/cases/:id/messages**

Request:
```json
{
  "body": "Your payment plan has been approved. You'll receive an email with the installment schedule.",
  "isInternalNote": false,
  "attachments": []
}
```

Response:
```json
{
  "data": {
    "id": "msg-003",
    "caseId": "CASE-20250001",
    "authorId": "agent-002",
    "authorRole": "Agent",
    "authorName": "Sarah Johnson",
    "body": "Your payment plan has been approved...",
    "isInternalNote": false,
    "aiGenerated": false,
    "citations": [],
    "attachments": [],
    "createdAt": "2025-01-30T14:45:00Z"
  }
}
```

**PATCH /api/cases/:id**

Request:
```json
{
  "status": "Resolved",
  "resolutionNote": "Payment plan approved for 6 months at $400/month"
}
```

Response: (full updated case object)

#### MSW Seed Recipes

**Seed case 1: Finance payment plan** (detailed above)

**Seed case 2: Admissions missing transcript**
```typescript
{
  id: "CASE-20250002",
  ticketNumber: "TKT-20250002",
  department: "Admissions",
  subject: "Missing high school transcript for application review",
  status: "Waiting",
  priority: "Normal",
  studentId: "S2345678",
  studentProfile: {
    name: "Sara Khalil",
    program: "Biology, BS",
    term: "Fall 2025",
    status: "Applicant",
    documents: [
      { type: "Transcript", status: "Pending", uploadedAt: null },
      { type: "ID", status: "Verified", uploadedAt: "2025-01-10T10:00:00Z" },
      { type: "Recommendation", status: "Received", uploadedAt: "2025-01-12T14:00:00Z" }
    ]
  },
  messages: [
    {
      id: "msg-004",
      authorRole: "Student",
      authorName: "Sara Khalil",
      body: "When will my application be reviewed? I submitted everything last week.",
      createdAt: "2025-01-29T11:00:00Z"
    },
    {
      id: "msg-005",
      authorRole: "Agent",
      authorName: "David Lee",
      body: "Hi Sara, we're still waiting for your official high school transcript. Please have your school send it directly to admissions@university.edu.",
      isInternalNote: false,
      createdAt: "2025-01-29T13:30:00Z"
    }
  ],
  timeline: [
    { type: "case.created", channel: "Email", timestamp: "2025-01-29T11:00:00Z" },
    { type: "case.assigned", assignee: "agent-003", timestamp: "2025-01-29T11:05:00Z" },
    { type: "case.status_changed", from: "New", to: "Waiting", reason: "Awaiting student document", timestamp: "2025-01-29T13:30:00Z" },
    { type: "case.document_requested", documentType: "Transcript", timestamp: "2025-01-29T13:30:00Z" }
  ],
  sla: { riskLevel: "yellow", percentElapsed: 65, breached: false }
}
```

**Seed case 3: Registrar enrollment verification**
```typescript
{
  id: "CASE-20250003",
  ticketNumber: "TKT-20250003",
  department: "Registrar",
  subject: "Enrollment verification letter for loan deferment",
  status: "Open",
  priority: "Normal",
  studentId: "S3456789",
  studentProfile: {
    name: "Mohammed Hassan",
    program: "Engineering, BS",
    term: "Spring 2025",
    status: "Enrolled"
  },
  messages: [
    {
      authorRole: "Student",
      body: "I need an enrollment verification letter for my student loan deferment. Can you send it to mybank@loans.com?",
      createdAt: "2025-01-30T08:00:00Z"
    }
  ],
  timeline: [
    { type: "case.created", channel: "Form", timestamp: "2025-01-30T08:00:00Z" },
    { type: "case.assigned", assignee: "agent-003", timestamp: "2025-01-30T08:01:00Z" }
  ],
  sla: { riskLevel: "green", percentElapsed: 30, breached: false }
}
```

**Seed case 4: Breached SLA example**
```typescript
{
  id: "CASE-20249999",
  ticketNumber: "TKT-20249999",
  department: "IT",
  subject: "Cannot access email - urgent",
  status: "Open",
  priority: "Urgent",
  sla: {
    firstResponseDueAt: "2025-01-29T10:00:00Z",
    resolutionDueAt: "2025-01-29T14:00:00Z",
    riskLevel: "red",
    breached: true,
    percentElapsed: 120 // 20% over
  },
  createdAt: "2025-01-29T09:00:00Z",
  messages: [
    {
      authorRole: "Student",
      body: "My email hasn't worked for 2 days. I have an important deadline today!",
      createdAt: "2025-01-29T09:00:00Z"
    }
  ],
  timeline: [
    { type: "case.created", channel: "Phone", timestamp: "2025-01-29T09:00:00Z" },
    { type: "case.sla_breached", breachType: "firstResponse", timestamp: "2025-01-29T10:00:00Z" }
  ]
}
```

---

### 10.11 Telemetry

```typescript
// Message sent
{
  event: "reops.case.reply_sent",
  props: {
    case_id: string,
    dept: string,
    has_ai_citations: boolean,
    is_internal_note: boolean,
    message_length: number,
    attachments_count: number
  }
}

// Status changed
{
  event: "reops.case.status_changed",
  props: {
    case_id: string,
    from_status: string,
    to_status: string,
    sla_risk_before: "green" | "yellow" | "red",
    sla_risk_after: "green" | "yellow" | "red",
    sla_paused: boolean
  }
}

// Assignment
{
  event: "reops.case.assigned",
  props: {
    case_id: string,
    assignee_id: string,
    previous_assignee_id: string | null,
    assignee_workload: number
  }
}

// Attachment uploaded
{
  event: "reops.case.attachment_uploaded",
  props: {
    case_id: string,
    file_type: string,
    file_size_kb: number
  }
}

// Tab switched
{
  event: "reops.case.tab_switched",
  props: {
    case_id: string,
    from_tab: "thread" | "notes" | "timeline",
    to_tab: "thread" | "notes" | "timeline"
  }
}

// Knowledge article clicked
{
  event: "reops.case.kb_article_clicked",
  props: {
    case_id: string,
    article_id: string,
    source: "suggested" | "search" | "citation"
  }
}
```

---

### 10.12 i18n Keys

**English**:
```json
{
  "case.header.backToInbox": "Back to Inbox",
  "case.status.new": "New",
  "case.status.open": "Open",
  "case.status.waiting": "Waiting",
  "case.status.resolved": "Resolved",
  "case.status.closed": "Closed",
  "case.status.waitingReason": "Reason for waiting",
  "case.priority.low": "Low",
  "case.priority.normal": "Normal",
  "case.priority.high": "High",
  "case.priority.urgent": "Urgent",
  "case.sla.due": "Due",
  "case.sla.overdue": "OVERDUE",
  "case.sla.breached": "SLA Breached",
  "case.sla.pause": "Pause SLA",
  "case.sla.resume": "Resume SLA",
  "case.assign.title": "Assign Case",
  "case.assign.toMe": "Assign to Me",
  "case.assign.unassign": "Unassign",
  "case.tabs.thread": "Thread",
  "case.tabs.notes": "Internal Notes",
  "case.tabs.timeline": "Timeline",
  "case.composer.placeholder": "Type your message...",
  "case.composer.internalNote": "Mark as Internal Note",
  "case.composer.send": "Send",
  "case.composer.aiDraft": "AI Draft",
  "case.composer.attachFile": "Attach File",
  "case.composer.insertLink": "Insert Link",
  "case.student.holds": "Holds",
  "case.student.balance": "Balance",
  "case.student.program": "Program",
  "case.student.term": "Term",
  "case.related.title": "Related Entities",
  "case.knowledge.title": "Knowledge",
  "case.knowledge.search": "Search knowledge base...",
  "case.knowledge.suggested": "Suggested Articles",
  "case.macros.title": "Macros",
  "case.similar.title": "Similar Cases",
  "case.timeline.created": "Case created via {channel}",
  "case.timeline.assigned": "Assigned to {assignee}",
  "case.timeline.statusChanged": "Status changed from {from} to {to}",
  "case.timeline.aiDraftApplied": "AI draft applied with {count} citations",
  "case.timeline.macroSent": "Macro '{macroName}' sent",
  "case.timeline.documentRequested": "Document requested: {documentType}",
  "case.timeline.slaPaused": "SLA paused: {reason}",
  "case.timeline.slaResumed": "SLA resumed",
  "case.timeline.slaBreached": "SLA breached ({breachType})",
  "case.error.notFound": "Case not found",
  "case.error.uploadFailed": "Failed to upload {filename}"
}
```

**Arabic**:
```json
{
  "case.header.backToInbox": "العودة إلى صندوق الوارد",
  "case.status.open": "مفتوح",
  "case.status.waiting": "في انتظار",
  "case.status.resolved": "تم الحل",
  "case.status.waitingReason": "سبب الانتظار",
  "case.priority.high": "عالية",
  "case.priority.urgent": "عاجل",
  "case.sla.overdue": "متأخر",
  "case.sla.breached": "تم تجاوز اتفاقية مستوى الخدمة",
  "case.assign.title": "تعيين الحالة",
  "case.assign.toMe": "تعيين لي",
  "case.tabs.thread": "المحادثة",
  "case.tabs.notes": "ملاحظات داخلية",
  "case.tabs.timeline": "الجدول الزمني",
  "case.composer.placeholder": "اكتب رسالتك...",
  "case.composer.send": "إرسال",
  "case.student.balance": "الرصيد",
  "case.knowledge.title": "المعرفة",
  "case.timeline.created": "تم إنشاء الحالة عبر {channel}"
}
```

---

### 10.13 Acceptance Criteria

- [ ] Case loads with full data (meta, student 360, messages, timeline)
- [ ] Status dropdown shows only valid transitions for current status
- [ ] Setting status to "Waiting" requires reason selection
- [ ] Status change from "Waiting" to "Open" recalculates SLA due time
- [ ] SLA badge shows correct risk color and countdown
- [ ] SLA breach banner appears when `sla.breached === true`
- [ ] Clicking "Escalate to Manager" sets priority to Urgent and logs event
- [ ] Assign dropdown filters agents by department and shows workload count
- [ ] "Assign to Me" button assigns current user and updates UI immediately
- [ ] Sending message adds optimistic message to thread with pending indicator
- [ ] Failed message send removes optimistic message and restores draft
- [ ] Internal note checkbox toggles background color of composer
- [ ] Internal notes show lock icon and "Internal Note" label
- [ ] Attachments can be drag-dropped onto composer
- [ ] Attachment upload shows progress bar and cancels on click
- [ ] Image attachments show thumbnails in thread
- [ ] Timeline shows all events in chronological order with icons
- [ ] Timeline event for "AI draft applied" shows citation count
- [ ] Keyboard shortcut Cmd-Enter sends message from composer
- [ ] Keyboard shortcut I toggles internal note checkbox
- [ ] Keyboard shortcut Cmd-1/2/3 switches between tabs
- [ ] Related entities show clickable links (stub: console log on click)
- [ ] Knowledge panel search returns suggested articles (MSW stub)
- [ ] Clicking suggested article opens in new tab
- [ ] Similar cases show 2-3 tickets with same tags or student
- [ ] Telemetry events fire on reply sent, status changed, assignment
- [ ] Arabic locale flips pane layout (right-to-left)

---

## 11. AI Composer & Macros

### 11.1 Composer UI

**Layout** (within case workspace center pane):

```
┌─ Composer Toolbar (40px) ─────────────────────────────────────┐
│ [AI Draft] [Tone: Neutral ▾] [Insert Variable ▾] [Cite KB]   │
│                                        [Bold] [Link] [Lang ▾] │
├─ Textarea (auto-expand, min 120px) ──────────────────────────┤
│ Type your message...                                          │
│                                                               │
│                                                               │
├─ Footer (48px) ───────────────────────────────────────────────┤
│ [📎 Attach] [☑ Internal Note]          [Cancel] [Send]       │
│ ✨ AI confidence: 0.89 | 1 citation                          │
└───────────────────────────────────────────────────────────────┘
```

**Components**:
- `<Toolbar>` with `<Button>` group
- `<Textarea>` with auto-resize (min 3 rows, max 20)
- `<Badge>` for confidence score
- `<Popover>` for tone selector, variable picker
- `<Dialog>` for KB citation search

**AI Draft button flow**:
1. Click "AI Draft" → loading spinner (2s)
2. Draft appears in textarea with highlight border
3. Footer shows: `✨ AI confidence: 0.89 | 1 citation`
4. Citations rendered as chips above textarea
5. Agent can edit before sending

**Draft vs. Send**:
- **AI Draft**: populates textarea, does NOT send
- **Approve & Send**: validates, posts message immediately (only shown if confidence ≥ 0.8)
- **Send**: regular send (manual or edited draft)

**Confidence indicator**:
```tsx
{aiDraft && (
  <div className="flex items-center gap-2 text-sm text-muted-foreground">
    <Sparkles className="h-4 w-4" />
    <span>AI confidence: {(aiDraft.confidence * 100).toFixed(0)}%</span>
    {aiDraft.citations.length > 0 && (
      <span>| {aiDraft.citations.length} citation{aiDraft.citations.length > 1 ? 's' : ''}</span>
    )}
  </div>
)}
```

**Citation chips**:
```tsx
{aiDraft?.citations.map((cite) => (
  <Badge key={cite.articleId} variant="secondary" className="gap-1">
    <BookOpen className="h-3 w-3" />
    <a href={cite.url} target="_blank" className="hover:underline">
      {cite.articleTitle}
    </a>
  </Badge>
))}
```

---

### 11.2 Macros Library

**UI**: Searchable dropdown (accessible via toolbar or keyboard `M`)

```
┌─ Macros Dropdown ──────────────────┐
│ 🔍 Search macros...                │
├────────────────────────────────────┤
│ Payment Plan Approval              │
│ Request Missing Documents          │
│ Escalate to Manager                │
│ ─────────────────────────          │
│ [+ Create New Macro]               │
└────────────────────────────────────┘
```

**Macro structure**:
```typescript
interface Macro {
  id: string;
  name: string;
  department: string | "shared"; // dept-scoped or global
  body: string; // supports {{placeholders}}
  variables: string[]; // e.g., ["student_name", "balance"]
  tags: string[];
  usageCount: number;
  createdBy: string;
  createdAt: string;
}
```

**Placeholders** (auto-populated from case data):
- `{{student_name}}` → `Ahmed Ali`
- `{{student_email}}` → `ahmed.ali@university.edu`
- `{{student_id}}` → `S1234567`
- `{{balance}}` → `$2,400`
- `{{case_number}}` → `TKT-20250001`
- `{{agent_name}}` → `Sarah Johnson`

**Variable validation**:
- Check if placeholder exists in case data before inserting
- Show warning if missing: "Cannot insert {{balance}} - student profile incomplete"

**Preview before apply**:
```tsx
<Dialog>
  <DialogHeader>
    <DialogTitle>Preview: Payment Plan Approval</DialogTitle>
  </DialogHeader>
  <DialogContent>
    <div className="prose prose-sm">
      <p>Hi {{student_name}},</p>
      <p>Your payment plan request has been approved...</p>
    </div>
    <div className="mt-4 p-3 bg-muted rounded">
      <p className="text-sm font-medium">Will be rendered as:</p>
      <p className="text-sm mt-2">Hi Ahmed Ali,</p>
      <p className="text-sm">Your payment plan request has been approved...</p>
    </div>
  </DialogContent>
  <DialogFooter>
    <Button variant="outline" onClick={closeDialog}>Cancel</Button>
    <Button onClick={applyMacro}>Insert Macro</Button>
  </DialogFooter>
</Dialog>
```

**Example macros**:
```typescript
const exampleMacros: Macro[] = [
  {
    id: "macro-001",
    name: "Payment Plan Approval",
    department: "Finance",
    body: "Hi {{student_name}},\n\nYour payment plan request has been approved for {{plan_months}} months at {{monthly_amount}}/month. You'll receive an email with the full schedule and payment instructions.\n\nIf you have questions, please reply to this message.\n\nBest regards,\n{{agent_name}}",
    variables: ["student_name", "plan_months", "monthly_amount", "agent_name"],
    tags: ["payment_plan", "approval"],
    usageCount: 47,
    createdBy: "agent-002",
    createdAt: "2024-11-01T10:00:00Z"
  },
  {
    id: "macro-002",
    name: "Request Missing Documents",
    department: "Admissions",
    body: "Hi {{student_name}},\n\nTo complete your application review, we need the following documents:\n\n{{document_list}}\n\nPlease upload them to your application portal or have them sent directly to admissions@university.edu.\n\nThank you,\n{{agent_name}}",
    variables: ["student_name", "document_list", "agent_name"],
    tags: ["documents", "admissions"],
    usageCount: 32,
    createdBy: "agent-001",
    createdAt: "2024-10-15T09:00:00Z"
  },
  {
    id: "macro-003",
    name: "Escalate to Manager",
    department: "shared",
    body: "Hi {{student_name}},\n\nI've escalated your request to my manager for review. You should receive a response within 24 hours.\n\nThank you for your patience,\n{{agent_name}}",
    variables: ["student_name", "agent_name"],
    tags: ["escalation"],
    usageCount: 18,
    createdBy: "admin-001",
    createdAt: "2024-09-01T08:00:00Z"
  }
];
```

---

### 11.3 Policy Variables

**Use case**: Insert immutable department policy snippets into messages

**UI**: Special variable type shown in `[Insert Variable ▾]` dropdown

```
┌─ Insert Variable Dropdown ─────────┐
│ Student Info                       │
│ ─ {{student_name}}                 │
│ ─ {{student_email}}                │
│ ─ {{balance}}                      │
│                                    │
│ Department Policies                │
│ ─ Payment Plan Eligibility         │
│ ─ Refund Policy                    │
│ ─ Transcript Request Fee           │
└────────────────────────────────────┘
```

**Rendering** (in message):
```tsx
<Callout variant="info" className="my-2 border-l-4 border-blue-500">
  <InfoIcon className="h-4 w-4" />
  <div>
    <p className="font-medium">Payment Plan Eligibility (Policy v2.1)</p>
    <p className="text-sm">Students with balances over $1,000 and no account holds may request payment plans for 3, 6, or 12 months.</p>
  </div>
</Callout>
```

**Policy versioning**:
- Each policy snippet has version number (e.g., `v2.1`)
- When policy updates, old messages still show original version
- New messages insert latest version
- References KB article ID for full text

**Example policy variables**:
```typescript
const policyVariables = [
  {
    id: "policy-finance-payment-plan",
    name: "Payment Plan Eligibility",
    version: "2.1",
    department: "Finance",
    body: "Students with balances over $1,000 and no account holds may request payment plans for 3, 6, or 12 months.",
    articleId: "kb-002",
    articleUrl: "/kb/payment-plan-eligibility",
    updatedAt: "2025-01-15T00:00:00Z"
  },
  {
    id: "policy-finance-refund",
    name: "Refund Policy",
    version: "1.3",
    department: "Finance",
    body: "Refunds for dropped courses are processed within 5-7 business days if dropped before the add/drop deadline.",
    articleId: "kb-004",
    articleUrl: "/kb/request-refund",
    updatedAt: "2024-12-10T00:00:00Z"
  }
];
```

---

### 11.4 Approval Gates

**When approval required**:
- AI confidence < 0.7
- Message contains restricted terms (stub list: "guarantee", "waive", "exception")
- Refund amount > $500
- Grade change request
- SLA override

**UI flow**:
1. Agent clicks "Send"
2. Validation detects approval needed
3. Modal appears:
   ```
   ⚠️ Manager Approval Required

   This message requires manager approval because:
   • Contains restricted term: "guarantee"
   • Refund amount exceeds $500 threshold

   A notification will be sent to your manager. The message will be queued until approved.

   [Cancel] [Request Approval]
   ```
4. On confirm: message saved as draft, manager notified (stub: console log)
5. Case status → "Waiting" with reason "Pending manager approval"

**Manager approval UI** (stub, shown in manager workspace):
```tsx
<Card>
  <CardHeader>
    <CardTitle>Pending Approval: TKT-20250001</CardTitle>
    <CardDescription>Sarah Johnson requested approval to send</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="prose prose-sm border-l-4 border-yellow-500 pl-3">
      <p>{draftMessage.body}</p>
    </div>
    <div className="mt-2 text-sm text-muted-foreground">
      Reason: Contains restricted term "guarantee" | Refund amount: $600
    </div>
  </CardContent>
  <CardFooter className="gap-2">
    <Button variant="destructive" onClick={handleReject}>Reject</Button>
    <Button variant="default" onClick={handleApprove}>Approve & Send</Button>
  </CardFooter>
</Card>
```

**Restricted terms** (demo list):
```typescript
const restrictedTerms = [
  "guarantee",
  "promise",
  "waive",
  "exception",
  "special case",
  "bend the rules"
];
```

---

### 11.5 Tone Control

**Available tones**:
- **Brief**: Short, direct (e.g., "Approved. Check email for details.")
- **Neutral**: Professional, balanced (default)
- **Warm**: Friendly, empathetic (e.g., "Hi Ahmed! Great news - your request is approved...")

**UI**: Dropdown in toolbar

```
┌─ Tone Selector ────────┐
│ ○ Brief                │
│ ● Neutral (selected)   │
│ ○ Warm                 │
└────────────────────────┘
```

**Behavior**:
- Switching tone RE-GENERATES AI draft (new API call)
- Shows loading state: "Regenerating in {tone} tone..."
- Replaces textarea content with new draft
- Preserves citations (may add/remove based on tone)

**MSW variants** (deterministic):
```typescript
const draftVariants = {
  brief: {
    body: "Payment plan approved for 6 months at $400/month. Details sent via email.",
    confidence: 0.91,
    citations: []
  },
  neutral: {
    body: "Hi Ahmed,\n\nYour payment plan request has been approved for 6 months at $400/month. You'll receive an email with the full schedule and payment instructions.\n\nIf you have questions, please reply to this message.\n\nBest regards,\nSarah",
    confidence: 0.89,
    citations: [{ articleId: "kb-002", articleTitle: "Payment Plan Eligibility" }]
  },
  warm: {
    body: "Hi Ahmed!\n\nGreat news - your payment plan request has been approved! 🎉\n\nWe've set you up with a 6-month plan at $400/month, which should make things much more manageable. You'll get an email shortly with all the details and payment instructions.\n\nFeel free to reach out if you have any questions - we're here to help!\n\nWarm regards,\nSarah",
    confidence: 0.85,
    citations: [{ articleId: "kb-002", articleTitle: "Payment Plan Eligibility" }]
  }
};
```

---

### 11.6 Multilingual

**Language detection**:
- Auto-detect student locale from profile (`preferredLanguage: "en" | "ar"`)
- Agent can override with language dropdown in toolbar

**RTL composer mode**:
- When `lang=ar`, textarea direction switches to RTL
- Toolbar buttons flip (left ↔ right)
- Formatting (bold, link) still works

**KB citation localization**:
- If Arabic article version exists, cite Arabic article
- If not, cite English article with note: "(English only)"

**Example**:
```typescript
// Student locale: ar
const aiDraftRequest = {
  caseId: "CASE-20250001",
  studentLocale: "ar",
  context: "Payment plan request for $2,400"
};

// MSW response
const aiDraftResponse = {
  body: "مرحباً أحمد،\n\nتمت الموافقة على طلب خطة الدفع الخاصة بك لمدة 6 أشهر بمبلغ 400 دولار شهريًا. ستتلقى بريدًا إلكترونيًا يحتوي على الجدول الكامل وتعليمات الدفع.\n\nإذا كان لديك أسئلة، يرجى الرد على هذه الرسالة.\n\nمع تحياتي،\nسارة",
  confidence: 0.87,
  citations: [
    {
      articleId: "kb-002-ar",
      articleTitle: "أهلية خطة الدفع",
      url: "/kb/payment-plan-eligibility?lang=ar"
    }
  ],
  language: "ar"
};
```

---

### 11.7 Safety Rails

**PII masking preview**:
- Before sending external message, scan for PII patterns
- Show warning modal if detected:
  ```
  ⚠️ Potential PII Detected

  We found what looks like sensitive information:
  • Social Security Number: ***-**-1234
  • Credit Card: ****-****-****-5678

  Please review before sending.

  [Cancel] [Send Anyway]
  ```

**PII patterns** (regex stubs):
```typescript
const piiPatterns = [
  { type: "SSN", regex: /\d{3}-\d{2}-\d{4}/, mask: "***-**-####" },
  { type: "Credit Card", regex: /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/, mask: "****-****-****-####" },
  { type: "Phone", regex: /\d{3}[\s.-]?\d{3}[\s.-]?\d{4}/, mask: "***-***-####" }
];
```

**Forbidden phrases** (stub list):
```typescript
const forbiddenPhrases = [
  "I promise",
  "I guarantee",
  "You definitely qualify",
  "This is a special exception just for you"
];
```

**Escalation trigger**:
- If AI confidence < 0.5 on 2+ consecutive drafts
- Auto-suggest: "This case may require manager review. [Escalate]"

---

### 11.8 State Machine

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Drafting: Click AI Draft
    Drafting --> DraftReady: API success
    Drafting --> DraftError: API fail
    DraftError --> Idle: Dismiss

    DraftReady --> Edited: User types
    Edited --> SendingMessage: Click Send
    DraftReady --> SendingMessage: Click Approve & Send

    SendingMessage --> NeedsApproval: Validation fail
    SendingMessage --> Sent: Success
    SendingMessage --> SendError: Fail

    NeedsApproval --> AwaitingApproval: Request approval
    AwaitingApproval --> Sent: Manager approves
    AwaitingApproval --> Idle: Manager rejects

    SendError --> Edited: Retry
    Sent --> Idle: Clear composer
```

**State storage**:
```typescript
interface ComposerState {
  mode: "idle" | "drafting" | "draftReady" | "edited" | "sending" | "needsApproval";
  draftText: string;
  aiDraft: {
    body: string;
    confidence: number;
    citations: Citation[];
    tone: "brief" | "neutral" | "warm";
  } | null;
  isInternalNote: boolean;
  validationErrors: string[];
}
```

---

### 11.9 Data & MSW

#### API Endpoint

**POST /api/ai/draft**

Request:
```json
{
  "caseId": "CASE-20250001",
  "context": {
    "studentName": "Ahmed Ali",
    "studentLocale": "en",
    "balance": 2400,
    "requestedMonths": 6
  },
  "tone": "neutral",
  "language": "en"
}
```

Response:
```json
{
  "data": {
    "id": "draft-001",
    "body": "Hi Ahmed,\n\nYour payment plan request has been approved for 6 months at $400/month. You'll receive an email with the full schedule and payment instructions.\n\nIf you have questions, please reply to this message.\n\nBest regards,\nSarah",
    "confidence": 0.89,
    "citations": [
      {
        "articleId": "kb-002",
        "articleTitle": "Payment Plan Eligibility",
        "snippetText": "Students with balances over $1,000 may request...",
        "url": "/kb/payment-plan-eligibility"
      }
    ],
    "tone": "neutral",
    "language": "en",
    "suggestedActions": [
      {
        "type": "set_status",
        "value": "Resolved",
        "label": "Mark as Resolved"
      }
    ]
  }
}
```

**MSW Handler**:
```typescript
export const aiDraftHandler = http.post('/api/ai/draft', async ({ request }) => {
  await delay(2000); // Simulate AI processing

  const body = await request.json();
  const { tone, language, context } = body;

  // Deterministic response based on tone
  const variant = draftVariants[tone] || draftVariants.neutral;

  return HttpResponse.json({
    data: {
      id: `draft-${Date.now()}`,
      ...variant,
      language
    }
  });
});
```

**Seed deterministic drafts**: First AI draft always includes Finance policy citation

---

### 11.10 Telemetry

```typescript
{
  event: "reops.ai.draft_clicked",
  props: {
    case_id: string,
    dept: string,
    tone: string,
    student_locale: string
  }
}

{
  event: "reops.ai.draft_inserted",
  props: {
    case_id: string,
    confidence: number,
    citation_count: number,
    tone: string,
    edited_before_send: boolean
  }
}

{
  event: "reops.ai.tone_changed",
  props: {
    case_id: string,
    from_tone: string,
    to_tone: string
  }
}

{
  event: "reops.macro.applied",
  props: {
    case_id: string,
    macro_id: string,
    macro_name: string,
    variable_count: number
  }
}

{
  event: "reops.approval.requested",
  props: {
    case_id: string,
    reason: string, // "low_confidence" | "restricted_term" | "high_value"
    assignee_id: string,
    manager_id: string
  }
}

{
  event: "reops.approval.resolved",
  props: {
    case_id: string,
    outcome: "approved" | "rejected",
    manager_id: string
  }
}
```

---

### 11.11 i18n Keys

**English**:
```json
{
  "composer.aiDraft": "AI Draft",
  "composer.tone": "Tone",
  "composer.tone.brief": "Brief",
  "composer.tone.neutral": "Neutral",
  "composer.tone.warm": "Warm",
  "composer.insertVariable": "Insert Variable",
  "composer.citeKB": "Cite KB",
  "composer.approveAndSend": "Approve & Send",
  "composer.send": "Send",
  "composer.cancel": "Cancel",
  "composer.internalNote": "Mark as Internal Note",
  "composer.confidence": "AI confidence: {percent}%",
  "composer.citations": "{count} citation(s)",
  "composer.drafting": "Generating draft...",
  "composer.regenerating": "Regenerating in {tone} tone...",
  "macro.preview": "Preview Macro",
  "macro.insert": "Insert Macro",
  "macro.search": "Search macros...",
  "macro.createNew": "Create New Macro",
  "policy.version": "Policy v{version}",
  "approval.required": "Manager Approval Required",
  "approval.reason.lowConfidence": "AI confidence below threshold",
  "approval.reason.restrictedTerm": "Contains restricted term: \"{term}\"",
  "approval.reason.highValue": "Amount exceeds approval threshold",
  "approval.request": "Request Approval",
  "approval.pending": "Pending manager approval",
  "pii.detected": "Potential PII Detected",
  "pii.warning": "Please review sensitive information before sending.",
  "pii.sendAnyway": "Send Anyway"
}
```

**Arabic**:
```json
{
  "composer.aiDraft": "مسودة AI",
  "composer.tone": "النبرة",
  "composer.tone.neutral": "محايد",
  "composer.tone.warm": "ودي",
  "composer.send": "إرسال",
  "composer.cancel": "إلغاء",
  "composer.confidence": "ثقة AI: {percent}%",
  "macro.preview": "معاينة الماكرو",
  "macro.insert": "إدراج الماكرو",
  "approval.required": "مطلوب موافقة المدير",
  "approval.request": "طلب الموافقة"
}
```

---

### 11.12 Acceptance Criteria

- [ ] Clicking "AI Draft" button shows loading state for 2s
- [ ] AI draft populates textarea with generated text
- [ ] Confidence score displays below composer (0-100%)
- [ ] Citations render as clickable badges above composer
- [ ] Clicking citation badge opens KB article in new tab
- [ ] Changing tone dropdown re-generates draft with new tone
- [ ] Tone regeneration shows "Regenerating..." loading state
- [ ] Macros dropdown shows searchable list filtered by department
- [ ] Selecting macro shows preview modal with placeholder values filled
- [ ] Inserting macro replaces composer text with rendered macro
- [ ] Missing placeholder values show warning before insert
- [ ] Policy variables insert as immutable callout blocks
- [ ] Callout shows policy version number and KB article link
- [ ] Message with confidence <0.7 triggers approval gate modal
- [ ] Message with restricted term triggers approval gate modal
- [ ] Approval request sets case status to "Waiting" with reason
- [ ] PII masking preview detects SSN, credit card patterns
- [ ] PII warning modal shows masked values with option to send anyway
- [ ] Arabic locale switches composer to RTL mode
- [ ] Arabic draft cites Arabic KB article when available
- [ ] Telemetry fires on draft_clicked, draft_inserted, tone_changed, macro_applied

---

## 12. Department-Specific Features

### 12.1 Finance

#### Approval Queue
**Use case**: Refunds >$500, payment plan exceptions require manager approval

**Filter** (inbox view):
```
/inbox?dept=Finance&queue=approval
```

**Approval card** (shown in manager workspace):
```tsx
<Card data-testid="approval-card">
  <CardHeader>
    <div className="flex items-center justify-between">
      <Badge variant="outline" className="bg-dept-finance">Finance</Badge>
      <Badge variant="destructive">Requires Approval</Badge>
    </div>
    <CardTitle className="text-lg">Refund Request: $650</CardTitle>
    <CardDescription>
      Student: Omar Farid (S5678901) | Requested by: Sarah Johnson
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="space-y-2 text-sm">
      <div>
        <span className="font-medium">Amount:</span> $650.00
      </div>
      <div>
        <span className="font-medium">Reason:</span> Medical withdrawal from 2 courses
      </div>
      <div>
        <span className="font-medium">Justification:</span> Student provided hospital documentation. Withdrawal submitted before 50% deadline.
      </div>
    </div>
  </CardContent>
  <CardFooter className="gap-2">
    <Button variant="destructive" onClick={() => handleReject("REQ-001")}>
      Reject
    </Button>
    <Button variant="default" onClick={() => handleApprove("REQ-001")}>
      Approve Refund
    </Button>
  </CardFooter>
</Card>
```

**Approval threshold**:
```typescript
const approvalThresholds = {
  refund: 500, // USD
  payment_plan_months: 12, // >12 months needs approval
  late_fee_waiver: 50 // any waiver needs approval
};
```

**Document request macro**:
- Macro: "Request Proof of Payment"
- Creates sub-task in case timeline
- Sub-task status: "Awaiting Document"
- When document uploaded, sub-task auto-resolves

**Sub-task rendering**:
```tsx
<div className="ml-8 border-l-2 border-muted pl-4">
  <div className="flex items-center gap-2 text-sm">
    <Checkbox checked={subtask.status === "complete"} disabled />
    <span className={subtask.status === "complete" ? "line-through text-muted-foreground" : ""}>
      {subtask.title}
    </span>
    {subtask.status === "pending" && (
      <Badge variant="secondary">Awaiting Document</Badge>
    )}
  </div>
</div>
```

#### Calculated Fields
**Payment plan calculator** (shown in case sidebar):

```tsx
<Card>
  <CardHeader>
    <CardTitle className="text-sm">Payment Plan Calculator</CardTitle>
  </CardHeader>
  <CardContent className="space-y-2 text-sm">
    <div className="flex justify-between">
      <span>Balance:</span>
      <span className="font-mono">${balance.toFixed(2)}</span>
    </div>
    <div className="flex justify-between">
      <span>Plan Duration:</span>
      <Select value={planMonths} onValueChange={setPlanMonths}>
        <SelectTrigger className="w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="3">3 mo</SelectItem>
          <SelectItem value="6">6 mo</SelectItem>
          <SelectItem value="12">12 mo</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <Separator />
    <div className="flex justify-between font-medium">
      <span>Monthly Payment:</span>
      <span className="font-mono text-lg">${(balance / planMonths).toFixed(2)}</span>
    </div>
  </CardContent>
</Card>
```

#### Acceptance Criteria
- [ ] Refund request >$500 triggers approval workflow
- [ ] Approval card shows in manager `/manager/approvals` queue
- [ ] Approving refund sets case status to "Resolved" and logs audit event
- [ ] Rejecting refund adds manager note and returns case to agent
- [ ] "Request Proof of Payment" macro creates sub-task in timeline
- [ ] Sub-task shows checkbox and "Awaiting Document" badge
- [ ] Uploading document to case auto-completes sub-task
- [ ] Payment plan calculator updates monthly amount when duration changes
- [ ] Calculator validates balance >$1,000 before showing plan options

---

### 12.2 Admissions

#### Document Checklist
**Rendering** (in Student 360 sidebar):

```tsx
<Card>
  <CardHeader>
    <CardTitle className="text-sm">Application Documents</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-2">
      {documents.map((doc) => (
        <div key={doc.type} className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {doc.status === "Verified" && <CheckCircle2 className="h-4 w-4 text-success" />}
            {doc.status === "Received" && <Clock className="h-4 w-4 text-warning" />}
            {doc.status === "Pending" && <Circle className="h-4 w-4 text-muted-foreground" />}
            <span>{doc.type}</span>
          </div>
          <Badge variant={
            doc.status === "Verified" ? "success" :
            doc.status === "Received" ? "secondary" :
            "outline"
          }>
            {doc.status}
          </Badge>
        </div>
      ))}
    </div>
  </CardContent>
</Card>
```

**Document types**:
```typescript
type DocumentType = "Transcript" | "ID" | "Recommendation" | "Test Scores" | "Essay";
type DocumentStatus = "Pending" | "Received" | "Verified" | "Rejected";

interface ApplicationDocument {
  type: DocumentType;
  status: DocumentStatus;
  uploadedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
}
```

#### Deadline Awareness
**Deadline chip** (shown in case header when <7 days):

```tsx
{nearestDeadline && isWithin7Days(nearestDeadline.date) && (
  <Alert variant="warning" className="mb-4">
    <AlertTriangle className="h-4 w-4" />
    <AlertTitle>Upcoming Deadline</AlertTitle>
    <AlertDescription>
      {nearestDeadline.name} is in {formatDistanceToNow(nearestDeadline.date)}
      ({format(nearestDeadline.date, "MMM dd, yyyy")})
    </AlertDescription>
  </Alert>
)}
```

**SLA adjustment**:
- If deadline <7 days: SLA firstResponse reduced to 1h (from 2h)
- If deadline <48h: Priority auto-elevated to "High"
- Timeline event logged: `deadline_sla_adjusted`

**Example deadlines**:
```typescript
const admissionsDeadlines = [
  { name: "Early Decision", date: "2025-11-01", department: "Admissions" },
  { name: "Regular Decision", date: "2025-02-01", department: "Admissions" },
  { name: "Transfer Application", date: "2025-03-15", department: "Admissions" },
  { name: "Financial Aid Priority", date: "2025-03-01", department: "Finance" }
];
```

#### Acceptance Criteria
- [ ] Document checklist shows all required documents with status icons
- [ ] Verified documents show green checkmark and "Verified" badge
- [ ] Pending documents show gray circle and "Pending" badge
- [ ] Clicking document opens upload modal (stub)
- [ ] Deadline chip appears when deadline <7 days
- [ ] Deadline chip shows relative time (e.g., "in 3 days")
- [ ] Case with deadline <7 days has SLA firstResponse = 1h
- [ ] Case with deadline <48h auto-elevates to High priority
- [ ] Timeline shows `deadline_sla_adjusted` event with reason

---

### 12.3 Registrar

#### Verification Letter Generator
**UI** (shown in case actions dropdown):

```tsx
<DropdownMenuItem onClick={handleGenerateVerificationLetter}>
  <FileText className="h-4 w-4 mr-2" />
  Generate Verification Letter
</DropdownMenuItem>
```

**Generation flow**:
1. Click action → modal opens
2. Select recipient (dropdown): "Student", "Third Party (email)", "Download PDF"
3. Letter type (dropdown): "Enrollment", "Degree", "Transcript Request"
4. Click "Generate" → mock 2s delay
5. Success toast: "Verification letter sent to student@email.com"
6. Timeline event logged: `verification_letter_generated`

**Macro auto-population**:
- Macro: "Enrollment Verification Response"
- Pulls `{{student_program}}` → "Computer Science, BS"
- Pulls `{{student_term}}` → "Fall 2025"
- Pulls `{{enrollment_status}}` → "Full-time"

**Example macro body**:
```
Hi {{student_name}},

Your enrollment verification letter has been generated and sent to {{recipient_email}}.

Verification Details:
- Program: {{student_program}}
- Term: {{student_term}}
- Status: {{enrollment_status}}

If you need additional copies, please reply to this message.

Best regards,
{{agent_name}}
```

#### Course Code Validation
**Validation** (in composer or macro):

```typescript
const courseCodeRegex = /^[A-Z]{2,4}\s?\d{3}[A-Z]?$/;

function validateCourseCode(code: string): { valid: boolean; error?: string } {
  if (!courseCodeRegex.test(code)) {
    return {
      valid: false,
      error: "Invalid course code format. Expected format: DEPT 123 (e.g., CS 101, BIO 201A)"
    };
  }
  return { valid: true };
}
```

**UI feedback**:
```tsx
<div className="space-y-2">
  <Label>Course Code</Label>
  <Input
    value={courseCode}
    onChange={(e) => setCourseCode(e.target.value)}
    className={!validation.valid ? "border-destructive" : ""}
  />
  {!validation.valid && (
    <p className="text-sm text-destructive">{validation.error}</p>
  )}
</div>
```

**Helpful error**: Shows example format and link to course catalog

#### Acceptance Criteria
- [ ] "Generate Verification Letter" action appears in case dropdown
- [ ] Clicking action opens modal with recipient and letter type selects
- [ ] Generating letter shows 2s loading state
- [ ] Success toast shows recipient email
- [ ] Timeline event `verification_letter_generated` appears with details
- [ ] Verification macro pulls student program, term, enrollment status
- [ ] Course code input validates format on blur
- [ ] Invalid course code shows error message with example format
- [ ] Valid course code allows macro send

---

### 12.4 Housing

#### Maintenance Request Child-Case
**Use case**: Room maintenance requires IT/Facilities handoff

**Creation flow**:
1. Agent tags case with "maintenance_required"
2. Click "Create Maintenance Request" button
3. Modal captures:
   - Issue type (dropdown): "Plumbing", "Electrical", "HVAC", "Internet", "Furniture"
   - Room number (auto-filled from student profile)
   - Urgency (dropdown): "Low", "Normal", "High", "Emergency"
4. Click "Create" → spawns child case assigned to Facilities/IT dept
5. Parent case shows dependency in timeline

**Parent-child linking**:
```tsx
<div className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50">
  <div className="flex items-center gap-2 text-sm">
    <GitBranch className="h-4 w-4 text-blue-700" />
    <span className="font-medium text-blue-900">Child Case Created</span>
  </div>
  <p className="text-sm text-blue-800 mt-1">
    Maintenance Request: <Link href="/cases/CASE-20250100" className="underline">TKT-20250100</Link>
  </p>
  <div className="flex items-center gap-2 mt-2">
    <Badge variant="secondary">Facilities</Badge>
    <Badge variant={childCase.status === "Resolved" ? "success" : "secondary"}>
      {childCase.status}
    </Badge>
  </div>
</div>
```

**Child case references parent**:
```tsx
<Alert variant="info" className="mb-4">
  <Info className="h-4 w-4" />
  <AlertTitle>Parent Case</AlertTitle>
  <AlertDescription>
    This maintenance request was created from <Link href="/cases/CASE-20250005">TKT-20250005</Link>
  </AlertDescription>
</Alert>
```

**Parent status dependency**:
- Parent cannot be "Resolved" until all child cases resolved
- Attempting to resolve shows validation error:
  ```
  ⚠️ Cannot resolve case

  This case has 1 open child case:
  • TKT-20250100 (Maintenance Request - In Progress)

  Please resolve child cases first or unlink them.
  ```

#### Room Assignment Tag & Filter
**Tag auto-applied** from student profile: `room:B204`

**Filter** (inbox):
```
/inbox?dept=Housing&tags=room:B204
```

Shows all cases for students in room B204 (useful for building-wide issues)

#### Acceptance Criteria
- [ ] "Create Maintenance Request" button appears for Housing cases
- [ ] Clicking button opens modal with issue type, room number, urgency
- [ ] Room number auto-filled from student profile
- [ ] Creating request spawns child case assigned to Facilities dept
- [ ] Parent case timeline shows child case link with status badge
- [ ] Child case header shows parent case link in alert banner
- [ ] Parent case cannot be resolved until child case resolved
- [ ] Validation error shows open child cases with links
- [ ] Room tag auto-applied to Housing cases from student profile
- [ ] Inbox filter by room tag returns all cases for that room

---

### 12.5 IT Helpdesk

#### Password Reset Gated
**Use case**: Prevent account compromise, require 2FA confirmation

**UI** (case actions):

```tsx
<Card>
  <CardHeader>
    <CardTitle className="text-sm">Security Verification</CardTitle>
  </CardHeader>
  <CardContent className="space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Checkbox
          id="2fa-verified"
          checked={twoFactorVerified}
          onCheckedChange={setTwoFactorVerified}
        />
        <Label htmlFor="2fa-verified" className="text-sm">
          2FA confirmed via email/SMS
        </Label>
      </div>
      {twoFactorVerified && <CheckCircle2 className="h-4 w-4 text-success" />}
    </div>

    {failedAttempts >= 3 && (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>High-Risk Account</AlertTitle>
        <AlertDescription>
          {failedAttempts} failed login attempts detected. Extra verification required.
        </AlertDescription>
      </Alert>
    )}
  </CardContent>
  <CardFooter>
    <Button
      className="w-full"
      disabled={!twoFactorVerified}
      onClick={handleResetPassword}
    >
      Reset Password
    </Button>
  </CardFooter>
</Card>
```

**Validation**:
- Cannot set status to "Resolved" until `twoFactorVerified === true`
- Attempting to resolve shows error toast: "2FA confirmation required before resolving password reset"

**High-risk flag**:
- If `failedAttempts >= 3`, show banner
- Auto-elevate priority to "High"
- Require manager approval for password reset (approval gate)

#### Asset Link
**Rendering** (Related Entities sidebar):

```tsx
<Card>
  <CardHeader>
    <CardTitle className="text-sm">Related Assets</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-2 text-sm">
      <div className="flex items-center gap-2">
        <Laptop className="h-4 w-4 text-muted-foreground" />
        <div className="flex-1">
          <p className="font-medium">Dell Latitude 5420</p>
          <p className="text-xs text-muted-foreground">Serial: DL-2024-00567</p>
        </div>
        <Badge variant="success">Active</Badge>
      </div>
      <div className="flex items-center gap-2">
        <Wifi className="h-4 w-4 text-muted-foreground" />
        <div className="flex-1">
          <p className="font-medium">Network Access</p>
          <p className="text-xs text-muted-foreground">MAC: A1:B2:C3:D4:E5:F6</p>
        </div>
        <Badge variant="secondary">Registered</Badge>
      </div>
    </div>
  </CardContent>
</Card>
```

**Asset types**:
```typescript
interface Asset {
  id: string;
  type: "Laptop" | "Desktop" | "Network Access" | "Software License";
  model?: string;
  serialNumber?: string;
  macAddress?: string;
  status: "Active" | "Inactive" | "Pending";
  assignedAt: string;
}
```

#### Acceptance Criteria
- [ ] Password reset cases show "Security Verification" card in sidebar
- [ ] 2FA checkbox disabled until agent confirms via external verification
- [ ] "Reset Password" button disabled until 2FA checkbox checked
- [ ] Attempting to resolve without 2FA shows validation error toast
- [ ] Cases with failedAttempts ≥3 show high-risk alert banner
- [ ] High-risk cases auto-elevate priority to "High"
- [ ] High-risk password resets trigger manager approval gate
- [ ] Related Assets card shows linked hardware with serial numbers
- [ ] Asset status badge shows "Active", "Inactive", or "Pending"

---

**Cross-cutting requirements**:

**A11y**:
- Table has `role="table"`, headers have `scope="col"`
- Checkboxes labeled with case ticket number
- Modals trap focus and close on Esc
- Toasts announced via `aria-live="polite"`
- Async row updates announced to screen readers

**Performance**:
- Inbox table virtualized when >200 rows
- Knowledge panel search deferred until tab opened
- Composer tone swap debounced 250ms
- Message thread lazy-loads images (only when scrolled into view)

**Security (demo)**:
- PII visible only to Manager/Admin unless "Show PII" toggle enabled
- Toggle logs audit event: `pii.view_toggled`
- Redact SSN, credit card in agent view by default

## 13. Manager Dashboards

### 13.1 Overview Screen Blueprint

**Layout** (desktop, 1440px viewport):

```
┌─ Header (56px) ──────────────────────────────────────────────────┐
│ Manager Overview | Finance Department    [Last 7 days ▾] [⟳]    │
├─ Metric Cards Row (120px) ───────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│ │ Open Cases  │ │ SLA Breach  │ │ Avg First   │ │ Utilization │ │
│ │ 127         │ │ 4.2%        │ │ Reply: 1.8h │ │ 78%         │ │
│ │ +12% ↑      │ │ -0.8% ↓     │ │ -0.3h ↓     │ │ +5% ↑       │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
├─ Charts Row (400px) ──────────────────────────────────────────────┤
│ ┌─ Queue Health Heatmap (60%) ─────┬─ Intake vs Resolution (40%)│
│ │         Green  Yellow  Red        │                             │
│ │ Finance   42     18     12        │ [Line chart: 30d trend]     │
│ │ Admis.    35     22      8        │ Intake: 450/wk              │
│ │ Registr   28     15      5        │ Resolved: 430/wk            │
│ │ Housing   20     10      3        │ Gap: +20                    │
│ │ IT        15      8      2        │                             │
│ └───────────────────────────────────┴─────────────────────────────┘
├─ Action Rail (80px) ──────────────────────────────────────────────┤
│ 💡 Rebalancing Suggestion                                        │
│ Finance queue has 12 red SLA cases. Suggested: Assign 6 to Sarah,│
│ 4 to David, 2 to Emily. [Explain] [Apply] [Dismiss]             │
└───────────────────────────────────────────────────────────────────┘
```

**Components**:
- `<Card>` for metric tiles with trend indicators
- `<Table>` or `<div>` grid for heatmap (color-coded cells)
- `<LineChart>` (Recharts) for intake vs resolution
- `<Alert>` variant="info" for rebalancing suggestion
- `<Tabs>` for time range (7d, 30d, 90d, All)

**Metric Cards**:
```tsx
<Card>
  <CardHeader className="pb-2">
    <CardTitle className="text-sm font-medium text-muted-foreground">
      Open Cases
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-3xl font-bold">127</div>
    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
      <TrendingUp className="h-3 w-3 text-success" />
      <span className="text-success">+12%</span>
      <span>vs last period</span>
    </div>
  </CardContent>
</Card>
```

**Queue Health Heatmap**:
```tsx
<div className="grid grid-cols-4 gap-2">
  <div className="font-medium">Department</div>
  <div className="text-center font-medium">Green</div>
  <div className="text-center font-medium">Yellow</div>
  <div className="text-center font-medium">Red</div>

  {queueHealth.map((dept) => (
    <>
      <div>{dept.name}</div>
      <div className="text-center">
        <Badge variant="success">{dept.green}</Badge>
      </div>
      <div className="text-center">
        <Badge variant="warning">{dept.yellow}</Badge>
      </div>
      <div className="text-center">
        <Badge variant="destructive">{dept.red}</Badge>
      </div>
    </>
  ))}
</div>
```

**Deflection Rate Chart** (additional, below main charts):
```tsx
<Card>
  <CardHeader>
    <CardTitle>Deflection Rate (Last 30 Days)</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>KB Self-Solve</span>
        <span className="font-medium">42%</span>
      </div>
      <Progress value={42} className="h-2" />

      <div className="flex justify-between text-sm">
        <span>Chat Resolution</span>
        <span className="font-medium">18%</span>
      </div>
      <Progress value={18} className="h-2" />

      <div className="flex justify-between text-sm">
        <span>Total Deflection</span>
        <span className="font-medium text-success">60%</span>
      </div>
      <Progress value={60} className="h-2" />
    </div>
  </CardContent>
</Card>
```

---

### 13.2 Queue Health View

**Table Layout**:
```
┌─ Queue Health ────────────────────────────────────────────────────┐
│ Department | Queue         | WIP | Limit | Risk Index | Oldest    │
│────────────────────────────────────────────────────────────────────│
│ Finance    | Primary       | 42  | 50    | 0.84 ⚠️    | 18h       │
│ Finance    | Approval      | 8   | 10    | 0.45 ✓     | 6h        │
│ Admissions | Primary       | 35  | 40    | 0.72 ⚠️    | 12h       │
│ Registrar  | Primary       | 28  | 35    | 0.58 ✓     | 8h        │
│ IT         | Primary       | 15  | 25    | 0.32 ✓     | 4h        │
└───────────────────────────────────────────────────────────────────┘
[Bulk Actions: Reassign Selected] [Adjust WIP Limits]
```

**Risk Index Calculation**:
```typescript
interface QueueHealth {
  department: string;
  queueName: string;
  wip: number; // work in progress count
  wipLimit: number;
  riskIndex: number; // 0-1, calculated
  oldestCaseAge: number; // minutes
  breachCount: number;
  avgWaitTime: number; // minutes
}

function calculateRiskIndex(queue: QueueHealth): number {
  const wipRatio = queue.wip / queue.wipLimit; // 0.84
  const breachRatio = queue.breachCount / queue.wip; // 0.12
  const ageRatio = Math.min(queue.oldestCaseAge / 1440, 1); // normalized to 24h

  // Weighted average
  return (wipRatio * 0.4) + (breachRatio * 0.4) + (ageRatio * 0.2);
}

// Risk levels
// <0.5: green ✓
// 0.5-0.75: yellow ⚠️
// >0.75: red 🔴
```

**Bulk Reassign Modal**:
```tsx
<Dialog>
  <DialogHeader>
    <DialogTitle>Bulk Reassign Cases</DialogTitle>
    <DialogDescription>
      Reassigning {selectedCount} cases from Finance Primary queue
    </DialogDescription>
  </DialogHeader>
  <DialogContent>
    <div className="space-y-4">
      <div>
        <Label>Assign to</Label>
        <Select value={targetAgent} onValueChange={setTargetAgent}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {agents.map((agent) => (
              <SelectItem key={agent.id} value={agent.id}>
                {agent.name} ({agent.currentWorkload} open)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="p-3 bg-muted rounded">
        <p className="text-sm font-medium">Impact Preview:</p>
        <ul className="text-sm mt-2 space-y-1">
          <li>Sarah: 12 → 18 cases (+50%)</li>
          <li>Finance Primary: Risk 0.84 → 0.62 (-26%)</li>
          <li>Estimated resolution time: -4.2h</li>
        </ul>
      </div>
    </div>
  </DialogContent>
  <DialogFooter>
    <Button variant="outline" onClick={closeDialog}>Cancel</Button>
    <Button onClick={handleReassign}>Reassign {selectedCount} Cases</Button>
  </DialogFooter>
</Dialog>
```

---

### 13.3 Quality & Coaching

**Spot-Check Queue** (lightweight sampling):

```
┌─ Quality Review ──────────────────────────────────────────────────┐
│ Random Sample (5 cases from last 24h)              [Next Batch]   │
│────────────────────────────────────────────────────────────────────│
│ TKT-20250042 | Sarah Johnson | Finance                            │
│ ⭐⭐⭐⭐⭐ Excellent response time, clear explanation            │
│ [View Case] [Approve] [Request Changes]                          │
│                                                                    │
│ TKT-20250038 | David Lee | Admissions                            │
│ ⭐⭐⭐ Good but missing policy citation                          │
│ [View Case] [Approve] [Request Changes]                          │
│────────────────────────────────────────────────────────────────────│
```

**Rate Limiting**: Max 10 reviews per manager per day (prevent micromanagement)

**Feedback Form**:
```tsx
<Dialog>
  <DialogHeader>
    <DialogTitle>Quality Feedback: TKT-20250038</DialogTitle>
  </DialogHeader>
  <DialogContent>
    <div className="space-y-4">
      <div>
        <Label>Rating</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                "h-6 w-6 cursor-pointer",
                rating >= star ? "fill-yellow-400 text-yellow-400" : "text-muted"
              )}
              onClick={() => setRating(star)}
            />
          ))}
        </div>
      </div>

      <div>
        <Label>Feedback</Label>
        <Textarea
          placeholder="Great job! Consider citing the payment plan policy article next time."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={4}
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="coaching"
          checked={isCoaching}
          onCheckedChange={setIsCoaching}
        />
        <Label htmlFor="coaching" className="text-sm">
          Mark as coaching moment (agent will be notified)
        </Label>
      </div>
    </div>
  </DialogContent>
  <DialogFooter>
    <Button variant="outline" onClick={closeDialog}>Cancel</Button>
    <Button onClick={handleSubmitFeedback}>Submit Feedback</Button>
  </DialogFooter>
</Dialog>
```

---

### 13.4 Alerts

**Alert List**:
```
┌─ Alerts & Anomalies ──────────────────────────────────────────────┐
│ 🔴 Surge Alert | Finance                              2m ago      │
│ Intake rate 3.2x normal (18 cases in last hour vs avg 5.6/h)      │
│ [View Queue] [Acknowledge] [Snooze 1h]                           │
│                                                                    │
│ ⚠️ SLA Breach Trend | Admissions                     15m ago      │
│ Breach rate increased 12% over last 3 days (now 8.2%)            │
│ [View Trend] [Acknowledge] [Snooze 1h]                           │
│                                                                    │
│ 💡 Agent Capacity | IT                                1h ago      │
│ Emily Chen workload 2.5x avg (25 cases vs team avg 10)           │
│ [Rebalance] [Acknowledge] [Snooze 4h]                            │
└───────────────────────────────────────────────────────────────────┘
```

**Alert Types**:
```typescript
type AlertType =
  | "surge" // intake rate spike
  | "breach_trend" // SLA breach % increasing
  | "capacity" // agent overloaded
  | "anomaly" // statistical outlier
  | "queue_stalled"; // no movement in >4h

interface Alert {
  id: string;
  type: AlertType;
  severity: "info" | "warning" | "critical";
  department: string;
  title: string;
  description: string;
  detectedAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  snoozedUntil?: string;
  actionUrl?: string; // e.g., /inbox?dept=Finance&sla=red
}
```

**Acknowledge/Snooze Logic**:
```typescript
// Acknowledge: marks alert as seen, hides from list
function acknowledgeAlert(alertId: string, userId: string) {
  // PATCH /api/manager/alerts/:id
  // Logs: reops.manager.alert_ack
}

// Snooze: hides for duration, reappears if condition persists
function snoozeAlert(alertId: string, duration: "1h" | "4h" | "24h") {
  const snoozedUntil = new Date(Date.now() + parseDuration(duration));
  // Recheck condition at snoozedUntil
}
```

---

### 13.5 Rebalancing Model (Stub)

**Heuristic Algorithm**:
```typescript
interface RebalanceSuggestion {
  queueId: string;
  targetAgents: {
    agentId: string;
    agentName: string;
    caseIds: string[];
    currentWorkload: number;
    projectedWorkload: number;
  }[];
  explanation: string;
  expectedImpact: {
    riskReduction: number; // percentage
    avgResolutionTimeReduction: number; // hours
  };
}

function suggestRebalancing(queue: QueueHealth): RebalanceSuggestion | null {
  // Simple heuristic
  if (queue.riskIndex < 0.75) return null; // no action needed

  const casesToReassign = Math.ceil(queue.wip * 0.3); // reassign 30%
  const availableAgents = getAgents(queue.department)
    .filter((a) => a.currentWorkload < 15) // capacity threshold
    .sort((a, b) => a.currentWorkload - b.currentWorkload); // least loaded first

  if (availableAgents.length === 0) return null;

  // Distribute cases evenly
  const distribution = distributeCases(casesToReassign, availableAgents);

  return {
    queueId: queue.id,
    targetAgents: distribution,
    explanation: `${queue.queueName} has ${queue.wip} cases (${queue.riskIndex * 100}% risk). Suggested: Reassign ${casesToReassign} cases to ${availableAgents.length} available agents.`,
    expectedImpact: {
      riskReduction: 26, // calculated
      avgResolutionTimeReduction: 4.2
    }
  };
}
```

**Apply Rebalancing**:
```typescript
// POST /api/queues/rebalance
// Request
{
  queueId: "finance:primary",
  assignments: [
    { agentId: "agent-002", caseIds: ["CASE-001", "CASE-002", "CASE-003"] },
    { agentId: "agent-003", caseIds: ["CASE-004", "CASE-005"] }
  ]
}

// Response
{
  data: {
    applied: 5,
    failed: 0,
    riskBefore: 0.84,
    riskAfter: 0.62,
    rollbackToken: "rbk-xyz123" // valid for 5min
  }
}
```

**Undo/Rollback**:
```typescript
// POST /api/queues/rebalance/undo
// Request
{
  rollbackToken: "rbk-xyz123"
}

// Response: restores previous assignments
```

---

### 13.6 Keyboard Map

**Navigation**:
- `1` / `2` / `3` / `4` - Switch tabs (Overview / Queues / Quality / Alerts)
- `R` - Recompute metrics (refresh)
- `Cmd/Ctrl-R` - Full page reload (browser default)

**Actions**:
- `A` - Acknowledge highlighted alert
- `S` - Snooze highlighted alert (opens duration picker)
- `G` - Go to inbox with current filters (e.g., dept=Finance, sla=red)
- `B` - Apply rebalancing suggestion (if visible)

**Conflict Resolution**:
- When modal open, all background shortcuts disabled
- When dropdown open, navigation shortcuts disabled
- Browser shortcuts (Cmd-T, Cmd-W) preserved

---

### 13.7 State Machine

```mermaid
stateDiagram-v2
    [*] --> Loading
    Loading --> Loaded: Data fetched
    Loading --> Error: Fetch failed
    Error --> Loading: Retry

    Loaded --> Recomputing: Click Refresh
    Recomputing --> Loaded: Success
    Recomputing --> Error: Fail

    Loaded --> ApplyingRebalance: Click Apply
    ApplyingRebalance --> RebalanceApplied: Success
    ApplyingRebalance --> Error: Fail

    RebalanceApplied --> Loaded: Auto-refresh
    RebalanceApplied --> RollingBack: Click Undo
    RollingBack --> Loaded: Rollback success

    Loaded --> AcknowledgingAlert: Click Acknowledge
    AcknowledgingAlert --> Loaded: Alert dismissed
```

**State Storage** (Zustand):
```typescript
interface ManagerDashboardState {
  timeRange: "7d" | "30d" | "90d" | "all";
  metrics: {
    openCases: number;
    breachRate: number;
    avgFirstReply: number; // hours
    utilization: number; // percentage
  };
  queueHealth: QueueHealth[];
  alerts: Alert[];
  rebalanceSuggestion: RebalanceSuggestion | null;
  lastRefresh: Date;
  isRecomputing: boolean;
}
```

---

### 13.8 Data & APIs

#### GET /api/manager/overview

Request:
```
GET /api/manager/overview?timeRange=7d&dept=Finance
```

Response:
```json
{
  "data": {
    "metrics": {
      "openCases": 127,
      "openCasesTrend": 12, // percentage change
      "breachRate": 4.2,
      "breachRateTrend": -0.8,
      "avgFirstReply": 1.8, // hours
      "avgFirstReplyTrend": -0.3,
      "utilization": 78,
      "utilizationTrend": 5
    },
    "queueHealth": [
      {
        "department": "Finance",
        "queueName": "Primary",
        "green": 42,
        "yellow": 18,
        "red": 12,
        "wip": 72,
        "wipLimit": 80,
        "riskIndex": 0.84,
        "oldestCaseAge": 1080
      }
    ],
    "timeSeries": {
      "intake": [
        { "date": "2025-01-24", "count": 58 },
        { "date": "2025-01-25", "count": 62 },
        { "date": "2025-01-26", "count": 71 },
        { "date": "2025-01-27", "count": 68 },
        { "date": "2025-01-28", "count": 65 },
        { "date": "2025-01-29", "count": 73 },
        { "date": "2025-01-30", "count": 78 }
      ],
      "resolved": [
        { "date": "2025-01-24", "count": 55 },
        { "date": "2025-01-25", "count": 59 },
        { "date": "2025-01-26", "count": 64 },
        { "date": "2025-01-27", "count": 61 },
        { "date": "2025-01-28", "count": 58 },
        { "date": "2025-01-29", "count": 67 },
        { "date": "2025-01-30", "count": 72 }
      ]
    },
    "deflection": {
      "kbSelfSolve": 42,
      "chatResolution": 18,
      "total": 60
    }
  }
}
```

#### GET /api/manager/queues

Response:
```json
{
  "data": [
    {
      "id": "finance:primary",
      "department": "Finance",
      "queueName": "Primary",
      "wip": 72,
      "wipLimit": 80,
      "riskIndex": 0.84,
      "oldestCaseAge": 1080,
      "breachCount": 12,
      "avgWaitTime": 145
    },
    {
      "id": "finance:approval",
      "department": "Finance",
      "queueName": "Approval",
      "wip": 8,
      "wipLimit": 10,
      "riskIndex": 0.45,
      "oldestCaseAge": 360,
      "breachCount": 2,
      "avgWaitTime": 78
    }
  ]
}
```

#### POST /api/queues/rebalance

Request:
```json
{
  "queueId": "finance:primary",
  "assignments": [
    {
      "agentId": "agent-002",
      "caseIds": ["CASE-20250001", "CASE-20250005", "CASE-20250008"]
    },
    {
      "agentId": "agent-003",
      "caseIds": ["CASE-20250002", "CASE-20250006"]
    }
  ]
}
```

Response:
```json
{
  "data": {
    "applied": 5,
    "failed": 0,
    "riskBefore": 0.84,
    "riskAfter": 0.62,
    "impactSummary": {
      "agent-002": { "before": 12, "after": 15 },
      "agent-003": { "before": 8, "after": 10 }
    },
    "rollbackToken": "rbk-xyz123",
    "rollbackExpiresAt": "2025-01-30T15:35:00Z"
  }
}
```

---

### 13.9 MSW Seed

**Weekly Seasonality** (controlled randomness):
```typescript
function generateTimeSeriesData(baseCount: number, dateRange: string): TimeSeriesPoint[] {
  const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
  const result: TimeSeriesPoint[] = [];

  for (let i = 0; i < days; i++) {
    const date = subDays(new Date(), days - i);
    const dayOfWeek = date.getDay();

    // Seasonal multiplier
    let seasonal = 1.0;
    if (date.getMonth() === 7) seasonal = 1.4; // August spike (fall enrollment)
    if (date.getMonth() === 0) seasonal = 1.35; // January spike (spring enrollment)

    // Weekly pattern (lower on weekends)
    const weeklyMultiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 0.3 : 1.0;

    // Controlled randomness ±15%
    const randomness = 0.85 + (Math.random() * 0.3);

    const count = Math.round(baseCount * seasonal * weeklyMultiplier * randomness);

    result.push({
      date: format(date, "yyyy-MM-dd"),
      count
    });
  }

  return result;
}

// Seed example
const intakeData = generateTimeSeriesData(65, "7d"); // base 65/day
const resolvedData = generateTimeSeriesData(62, "7d"); // base 62/day (slight backlog)
```

**Department-Specific Breach Patterns**:
```typescript
const breachPatterns = {
  Finance: {
    baseRate: 4.2, // 4.2% breach rate
    volatility: 1.5, // higher variance (payment deadlines)
    seasonalSpike: { months: [0, 7], multiplier: 1.8 }
  },
  Admissions: {
    baseRate: 8.2,
    volatility: 2.0, // very volatile (deadline-driven)
    seasonalSpike: { months: [10, 1], multiplier: 2.5 } // Nov/Feb
  },
  Registrar: {
    baseRate: 3.1,
    volatility: 0.8, // stable
    seasonalSpike: { months: [7, 0], multiplier: 1.4 }
  },
  IT: {
    baseRate: 2.5,
    volatility: 1.2, // moderate
    seasonalSpike: { months: [7], multiplier: 1.6 } // start of semester
  }
};
```

**Alert Generation** (deterministic):
```typescript
const seedAlerts: Alert[] = [
  {
    id: "alert-001",
    type: "surge",
    severity: "critical",
    department: "Finance",
    title: "Surge Alert",
    description: "Intake rate 3.2x normal (18 cases in last hour vs avg 5.6/h)",
    detectedAt: subMinutes(new Date(), 2).toISOString(),
    actionUrl: "/inbox?dept=Finance"
  },
  {
    id: "alert-002",
    type: "breach_trend",
    severity: "warning",
    department: "Admissions",
    title: "SLA Breach Trend",
    description: "Breach rate increased 12% over last 3 days (now 8.2%)",
    detectedAt: subMinutes(new Date(), 15).toISOString(),
    actionUrl: "/manager/queues?dept=Admissions"
  },
  {
    id: "alert-003",
    type: "capacity",
    severity: "warning",
    department: "IT",
    title: "Agent Capacity",
    description: "Emily Chen workload 2.5x avg (25 cases vs team avg 10)",
    detectedAt: subHours(new Date(), 1).toISOString(),
    actionUrl: "/manager/queues?dept=IT"
  }
];
```

---

### 13.10 Telemetry

```typescript
// Rebalancing
{
  event: "reops.manager.rebalance_applied",
  props: {
    queue_id: string,
    cases_reassigned: number,
    target_agents: string[], // agent IDs
    risk_before: number,
    risk_after: number,
    delta_assigned: number // positive = more balanced
  }
}

{
  event: "reops.manager.rebalance_undone",
  props: {
    queue_id: string,
    rollback_token: string,
    seconds_since_apply: number
  }
}

// Alerts
{
  event: "reops.manager.alert_acknowledged",
  props: {
    alert_id: string,
    alert_type: string,
    severity: string,
    time_to_ack_minutes: number
  }
}

{
  event: "reops.manager.alert_snoozed",
  props: {
    alert_id: string,
    snooze_duration: string, // "1h" | "4h" | "24h"
  }
}

// Quality
{
  event: "reops.manager.quality_review_submitted",
  props: {
    case_id: string,
    agent_id: string,
    rating: number, // 1-5
    is_coaching: boolean
  }
}

// Dashboard
{
  event: "reops.manager.dashboard_refreshed",
  props: {
    time_range: string,
    department: string | null,
    load_time_ms: number
  }
}
```

---

### 13.11 i18n Keys

**English**:
```json
{
  "manager.overview.title": "Manager Overview",
  "manager.metrics.openCases": "Open Cases",
  "manager.metrics.breachRate": "SLA Breach Rate",
  "manager.metrics.avgFirstReply": "Avg First Reply",
  "manager.metrics.utilization": "Utilization",
  "manager.queueHealth.title": "Queue Health Heatmap",
  "manager.queueHealth.green": "Green",
  "manager.queueHealth.yellow": "Yellow",
  "manager.queueHealth.red": "Red",
  "manager.chart.intakeVsResolution": "Intake vs Resolution",
  "manager.chart.intake": "Intake",
  "manager.chart.resolved": "Resolved",
  "manager.chart.gap": "Gap",
  "manager.deflection.title": "Deflection Rate",
  "manager.deflection.kbSelfSolve": "KB Self-Solve",
  "manager.deflection.chatResolution": "Chat Resolution",
  "manager.deflection.total": "Total Deflection",
  "manager.rebalance.suggestion": "Rebalancing Suggestion",
  "manager.rebalance.explain": "Explain",
  "manager.rebalance.apply": "Apply",
  "manager.rebalance.dismiss": "Dismiss",
  "manager.rebalance.undo": "Undo",
  "manager.queues.title": "Queue Health",
  "manager.queues.wip": "WIP",
  "manager.queues.limit": "Limit",
  "manager.queues.riskIndex": "Risk Index",
  "manager.queues.oldest": "Oldest",
  "manager.quality.title": "Quality Review",
  "manager.quality.nextBatch": "Next Batch",
  "manager.quality.approve": "Approve",
  "manager.quality.requestChanges": "Request Changes",
  "manager.alerts.title": "Alerts & Anomalies",
  "manager.alerts.acknowledge": "Acknowledge",
  "manager.alerts.snooze": "Snooze",
  "manager.keyboard.help": "Keyboard Shortcuts"
}
```

**Arabic**:
```json
{
  "manager.overview.title": "نظرة عامة للمدير",
  "manager.metrics.openCases": "الحالات المفتوحة",
  "manager.metrics.breachRate": "معدل خرق اتفاقية مستوى الخدمة",
  "manager.metrics.avgFirstReply": "متوسط الرد الأول",
  "manager.metrics.utilization": "معدل الاستخدام",
  "manager.queueHealth.title": "صحة قائمة الانتظار",
  "manager.rebalance.apply": "تطبيق",
  "manager.rebalance.dismiss": "رفض",
  "manager.queues.riskIndex": "مؤشر المخاطر",
  "manager.alerts.acknowledge": "إقرار"
}
```

---

### 13.12 Acceptance Criteria

- [ ] Overview loads with 4 metric cards showing current values + trends
- [ ] Metric trends show up/down arrows with correct colors (green for positive metrics)
- [ ] Queue health heatmap displays all departments with green/yellow/red counts
- [ ] Heatmap cells use correct color badges from §3 design tokens
- [ ] Intake vs Resolution chart shows 7-day line chart with dual axes
- [ ] Chart renders correctly with Recharts library
- [ ] Deflection rate shows KB and Chat percentages with progress bars
- [ ] Rebalancing suggestion appears when queue riskIndex >0.75
- [ ] Clicking "Explain" shows detailed breakdown of suggestion logic
- [ ] Clicking "Apply" opens confirmation modal with impact preview
- [ ] Applying rebalance updates queue risk index immediately (optimistic)
- [ ] Undo button appears for 5 minutes after apply with countdown timer
- [ ] Clicking "Undo" restores previous assignments and updates UI
- [ ] Queue health table sorts by risk index (highest first)
- [ ] Clicking queue row navigates to filtered inbox view
- [ ] Quality review shows 5 random cases from last 24h
- [ ] "Next Batch" button loads 5 new random cases (rate-limited to 10/day)
- [ ] Submitting quality feedback logs telemetry event with rating
- [ ] Alerts list shows most recent alerts first (unacknowledged at top)
- [ ] Acknowledging alert removes it from list with fade animation
- [ ] Snoozing alert hides it and shows "Snoozed until" timestamp
- [ ] Keyboard shortcut R refreshes dashboard (<500ms load time)
- [ ] Keyboard shortcut 1/2/3/4 switches tabs correctly
- [ ] Keyboard shortcut A acknowledges highlighted alert
- [ ] Telemetry fires on rebalance_applied, alert_acknowledged, dashboard_refreshed
- [ ] Arabic locale flips heatmap direction and translates all labels

---

## 14. Admin Configuration

### 14.1 Users & Roles

**User List View**:
```
┌─ Users & Roles ───────────────────────────────────────────────────┐
│ [+ Add User]  [Import CSV]          Search: [Filter by role...]   │
│────────────────────────────────────────────────────────────────────│
│ Name            | Email              | Role    | Departments | ... │
│────────────────────────────────────────────────────────────────────│
│ Sarah Johnson   | sarah@uni.edu      | Agent   | Finance     | ⋮  │
│ David Lee       | david@uni.edu      | Agent   | Admissions  | ⋮  │
│ Emily Chen      | emily@uni.edu      | Agent   | IT          | ⋮  │
│ Michael Brown   | michael@uni.edu    | Manager | Finance     | ⋮  │
│ Admin User      | admin@uni.edu      | Admin   | All         | ⋮  │
└───────────────────────────────────────────────────────────────────┘
```

**Create/Edit User Modal**:
```tsx
<Dialog>
  <DialogHeader>
    <DialogTitle>Add User</DialogTitle>
  </DialogHeader>
  <DialogContent className="max-w-2xl">
    <Form {...form}>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} type="email" />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Student">Student</SelectItem>
                  <SelectItem value="Agent">Agent</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="KM">Knowledge Manager</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <FormField
          name="departments"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Departments (multi-select)</FormLabel>
              <MultiSelect
                options={departmentOptions}
                selected={field.value}
                onChange={field.onChange}
              />
            </FormItem>
          )}
        />

        <FormField
          name="skills"
          render={({ field }) => (
            <FormItem className="col-span-2">
              <FormLabel>Skills (for Agents)</FormLabel>
              <MultiSelect
                options={skillOptions}
                selected={field.value}
                onChange={field.onChange}
                disabled={role !== "Agent"}
              />
            </FormItem>
          )}
        />
      </div>
    </Form>
  </DialogContent>
  <DialogFooter>
    <Button variant="outline" onClick={closeDialog}>Cancel</Button>
    <Button onClick={handleSubmit}>Create User</Button>
  </DialogFooter>
</Dialog>
```

**Role Matrix Reference** (see §23 in Part 6):
```typescript
// Preview reference (full matrix in Part 6)
const rolePermissions = {
  Student: ["view_own_cases", "create_request"],
  Agent: ["view_assigned_cases", "reply_to_cases", "apply_macros"],
  Manager: ["view_dept_cases", "reassign_cases", "approve_requests", "view_reports"],
  Admin: ["*"], // all permissions
  KM: ["manage_articles", "publish_content", "view_citations"]
};
```

---

### 14.2 Departments & Queues

**Department/Queue CRUD**:
```
┌─ Departments & Queues ────────────────────────────────────────────┐
│ [+ Add Department]  [+ Add Queue]                                 │
│────────────────────────────────────────────────────────────────────│
│ ▾ Finance                                                          │
│   ├─ Primary Queue        WIP Limit: 80  SLA: 2h/24h             │
│   ├─ Approval Queue       WIP Limit: 10  SLA: 4h/48h             │
│   └─ [+ Add Queue]                                                │
│                                                                    │
│ ▾ Admissions                                                       │
│   ├─ Primary Queue        WIP Limit: 40  SLA: 1h/24h             │
│   └─ Priority Queue       WIP Limit: 15  SLA: 30m/12h            │
└───────────────────────────────────────────────────────────────────┘
```

**Edit Queue Modal**:
```tsx
<Dialog>
  <DialogHeader>
    <DialogTitle>Edit Queue: Finance Primary</DialogTitle>
  </DialogHeader>
  <DialogContent>
    <Form>
      <FormField
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Queue Name</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        name="wipLimit"
        render={({ field }) => (
          <FormItem>
            <FormLabel>WIP Limit</FormLabel>
            <FormControl>
              <Input {...field} type="number" min={1} max={200} />
            </FormControl>
            <FormDescription>
              Alert when queue exceeds this limit
            </FormDescription>
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          name="slaFirstResponse"
          render={({ field }) => (
            <FormItem>
              <FormLabel>SLA First Response (hours)</FormLabel>
              <FormControl>
                <Input {...field} type="number" step={0.5} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          name="slaResolution"
          render={({ field }) => (
            <FormItem>
              <FormLabel>SLA Resolution (hours)</FormLabel>
              <FormControl>
                <Input {...field} type="number" />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <FormField
        name="skills"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Required Skills</FormLabel>
            <MultiSelect
              options={skillOptions}
              selected={field.value}
              onChange={field.onChange}
            />
            <FormDescription>
              Only agents with these skills can be assigned
            </FormDescription>
          </FormItem>
        )}
      />

      <Alert variant="info" className="mt-4">
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          Preview: Cases in this queue will require response within 2 hours and resolution within 24 hours.
        </AlertDescription>
      </Alert>
    </Form>
  </DialogContent>
  <DialogFooter>
    <Button variant="outline">Cancel</Button>
    <Button>Save Queue</Button>
  </DialogFooter>
</Dialog>
```

**Validation**:
```typescript
const QueueSchema = z.object({
  name: z.string().min(3).max(50),
  wipLimit: z.number().int().min(1).max(200),
  slaFirstResponse: z.number().positive().max(48), // max 48h
  slaResolution: z.number().positive().max(168), // max 7 days
  skills: z.array(z.string()).min(1, "At least one skill required")
}).refine(
  (data) => data.slaResolution > data.slaFirstResponse,
  {
    message: "Resolution SLA must be greater than First Response SLA",
    path: ["slaResolution"]
  }
);
```

---

### 14.3 Form Builder (Stub)

**Form Builder UI**:
```
┌─ Form Builder: Payment Plan Request ─────────────────────────────┐
│ [Save Draft] [Publish v2]                         Version: 1      │
│────────────────────────────────────────────────────────────────────│
│ Canvas                              │ Field Palette               │
│                                     │ ┌───────────────────────┐   │
│ ┌─ Full Name ─────────────────┐    │ │ [Text]                │   │
│ │ Type: text                   │    │ │ [Email]               │   │
│ │ Required: ✓                  │    │ │ [Number]              │   │
│ │ [Edit] [Delete]              │    │ │ [Textarea]            │   │
│ └──────────────────────────────┘    │ │ [Select]              │   │
│                                     │ │ [Checkbox]            │   │
│ ┌─ Email ─────────────────────┐    │ │ [File Upload]         │   │
│ │ Type: email                  │    │ │ [Date]                │   │
│ │ Required: ✓                  │    │ └───────────────────────┘   │
│ │ [Edit] [Delete]              │    │                             │
│ └──────────────────────────────┘    │ Settings                    │
│                                     │ Department: Finance         │
│ [+ Add Field]                       │ Locale: English            │
│                                     │                             │
│ JSON Preview ───────────────────────┴─────────────────────────────│
│ {                                                                 │
│   "fields": [                                                     │
│     { "name": "name", "type": "text", "required": true, ... }    │
│   ]                                                               │
│ }                                                                 │
└───────────────────────────────────────────────────────────────────┘
```

**Field Editor**:
```tsx
<Dialog>
  <DialogHeader>
    <DialogTitle>Edit Field: Student ID</DialogTitle>
  </DialogHeader>
  <DialogContent>
    <Form>
      <FormField name="label" render={({ field }) => (
        <FormItem>
          <FormLabel>Field Label</FormLabel>
          <FormControl>
            <Input {...field} placeholder="Student ID" />
          </FormControl>
        </FormItem>
      )} />

      <FormField name="type" render={({ field }) => (
        <FormItem>
          <FormLabel>Field Type</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="select">Dropdown</SelectItem>
            </SelectContent>
          </Select>
        </FormItem>
      )} />

      <FormField name="required" render={({ field }) => (
        <FormItem className="flex items-center gap-2">
          <FormControl>
            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
          <FormLabel>Required Field</FormLabel>
        </FormItem>
      )} />

      <FormField name="validation" render={({ field }) => (
        <FormItem>
          <FormLabel>Validation Pattern (regex)</FormLabel>
          <FormControl>
            <Input {...field} placeholder="^S\d{7}$" />
          </FormControl>
          <FormDescription>
            Example: ^S\d{"{7}"}$ matches S1234567
          </FormDescription>
        </FormItem>
      )} />
    </Form>
  </DialogContent>
  <DialogFooter>
    <Button variant="outline">Cancel</Button>
    <Button>Save Field</Button>
  </DialogFooter>
</Dialog>
```

**Version Bump**:
```typescript
// Publishing increments version
interface FormVersion {
  id: string;
  formId: string;
  version: number;
  schema: FormSchema;
  publishedAt: string;
  publishedBy: string;
  changelog?: string;
}

// When user clicks "Publish v2"
function publishForm(formId: string, changelog: string) {
  const currentVersion = getCurrentVersion(formId);
  const newVersion: FormVersion = {
    id: `form-v-${Date.now()}`,
    formId,
    version: currentVersion.version + 1,
    schema: currentFormSchema,
    publishedAt: new Date().toISOString(),
    publishedBy: currentUser.id,
    changelog
  };

  // New submissions use new version; old submissions reference old version
}
```

---

### 14.4 Workflow Editor (Graph)

**Workflow Graph UI**:
```
┌─ Workflow Editor: Auto-Route Finance Cases ──────────────────────┐
│ [Save] [Publish] [Test Dry-Run]                    Status: Draft │
│────────────────────────────────────────────────────────────────────│
│ Canvas                                                             │
│                                                                    │
│    ┌──────────────┐                                               │
│    │   Trigger    │                                               │
│    │ Case Created │                                               │
│    │ dept=Finance │                                               │
│    └──────┬───────┘                                               │
│           │                                                        │
│           ▼                                                        │
│    ┌──────────────┐                                               │
│    │  Condition   │                                               │
│    │ balance>1000?│                                               │
│    └───┬──────┬───┘                                               │
│        │ Yes  │ No                                                │
│        ▼      ▼                                                    │
│  ┌─────────┐ ┌─────────┐                                         │
│  │  Route  │ │  Route  │                                         │
│  │ Approval│ │ Primary │                                         │
│  └─────────┘ └─────────┘                                         │
│                                                                    │
│ Dry-Run Trace ─────────────────────────────────────────────────────│
│ Input: CASE-20250042 (balance: $2,400)                           │
│ ✓ Trigger matched (dept=Finance)                                 │
│ ✓ Condition: balance>1000 → TRUE                                 │
│ ✓ Action: Route to Approval Queue                                │
│ Result: Case would be assigned to finance:approval               │
└───────────────────────────────────────────────────────────────────┘
```

**Node Types**:
```typescript
type WorkflowNode = TriggerNode | ConditionNode | ActionNode;

interface TriggerNode {
  type: "trigger";
  event: "case:created" | "case:updated" | "case:message_added";
  filters: Record<string, any>; // { department: "Finance" }
}

interface ConditionNode {
  type: "condition";
  logic: "AND" | "OR";
  rules: {
    field: string; // e.g., "case.balance"
    operator: "==" | "!=" | ">" | "<" | "contains";
    value: any;
  }[];
}

interface ActionNode {
  type: "action";
  action: "route_to_queue" | "assign_agent" | "set_priority" | "notify_manager";
  params: Record<string, any>;
}
```

**Dry-Run API**:
```typescript
// POST /api/admin/workflows/dryrun
// Request
{
  workflowId: "wf-001",
  testCase: {
    id: "CASE-20250042",
    department: "Finance",
    balance: 2400,
    priority: "Normal"
  }
}

// Response
{
  data: {
    matched: true,
    trace: [
      { step: 1, type: "trigger", result: "matched", reason: "dept=Finance" },
      { step: 2, type: "condition", result: "true", reason: "balance (2400) > 1000" },
      { step: 3, type: "action", result: "route_to_queue", params: { queueId: "finance:approval" } }
    ],
    finalAction: {
      type: "route_to_queue",
      queueId: "finance:approval"
    }
  }
}
```

**Import/Export**:
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">
      <MoreVertical className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={handleExportJSON}>
      <Download className="h-4 w-4 mr-2" />
      Export JSON
    </DropdownMenuItem>
    <DropdownMenuItem onClick={handleImportJSON}>
      <Upload className="h-4 w-4 mr-2" />
      Import JSON
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

### 14.5 Integrations

**Connector Cards**:
```
┌─ Integrations ────────────────────────────────────────────────────┐
│                                                                    │
│ ┌────────────────────┐  ┌────────────────────┐  ┌──────────────┐ │
│ │ 🎓 SIS Integration │  │ 📧 Email (SMTP)    │  │ ☁️ S3 Storage│ │
│ │ Status: Connected  │  │ Status: Connected  │  │ Status: Off  │ │
│ │ Last Sync: 2m ago  │  │ Sent: 1,247        │  │              │ │
│ │ [Configure] [Test] │  │ [Configure] [Test] │  │ [Connect]    │ │
│ └────────────────────┘  └────────────────────┘  └──────────────┘ │
│                                                                    │
│ ┌────────────────────┐  ┌────────────────────┐                   │
│ │ 📞 Telephony (stub)│  │ 🔒 SSO (SAML)      │                   │
│ │ Status: Off        │  │ Status: Off        │                   │
│ │ [Configure]        │  │ [Configure]        │                   │
│ └────────────────────┘  └────────────────────┘                   │
└───────────────────────────────────────────────────────────────────┘
```

**OAuth Mock Flow** (SIS example):
```tsx
<Dialog>
  <DialogHeader>
    <DialogTitle>Connect SIS Integration</DialogTitle>
  </DialogHeader>
  <DialogContent>
    <div className="space-y-4">
      <Alert variant="info">
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          This is a mocked OAuth flow for demo purposes. Click "Authorize" to simulate connection.
        </AlertDescription>
      </Alert>

      <div className="p-4 border rounded">
        <h3 className="font-medium">Permissions Requested:</h3>
        <ul className="text-sm mt-2 space-y-1">
          <li>✓ Read student profiles</li>
          <li>✓ Read enrollment data</li>
          <li>✓ Read financial holds</li>
        </ul>
      </div>
    </div>
  </DialogContent>
  <DialogFooter>
    <Button variant="outline" onClick={closeDialog}>Cancel</Button>
    <Button onClick={handleMockAuthorize}>Authorize</Button>
  </DialogFooter>
</Dialog>

// After "Authorize"
function handleMockAuthorize() {
  // Simulate OAuth callback
  setTimeout(() => {
    updateIntegrationStatus("sis", "connected");
    toast.success("SIS Integration connected successfully!");
  }, 1500);
}
```

**Status Badges**:
```tsx
function IntegrationStatusBadge({ status }: { status: "connected" | "off" | "error" }) {
  const variants = {
    connected: { variant: "success", label: "Connected" },
    off: { variant: "secondary", label: "Disconnected" },
    error: { variant: "destructive", label: "Error" }
  };

  const { variant, label } = variants[status];

  return <Badge variant={variant}>{label}</Badge>;
}
```

---

### 14.6 Branding

**Branding Configuration**:
```
┌─ Branding ────────────────────────────────────────────────────────┐
│ Logo                                                               │
│ ┌──────────────────────┐                                          │
│ │ [Upload Image]       │  Current: university-logo.png           │
│ │ Max 2MB, PNG/SVG     │  [Remove]                               │
│ └──────────────────────┘                                          │
│                                                                    │
│ Theme                                                              │
│ ○ Light  ● Dark  ○ Auto                                           │
│                                                                    │
│ Primary Color                                                      │
│ [#3B82F6] ████████                                                │
│                                                                    │
│ Domain (Custom URL)                                                │
│ https://support.university.edu                                    │
│ Status: ✓ DNS Verified                                            │
│                                                                    │
│ Live Preview ──────────────────────────────────────────────────────│
│ ┌────────────────────────────────────────────────────────────┐   │
│ │ [LOGO] University Support Center                           │   │
│ │ ────────────────────────────────────────────────────────── │   │
│ │ Welcome to our help center...                              │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│ [Save Changes]                                                     │
└───────────────────────────────────────────────────────────────────┘
```

**Logo Upload**:
```tsx
<div className="space-y-2">
  <Label>Logo</Label>
  <div className="flex items-center gap-4">
    <div className="h-20 w-20 border rounded flex items-center justify-center">
      {logoUrl ? (
        <img src={logoUrl} alt="Logo" className="max-h-full max-w-full" />
      ) : (
        <ImageIcon className="h-8 w-8 text-muted-foreground" />
      )}
    </div>

    <div>
      <Input
        type="file"
        accept="image/png,image/svg+xml"
        onChange={handleLogoUpload}
        className="hidden"
        id="logo-upload"
      />
      <Label htmlFor="logo-upload" className="cursor-pointer">
        <Button variant="outline" asChild>
          <span>Upload Image</span>
        </Button>
      </Label>
      <p className="text-xs text-muted-foreground mt-1">
        Max 2MB, PNG or SVG
      </p>
    </div>
  </div>
</div>
```

**Color Picker**:
```tsx
<div className="space-y-2">
  <Label>Primary Color</Label>
  <div className="flex items-center gap-2">
    <Input
      type="color"
      value={primaryColor}
      onChange={(e) => setPrimaryColor(e.target.value)}
      className="w-20 h-10"
    />
    <Input
      type="text"
      value={primaryColor}
      onChange={(e) => setPrimaryColor(e.target.value)}
      placeholder="#3B82F6"
      className="w-32"
    />
    <div
      className="h-10 w-20 rounded border"
      style={{ backgroundColor: primaryColor }}
    />
  </div>
</div>
```

---

### 14.7 Routes & APIs

**GET /api/admin/users**:
```json
{
  "data": [
    {
      "id": "agent-001",
      "name": "Sarah Johnson",
      "email": "sarah@university.edu",
      "role": "Agent",
      "departments": ["Finance"],
      "skills": ["finance:payment_plans", "finance:refunds"],
      "active": true,
      "createdAt": "2024-09-01T00:00:00Z"
    }
  ],
  "meta": { "total": 25, "page": 1, "pages": 1 }
}
```

**POST /api/admin/users**:
```json
{
  "name": "New Agent",
  "email": "newagent@university.edu",
  "role": "Agent",
  "departments": ["Finance", "Registrar"],
  "skills": ["finance:billing", "registrar:transcripts"]
}
```

**GET /api/admin/forms**:
```json
{
  "data": [
    {
      "id": "form-001",
      "name": "Payment Plan Request",
      "department": "Finance",
      "version": 2,
      "fieldCount": 6,
      "publishedAt": "2025-01-15T00:00:00Z",
      "status": "published"
    }
  ]
}
```

**GET /api/admin/workflows**:
```json
{
  "data": [
    {
      "id": "wf-001",
      "name": "Auto-Route Finance Cases",
      "enabled": true,
      "triggerEvent": "case:created",
      "version": 1,
      "lastRunAt": "2025-01-30T14:30:00Z",
      "executionCount": 127
    }
  ]
}
```

---

### 14.8 MSW Seed

**Forms**:
```typescript
const seedForms = [
  {
    id: "form-001",
    name: "Payment Plan Request",
    department: "Finance",
    version: 2,
    fields: [
      { name: "name", type: "text", required: true, label: "Full Name" },
      { name: "email", type: "email", required: true, label: "Email" },
      { name: "studentId", type: "text", required: true, label: "Student ID", validation: "^S\\d{7}$" },
      { name: "balance", type: "number", required: true, label: "Current Balance" },
      { name: "months", type: "select", required: true, label: "Payment Plan Duration", options: ["3", "6", "12"] },
      { name: "reason", type: "textarea", required: true, label: "Reason for Request", maxLength: 500 }
    ],
    publishedAt: "2025-01-15T00:00:00Z",
    status: "published"
  },
  {
    id: "form-002",
    name: "Transcript Request",
    department: "Registrar",
    version: 1,
    fields: [
      { name: "name", type: "text", required: true, label: "Full Name" },
      { name: "email", type: "email", required: true, label: "Email" },
      { name: "studentId", type: "text", required: true, label: "Student ID" },
      { name: "copies", type: "number", required: true, label: "Number of Copies" },
      { name: "recipient", type: "textarea", required: true, label: "Recipient Address" }
    ],
    publishedAt: "2024-11-01T00:00:00Z",
    status: "published"
  }
];
```

**Workflows**:
```typescript
const seedWorkflows = [
  {
    id: "wf-001",
    name: "Auto-Route Finance Cases",
    enabled: true,
    version: 1,
    trigger: {
      type: "trigger",
      event: "case:created",
      filters: { department: "Finance" }
    },
    nodes: [
      {
        type: "condition",
        logic: "AND",
        rules: [
          { field: "case.balance", operator: ">", value: 1000 }
        ]
      },
      {
        type: "action",
        action: "route_to_queue",
        params: { queueId: "finance:approval" }
      }
    ],
    executionCount: 127,
    lastRunAt: "2025-01-30T14:30:00Z"
  }
];

// Dry-run trace example
const dryRunTrace = {
  input: {
    id: "CASE-20250042",
    department: "Finance",
    balance: 2400,
    priority: "Normal"
  },
  trace: [
    { step: 1, type: "trigger", result: "matched", reason: "department=Finance" },
    { step: 2, type: "condition", result: "true", reason: "balance (2400) > 1000" },
    { step: 3, type: "action", result: "route_to_queue", params: { queueId: "finance:approval" } }
  ],
  finalAction: {
    type: "route_to_queue",
    queueId: "finance:approval"
  }
};
```

---

### 14.9 Telemetry

```typescript
{
  event: "reops.admin.user_created",
  props: {
    user_id: string,
    role: string,
    departments: string[]
  }
}

{
  event: "reops.admin.workflow_published",
  props: {
    workflow_id: string,
    version: number,
    trigger_event: string,
    node_count: number
  }
}

{
  event: "reops.admin.workflow_dryrun",
  props: {
    workflow_id: string,
    matched: boolean,
    action_count: number
  }
}

{
  event: "reops.admin.form_versioned",
  props: {
    form_id: string,
    old_version: number,
    new_version: number,
    field_count: number
  }
}

{
  event: "reops.admin.integration_connected",
  props: {
    integration_type: string, // "sis" | "email" | "s3"
    oauth_mocked: boolean
  }
}

{
  event: "reops.admin.branding_updated",
  props: {
    logo_changed: boolean,
    theme_changed: boolean,
    domain_changed: boolean
  }
}
```

---

### 14.10 i18n Keys

**English**:
```json
{
  "admin.users.title": "Users & Roles",
  "admin.users.addUser": "Add User",
  "admin.users.importCSV": "Import CSV",
  "admin.users.name": "Name",
  "admin.users.email": "Email",
  "admin.users.role": "Role",
  "admin.users.departments": "Departments",
  "admin.departments.title": "Departments & Queues",
  "admin.departments.addDept": "Add Department",
  "admin.departments.addQueue": "Add Queue",
  "admin.departments.wipLimit": "WIP Limit",
  "admin.departments.sla": "SLA",
  "admin.forms.title": "Form Builder",
  "admin.forms.saveDraft": "Save Draft",
  "admin.forms.publish": "Publish",
  "admin.forms.version": "Version",
  "admin.forms.addField": "Add Field",
  "admin.workflows.title": "Workflow Editor",
  "admin.workflows.testDryRun": "Test Dry-Run",
  "admin.workflows.exportJSON": "Export JSON",
  "admin.workflows.importJSON": "Import JSON",
  "admin.integrations.title": "Integrations",
  "admin.integrations.connected": "Connected",
  "admin.integrations.disconnected": "Disconnected",
  "admin.integrations.configure": "Configure",
  "admin.integrations.test": "Test",
  "admin.branding.title": "Branding",
  "admin.branding.logo": "Logo",
  "admin.branding.theme": "Theme",
  "admin.branding.primaryColor": "Primary Color",
  "admin.branding.domain": "Domain",
  "admin.branding.saveChanges": "Save Changes"
}
```

**Arabic**:
```json
{
  "admin.users.title": "المستخدمون والأدوار",
  "admin.users.addUser": "إضافة مستخدم",
  "admin.users.name": "الاسم",
  "admin.users.email": "البريد الإلكتروني",
  "admin.users.role": "الدور",
  "admin.departments.title": "الأقسام وقوائم الانتظار",
  "admin.forms.title": "منشئ النماذج",
  "admin.forms.publish": "نشر",
  "admin.workflows.title": "محرر سير العمل",
  "admin.integrations.title": "التكاملات",
  "admin.branding.title": "العلامة التجارية"
}
```

---

### 14.11 Acceptance Criteria

- [ ] User list loads with all users and correct role badges
- [ ] Clicking "Add User" opens modal with empty form
- [ ] User form validates email format and required fields
- [ ] Department multi-select disabled for Student/Admin roles
- [ ] Skills multi-select disabled for non-Agent roles
- [ ] Submitting user form creates user and shows success toast
- [ ] User list updates with new user (optimistic update)
- [ ] Department tree shows expandable/collapsible structure
- [ ] Clicking queue shows edit modal with current settings
- [ ] Queue form validates SLA resolution > first response
- [ ] WIP limit accepts only integers 1-200
- [ ] Saving queue updates tree and shows preview alert
- [ ] Form builder canvas supports drag-drop field ordering
- [ ] Adding field shows field editor modal with type selector
- [ ] Field validation pattern accepts valid regex
- [ ] JSON preview updates in real-time as fields change
- [ ] Publishing form increments version number
- [ ] Workflow editor shows graph with nodes connected by edges
- [ ] Dry-run test shows step-by-step trace with results
- [ ] Dry-run highlight nodes in green (matched) or red (failed)
- [ ] Exporting workflow downloads JSON file
- [ ] Importing workflow validates JSON schema before loading
- [ ] Integration cards show correct status badges
- [ ] Clicking "Connect" on integration shows OAuth mock modal
- [ ] Mock OAuth "Authorize" updates status to "Connected" after 1.5s
- [ ] Logo upload validates file size (<2MB) and type (PNG/SVG)
- [ ] Color picker updates live preview in real-time
- [ ] Theme toggle switches between light/dark/auto
- [ ] Domain field shows DNS verification status badge
- [ ] Telemetry fires on user_created, workflow_published, form_versioned

---

## 15. Knowledge Management

### 15.1 Article List

**Tabs & Filters**:
```
┌─ Knowledge Management ────────────────────────────────────────────┐
│ [Draft] [Review] [Published] [Archived]                          │
│ Filters: Dept [All ▾]  Locale [All ▾]  Staleness [All ▾]         │
│ [+ New Article]  [Bulk Actions ▾]                  🔍 Search...   │
│────────────────────────────────────────────────────────────────────│
│ ☐ Title                      | Dept    | Locale | Status | Updated│
│────────────────────────────────────────────────────────────────────│
│ ☐ Payment Plan Eligibility   | Finance | EN     | Pub    | 5d ago │
│ ☐ Refund Policy              | Finance | EN     | Pub    | 12d    │
│ ☐ أهلية خطة الدفع          | Finance | AR     | Pub    | 5d ago │
│ ☐ Transcript Request Process | Registr | EN     | Review | 2d ago │
│ ☐ Password Reset Guide       | IT      | EN     | Draft  | 1h ago │
│ ⚠️ Admissions Deadlines 2024 | Admis   | EN     | Stale  | 120d   │
└───────────────────────────────────────────────────────────────────┘
[Bulk: Send to Review] [Bulk: Archive]
```

**Staleness Detection**:
```typescript
interface ArticleFreshness {
  articleId: string;
  lastUpdated: Date;
  freshnessDeadline: Date; // 90 days from publish
  daysUntilStale: number;
  isStale: boolean;
  citationCount: number; // higher citations = higher priority
}

function calculateStaleness(article: Article): ArticleFreshness {
  const daysSinceUpdate = differenceInDays(new Date(), new Date(article.updatedAt));
  const freshnessDeadline = addDays(new Date(article.publishedAt), 90);
  const daysUntilStale = differenceInDays(freshnessDeadline, new Date());

  return {
    articleId: article.id,
    lastUpdated: new Date(article.updatedAt),
    freshnessDeadline,
    daysUntilStale,
    isStale: daysSinceUpdate > 90,
    citationCount: article.citationCount || 0
  };
}
```

**Bulk Actions**:
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" disabled={selectedCount === 0}>
      Bulk Actions ({selectedCount})
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={handleBulkSendToReview}>
      Send to Review
    </DropdownMenuItem>
    <DropdownMenuItem onClick={handleBulkArchive}>
      Archive
    </DropdownMenuItem>
    <DropdownMenuItem onClick={handleBulkTranslate}>
      Request Translation
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

### 15.2 Editor

**Block-Based Editor**:
```
┌─ Edit Article: Payment Plan Eligibility ─────────────────────────┐
│ [Save Draft] [Send to Review] [Publish]      Autosaved 30s ago   │
│────────────────────────────────────────────────────────────────────│
│ Title                                                              │
│ Payment Plan Eligibility                                          │
│                                                                    │
│ Slug (auto-generated)                                             │
│ payment-plan-eligibility                                          │
│                                                                    │
│ Department: Finance    Locale: English                            │
│                                                                    │
│ Content ───────────────────────────────────────────────────────────│
│ [+ Add Block ▾]                                                   │
│                                                                    │
│ ┌─ Heading 1 ──────────────────────────────────────────────┐     │
│ │ Eligibility Requirements                       [⋮]       │     │
│ └──────────────────────────────────────────────────────────┘     │
│                                                                    │
│ ┌─ Paragraph ──────────────────────────────────────────────┐     │
│ │ To qualify for a payment plan, you must have a    [⋮]    │     │
│ │ balance of at least $1,000...                            │     │
│ └──────────────────────────────────────────────────────────┘     │
│                                                                    │
│ ┌─ Callout (Info) ─────────────────────────────────────────┐     │
│ │ 💡 Students with financial holds are not eligible  [⋮]   │     │
│ └──────────────────────────────────────────────────────────┘     │
│                                                                    │
│ ┌─ List (Bulleted) ────────────────────────────────────────┐     │
│ │ • 3-month plan                                     [⋮]    │     │
│ │ • 6-month plan                                            │     │
│ │ • 12-month plan                                           │     │
│ └──────────────────────────────────────────────────────────┘     │
└───────────────────────────────────────────────────────────────────┘
```

**Block Types**:
```typescript
type ContentBlock =
  | { type: "heading"; level: 1 | 2 | 3; content: string }
  | { type: "paragraph"; content: string }
  | { type: "list"; style: "bullet" | "number"; items: string[] }
  | { type: "callout"; variant: "info" | "warning" | "success"; content: string }
  | { type: "code"; language: string; content: string }
  | { type: "table"; headers: string[]; rows: string[][] };

interface ArticleContent {
  blocks: ContentBlock[];
}
```

**Autosave**:
```typescript
// Debounced autosave every 30s
const AUTOSAVE_INTERVAL = 30000;

useEffect(() => {
  const timer = setTimeout(() => {
    if (hasUnsavedChanges) {
      saveDraft();
      setLastAutosave(new Date());
    }
  }, AUTOSAVE_INTERVAL);

  return () => clearTimeout(timer);
}, [content, hasUnsavedChanges]);
```

**Versioning**:
```typescript
interface ArticleVersion {
  id: string;
  articleId: string;
  version: number;
  content: ArticleContent;
  createdAt: string;
  createdBy: string;
  changelog?: string;
}

// When publishing, create new version
function publishArticle(articleId: string, changelog: string) {
  const currentVersion = getLatestVersion(articleId);
  const newVersion: ArticleVersion = {
    id: `av-${Date.now()}`,
    articleId,
    version: currentVersion ? currentVersion.version + 1 : 1,
    content: currentContent,
    createdAt: new Date().toISOString(),
    createdBy: currentUser.id,
    changelog
  };

  // Old citations reference old version; new citations use new version
}
```

**Diff Viewer**:
```tsx
<Dialog>
  <DialogHeader>
    <DialogTitle>Compare Versions</DialogTitle>
  </DialogHeader>
  <DialogContent className="max-w-4xl">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h3 className="font-medium mb-2">Version 1 (Current)</h3>
        <div className="prose prose-sm">
          {renderBlocks(version1.content.blocks)}
        </div>
      </div>

      <div>
        <h3 className="font-medium mb-2">Version 2 (Draft)</h3>
        <div className="prose prose-sm">
          {renderBlocks(version2.content.blocks, {
            highlightChanges: true,
            additions: "bg-green-100",
            deletions: "bg-red-100 line-through"
          })}
        </div>
      </div>
    </div>
  </DialogContent>
</Dialog>
```

---

### 15.3 Review Workflow

**Review Assignment**:
```tsx
<Dialog>
  <DialogHeader>
    <DialogTitle>Send to Review</DialogTitle>
  </DialogHeader>
  <DialogContent>
    <Form>
      <FormField name="reviewer" render={({ field }) => (
        <FormItem>
          <FormLabel>Assign Reviewer</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {reviewers.map((reviewer) => (
                <SelectItem key={reviewer.id} value={reviewer.id}>
                  {reviewer.name} ({reviewer.pendingReviews} pending)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItem>
      )} />

      <FormField name="notes" render={({ field }) => (
        <FormItem>
          <FormLabel>Notes for Reviewer (optional)</FormLabel>
          <Textarea {...field} placeholder="Updated policy effective Feb 1st" />
        </FormItem>
      )} />

      <Alert variant="info">
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          Freshness SLA: 90 days. This article will be marked stale on May 1, 2025.
        </AlertDescription>
      </Alert>
    </Form>
  </DialogContent>
  <DialogFooter>
    <Button variant="outline">Cancel</Button>
    <Button>Send to Review</Button>
  </DialogFooter>
</Dialog>
```

**Approve/Reject**:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Review: Payment Plan Eligibility</CardTitle>
    <CardDescription>
      Submitted by: Sarah Johnson | 2 days ago
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="prose prose-sm max-w-none">
      {renderArticle(article)}
    </div>

    <Separator className="my-4" />

    <Textarea
      placeholder="Feedback or change requests..."
      value={reviewComment}
      onChange={(e) => setReviewComment(e.target.value)}
      rows={4}
    />
  </CardContent>
  <CardFooter className="gap-2">
    <Button variant="destructive" onClick={() => handleReject(article.id, reviewComment)}>
      Request Changes
    </Button>
    <Button variant="default" onClick={() => handleApprove(article.id, reviewComment)}>
      Approve & Publish
    </Button>
  </CardFooter>
</Card>
```

**Freshness SLA Deadline**:
```tsx
{article.freshnessDeadline && isWithin14Days(article.freshnessDeadline) && (
  <Alert variant="warning" className="mb-4">
    <AlertTriangle className="h-4 w-4" />
    <AlertTitle>Freshness Deadline Approaching</AlertTitle>
    <AlertDescription>
      This article will be marked stale in {formatDistanceToNow(article.freshnessDeadline)}.
      Please review and update if needed.
    </AlertDescription>
  </Alert>
)}
```

**Needs Update Tag**:
```typescript
// Auto-tag stale articles
function checkArticleFreshness(articles: Article[]) {
  articles.forEach((article) => {
    const daysSinceUpdate = differenceInDays(new Date(), new Date(article.updatedAt));

    if (daysSinceUpdate > 90 && !article.tags.includes("needs_update")) {
      // Add tag and notify KM
      addTag(article.id, "needs_update");
      notifyKM(article.id, "Article marked stale - needs review");

      // Telemetry
      trackEvent("reops.km.freshness_breached", {
        article_id: article.id,
        days_since_update: daysSinceUpdate,
        citation_count: article.citationCount
      });
    }
  });
}
```

---

### 15.4 Citation Telemetry

**Citation Tracking**:
```typescript
interface ArticleCitation {
  articleId: string;
  citedIn: {
    caseId: string;
    messageId: string;
    agentId: string;
    citedAt: string;
  }[];
  views: number; // from KB search/detail page
  helpfulVotes: number;
  unhelpfulVotes: number;
  citationRate: number; // citations per 100 views
}

// Display in article list
function ArticleRow({ article }: { article: Article }) {
  const citationRate = (article.citationCount / article.views) * 100;

  return (
    <TableRow>
      <TableCell>{article.title}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Tooltip content={`${article.citationCount} citations / ${article.views} views`}>
            <Badge variant="secondary">
              {citationRate.toFixed(1)}% citation rate
            </Badge>
          </Tooltip>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm text-muted-foreground">
          {article.helpfulVotes} helpful / {article.unhelpfulVotes} not helpful
        </div>
      </TableCell>
    </TableRow>
  );
}
```

**Citation Report** (surfaced to KM):
```
┌─ Article Performance ─────────────────────────────────────────────┐
│ Title: Payment Plan Eligibility                                   │
│ Published: 15 days ago | Last Updated: 5 days ago                 │
│────────────────────────────────────────────────────────────────────│
│ Views: 1,542                                                       │
│ Citations (AI drafts): 89 (5.8% rate) 📈                          │
│ Helpful Votes: 127 (82%)                                          │
│ Not Helpful: 28 (18%)                                             │
│                                                                    │
│ Top Citing Agents:                                                │
│ • Sarah Johnson (Finance): 23 citations                           │
│ • David Lee (Finance): 18 citations                               │
│                                                                    │
│ Related Articles (frequently co-cited):                           │
│ • Refund Policy (12 co-citations)                                │
│ • Late Payment Fees (8 co-citations)                             │
└───────────────────────────────────────────────────────────────────┘
```

---

### 15.5 Policy Snippets

**Policy Snippet Interface**:
```typescript
interface PolicySnippet {
  id: string;
  name: string;
  version: string; // "2.1"
  department: string;
  body: string; // plain text or markdown
  articleId: string; // source KB article
  articleUrl: string;
  createdAt: string;
  updatedAt: string;
  immutable: true; // once inserted, cannot be edited inline
}
```

**Creating Policy Snippet** (from KB editor):
```tsx
<Button onClick={handleCreatePolicySnippet}>
  <Shield className="h-4 w-4 mr-2" />
  Create Policy Snippet
</Button>

// Modal
<Dialog>
  <DialogHeader>
    <DialogTitle>Create Policy Snippet</DialogTitle>
  </DialogHeader>
  <DialogContent>
    <Form>
      <FormField name="name" render={({ field }) => (
        <FormItem>
          <FormLabel>Snippet Name</FormLabel>
          <Input {...field} placeholder="Payment Plan Eligibility" />
        </FormItem>
      )} />

      <FormField name="version" render={({ field }) => (
        <FormItem>
          <FormLabel>Version</FormLabel>
          <Input {...field} placeholder="2.1" />
        </FormItem>
      )} />

      <FormField name="body" render={({ field }) => (
        <FormItem>
          <FormLabel>Policy Text</FormLabel>
          <Textarea
            {...field}
            placeholder="Students with balances over $1,000 and no account holds may request payment plans for 3, 6, or 12 months."
            rows={6}
          />
        </FormItem>
      )} />

      <Alert variant="info">
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          Policy snippets are immutable once inserted into messages. Agents cannot edit them inline.
        </AlertDescription>
      </Alert>
    </Form>
  </DialogContent>
  <DialogFooter>
    <Button variant="outline">Cancel</Button>
    <Button>Create Snippet</Button>
  </DialogFooter>
</Dialog>
```

**Usage in Composer** (see §11.3):
- Appears in "Insert Variable" dropdown under "Department Policies"
- Inserts as immutable `<Callout>` block with version number
- Links back to source KB article

---

### 15.6 APIs

**GET /api/km/articles**:
```json
{
  "data": [
    {
      "id": "kb-002",
      "title": "Payment Plan Eligibility",
      "slug": "payment-plan-eligibility",
      "department": "Finance",
      "locale": "en",
      "status": "Published",
      "publishedAt": "2025-01-15T00:00:00Z",
      "updatedAt": "2025-01-25T10:00:00Z",
      "freshnessDeadline": "2025-04-15T00:00:00Z",
      "views": 1542,
      "citationCount": 89,
      "helpfulVotes": 127,
      "unhelpfulVotes": 28,
      "tags": []
    }
  ],
  "meta": { "total": 50, "page": 1, "pages": 3 }
}
```

**GET /api/km/reviews**:
```json
{
  "data": [
    {
      "id": "review-001",
      "articleId": "kb-004",
      "articleTitle": "Transcript Request Process",
      "submittedBy": "agent-001",
      "submittedAt": "2025-01-28T14:00:00Z",
      "assignedTo": "km-001",
      "status": "pending",
      "notes": "Updated process for spring 2025"
    }
  ]
}
```

**POST /api/km/articles/:id/approve**:
```json
{
  "reviewComment": "Looks good, approved for publish",
  "publishImmediately": true
}
```

**GET /api/km/policies**:
```json
{
  "data": [
    {
      "id": "policy-finance-payment-plan",
      "name": "Payment Plan Eligibility",
      "version": "2.1",
      "department": "Finance",
      "body": "Students with balances over $1,000 and no account holds may request payment plans for 3, 6, or 12 months.",
      "articleId": "kb-002",
      "articleUrl": "/kb/payment-plan-eligibility",
      "updatedAt": "2025-01-15T00:00:00Z"
    }
  ]
}
```

---

### 15.7 MSW Seed

**Articles** (12 total: 10 EN, 2 AR):
```typescript
const seedArticles = [
  {
    id: "kb-001",
    title: "How to Pay Tuition Online",
    slug: "how-to-pay-tuition-online",
    department: "Finance",
    locale: "en",
    status: "Published",
    blocks: [
      { type: "heading", level: 1, content: "Payment Methods" },
      { type: "paragraph", content: "We accept credit cards, bank transfers, and checks..." }
    ],
    publishedAt: "2025-01-15T00:00:00Z",
    updatedAt: "2025-01-20T00:00:00Z",
    freshnessDeadline: "2025-04-15T00:00:00Z",
    views: 1542,
    citationCount: 89,
    helpfulVotes: 127,
    unhelpfulVotes: 28,
    tags: []
  },
  {
    id: "kb-002",
    title: "Payment Plan Eligibility",
    slug: "payment-plan-eligibility",
    department: "Finance",
    locale: "en",
    status: "Published",
    // ... (from Part 2 seed)
  },
  {
    id: "kb-002-ar",
    title: "أهلية خطة الدفع",
    slug: "payment-plan-eligibility-ar",
    department: "Finance",
    locale: "ar",
    status: "Published",
    // Arabic translation of kb-002
  },
  {
    id: "kb-stale-001",
    title: "Admissions Deadlines 2024",
    slug: "admissions-deadlines-2024",
    department: "Admissions",
    locale: "en",
    status: "Published",
    publishedAt: "2024-09-01T00:00:00Z",
    updatedAt: "2024-09-01T00:00:00Z", // 120+ days ago
    freshnessDeadline: "2024-11-30T00:00:00Z", // already passed
    views: 342,
    citationCount: 12,
    helpfulVotes: 45,
    unhelpfulVotes: 8,
    tags: ["needs_update", "stale"]
  }
  // ... 9 more articles
];
```

**Policy Snippet** (used in Finance AI draft):
```typescript
const seedPolicySnippets = [
  {
    id: "policy-finance-payment-plan",
    name: "Payment Plan Eligibility",
    version: "2.1",
    department: "Finance",
    body: "Students with balances over $1,000 and no account holds may request payment plans for 3, 6, or 12 months.",
    articleId: "kb-002",
    articleUrl: "/kb/payment-plan-eligibility",
    createdAt: "2025-01-15T00:00:00Z",
    updatedAt: "2025-01-15T00:00:00Z"
  }
];
```

---

### 15.8 Telemetry

```typescript
{
  event: "reops.km.article_published",
  props: {
    article_id: string,
    department: string,
    locale: string,
    block_count: number,
    version: number
  }
}

{
  event: "reops.km.article_sent_to_review",
  props: {
    article_id: string,
    reviewer_id: string,
    has_notes: boolean
  }
}

{
  event: "reops.km.review_completed",
  props: {
    article_id: string,
    reviewer_id: string,
    outcome: "approved" | "rejected",
    time_to_review_hours: number
  }
}

{
  event: "reops.km.freshness_breached",
  props: {
    article_id: string,
    days_since_update: number,
    citation_count: number
  }
}

{
  event: "reops.km.policy_snippet_created",
  props: {
    snippet_id: string,
    department: string,
    version: string
  }
}

{
  event: "reops.km.article_autosaved",
  props: {
    article_id: string,
    block_count: number,
    seconds_since_last_save: number
  }
}
```

---

### 15.9 i18n Keys

**English**:
```json
{
  "km.articles.title": "Knowledge Management",
  "km.articles.newArticle": "New Article",
  "km.articles.draft": "Draft",
  "km.articles.review": "Review",
  "km.articles.published": "Published",
  "km.articles.archived": "Archived",
  "km.articles.department": "Department",
  "km.articles.locale": "Locale",
  "km.articles.staleness": "Staleness",
  "km.articles.bulkActions": "Bulk Actions",
  "km.articles.sendToReview": "Send to Review",
  "km.articles.archive": "Archive",
  "km.editor.title": "Edit Article",
  "km.editor.saveDraft": "Save Draft",
  "km.editor.sendToReview": "Send to Review",
  "km.editor.publish": "Publish",
  "km.editor.autosaved": "Autosaved {time} ago",
  "km.editor.addBlock": "Add Block",
  "km.editor.heading": "Heading",
  "km.editor.paragraph": "Paragraph",
  "km.editor.list": "List",
  "km.editor.callout": "Callout",
  "km.editor.code": "Code Block",
  "km.editor.table": "Table",
  "km.review.title": "Review Article",
  "km.review.approve": "Approve & Publish",
  "km.review.requestChanges": "Request Changes",
  "km.review.feedback": "Feedback",
  "km.freshness.approaching": "Freshness Deadline Approaching",
  "km.freshness.breached": "Article Stale - Needs Update",
  "km.citation.rate": "Citation Rate",
  "km.citation.views": "Views",
  "km.citation.helpful": "Helpful Votes",
  "km.policy.create": "Create Policy Snippet",
  "km.policy.version": "Version",
  "km.policy.immutable": "Immutable"
}
```

**Arabic**:
```json
{
  "km.articles.title": "إدارة المعرفة",
  "km.articles.newArticle": "مقالة جديدة",
  "km.articles.draft": "مسودة",
  "km.articles.review": "مراجعة",
  "km.articles.published": "منشور",
  "km.articles.sendToReview": "إرسال للمراجعة",
  "km.editor.publish": "نشر",
  "km.review.approve": "الموافقة والنشر",
  "km.citation.rate": "معدل الاقتباس"
}
```

---

### 15.10 Acceptance Criteria

- [ ] Article list loads with tabs for Draft/Review/Published/Archived
- [ ] Clicking tab filters articles by status
- [ ] Staleness filter shows articles >90 days old with warning badge
- [ ] Stale articles show "needs_update" tag automatically
- [ ] Clicking "New Article" opens editor with empty canvas
- [ ] Editor supports adding H1/H2/H3 headings via block menu
- [ ] Editor supports paragraph, list, callout, code, table blocks
- [ ] Autosave triggers every 30s and shows "Autosaved Xs ago"
- [ ] Clicking "Save Draft" immediately saves and updates timestamp
- [ ] Block menu shows all block types with icons
- [ ] Drag-drop reordering blocks updates content structure
- [ ] Clicking "Send to Review" opens modal with reviewer dropdown
- [ ] Reviewer dropdown shows pending review count per reviewer
- [ ] Submitting review assigns article and shows in reviewer's queue
- [ ] Review page shows full article content with approve/reject buttons
- [ ] Approving publishes article and increments version number
- [ ] Rejecting sends article back to draft with feedback comment
- [ ] Freshness warning appears when <14 days until deadline
- [ ] Citation rate calculates correctly (citations/views * 100)
- [ ] Article performance shows views, citations, helpful votes
- [ ] Creating policy snippet validates required fields
- [ ] Policy snippet appears in composer "Insert Variable" dropdown
- [ ] Telemetry fires on article_published, freshness_breached, review_completed

---

## 16. Audit & Compliance

### 16.1 Audit Log Screen

**Filter & Search**:
```
┌─ Audit Log ───────────────────────────────────────────────────────┐
│ Filters: Actor [All ▾]  Event Type [All ▾]  Entity [All ▾]       │
│ Date Range: [Last 7 days ▾]                      🔍 Search...     │
│ [Export CSV] [Export JSON]                                        │
│────────────────────────────────────────────────────────────────────│
│ Timestamp       | Actor         | Event               | Entity    │
│────────────────────────────────────────────────────────────────────│
│ 2m ago          | Sarah Johnson | case.status_changed | TKT-00042 │
│ 15m ago         | David Lee     | case.assigned       | TKT-00038 │
│ 1h ago          | Admin User    | workflow.published  | WF-001    │
│ 2h ago          | Emily Chen    | case.reply_sent     | TKT-00035 │
│ 3h ago          | Manager       | rebalance.applied   | Queue:FIN │
└───────────────────────────────────────────────────────────────────┘
```

**Row Details Drawer**:
```tsx
<Sheet open={selectedEvent !== null} onOpenChange={closeDrawer}>
  <SheetContent side="right" className="w-[600px]">
    <SheetHeader>
      <SheetTitle>Audit Event Details</SheetTitle>
      <SheetDescription>
        {selectedEvent?.type} | {formatDateTime(selectedEvent?.timestamp)}
      </SheetDescription>
    </SheetHeader>

    <div className="mt-6 space-y-4">
      <div>
        <Label className="text-sm font-medium">Event ID</Label>
        <p className="text-sm font-mono">{selectedEvent?.id}</p>
      </div>

      <div>
        <Label className="text-sm font-medium">Actor</Label>
        <p className="text-sm">{selectedEvent?.actorName} ({selectedEvent?.actorId})</p>
      </div>

      <div>
        <Label className="text-sm font-medium">Entity</Label>
        <p className="text-sm">
          {selectedEvent?.entityType}: {selectedEvent?.entityId}
        </p>
      </div>

      <div>
        <Label className="text-sm font-medium">Correlation ID</Label>
        <p className="text-sm font-mono text-muted-foreground">
          {selectedEvent?.correlationId || "—"}
        </p>
      </div>

      <Separator />

      <div>
        <Label className="text-sm font-medium">Event Payload (JSON)</Label>
        <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto max-h-96">
          {JSON.stringify(selectedEvent?.payload, null, 2)}
        </pre>
      </div>

      <Separator />

      <div>
        <Label className="text-sm font-medium">Metadata</Label>
        <dl className="mt-2 space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">IP Address:</dt>
            <dd className="font-mono">{selectedEvent?.metadata?.ipAddress}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">User Agent:</dt>
            <dd className="font-mono text-xs">{selectedEvent?.metadata?.userAgent}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Session ID:</dt>
            <dd className="font-mono">{selectedEvent?.metadata?.sessionId}</dd>
          </div>
        </dl>
      </div>
    </div>
  </SheetContent>
</Sheet>
```

**Event Types** (filter dropdown):
```typescript
const eventTypes = [
  "case.created",
  "case.status_changed",
  "case.assigned",
  "case.reply_sent",
  "case.merged",
  "user.created",
  "user.role_changed",
  "workflow.published",
  "form.versioned",
  "rebalance.applied",
  "alert.acknowledged",
  "article.published",
  "pii.view_toggled",
  "audit.export_requested"
];
```

---

### 16.2 Export Scheduler

**Export UI**:
```
┌─ Audit Export ────────────────────────────────────────────────────┐
│ One-Time Export                                                    │
│ Date Range: [Last 30 days ▾]                                      │
│ Format: ○ CSV  ● JSON                                             │
│ Include PII: ☑ (Admin only)                                       │
│ [Generate Export]                                                  │
│                                                                    │
│ Scheduled Exports (stub) ──────────────────────────────────────────│
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ Daily Audit Export                                           │  │
│ │ Schedule: Daily at 2:00 AM UTC                               │  │
│ │ Format: JSON | Include PII: No                               │  │
│ │ Last Run: Jan 30, 2025 2:00 AM                               │  │
│ │ [Edit] [Disable]                                             │  │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ Export History ────────────────────────────────────────────────────│
│ Jan 30, 2025 2:00 AM | Daily Export    | 1.2 MB | [Download]     │
│ Jan 29, 2025 2:00 AM | Daily Export    | 1.1 MB | [Download]     │
│ Jan 28, 2025 3:15 PM | Manual Export   | 450 KB | [Download]     │
└───────────────────────────────────────────────────────────────────┘
```

**Export Generation**:
```typescript
// POST /api/export
interface ExportRequest {
  dateRange: {
    start: string; // ISO date
    end: string;
  };
  format: "csv" | "json";
  includePII: boolean; // requires Admin role
  eventTypes?: string[]; // filter by types
}

// Response
interface ExportResponse {
  exportId: string;
  status: "pending" | "processing" | "completed" | "failed";
  downloadUrl?: string; // presigned S3 URL (mocked)
  expiresAt?: string; // URL expires in 24h
  fileSizeBytes?: number;
  recordCount?: number;
}

// MSW handler simulates 3s processing
export const exportAuditHandler = http.post('/api/export', async ({ request }) => {
  await delay(3000);

  const body = await request.json();
  const { dateRange, format, includePII } = body;

  // Generate mock data
  const records = generateAuditRecords(dateRange);
  const blob = format === "csv" ? toCSV(records) : toJSON(records);

  return HttpResponse.json({
    data: {
      exportId: `exp-${Date.now()}`,
      status: "completed",
      downloadUrl: `/api/export/download/exp-${Date.now()}`,
      expiresAt: addHours(new Date(), 24).toISOString(),
      fileSizeBytes: blob.length,
      recordCount: records.length
    }
  });
});
```

**Recurring Exports** (stub):
```typescript
interface RecurringExport {
  id: string;
  name: string;
  schedule: "daily" | "weekly" | "monthly";
  time: string; // "02:00" UTC
  format: "csv" | "json";
  includePII: boolean;
  enabled: boolean;
  lastRunAt?: string;
  nextRunAt: string;
}

// UI stub (no actual scheduling, just config)
const recurringExports: RecurringExport[] = [
  {
    id: "rec-001",
    name: "Daily Audit Export",
    schedule: "daily",
    time: "02:00",
    format: "json",
    includePII: false,
    enabled: true,
    lastRunAt: "2025-01-30T02:00:00Z",
    nextRunAt: "2025-01-31T02:00:00Z"
  }
];
```

---

### 16.3 PII Masking Rules

**Show/Hide Toggle**:
```tsx
<div className="flex items-center justify-between p-4 border-b">
  <div>
    <h3 className="font-medium">PII Visibility</h3>
    <p className="text-sm text-muted-foreground">
      Show personally identifiable information in audit logs
    </p>
  </div>

  <div className="flex items-center gap-2">
    <Switch
      checked={showPII}
      onCheckedChange={handleTogglePII}
      disabled={!isAdminOrManager}
    />
    <Label>Show PII</Label>
  </div>
</div>

{showPII && (
  <Alert variant="warning" className="m-4">
    <AlertTriangle className="h-4 w-4" />
    <AlertTitle>PII Visible</AlertTitle>
    <AlertDescription>
      Viewing PII is being logged for audit compliance.
    </AlertDescription>
  </Alert>
)}
```

**Masking Logic**:
```typescript
function maskPII(value: string, type: "email" | "phone" | "ssn" | "studentId"): string {
  switch (type) {
    case "email":
      // john.doe@example.com → j***@example.com
      const [local, domain] = value.split("@");
      return `${local[0]}***@${domain}`;

    case "phone":
      // +1-555-0123 → +1-***-0123
      return value.replace(/(\d{3})-(\d{3})-(\d{4})/, "$1-***-$3");

    case "ssn":
      // 123-45-6789 → ***-**-6789
      return value.replace(/\d{3}-\d{2}-(\d{4})/, "***-**-$1");

    case "studentId":
      // S1234567 → S****567
      return value.replace(/^(S)\d{4}(\d{3})$/, "$1****$2");

    default:
      return "***";
  }
}

// Apply masking to audit log display
function renderAuditEvent(event: AuditEvent, showPII: boolean) {
  const payload = showPII ? event.payload : maskPayload(event.payload);

  return (
    <div>
      <pre>{JSON.stringify(payload, null, 2)}</pre>
    </div>
  );
}

// Log PII view
function handleTogglePII(enabled: boolean) {
  setShowPII(enabled);

  if (enabled) {
    // Log audit event
    trackEvent("reops.audit.pii_view_toggled", {
      user_id: currentUser.id,
      enabled: true,
      timestamp: new Date().toISOString()
    });
  }
}
```

---

### 16.4 APIs

**GET /api/admin/audit**:
```
GET /api/admin/audit?actor=agent-002&eventType=case.status_changed&dateRange=7d&page=1
```

Response:
```json
{
  "data": [
    {
      "id": "evt-20250130-001",
      "type": "case.status_changed",
      "actorId": "agent-002",
      "actorName": "Sarah Johnson",
      "actorRole": "Agent",
      "entityType": "Case",
      "entityId": "CASE-20250042",
      "timestamp": "2025-01-30T14:22:00Z",
      "correlationId": "corr-abc123",
      "payload": {
        "caseId": "CASE-20250042",
        "fromStatus": "Open",
        "toStatus": "Resolved",
        "reason": "Payment plan approved"
      },
      "metadata": {
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "sessionId": "sess-xyz789"
      }
    }
  ],
  "meta": {
    "total": 1247,
    "page": 1,
    "pages": 25,
    "perPage": 50
  }
}
```

**GET /api/export/download/:id**:
```
GET /api/export/download/exp-1706623200000
```

Response: File download (CSV or JSON blob)

---

### 16.5 MSW Seed

**1,000 Audit Events** (from actions across §9-§12):
```typescript
const eventTemplates = [
  // Case events
  { type: "case.created", weight: 15 },
  { type: "case.status_changed", weight: 20 },
  { type: "case.assigned", weight: 18 },
  { type: "case.reply_sent", weight: 22 },
  { type: "case.merged", weight: 2 },

  // User events
  { type: "user.created", weight: 3 },
  { type: "user.role_changed", weight: 1 },

  // Admin events
  { type: "workflow.published", weight: 1 },
  { type: "form.versioned", weight: 1 },

  // Manager events
  { type: "rebalance.applied", weight: 5 },
  { type: "alert.acknowledged", weight: 8 },

  // KM events
  { type: "article.published", weight: 2 },

  // Audit events
  { type: "pii.view_toggled", weight: 2 }
];

function generateAuditEvents(count: number): AuditEvent[] {
  const events: AuditEvent[] = [];
  const actors = ["agent-001", "agent-002", "agent-003", "manager-001", "admin-001"];

  for (let i = 0; i < count; i++) {
    const template = weightedRandom(eventTemplates);
    const timestamp = subHours(new Date(), Math.floor(Math.random() * 168)); // last 7 days

    events.push({
      id: `evt-${timestamp.getTime()}-${i}`,
      type: template.type,
      actorId: actors[i % actors.length],
      actorName: getActorName(actors[i % actors.length]),
      actorRole: getActorRole(actors[i % actors.length]),
      entityType: getEntityType(template.type),
      entityId: generateEntityId(template.type),
      timestamp: timestamp.toISOString(),
      correlationId: `corr-${Math.random().toString(36).substring(7)}`,
      payload: generatePayload(template.type),
      metadata: {
        ipAddress: generateIP(),
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...",
        sessionId: `sess-${Math.random().toString(36).substring(7)}`
      }
    });
  }

  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// Seed
const seedAuditEvents = generateAuditEvents(1000);
```

**Example Events**:
```typescript
// First 5 audit events (most recent)
const exampleEvents = [
  {
    id: "evt-20250130-001",
    type: "case.status_changed",
    actorId: "agent-002",
    actorName: "Sarah Johnson",
    actorRole: "Agent",
    entityType: "Case",
    entityId: "CASE-20250042",
    timestamp: "2025-01-30T14:22:00Z",
    payload: { caseId: "CASE-20250042", fromStatus: "Open", toStatus: "Resolved" }
  },
  {
    id: "evt-20250130-002",
    type: "case.assigned",
    actorId: "agent-003",
    actorName: "David Lee",
    actorRole: "Agent",
    entityType: "Case",
    entityId: "CASE-20250038",
    timestamp: "2025-01-30T14:05:00Z",
    payload: { caseId: "CASE-20250038", assigneeId: "agent-003", previousAssignee: null }
  },
  {
    id: "evt-20250130-003",
    type: "workflow.published",
    actorId: "admin-001",
    actorName: "Admin User",
    actorRole: "Admin",
    entityType: "Workflow",
    entityId: "WF-001",
    timestamp: "2025-01-30T13:00:00Z",
    payload: { workflowId: "WF-001", version: 1, nodeCount: 3 }
  },
  {
    id: "evt-20250130-004",
    type: "case.reply_sent",
    actorId: "agent-004",
    actorName: "Emily Chen",
    actorRole: "Agent",
    entityType: "Case",
    entityId: "CASE-20250035",
    timestamp: "2025-01-30T12:30:00Z",
    payload: { caseId: "CASE-20250035", messageLength: 240, hasAICitations: true }
  },
  {
    id: "evt-20250130-005",
    type: "rebalance.applied",
    actorId: "manager-001",
    actorName: "Michael Brown",
    actorRole: "Manager",
    entityType: "Queue",
    entityId: "finance:primary",
    timestamp: "2025-01-30T11:15:00Z",
    payload: { queueId: "finance:primary", casesReassigned: 5, riskBefore: 0.84, riskAfter: 0.62 }
  }
];
```

---

### 16.6 Telemetry

```typescript
{
  event: "reops.audit.query_run",
  props: {
    filter_count: number,
    event_types: string[],
    date_range: string,
    result_count: number,
    query_time_ms: number
  }
}

{
  event: "reops.audit.export_requested",
  props: {
    format: "csv" | "json",
    date_range: string,
    include_pii: boolean,
    record_count: number
  }
}

{
  event: "reops.audit.export_downloaded",
  props: {
    export_id: string,
    file_size_kb: number,
    time_to_download_seconds: number
  }
}

{
  event: "reops.audit.pii_view_toggled",
  props: {
    user_id: string,
    enabled: boolean
  }
}

{
  event: "reops.audit.event_detail_viewed",
  props: {
    event_id: string,
    event_type: string,
    actor_id: string
  }
}
```

---

### 16.7 i18n Keys

**English**:
```json
{
  "audit.title": "Audit Log",
  "audit.filter.actor": "Actor",
  "audit.filter.eventType": "Event Type",
  "audit.filter.entity": "Entity",
  "audit.filter.dateRange": "Date Range",
  "audit.search.placeholder": "Search events...",
  "audit.export.csv": "Export CSV",
  "audit.export.json": "Export JSON",
  "audit.table.timestamp": "Timestamp",
  "audit.table.actor": "Actor",
  "audit.table.event": "Event",
  "audit.table.entity": "Entity",
  "audit.detail.eventId": "Event ID",
  "audit.detail.correlationId": "Correlation ID",
  "audit.detail.payload": "Event Payload (JSON)",
  "audit.detail.metadata": "Metadata",
  "audit.pii.show": "Show PII",
  "audit.pii.warning": "Viewing PII is being logged for audit compliance",
  "audit.export.title": "Audit Export",
  "audit.export.oneTime": "One-Time Export",
  "audit.export.scheduled": "Scheduled Exports",
  "audit.export.history": "Export History",
  "audit.export.generate": "Generate Export",
  "audit.export.download": "Download",
  "audit.export.includePII": "Include PII (Admin only)",
  "audit.immutable": "Audit logs are immutable"
}
```

**Arabic**:
```json
{
  "audit.title": "سجل التدقيق",
  "audit.filter.actor": "الفاعل",
  "audit.filter.eventType": "نوع الحدث",
  "audit.filter.dateRange": "نطاق التاريخ",
  "audit.export.csv": "تصدير CSV",
  "audit.export.json": "تصدير JSON",
  "audit.table.timestamp": "الطابع الزمني",
  "audit.table.event": "الحدث",
  "audit.pii.show": "إظهار المعلومات الشخصية",
  "audit.export.download": "تحميل"
}
```

---

### 16.8 Acceptance Criteria

- [ ] Audit log table loads with most recent events first
- [ ] Filters work independently: actor, event type, entity, date range
- [ ] Search filters events by actor name, entity ID, or event type
- [ ] Clicking row opens drawer with full event details
- [ ] Event detail shows JSON payload with syntax highlighting
- [ ] Correlation ID displayed for tracing related events
- [ ] Metadata shows IP address, user agent, session ID
- [ ] PII masking toggle requires Manager/Admin role
- [ ] Toggling "Show PII" ON logs audit event with timestamp
- [ ] Masked email shows first character + domain (j***@example.com)
- [ ] Masked student ID shows first + last 3 chars (S****567)
- [ ] Export CSV generates file and shows download link after 3s
- [ ] Export JSON generates file with correct JSON structure
- [ ] Export includes PII only if checkbox checked and user is Admin
- [ ] Download link expires after 24h (shows expiration time)
- [ ] Recurring export config shows schedule, format, last run time
- [ ] Export history lists past exports with file size and download links
- [ ] Audit log is read-only (no edit/delete buttons)
- [ ] Immutability notice displayed prominently
- [ ] Telemetry fires on query_run, export_requested, pii_view_toggled
- [ ] 1,000 seeded events cover all event types from §9-§12

---

END PART 4

---

## 17. AI Prompts & Models

### 17.1 Model Registry

**Abstract Model Descriptor**:
```typescript
interface ModelDescriptor {
  id: string;                      // e.g. "gpt-4o", "claude-3.5-sonnet", "gemini-1.5-pro"
  family: string;                  // "openai" | "anthropic" | "google"
  capabilities: {
    json: boolean;                 // structured output support
    reasoning: boolean;            // advanced reasoning capability
    tools?: string[];              // ["function_calling", "web_search", ...]
  };
  maxTokens: number;               // context window size
  costClass: "low" | "med" | "high";
  timeoutMs: number;               // default timeout
}
```

**Selection Policy** (task → model mapping with fallback order):

| Task           | Primary Model          | Fallback 1             | Fallback 2          |
|----------------|------------------------|------------------------|---------------------|
| `classifier`   | gpt-4o-mini            | claude-3-haiku         | gemini-1.5-flash    |
| `router`       | claude-3.5-sonnet      | gpt-4o                 | gemini-1.5-pro      |
| `draft`        | claude-3.5-sonnet      | gpt-4o                 | gemini-1.5-pro      |
| `rewrite`      | gpt-4o                 | claude-3.5-sonnet      | gemini-1.5-pro      |
| `extract`      | gpt-4o-mini (json)     | claude-3-haiku (json)  | gemini-1.5-flash    |

**Model Registry Configuration**:
```json
{
  "models": [
    {
      "id": "gpt-4o-mini",
      "family": "openai",
      "capabilities": {"json": true, "reasoning": false, "tools": ["function_calling"]},
      "maxTokens": 128000,
      "costClass": "low",
      "timeoutMs": 15000
    },
    {
      "id": "claude-3.5-sonnet",
      "family": "anthropic",
      "capabilities": {"json": true, "reasoning": true, "tools": ["function_calling"]},
      "maxTokens": 200000,
      "costClass": "high",
      "timeoutMs": 30000
    },
    {
      "id": "gpt-4o",
      "family": "openai",
      "capabilities": {"json": true, "reasoning": true, "tools": ["function_calling"]},
      "maxTokens": 128000,
      "costClass": "high",
      "timeoutMs": 30000
    },
    {
      "id": "gemini-1.5-pro",
      "family": "google",
      "capabilities": {"json": true, "reasoning": true, "tools": ["function_calling"]},
      "maxTokens": 1000000,
      "costClass": "med",
      "timeoutMs": 20000
    }
  ]
}
```

---

### 17.2 Zod Schemas

**ClassificationResult**:
```typescript
import { z } from 'zod';

const ClassificationResultSchema = z.object({
  intent: z.enum(['admissions_inquiry', 'finance_payment', 'registrar_transcript', 'general_support', 'complaint', 'feedback']),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  urgency: z.enum(['low', 'medium', 'high', 'critical']),
  sentiment: z.enum(['positive', 'neutral', 'negative']),
  language: z.enum(['en', 'ar']),
  suggestedTags: z.array(z.string()).max(5)
});

type ClassificationResult = z.infer<typeof ClassificationResultSchema>;
```

**Valid JSON Example**:
```json
{
  "intent": "finance_payment",
  "confidence": 0.92,
  "reasoning": "Student inquiring about tuition payment deadline and acceptable payment methods.",
  "urgency": "medium",
  "sentiment": "neutral",
  "language": "en",
  "suggestedTags": ["tuition", "payment-deadline", "payment-methods"]
}
```

---

**RoutingDecision**:
```typescript
const RoutingDecisionSchema = z.object({
  department: z.enum(['admissions', 'finance', 'registrar', 'it_support', 'student_affairs', 'general']),
  assigneeId: z.string().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  estimatedSLA: z.number().describe('hours until due'),
  reasoning: z.string(),
  requiresHuman: z.boolean(),
  relatedPolicyIds: z.array(z.string()).max(3)
});

type RoutingDecision = z.infer<typeof RoutingDecisionSchema>;
```

**Valid JSON Example**:
```json
{
  "department": "finance",
  "assigneeId": "agent_finance_002",
  "priority": "high",
  "estimatedSLA": 24,
  "reasoning": "Payment deadline inquiry requires Finance team; student mentioned upcoming deadline creating urgency.",
  "requiresHuman": false,
  "relatedPolicyIds": ["POL-FIN-001", "POL-FIN-012"]
}
```

---

**DraftReply**:
```typescript
const CitationSchema = z.object({
  articleId: z.string(),
  title: z.string(),
  section: z.string().optional(),
  url: z.string().url()
});

const DraftReplySchema = z.object({
  body: z.string().min(50).max(2000),
  tone: z.enum(['brief', 'neutral', 'warm']),
  language: z.enum(['en', 'ar']),
  citations: z.array(CitationSchema).min(1).describe('Required for policy answers'),
  nextSteps: z.array(z.string()).max(3).optional(),
  requiresManagerReview: z.boolean()
});

type DraftReply = z.infer<typeof DraftReplySchema>;
type Citation = z.infer<typeof CitationSchema>;
```

**Valid JSON Example**:
```json
{
  "body": "Hello Ahmed,\n\nThank you for your inquiry about tuition payment. Payment is due by the 15th of each month. We accept bank transfer, credit card, and cash payments at the Finance Office.\n\nFor installment plans, please submit a request through the Student Portal at least 10 days before the payment deadline.\n\nBest regards,\nReOps Finance Team",
  "tone": "warm",
  "language": "en",
  "citations": [
    {
      "articleId": "KB-FIN-001",
      "title": "Tuition Payment Policies",
      "section": "Payment Methods & Deadlines",
      "url": "https://kb.reops.example/finance/payment-policies"
    }
  ],
  "nextSteps": ["Submit installment request if needed", "Contact Finance Office for payment confirmation"],
  "requiresManagerReview": false
}
```

---

**PolicyCheckResult**:
```typescript
const PolicyCheckResultSchema = z.object({
  compliant: z.boolean(),
  violatedPolicies: z.array(z.string()),
  reasoning: z.string(),
  suggestedRevision: z.string().optional()
});

type PolicyCheckResult = z.infer<typeof PolicyCheckResultSchema>;
```

**Valid JSON Example**:
```json
{
  "compliant": false,
  "violatedPolicies": ["POL-COMM-003"],
  "reasoning": "Draft mentions fee waiver eligibility criteria not approved for public communication per Policy POL-COMM-003.",
  "suggestedRevision": "Remove mention of specific waiver criteria; instead direct student to meet with Financial Aid advisor."
}
```

---

**ExtractionResult**:
```typescript
const ExtractionResultSchema = z.object({
  amountUSD: z.number().nullable(),
  studentId: z.string().nullable(),
  invoiceId: z.string().nullable(),
  courseCode: z.string().nullable(),
  dueDateISO: z.string().datetime().nullable(),
  confidence: z.number().min(0).max(1),
  extractedFields: z.record(z.string(), z.any())
});

type ExtractionResult = z.infer<typeof ExtractionResultSchema>;
```

**Valid JSON Example**:
```json
{
  "amountUSD": 1250.00,
  "studentId": "S2024-3456",
  "invoiceId": "INV-2024-09-1523",
  "courseCode": "CS301",
  "dueDateISO": "2024-10-15T23:59:59Z",
  "confidence": 0.95,
  "extractedFields": {
    "paymentMethod": "bank_transfer",
    "semesterCode": "FALL2024"
  }
}
```

---

### 17.3 Prompt Templates

#### **Classifier Prompt**

```
You are an AI classifier for a university student support system. Analyze the incoming message and return a JSON classification.

# Task
Classify the student inquiry into ONE intent category, assess urgency, sentiment, and suggest up to 5 tags.

# Intent Categories
- admissions_inquiry: Application status, requirements, deadlines
- finance_payment: Tuition, fees, payment plans, invoices
- registrar_transcript: Transcripts, grades, enrollment verification, course registration
- general_support: General questions, facility info, campus services
- complaint: Formal complaints, service issues
- feedback: Suggestions, praise, general feedback

# Few-Shot Examples

**Example 1 (Admissions)**:
Input: "I submitted my application 3 weeks ago but haven't heard back. My application ID is APP-2024-8821. When will I get a decision?"

Output:
{
  "intent": "admissions_inquiry",
  "confidence": 0.96,
  "reasoning": "Student asking about application status with specific application ID. Clear admissions-related inquiry.",
  "urgency": "medium",
  "sentiment": "neutral",
  "language": "en",
  "suggestedTags": ["application-status", "admissions", "follow-up"]
}

**Example 2 (Finance)**:
Input: "My invoice shows $1,500 due on Oct 15th but I already paid $1,000 last week. Can you check invoice INV-2024-09-1523?"

Output:
{
  "intent": "finance_payment",
  "confidence": 0.94,
  "reasoning": "Student reporting payment discrepancy with specific invoice number and amounts. Finance department issue.",
  "urgency": "high",
  "sentiment": "neutral",
  "language": "en",
  "suggestedTags": ["payment-discrepancy", "invoice", "billing-error"]
}

**Example 3 (Registrar)**:
Input: "أحتاج كشف درجات رسمي لتقديمه إلى السفارة. هل يمكنني الحصول عليه اليوم؟"

Output:
{
  "intent": "registrar_transcript",
  "confidence": 0.97,
  "reasoning": "Student requesting official transcript for embassy submission (Arabic). Registrar service request with same-day urgency.",
  "urgency": "high",
  "sentiment": "neutral",
  "language": "ar",
  "suggestedTags": ["transcript-request", "official-documents", "urgent"]
}

# Instructions
- Return ONLY valid JSON matching ClassificationResult schema
- Confidence 0.8+ for clear intent; 0.5-0.79 for ambiguous; <0.5 triggers human review
- Urgency "critical" only for same-day deadlines or emergencies
- Use student's language for "language" field

Now classify this message:
{{message.body}}
```

---

#### **Router Prompt**

```
You are a routing engine for a university support system. Route the classified inquiry to the appropriate department and assignee.

# Departments
- admissions: Application processing, admission decisions, enrollment
- finance: Tuition, payments, invoices, financial aid
- registrar: Transcripts, grades, course registration, enrollment verification
- it_support: Portal access, password resets, system issues
- student_affairs: Student conduct, housing, campus life
- general: Unclassified or multi-department issues

# SLA Guidelines (hours)
- Admissions: 48h (standard), 24h (near deadline)
- Finance: 24h (payment issues), 48h (general inquiries)
- Registrar: 24h (transcript requests), 48h (general)
- IT Support: 4h (access issues), 24h (general)
- Student Affairs: 72h (standard)

# Routing Rules
1. Match intent to department
2. Assign to specialist if student has prior cases with that agent
3. Set priority based on urgency + proximity to deadline
4. requiresHuman=true if: complaint, policy exception request, or confidence <0.7
5. Link related policy IDs from knowledge base (§15)

# Few-Shot Examples

**Example 1 (Finance)**:
Classification:
{
  "intent": "finance_payment",
  "urgency": "high",
  "studentId": "S2024-3456"
}

Student History:
- Previous case with agent_finance_002 (resolved in 12h)

Output:
{
  "department": "finance",
  "assigneeId": "agent_finance_002",
  "priority": "high",
  "estimatedSLA": 24,
  "reasoning": "Payment inquiry with high urgency. Assigning to agent_finance_002 due to prior successful resolution with this student.",
  "requiresHuman": false,
  "relatedPolicyIds": ["POL-FIN-001", "POL-FIN-012"]
}

**Example 2 (Registrar)**:
Classification:
{
  "intent": "registrar_transcript",
  "urgency": "high",
  "language": "ar"
}

Output:
{
  "department": "registrar",
  "assigneeId": "agent_registrar_005",
  "priority": "high",
  "estimatedSLA": 24,
  "reasoning": "Urgent transcript request in Arabic. Assigning to agent_registrar_005 (Arabic-speaking specialist). High priority due to urgency.",
  "requiresHuman": false,
  "relatedPolicyIds": ["POL-REG-008"]
}

# Input
Classification: {{classificationResult}}
Student ID: {{student.id}}
Student Name: {{student.name}}
Prior Cases: {{student.recentCases}}

# Instructions
- Return ONLY valid JSON matching RoutingDecision schema
- If no specialist match, assigneeId = null (round-robin assignment)
- Link policies from KB (max 3)
- Calculate SLA from department guidelines + urgency

Route this inquiry:
```

---

#### **Draft Composer Prompt**

```
You are a draft reply composer for a university support system. Generate a professional, helpful reply to the student inquiry.

# Tone Guidelines
- brief: 2-3 sentences, direct answer only
- neutral: Professional, factual, 4-6 sentences
- warm: Friendly, empathetic, personalized, 5-8 sentences

# Requirements
1. Address student by name if available: {{student.name}}
2. Cite at least ONE knowledge base article for policy-related answers
3. Use {{policy.ref}} placeholders for policy references
4. Provide clear next steps (max 3)
5. End with appropriate sign-off
6. If Arabic (language=ar), use RTL-friendly formatting

# Citation Format
For every policy or procedural answer, include citations array with articleId, title, section, url.

# Few-Shot Examples

**Example 1 (Finance - Warm Tone)**:
Input:
{
  "intent": "finance_payment",
  "studentName": "Ahmed Hassan",
  "inquiry": "Can I pay my tuition in installments? The full amount is due next week.",
  "tone": "warm",
  "language": "en"
}

Knowledge Base Match:
- Article: KB-FIN-001 "Tuition Payment Policies"
- Section: "Installment Plans"
- Content: "Students may request 3-month installment plans by submitting Form FIN-102 at least 10 days before the payment deadline."

Output:
{
  "body": "Hello Ahmed,\n\nThank you for reaching out! Yes, you can request a tuition installment plan. We offer 3-month payment plans to help students manage their tuition costs.\n\nTo apply, please submit Form FIN-102 through the Student Portal at least 10 days before your payment deadline. Since your payment is due next week, I recommend submitting your request today to ensure it's processed in time.\n\nIf you have any questions about the installment process or need assistance with the form, our Finance Office is happy to help.\n\nBest regards,\nReOps Finance Team",
  "tone": "warm",
  "language": "en",
  "citations": [
    {
      "articleId": "KB-FIN-001",
      "title": "Tuition Payment Policies",
      "section": "Installment Plans",
      "url": "https://kb.reops.example/finance/payment-policies#installments"
    }
  ],
  "nextSteps": [
    "Submit Form FIN-102 via Student Portal today",
    "Contact Finance Office at finance@reops.example if you need help"
  ],
  "requiresManagerReview": false
}

**Example 2 (Admissions - Brief Tone)**:
Input:
{
  "intent": "admissions_inquiry",
  "studentName": "Sara",
  "inquiry": "What documents do I need for my application?",
  "tone": "brief",
  "language": "en"
}

Knowledge Base Match:
- Article: KB-ADM-003 "Application Requirements"
- Content: "Required: High school transcript, national ID copy, passport photo, completed application form."

Output:
{
  "body": "Hi Sara,\n\nYou'll need: high school transcript, national ID copy, passport photo, and completed application form. Full details are in our Application Requirements guide.\n\nBest,\nAdmissions Team",
  "tone": "brief",
  "language": "en",
  "citations": [
    {
      "articleId": "KB-ADM-003",
      "title": "Application Requirements",
      "url": "https://kb.reops.example/admissions/requirements"
    }
  ],
  "nextSteps": ["Review full checklist at kb.reops.example/admissions/requirements"],
  "requiresManagerReview": false
}

# Input
Student Name: {{student.name}}
Inquiry: {{case.body}}
Intent: {{classification.intent}}
Tone: {{settings.tone}}
Language: {{classification.language}}
Knowledge Base Articles: {{kb.matches}}

# Instructions
- Return ONLY valid JSON matching DraftReply schema
- MUST include citations array (min 1 for policy answers)
- Use student's name in greeting
- If KB has no match, set requiresManagerReview=true and note "No KB article found"
- For Arabic, write body in Arabic (RTL will be handled by UI)

Draft reply:
```

---

#### **Rewrite Prompt**

```
You are a readability optimizer for student communications. Rewrite the draft to target B2 reading level (CEFR) while preserving meaning and citations.

# B2 Reading Level Guidelines
- Average sentence length: 15-20 words
- Use common vocabulary (avoid jargon unless defined)
- Active voice preferred
- Break complex sentences into shorter ones
- Maintain professional tone

# Arabic Note
For Arabic text, ensure RTL compatibility. Avoid complex nested clauses. Use Modern Standard Arabic, not dialectal forms.

# Few-Shot Example

**Example 1 (English)**:
Original Draft:
"Pursuant to university regulation 4.2.3, students who fail to submit the requisite documentation by the prescribed deadline will be subject to administrative penalties including but not limited to late fees and potential enrollment suspension pending receipt of outstanding materials."

Rewritten (B2):
"According to university policy, you must submit all required documents by the deadline. If you miss the deadline, you may face late fees. In some cases, your enrollment may be suspended until we receive the missing documents."

**Example 2 (Arabic)**:
Original:
"وفقاً للمادة ٤.٢.٣ من اللوائح الجامعية، يتعين على الطلاب الذين يخفقون في تقديم الوثائق المطلوبة ضمن المهلة المحددة أن يتحملوا العقوبات الإدارية..."

Rewritten (B2):
"حسب سياسة الجامعة، يجب تقديم جميع المستندات المطلوبة قبل الموعد النهائي. إذا تأخرت، قد تدفع رسوم تأخير. في بعض الحالات، قد يتم تعليق تسجيلك حتى نستلم المستندات."

# Input
Draft: {{draft.body}}
Language: {{draft.language}}
Citations: {{draft.citations}}

# Instructions
- Rewrite body only (preserve citations, nextSteps, metadata)
- Target B2 reading level
- Keep length similar (±20%)
- Do NOT change meaning or remove policy details
- For Arabic, use RTL-compatible formatting
- Return ONLY valid JSON matching DraftReply schema

Rewrite this draft:
```

---

#### **Extractor Prompt**

```
You are a structured data extractor for university student communications. Extract specific fields from the message body.

# Target Fields
- amountUSD: Monetary amount in USD (number or null)
- studentId: Student ID matching pattern S\d{4}-\d{4} or legacy format
- invoiceId: Invoice ID matching pattern INV-\d{4}-\d{2}-\d{4}
- courseCode: Course code (e.g., CS301, MATH101)
- dueDateISO: Due date in ISO 8601 format (e.g., 2024-10-15T23:59:59Z)
- confidence: 0.0-1.0 confidence score
- extractedFields: Additional key-value pairs (flexible)

# Instructions
- Return ONLY valid JSON matching ExtractionResult schema
- NO prose, NO explanations outside JSON
- If field not found, set to null
- Confidence 1.0 = explicit mention; 0.7-0.9 = inferred from context; <0.7 = uncertain
- If JSON parsing fails, repair and retry with this hint: "Ensure all string values are properly quoted and dates are ISO 8601"

# Few-Shot Examples

**Example 1 (Finance)**:
Input: "I need to pay $1,250 for invoice INV-2024-09-1523. My student ID is S2024-3456 and it's due October 15th."

Output:
{
  "amountUSD": 1250.00,
  "studentId": "S2024-3456",
  "invoiceId": "INV-2024-09-1523",
  "courseCode": null,
  "dueDateISO": "2024-10-15T23:59:59Z",
  "confidence": 0.98,
  "extractedFields": {
    "paymentIntent": "pending"
  }
}

**Example 2 (Registrar)**:
Input: "Can I drop CS301? I'm student S2024-7890 and the drop deadline is next Friday."

Output:
{
  "amountUSD": null,
  "studentId": "S2024-7890",
  "invoiceId": null,
  "courseCode": "CS301",
  "dueDateISO": "2024-10-18T23:59:59Z",
  "confidence": 0.85,
  "extractedFields": {
    "action": "course_drop",
    "urgency": "high"
  }
}

# Input
Message: {{message.body}}
Current Date: {{context.now}}

# Repair Hint
If your output causes a JSON parse error, ensure:
1. All strings use double quotes
2. Dates are ISO 8601 format with timezone
3. Numbers have no quotes
4. No trailing commas

Extract data:
```

---

### 17.4 Safety & Policy

**Pre-Redaction Rules** (mask PII for non-Manager roles):

| Field              | Agent Role | Manager Role | Admin Role |
|--------------------|------------|--------------|------------|
| Email              | `j***@example.com` | `jane@example.com` | Full       |
| Student ID         | `S****567` | Full         | Full       |
| Phone              | `+966-***-**34` | Full         | Full       |
| National ID        | `***456789` | Full         | Full       |
| Payment Method     | `****1234` (last 4) | Full         | Full       |

**Audited Unmask Toggle**:
- Manager/Admin can toggle "Show PII" in case detail view
- Toggle event logged: `audit.pii_view_toggled` with `{userId, caseId, timestamp, reason?}`
- Shown PII rendered with yellow highlight border
- Warning banner: "Viewing PII is being logged for audit compliance"

**Refusal Templates**:

```json
{
  "refusal": {
    "toxic_content": "I cannot generate a response to this message due to policy violations. A human agent will review this case. [Case flagged for Manager review]",
    "insufficient_context": "I don't have enough information to provide a safe, accurate answer. Let me route this to a specialist who can help. [Routed to {{department}}]",
    "policy_conflict": "This request requires a policy exception. I've flagged it for Manager approval. You'll receive a response within {{sla}}h.",
    "pii_risk": "This inquiry contains sensitive information that requires human review for compliance. A Finance/Registrar specialist will respond shortly."
  }
}
```

**Toxicity Threshold & Blocklist**:
- Run content moderation on input: toxicity score >0.75 → refuse + route to Manager
- Blocklist keywords (case-insensitive): `["fraud", "lawsuit", "lawyer", "discriminat*", "incompetent", "racist"]`
- If blocklist match OR toxicity high → use `refusal.toxic_content` template
- Fallback: Use predefined macro from §10 (e.g., "ESCALATE_TO_MANAGER")

**Security Headers**:
```typescript
{
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Content-Security-Policy": "default-src 'self'",
  "X-AI-Model-Used": "{{modelId}}",  // for audit trail
  "X-PII-Redacted": "true"            // if pre-redaction applied
}
```

---

### 17.5 Reasoning Trace

**Trace Schema** (stub for future explainability):
```typescript
interface ReasoningTrace {
  decisionId: string;        // UUID
  inputsHash: string;        // SHA256 of input payload (NOT raw PII)
  outputsHash: string;       // SHA256 of output payload
  modelId: string;           // e.g., "gpt-4o-mini"
  latencyMs: number;
  tokensUsed: {input: number; output: number};
  timestamp: string;         // ISO 8601
  stepReasoning?: string[];  // optional chain-of-thought steps (redacted)
}
```

**Storage**:
- Write to `reasoning_traces` table in Supabase (§4)
- Indexed on `decisionId`, `timestamp`, `modelId`
- **NEVER log raw PII** (only hashed representations)
- Retention: 90 days, then archive to cold storage

**Example Trace**:
```json
{
  "decisionId": "dec_01HZ8X9K2M3N4P5Q6R7S8T9V",
  "inputsHash": "a3f5e8c9d2b1...",
  "outputsHash": "b2c4d6e8f0a1...",
  "modelId": "claude-3.5-sonnet",
  "latencyMs": 1823,
  "tokensUsed": {"input": 450, "output": 280},
  "timestamp": "2024-10-20T14:32:18Z",
  "stepReasoning": ["Classified as finance_payment (conf=0.94)", "Matched KB-FIN-001", "Generated draft with 1 citation"]
}
```

---

### 17.6 Knowledge Citations

**Citation Requirements**:
- AI drafts answering policy/procedural questions MUST include ≥1 citation
- Citation links to KB article (§15) with `articleId`, `title`, `section`, `url`
- If AI generates draft with 0 citations for policy question → flag case with `needs_article_seed`
- Manager/Admin receives notification: "Draft generated without KB citation. Consider creating/updating KB article."

**Citation Rendering** (UI):
```html
<div class="citation-block">
  <span class="citation-label">📚 Reference:</span>
  <a href="{{citation.url}}" target="_blank">
    {{citation.title}} - {{citation.section}}
  </a>
</div>
```

**Seed Workflow** (when `needs_article_seed` flagged):
1. Manager reviews draft + case context
2. If answer is correct → Manager clicks "Create KB Article" → pre-filled form with draft content
3. Manager edits/approves → Article saved to KB (§15)
4. Future similar inquiries → AI cites new article

**Citation Quality Check**:
- Validate `citation.url` is reachable (HEAD request, cache 24h)
- If URL returns 404 → flag article for KB review
- Telemetry: `reops.ai.citation_broken` (props: `{articleId, url, caseId}`)

---

### 17.7 Fallback Matrix

| Failure Type            | Detection                     | Action                                      | Max Retries |
|-------------------------|-------------------------------|---------------------------------------------|-------------|
| **Timeout**             | Model response >timeoutMs     | Use macro fallback (§10) → route to human   | 0           |
| **Schema Validation Fail** | Zod parse error            | Single retry with `repair_prompt` appended  | 1           |
| **Rate Limit (429)**    | HTTP 429 from provider        | Switch to alt model + exponential backoff (2^n seconds) | 2 |
| **JSON Parse Error**    | Invalid JSON in response      | Retry with repair hint (see Extractor prompt) | 1         |
| **No KB Match**         | 0 citations for policy query  | Set `requiresManagerReview=true` + flag `needs_article_seed` | 0 |
| **Toxicity Detected**   | Moderation score >0.75        | Use `refusal.toxic_content` → escalate to Manager | 0       |
| **Model Unavailable (5xx)** | HTTP 500/503              | Switch to fallback model (see §17.1)        | 2           |

**Retry Logic** (pseudocode):
```typescript
async function invokeAIWithFallback(task: string, input: any, attempt = 0): Promise<any> {
  const model = getModelForTask(task, attempt); // attempt 0=primary, 1=fallback1, 2=fallback2

  try {
    const result = await callModel(model, input, {timeout: model.timeoutMs});
    const validated = validateSchema(task, result);
    return validated;
  } catch (error) {
    if (error instanceof TimeoutError) {
      return useMacroFallback(input);
    }
    if (error instanceof SchemaValidationError && attempt < 1) {
      return invokeAIWithFallback(task, {...input, repair_hint: true}, attempt + 1);
    }
    if (error instanceof RateLimitError && attempt < 2) {
      await sleep(2 ** attempt * 1000); // exponential backoff
      return invokeAIWithFallback(task, input, attempt + 1);
    }
    throw error; // unrecoverable
  }
}
```

---

### 17.8 Eval Harness

**Golden Test Sets**:

1. **Intents** (50 examples):
   - 10 admissions_inquiry
   - 10 finance_payment
   - 10 registrar_transcript
   - 10 general_support
   - 5 complaint
   - 5 feedback
   - Each with ground truth: `{intent, urgency, sentiment, language}`

2. **Drafts** (40 examples):
   - 15 finance (payment, invoices, installments)
   - 15 admissions (requirements, status, deadlines)
   - 10 registrar (transcripts, grades, enrollment)
   - Each with ground truth: `{expectedCitations, tone, keyPhrases}`

3. **Extractions** (30 examples):
   - 10 with `amountUSD` + `invoiceId`
   - 10 with `studentId` + `courseCode`
   - 10 with `dueDateISO`
   - Ground truth: exact field values

**Metrics**:
- **Accuracy** (classification): % correct intent matches
- **Schema Pass Rate**: % of AI outputs passing Zod validation on first attempt
- **Citation Rate**: % of policy drafts with ≥1 citation
- **P95 Latency**: 95th percentile response time (ms)
- **Fallback Rate**: % of requests requiring fallback model

**Sample Aggregate JSON Row**:
```json
{
  "evalRun": "eval_2024-10-20_01",
  "timestamp": "2024-10-20T16:45:00Z",
  "modelId": "claude-3.5-sonnet",
  "metrics": {
    "classification": {
      "accuracy": 0.94,
      "avgConfidence": 0.89,
      "p95Latency": 1250
    },
    "drafts": {
      "schemaPassRate": 0.975,
      "citationRate": 0.92,
      "avgLength": 312,
      "p95Latency": 2100
    },
    "extraction": {
      "accuracy": 0.88,
      "schemaPassRate": 0.95,
      "avgConfidence": 0.91,
      "p95Latency": 980
    }
  },
  "fallbackRate": 0.03,
  "totalTests": 120,
  "passed": 112,
  "failed": 8
}
```

**CI Integration**:
- Run eval harness on every PR affecting AI prompts/models
- Require metrics delta <5% regression vs. baseline
- Store results in `eval_runs` table (Supabase)

---

### 17.9 AI Endpoints

**POST /api/ai/classify** (tied to §19 API routes)

Request:
```json
{
  "messageBody": "I need my transcript ASAP for visa application",
  "messageId": "msg_abc123",
  "studentId": "S2024-5678"
}
```

Response (200 OK):
```json
{
  "classification": {
    "intent": "registrar_transcript",
    "confidence": 0.95,
    "reasoning": "Student requesting transcript with urgency (ASAP) for visa.",
    "urgency": "high",
    "sentiment": "neutral",
    "language": "en",
    "suggestedTags": ["transcript", "urgent", "visa"]
  },
  "modelUsed": "gpt-4o-mini",
  "latencyMs": 1120
}
```

Errors:
- `408 MODEL_TIMEOUT`: Model exceeded timeoutMs
- `422 SCHEMA_MISMATCH`: Output failed Zod validation after retries
- `429 RATE_LIMITED`: Exceeded rate limit, retry after backoff

---

**POST /api/ai/route**

Request:
```json
{
  "classification": { /* ClassificationResult */ },
  "studentId": "S2024-5678",
  "caseId": "case_xyz789"
}
```

Response (200 OK):
```json
{
  "routing": {
    "department": "registrar",
    "assigneeId": "agent_registrar_003",
    "priority": "high",
    "estimatedSLA": 24,
    "reasoning": "Urgent transcript request. Assigned to registrar specialist.",
    "requiresHuman": false,
    "relatedPolicyIds": ["POL-REG-008"]
  },
  "modelUsed": "claude-3.5-sonnet",
  "latencyMs": 1450
}
```

---

**POST /api/ai/draft**

Request:
```json
{
  "caseId": "case_xyz789",
  "studentName": "Fatima Al-Mansoori",
  "inquiry": "I need my transcript urgently for my visa application.",
  "intent": "registrar_transcript",
  "tone": "warm",
  "language": "en"
}
```

Response (200 OK):
```json
{
  "draft": {
    "body": "Hello Fatima,\n\nThank you for reaching out. We understand the urgency of your visa application and are happy to help with your transcript request.\n\nOfficial transcripts are typically ready within 24 hours. You can request yours through the Student Portal under 'Academic Records.' For urgent processing, please visit the Registrar's Office in person with your student ID and visa documentation.\n\nWe're here to support you through this process.\n\nBest regards,\nRegistrar Team",
    "tone": "warm",
    "language": "en",
    "citations": [
      {
        "articleId": "KB-REG-008",
        "title": "Transcript Request Process",
        "section": "Urgent Requests",
        "url": "https://kb.reops.example/registrar/transcripts#urgent"
      }
    ],
    "nextSteps": [
      "Submit request via Student Portal",
      "Visit Registrar's Office for same-day processing if needed"
    ],
    "requiresManagerReview": false
  },
  "modelUsed": "claude-3.5-sonnet",
  "latencyMs": 2340
}
```

Errors:
- `404 NO_KB_MATCH`: No KB articles found; draft flagged for manager review

---

**POST /api/ai/rewrite**

Request:
```json
{
  "draft": { /* DraftReply */ },
  "targetReadingLevel": "B2"
}
```

Response (200 OK):
```json
{
  "rewrittenDraft": { /* DraftReply with simplified body */ },
  "modelUsed": "gpt-4o",
  "latencyMs": 1890
}
```

---

**POST /api/ai/extract**

Request:
```json
{
  "messageBody": "My invoice INV-2024-09-1523 shows $1,250 due Oct 15. Student ID S2024-3456.",
  "messageId": "msg_def456"
}
```

Response (200 OK):
```json
{
  "extraction": {
    "amountUSD": 1250.00,
    "studentId": "S2024-3456",
    "invoiceId": "INV-2024-09-1523",
    "courseCode": null,
    "dueDateISO": "2024-10-15T23:59:59Z",
    "confidence": 0.97,
    "extractedFields": {}
  },
  "modelUsed": "gpt-4o-mini",
  "latencyMs": 890
}
```

---

### 17.10 Telemetry

**AI-Specific Events** (extend §5 telemetry):

| Event Name                    | Properties                                               | Trigger                                  |
|-------------------------------|----------------------------------------------------------|------------------------------------------|
| `reops.ai.schema_validated`   | `{modelId, task, schemaName, ok:boolean, ms}`            | After Zod validation                     |
| `reops.ai.retry_invoked`      | `{modelId, task, attemptNumber, reason, ms}`             | Fallback/retry triggered                 |
| `reops.ai.citation_added`     | `{modelId, caseId, articleId, citationCount}`            | Draft includes KB citations              |
| `reops.ai.citation_broken`    | `{articleId, url, caseId}`                               | Citation URL returns 404                 |
| `reops.ai.fallback_model`     | `{primaryModel, fallbackModel, reason}`                  | Switched to fallback due to failure      |
| `reops.ai.toxicity_detected`  | `{messageId, score, action}`                             | Content moderation flags message         |
| `reops.ai.kb_match_found`     | `{caseId, articleIds:[], matchScore}`                    | KB search returns matches                |
| `reops.ai.no_kb_match`        | `{caseId, intent, flagged:boolean}`                      | No KB articles found; `needs_article_seed` |
| `reops.ai.eval_run_complete`  | `{evalRunId, passed, failed, metrics:{}}`                | Eval harness finishes                    |

**Example Telemetry Call**:
```typescript
telemetry.track('reops.ai.schema_validated', {
  modelId: 'gpt-4o-mini',
  task: 'classify',
  schemaName: 'ClassificationResult',
  ok: true,
  ms: 1120
});
```

---

### 17.11 i18n (EN/AR)

**English**:
```json
{
  "ai.banner.refusal": "This message requires human review due to policy constraints.",
  "ai.citation.label": "Reference",
  "ai.citation.missing": "No knowledge base article found. Flagged for review.",
  "ai.retry.toast": "AI processing delayed. Retrying with alternate model...",
  "ai.draft.requiresReview": "Draft requires manager approval",
  "ai.toxicity.warning": "Message flagged for review due to content policy",
  "ai.fallback.macro": "Automated response unavailable. Using template reply.",
  "ai.pii.redacted": "Some details are hidden. Managers can view full information.",
  "ai.reasoning.viewTrace": "View AI reasoning",
  "ai.kb.seedPrompt": "Create KB article from this draft",
  "ai.model.timeout": "AI response timed out. Case routed to human agent."
}
```

**Arabic**:
```json
{
  "ai.banner.refusal": "هذه الرسالة تتطلب مراجعة بشرية بسبب قيود السياسة.",
  "ai.citation.label": "مرجع",
  "ai.citation.missing": "لم يتم العثور على مقال في قاعدة المعرفة. تم وضع علامة للمراجعة.",
  "ai.retry.toast": "تأخر معالجة الذكاء الاصطناعي. إعادة المحاولة بنموذج بديل...",
  "ai.draft.requiresReview": "المسودة تتطلب موافقة المدير",
  "ai.toxicity.warning": "تم وضع علامة على الرسالة للمراجعة بسبب سياسة المحتوى",
  "ai.fallback.macro": "الرد التلقائي غير متاح. استخدام رد نموذجي.",
  "ai.pii.redacted": "بعض التفاصيل مخفية. يمكن للمديرين عرض المعلومات الكاملة.",
  "ai.kb.seedPrompt": "إنشاء مقال في قاعدة المعرفة من هذه المسودة",
  "ai.model.timeout": "انتهت مهلة استجابة الذكاء الاصطناعي. تم توجيه الحالة إلى وكيل بشري."
}
```

---

### 17.12 Acceptance Criteria

- [ ] Model registry JSON loaded on server start with 4+ models (OpenAI, Anthropic, Google)
- [ ] Selection policy maps 5 tasks (classifier, router, draft, rewrite, extract) to primary + 2 fallback models
- [ ] All 6 Zod schemas (Classification, Routing, Draft, Citation, PolicyCheck, Extraction) validate against sample JSON
- [ ] ClassificationResult schema rejects invalid intent enum value (e.g., "unknown_intent")
- [ ] DraftReply schema requires ≥1 citation; validation fails if citations=[]
- [ ] ExtractionResult accepts null for all optional fields (amountUSD, studentId, etc.)
- [ ] Classifier prompt includes 3 few-shot examples (Admissions, Finance, Registrar)
- [ ] Router prompt calculates SLA from department + urgency (Finance high urgency = 24h)
- [ ] Draft Composer prompt uses {{student.name}} and {{policy.ref}} placeholders
- [ ] Draft Composer generates ≥1 citation for policy question; flags `needs_article_seed` if 0 citations
- [ ] Rewrite prompt simplifies B2 reading level (avg sentence ≤20 words)
- [ ] Rewrite prompt note mentions Arabic RTL compatibility
- [ ] Extractor prompt outputs strict JSON with no prose
- [ ] Extractor retry includes repair hint: "Ensure string values quoted, dates ISO 8601"
- [ ] Pre-redaction masks email to `j***@example.com` for Agent role
- [ ] Pre-redaction masks studentId to `S****567` for Agent role
- [ ] Manager/Admin toggle "Show PII" logs `audit.pii_view_toggled` event
- [ ] Toxicity score >0.75 triggers `refusal.toxic_content` template + Manager escalation
- [ ] Blocklist match (e.g., "fraud") triggers refusal + human review
- [ ] ReasoningTrace logs `decisionId`, `inputsHash`, `outputsHash`, `modelId`, `latencyMs` (NO raw PII)
- [ ] Reasoning trace stored in `reasoning_traces` table with 90-day retention
- [ ] Draft with 0 citations for policy query sets `requiresManagerReview=true` + flags `needs_article_seed`
- [ ] Manager clicks "Create KB Article" → pre-filled form with draft content (§15 integration)
- [ ] Citation URL validation (HEAD request) flags broken links with `reops.ai.citation_broken`
- [ ] Timeout (>timeoutMs) → uses macro fallback, no retry
- [ ] Schema validation fail → single retry with `repair_prompt`
- [ ] Rate limit (429) → switches to alt model + exponential backoff (2^n seconds), max 2 retries
- [ ] JSON parse error → retry with repair hint, max 1 retry
- [ ] Golden test set: 50 intents, 40 drafts, 30 extractions with ground truth
- [ ] Eval metrics: accuracy, schema pass rate, citation rate, p95 latency
- [ ] Eval harness runs on CI for AI-related PRs; blocks merge if regression >5%
- [ ] Sample eval aggregate JSON includes `{accuracy, schemaPassRate, citationRate, p95Latency, fallbackRate}`
- [ ] POST /api/ai/classify returns ClassificationResult + modelUsed + latencyMs
- [ ] POST /api/ai/route returns RoutingDecision with ≤3 relatedPolicyIds
- [ ] POST /api/ai/draft includes ≥1 citation in response
- [ ] POST /api/ai/extract returns ExtractionResult with null fields if not found
- [ ] Error 408 MODEL_TIMEOUT returned if model exceeds timeoutMs
- [ ] Error 422 SCHEMA_MISMATCH returned if Zod validation fails after retry
- [ ] Error 404 NO_KB_MATCH returned if no KB articles found for policy query
- [ ] Telemetry event `reops.ai.schema_validated` fires with {modelId, task, ok, ms}
- [ ] Telemetry event `reops.ai.retry_invoked` fires on fallback with {attemptNumber, reason}
- [ ] Telemetry event `reops.ai.citation_added` fires with {articleId, citationCount}
- [ ] Telemetry event `reops.ai.no_kb_match` fires with {caseId, intent, flagged:true}
- [ ] i18n key `ai.banner.refusal` displayed when toxicity detected
- [ ] i18n key `ai.citation.label` renders "Reference" (EN) / "مرجع" (AR) in draft UI
- [ ] i18n key `ai.retry.toast` shown during fallback retry
- [ ] All AI endpoints (classify, route, draft, rewrite, extract) return 200 OK with valid schema on success

---

END §17

---

## 18. Type Definitions

### 18.1 Enums

```typescript
// Department (aligned with §4 data model)
export enum Department {
  ADMISSIONS = 'admissions',
  FINANCE = 'finance',
  REGISTRAR = 'registrar',
  IT_SUPPORT = 'it_support',
  STUDENT_AFFAIRS = 'student_affairs',
  GENERAL = 'general'
}

// Role (RLS policies §4)
export enum Role {
  AGENT = 'agent',
  MANAGER = 'manager',
  ADMIN = 'admin'
}

// Case Status
export enum CaseStatus {
  OPEN = 'open',
  PENDING = 'pending',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  SPAM = 'spam'
}

// Priority
export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

// Channel (inbox sources §9)
export enum Channel {
  EMAIL = 'email',
  WHATSAPP = 'whatsapp',
  WEBCHAT = 'webchat',
  STUDENT_PORTAL = 'student_portal'
}

// Locale (i18n §11)
export enum Locale {
  EN = 'en',
  AR = 'ar'
}

// SLA Risk (§12)
export enum SLARisk {
  ON_TRACK = 'on_track',
  AT_RISK = 'at_risk',
  BREACHED = 'breached'
}
```

---

### 18.2 Core Types

```typescript
// User (from users table §4)
export interface User {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly role: Role;
  readonly department: Department | null;
  readonly locale: Locale;
  readonly avatarUrl: string | null;
  readonly createdAt: string; // ISO 8601
  readonly updatedAt: string;
}

// StudentProfile (from students table §4)
export interface StudentProfile {
  readonly id: string;
  readonly studentId: string; // e.g., S2024-3456
  readonly name: string;
  readonly email: string;
  readonly phone: string | null;
  readonly nationalId: string | null;
  readonly enrollmentStatus: 'active' | 'inactive' | 'graduated' | 'suspended';
  readonly programCode: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

// Case (from cases table §4)
export interface Case {
  readonly id: string;
  readonly subject: string;
  readonly status: CaseStatus;
  readonly priority: Priority;
  readonly channel: Channel;
  readonly studentId: string | null;
  readonly assigneeId: string | null;
  readonly department: Department;
  readonly tags: string[];
  readonly slaDeadline: string | null; // ISO 8601
  readonly slaRisk: SLARisk;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly resolvedAt: string | null;
  readonly closedAt: string | null;
}

// SLA (from sla_configs table §4)
export interface SLA {
  readonly id: string;
  readonly department: Department;
  readonly priority: Priority;
  readonly responseTimeHours: number;
  readonly resolutionTimeHours: number;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

// Message (from messages table §4)
export interface Message {
  readonly id: string;
  readonly caseId: string;
  readonly senderId: string | null; // null for student messages
  readonly senderType: 'agent' | 'student' | 'system';
  readonly body: string;
  readonly attachments: Attachment[];
  readonly isInternal: boolean;
  readonly createdAt: string;
}

export interface Attachment {
  readonly id: string;
  readonly fileName: string;
  readonly fileSize: number; // bytes
  readonly mimeType: string;
  readonly url: string;
}

// Queue (from queues table §4)
export interface Queue {
  readonly id: string;
  readonly name: string;
  readonly department: Department;
  readonly filterRules: Record<string, any>; // JSON filter criteria
  readonly assignmentStrategy: 'round_robin' | 'load_balanced' | 'manual';
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

// Article (from articles table §4, KM §15)
export interface Article {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly content: string; // Markdown
  readonly categoryId: string;
  readonly authorId: string;
  readonly status: 'draft' | 'published' | 'archived';
  readonly locale: Locale;
  readonly viewCount: number;
  readonly helpfulCount: number;
  readonly tags: string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly publishedAt: string | null;
}

// FormSchema (custom fields §13)
export interface FormSchema {
  readonly id: string;
  readonly name: string;
  readonly department: Department;
  readonly fields: FormField[];
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface FormField {
  readonly id: string;
  readonly label: string;
  readonly type: 'text' | 'number' | 'email' | 'select' | 'multiselect' | 'date' | 'textarea';
  readonly required: boolean;
  readonly options?: string[]; // for select/multiselect
  readonly validation?: Record<string, any>;
}

// Workflow (automation §14)
export interface Workflow {
  readonly id: string;
  readonly name: string;
  readonly trigger: WorkflowTrigger;
  readonly conditions: WorkflowCondition[];
  readonly actions: WorkflowAction[];
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface WorkflowTrigger {
  readonly type: 'case_created' | 'case_updated' | 'message_received' | 'sla_at_risk';
  readonly filters?: Record<string, any>;
}

export interface WorkflowCondition {
  readonly field: string;
  readonly operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
  readonly value: any;
}

export interface WorkflowAction {
  readonly type: 'assign' | 'set_priority' | 'add_tag' | 'send_email' | 'create_task';
  readonly params: Record<string, any>;
}
```

---

### 18.3 API Helpers

```typescript
// Standard API Error
export interface ApiError {
  readonly code: string; // e.g., "MODEL_TIMEOUT", "UNAUTHORIZED"
  readonly message: string;
  readonly details?: Record<string, any>;
  readonly timestamp: string; // ISO 8601
}

// Generic API Response Wrapper
export interface ApiResponse<T> {
  readonly data: T;
  readonly meta?: {
    requestId: string;
    latencyMs: number;
  };
}

// Paginated Response
export interface Paginated<T> {
  readonly items: T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly hasMore: boolean;
}

// List Query Parameters
export interface ListQuery {
  readonly page?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly filters?: Record<string, any>;
  readonly sort?: Sort[];
}

export interface Sort {
  readonly field: string;
  readonly direction: 'asc' | 'desc';
}

// Idempotency Key (for POST/PUT operations)
export type IdempotencyKey = string & { readonly __brand: 'IdempotencyKey' };

export function createIdempotencyKey(): IdempotencyKey {
  return `idem_${Date.now()}_${Math.random().toString(36).slice(2)}` as IdempotencyKey;
}
```

---

### 18.4 Telemetry Event Map

```typescript
// Typed event map for telemetry (§5)
export type TelemetryEventMap = {
  // Inbox events (§9)
  'reops.inbox.message_received': {
    channel: Channel;
    caseId: string;
    studentId?: string;
  };
  'reops.inbox.case_created': {
    caseId: string;
    department: Department;
    priority: Priority;
    channel: Channel;
  };
  'reops.inbox.case_assigned': {
    caseId: string;
    assigneeId: string;
    assignedBy: string;
  };
  'reops.inbox.case_resolved': {
    caseId: string;
    resolutionTimeMs: number;
    slaBreached: boolean;
  };
  'reops.inbox.filter_applied': {
    filterId: string;
    resultsCount: number;
  };

  // Manager events (§11, §12)
  'reops.manager.team_view_loaded': {
    department: Department;
    agentCount: number;
  };
  'reops.manager.case_reassigned': {
    caseId: string;
    fromAgentId: string;
    toAgentId: string;
  };
  'reops.manager.sla_config_updated': {
    department: Department;
    priority: Priority;
    responseTimeHours: number;
  };
  'reops.manager.report_exported': {
    reportType: string;
    format: 'csv' | 'json' | 'pdf';
    rowCount: number;
  };

  // Admin events (§16)
  'reops.admin.user_created': {
    userId: string;
    role: Role;
    department: Department | null;
  };
  'reops.admin.role_changed': {
    userId: string;
    oldRole: Role;
    newRole: Role;
  };
  'reops.admin.audit_query_run': {
    actorFilter?: string;
    eventTypeFilter?: string;
    resultsCount: number;
  };
  'reops.admin.audit_export_requested': {
    format: 'csv' | 'json';
    includePII: boolean;
  };
  'reops.admin.pii_view_toggled': {
    userId: string;
    caseId: string;
    shown: boolean;
  };

  // Knowledge Management events (§15)
  'reops.km.article_viewed': {
    articleId: string;
    viewerId: string | null;
    source: 'search' | 'link' | 'ai_citation';
  };
  'reops.km.article_helpful': {
    articleId: string;
    helpful: boolean;
  };
  'reops.km.search_performed': {
    query: string;
    resultsCount: number;
    locale: Locale;
  };
  'reops.km.article_created': {
    articleId: string;
    authorId: string;
    categoryId: string;
  };
  'reops.km.article_published': {
    articleId: string;
    locale: Locale;
  };

  // AI events (§17)
  'reops.ai.schema_validated': {
    modelId: string;
    task: 'classify' | 'route' | 'draft' | 'rewrite' | 'extract';
    schemaName: string;
    ok: boolean;
    ms: number;
  };
  'reops.ai.retry_invoked': {
    modelId: string;
    task: string;
    attemptNumber: number;
    reason: string;
    ms: number;
  };
  'reops.ai.citation_added': {
    modelId: string;
    caseId: string;
    articleId: string;
    citationCount: number;
  };
  'reops.ai.citation_broken': {
    articleId: string;
    url: string;
    caseId: string;
  };
  'reops.ai.fallback_model': {
    primaryModel: string;
    fallbackModel: string;
    reason: string;
  };
  'reops.ai.toxicity_detected': {
    messageId: string;
    score: number;
    action: 'refuse' | 'escalate';
  };
  'reops.ai.kb_match_found': {
    caseId: string;
    articleIds: string[];
    matchScore: number;
  };
  'reops.ai.no_kb_match': {
    caseId: string;
    intent: string;
    flagged: boolean;
  };
  'reops.ai.eval_run_complete': {
    evalRunId: string;
    passed: number;
    failed: number;
    metrics: Record<string, any>;
  };

  // Audit events
  'reops.audit.event_logged': {
    eventType: string;
    actorId: string;
    entityType: string;
    entityId: string;
  };
  'reops.audit.retention_policy_applied': {
    deletedCount: number;
    retentionDays: number;
  };
};

// Type-safe telemetry tracker
export interface TelemetryTracker {
  track<K extends keyof TelemetryEventMap>(
    eventName: K,
    properties: TelemetryEventMap[K]
  ): void;
}
```

---

### 18.5 AI Schemas

```typescript
import { z } from 'zod';

// Re-export Zod schemas from §17
export {
  ClassificationResultSchema,
  RoutingDecisionSchema,
  DraftReplySchema,
  CitationSchema,
  PolicyCheckResultSchema,
  ExtractionResultSchema
} from './ai-schemas'; // §17.2

// Type-safe parse helper
export interface ParseResult<T> {
  success: boolean;
  data?: T;
  error?: z.ZodError;
}

export function parseSafe<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ParseResult<T> {
  const result = schema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data
    };
  }

  return {
    success: false,
    error: result.error
  };
}

// Example usage:
// const result = parseSafe(ClassificationResultSchema, unknownData);
// if (result.success) {
//   console.log(result.data.intent);
// } else {
//   console.error(result.error.flatten());
// }
```

---

### 18.6 i18n Keyspace

```typescript
// Complete i18n key union (EN/AR §11, §15, §17)
export type I18nKey =
  // Common
  | 'common.save'
  | 'common.cancel'
  | 'common.delete'
  | 'common.edit'
  | 'common.search'
  | 'common.loading'
  | 'common.error'
  | 'common.success'

  // Inbox (§9)
  | 'inbox.title'
  | 'inbox.newCase'
  | 'inbox.myQueue'
  | 'inbox.allCases'
  | 'inbox.filters.department'
  | 'inbox.filters.priority'
  | 'inbox.filters.status'
  | 'inbox.case.assign'
  | 'inbox.case.resolve'
  | 'inbox.case.close'

  // Case detail (§10)
  | 'case.title'
  | 'case.student'
  | 'case.priority'
  | 'case.status'
  | 'case.sla.deadline'
  | 'case.sla.risk'
  | 'case.reply.placeholder'
  | 'case.reply.send'
  | 'case.internalNote'
  | 'case.history.title'

  // Manager (§11, §12)
  | 'manager.dashboard.title'
  | 'manager.team.performance'
  | 'manager.reports.export'
  | 'manager.sla.configure'
  | 'manager.queue.manage'

  // Admin (§16)
  | 'admin.users.title'
  | 'admin.users.create'
  | 'admin.audit.title'
  | 'admin.audit.filter.actor'
  | 'admin.audit.export.csv'
  | 'admin.pii.show'

  // Knowledge Base (§15)
  | 'kb.title'
  | 'kb.search.placeholder'
  | 'kb.article.helpful'
  | 'kb.article.create'
  | 'kb.category.title'

  // AI (§17)
  | 'ai.banner.refusal'
  | 'ai.citation.label'
  | 'ai.citation.missing'
  | 'ai.retry.toast'
  | 'ai.draft.requiresReview'
  | 'ai.toxicity.warning'
  | 'ai.fallback.macro'
  | 'ai.pii.redacted'
  | 'ai.reasoning.viewTrace'
  | 'ai.kb.seedPrompt'
  | 'ai.model.timeout';

// Translation map structure
export type TranslationMap = Record<I18nKey, string>;

// Build-time validation: ensure all keys exist in both EN and AR
export function validateTranslations(
  en: Partial<TranslationMap>,
  ar: Partial<TranslationMap>
): { missingEN: I18nKey[]; missingAR: I18nKey[] } {
  const allKeys: I18nKey[] = [
    'common.save', 'common.cancel', 'common.delete', /* ... all keys */
  ];

  const missingEN = allKeys.filter(key => !(key in en));
  const missingAR = allKeys.filter(key => !(key in ar));

  return { missingEN, missingAR };
}

// Type-safe translation function
export function t(key: I18nKey, locale: Locale, vars?: Record<string, string>): string {
  // Implementation in §11
  return '';
}
```

---

### 18.7 Versioning

```typescript
// Type schema version (semantic versioning)
export const TYPE_VERSION = '1.0.0' as const;

// Example: deprecated enum value with JSDoc tag
export enum LegacyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',

  /**
   * @deprecated Use CaseStatus.CLOSED instead. Will be removed in v2.0.0
   */
  ARCHIVED = 'archived'
}

// Breaking change guard
export type TypeVersionGuard = typeof TYPE_VERSION extends '1.0.0'
  ? true
  : 'Type definitions version mismatch - update imports';

// Runtime version check
export function assertTypeVersion(expected: string): void {
  if (TYPE_VERSION !== expected) {
    throw new Error(
      `Type version mismatch: expected ${expected}, got ${TYPE_VERSION}`
    );
  }
}
```

---

### 18.8 Acceptance Criteria

- [ ] All enums (Department, Role, CaseStatus, Priority, Channel, Locale, SLARisk) match §4 database schema
- [ ] Core types (User, Case, Message, Article, etc.) use `readonly` for stable fields
- [ ] StudentProfile.studentId pattern validated in application layer (S\d{4}-\d{4})
- [ ] ApiResponse<T> generic wrapper supports typed data payload
- [ ] Paginated<T> includes total, page, pageSize, hasMore fields
- [ ] IdempotencyKey branded type prevents accidental string usage
- [ ] TelemetryEventMap includes typed events for all modules (inbox, manager, admin, km, ai, audit)
- [ ] TelemetryTracker.track() enforces type-safe event name + properties matching
- [ ] parseSafe<T>() returns ParseResult with success flag + data/error union
- [ ] I18nKey union includes keys from §9, §10, §11, §15, §16, §17
- [ ] validateTranslations() build-time check detects missing EN/AR keys
- [ ] TYPE_VERSION constant set to '1.0.0'
- [ ] @deprecated JSDoc tag example shown on LegacyStatus.ARCHIVED with removal version
- [ ] All core types align with Supabase table schemas from §4 (no drift)

---

END §18

---

## 19. API Contracts (Stub)

### 19.1 Conventions

**Headers**:
```http
Idempotency-Key: idem_1698765432_abc123def
Accept: application/json
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
X-Request-ID: req_xyz789  # auto-generated if missing
```

**Pagination** (query params):
```
?page=1&perPage=25
```

**Sort** (query params):
```
?sort=createdAt:desc,priority:asc
```

**Standard Error Shape**:
```json
{
  "code": "VALIDATION_ERROR",
  "message": "Invalid case status transition",
  "details": {
    "field": "status",
    "currentValue": "resolved",
    "attemptedValue": "open",
    "constraint": "Cannot reopen resolved case without manager approval"
  },
  "timestamp": "2024-10-20T14:32:18Z"
}
```

**HTTP Status Codes**:
- `200 OK`: Successful GET/PATCH
- `201 Created`: Successful POST
- `204 No Content`: Successful DELETE
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Missing/invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: State conflict (e.g., invalid transition)
- `422 Unprocessable Entity`: Schema validation failed
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

### 19.2 Cases

#### **GET /api/cases**

Query params: `page`, `perPage`, `sort`, `status`, `department`, `assigneeId`, `priority`, `search`

**Request**:
```http
GET /api/cases?page=1&perPage=25&status=open&department=finance&sort=slaDeadline:asc
```

**Response (200 OK)**:
```json
{
  "data": {
    "items": [
      {
        "id": "case_abc123",
        "subject": "Tuition payment inquiry",
        "status": "open",
        "priority": "high",
        "channel": "email",
        "studentId": "S2024-3456",
        "assigneeId": "agent_finance_002",
        "department": "finance",
        "tags": ["payment", "tuition"],
        "slaDeadline": "2024-10-21T16:00:00Z",
        "slaRisk": "at_risk",
        "createdAt": "2024-10-20T10:15:00Z",
        "updatedAt": "2024-10-20T14:30:00Z",
        "resolvedAt": null,
        "closedAt": null
      }
    ],
    "total": 142,
    "page": 1,
    "pageSize": 25,
    "hasMore": true
  },
  "meta": {
    "requestId": "req_xyz789",
    "latencyMs": 45
  }
}
```

---

#### **POST /api/cases**

**Request**:
```json
{
  "subject": "Need transcript urgently",
  "channel": "webchat",
  "studentId": "S2024-7890",
  "department": "registrar",
  "priority": "high",
  "initialMessage": "I need my transcript for visa application by Friday.",
  "tags": ["transcript", "urgent"]
}
```

**Response (201 Created)**:
```json
{
  "data": {
    "id": "case_def456",
    "subject": "Need transcript urgently",
    "status": "open",
    "priority": "high",
    "channel": "webchat",
    "studentId": "S2024-7890",
    "assigneeId": null,
    "department": "registrar",
    "tags": ["transcript", "urgent"],
    "slaDeadline": "2024-10-22T16:00:00Z",
    "slaRisk": "on_track",
    "createdAt": "2024-10-20T14:45:00Z",
    "updatedAt": "2024-10-20T14:45:00Z",
    "resolvedAt": null,
    "closedAt": null
  },
  "meta": {
    "requestId": "req_abc123",
    "latencyMs": 120
  }
}
```

---

#### **GET /api/cases/:id**

**Response (200 OK)**:
```json
{
  "data": {
    "id": "case_abc123",
    "subject": "Tuition payment inquiry",
    "status": "open",
    "priority": "high",
    "channel": "email",
    "studentId": "S2024-3456",
    "student": {
      "id": "student_123",
      "studentId": "S2024-3456",
      "name": "Ahmed Hassan",
      "email": "ahmed.hassan@example.com",
      "enrollmentStatus": "active"
    },
    "assigneeId": "agent_finance_002",
    "assignee": {
      "id": "agent_finance_002",
      "name": "Sara Al-Mansoori",
      "email": "sara@reops.example",
      "department": "finance"
    },
    "department": "finance",
    "tags": ["payment", "tuition"],
    "slaDeadline": "2024-10-21T16:00:00Z",
    "slaRisk": "at_risk",
    "messages": [
      {
        "id": "msg_001",
        "caseId": "case_abc123",
        "senderId": null,
        "senderType": "student",
        "body": "Can I pay my tuition in installments?",
        "attachments": [],
        "isInternal": false,
        "createdAt": "2024-10-20T10:15:00Z"
      }
    ],
    "createdAt": "2024-10-20T10:15:00Z",
    "updatedAt": "2024-10-20T14:30:00Z",
    "resolvedAt": null,
    "closedAt": null
  }
}
```

---

#### **PATCH /api/cases/:id**

**Valid Transition Example (200 OK)**:
```json
// Request
{
  "status": "resolved",
  "resolutionNote": "Provided installment plan information and form link."
}

// Response
{
  "data": {
    "id": "case_abc123",
    "status": "resolved",
    "resolvedAt": "2024-10-20T15:00:00Z",
    "updatedAt": "2024-10-20T15:00:00Z"
  }
}
```

**Invalid Transition Example (400 Bad Request)**:
```json
// Request
{
  "status": "spam"
}

// Response
{
  "code": "VALIDATION_ERROR",
  "message": "Cannot mark assigned case as spam",
  "details": {
    "field": "status",
    "constraint": "Only unassigned cases can be marked as spam"
  },
  "timestamp": "2024-10-20T15:05:00Z"
}
```

**State Conflict Example (409 Conflict)**:
```json
// Request (attempting to reopen resolved case)
{
  "status": "open"
}

// Response
{
  "code": "STATE_CONFLICT",
  "message": "Cannot transition from 'resolved' to 'open'",
  "details": {
    "currentStatus": "resolved",
    "attemptedStatus": "open",
    "allowedTransitions": ["closed"],
    "managerOverride": "required"
  },
  "timestamp": "2024-10-20T15:10:00Z"
}
```

---

#### **POST /api/cases/:id/merge**

Merge multiple cases into parent case.

**Request**:
```json
{
  "childIds": ["case_def456", "case_ghi789"],
  "mergeReason": "Duplicate inquiries from same student about transcript request"
}
```

**Response (200 OK)**:
```json
{
  "data": {
    "parentId": "case_abc123",
    "mergedIds": ["case_def456", "case_ghi789"],
    "undoToken": "undo_merge_xyz123",
    "mergedAt": "2024-10-20T15:20:00Z"
  }
}
```

**Conflict Example (409 Conflict)**:
```json
{
  "code": "MERGE_CONFLICT",
  "message": "Cannot merge cases from different departments",
  "details": {
    "parentDepartment": "registrar",
    "conflictingCases": {
      "case_def456": "finance"
    }
  },
  "timestamp": "2024-10-20T15:22:00Z"
}
```

---

#### **POST /api/cases/:id/split**

Split messages from a case into new case.

**Request**:
```json
{
  "messageIds": ["msg_005", "msg_006", "msg_007"],
  "newSubject": "Payment plan inquiry (split from original case)",
  "department": "finance",
  "reason": "Student raised separate payment question in transcript thread"
}
```

**Response (201 Created)**:
```json
{
  "data": {
    "originalCaseId": "case_abc123",
    "newCaseId": "case_jkl012",
    "movedMessageIds": ["msg_005", "msg_006", "msg_007"],
    "splitAt": "2024-10-20T15:30:00Z"
  }
}
```

---

### 19.3 Manager

#### **GET /api/manager/overview**

Department-level overview (§11, §12).

**Request**:
```http
GET /api/manager/overview?department=finance
```

**Response (200 OK)**:
```json
{
  "data": {
    "department": "finance",
    "metrics": {
      "openCases": 42,
      "casesAtRisk": 8,
      "casesBreached": 2,
      "avgResolutionTimeHours": 18.5,
      "slaComplianceRate": 0.94
    },
    "agentPerformance": [
      {
        "agentId": "agent_finance_002",
        "name": "Sara Al-Mansoori",
        "assignedCases": 12,
        "resolvedToday": 5,
        "avgResponseTimeMinutes": 24,
        "slaCompliance": 0.96
      }
    ],
    "queueStats": [
      {
        "queueId": "queue_finance_001",
        "name": "Finance - High Priority",
        "pending": 8,
        "slaRiskDistribution": {
          "on_track": 5,
          "at_risk": 2,
          "breached": 1
        }
      }
    ]
  }
}
```

---

#### **POST /api/queues/rebalance**

Rebalance case assignments across agents (idempotent).

**Request**:
```json
{
  "queueId": "queue_finance_001",
  "strategy": "load_balanced"
}
```

**Response (200 OK)**:
```json
{
  "data": {
    "queueId": "queue_finance_001",
    "reassignedCount": 6,
    "assignments": [
      {
        "caseId": "case_abc123",
        "fromAgentId": "agent_finance_001",
        "toAgentId": "agent_finance_002"
      }
    ],
    "balancedAt": "2024-10-20T16:00:00Z"
  }
}
```

**Conflict Example (409 Conflict)** - queue already rebalancing:
```json
{
  "code": "REBALANCE_IN_PROGRESS",
  "message": "Queue rebalance already in progress",
  "details": {
    "queueId": "queue_finance_001",
    "startedAt": "2024-10-20T15:58:00Z",
    "estimatedCompletionSec": 45
  },
  "timestamp": "2024-10-20T16:00:30Z"
}
```

---

### 19.4 Admin

#### **GET /api/admin/users**

List users (§16).

**Response (200 OK)**:
```json
{
  "data": {
    "items": [
      {
        "id": "user_001",
        "email": "sara@reops.example",
        "name": "Sara Al-Mansoori",
        "role": "agent",
        "department": "finance",
        "locale": "en",
        "createdAt": "2024-09-01T10:00:00Z"
      }
    ],
    "total": 24,
    "page": 1,
    "pageSize": 25,
    "hasMore": false
  }
}
```

---

#### **POST /api/admin/users**

Create user.

**Request**:
```json
{
  "email": "ahmed@reops.example",
  "name": "Ahmed Ibrahim",
  "role": "agent",
  "department": "registrar",
  "locale": "ar"
}
```

**Response (201 Created)**:
```json
{
  "data": {
    "id": "user_025",
    "email": "ahmed@reops.example",
    "name": "Ahmed Ibrahim",
    "role": "agent",
    "department": "registrar",
    "locale": "ar",
    "createdAt": "2024-10-20T16:15:00Z"
  }
}
```

---

#### **POST /api/admin/forms**

Create custom form schema (§13).

**Request**:
```json
{
  "name": "Finance - Scholarship Application",
  "department": "finance",
  "fields": [
    {
      "label": "GPA",
      "type": "number",
      "required": true,
      "validation": {"min": 0, "max": 4.0}
    },
    {
      "label": "Scholarship Type",
      "type": "select",
      "required": true,
      "options": ["Merit", "Need-Based", "Athletic"]
    }
  ]
}
```

**Response (201 Created)**:
```json
{
  "data": {
    "id": "form_001",
    "name": "Finance - Scholarship Application",
    "department": "finance",
    "isActive": true,
    "createdAt": "2024-10-20T16:20:00Z"
  }
}
```

---

#### **POST /api/admin/workflows**

Create automation workflow (§14).

**Request**:
```json
{
  "name": "Auto-assign urgent Finance cases",
  "trigger": {
    "type": "case_created",
    "filters": {"department": "finance", "priority": "urgent"}
  },
  "conditions": [
    {"field": "assigneeId", "operator": "equals", "value": null}
  ],
  "actions": [
    {"type": "assign", "params": {"queueId": "queue_finance_urgent"}}
  ],
  "isActive": true
}
```

**Response (201 Created)**:
```json
{
  "data": {
    "id": "workflow_001",
    "name": "Auto-assign urgent Finance cases",
    "isActive": true,
    "createdAt": "2024-10-20T16:25:00Z"
  }
}
```

---

#### **POST /api/admin/workflows/:id/dry-run**

Test workflow without executing actions.

**Request**:
```json
{
  "testCase": {
    "department": "finance",
    "priority": "urgent",
    "assigneeId": null
  }
}
```

**Response (200 OK)**:
```json
{
  "data": {
    "matched": true,
    "triggeredActions": [
      {
        "type": "assign",
        "params": {"queueId": "queue_finance_urgent"},
        "wouldExecute": true
      }
    ]
  }
}
```

---

#### **GET /api/admin/integrations**

List webhook integrations (§6).

**Response (200 OK)**:
```json
{
  "data": [
    {
      "id": "int_001",
      "name": "WhatsApp Business",
      "type": "whatsapp",
      "status": "active",
      "lastSyncAt": "2024-10-20T16:00:00Z"
    }
  ]
}
```

---

#### **PATCH /api/admin/branding**

Update tenant branding (§8).

**Request**:
```json
{
  "primaryColor": "#1E40AF",
  "logoUrl": "https://cdn.reops.example/logo.png"
}
```

**Response (200 OK)**:
```json
{
  "data": {
    "primaryColor": "#1E40AF",
    "logoUrl": "https://cdn.reops.example/logo.png",
    "updatedAt": "2024-10-20T16:30:00Z"
  }
}
```

---

### 19.5 Knowledge Management

#### **GET /api/km/articles**

**Request**:
```http
GET /api/km/articles?status=published&locale=en&page=1&perPage=25
```

**Response (200 OK)**:
```json
{
  "data": {
    "items": [
      {
        "id": "article_001",
        "title": "Tuition Payment Policies",
        "slug": "tuition-payment-policies",
        "categoryId": "cat_finance",
        "status": "published",
        "locale": "en",
        "viewCount": 342,
        "helpfulCount": 298,
        "tags": ["payment", "tuition", "policies"],
        "publishedAt": "2024-09-15T10:00:00Z",
        "createdAt": "2024-09-10T14:00:00Z"
      }
    ],
    "total": 48,
    "page": 1,
    "pageSize": 25,
    "hasMore": true
  }
}
```

---

#### **POST /api/km/articles**

**Request**:
```json
{
  "title": "Transcript Request Process",
  "categoryId": "cat_registrar",
  "content": "# Transcript Requests\n\nOfficial transcripts...",
  "locale": "en",
  "tags": ["transcript", "registrar", "documents"],
  "status": "draft"
}
```

**Response (201 Created)**:
```json
{
  "data": {
    "id": "article_049",
    "title": "Transcript Request Process",
    "slug": "transcript-request-process",
    "status": "draft",
    "createdAt": "2024-10-20T16:40:00Z"
  }
}
```

---

#### **POST /api/km/articles/:id/review**

Submit for manager review (§15).

**Request**:
```json
{
  "action": "submit_for_review",
  "reviewNote": "Ready for publication"
}
```

**Response (200 OK)**:
```json
{
  "data": {
    "id": "article_049",
    "status": "pending_review",
    "reviewSubmittedAt": "2024-10-20T16:45:00Z"
  }
}
```

---

#### **GET /api/km/search**

Search articles with relevance scoring.

**Request**:
```http
GET /api/km/search?q=payment+installment&locale=en
```

**Response (200 OK)**:
```json
{
  "data": {
    "items": [
      {
        "id": "article_001",
        "title": "Tuition Payment Policies",
        "slug": "tuition-payment-policies",
        "excerpt": "...students may request 3-month installment plans...",
        "relevanceScore": 0.94,
        "matchedFields": ["title", "content"],
        "categoryId": "cat_finance"
      }
    ],
    "total": 3,
    "query": "payment installment",
    "locale": "en"
  }
}
```

---

### 19.6 AI

#### **POST /api/ai/classify**

Classify student message (§17).

**Request**:
```json
{
  "messageBody": "I need my transcript ASAP for visa application",
  "messageId": "msg_abc123",
  "studentId": "S2024-5678"
}
```

**Response (200 OK)**:
```json
{
  "data": {
    "classification": {
      "intent": "registrar_transcript",
      "confidence": 0.95,
      "reasoning": "Student requesting transcript with urgency (ASAP) for visa.",
      "urgency": "high",
      "sentiment": "neutral",
      "language": "en",
      "suggestedTags": ["transcript", "urgent", "visa"]
    },
    "modelUsed": "gpt-4o-mini",
    "latencyMs": 1120
  }
}
```

**Schema Error (422 Unprocessable Entity)**:
```json
{
  "code": "SCHEMA_MISMATCH",
  "message": "AI output failed schema validation",
  "details": {
    "schemaName": "ClassificationResult",
    "errors": [
      {
        "path": ["intent"],
        "message": "Invalid enum value. Expected 'admissions_inquiry' | 'finance_payment' | ..., received 'unknown_category'"
      }
    ],
    "retryHint": "Model will retry with repair prompt"
  },
  "timestamp": "2024-10-20T17:00:00Z"
}
```

---

#### **POST /api/ai/draft**

Generate draft reply (§17).

**Request**:
```json
{
  "caseId": "case_xyz789",
  "studentName": "Fatima Al-Mansoori",
  "inquiry": "I need my transcript urgently for my visa application.",
  "intent": "registrar_transcript",
  "tone": "warm",
  "language": "en"
}
```

**Response (200 OK)**:
```json
{
  "data": {
    "draft": {
      "body": "Hello Fatima,\n\nThank you for reaching out...",
      "tone": "warm",
      "language": "en",
      "citations": [
        {
          "articleId": "KB-REG-008",
          "title": "Transcript Request Process",
          "section": "Urgent Requests",
          "url": "https://kb.reops.example/registrar/transcripts#urgent"
        }
      ],
      "nextSteps": ["Submit request via Student Portal"],
      "requiresManagerReview": false
    },
    "modelUsed": "claude-3.5-sonnet",
    "latencyMs": 2340
  }
}
```

**No KB Match (404 Not Found)**:
```json
{
  "code": "NO_KB_MATCH",
  "message": "No knowledge base articles found for this query",
  "details": {
    "intent": "registrar_transcript",
    "flagged": true,
    "action": "Draft flagged for manager review. Consider creating KB article."
  },
  "timestamp": "2024-10-20T17:05:00Z"
}
```

---

#### **POST /api/ai/extract**

Extract structured data (§17).

**Request**:
```json
{
  "messageBody": "My invoice INV-2024-09-1523 shows $1,250 due Oct 15. Student ID S2024-3456.",
  "messageId": "msg_def456"
}
```

**Response (200 OK)**:
```json
{
  "data": {
    "extraction": {
      "amountUSD": 1250.00,
      "studentId": "S2024-3456",
      "invoiceId": "INV-2024-09-1523",
      "courseCode": null,
      "dueDateISO": "2024-10-15T23:59:59Z",
      "confidence": 0.97,
      "extractedFields": {}
    },
    "modelUsed": "gpt-4o-mini",
    "latencyMs": 890
  }
}
```

---

### 19.7 Global Search

#### **GET /api/search**

Search across cases, students, articles.

**Request**:
```http
GET /api/search?q=Ahmed+Hassan+transcript&scope=cases,students,articles
```

**Response (200 OK)**:
```json
{
  "data": {
    "cases": [
      {
        "id": "case_abc123",
        "subject": "Transcript request - Ahmed Hassan",
        "type": "case",
        "relevanceScore": 0.92,
        "department": "registrar"
      }
    ],
    "students": [
      {
        "id": "student_123",
        "studentId": "S2024-3456",
        "name": "Ahmed Hassan",
        "type": "student",
        "relevanceScore": 0.98
      }
    ],
    "articles": [
      {
        "id": "article_049",
        "title": "Transcript Request Process",
        "type": "article",
        "relevanceScore": 0.85
      }
    ],
    "total": 3,
    "query": "Ahmed Hassan transcript"
  }
}
```

---

### 19.8 Export

#### **POST /api/export**

Initiate export job.

**Request**:
```json
{
  "type": "cases",
  "format": "csv",
  "filters": {
    "department": "finance",
    "dateRange": {
      "start": "2024-10-01T00:00:00Z",
      "end": "2024-10-20T23:59:59Z"
    }
  },
  "includePII": false
}
```

**Response (202 Accepted)**:
```json
{
  "data": {
    "jobId": "export_job_001",
    "status": "processing",
    "estimatedCompletionSec": 30,
    "createdAt": "2024-10-20T17:15:00Z"
  }
}
```

---

#### **GET /api/export/:id**

Check export job status.

**Response (200 OK)** - processing:
```json
{
  "data": {
    "jobId": "export_job_001",
    "status": "processing",
    "progress": 0.65,
    "createdAt": "2024-10-20T17:15:00Z"
  }
}
```

**Response (200 OK)** - ready:
```json
{
  "data": {
    "jobId": "export_job_001",
    "status": "completed",
    "downloadUrl": "https://cdn.reops.example/exports/export_job_001.csv",
    "expiresAt": "2024-10-21T17:15:00Z",
    "fileSizeBytes": 245678,
    "recordCount": 142,
    "createdAt": "2024-10-20T17:15:00Z",
    "completedAt": "2024-10-20T17:15:35Z"
  }
}
```

---

### 19.9 SSE (Server-Sent Events)

#### **GET /api/streams/queues** (stub)

Real-time queue statistics (§5, §12).

**Stream Format**:
```
event: queue_stats
data: {"queueId":"queue_finance_001","pending":8,"slaRiskDistribution":{"on_track":5,"at_risk":2,"breached":1},"timestamp":"2024-10-20T17:20:00Z"}

event: queue_stats
data: {"queueId":"queue_finance_001","pending":7,"slaRiskDistribution":{"on_track":5,"at_risk":2,"breached":0},"timestamp":"2024-10-20T17:20:30Z"}
```

---

#### **GET /api/streams/case/:id** (stub)

Real-time case timeline events.

**Stream Format**:
```
event: case_updated
data: {"caseId":"case_abc123","field":"status","oldValue":"open","newValue":"resolved","actorId":"agent_finance_002","timestamp":"2024-10-20T17:25:00Z"}

event: message_received
data: {"caseId":"case_abc123","messageId":"msg_010","senderType":"student","timestamp":"2024-10-20T17:26:00Z"}

event: sla_risk_changed
data: {"caseId":"case_abc123","oldRisk":"at_risk","newRisk":"breached","timestamp":"2024-10-20T17:27:00Z"}
```

---

### 19.10 Acceptance Criteria

- [ ] All endpoints include `Idempotency-Key` header support for POST/PUT/PATCH
- [ ] Pagination uses `page` and `perPage` query params; responses include `hasMore` flag
- [ ] Sort query param accepts `field:direction` format (e.g., `createdAt:desc`)
- [ ] Standard error shape includes `code`, `message`, `details`, `timestamp`
- [ ] GET /api/cases returns paginated list with filters (status, department, priority, assigneeId)
- [ ] POST /api/cases creates case and returns 201 with full case object
- [ ] PATCH /api/cases/:id validates state transitions; returns 400 for invalid, 409 for conflict
- [ ] POST /api/cases/:id/merge returns `undoToken` and validates department match
- [ ] POST /api/cases/:id/split creates new case from message range
- [ ] GET /api/manager/overview returns department metrics + agent performance
- [ ] POST /api/queues/rebalance is idempotent; returns 409 if already in progress
- [ ] POST /api/admin/workflows/:id/dry-run tests workflow without execution
- [ ] GET /api/km/search returns relevance scores and matched fields
- [ ] POST /api/ai/classify returns 422 SCHEMA_MISMATCH with retry hint on validation failure
- [ ] POST /api/ai/draft returns 404 NO_KB_MATCH if no citations found
- [ ] GET /api/search supports multi-scope search (cases, students, articles)
- [ ] POST /api/export returns 202 with jobId; GET /api/export/:id polls status
- [ ] Export downloadUrl includes expiration timestamp (24h)
- [ ] SSE /api/streams/queues emits queue_stats events with slaRiskDistribution
- [ ] SSE /api/streams/case/:id emits case_updated, message_received, sla_risk_changed events
- [ ] All responses include `meta.requestId` and `meta.latencyMs`
- [ ] All timestamps use ISO 8601 format with timezone

---

END §19

---

## 20. MSW Handlers & Seeding

### 20.1 Determinism

**Constants**:
```typescript
const SEED = 20251030;
const NOW = new Date('2025-01-30T12:00:00Z');
```

**PRNG Helpers**:
```typescript
// Seeded random number generator (mulberry32)
function prng(seed: number): () => number {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const random = prng(SEED);

// Weighted random selection
function weighted<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((sum, w) => sum + w, 0);
  let r = random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

// Random pick from array
function pick<T>(arr: T[]): T {
  return arr[Math.floor(random() * arr.length)];
}
```

---

### 20.2 Seed Plan

**Total Counts** (aligned with §9.10):
- **Cases**: 2,000
- **Users**: 50 (10 Managers, 5 Admins, 35 Agents)
- **Students**: 500
- **Articles**: 100 (80 published, 15 draft, 5 pending_review)
- **Queues**: 12
- **Workflows**: 8
- **Audit Events**: 10,000

**Case Distribution**:

| Department       | Count | % Total |
|------------------|-------|---------|
| Finance          | 600   | 30%     |
| Admissions       | 500   | 25%     |
| Registrar        | 500   | 25%     |
| IT Support       | 200   | 10%     |
| Student Affairs  | 150   | 7.5%    |
| General          | 50    | 2.5%    |

**Priority Distribution**:
- Low: 40% (800 cases)
- Medium: 35% (700 cases)
- High: 20% (400 cases)
- Urgent: 5% (100 cases)

**Status Distribution**:
- Open: 35% (700 cases)
- Pending: 20% (400 cases)
- Resolved: 30% (600 cases)
- Closed: 14% (280 cases)
- Spam: 1% (20 cases)

**SLA Distribution**:
- On Track: 70% (1,400 cases)
- At Risk: 20% (400 cases)
- Breached: 10% (200 cases)

**Channel Distribution**:
- Email: 50% (1,000 cases)
- WhatsApp: 25% (500 cases)
- Webchat: 15% (300 cases)
- Student Portal: 10% (200 cases)

**Temporal Distribution**:
- August 2024: +40% volume (280 cases)
- January 2025: +35% volume (540 cases)
- Other months: baseline

**Special Cases**:
- Duplicates: 50 cases (2.5%) marked as potential duplicates
- Breached SLA: 200 cases with resolvedAt > slaDeadline
- Long threads: 100 cases with 10+ messages
- Merged: 30 parent cases with 2-3 merged children

---

### 20.3 Generators

**Function Signatures** (implementation in mock layer):

```typescript
// Users & Agents
function generateUser(id: number, role: Role, department?: Department): User;
function generateAgent(id: number, department: Department, skills: string[]): User & {
  skills: string[];
  activeLoad: number;
  avgResponseTimeMinutes: number;
};

// Students
function generateStudent(id: number): StudentProfile & {
  accountBalance: number;
  holds: string[];
  enrollmentYear: number;
};

// Cases
function generateCase(
  id: number,
  opts: {
    department: Department;
    priority: Priority;
    status: CaseStatus;
    createdAt: Date;
    assigneeId?: string;
  }
): Case;

function generateCaseThread(caseId: string, messageCount: number): Message[];
function generateCaseTimeline(caseId: string): TimelineEvent[];

// Articles
function generateArticle(id: number, locale: Locale, status: 'draft' | 'published' | 'archived'): Article;
function generateArticleVersion(articleId: string, versionNumber: number): {
  id: string;
  articleId: string;
  content: string;
  authorId: string;
  createdAt: string;
};

// Forms
function generateFormSchema(id: number, department: Department): FormSchema;

// Workflows
function generateWorkflow(id: number, department: Department): Workflow;

// Audit Events
function generateAuditEvent(
  id: number,
  eventType: string,
  actorId: string,
  entityType: string,
  entityId: string,
  timestamp: Date
): AuditEvent;
```

---

### 20.4 MSW Handlers

**Handler Structure** (parity with §19):

```typescript
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Inbox & Cases (§19.2)
  http.get('/api/cases', handleGetCases),
  http.post('/api/cases', handleCreateCase),
  http.get('/api/cases/:id', handleGetCase),
  http.patch('/api/cases/:id', handleUpdateCase),
  http.post('/api/cases/:id/merge', handleMergeCases),
  http.post('/api/cases/:id/split', handleSplitCase),

  // Manager (§19.3)
  http.get('/api/manager/overview', handleManagerOverview),
  http.post('/api/queues/rebalance', handleRebalanceQueue),

  // Admin (§19.4)
  http.get('/api/admin/users', handleGetUsers),
  http.post('/api/admin/users', handleCreateUser),
  http.post('/api/admin/forms', handleCreateForm),
  http.post('/api/admin/workflows', handleCreateWorkflow),
  http.post('/api/admin/workflows/:id/dry-run', handleWorkflowDryRun),
  http.get('/api/admin/integrations', handleGetIntegrations),
  http.patch('/api/admin/branding', handleUpdateBranding),

  // Knowledge Management (§19.5)
  http.get('/api/km/articles', handleGetArticles),
  http.post('/api/km/articles', handleCreateArticle),
  http.post('/api/km/articles/:id/review', handleReviewArticle),
  http.get('/api/km/search', handleSearchArticles),

  // AI (§19.6)
  http.post('/api/ai/classify', handleAIClassify),
  http.post('/api/ai/draft', handleAIDraft),
  http.post('/api/ai/extract', handleAIExtract),

  // Global Search (§19.7)
  http.get('/api/search', handleGlobalSearch),

  // Export (§19.8)
  http.post('/api/export', handleCreateExport),
  http.get('/api/export/:id', handleGetExport),

  // SSE (§19.9)
  http.get('/api/streams/queues', handleQueueStream),
  http.get('/api/streams/case/:id', handleCaseStream),
];
```

**Example Handler** (GET /api/cases with filters):

```typescript
function handleGetCases({ request }: { request: Request }) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const perPage = parseInt(url.searchParams.get('perPage') || '25');
  const status = url.searchParams.get('status');
  const department = url.searchParams.get('department');
  const priority = url.searchParams.get('priority');
  const assigneeId = url.searchParams.get('assigneeId');
  const search = url.searchParams.get('search');
  const sort = url.searchParams.get('sort') || 'createdAt:desc';

  // Apply error injection if enabled
  if (shouldInjectError('/api/cases')) {
    return HttpResponse.json(
      { code: 'INTERNAL_ERROR', message: 'Simulated server error' },
      { status: 500 }
    );
  }

  // Filter cases
  let filtered = [...mockCases];
  if (status) filtered = filtered.filter(c => c.status === status);
  if (department) filtered = filtered.filter(c => c.department === department);
  if (priority) filtered = filtered.filter(c => c.priority === priority);
  if (assigneeId) filtered = filtered.filter(c => c.assigneeId === assigneeId);
  if (search) {
    const lower = search.toLowerCase();
    filtered = filtered.filter(c =>
      c.subject.toLowerCase().includes(lower) ||
      c.tags.some(t => t.toLowerCase().includes(lower))
    );
  }

  // Sort
  const [field, direction] = sort.split(':');
  filtered.sort((a, b) => {
    const aVal = a[field as keyof Case];
    const bVal = b[field as keyof Case];
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return direction === 'desc' ? -cmp : cmp;
  });

  // Paginate
  const start = (page - 1) * perPage;
  const items = filtered.slice(start, start + perPage);

  return HttpResponse.json({
    data: {
      items,
      total: filtered.length,
      page,
      pageSize: perPage,
      hasMore: start + perPage < filtered.length
    },
    meta: {
      requestId: `req_${Date.now()}`,
      latencyMs: Math.floor(random() * 50) + 20
    }
  });
}
```

---

### 20.5 Time Travel

**Override NOW** to recompute SLA risk:

```typescript
let CURRENT_TIME = NOW;

export function setMockTime(newTime: Date) {
  CURRENT_TIME = newTime;
  recomputeSLARisks();
}

function recomputeSLARisks() {
  mockCases.forEach(c => {
    if (!c.slaDeadline) return;

    const deadline = new Date(c.slaDeadline);
    const now = CURRENT_TIME;
    const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (c.status === 'resolved' || c.status === 'closed') {
      // Check if resolved/closed before deadline
      const resolvedAt = new Date(c.resolvedAt || c.closedAt!);
      c.slaRisk = resolvedAt <= deadline ? 'on_track' : 'breached';
    } else {
      // Open/pending cases
      if (hoursUntilDeadline < 0) {
        c.slaRisk = 'breached';
      } else if (hoursUntilDeadline <= 4) {
        c.slaRisk = 'at_risk';
      } else {
        c.slaRisk = 'on_track';
      }
    }
  });
}

// Usage:
// setMockTime(new Date('2025-02-15T12:00:00Z'));
// Cases with deadlines before Feb 15 will now show as breached
```

---

### 20.6 Error Injection

**Toggleable error rates per endpoint**:

```typescript
interface ErrorConfig {
  rate500: number;    // 0.0 to 1.0
  rate429: number;
  timeoutMs?: number; // simulate delay, then timeout
}

const errorInjection: Record<string, ErrorConfig> = {
  '/api/cases': { rate500: 0, rate429: 0 },
  '/api/ai/classify': { rate500: 0.02, rate429: 0.05 },
  '/api/export': { rate500: 0, rate429: 0, timeoutMs: 0 },
};

export function setErrorRate(endpoint: string, config: Partial<ErrorConfig>) {
  errorInjection[endpoint] = { ...errorInjection[endpoint], ...config };
}

function shouldInjectError(endpoint: string): HttpResponse | null {
  const config = errorInjection[endpoint];
  if (!config) return null;

  const r = random();

  if (r < config.rate500) {
    return HttpResponse.json(
      { code: 'INTERNAL_ERROR', message: 'Simulated server error', timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }

  if (r < config.rate500 + config.rate429) {
    return HttpResponse.json(
      { code: 'RATE_LIMITED', message: 'Too many requests', timestamp: new Date().toISOString() },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  if (config.timeoutMs && config.timeoutMs > 0) {
    // MSW doesn't directly support timeout, but we can delay response
    // Implementation would use setTimeout in actual handler
  }

  return null;
}

// Usage:
// setErrorRate('/api/ai/classify', { rate500: 0.1, rate429: 0.05 });
```

---

### 20.7 Fixtures

**First 5 Cases** (preview):
```json
[
  {
    "id": "case_001",
    "subject": "Tuition payment installment request",
    "status": "resolved",
    "priority": "medium",
    "channel": "email",
    "studentId": "S2024-0001",
    "assigneeId": "agent_finance_001",
    "department": "finance",
    "tags": ["payment", "installment"],
    "slaDeadline": "2025-01-28T16:00:00Z",
    "slaRisk": "on_track",
    "createdAt": "2025-01-26T09:15:00Z",
    "updatedAt": "2025-01-27T14:30:00Z",
    "resolvedAt": "2025-01-27T14:30:00Z",
    "closedAt": null
  },
  {
    "id": "case_002",
    "subject": "Transcript request for visa application",
    "status": "open",
    "priority": "high",
    "channel": "student_portal",
    "studentId": "S2024-0012",
    "assigneeId": "agent_registrar_001",
    "department": "registrar",
    "tags": ["transcript", "urgent", "visa"],
    "slaDeadline": "2025-01-31T16:00:00Z",
    "slaRisk": "at_risk",
    "createdAt": "2025-01-29T08:00:00Z",
    "updatedAt": "2025-01-29T08:00:00Z",
    "resolvedAt": null,
    "closedAt": null
  },
  {
    "id": "case_003",
    "subject": "Application status inquiry",
    "status": "pending",
    "priority": "low",
    "channel": "whatsapp",
    "studentId": "S2024-0045",
    "assigneeId": "agent_admissions_002",
    "department": "admissions",
    "tags": ["application", "status"],
    "slaDeadline": "2025-02-02T16:00:00Z",
    "slaRisk": "on_track",
    "createdAt": "2025-01-28T11:20:00Z",
    "updatedAt": "2025-01-29T10:00:00Z",
    "resolvedAt": null,
    "closedAt": null
  },
  {
    "id": "case_004",
    "subject": "Portal login issue",
    "status": "resolved",
    "priority": "urgent",
    "channel": "webchat",
    "studentId": "S2024-0078",
    "assigneeId": "agent_it_001",
    "department": "it_support",
    "tags": ["portal", "login", "access"],
    "slaDeadline": "2025-01-29T13:00:00Z",
    "slaRisk": "on_track",
    "createdAt": "2025-01-29T09:00:00Z",
    "updatedAt": "2025-01-29T11:45:00Z",
    "resolvedAt": "2025-01-29T11:45:00Z",
    "closedAt": null
  },
  {
    "id": "case_005",
    "subject": "Financial aid eligibility question",
    "status": "open",
    "priority": "medium",
    "channel": "email",
    "studentId": "S2024-0099",
    "assigneeId": null,
    "department": "finance",
    "tags": ["financial-aid", "eligibility"],
    "slaDeadline": "2025-01-31T16:00:00Z",
    "slaRisk": "on_track",
    "createdAt": "2025-01-29T14:00:00Z",
    "updatedAt": "2025-01-29T14:00:00Z",
    "resolvedAt": null,
    "closedAt": null
  }
]
```

---

**First 5 Articles** (preview):
```json
[
  {
    "id": "article_001",
    "title": "Tuition Payment Policies",
    "slug": "tuition-payment-policies",
    "content": "# Tuition Payment Policies\n\nStudents must pay tuition by the 15th of each month...",
    "categoryId": "cat_finance",
    "authorId": "user_manager_001",
    "status": "published",
    "locale": "en",
    "viewCount": 542,
    "helpfulCount": 489,
    "tags": ["payment", "tuition", "policies"],
    "createdAt": "2024-09-01T10:00:00Z",
    "updatedAt": "2025-01-15T14:00:00Z",
    "publishedAt": "2024-09-05T10:00:00Z"
  },
  {
    "id": "article_002",
    "title": "Transcript Request Process",
    "slug": "transcript-request-process",
    "content": "# Transcript Requests\n\nOfficial transcripts can be requested through...",
    "categoryId": "cat_registrar",
    "authorId": "user_manager_002",
    "status": "published",
    "locale": "en",
    "viewCount": 823,
    "helpfulCount": 756,
    "tags": ["transcript", "registrar", "documents"],
    "createdAt": "2024-09-10T11:00:00Z",
    "updatedAt": "2025-01-10T16:00:00Z",
    "publishedAt": "2024-09-15T10:00:00Z"
  },
  {
    "id": "article_003",
    "title": "سياسات دفع الرسوم الدراسية",
    "slug": "tuition-payment-policies-ar",
    "content": "# سياسات دفع الرسوم الدراسية\n\nيجب على الطلاب دفع الرسوم الدراسية بحلول اليوم الخامس عشر من كل شهر...",
    "categoryId": "cat_finance",
    "authorId": "user_manager_001",
    "status": "published",
    "locale": "ar",
    "viewCount": 389,
    "helpfulCount": 342,
    "tags": ["payment", "tuition", "policies"],
    "createdAt": "2024-09-20T10:00:00Z",
    "updatedAt": "2025-01-15T14:00:00Z",
    "publishedAt": "2024-09-25T10:00:00Z"
  },
  {
    "id": "article_004",
    "title": "Application Requirements",
    "slug": "application-requirements",
    "content": "# Application Requirements\n\nProspective students must submit...",
    "categoryId": "cat_admissions",
    "authorId": "user_manager_003",
    "status": "published",
    "locale": "en",
    "viewCount": 1234,
    "helpfulCount": 1089,
    "tags": ["admissions", "application", "requirements"],
    "createdAt": "2024-08-15T09:00:00Z",
    "updatedAt": "2025-01-05T11:00:00Z",
    "publishedAt": "2024-08-20T10:00:00Z"
  },
  {
    "id": "article_005",
    "title": "Student Portal Access Guide",
    "slug": "student-portal-access-guide",
    "content": "# Student Portal Access\n\nTo access the student portal...",
    "categoryId": "cat_it",
    "authorId": "user_admin_001",
    "status": "draft",
    "locale": "en",
    "viewCount": 0,
    "helpfulCount": 0,
    "tags": ["portal", "access", "login"],
    "createdAt": "2025-01-20T13:00:00Z",
    "updatedAt": "2025-01-28T15:00:00Z",
    "publishedAt": null
  }
]
```

---

**First 5 Users** (preview):
```json
[
  {
    "id": "user_001",
    "email": "admin@reops.example",
    "name": "System Admin",
    "role": "admin",
    "department": null,
    "locale": "en",
    "avatarUrl": "https://i.pravatar.cc/150?u=user_001",
    "createdAt": "2024-08-01T10:00:00Z",
    "updatedAt": "2024-08-01T10:00:00Z"
  },
  {
    "id": "user_002",
    "email": "sara.almansoori@reops.example",
    "name": "Sara Al-Mansoori",
    "role": "manager",
    "department": "finance",
    "locale": "en",
    "avatarUrl": "https://i.pravatar.cc/150?u=user_002",
    "createdAt": "2024-08-05T10:00:00Z",
    "updatedAt": "2024-08-05T10:00:00Z"
  },
  {
    "id": "user_003",
    "email": "ahmed.ibrahim@reops.example",
    "name": "Ahmed Ibrahim",
    "role": "agent",
    "department": "finance",
    "locale": "ar",
    "avatarUrl": "https://i.pravatar.cc/150?u=user_003",
    "createdAt": "2024-08-10T10:00:00Z",
    "updatedAt": "2024-08-10T10:00:00Z"
  },
  {
    "id": "user_004",
    "email": "fatima.alhassan@reops.example",
    "name": "Fatima Al-Hassan",
    "role": "agent",
    "department": "registrar",
    "locale": "ar",
    "avatarUrl": "https://i.pravatar.cc/150?u=user_004",
    "createdAt": "2024-08-12T10:00:00Z",
    "updatedAt": "2024-08-12T10:00:00Z"
  },
  {
    "id": "user_005",
    "email": "omar.said@reops.example",
    "name": "Omar Said",
    "role": "manager",
    "department": "admissions",
    "locale": "en",
    "avatarUrl": "https://i.pravatar.cc/150?u=user_005",
    "createdAt": "2024-08-15T10:00:00Z",
    "updatedAt": "2024-08-15T10:00:00Z"
  }
]
```

---

### 20.8 Telemetry Stubs

**Console Emit** for `reops.*` events:

```typescript
export function emitTelemetry<K extends keyof TelemetryEventMap>(
  eventName: K,
  properties: TelemetryEventMap[K]
): void {
  console.log(`[TELEMETRY] ${eventName}`, {
    timestamp: new Date().toISOString(),
    ...properties
  });
}

// Usage in handlers:
emitTelemetry('reops.inbox.case_created', {
  caseId: 'case_abc123',
  department: 'finance',
  priority: 'high',
  channel: 'email'
});

emitTelemetry('reops.ai.schema_validated', {
  modelId: 'gpt-4o-mini',
  task: 'classify',
  schemaName: 'ClassificationResult',
  ok: true,
  ms: 1120
});

emitTelemetry('reops.km.article_viewed', {
  articleId: 'article_001',
  viewerId: 'user_003',
  source: 'search'
});
```

**Example Console Output**:
```
[TELEMETRY] reops.inbox.case_created {
  timestamp: '2025-01-30T12:05:00Z',
  caseId: 'case_abc123',
  department: 'finance',
  priority: 'high',
  channel: 'email'
}
[TELEMETRY] reops.ai.schema_validated {
  timestamp: '2025-01-30T12:05:02Z',
  modelId: 'gpt-4o-mini',
  task: 'classify',
  schemaName: 'ClassificationResult',
  ok: true,
  ms: 1120
}
```

---

### 20.9 Acceptance Criteria

- [ ] SEED constant set to 20251030; NOW set to 2025-01-30T12:00:00Z
- [ ] prng() generates deterministic sequence; weighted() and pick() use seeded random
- [ ] Seed plan generates exactly 2,000 cases with distribution matching §9.10
- [ ] Department distribution: Finance 30%, Admissions 25%, Registrar 25%, IT 10%, Student Affairs 7.5%, General 2.5%
- [ ] Priority distribution: Low 40%, Medium 35%, High 20%, Urgent 5%
- [ ] SLA distribution: On Track 70%, At Risk 20%, Breached 10%
- [ ] August 2024 shows +40% volume spike; January 2025 shows +35% volume spike
- [ ] 50 duplicate cases flagged; 200 breached SLA cases; 100 cases with 10+ messages
- [ ] All generator functions return types matching §18 core types
- [ ] MSW handlers implement all endpoints from §19 (cases, manager, admin, km, ai, search, export, sse)
- [ ] Example handler (GET /api/cases) filters by status, department, priority, assigneeId, search
- [ ] setMockTime() updates CURRENT_TIME and triggers recomputeSLARisks()
- [ ] SLA risk recomputation: <0h = breached, ≤4h = at_risk, >4h = on_track
- [ ] setErrorRate() configures rate500, rate429, timeoutMs per endpoint
- [ ] shouldInjectError() returns 500/429 responses based on configured rates
- [ ] Fixtures include first 5 cases, 5 articles, 5 users with realistic data
- [ ] emitTelemetry() logs to console with timestamp and event properties
- [ ] Telemetry events use TelemetryEventMap types from §18.4

---

END §20