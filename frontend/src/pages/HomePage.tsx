import { useNavigate } from 'react-router-dom';
import vbLogo from '../assets/vb-logo.png';
import '../styles/HomePage.css';

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="homepage-container">
      {/* Hero Section */}
      <header className="hero-section">
        <div className="hero-content">
          <img src={vbLogo} alt="VB Coaching" className="hero-logo" />
          <h1 className="hero-title">Dépassez vos limites en course à pied</h1>
          <p className="hero-subtitle">
            Coaching personnalisé pour atteindre vos objectifs, du débutant au coureur confirmé
          </p>
          <div className="hero-buttons">
            <button className="btn-cta-primary" onClick={() => navigate('/register')}>
              Commencer maintenant
            </button>
            <button className="btn-cta-secondary" onClick={() => navigate('/login')}>
              Se connecter
            </button>
          </div>
        </div>
      </header>

      {/* About Section */}
      <section className="about-section">
        <div className="container">
          <h2 className="section-title">Qui suis-je ?</h2>
          <div className="about-content">
            <div className="about-text">
              <h3>Vincent B. - Coach en course à pied</h3>
              <p>
                Après 15 ans de basket à niveau régional, j'ai découvert la course à pied il y a 5 ans. 
                Cette transition m'a permis de garder l'esprit d'équipe qui m'anime, car pour moi, la relation 
                coach-athlète doit être <strong>latérale et non unilatérale</strong>. La bienveillance est essentielle 
                pour évoluer dans un environnement sain et performant.
              </p>
              <p>
                Mon parcours en course à pied est celui d'un éternel apprenant. Passé de 42 minutes sur 10km sans 
                entraînement structuré à <strong>35 minutes sur 10km et 17 minutes sur 5km</strong> aujourd'hui, 
                j'ai testé différentes méthodes : le club français traditionnel (beaucoup d'intensité, peu de volume) 
                qui m'a causé des blessures, puis la méthode américaine/nordique (volume à faible intensité + seuil) 
                qui m'a fait passer un cap. Cette expérience variée me permet de comprendre ce qui fonctionne vraiment.
              </p>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-number">5 ans</div>
                  <div className="stat-label">En course à pied</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">15 ans</div>
                  <div className="stat-label">Basket niveau régional</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">35'</div>
                  <div className="stat-label">Record 10km</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Journey Section */}
      <section className="journey-section">
        <div className="container">
          <h2 className="section-title">Mon Parcours Sportif</h2>
          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-marker">🏀</div>
              <div className="timeline-content">
                <h4>15 ans de basket - Niveau régional</h4>
                <p>Formation de l'esprit d'équipe, discipline et goût de l'effort collectif. Base solide pour mon approche du coaching.</p>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-marker">🏃</div>
              <div className="timeline-content">
                <h4>Il y a 5 ans - Transition vers la course à pied</h4>
                <p>Premier 10km en 42 minutes sans entraînement structuré. Découverte d'une nouvelle passion.</p>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-marker">🔬</div>
              <div className="timeline-content">
                <h4>Phase d'expérimentation</h4>
                <p>Tests de différentes méthodes : club français traditionnel (haute intensité/faible volume), puis blessures et remise en question.</p>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-marker">🇺🇸</div>
              <div className="timeline-content">
                <h4>Coaching avec athlète français aux USA</h4>
                <p>Découverte de la méthode américaine/nordique : volume à faible intensité + travail au seuil. Révélation et progression majeure.</p>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-marker">📈</div>
              <div className="timeline-content">
                <h4>Aujourd'hui - Performances actuelles</h4>
                <p>35 minutes sur 10km (-7 min) | 17 minutes sur 5km. Approche basée sur la science et les faits avérés.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="philosophy-section">
        <div className="container">
          <h2 className="section-title">Ma Philosophie d'Entraînement</h2>
          <div className="philosophy-grid">
            <div className="philosophy-card">
              <div className="philosophy-icon">📈</div>
              <h3>Progressivité</h3>
              <p>
                Pas de brûlage d'étapes. Une progression construite, solide et durable est la clé 
                pour éviter les blessures et atteindre vos objectifs à long terme.
              </p>
            </div>
            <div className="philosophy-card">
              <div className="philosophy-icon">🔄</div>
              <h3>Régularité</h3>
              <p>
                La constance dans l'effort prime sur l'intensité ponctuelle. Un entraînement régulier 
                et structuré apporte plus de résultats qu'un travail irrégulier et intense.
              </p>
            </div>
            <div className="philosophy-card">
              <div className="philosophy-icon">🇺🇸</div>
              <h3>Volume + Seuil</h3>
              <p>
                Inspirée des méthodes américaines et nordiques : volume à faible intensité combiné 
                à beaucoup de travail au seuil. Exit la sur-sollicitation de la VMA à la française.
              </p>
            </div>
            <div className="philosophy-card">
              <div className="philosophy-icon">🔬</div>
              <h3>Approche Scientifique</h3>
              <p>
                Veille constante sur les dernières études scientifiques. Mes programmes s'appuient 
                sur des faits avérés, pas sur des croyances ou des modes passagères.
              </p>
            </div>
            <div className="philosophy-card">
              <div className="philosophy-icon">🤝</div>
              <h3>Relation Latérale</h3>
              <p>
                Coach et athlète travaillent ensemble, pas l'un au-dessus de l'autre. L'esprit d'équipe 
                du basket appliqué au coaching individuel.
              </p>
            </div>
            <div className="philosophy-card">
              <div className="philosophy-icon">💚</div>
              <h3>Bienveillance</h3>
              <p>
                Un environnement sain et bienveillant est obligatoire pour progresser. Respect, écoute 
                et encouragement sont au cœur de ma méthode.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Method Section */}
      <section className="method-section">
        <div className="container">
          <h2 className="section-title">Ma Méthode VB Coaching</h2>
          <div className="method-steps">
            <div className="method-step">
              <div className="step-number">1</div>
              <h3>Bilan & Objectifs</h3>
              <p>
                Échange approfondi sur votre historique, vos disponibilités, vos objectifs et vos attentes. 
                Construction d'une relation de confiance dès le départ.
              </p>
            </div>
            <div className="method-step">
              <div className="step-number">2</div>
              <h3>Plan Progressif</h3>
              <p>
                Création d'un programme personnalisé basé sur la progressivité et le volume à faible intensité, 
                avec du travail au seuil régulier. Pas de sur-sollicitation VMA.
              </p>
            </div>
            <div className="method-step">
              <div className="step-number">3</div>
              <h3>Régularité & Ajustements</h3>
              <p>
                Suivi régulier de vos sensations et performances. Ajustements en temps réel basés sur 
                des données concrètes et votre ressenti. Approche latérale, pas unilatérale.
              </p>
            </div>
            <div className="method-step">
              <div className="step-number">4</div>
              <h3>Performance & Prévention</h3>
              <p>
                Préparation optimale pour atteindre vos objectifs tout en prévenant les blessures. 
                Volume, récupération et bienveillance pour une progression durable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="services-section">
        <div className="container">
          <h2 className="section-title">Mes Services</h2>
          <div className="services-grid">
            <div className="service-card">
              <h3>🏃 Coaching Route</h3>
              <ul>
                <li>Préparation 10km, semi, marathon</li>
                <li>Développement de l'endurance de base</li>
                <li>Travail au seuil et allures spécifiques</li>
                <li>Plans personnalisés</li>
                <li>Suivi hebdomadaire</li>
              </ul>
            </div>
            <div className="service-card">
              <h3>⛰️ Coaching Trail</h3>
              <ul>
                <li>Préparation courses nature et montagne</li>
                <li>Gestion du dénivelé positif/négatif</li>
                <li>Technique de descente</li>
                <li>Stratégie nutrition et gestion effort</li>
                <li>Adaptation terrain vallonné</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <h2>Prêt à commencer votre aventure ?</h2>
          <p>Rejoignez VB Coaching et atteignez vos objectifs en course à pied</p>
          <button className="btn-cta-large" onClick={() => navigate('/register')}>
            Inscription Gratuite
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="homepage-footer">
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

export default HomePage;
