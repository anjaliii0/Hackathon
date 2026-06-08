import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Search, User, Users, FileText,
  Award, BarChart3, Bell, LogOut, Trophy, Bookmark, ChevronRight,
  Building2, PlusCircle, BadgeCheck, Megaphone,
} from 'lucide-react';
import styles from './Sidebar.module.css';

const studentNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/hackathons', icon: Search, label: 'Discover' },
  { to: '/bookmarks', icon: Bookmark, label: 'Saved' },
  { to: '/teams', icon: Users, label: 'My Teams' },
  { to: '/submissions', icon: FileText, label: 'Submissions' },
  { to: '/certificates', icon: Award, label: 'Certificates' },
  { to: '/leaderboard', icon: BarChart3, label: 'Leaderboard' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
];

const organizerNav = [
  { to: '/organizer', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/organizer/hackathons', icon: Trophy, label: 'My Hackathons' },
  { to: '/organizer/hackathons/new', icon: PlusCircle, label: 'Create Hackathon' },
  { to: '/organizer/profile', icon: Building2, label: 'Organization' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
];

const adminNav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/verification', icon: BadgeCheck, label: 'Verification' },
  { to: '/admin/hackathons', icon: Trophy, label: 'Hackathons' },
  { to: '/admin/broadcast', icon: Megaphone, label: 'Broadcast' },
];

export default function Sidebar() {
  const { user, logout, isOrganizer, isCollege, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = isAdmin ? adminNav : isOrganizer ? organizerNav : studentNav;
  const roleLabel = isAdmin ? 'Administrator' : isOrganizer ? (isCollege ? 'College' : 'Company') : 'Student';
  const profileTo = isAdmin ? '/admin' : isOrganizer ? '/organizer/profile' : '/profile';

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.logo}><Trophy size={20} /></div>
        <span className={styles.brandName}>HackPortal</span>
      </div>

      <nav className={styles.nav}>
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
          >
            <Icon size={18} />
            <span>{label}</span>
            <ChevronRight size={14} className={styles.chevron} />
          </NavLink>
        ))}
      </nav>

      <div className={styles.bottom}>
        <NavLink to={profileTo} className={({ isActive }) => `${styles.profileLink} ${isActive ? styles.active : ''}`}>
          <div className={styles.avatar}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className={styles.profileInfo}>
            <span className={styles.profileName}>{user?.name || 'User'}</span>
            <span className={styles.profileRole}>{roleLabel}</span>
          </div>
        </NavLink>
        <button className={styles.logoutBtn} onClick={handleLogout} title="Logout">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
