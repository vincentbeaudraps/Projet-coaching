import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useApiSubmit } from '../hooks/useApi';
import '../styles/Auth.css';
import vbLogo from '../assets/vb-logo.png';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const { submit: performLogin, loading, error } = useApiSubmit(async (credentials: { email: string; password: string }) => {
    const response = await authService.login(credentials.email, credentials.password);
    login(response.data.user, response.data.token);
    navigate('/dashboard');
    return response;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLogin({ email, password });
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <img src={vbLogo} alt="VB Coaching" />
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
        <p>
          Pas encore de compte ? <a href="/register">S'inscrire ici</a>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
