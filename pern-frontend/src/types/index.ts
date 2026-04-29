// ─── User & Auth ────────────────────────────────────────────────────────────

export type Role = 'STUDENT' | 'FACULTY' | 'ADMIN' | 'DEVELOPER';
export type GradeStatus = 'DRAFT' | 'FINALIZED';

// ─── Course Types ───────────────────────────────────────────────────────────
export type CourseType = 'THEORY' | 'THEORY_LAB' | 'LAB' | 'PROJECT';
export type CourseCategory = 'MAJOR' | 'MINOR';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
  updatedAt?: string;
  studentProfile?: StudentProfile | null;
  facultyProfile?: FacultyProfile | null;
}

export interface AuthState {
  user: Pick<User, 'id' | 'name' | 'role' | 'email'> | null;
  token: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: Pick<User, 'id' | 'name' | 'role' | 'email'>;
}

// ─── Profiles ────────────────────────────────────────────────────────────────

export interface StudentProfile {
  id: string;
  userId: string;
  enrollmentYear: number;
  degreeId: string | null;
  major: string;
  degree?: Degree | null;
}

export interface Degree {
  id: string;
  code: string;       // Branch code (CSE, ECE, IT, etc.)
  name: string;       // Full name
  description: string | null;
  isMajor: boolean;   // true for major degrees, false for minor
  createdAt?: string;
  updatedAt?: string;
}

export interface FacultyProfile {
  id: string;
  userId: string;
  department: string;
  title: string | null;
  user?: User;
  sectionsTeaching?: Section[];
}

/** /users/me/profile returns User fields spread at top level with profiles included */
export interface UserProfile extends User {
  studentProfile?: StudentProfile | null;
  facultyProfile?: (FacultyProfile & {
    sectionsTeaching?: (Section & { course?: Course; semester?: Semester })[];
  }) | null;
  enrollments?: Enrollment[];
}

// ─── Academic Domain ──────────────────────────────────────────────────────────

export interface Course {
  id: string;
  code: string;
  title: string;
  description: string | null;
  credits: number;
  theoryCredits?: number | null;
  labCredits?: number | null;
  type: CourseType;           // THEORY, THEORY_LAB, etc.
  category: CourseCategory;   // MAJOR or MINOR
  createdAt?: string;
  updatedAt?: string;
  sections?: Section[];
}

export interface Semester {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  sections?: Section[];
}

export interface Section {
  id: string;
  courseId: string;
  semesterId: string;
  sectionCode: string;        // Unique identifier for section group (A, B, C, etc.)
  capacity: number;
  facultyId: string | null;
  course?: Course;
  semester?: Semester;
  faculty?: FacultyProfile | null;
  enrollments?: Enrollment[];
  _count?: { enrollments: number };
}

export interface Enrollment {
  id: string;
  studentId: string;
  sectionId: string;
  status: 'ENROLLED' | 'DROPPED';
  createdAt: string;
  section?: Section;
  student?: User;
}

export interface Attendance {
  id: string;
  studentId: string;
  sectionId: string;
  date: string;
  isPresent: boolean;
  createdAt?: string;
  student?: Pick<User, 'id' | 'name' | 'email'>;
  section?: Section;
}

export interface SectionAttendanceStats {
  section: Section;
  total: number;
  present: number;
  absent: number;
  percentage: number;
}

export interface Grade {
  id: string;
  studentId: string;
  sectionId: string;
  
  theoryCa: number | null;
  theoryMt: number | null;
  theoryEs: number | null;
  labCa: number | null;
  labFr: number | null;
  labEs: number | null;
  projectCa: number | null;
  projectMr: number | null;
  projectEs: number | null;

  score: number | null;        // Final calculated score
  letter: string | null;
  status: GradeStatus;
  createdAt: string;
  updatedAt?: string;
  student?: User;
  section?: Section;
}

export interface GPAData {
  studentId: string;
  cumulativeGPA: string;
  totalCredits: number;
  semesterBreakdown: {
    semester: Semester;
    gpa: string;
    credits: number;
  }[];
}

// ─── API Helpers ──────────────────────────────────────────────────────────────

export interface ApiError {
  error?: string;
  message?: string;
  statusCode?: number;
}

export interface HealthResponse {
  status: 'OK' | 'DEGRADED' | 'ERROR';
  services?: {
    api: boolean;
    database: boolean;
  };
  timestamp?: string;
}

// ─── Provision ────────────────────────────────────────────────────────────────

export interface ProvisionUserPayload {
  email: string;
  name: string;
  role: Role;
  initialPassword: string;
  profileData?: {
    enrollmentYear?: number;
    major?: string;
    department?: string;
    title?: string;
  };
}
