import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyEmail from './pages/auth/VerifyEmail';
import ForgotPassword from './pages/auth/ForgotPassword';
import Dashboard from './pages/student/Dashboard';
import Profile from './pages/student/Profile';
import Certificates from './pages/student/Certificates';
import Leaderboard from './pages/student/Leaderboard';
import Bookmarks from './pages/student/Bookmarks';
import Notifications from './pages/student/Notifications';
import Hackathons from './pages/hackathons/Hackathons';
import Teams from './pages/team/Teams';
import Submission from './pages/submission/Submission';
import Home from './pages/home/Home';

// Organizer (college + company)
import OrgDashboard from './pages/organizer/OrgDashboard';
import OrgProfile from './pages/organizer/OrgProfile';
import MyHackathons from './pages/organizer/MyHackathons';
import HackathonForm from './pages/organizer/HackathonForm';
import ManageHackathon from './pages/organizer/ManageHackathon';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import Verification from './pages/admin/Verification';
import AdminHackathons from './pages/admin/AdminHackathons';
import Broadcast from './pages/admin/Broadcast';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{
          style: { fontFamily: "'Source Serif 4', serif", fontSize: '0.875rem', borderRadius: '10px', boxShadow: '0 4px 20px rgba(56,73,89,0.12)' },
          success: { iconTheme: { primary: '#6aaa8a', secondary: 'white' } },
          error: { iconTheme: { primary: '#c0706a', secondary: 'white' } },
        }} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route element={<AppLayout />}>
            {/* Student */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/hackathons" element={<Hackathons />} />
            <Route path="/hackathons/:id" element={<Hackathons />} />
            <Route path="/bookmarks" element={<Bookmarks />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/submissions" element={<Submission />} />
            <Route path="/certificates" element={<Certificates />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/notifications" element={<Notifications />} />

            {/* Organizer */}
            <Route path="/organizer" element={<OrgDashboard />} />
            <Route path="/organizer/profile" element={<OrgProfile />} />
            <Route path="/organizer/hackathons" element={<MyHackathons />} />
            <Route path="/organizer/hackathons/new" element={<HackathonForm />} />
            <Route path="/organizer/hackathons/:id" element={<ManageHackathon />} />
            <Route path="/organizer/hackathons/:id/edit" element={<HackathonForm />} />

            {/* Admin */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<ManageUsers />} />
            <Route path="/admin/verification" element={<Verification />} />
            <Route path="/admin/hackathons" element={<AdminHackathons />} />
            <Route path="/admin/broadcast" element={<Broadcast />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
