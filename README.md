# University Management System (PERN Stack)

A comprehensive university management system for IIIT Una, built with the PERN stack (PostgreSQL, Express, React, Node.js) to manage students, faculty, courses, enrollments, grades, and attendance digitally.

## Overview

The University Management System provides a complete platform for academic administration with role-based access control for Students, Faculty, Admin Staff, and Developers.

## Features

### For Students
- Course Registration
- View Grades & Transcript
- View Attendance
- Profile Management
- Secure Authentication

### For Faculty
- Course Management (Sign up/Claim courses)
- Attendance Marking
- Grade Entry
- View Course Analytics
- Manage Student Enrollments

### For Admin Staff
- User Management (Students, Faculty)
- Course Creation & Management
- Upload Timetables
- Document Templates & Digital Approvals
- System-wide Reports & Analytics

### For Developers
- Root Access
- System Configuration
- Database Management
- API Monitoring

## Technology Stack

### Frontend
- **Library**: React 19 (with Vite 6)
- **Routing**: React Router v6
- **Styling**: TailwindCSS 3
- **State**: Zustand (auth), TanStack React Query v5 (server)
- **HTTP**: Axios (JWT interceptor with silent refresh)
- **Icons**: Lucide React
- **Animations**: Framer Motion

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL 16
- **ORM**: Prisma 7
- **Validation**: Zod
- **Authentication**: JWT (jsonwebtoken) with HttpOnly cookies
- **Caching**: Redis 7
- **Object Storage**: MinIO (S3-compatible)
- **PDF Generation**: Puppeteer + Handlebars

## Project Structure

```
university-management-pern/
├── pern-frontend/             # React + Vite frontend
│   ├── src/
│   │   ├── pages/            # Route page components
│   │   ├── components/       # Reusable UI & layout components
│   │   ├── lib/              # API client & utilities
│   │   ├── store/            # Zustand auth store
│   │   ├── providers/        # Theme & query providers
│   │   ├── types/            # TypeScript types
│   │   ├── App.tsx           # React Router route definitions
│   │   └── main.tsx          # Entry point
│   └── index.html            # Vite HTML entry
│
├── pern-backend/              # Express.js backend API
│   ├── src/
│   │   ├── routes/           # Express route handlers
│   │   ├── services/         # Business logic (MinIO, PDF, password)
│   │   ├── middleware/       # JWT auth middleware
│   │   ├── schemas/          # Zod validation schemas
│   │   ├── app.ts            # Express app setup
│   │   ├── server.ts         # HTTP server entry
│   │   └── prisma.ts         # Prisma client
│   └── prisma/
│       ├── schema.prisma     # Database schema
│       ├── seed.ts           # Database seeding
│       └── migrations/       # Database migrations
│
├── docker-compose.yml         # Docker services (PostgreSQL, Redis, MinIO)
├── deploy.sh                  # One-command deploy script
├── stop.sh                    # Graceful stop script
├── system-design.md           # System architecture & design
├── DEPLOYMENT.md              # Deployment instructions
└── CREDENTIALS.md             # Default user credentials
```

## Quick Start

### Prerequisites

- Node.js (v18+)
- npm (v9+)
- Docker & Docker Compose
- Git

### One-Command Deploy

```bash
chmod +x deploy.sh stop.sh
./deploy.sh --dev
```

This will:
1. Start PostgreSQL, Redis, MinIO via Docker
2. Install backend dependencies & run migrations
3. Seed the database with test data
4. Start the Express API server (port 8080)
5. Start the Vite dev server (port 5173)

### Manual Installation

1. **Start Docker services**
   ```bash
   docker compose up -d
   ```

2. **Set up the backend**
   ```bash
   cd pern-backend
   npm install
   npx prisma migrate deploy
   npx tsx prisma/seed.ts
   npm run dev
   ```

3. **Set up the frontend** (in a new terminal)
   ```bash
   cd pern-frontend
   npm install
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed setup instructions.

## Default Credentials

After seeding the database, use these credentials to log in:

| Role      | Email                     | Password      |
|-----------|---------------------------|---------------|
| Developer | developer@iiitu.ac.in     | Dev@2026      |
| Admin     | sukhsagar@iiitu.ac.in     | Admin@2026    |
| Faculty   | manish.g@iiitu.ac.in      | Faculty@2026  |
| Student   | 24429@iiitu.ac.in         | Student@2026  |

**These are development credentials only!** See [CREDENTIALS.md](./CREDENTIALS.md) for more details.

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - User logout

### Users
- `GET /api/v1/users` - List all users (Admin)
- `POST /api/v1/users` - Create user (Admin)
- `GET /api/v1/users/:id` - Get user details

### Courses
- `GET /api/v1/courses` - List courses
- `POST /api/v1/courses` - Create course (Admin)

### Enrollments
- `POST /api/v1/enrollment` - Enroll in course
- `GET /api/v1/enrollment` - View enrollments

### Academic
- `POST /api/v1/academic/attendance` - Mark attendance (Faculty)
- `POST /api/v1/academic/grades` - Submit grades (Faculty)

## Database Schema

The system uses Prisma ORM with the following main entities:

- **User** - Base user model with role-based access
- **StudentProfile** - Student-specific data
- **FacultyProfile** - Faculty-specific data
- **Course** - Course information
- **Section** - Course sections per semester
- **Enrollment** - Student course enrollments
- **Attendance** - Attendance records
- **Grade** - Grade submissions
- **Session** - Authentication sessions
- **AuditLog** - System audit trail

## Development

### Backend Development

```bash
cd pern-backend
npm run dev          # Start dev server with hot reload (tsx watch)
npx prisma studio    # Open Prisma Studio (DB GUI)
npx prisma generate  # Regenerate Prisma Client
```

### Frontend Development

```bash
cd pern-frontend
npm run dev    # Start Vite dev server with HMR
npm run build  # Build for production (outputs to dist/)
npm run preview # Preview production build
```

### Database Management

```bash
npx prisma migrate dev --name <migration-name>  # Create new migration
npx prisma migrate deploy                        # Apply migrations
npx prisma migrate reset --force                 # Reset database
npm run seed                                      # Seed database
```

## Documentation

- [System Design](./system-design.md) - Architecture and technical design
- [Deployment Guide](./DEPLOYMENT.md) - Local setup and deployment
- [Credentials](./CREDENTIALS.md) - Default user accounts

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Team

**IIIT Una - ICT Department**

For questions or support, please contact the development team.

---

Made with care for IIIT Una
