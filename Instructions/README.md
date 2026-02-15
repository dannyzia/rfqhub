# RFQ Buddy - Enterprise RFQ & Tendering Platform

**Documentation Version:** 3.1 | **Last Updated:** February 2026

## 📋 Overview

RFQ Buddy is a comprehensive Request for Quotation (RFQ) and Tendering platform designed for enterprise procurement workflows. Built to comply with Bangladesh Public Procurement Rules (PPR) and e-GP guidelines, it supports the complete tender lifecycle from publication to award.

### Key Documents
| Document | Version | Description |
|----------|---------|-------------|
| [Technical PRD](RFQ_Tendering_Platform_Technical_PRD_v3.md) | v3.1 | Complete product specification |
| [Developer Coding Plan](RFQ_Developer_Coding_Plan.md) | v2.0 | Step-by-step implementation guide (35 tasks) |
| [Database Schema](rfq_tendering_platform_schema_v3.sql) | v3.0 | PostgreSQL schema with 38 tables |
| [Tech Stack Analysis](TECH_STACK_ANALYSIS.md) | v1.0 | Svelte vs React comparison |

## 🏗️ Architecture

### Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Database** | PostgreSQL 16+ | JSONB with GIN indexes, Row-Level Security (RLS), PITR recovery, recursive CTEs for hierarchical BoM |
| **Backend** | Node.js (NestJS) + TypeScript | Modular structure, type safety end-to-end |
| **Frontend** | SvelteKit + Skeleton UI | Superior performance, smaller bundles, built-in SSR |
| **File Storage** | S3 / MinIO | Document management for tender attachments |
| **Cache** | Redis 7+ | Session management, rate limiting, real-time notifications |
| **Search** | PostgreSQL Full-Text + pg_trgm | Built-in search with fuzzy matching |
| **Validation** | Zod | Runtime type validation with TypeScript integration |
| **Logging** | Pino | High-performance structured JSON logging |
| **Task Queue** | BullMQ | Async jobs for notifications, PDF export |

### Why SvelteKit over React?

For this procurement platform, SvelteKit offers significant advantages:

1. **Performance**: No virtual DOM overhead - critical for form-heavy tender submissions
2. **Bundle Size**: 40-70% smaller bundles - essential for government networks with variable speeds
3. **Reactivity**: Built-in reactive stores handle complex bid form state elegantly
4. **Less Boilerplate**: Faster development, easier maintenance
5. **SSR Built-in**: Better initial load performance and SEO
6. **Type Safety**: Excellent TypeScript integration out of the box

## 📊 Database Schema

The schema (`rfq_tendering_platform_schema_v3.sql`) implements:

### Core Entities

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Organizations  │────▶│     Users       │     │    Tenders      │
│  (Buyer/Vendor) │     │  (Multi-Role)   │────▶│   (Lifecycle)   │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
        ┌────────────────────────────────────────────────┼────────────────────────┐
        │                        │                       │                        │
        ▼                        ▼                       ▼                        ▼
┌───────────────┐    ┌───────────────────┐    ┌─────────────────┐    ┌───────────────────┐
│ Tender Items  │    │   Invitations     │    │  Clarifications │    │     Addenda       │
│ (Hierarchical │    │ (Limited Tenders) │    │  (Q&A System)   │    │  (Amendments)     │
│    BoM/BOQ)   │    └───────────────────┘    └─────────────────┘    └───────────────────┘
└───────┬───────┘
        │
        ▼
┌───────────────┐    ┌───────────────────┐    ┌─────────────────┐    ┌───────────────────┐
│   Features    │───▶│      Bids         │───▶│   Evaluations   │───▶│     Awards        │
│  (Specs &     │    │ (Two-Envelope     │    │ (Tech + Comm    │    │ (Partial/Full)    │
│   Scoring)    │    │   Versioned)      │    │   Scoring)      │    └───────────────────┘
└───────────────┘    └───────────────────┘    └─────────────────┘
```

### Key Tables

| Table | Purpose |
|-------|---------|
| `organizations` | Buyer/Vendor entities (supports dual-role) |
| `users` | Multi-role RBAC (admin, buyer, vendor, evaluator) |
| `tenders` | Tender header with full metadata |
| `tender_items` | Hierarchical BOQ with parent-child relationships |
| `feature_definitions` | Configurable specifications with scoring |
| `bids` | Versioned bids with compliance tracking |
| `bid_envelopes` | Two-envelope system (technical/commercial) |
| `evaluations` | Scoring with line-item granularity |
| `awards` | Partial award support |
| `audit_logs` | Immutable audit trail |

## 🔐 Security Features

- **Row-Level Security (RLS)**: Multi-tenant isolation at database layer
- **RBAC**: Role-based access control with multi-role support
- **Invitation Tokens**: Cryptographically secure single-use tokens for limited tenders
- **Digital Hash**: SHA-256 integrity verification for submitted bids
- **Audit Trail**: Immutable logging of all actions
- **Password Security**: bcrypt with cost ≥ 12

## 📁 Project Structure

```
RFQ_Buddy/
├── Instructions/
│   ├── README.md                              # This file
│   ├── RFQ_Developer_Coding_Plan.docx         # Development roadmap
│   ├── RFQ_Tendering_Platform_Technical_PRD_v3.docx  # Product Requirements
│   └── rfq_tendering_platform_schema_v3.sql   # Database schema
│
├── Resources/
│   ├── Policy/                                # Procurement regulations
│   │   ├── 01 Public Procurement Related Act/
│   │   ├── 02 Public Procurement Related Rules/
│   │   ├── 03 Delegation of Financial Power/
│   │   ├── 04 e-GP Guideline and Security Policy/
│   │   ├── 05 Bangladesh e-GP Guidelines (Revised) 2025/
│   │   ├── 06 Procurement Post Review/
│   │   ├── 07 Bangladesh Public Procurement Authority Act/
│   │   └── 08 Outsourcing Policy 2025/
│   │
│   └── Process/                               # Procurement process documents
│       ├── PG* (Procurement of Goods)
│       ├── PW* (Procurement of Works)
│       └── PPS* (Procurement of Services)
```

## 🚀 Getting Started

### Prerequisites

- PostgreSQL 16+
- Node.js 20+ (for SvelteKit frontend)
- Redis 7+ (for caching/sessions)
- MinIO or S3-compatible storage

### Database Setup

```bash
# Create database
createdb rfq_buddy

