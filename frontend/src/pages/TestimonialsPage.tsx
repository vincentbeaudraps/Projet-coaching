import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import vbLogo from '../assets/vb-logo.png';
import '../styles/TestimonialsPage.css';

interface Testimonial {
  id: string;
  athlete_name: string;
  rating: number;
  comment: string;
  date: string;
  achievement?: string;
}

function TestimonialsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [achievement, setAchievement] = useState('');
  const [loading, setLoading] = useState(false);

  // Témoignages exemple (à remplacer par API plus tard)
  const exampleTestimonials: Testimonial[] = [
    {
      id: '1',
      athlete_name: 'Marie L.',
      rating: 5,
      comment: "Vincent m'a aidée à passer de 45 minutes à 39 minutes sur 10km en seulement 4 mois ! Son approche progressive et bienveillante m'a permis d'éviter les blessures tout en progressant régulièrement. La relation coach-athlète est vraiment latérale, je me sens écoutée et comprise.",
      date: '2025-12-15',
      achievement: 'Premier 10km en moins de 40 minutes'
    },
    {
      id: '2',
      athlete_name: 'Thomas D.',
      rating: 5,
      comment: "Après plusieurs blessures avec mon ancien club, j'avais perdu confiance. Vincent a complètement revu ma préparation avec plus de volume à faible intensité et du travail au seuil. Résultat : plus de blessures et mes chronos explosent ! Je recommande à 100%.",
      date: '2025-11-28',
      achievement: 'Semi-marathon en 1h32'
    },
    {
      id: '3',
      athlete_name: 'Sophie B.',
      rating: 5,
      comment: "La méthode VB Coaching basée sur la science et les faits avérés m'a convaincue. Vincent prend le temps d'expliquer chaque séance, d'analyser mes données et d'ajuster le plan en fonction de mes sensations. C'est du coaching de qualité à un prix très accessible.",
      date: '2025-11-10',
      achievement: '5km en 21 minutes'
    },
    {
      id: '4',
      athlete_name: 'Lucas M.',
      rating: 5,
      comment: "Je cherchais un coach qui comprenne vraiment la préparation trail. Vincent a su adapter ses plans pour le dénivelé et la spécificité montagne. Son expérience variée (basket puis course) lui donne une vision différente et efficace.",
      date: '2025-10-22',
      achievement: 'Trail 30km - 2500m D+'
    },
    {
      id: '5',
      athlete_name: 'Emma R.',
      rating: 5,
      comment: "La bienveillance n'est pas un mot en l'air chez Vincent. Quand j'ai eu un coup de mou, il a su adapter le plan et me remotiver sans pression. L'esprit d'équipe du basket transparaît vraiment dans sa manière de coacher. Merci !",
      date: '2025-10-05',
      achievement: 'Marathon en 3h45'
    },
    {
      id: '6',
      athlete_name: 'Julien P.',
      rating: 5,
      comment: "Vincent teste sur lui-même les méthodes qu'il propose. Ça fait toute la différence ! Il sait de quoi il parle, il a vécu les blessures, les doutes, les progressions. C'est rassurant d'avoir un coach qui comprend vraiment ce qu'on traverse.",
      date: '2025-09-18',
      achievement: '10km en 37 minutes'
    }
  ];

  useEffect(() => {
    // Simuler le chargement des témoignages
    setTestimonials(exampleTestimonials);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // TODO: Appel API pour sauvegarder le témoignage
    // Pour l'instant, on simule juste
    setTimeout(() => {
      alert('Merci pour votre avis ! Il sera publié après validation.');
      setShowForm(false);
      setComment('');
      setAchievement('');
      setRating(5);
      setLoading(false);
    }, 1000);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= rating ? 'star filled' : 'star'}>
            ★
          </span>
        ))}
      </div>
    );
  };

  const averageRating = testimonials.length > 0
    ? (testimonials.reduce((acc, t) => acc + t.rating, 0) / testimonials.length).toFixed(1)
    : '5.0';

  return (
    <div className="testimonials-container">
      {/* Header */}
      <header className="testimonials-header">
        <div className="testimonials-header-content">
          <img src={vbLogo} alt="VB Coaching" className="testimonials-logo" onClick={() => navigate('/')} />
          <nav className="testimonials-nav">
            <a href="/">Accueil</a>
            <a href="/pricing">Tarifs</a>
            <a href="/testimonials" className="active">Avis</a>
            <a href="/login">Connexion</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="testimonials-hero">
        <div className="container">
          <h1>Ce Que Disent Mes Athlètes</h1>
          <p className="testimonials-subtitle">
            Témoignages authentiques de coureurs coachés par VB Coaching
          </p>
          <div className="rating-summary">
            <div className="rating-number">{averageRating}</div>
            <div className="rating-details">
              {renderStars(5)}
              <p>{testimonials.length} avis vérifiés</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Grid */}
      <section className="testimonials-list-section">
        <div className="container">
          {user && user.role === 'athlete' && (
            <div className="add-testimonial-cta">
              <button 
                className="btn-add-testimonial"
                onClick={() => setShowForm(!showForm)}
              >
                {showForm ? '✕ Annuler' : '✍️ Laisser un avis'}
              </button>
            </div>
          )}

          {/* Formulaire d'ajout */}
          {showForm && user?.role === 'athlete' && (
            <div className="testimonial-form-card">
              <h3>Partagez votre expérience</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Note globale *</label>
                  <div className="rating-input">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={star <= rating ? 'star-btn active' : 'star-btn'}
                        onClick={() => setRating(star)}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Votre témoignage *</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Partagez votre expérience avec VB Coaching, votre progression, ce qui vous a plu..."
                    rows={5}
                    required
                    minLength={50}
                  />
                  <span className="char-count">{comment.length} caractères (minimum 50)</span>
                </div>

                <div className="form-group">
                  <label>Votre réussite (optionnel)</label>
                  <input
                    type="text"
                    value={achievement}
                    onChange={(e) => setAchievement(e.target.value)}
                    placeholder="ex: Marathon en 3h45, 10km en 38 minutes..."
                  />
                </div>

                <div className="form-actions">
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                    Annuler
                  </button>
                  <button type="submit" className="btn-primary" disabled={loading || comment.length < 50}>
                    {loading ? 'Envoi...' : 'Publier mon avis'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Liste des témoignages */}
          <div className="testimonials-grid">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="testimonial-card">
                <div className="testimonial-header">
                  <div className="athlete-info">
                    <div className="athlete-avatar">
                      {testimonial.athlete_name.charAt(0)}
                    </div>
                    <div>
                      <h4>{testimonial.athlete_name}</h4>
                      <p className="testimonial-date">
                        {new Date(testimonial.date).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  {renderStars(testimonial.rating)}
                </div>

                {testimonial.achievement && (
                  <div className="achievement-badge">
                    🏆 {testimonial.achievement}
                  </div>
                )}

                <p className="testimonial-comment">{testimonial.comment}</p>

                <div className="testimonial-footer">
                  <span className="verified-badge">✓ Avis vérifié</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="testimonials-stats-section">
        <div className="container">
          <h2 className="section-title">Résultats Mesurables</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-number">-7 min</div>
              <div className="stat-label">Progression moyenne 10km</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🏃</div>
              <div className="stat-number">95%</div>
              <div className="stat-label">Objectifs atteints</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-number">100%</div>
              <div className="stat-label">Plans personnalisés</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-number">{averageRating}/5</div>
              <div className="stat-label">Satisfaction client</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="testimonials-cta-section">
        <div className="container">
          <h2>Rejoignez mes athlètes satisfaits</h2>
          <p>Commencez votre progression dès aujourd'hui</p>
          <div className="cta-buttons">
            <button className="btn-cta-large primary" onClick={() => navigate('/register')}>
              Commencer Maintenant
            </button>
            <button className="btn-cta-large secondary" onClick={() => navigate('/pricing')}>
              Voir les Tarifs
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="testimonials-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo">
              <img src={vbLogo} alt="VB Coaching" />
            </div>
            <div className="footer-links">
              <a href="/">Accueil</a>
              <a href="/pricing">Tarifs</a>
              <a href="/testimonials">Avis</a>
              <a href="/login">Connexion</a>
              <a href="/register">Inscription</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 VB Coaching - Tous droits réservés</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default TestimonialsPage;
