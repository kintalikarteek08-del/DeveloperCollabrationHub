import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';

import Navbar from './components/common/Navbar';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import DiscoverProjects from './pages/DiscoverProjects';
import ProjectDetails from './pages/ProjectDetails';
import CreateProject from './pages/CreateProject';
import ProjectWorkspace from './pages/ProjectWorkspace';
import MyApplications from './pages/MyApplications';
import DeveloperProfile from './pages/DeveloperProfile';
import EditProfile from './pages/EditProfile';
import Showcase from './pages/Showcase';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <NotificationProvider>
          <Router>
            <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password/:token" element={<ResetPassword />} />
                  <Route path="/discover" element={<DiscoverProjects />} />
                  <Route path="/projects/:id" element={<ProjectDetails />} />
                  <Route path="/showcase" element={<Showcase />} />
                  <Route path="/profile/:id" element={<DeveloperProfile />} />

                  {/* Protected Developer Routes */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/projects/new" element={<CreateProject />} />
                    <Route path="/projects/:id/workspace" element={<ProjectWorkspace />} />
                    <Route path="/my-applications" element={<MyApplications />} />
                    <Route path="/profile/edit" element={<EditProfile />} />
                  </Route>

                  {/* Admin Only Routes */}
                  <Route element={<AdminRoute />}>
                    <Route path="/admin" element={<AdminDashboard />} />
                  </Route>

                  {/* 404 Catch-All */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>

              {/* Global Footer */}
              <footer className="border-t border-surface-800/80 bg-surface-950 py-8 text-center text-xs text-surface-500">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p>© 2026 Developer Collaboration Hub. Built for creators and engineering teams.</p>
                  <div className="flex items-center gap-6 text-surface-400">
                    <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
                    <span className="hover:text-white cursor-pointer transition-colors">Terms</span>
                    <span className="hover:text-white cursor-pointer transition-colors">Community Guidelines</span>
                  </div>
                </div>
              </footer>
            </div>
          </Router>
        </NotificationProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
