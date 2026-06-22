import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Students from './pages/Students';
import StudentProgress from './pages/StudentProgress';
import Classrooms from './pages/Classrooms';
import Leaders from './pages/Leaders';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected — nested under MainLayout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index               element={<Dashboard />}       />
          <Route path="attendance"   element={<Attendance />}      />
          <Route path="students"     element={<Students />}        />
          <Route path="progress"     element={<StudentProgress />} />
          <Route path="classrooms"   element={<Classrooms />}      />
          <Route path="leaders"      element={<Leaders />}         />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
