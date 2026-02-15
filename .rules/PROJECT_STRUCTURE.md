# RFQ BUDDY - PROJECT STRUCTURE

> **Reference document for AI coding agents. DO NOT MODIFY.**

---

## DIRECTORY STRUCTURE

```
rfq-platform/
├── frontend/                          # SvelteKit Frontend Application
│   ├── src/
│   │   ├── routes/                    # Pages and API routes
│   │   │   ├── (auth)/                # Auth layout group (no navbar)
│   │   │   │   ├── login/
│   │   │   │   │   └── +page.svelte
│   │   │   │   ├── register/
│   │   │   │   │   └── +page.svelte
│   │   │   │   └── +layout.svelte
│   │   │   │
│   │   │   ├── (app)/                 # App layout group (with navbar)
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── +page.svelte
│   │   │   │   ├── tenders/
│   │   │   │   │   ├── +page.svelte           # List all tenders
│   │   │   │   │   ├── +page.ts               # Load function
│   │   │   │   │   ├── new/
│   │   │   │   │   │   └── +page.svelte       # Create tender form
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── +page.svelte       # Tender detail
│   │   │   │   │       ├── +page.ts           # Load tender data
│   │   │   │   │       ├── edit/
│   │   │   │   │       │   └── +page.svelte   # Edit tender
│   │   │   │   │       ├── items/
│   │   │   │   │       │   └── +page.svelte   # Manage line items
│   │   │   │   │       ├── bid/
│   │   │   │   │       │   └── +page.svelte   # Submit bid (vendor)
│   │   │   │   │       ├── bids/
│   │   │   │   │       │   └── +page.svelte   # View all bids (buyer)
│   │   │   │   │       ├── comparison/
│   │   │   │   │       │   └── +page.svelte   # Comparison matrix
│   │   │   │   │       └── evaluate/
│   │   │   │   │           └── +page.svelte   # Evaluation form
│   │   │   │   ├── vendors/
│   │   │   │   │   ├── +page.svelte           # Vendor list (buyer view)
│   │   │   │   │   ├── register/
│   │   │   │   │   │   └── +page.svelte       # Vendor registration
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── +page.svelte       # Vendor profile
│   │   │   │   ├── profile/
│   │   │   │   │   └── +page.svelte           # User profile
│   │   │   │   └── +layout.svelte             # App layout with navbar
│   │   │   │
│   │   │   ├── api/                   # SvelteKit API routes (proxy to backend)
│   │   │   │   ├── auth/
│   │   │   │   │   ├── login/
│   │   │   │   │   │   └── +server.ts
│   │   │   │   │   ├── register/
│   │   │   │   │   │   └── +server.ts
│   │   │   │   │   └── logout/
│   │   │   │   │       └── +server.ts
│   │   │   │   └── [...path]/
│   │   │   │       └── +server.ts     # Catch-all proxy to backend
│   │   │   │
│   │   │   ├── +layout.svelte         # Root layout
│   │   │   ├── +layout.ts             # Root load (auth check)
│   │   │   ├── +error.svelte          # Error page
│   │   │   └── +page.svelte           # Landing page (redirect)
│   │   │
│   │   ├── lib/                       # Shared library code
│   │   │   ├── components/            # Reusable UI components
│   │   │   │   ├── ui/                # Base UI components
│   │   │   │   │   ├── Button.svelte
│   │   │   │   │   ├── Input.svelte
│   │   │   │   │   ├── Select.svelte
│   │   │   │   │   ├── Modal.svelte
│   │   │   │   │   ├── Table.svelte
│   │   │   │   │   ├── Card.svelte
│   │   │   │   │   ├── Badge.svelte
│   │   │   │   │   ├── Alert.svelte
│   │   │   │   │   └── Spinner.svelte
│   │   │   │   ├── layout/            # Layout components
│   │   │   │   │   ├── Navbar.svelte
│   │   │   │   │   ├── Sidebar.svelte
│   │   │   │   │   ├── Footer.svelte
│   │   │   │   │   └── PageHeader.svelte
│   │   │   │   ├── tender/            # Tender-specific components
│   │   │   │   │   ├── TenderCard.svelte
│   │   │   │   │   ├── TenderForm.svelte
│   │   │   │   │   ├── TenderStatus.svelte
│   │   │   │   │   ├── LineItemTable.svelte
│   │   │   │   │   ├── LineItemRow.svelte
│   │   │   │   │   ├── FeatureInput.svelte
│   │   │   │   │   └── DeadlineTimer.svelte
│   │   │   │   ├── bid/               # Bid-specific components
│   │   │   │   │   ├── BidForm.svelte
│   │   │   │   │   ├── BidItemRow.svelte
│   │   │   │   │   ├── BidSummary.svelte
│   │   │   │   │   ├── EnvelopeStatus.svelte
│   │   │   │   │   └── ComplianceBadge.svelte
│   │   │   │   ├── evaluation/        # Evaluation components
│   │   │   │   │   ├── ScoreInput.svelte
│   │   │   │   │   ├── ComparisonMatrix.svelte
│   │   │   │   │   ├── FeatureComparison.svelte
│   │   │   │   │   └── RankingTable.svelte
│   │   │   │   └── vendor/            # Vendor components
│   │   │   │       ├── VendorCard.svelte
│   │   │   │       ├── VendorForm.svelte
│   │   │   │       ├── DocumentUpload.svelte
│   │   │   │       └── CategorySelect.svelte
│   │   │   │
│   │   │   ├── stores/                # Svelte stores (state management)
│   │   │   │   ├── auth.ts            # Authentication state
│   │   │   │   ├── tender.ts          # Current tender state
│   │   │   │   ├── bid.ts             # Current bid state
│   │   │   │   ├── notification.ts    # Toast notifications
│   │   │   │   └── ui.ts              # UI state (sidebar, modals)
│   │   │   │
│   │   │   ├── schemas/               # Zod validation schemas
│   │   │   │   ├── auth.schema.ts
│   │   │   │   ├── tender.schema.ts
│   │   │   │   ├── bid.schema.ts
│   │   │   │   ├── vendor.schema.ts
│   │   │   │   └── common.schema.ts
│   │   │   │
│   │   │   ├── types/                 # TypeScript type definitions
│   │   │   │   ├── auth.ts
│   │   │   │   ├── tender.ts
│   │   │   │   ├── bid.ts
│   │   │   │   ├── vendor.ts
│   │   │   │   ├── evaluation.ts
│   │   │   │   └── api.ts
│   │   │   │
│   │   │   ├── utils/                 # Utility functions
│   │   │   │   ├── api.ts             # API client (fetch wrapper)
│   │   │   │   ├── format.ts          # Date, currency formatting
│   │   │   │   ├── validation.ts      # Form validation helpers
│   │   │   │   └── constants.ts       # App constants
│   │   │   │
│   │   │   └── index.ts               # Re-exports for $lib
│   │   │
│   │   ├── app.html                   # HTML template
│   │   ├── app.css                    # Global CSS (Tailwind imports)
│   │   └── hooks.server.ts            # Server hooks (auth middleware)
│   │
│   ├── static/                        # Static assets
│   │   ├── favicon.ico
│   │   └── images/
│   │
│   ├── tests/                         # Test files
│   │   ├── unit/                      # Unit tests (Vitest)
│   │   └── e2e/                        # E2E tests (Playwright)
│   │
│   ├── svelte.config.js               # SvelteKit config
│   ├── vite.config.ts                 # Vite config
│   ├── tailwind.config.js             # Tailwind config
│   ├── postcss.config.js              # PostCSS config
│   ├── tsconfig.json                  # TypeScript config
│   ├── package.json
│   └── .env                           # Environment variables
│
├── backend/                           # Express Backend Application
│   ├── src/
│   │   ├── controllers/               # HTTP request handlers
│   │   │   ├── auth.controller.ts
│   │   │   ├── tender.controller.ts
│   │   │   ├── item.controller.ts
│   │   │   ├── bid.controller.ts
│   │   │   ├── vendor.controller.ts
│   │   │   ├── evaluation.controller.ts
│   │   │   ├── award.controller.ts
│   │   │   └── notification.controller.ts
│   │   │
│   │   ├── services/                  # Business logic
│   │   │   ├── auth.service.ts
│   │   │   ├── tender.service.ts
│   │   │   ├── item.service.ts
│   │   │   ├── bid.service.ts
│   │   │   ├── vendor.service.ts
│   │   │   ├── evaluation.service.ts
│   │   │   ├── award.service.ts
│   │   │   ├── notification.service.ts
│   │   │   └── export.service.ts
│   │   │
│   │   ├── routes/                    # Express route definitions
│   │   │   ├── auth.routes.ts
│   │   │   ├── tender.routes.ts
│   │   │   ├── bid.routes.ts
│   │   │   ├── vendor.routes.ts
│   │   │   ├── evaluation.routes.ts
│   │   │   └── index.ts               # Route aggregator
│   │   │
│   │   ├── middleware/                # Express middleware
│   │   │   ├── auth.middleware.ts
│   │   │   ├── validate.middleware.ts
│   │   │   ├── rateLimit.middleware.ts
│   │   │   └── error.middleware.ts
│   │   │
│   │   ├── schemas/                   # Zod validation schemas
│   │   │   ├── auth.schema.ts
│   │   │   ├── tender.schema.ts
│   │   │   ├── bid.schema.ts
│   │   │   └── vendor.schema.ts
│   │   │
│   │   ├── config/                    # Configuration
│   │   │   ├── database.ts            # PostgreSQL connection
│   │   │   ├── redis.ts               # Redis connection
│   │   │   ├── logger.ts              # Pino logger
│   │   │   └── env.ts                 # Environment validation
│   │   │
│   │   ├── utils/                     # Utility functions
│   │   │   ├── hash.ts                # Password hashing
│   │   │   ├── jwt.ts                 # JWT helpers
│   │   │   └── audit.ts               # Audit logging
│   │   │
│   │   └── app.ts                     # Express app entry point
│   │
│   ├── tests/                         # Backend tests
│   │   ├── unit/
│   │   └── integration/
│   │
│   ├── tsconfig.json
│   ├── package.json
│   └── .env
│
├── database/                          # Database files
│   ├── schema.sql                     # Main schema
│   ├── seed.sql                       # Seed data
│   ├── rls.sql                        # Row-level security
│   └── migrations/                    # Migration files
│
├── docker-compose.yml                 # Docker services
├── .gitignore
└── README.md
```

