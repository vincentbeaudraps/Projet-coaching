import { useNavigate } from 'react-router-dom';
import vbLogo from '../assets/vb-logo.png';
import '../styles/PricingPage.css';

function PricingPage() {
  const navigate = useNavigate();

  return (
    <div className="pricing-container">
      {/* Header avec logo */}
      <header className="pricing-header">
        <div className="pricing-header-content">
          <img src={vbLogo} alt="VB Coaching" className="pricing-logo" onClick={() => navigate('/')} />
          <nav className="pricing-nav">
            <a href="/">Accueil</a>
            <a href="/pricing" className="active">Tarifs</a>
            <a href="/testimonials">Avis</a>
            <a href="/login">Connexion</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pricing-hero">
        <div className="container">
          <h1>Tarifs Transparents & Accessibles</h1>
          <p className="pricing-subtitle">
            Des formules adaptées à tous les coureurs, sans engagement excessif
          </p>
          <div className="pricing-badge">
            <span className="badge-icon">🎉</span>
            <span className="badge-text">Offre de lancement : -30% sur tous les abonnements !</span>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pricing-cards-section">
        <div className="container">
          <div className="pricing-grid">
            
            {/* Formule Découverte */}
            <div className="pricing-card">
              <div className="card-header">
                <h3>Découverte</h3>
                <p className="card-subtitle">Pour débuter sereinement</p>
              </div>
              <div className="card-price">
                <span className="price-old">50€</span>
                <span className="price-current">35€</span>
                <span className="price-period">/mois</span>
              </div>
              <ul className="card-features">
                <li>✓ Plan d'entraînement personnalisé</li>
                <li>✓ 1 bilan mensuel (30 min)</li>
                <li>✓ Ajustements hebdomadaires</li>
                <li>✓ Accès plateforme 24/7</li>
                <li>✓ Messagerie avec réponse sous 48h</li>
                <li>✓ Suivi des performances</li>
                <li className="feature-disabled">✗ Appels vidéo coaching</li>
                <li className="feature-disabled">✗ Analyse approfondie</li>
              </ul>
              <button className="btn-pricing" onClick={() => navigate('/register')}>
                Choisir Découverte
              </button>
              <p className="card-note">Idéal pour : Débutants, coureurs occasionnels</p>
            </div>

            {/* Formule Performance (POPULAIRE) */}
            <div className="pricing-card popular">
              <div className="popular-badge">⭐ Le plus populaire</div>
              <div className="card-header">
                <h3>Performance</h3>
                <p className="card-subtitle">Le meilleur rapport qualité/prix</p>
              </div>
              <div className="card-price">
                <span className="price-old">80€</span>
                <span className="price-current">56€</span>
                <span className="price-period">/mois</span>
              </div>
              <ul className="card-features">
                <li>✓ Tout de la formule Découverte</li>
                <li>✓ <strong>2 bilans mensuels</strong> (30 min chacun)</li>
                <li>✓ <strong>1 appel vidéo/mois</strong> (45 min)</li>
                <li>✓ Ajustements illimités</li>
                <li>✓ Messagerie prioritaire (24h)</li>
                <li>✓ Analyse détaillée des séances</li>
                <li>✓ Conseils nutrition de base</li>
                <li>✓ Stratégie course personnalisée</li>
              </ul>
              <button className="btn-pricing primary" onClick={() => navigate('/register')}>
                Choisir Performance
              </button>
              <p className="card-note">Idéal pour : Objectif 10km, semi, marathon</p>
            </div>

            {/* Formule Compétition */}
            <div className="pricing-card">
              <div className="card-header">
                <h3>Compétition</h3>
                <p className="card-subtitle">Suivi ultra-personnalisé</p>
              </div>
              <div className="card-price">
                <span className="price-old">120€</span>
                <span className="price-current">84€</span>
                <span className="price-period">/mois</span>
              </div>
              <ul className="card-features">
                <li>✓ Tout de la formule Performance</li>
                <li>✓ <strong>4 bilans mensuels</strong> (suivi hebdo)</li>
                <li>✓ <strong>2 appels vidéo/mois</strong> (1h chacun)</li>
                <li>✓ Messagerie illimitée (réponse rapide)</li>
                <li>✓ Analyse approfondie des données</li>
                <li>✓ Plan nutrition complet</li>
                <li>✓ Préparation mentale course</li>
                <li>✓ Accès WhatsApp coach</li>
              </ul>
              <button className="btn-pricing" onClick={() => navigate('/register')}>
                Choisir Compétition
              </button>
              <p className="card-note">Idéal pour : Compétiteurs, objectifs ambitieux</p>
            </div>

          </div>
        </div>
      </section>

      {/* Coaching Trail */}
      <section className="trail-pricing-section">
        <div className="container">
          <h2 className="section-title">Coaching Trail & Montagne</h2>
          <p className="section-subtitle">Préparation spécifique pour vos aventures en nature</p>
          
          <div className="trail-pricing-card">
            <div className="trail-content">
              <div className="trail-info">
                <h3>🏔️ Formule Trail Adaptée</h3>
                <p>
                  Toutes mes formules (Découverte, Performance, Compétition) peuvent être adaptées 
                  pour le trail et la montagne avec :
                </p>
                <ul>
                  <li>✓ Entraînement spécifique dénivelé</li>
                  <li>✓ Gestion effort longue distance</li>
                  <li>✓ Technique montée/descente</li>
                  <li>✓ Nutrition et ravitaillement trail</li>
                  <li>✓ Préparation terrain accidenté</li>
                </ul>
              </div>
              <div className="trail-price">
                <div className="trail-price-badge">
                  <span className="badge-plus">+10€</span>
                  <span className="badge-text">sur la formule choisie</span>
                </div>
                <p className="trail-note">
                  Le trail nécessite une préparation plus spécifique et technique, 
                  d'où ce léger supplément pour un suivi adapté.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparaison marché */}
      <section className="comparison-section">
        <div className="container">
          <h2 className="section-title">Pourquoi VB Coaching ?</h2>
          <div className="comparison-grid">
            <div className="comparison-card">
              <h4>🏃 Coaching Traditionnel</h4>
              <p className="comparison-price">80-150€/mois</p>
              <ul>
                <li>Plans génériques</li>
                <li>Peu de suivi personnalisé</li>
                <li>Contact limité</li>
                <li>Ajustements rares</li>
              </ul>
            </div>
            <div className="comparison-card highlight">
              <div className="comparison-badge">✨ VB Coaching</div>
              <h4>🚀 Ma Formule Performance</h4>
              <p className="comparison-price">56€/mois (-30%)</p>
              <ul>
                <li><strong>100% personnalisé</strong></li>
                <li><strong>Suivi continu</strong></li>
                <li><strong>Contact privilégié</strong></li>
                <li><strong>Ajustements illimités</strong></li>
              </ul>
            </div>
            <div className="comparison-card">
              <h4>📱 Applications en ligne</h4>
              <p className="comparison-price">15-30€/mois</p>
              <ul>
                <li>Plans automatiques</li>
                <li>Aucun suivi humain</li>
                <li>Pas d'adaptation</li>
                <li>Support technique seulement</li>
              </ul>
            </div>
          </div>
          <p className="comparison-note">
            <strong>Mon engagement :</strong> Un coaching humain, personnalisé et accessible, 
            sans compromis sur la qualité du suivi.
          </p>
        </div>
      </section>

      {/* Garanties */}
      <section className="guarantees-section">
        <div className="container">
          <h2 className="section-title">Mes Garanties</h2>
          <div className="guarantees-grid">
            <div className="guarantee-card">
              <div className="guarantee-icon">🔄</div>
              <h4>Sans engagement</h4>
              <p>Résiliez à tout moment, sans frais cachés ni pénalités</p>
            </div>
            <div className="guarantee-card">
              <div className="guarantee-icon">💯</div>
              <h4>Satisfait ou remboursé</h4>
              <p>Premier mois remboursé si le coaching ne vous convient pas</p>
            </div>
            <div className="guarantee-card">
              <div className="guarantee-icon">📊</div>
              <h4>Résultats mesurables</h4>
              <p>Suivi détaillé de votre progression avec données objectives</p>
            </div>
            <div className="guarantee-card">
              <div className="guarantee-icon">🤝</div>
              <h4>Relation latérale</h4>
              <p>Échange transparent et bienveillant, vous êtes acteur de votre progression</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Pricing */}
      <section className="faq-pricing-section">
        <div className="container">
          <h2 className="section-title">Questions Fréquentes</h2>
          <div className="faq-grid">
            <div className="faq-item">
              <h4>💳 Quels moyens de paiement acceptez-vous ?</h4>
              <p>
                Carte bancaire, virement et PayPal. Le paiement est mensuel et automatique 
                pour votre confort (résiliable à tout moment).
              </p>
            </div>
            <div className="faq-item">
              <h4>🔄 Puis-je changer de formule en cours de route ?</h4>
              <p>
                Absolument ! Vous pouvez upgrader ou downgrader votre formule à tout moment. 
                La différence sera calculée au prorata.
              </p>
            </div>
            <div className="faq-item">
              <h4>⏸️ Puis-je suspendre mon abonnement ?</h4>
              <p>
                Oui, en cas de blessure ou d'imprévu, vous pouvez suspendre 1 mois gratuit par an. 
                Au-delà, nous trouverons une solution ensemble.
              </p>
            </div>
            <div className="faq-item">
              <h4>🎁 L'offre -30% dure combien de temps ?</h4>
              <p>
                C'est une offre de lancement sans limite de durée pour l'instant. 
                Si vous vous inscrivez maintenant, le tarif réduit reste acquis.
              </p>
            </div>
            <div className="faq-item">
              <h4>📅 Quand commence le coaching ?</h4>
              <p>
                Dès votre inscription ! Vous recevez un questionnaire initial, puis je vous 
                contacte sous 24h pour notre premier échange et démarrer le programme.
              </p>
            </div>
            <div className="faq-item">
              <h4>🏃 Combien de séances par semaine ?</h4>
              <p>
                Ça dépend de vous ! De 3 à 6 séances/semaine selon vos objectifs, votre niveau 
                et votre disponibilité. Tout est personnalisé.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="pricing-cta-section">
        <div className="container">
          <h2>Prêt à passer au niveau supérieur ?</h2>
          <p>Rejoignez VB Coaching dès aujourd'hui et profitez de -30%</p>
          <div className="cta-buttons">
            <button className="btn-cta-large primary" onClick={() => navigate('/register')}>
              Commencer Maintenant
            </button>
            <button className="btn-cta-large secondary" onClick={() => navigate('/')}>
              En savoir plus
            </button>
          </div>
          <p className="cta-note">✓ Sans engagement • ✓ Premier mois satisfait ou remboursé</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="pricing-footer">
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

export default PricingPage;
