// ─── User & Auth ────────────────────────────────────────────────────────────

export type Role = 'STUDENT' | 'FACULTY' | 'ADMIN' | 'DEVELOPER';
export type GradeStatus = 'DRAFT' | 'FINALIZED';

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
  major: string;
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
  score: number | null;
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
  status: 'OK' | 'ERROR';
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