---

## KEY FILE PURPOSES

### Frontend Routes

| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/login` | User login form | No |
| `/register` | User registration | No |
| `/dashboard` | User dashboard | Yes |
| `/tenders` | List tenders | Yes |
| `/tenders/new` | Create tender | Yes (Buyer) |
| `/tenders/[id]` | View tender | Yes |
| `/tenders/[id]/bid` | Submit bid | Yes (Vendor) |
| `/tenders/[id]/bids` | View all bids | Yes (Buyer) |
| `/tenders/[id]/comparison` | Comparison matrix | Yes (Buyer/Evaluator) |
| `/vendors` | List vendors | Yes (Buyer) |
| `/vendors/register` | Vendor registration | Yes (Vendor) |

### Backend Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/tenders` | List tenders |
| POST | `/api/tenders` | Create tender |
| GET | `/api/tenders/:id` | Get tender |
| PUT | `/api/tenders/:id` | Update tender |
| POST | `/api/tenders/:id/publish` | Publish tender |
| GET | `/api/tenders/:id/items` | Get items |
| POST | `/api/tenders/:id/items` | Add item |
| POST | `/api/tenders/:id/bids` | Create bid |
| POST | `/api/tenders/:id/bids/:bidId/submit` | Submit bid |
| GET | `/api/tenders/:id/comparison` | Get comparison |
| POST | `/api/tenders/:id/evaluate` | Submit evaluation |
| POST | `/api/tenders/:id/awards` | Create award |

---

## STORE STRUCTURE

### auth.ts
```typescript
{
  user: User | null,
  isAuthenticated: boolean,
  isLoading: boolean
}
```

### tender.ts
```typescript
{
  current: Tender | null,
  items: TenderItem[],
  features: Feature[],
  isLoading: boolean
}
```

### bid.ts
```typescript
{
  current: Bid | null,
  items: BidItem[],
  featureValues: FeatureValue[],
  isDirty: boolean,
  isSubmitting: boolean
}
```

---

## ENVIRONMENT VARIABLES

### Frontend (.env)
```
PUBLIC_API_URL=http://localhost:3000
PUBLIC_APP_NAME=RFQ Buddy
```

### Backend (.env)
```
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rfq_platform
DB_USER=postgres
DB_PASSWORD=postgres
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
```

---

## DO NOT MODIFY THIS FILE