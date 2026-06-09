'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Langue = 'fr' | 'en'

const translations = {
  fr: {
    nomCampagne: 'Vacances Numériques CENTIC 2026',
    bienvenue: 'Bienvenue sur la plateforme d\'inscription',
    presentation: 'Le Centre d\'Education aux outils des nouvelles Technologies de l\'Information et de la Communication (CENTIC) vous invite à vous inscrire à ses formations de vacances. Développez vos compétences numériques avec nos experts.',
    badge: 'Inscriptions ouvertes — 2026',
    question: 'Quel est votre profil ?',
    choisir: 'Choisir',
    footer: 'Centre d\'Education aux outils des nouvelles Technologies de l\'Information et de la Communication',
    profiles: [
      { key: 'PRIMAIRE', emoji: '🎒', titre: 'Élève du primaire', desc: 'CE2, CM1, CM2', session: 'Kids Digital Camps', color: 'blue' },
      { key: 'SECONDAIRE', emoji: '🎓', titre: 'Élève du secondaire', desc: '6ème à Terminale', session: 'Vacances Numériques', color: 'indigo' },
      { key: 'ADULTE', emoji: '💼', titre: 'Professionnel / Étudiant', desc: 'Professionnels, Étudiants, Demandeurs d\'emploi', session: 'Formation Adultes/Étudiants', color: 'orange' },
    ]
  },
  en: {
    nomCampagne: 'CENTIC Digital Holidays 2026',
    bienvenue: 'Welcome to the registration platform',
    presentation: 'The Centre for Education in New Information and Communication Technology Tools (CENTIC) invites you to register for its holiday training programs. Develop your digital skills with our experts.',
    badge: 'Registrations open — 2026',
    question: 'What is your profile?',
    choisir: 'Choose',
    footer: 'Centre for Education in New Information and Communication Technology Tools',
    profiles: [
      { key: 'PRIMAIRE', emoji: '🎒', titre: 'Primary school student', desc: 'CE2, CM1, CM2', session: 'Kids Digital Camps', color: 'blue' },
      { key: 'SECONDAIRE', emoji: '🎓', titre: 'Secondary school student', desc: 'Form 1 to Upper Sixth', session: 'Digital Holidays', color: 'indigo' },
      { key: 'ADULTE', emoji: '💼', titre: 'Professional / Student', desc: 'Professionals, Students, Job seekers', session: 'Adult/Student Training', color: 'orange' },
    ]
  }
}

export default function HomePage() {
  const [langue, setLangue] = useState<Langue>('fr')
  const router = useRouter()
  const t = translations[langue]

  return (
    <div>
      {/* HEADER */}
      <header className="header">
        <div className="header-logo">
          <img 
  src="/images/logo_centic.jpg" 
  alt="CENTIC" 
  style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover' }}
/>
          <div className="logo-text">
            <h1>CENTIC</h1>
            <p>Inscriptions 2026</p>
          </div>
        </div>
        <div className="lang-switcher">
          <button className={`lang-btn ${langue === 'fr' ? 'active' : ''}`} onClick={() => setLangue('fr')}>🇫🇷 FR</button>
          <button className={`lang-btn ${langue === 'en' ? 'active' : ''}`} onClick={() => setLangue('en')}>🇬🇧 EN</button>
        </div>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="hero-badge">
          <span className="badge-dot"></span>
          {t.badge}
        </div>
        <h1>{t.nomCampagne}</h1>
        <p className="hero-subtitle">{t.bienvenue}</p>
        <div className="hero-desc">{t.presentation}</div>
      </section>

      {/* PROFILS */}
      <div className="section">
        <div className="section-title">
          <h2>{t.question}</h2>
          <div className="section-divider"></div>
        </div>

        <div className="cards-grid">
          {t.profiles.map((profile) => (
            <div key={profile.key} className={`profile-card ${profile.color}`}>
              <div className={`card-header ${profile.color}`}>
                <span className="card-emoji">{profile.emoji}</span>
                <h3>{profile.titre}</h3>
                <p>{profile.desc}</p>
              </div>
              <div className="card-body">
                <div className="card-session">
                  <span>Session</span>
                  <p>{profile.session}</p>
                </div>
                <button
                  className={`card-btn ${profile.color}`}
                  onClick={() => router.push(`/inscription?categorie=${profile.key}`)}
                >
                  {t.choisir}
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <footer className="footer">
        <h3>CENTIC</h3>
        <p>{t.footer}</p>
        <small>© 2026 CENTIC — Tous droits réservés</small>
      </footer>
    </div>
  )
}