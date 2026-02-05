import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import '../styles/Header.css';
import vbLogo from '../assets/vb-logo.png';

interface HeaderProps {
  showBackButton?: boolean;
  backTo?: string;
  title?: string;
}

function Header({ showBackButton = false, backTo = '/dashboard', title }: HeaderProps) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          {showBackButton && (
            <button className="btn-back-header" onClick={() => navigate(backTo)}>
              ← Retour
            </button>
          )}
          <div className="logo-section">
            <img src={vbLogo} alt="VB Coaching" className="logo-image" />
          </div>
          {title && <h2 className="page-title">{title}</h2>}
        </div>

        <div className="header-right">
          <button 
            className="btn-devices" 
            onClick={() => navigate('/devices')}
            title="Mes appareils connectés"
          >
            🔗 Appareils
          </button>
          <div className="user-info">
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
