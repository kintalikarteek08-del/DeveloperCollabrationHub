import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Code2,
  Compass,
  LayoutDashboard,
  FolderGit2,
  Bell,
  CheckCircle2,
  LogOut,
  User,
  ShieldAlert,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 w-full glass border-b border-surface-800/80 bg-surface-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform duration-200">
                <Code2 className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-surface-100 to-surface-400 bg-clip-text text-transparent">
                DevCollab<span className="text-brand-400">Hub</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              <Link
                to="/discover"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive('/discover')
                    ? 'bg-brand-500/10 text-brand-400'
                    : 'text-surface-300 hover:text-white hover:bg-surface-800/50'
                }`}
              >
                <Compass className="w-4 h-4" />
                Discover Projects
              </Link>
              <Link
                to="/showcase"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive('/showcase')
                    ? 'bg-brand-500/10 text-brand-400'
                    : 'text-surface-300 hover:text-white hover:bg-surface-800/50'
                }`}
              >
                <FolderGit2 className="w-4 h-4" />
                Showcase
              </Link>
              {isAuthenticated && (
                <>
                  <Link
                    to="/dashboard"
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      isActive('/dashboard')
                        ? 'bg-brand-500/10 text-brand-400'
                        : 'text-surface-300 hover:text-white hover:bg-surface-800/50'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <Link
                    to="/my-applications"
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/my-applications')
                        ? 'bg-brand-500/10 text-brand-400'
                        : 'text-surface-300 hover:text-white hover:bg-surface-800/50'
                    }`}
                  >
                    My Applications
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Notifications Dropdown */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 rounded-xl text-surface-300 hover:text-white hover:bg-surface-800/80 transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-surface-900 border border-surface-700/80 shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="p-3.5 border-b border-surface-800 flex items-center justify-between bg-surface-900/90 backdrop-blur-md">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm text-surface-100">Notifications</h4>
                          {unreadCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand-500/20 text-brand-300">
                              {unreadCount} unread
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-brand-400 hover:text-brand-300 transition-colors font-medium flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-surface-800/50">
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center text-xs text-surface-400">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.slice(0, 10).map((n) => (
                            <div
                              key={n._id}
                              onClick={() => {
                                if (!n.read) markAsRead(n._id);
                                setShowNotifications(false);
                                const projId = n.relatedProject?._id || n.relatedProject;
                                if ((n.type === 'application_received' || n.type === 'application_accepted' || n.type === 'task_assigned' || n.type === 'chat_message') && projId) {
                                  navigate(`/projects/${projId}/workspace`);
                                } else if (n.type === 'application_rejected') {
                                  navigate('/my-applications');
                                } else if (projId) {
                                  navigate(`/projects/${projId}`);
                                }
                              }}
                              className={`p-3.5 hover:bg-surface-800/40 transition-colors cursor-pointer text-left ${
                                !n.read ? 'bg-brand-950/20 border-l-2 border-brand-500' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <p className="text-xs font-semibold text-surface-200">
                                  {n.title}
                                </p>
                                <span className="text-[10px] text-surface-500 whitespace-nowrap">
                                  {new Date(n.createdAt).toLocaleDateString([], {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                              </div>
                              <p className="text-xs text-surface-400 line-clamp-2 leading-relaxed">
                                {n.message}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-surface-800/80 transition-colors"
                  >
                    <img
                      src={
                        user.profileImage ||
                        `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name)}`
                      }
                      alt={user.name}
                      className="w-8 h-8 rounded-lg object-cover border border-surface-700/80 shadow-xs"
                    />
                    <span className="hidden sm:block text-xs font-medium text-surface-200">
                      {user.name.split(' ')[0]}
                    </span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-surface-900 border border-surface-700/80 shadow-2xl p-1.5 z-50">
                      <div className="px-3 py-2 border-b border-surface-800 mb-1">
                        <p className="text-sm font-semibold text-surface-100">{user.name}</p>
                        <p className="text-xs text-surface-400 truncate">{user.email}</p>
                        <span className="mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-surface-800 text-brand-300">
                          {user.role}
                        </span>
                      </div>

                      <Link
                        to={`/profile/${user._id}`}
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-surface-300 hover:text-white hover:bg-surface-800 transition-colors"
                      >
                        <User className="w-4 h-4 text-surface-400" />
                        My Profile
                      </Link>
                      <Link
                        to="/profile/edit"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-surface-300 hover:text-white hover:bg-surface-800 transition-colors"
                      >
                        <Code2 className="w-4 h-4 text-surface-400" />
                        Edit Skills & Bio
                      </Link>
                      <Link
                        to="/projects/new"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-brand-400 hover:bg-brand-950/40 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Create New Project
                      </Link>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-amber-400 hover:bg-amber-950/30 transition-colors"
                        >
                          <ShieldAlert className="w-4 h-4" />
                          Admin Moderation
                        </Link>
                      )}

                      <div className="border-t border-surface-800 my-1" />

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-950/30 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-surface-200 hover:text-white hover:bg-surface-800 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white transition-all shadow-md shadow-brand-600/30"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-surface-300 hover:text-white hover:bg-surface-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-surface-800 flex flex-col gap-1.5">
            <Link
              to="/discover"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm text-surface-300 hover:text-white hover:bg-surface-800 flex items-center gap-2"
            >
              <Compass className="w-4 h-4" /> Discover Projects
            </Link>
            <Link
              to="/showcase"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm text-surface-300 hover:text-white hover:bg-surface-800 flex items-center gap-2"
            >
              <FolderGit2 className="w-4 h-4" /> Showcase
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm text-surface-300 hover:text-white hover:bg-surface-800 flex items-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>
                <Link
                  to="/my-applications"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm text-surface-300 hover:text-white hover:bg-surface-800"
                >
                  My Applications
                </Link>
                <Link
                  to="/projects/new"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm text-brand-400 hover:bg-brand-950/40"
                >
                  + Create New Project
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-lg text-sm text-amber-400 hover:bg-amber-950/40 flex items-center gap-2"
                  >
                    <ShieldAlert className="w-4 h-4" /> Admin Hub
                  </Link>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
