# OpenLens Backend

OpenLens OSS Inventory Backend - Node.js Express API for tracking open-source libraries, licenses, and vulnerabilities.

## Features

- **Authentication**: JWT-based user authentication and role management
- **Library Inventory**: CRUD operations for managing open-source libraries
- **Import & Mapping**: CSV/JSON import with intelligent preview and field mapping
- **Vulnerability Scanning**: Integration with NVD and GitHub Advisory APIs
- **License Detection**: Automatic license detection and compliance checking
- **Reconciliation**: Manual review queue for uncertain library matches
- **Background Jobs**: Bull/Redis queue for asynchronous enrichment tasks
- **Audit Logging**: Full audit trail for all operations

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose (for local dev)
- PostgreSQL 15+ (or use Docker)
- Redis 7+ (or use Docker)

### Local Development with Docker

```bash
# Clone repo and navigate to backend directory
cd openlens-backend

# Start services (postgres, redis, backend, worker)
docker-compose up

# In another terminal, run migrations and seeds
docker-compose exec backend npm run migrate
docker-compose exec backend npm run seed

# API will be available at http://localhost:3000
# Health check: curl http://localhost:3000/health
```

### Manual Setup

```bash
# Install dependencies
npm ci

# Set up environment
cp .env.example .env
# Edit .env with your database and Redis URLs

# Run migrations
npm run migrate

# Seed database with sample data
npm run seed

# Start backend server
npm start

# In another terminal, start worker
npm run worker
```

## Environment Variables

See `.env.example` for all available variables:

- `NODE_ENV`: development/production
- `PORT`: Server port (default: 3000)
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection URL
- `JWT_SECRET`: Secret key for JWT signing
- `CORS_ORIGIN`: Allowed origins for CORS
- `NVD_API_KEY`: National Vulnerability Database API key (optional)
- `GITHUB_ACCESS_TOKEN`: GitHub API token (optional)

## API Endpoints

### Authentication

```
POST /api/v1/auth/register
POST /api/v1/auth/login
GET /api/v1/auth/me
```

### Libraries

```
GET /api/v1/libraries
GET /api/v1/libraries/:id
POST /api/v1/libraries
PUT /api/v1/libraries/:id
DELETE /api/v1/libraries/:id
```

### Imports

```
POST /api/v1/imports (multipart/form-data)
GET /api/v1/imports/:id
GET /api/v1/imports/:id/preview
POST /api/v1/imports/:id/map
```

### Vulnerabilities

```
GET /api/v1/vulnerabilities
GET /api/v1/vulnerabilities/:id
GET /api/v1/vulnerabilities/library/:libraryId/summary
```

### Reconciliation

```
GET /api/v1/reconciliation
POST /api/v1/reconciliation/:id/resolve
```

### Integrations

```
POST /api/v1/integrations/github/connect
POST /api/v1/integrations/jira/connect
GET /api/v1/integrations/list
DELETE /api/v1/integrations/:type
```

### Admin

```
GET /api/v1/admin/stats
GET /health
```

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch
```

## Database Migrations

```bash
# Run migrations
npm run migrate

# Rollback last migration
npm run migrate:rollback

# Seed database
npm run seed
```

## Deployment

### Deploy to Render

1. Create new Web Service in Render dashboard
2. Connect your GitHub repository
3. Set environment variables:
   - `NODE_ENV=production`
   - `DATABASE_URL`: Your Supabase PostgreSQL URL
   - `REDIS_URL`: Your Upstash Redis URL
   - `JWT_SECRET`: Generate a strong secret
4. Deploy

### Deploy to Railway/Heroku

Similar process - set environment variables and deploy from git.

## Project Structure

```
src/
  ├── routes/          # API endpoints
  ├── middleware/      # Auth, error handling, etc
  ├── services/        # Business logic (vuln scanner, license detector)
  ├── database/        # Knex config, migrations, seeds
  ├── utils/           # Logger, validation, pagination helpers
  ├── jobs/            # Job definitions (can extend)
  ├── server.js        # Express app entry
  └── worker.js        # Bull worker entry
```

## Contributing

Follow existing code conventions:
- Use arrow functions
- Prefer const/let over var
- Use async/await
- Add error logging for debugging

## License

MIT
