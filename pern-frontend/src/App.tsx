import { Routes, Route, Navigate } from 'react-router-dom';
import { Providers } from '@/providers/Providers';

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
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="degrees" element={<DegreesPage />} />
          <Route path="enrollments" element={<EnrollmentsPage />} />
          <Route path="grades" element={<GradesPage />} />
          <Route path="health" element={<HealthPage />} />
          <Route path="my-courses" element={<MyCoursesPage />} />
          <Route path="my-sections" element={<MySectionsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="sections" element={<SectionsPage />} />
          <Route path="semesters" element={<SemestersPage />} />
          <Route path="transcript" element={<TranscriptPage />} />
          <Route path="users" element={<UsersPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Providers>
  );
}
