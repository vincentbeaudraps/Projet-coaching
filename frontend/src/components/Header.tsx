import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import NotificationBell from './NotificationBell';
import '../styles/Header.css';
import vbLogo from '../assets/vb-logo.png';

interface HeaderProps {
  showBackButton?: boolean;
  backTo?: string;
  title?: string;
}

function Header({ showBackButton = false, backTo = '/dashboard', title }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Navigation items pour Coach
  const coachNavItems = [
    { path: '/dashboard', label: 'Vue d\'ensemble', emoji: '📊' },
    { path: '/athletes', label: 'Athlètes', emoji: '🏃' },
    { path: '/session-builder', label: 'Créer Séance', emoji: '🎯' },
    { path: '/invitations', label: 'Invitations', emoji: '📨' },
  ];

  // Navigation items pour Athlète
  const athleteNavItems = [
    { path: '/dashboard', label: 'Mes Séances', emoji: '📅' },
    { path: '/athlete/profile', label: 'Profil', emoji: '👤' },
    { path: '/athlete/races', label: 'Historique des courses', emoji: '📊' },
    { path: '/devices', label: 'Appareils', emoji: '🔗' },
  ];

  const navItems = user?.role === 'coach' ? coachNavItems : athleteNavItems;

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          {showBackButton && (
            <button className="btn-back-header" onClick={() => navigate(backTo)}>
              ← Retour
            </button>
          )}
          <div className="logo-section" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
            <img src={vbLogo} alt="VB Coaching" className="logo-image" />
          </div>
          {title && <h2 className="page-title">{title}</h2>}
        </div>

        <nav className="main-nav">
          {navItems.map((item) => (
            <button
              key={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-emoji">{item.emoji}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="header-right">
          <NotificationBell />
          <div 
            className="user-info" 
            onClick={() => navigate(user?.role === 'athlete' ? '/athlete/profile' : '/dashboard')} 
            style={{ cursor: 'pointer' }}
          >
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <span className="user-name">{user?.name}</span>
              <span className="user-role">{user?.role === 'coach' ? 'Coach' : 'Athlète'}</span>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            Déconnexion
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
