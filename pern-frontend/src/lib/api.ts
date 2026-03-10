import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  User,
  Course,
  Semester,
  Section,
  Enrollment,
  Attendance,
  Grade,
  GPAData,
  SectionAttendanceStats,
  LoginResponse,
  HealthResponse,
  UserProfile,
} from '@/types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor: attach access token ─────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = sessionStorage.getItem('ums_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor: handle 401, attempt refresh ────────────────────
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const original = err.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (err.response?.status === 401 && !original._retry) {
      if (original.url === '/auth/refresh') {
        sessionStorage.removeItem('ums_token');
        window.location.href = '/login';
        return Promise.reject(err);
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token: string) => {
            if (original.headers) original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post<{ token: string }>('/auth/refresh');
        const newToken = data.token;
        sessionStorage.setItem('ums_token', newToken);
        refreshQueue.forEach((cb) => cb(newToken));
        refreshQueue = [];
        if (original.headers) original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        sessionStorage.removeItem('ums_token');
        refreshQueue = [];
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);

// ─── Health ──────────────────────────────────────────────────────────────────
export const healthApi = {
  check: (): Promise<HealthResponse> =>
    axios.get<HealthResponse>(`${BASE_URL}/api/health`).then((r) => r.data),
};

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string): Promise<LoginResponse> =>
    api.post('/auth/login', { email, password }).then((r) => r.data),
  logout: (): Promise<{ success: boolean }> =>
    api.post('/auth/logout').then((r) => r.data),
  refresh: (): Promise<{ token: string }> =>
    api.post('/auth/refresh').then((r) => r.data),
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const usersApi = {
  list: (params?: { role?: string; search?: string }): Promise<User[]> =>
    api.get('/users', { params }).then((r) => r.data.users),

  get: (id: string): Promise<User> =>
    api.get(`/users/${id}`).then((r) => r.data.user),

  me: (): Promise<UserProfile> =>
    api.get('/users/me/profile').then((r) => r.data),

  provision: (payload: Record<string, unknown>): Promise<{ success: boolean; user: User }> =>
    api.post('/users/provision', payload).then((r) => r.data),

  update: (id: string, payload: Record<string, unknown>): Promise<{ success: boolean; user: Pick<User, 'id' | 'name'> }> =>
    api.patch(`/users/${id}`, payload).then((r) => r.data),

  delete: (id: string): Promise<{ success: boolean; message: string }> =>
    api.delete(`/users/${id}`).then((r) => r.data),

  changePassword: (payload: { currentPassword: string; newPassword: string }): Promise<{ success: boolean; message: string }> =>
    api.post('/users/change-password', payload).then((r) => r.data),
};

// ─── Courses ──────────────────────────────────────────────────────────────────
export const coursesApi = {
  list: (): Promise<Course[]> =>
    api.get('/courses').then((r) => r.data.courses),

  get: (id: string): Promise<Course> =>
    api.get(`/courses/${id}`).then((r) => r.data.course),

  create: (payload: Record<string, unknown>): Promise<{ success: boolean; course: Course }> =>
    api.post('/courses', payload).then((r) => r.data),

  update: (id: string, payload: Record<string, unknown>): Promise<{ success: boolean; course: Course }> =>
    api.patch(`/courses/${id}`, payload).then((r) => r.data),

  delete: (id: string): Promise<{ success: boolean; message: string }> =>
    api.delete(`/courses/${id}`).then((r) => r.data),
};

// ─── Semesters ────────────────────────────────────────────────────────────────
export const semestersApi = {
  list: (): Promise<Semester[]> =>
    api.get('/courses/semesters/list').then((r) => r.data.semesters),

  active: (): Promise<Semester | null> =>
    api.get('/courses/semesters/active').then((r) => r.data.semester),

  create: (payload: Record<string, unknown>): Promise<{ success: boolean; semester: Semester }> =>
    api.post('/courses/semesters', payload).then((r) => r.data),

  activate: (id: string): Promise<{ success: boolean; semester: Semester }> =>
    api.patch(`/courses/semesters/${id}/activate`).then((r) => r.data),
};

