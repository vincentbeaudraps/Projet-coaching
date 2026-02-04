import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuthStore } from '../store/authStore';
import '../styles/Auth.css';

function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    age: '',
    experience: 'beginner',
    goals: '',
    injuries: '',
    trainingDaysPerWeek: '3'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.register(
        formData.email,
        formData.name,
        formData.password,
        'athlete'
      );
      login(response.data.user, response.data.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Join Coach Running Platform</h1>
        <form onSubmit={handleSubmit} className="register-form">
          <h3>Basic Information</h3>
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <h3>Running Profile</h3>
          <input
            type="number"
            name="age"
            placeholder="Age"
            value={formData.age}
            onChange={handleChange}
            min="16"
            max="120"
          />
          
          <select name="experience" value={formData.experience} onChange={handleChange}>
            <option value="beginner">Beginner - I'm starting</option>
            <option value="intermediate">Intermediate - 1-2 years</option>
            <option value="advanced">Advanced - 3+ years</option>
            <option value="competitive">Competitive - Race experience</option>
          </select>

          <input
            type="number"
            name="trainingDaysPerWeek"
            placeholder="Days per week (current training)"
            value={formData.trainingDaysPerWeek}
            onChange={handleChange}
            min="0"
            max="7"
          />

          <textarea
            name="goals"
            placeholder="Your running goals (e.g., 5K improvement, marathon training, weight loss)"
            value={formData.goals}
            onChange={handleChange}
            rows={3}
          />

          <textarea
            name="injuries"
            placeholder="Any past injuries or concerns? (optional)"
            value={formData.injuries}
            onChange={handleChange}
            rows={2}
          />

          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        <p>
          Already have an account? <a href="/login">Login here</a>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
