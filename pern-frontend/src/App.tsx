import { Routes, Route, Navigate } from 'react-router-dom';
import { Providers } from '@/providers/Providers';

import LoginPage from '@/pages/LoginPage';
import DashboardLayout from '@/pages/DashboardLayout';
import DashboardPage from '@/pages/DashboardPage';
import AttendancePage from '@/pages/AttendancePage';
import CoursesPage from '@/pages/CoursesPage';
import EnrollmentsPage from '@/pages/EnrollmentsPage';
import GradesPage from '@/pages/GradesPage';
import HealthPage from '@/pages/HealthPage';
import MyCoursesPage from '@/pages/MyCoursesPage';
import MySectionsPage from '@/pages/MySectionsPage';
import ProfilePage from '@/pages/ProfilePage';
import SectionsPage from '@/pages/SectionsPage';
import SemestersPage from '@/pages/SemestersPage';
import TranscriptPage from '@/pages/TranscriptPage';
import UsersPage from '@/pages/UsersPage';

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