# Run schema
psql -d rfq_buddy -f Instructions/rfq_tendering_platform_schema_v3.sql

# Run seed data (see schema_seed.sql)
psql -d rfq_buddy -f Instructions/schema_seed.sql

# Enable RLS policies (see schema_rls.sql)
psql -d rfq_buddy -f Instructions/schema_rls.sql
```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/rfq_buddy

# Redis
REDIS_URL=redis://localhost:6379

# Storage
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=rfq-documents

# Security
JWT_SECRET=your-256-bit-secret
BCRYPT_COST=12

# Email (for notifications)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=notifications@example.com
SMTP_PASS=your-smtp-password
```

## 📋 Feature Checklist (7 Phases, 35 Tasks)

### Phase 1 - Project Setup & Foundation
- [ ] Create folder structure
- [ ] Initialize backend with TypeScript
- [ ] Create .env configuration
- [ ] Set up PostgreSQL database
- [ ] Database & Redis connection modules
- [ ] Main server entry point
- [ ] User registration & login with JWT

### Phase 2 - Tender & Line-Item Core
- [ ] Tender CRUD API
- [ ] Tender status transitions (state machine)
- [ ] Line-item (BoM) API with hierarchy
- [ ] Feature definitions & options API
- [ ] Publish flow & vendor visibility

### Phase 3 - Vendor & Bid Engine
- [ ] Vendor profile & enlistment
- [ ] Bid submission API
- [ ] Bid versioning logic

### Phase 4 - Evaluation & Awards
- [ ] Bid opening & envelope system
- [ ] Evaluation & scoring API
- [ ] Comparison matrix API
- [ ] Award API

### Phase 5 - Notifications & Addenda
- [ ] Notification service (sender)
- [ ] Wire up all notification triggers
- [ ] Clarification (Q&A) API
- [ ] Addenda API

### Phase 6 - Export, Tax & Polish
- [ ] Tax engine
- [ ] Currency rate cache
- [ ] Export engine (PDF & XLSX)
- [ ] Rate limiting
- [ ] Audit log hardening

### Phase 7 - Frontend & Testing
- [ ] Initialize SvelteKit frontend
- [ ] Build core frontend pages
- [ ] Create Svelte stores
- [ ] Write unit tests (Vitest)
- [ ] Write E2E tests (Playwright)
- [ ] Create Docker configuration
- [ ] Final integration & deployment

## 📖 API Documentation

API endpoints follow RESTful conventions with OpenAPI 3.0 specification.

Base URL: `/api/v1`

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/login` | POST | User login |
| `/auth/logout` | POST | User logout |
| `/auth/refresh` | POST | Refresh JWT token |

### Tenders
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/tenders` | GET | List tenders (filtered by role) |
| `/tenders` | POST | Create tender (buyer only) |
| `/tenders/:id` | GET | Get tender details |
| `/tenders/:id` | PUT | Update tender |
| `/tenders/:id/publish` | POST | Publish tender |
| `/tenders/:id/items` | GET/POST | Manage tender items |

### Bids
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/tenders/:id/bids` | GET | List bids (buyer view) |
| `/tenders/:id/bids` | POST | Create/submit bid (vendor) |
| `/bids/:id` | GET | Get bid details |
| `/bids/:id/submit` | POST | Submit bid |

## 🤝 Contributing

1. Follow the coding standards in `RFQ_Developer_Coding_Plan.docx`
2. All database changes require migration scripts
3. Maintain audit logging for all state changes
4. Write tests for new features

## 🔧 Quick Start with Docker

```bash
# Clone and start all services
cd rfq-platform
docker-compose up -d

# Services will be available at:
# - Frontend: http://localhost:5173
# - Backend API: http://localhost:3000
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
# - MinIO Console: http://localhost:9001
```

## 📜 License

Proprietary - All rights reserved

## 📞 Support

For technical support or questions about procurement rules, refer to the documents in the `Resources/Policy` directory.

---

*Generated from RFQ Buddy Documentation Suite v3.1*