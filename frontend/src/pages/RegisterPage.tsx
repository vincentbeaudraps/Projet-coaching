import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuthStore } from '../store/authStore';
import '../styles/Auth.css';
import vbLogo from '../assets/vb-logo.png';

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [coachName, setCoachName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validatingCode, setValidatingCode] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleValidateCode = async (code: string) => {
    if (!code || code.length < 6) {
      setCoachName('');
      return;
    }

    try {
      setValidatingCode(true);
      const response = await authService.validate(code);
      setCoachName(response.data.coachName);
      setError('');
    } catch (err: any) {
      setCoachName('');
      setError(err.response?.data?.message || 'Code invalide');
    } finally {
      setValidatingCode(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value.toUpperCase();
    setInvitationCode(code);
    if (code.length >= 6) {
      handleValidateCode(code);
    } else {
      setCoachName('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Le rôle "athlete" est automatiquement attribué côté serveur
      const response = await authService.register(email, name, password, invitationCode || undefined);
      login(response.data.user, response.data.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || "Échec de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <img src={vbLogo} alt="VB Coaching" />
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nom complet"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
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
          <div className="invitation-code-section">
            <input
              type="text"
              placeholder="Code d'invitation (optionnel)"
              value={invitationCode}
              onChange={handleCodeChange}
              maxLength={15}
              style={{ textTransform: 'uppercase' }}
            />
            {validatingCode && <p className="validating-text">Validation...</p>}
            {coachName && (
              <p className="coach-name-text">✅ Coach: {coachName}</p>
            )}
          </div>
          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? 'Inscription...' : "S'inscrire"}
          </button>
        </form>
        <p>
          Déjà un compte ? <a href="/login">Se connecter ici</a>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
