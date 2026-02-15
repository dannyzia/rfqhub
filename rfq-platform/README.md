# RFQ Buddy - Online RFQ & Tendering Platform

A comprehensive platform for managing Requests for Quotation (RFQ) and formal Tenders, enabling buyers to float tenders and vendors to submit structured bids.

## Features

- **Tender Management**: Create, publish, and manage RFQs and Tenders
- **Vendor Management**: Vendor registration, approval workflow, and document management
- **Bid Submission**: Structured bid submission with versioning and envelope separation
- **Two-Stage Evaluation**: Technical and commercial evaluation with comparison matrix
- **Award Management**: Full and partial award support
- **Notifications**: Email and in-app notifications for key events
- **Audit Trail**: Complete audit logging for compliance

## Tech Stack

- **Frontend**: SvelteKit 2.x, TypeScript, Tailwind CSS
- **Backend**: Node.js 20, Express, TypeScript
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Validation**: Zod
- **Testing**: Vitest, Playwright

## Getting Started

### Prerequisites

- Node.js 20 LTS
- PostgreSQL 16
- Redis 7
- Docker (optional)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd rfq-platform
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   cp .env.example .env
   ```

4. Set up the database:
   ```bash
   # Run the schema SQL in PostgreSQL
   psql -U postgres -d rfq_platform -f database/schema.sql
   ```

5. Start the development servers:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

### Using Docker

```bash
docker-compose up -d
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379
- MinIO (S3-compatible storage) on ports 9000/9001
- Backend API on port 3000
- Frontend on port 5173

## Testing

### Unit Tests
```bash
# Frontend
cd frontend
npm test

# Backend
cd backend
npm test
```

### E2E Tests
```bash
cd frontend
npm run test:e2e
```

## Project Structure

```
rfq-platform/
├── backend/           # Express API server
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── schemas/
│   │   └── config/
│   └── tests/
├── frontend/          # SvelteKit application
│   ├── src/
│   │   ├── routes/
│   │   ├── lib/
│   │   └── tests/
│   └── e2e/
├── database/          # SQL schema and migrations
└── docker-compose.yml
```

## API Documentation

API endpoints follow RESTful conventions. See the [API Documentation](docs/api.md) for full details.

## License

Proprietary - All rights reserved.