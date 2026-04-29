import { Routes, Route, Navigate } from 'react-router-dom';
import { Providers } from '@/providers/Providers';
import { ProtectedRoute } from '@/components/layout/protected-route';

import LoginPage from '@/pages/login';
import DashboardLayout from '@/pages/dashboard-layout';
import DashboardPage from '@/pages/dashboard';
import AttendancePage from '@/pages/attendance';
import CoursesPage from '@/pages/courses';
import DegreesPage from '@/pages/degrees';
import EnrollmentsPage from '@/pages/enrollments';
import GradesPage from '@/pages/grades';
import HealthPage from '@/pages/health';
import MyCoursesPage from '@/pages/my-courses';
import MySectionsPage from '@/pages/my-sections';
import ProfilePage from '@/pages/profile';
import SectionsPage from '@/pages/sections';
import SemestersPage from '@/pages/semesters';
import TranscriptPage from '@/pages/transcript';
import UsersPage from '@/pages/users';

export default function App() {
  return (
    <Providers>
      <Routes>
        {/* Root redirects to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Dashboard (protected via layout) */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="profile" element={<ProfilePage />} />

          {/* Admin / Developer Only */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'DEVELOPER']} />}>
            <Route path="users" element={<UsersPage />} />
            <Route path="degrees" element={<DegreesPage />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="semesters" element={<SemestersPage />} />
            <Route path="sections" element={<SectionsPage />} />
            <Route path="health" element={<HealthPage />} />
          </Route>

          {/* Shared (All Authenticated Roles) */}
          <Route element={<ProtectedRoute allowedRoles={['STUDENT', 'FACULTY', 'ADMIN', 'DEVELOPER']} />}>
            <Route path="enrollments" element={<EnrollmentsPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="grades" element={<GradesPage />} />
          </Route>

          {/* Faculty Only */}
          <Route element={<ProtectedRoute allowedRoles={['FACULTY', 'ADMIN', 'DEVELOPER']} />}>
            <Route path="my-sections" element={<MySectionsPage />} />
          </Route>

          {/* Student Only */}
          <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
            <Route path="enrollments" element={<EnrollmentsPage />} />
            <Route path="my-courses" element={<MyCoursesPage />} />
            <Route path="transcript" element={<TranscriptPage />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Providers>
  );
}
