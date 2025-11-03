# ReOps AI - University Student Support System

AI-powered student support system for universities, aligned with SPEC_MASTER.md.

## Features

- 🤖 AI-powered draft composition and classification (§17)
- 🔒 PII masking and security controls (§17.4)
- 📊 SLA tracking and calendar view (§12)
- 🌐 Bilingual support (EN/AR) with RTL (§11)
- 🎯 Feature flags for gradual rollout
- ♿ WCAG 2.1 AA accessible components

## Runtime Configuration

Feature flags are controlled via environment variables:

```bash
# .env.local
NEXT_PUBLIC_USE_LLM=false          # Enable/disable AI features
NEXT_PUBLIC_LLM_MODE=none          # none | draft | classify
NEXT_PUBLIC_PII_MASK=true          # Enable PII masking
NEXT_PUBLIC_DEMO_SCOREBOARD=false  # Show demo scoreboard
NEXT_PUBLIC_SLA_CAL_ENABLED=true   # Enable SLA calendar
```

See `.env.example` for full configuration.

## Getting Started

### Prerequisites

- Node.js 18+ or 20+
- npm 9+

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing

### Unit Tests

```bash
npm run test:unit
npm run test:unit:watch  # Watch mode
```

### Integration Tests

```bash
npm run test:int
npm run test:int:watch
```

### End-to-End Tests

```bash
npm run test:e2e
npm run test:e2e:ui  # Interactive UI mode
```

### Accessibility Tests

```bash
npm run test:a11y
```

### Coverage

```bash
npm run test:coverage
```

## Code Quality

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```

### Formatting

```bash
npm run format        # Format all files
npm run format:check  # Check formatting
```

## CI/CD

The complete CI pipeline runs:

```bash
npm run ci
```

This includes:
- Type checking
- Linting
- Format checking
- Unit tests
- Integration tests
- E2E tests

## Project Structure

```
ReopsAi/
├── src/
│   ├── app/              # Next.js 14 app directory
│   ├── components/       # React components
│   ├── shared/           # Shared utilities and config
│   └── lib/              # Library code and test utils
├── mocks/                # MSW mock handlers (§20)
├── e2e/                  # Playwright E2E tests
├── docs/                 # SPEC_MASTER.md and documentation
└── tests/                # Test utilities
```

## Feature Flags

Feature flags control which features are enabled at runtime:

- **USE_LLM**: Enable AI features (draft composition, classification)
- **LLM_MODE**: AI mode - `none`, `draft`, or `classify`
- **PII_MASK**: Mask PII for non-manager users (§17.4)
- **DEMO_SCOREBOARD**: Show demo performance scoreboard
- **SLA_CAL_ENABLED**: Enable SLA calendar view

See `src/shared/runtime_config.ts` for typed access to flags.

## Accessibility

All components follow WCAG 2.1 AA guidelines:

- Semantic HTML
- ARIA labels and roles
- Keyboard navigation
- Screen reader support
- RTL support for Arabic

Accessibility tests run via:

```bash
npm run test:a11y
```

## License

Proprietary - All rights reserved

## Documentation

See [SPEC_MASTER.md](./docs/SPEC_MASTER.md) for complete specifications.