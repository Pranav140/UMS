# Local Deployment Guide - University Management System (PERN)

This guide will help you set up and run the University Management System on your local development environment.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **Docker** and **Docker Compose** (v2.0 or higher)
- **Git**

## System Architecture

The UMS consists of:
- **Frontend**: React 19 + Vite 6 with TailwindCSS
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Object Storage**: MinIO (S3-compatible)
- **ORM**: Prisma 7

---

## Quick Start (One Command)

```bash
chmod +x deploy.sh stop.sh
./deploy.sh --dev
```

This starts everything — Docker infrastructure, backend, and frontend — in development mode with hot-reload.

---

## Manual Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd university-management-pern
```

### 2. Start Docker Services

Start PostgreSQL, Redis, and MinIO using Docker Compose:

```bash
docker compose up -d
```

Verify services are running:

```bash
docker compose ps
```

You should see three containers running:
- `ums-postgres` on port 5432
- `ums-redis` on port 6379
- `ums-minio` on ports 9000 (API) and 9001 (Console)

### 3. Backend Setup

#### Install Dependencies

```bash
cd pern-backend
npm install
```

#### Configure Environment

The `.env` file is already configured for local development:

```env
# PostgreSQL
DATABASE_URL="postgresql://umsuser:umspassword@localhost:5432/umsdb"

# JWT secrets
JWT_SECRET="ums_jwt_secret_change_in_production"
REFRESH_SECRET="ums_refresh_secret_change_in_production"

# MinIO / S3
MINIO_ENDPOINT="http://localhost:9000"
MINIO_ACCESS_KEY="miniouser"
MINIO_SECRET_KEY="miniopassword123"
MINIO_BUCKET="ums-storage"

# Redis
REDIS_URL="redis://localhost:6379"

# Environment
NODE_ENV="development"
PORT=8080
```

#### Run Database Migrations

```bash
npx prisma migrate deploy
```

Or for development (creates migration):

```bash
npx prisma migrate dev
```

#### Seed the Database

```bash
npx tsx prisma/seed.ts
```

This creates the following test accounts:

| Role      | Email                      | Password       |
|-----------|----------------------------|----------------|
| Developer | developer@iiitu.ac.in      | Dev@2026       |
| Admin     | sukhsagar@iiitu.ac.in      | Admin@2026     |
| Faculty   | manish.g@iiitu.ac.in       | Faculty@2026   |
| Student   | 24429@iiitu.ac.in          | Student@2026   |

#### Start Backend Server

```bash
npm run dev
```

The backend will be available at: **http://localhost:8080**

Health check: http://localhost:8080/api/health

### 4. Frontend Setup

Open a new terminal window:

```bash
cd pern-frontend
npm install
npm run dev
```

The frontend will be available at: **http://localhost:3000**

---

## Testing the Application

1. Open your browser and navigate to http://localhost:3000
2. You should see the login page
3. Use any of the test credentials to log in:

### Login as Student
- Email: `24429@iiitu.ac.in`
- Password: `Student@2026`

### Login as Faculty
- Email: `manish.g@iiitu.ac.in`
- Password: `Faculty@2026`

### Login as Admin
- Email: `sukhsagar@iiitu.ac.in`
- Password: `Admin@2026`

### Login as Developer
- Email: `developer@iiitu.ac.in`
- Password: `Dev@2026`

---

## Service URLs

| Service              | URL                              | Description                    |
|----------------------|----------------------------------|--------------------------------|
| Frontend             | http://localhost:3000            | React + Vite application       |
| Backend API          | http://localhost:8080            | Express REST API               |
| Health Check         | http://localhost:8080/api/health | Backend health endpoint        |
| MinIO Console        | http://localhost:9001            | Object storage UI              |
| PostgreSQL           | localhost:5432                   | Database (use pgAdmin/DBeaver) |
| Redis                | localhost:6379                   | Cache server                   |

---

## Development Commands

### Backend Commands

```bash
npm run dev              # Start dev server (tsx watch, hot reload)
npm run build            # Build TypeScript to dist/
npm start                # Start production server (node dist/server.js)
npx prisma generate      # Regenerate Prisma Client
npx prisma migrate dev   # Create new migration
npx prisma migrate deploy # Apply migrations
npx tsx prisma/seed.ts   # Seed database
npx prisma studio        # Open Prisma Studio (database GUI)
```

### Frontend Commands

```bash
npm run dev      # Start Vite dev server with HMR
npm run build    # Build for production (outputs to dist/)
npm run preview  # Preview production build locally
npm run lint     # Run ESLint
```

### Docker Commands

```bash
docker compose up -d        # Start all services
docker compose down          # Stop all services
docker compose logs -f       # View logs
docker compose logs -f ums-postgres  # View logs for specific service
docker compose restart       # Restart services
docker compose down -v       # Remove all data (volumes)
```

---

## Database Management

### Access PostgreSQL Database

#### Using psql (Command Line)

```bash
docker exec -it ums-postgres psql -U umsuser -d umsdb
```

#### Using PostgreSQL Client (pgAdmin, DBeaver, etc.)

- **Host**: localhost
- **Port**: 5432
- **Database**: umsdb
- **Username**: umsuser
- **Password**: umspassword

### Prisma Studio

Prisma Studio provides a visual interface to view and edit database records:

```bash
cd pern-backend
npx prisma studio
```

This opens a browser at http://localhost:5555

---

## Troubleshooting

### Docker Services Not Starting

1. Check if ports are already in use:
   ```bash
   lsof -i :5432  # PostgreSQL
   lsof -i :6379  # Redis
   lsof -i :9000  # MinIO
   ```

2. Stop conflicting services or change ports in `docker-compose.yml`

### Database Connection Issues

1. Ensure Docker containers are running:
   ```bash
   docker compose ps
   ```

2. Wait a few seconds for PostgreSQL to fully initialize on first run

3. Check database logs:
   ```bash
   docker compose logs ums-postgres
   ```

### Backend Won't Start

1. Ensure all dependencies are installed:
   ```bash
   cd pern-backend
   npm install
   ```

2. Regenerate Prisma Client:
   ```bash
   npx prisma generate
   ```

3. Check if port 8080 is available:
   ```bash
   lsof -i :8080
   ```

### Frontend Issues

1. Clear Vite cache:
   ```bash
   cd pern-frontend
   rm -rf node_modules/.vite
   npm run dev
   ```

2. Reinstall dependencies:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### Prisma Migration Issues

If you see migration drift or conflicts:

```bash
npx prisma migrate reset --force
npx tsx prisma/seed.ts
```

---

## Security Notes

**IMPORTANT**: The default credentials are for development only!

Before deploying to production:

1. Change all passwords in the `.env` file
2. Use strong, randomly generated secrets for JWT
3. Enable HTTPS
4. Set `NODE_ENV=production`
5. Update CORS settings in backend

---

## Support

If you encounter issues not covered in this guide:

1. Check the application logs
2. Review the system design document
3. Consult the project documentation
4. Contact the development team
