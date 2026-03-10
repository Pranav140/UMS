# User Credentials - Development Environment

**WARNING**: These credentials are for LOCAL DEVELOPMENT ONLY. Never use in production!

## Default User Accounts

### Developer (Super User)
- **Email**: developer@iiitu.ac.in
- **Password**: Dev@2026
- **Role**: DEVELOPER
- **Access**: Root access to all system features

### Admin Staff
- **Email**: sukhsagar@iiitu.ac.in
- **Password**: Admin@2026
- **Role**: ADMIN
- **Access**: User management, course creation, system administration

### Faculty
- **Email**: manish.g@iiitu.ac.in
- **Password**: Faculty@2026
- **Role**: FACULTY
- **Department**: Computer Science & Engineering
- **Title**: Assistant Professor
- **Access**: Grade entry, attendance marking, course management

### Student
- **Email**: 24429@iiitu.ac.in
- **Password**: Student@2026
- **Role**: STUDENT
- **Enrollment Year**: 2024
- **Major**: Computer Science & Engineering
- **Access**: Course registration, view grades, view attendance

---

## How to Create Additional Users

You can seed more users by editing `pern-backend/prisma/seed.ts` and running:

```bash
cd pern-backend
npx tsx prisma/seed.ts
```

Or manually create users via the Admin interface once logged in.

---

## Password Security

**Current Implementation**: Argon2 password hashing via `@node-rs/argon2`

**Production Requirements**:
- Enforce strong password policies
- Implement password reset functionality
- Add multi-factor authentication (MFA)

---

## Resetting Database

To reset the database and re-create all users:

```bash
cd pern-backend
npx prisma migrate reset --force
npx tsx prisma/seed.ts
```

**Note**: This will delete ALL data!
