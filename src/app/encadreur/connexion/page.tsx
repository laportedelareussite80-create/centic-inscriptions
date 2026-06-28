'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ConnexionEncadreurPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // 1. Connexion Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (authError) {
      setError('Email ou mot de passe incorrect.')
      setLoading(false)
      return
    }

    // 2. Vérification du statut dans la table encadreurs
    const { data: encadreur, error: encadreurError } = await supabase
      .from('encadreurs')
      .select('statut, nom')
      .eq('id', authData.user.id)
      .single()

    if (encadreurError || !encadreur) {
      setError('Aucun profil encadreur associé à ce compte.')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    if (encadreur.statut === 'EN_ATTENTE') {
      setError('Votre compte est encore en attente de validation par l\'administrateur. Vous recevrez l\'accès dès qu\'il sera activé.')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    if (encadreur.statut === 'REJETE') {
      setError('Votre demande d\'accès n\'a pas été approuvée. Contactez l\'administration pour plus d\'informations.')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    // Statut VALIDE → accès à l'interface encadreur
    router.push('/encadreur/dashboard')
  }

  const inputStyle = {
    width: '100%', padding: '14px 16px',
    border: '2px solid #e5e7eb', borderRadius: '12px',
    fontSize: '15px', outline: 'none', transition: 'border 0.2s',
    fontFamily: 'inherit'
  }

  const labelStyle = {
    display: 'block' as const, fontSize: '13px', fontWeight: '700' as const,
    color: '#374151', marginBottom: '8px', textTransform: 'uppercase' as const, letterSpacing: '0.5px'
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0D1B4B 0%, #1A3A8F 60%, #2563EB 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: 'Segoe UI, Arial, sans-serif'
    }}>
      <div style={{
        background: 'white', borderRadius: '24px',
        padding: '48px 40px', width: '100%', maxWidth: '420px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img src="/images/logo_centic.jpg" alt="CENTIC"
            style={{ width: '80px', height: '80px', borderRadius: '16px', objectFit: 'cover', marginBottom: '16px' }} />
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0D1B4B', marginBottom: '4px' }}>
            Espace Encadreur
          </h1>
          <p style={{ color: '#888', fontSize: '14px' }}>CENTIC — Gestion des présences</p>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: '10px', padding: '12px 16px',
            color: '#dc2626', fontSize: '14px', marginBottom: '20px',
            lineHeight: '1.5'
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Adresse email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              required
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={labelStyle}>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '15px',
              background: loading ? '#93c5fd' : 'linear-gradient(135deg, #1A3A8F, #2563EB)',
              color: 'white', border: 'none', borderRadius: '12px',
              fontSize: '16px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '⏳ Connexion...' : '🔐 Se connecter'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#888' }}>
          Pas encore de compte ?{' '}
          <a href="/encadreur/inscription" style={{ color: '#2563EB', fontWeight: '700', textDecoration: 'none' }}>
            Créer un compte
          </a>
        </p>
      </div>
    </div>
  )
}