Student:
    - Login
    - Course Registration
    - View Grades
    - View Attendance
    - View Transcript
    - View Profile
    - Edit Profile
    - Change Password
    - Logout

Faculty:
    - Course Signup(Claim - assigned from admin /Accept - self signup) for each semester
    - Grade entry for each course
    - Attendance entry for each course
    - View Attendance
    - View Grades
    - View Transcript
    - View Profile
    - Edit Profile
    - Change Password
    - Logout


Admin Staff:
    - Add students to the system
    - Add faculty to the system
    - Add courses to the system
    - Upload timetable excel sheet
    - Create documents template for FORMS, APPROVAL Letters, etc [Admin can add new templates] (Task is to all digital approval on the document format as needed by the legal and beuraucracy)
    - Manage and create and add new fields and things to the schema of faculty and student
    - View Course Registration Data(from students)
    - View Course Signup Data(from faculty)
    - View Attendance Data(from faculty)
    - View Grades Data(from faculty)
    - View Transcript Data(from faculty)
    - View Profile
    - Edit Profile
    - Change Password
    - Logout

Developers:
    - Root access [Fixed secure logins and registrations with password updates]

## Architecture & Technology Stack (PERN Stack)

**Core Technologies**
- **Frontend:** React 19 + Vite 6, React Router v6, TailwindCSS
- **Backend API:** Node.js with Express.js
- **Database & ORM:** PostgreSQL 16 & Prisma 7
- **Caching / Background Jobs:** Redis 7 & BullMQ
- **Object Storage:** MinIO (S3 API)
- **PDF Generation:** Puppeteer (Headless Chromium)

### Phase 1 — Foundation

#### 1. Database Schema & Migration 
- **Tooling:** Prisma schema with automated database migrations (`npx prisma migrate dev`).
- **Core Entities:** `User`, `Role`, `Session`, `AuditLog`.
- **RBAC Architecture:** User types (`STUDENT`, `FACULTY`, `ADMIN`, `DEVELOPER`) strictly defined via Prisma Enums.

#### 2. Authentication & Security
- **Token Management:** Implemented via `jsonwebtoken`. Access tokens (15 minutes) and Refresh tokens secured via HttpOnly, SameSite cookies.
- **Google OAuth 2.0:** Authentication logic using Google APIs for `@iiitu.ac.in` email domains.
- **Middleware:** Express middleware to validate token roles before granting route access.
- **Audit Trails:** Request interceptors to write sensitive actions (mutations) to the `AuditLog` table asynchronously.

#### 3. User Provisioning API
- Admin-facing endpoints for securely provisioning user accounts.
- **Email Delivery:** Integration through Node SMTP transport (Nodemailer) pointing at Stalwart Mail server to send welcome credentials.
- **Cryptography:** Password hashing strictly relying on `@node-rs/argon2`.

#### 4. Secure File Storage (MinIO)
- SDK integration using `@aws-sdk/client-s3` (S3 compatible wrapper).
- **Pre-signed URLs:** API yields pre-signed URLs to clients for direct MinIO uploads (e.g., student documents, profile updates) to prevent backend bottlenecks.

### Phase 2 — Academic Core

#### 1. Academic Data Models
- **Schema Expansion:** Prisma definitions for `Course`, `Semester`, `Section`, `Enrollment`, `Attendance`, and `Grade`.
- **Integrity Validation:** Leveraging Prisma-level relational integrity and application-level checks.

#### 2. Course Registration & Signup Flows
- **Student Registration Engine:** Highly concurrent endpoint utilizing Prisma interactive `$transaction` structures to safely check prerequisite completion and section capacity limits in a single DB roundtrip.
- **Faculty Claim System:** Opt-in system where faculty assign themselves to sections, managed by department constraint validations.

#### 3. Attendance & Grading System
- **Request Validation:** Strict validation via `Zod` ensuring structured bulk-data inputs.
- **Attendance Ledger:** Daily/Weekly boolean/enum flags representing presence, with calculated rollups.
- **Grade Book:** Submission pipelines taking raw scores to computed letter grades and credit-normalized GPAs. Incorporates a locking sequence (draft -> finalized) to restrict modifications.

#### 4. PDF Generation & Transcripts
- Data aggregation layer gathering historical term-by-term performance.
- **Templating:** Use Handlebars to inject data into official university HTML transcript structures.
- **Headless Print:** Puppeteer intercepts the HTML, yielding a standardized graphical PDF buffer. Resulting reports can be archived immediately in MinIO for high-availability access.