// ─── Sections ─────────────────────────────────────────────────────────────────
export const sectionsApi = {
  available: (): Promise<Section[]> =>
    api.get('/courses/sections/available').then((r) => r.data.sections),

  get: (id: string): Promise<Section> =>
    api.get(`/courses/sections/${id}`).then((r) => r.data.section),

  create: (payload: Record<string, unknown>): Promise<{ success: boolean; section: Section }> =>
    api.post('/courses/sections', payload).then((r) => r.data),

  update: (id: string, payload: Record<string, unknown>): Promise<{ success: boolean; section: Section }> =>
    api.patch(`/courses/sections/${id}`, payload).then((r) => r.data),

  delete: (id: string): Promise<{ success: boolean; message: string }> =>
    api.delete(`/courses/sections/${id}`).then((r) => r.data),
};

// ─── Enrollment ───────────────────────────────────────────────────────────────
export const enrollmentApi = {
  register: (sectionId: string): Promise<{ success: boolean; enrollment: Enrollment }> =>
    api.post('/enrollment/register', { sectionId }).then((r) => r.data),

  drop: (sectionId: string): Promise<{ success: boolean; message: string }> =>
    api.post('/enrollment/drop', { sectionId }).then((r) => r.data),

  myEnrollments: (): Promise<Enrollment[]> =>
    api.get('/enrollment/my-enrollments').then((r) => r.data.enrollments),

  claim: (sectionId: string): Promise<{ success: boolean; section: Section }> =>
    api.post('/enrollment/claim', { sectionId }).then((r) => r.data),

  release: (sectionId: string): Promise<{ success: boolean; message: string }> =>
    api.post('/enrollment/release', { sectionId }).then((r) => r.data),

  mySections: (): Promise<Section[]> =>
    api.get('/enrollment/my-sections').then((r) => r.data.sections),

  all: (params?: { semesterId?: string; courseId?: string; status?: string }): Promise<Enrollment[]> =>
    api.get('/enrollment/all', { params }).then((r) => r.data.enrollments),
};

// ─── Academic ─────────────────────────────────────────────────────────────────
export const academicApi = {
  recordAttendance: (payload: Record<string, unknown>): Promise<{ success: boolean; attendance: Attendance }> =>
    api.post('/academic/attendance', payload).then((r) => r.data),

  bulkAttendance: (payload: Record<string, unknown>): Promise<{ success: boolean; count: number }> =>
    api.post('/academic/attendance/bulk', payload).then((r) => r.data),

  attendanceBySection: (sectionId: string): Promise<Attendance[]> =>
    api.get(`/academic/attendance/section/${sectionId}`).then((r) => r.data.attendances),

  attendanceByStudent: (studentId: string): Promise<SectionAttendanceStats[]> =>
    api.get(`/academic/attendance/student/${studentId}`).then((r) => {
      const stats: Array<{ section: Section; total: number; present: number; absent: number }> =
        r.data.statistics ?? [];
      return stats.map((s) => ({
        ...s,
        percentage: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0,
      }));
    }),

  recordGrade: (payload: Record<string, unknown>): Promise<{ success: boolean; grade: Grade }> =>
    api.post('/academic/grade', payload).then((r) => r.data),

  bulkGrades: (payload: Record<string, unknown>): Promise<{ success: boolean; count: number }> =>
    api.post('/academic/grade/bulk', payload).then((r) => r.data),

  gradesBySection: (sectionId: string): Promise<Grade[]> =>
    api.get(`/academic/grade/section/${sectionId}`).then((r) => r.data.grades),

  gradesByStudent: (studentId: string): Promise<Grade[]> =>
    api.get(`/academic/grade/student/${studentId}`).then((r) => r.data.grades),

  gpa: (studentId: string): Promise<GPAData> =>
    api.get(`/academic/gpa/${studentId}`).then((r) => r.data),

  transcript: (studentId: string): Promise<Blob> =>
    api
      .get(`/academic/transcript/${studentId}`, { responseType: 'blob' })
      .then((r) => r.data),
};
