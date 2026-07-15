import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Public & Authentication Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import ResetPassword from './pages/auth/ResetPassword';
import UpdateUsername from './pages/auth/UpdateUsername';

// Dashboard Pages
import SuperAdminDashboard from './pages/operations-admin/SuperAdminDashboard';

import AcademicAdminDashboard from './pages/operations-admin/AcademicAdminDashboard';
import AcademicTeachersManagement from './pages/operations-admin/AcademicTeachersManagement';
import AcademicSubjectsManagement from './pages/operations-admin/AcademicSubjectsManagement';
import AcademicClassAssignments from './pages/operations-admin/AcademicClassAssignments';
import AcademicResultsManagement from './pages/operations-admin/AcademicResultsManagement';

import StudentAdminDashboard from './pages/operations-admin/StudentAdminDashboard';
import FinanceAdminDashboard from './pages/operations-admin/FinanceAdminDashboard';
import OperationsAdminDashboard from './pages/operations-admin/OperationsAdminDashboard';
import TeacherDashboard from './pages/operations-admin/TeacherDashboard';
import StudentDashboard from './pages/operations-admin/StudentDashboard';
import StudentProfile from './pages/operations-admin/StudentProfile';
import StudentAttendance from './pages/operations-admin/StudentAttendance';
import Application from './pages/operations-admin/Application';
import StudentAssignments from './pages/operations-admin/StudentAssignments';
import StudentExams from './pages/operations-admin/StudentExams';
import StudentResults from './pages/operations-admin/StudentResults';
import TeacherAttendanceMark from './pages/operations-admin/TeacherAttendanceMark';
import TeacherApplicationReview from './pages/operations-admin/TeacherApplicationReview';
import TeacherAssignments from "./pages/operations-admin/TeacherAssignments";
import TeacherMyClasses from "./pages/operations-admin/TeacherMyClasses";
import Settings from './pages/auth/Settings';

import Events from "./pages/operations-admin/Events";
import TeacherManagement from "./pages/operations-admin/TeacherManagement";
import StudentManagement from "./pages/operations-admin/StudentManagement";
import AdminManager from './pages/operations-admin/AdminManager';
import Exams from './pages/operations-admin/Exams';
import AdminStudentProfileView from './pages/operations-admin/AdminStudentProfileView';

// Route Guard Component
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role') || '';

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role.toLowerCase())) {
    const rolePaths: Record<string, string> = {
      'super-admin': "/super-admin",
      'student-admin': "/student-admin",
      'academic-admin': "/academic-admin",
      'finance-admin': "/finance-admin",
      'operations-admin': "/operations-admin",
      'teacher': "/teacher",
      'student': "/student",
    };
    return <Navigate to={rolePaths[role.toLowerCase()] || "/login"} replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ResetPassword />} />
        <Route path="/update-username" element={<UpdateUsername />} />
        <Route path="/settings" element={
          <ProtectedRoute allowedRoles={['super-admin', 'student-admin', 'academic-admin', 'finance-admin', 'operations-admin', 'teacher', 'student']}>
            <Settings />
          </ProtectedRoute>
        } />

        {/* Secure Role-Based Dashboard Routes */}
        <Route path="/super-admin" element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <SuperAdminDashboard />
          </ProtectedRoute>
        } />

        <Route path="/academic-admin" element={
          <ProtectedRoute allowedRoles={['academic-admin', 'super-admin']}>
            <AcademicAdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/academic-admin/teachers" element={
          <ProtectedRoute allowedRoles={['academic-admin', 'super-admin']}>
            <AcademicTeachersManagement />
          </ProtectedRoute>
        } />
        <Route path="/academic-admin/subjects" element={
          <ProtectedRoute allowedRoles={['academic-admin', 'super-admin']}>
            <AcademicSubjectsManagement />
          </ProtectedRoute>
        } />
        <Route path="/academic-admin/classes" element={
          <ProtectedRoute allowedRoles={['academic-admin', 'super-admin']}>
            <AcademicClassAssignments />
          </ProtectedRoute>
        } />
        <Route path="/academic-admin/results" element={
          <ProtectedRoute allowedRoles={['academic-admin', 'super-admin']}>
            <AcademicResultsManagement />
          </ProtectedRoute>
        } />
        <Route path="/academic-admin/attendance" element={
          <ProtectedRoute allowedRoles={['academic-admin', 'super-admin']}>
            <TeacherAttendanceMark />
          </ProtectedRoute>
        } />

        <Route path="/student-admin" element={
          <ProtectedRoute allowedRoles={['student-admin', 'super-admin']}>
            <StudentAdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/finance-admin" element={
          <ProtectedRoute allowedRoles={['finance-admin', 'super-admin']}>
            <FinanceAdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/operations-admin" element={
          <ProtectedRoute allowedRoles={['operations-admin', 'super-admin']}>
            <OperationsAdminDashboard />
          </ProtectedRoute>
        } />
      
        <Route path="/teacher" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherDashboard />
          </ProtectedRoute>
        } />
        <Route path="/teacher/attendanceMark" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherAttendanceMark />
          </ProtectedRoute>
        } />
        <Route path="/teacher/application" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherApplicationReview/>
          </ProtectedRoute>
        } />
        <Route path="/teacher/assignments" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherAssignments />
          </ProtectedRoute>
        } />
        <Route path="/teacher/myclasses" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherMyClasses />
          </ProtectedRoute>
        } />
        
        <Route path="/student" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        } />
        <Route path="/student/profile" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentProfile />
          </ProtectedRoute>
        } />
        <Route path="/student/attendance" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentAttendance />
          </ProtectedRoute>
        } />
        <Route path="/student/exams" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentExams />
          </ProtectedRoute>
        } />
        <Route path="/student/results" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentResults />
          </ProtectedRoute>
        } />
        <Route path="/student/application" element={
          <ProtectedRoute allowedRoles={['student']}>
            <Application />
          </ProtectedRoute>
        } />
        <Route path="/student/assignments" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentAssignments />
          </ProtectedRoute>
        } />

        <Route path="/operations-admin/events" element={
          <ProtectedRoute allowedRoles={['operations-admin', 'super-admin']}>
            <Events />
          </ProtectedRoute>
        } />
        <Route path="/teachers" element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <TeacherManagement />
          </ProtectedRoute>
        } />
        <Route path="/students" element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <StudentManagement />
          </ProtectedRoute>
        } />
        <Route path="/manage/:role" element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminManager />
          </ProtectedRoute>
        } />
        <Route path="/exams" element={
          <ProtectedRoute allowedRoles={['super-admin', 'academic-admin']}>
            <Exams />
          </ProtectedRoute>
        } />
        <Route path="/admin/student-profiles" element={
          <ProtectedRoute allowedRoles={['super-admin', 'student-admin']}>
            <AdminStudentProfileView />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
};

export default AppRoutes;