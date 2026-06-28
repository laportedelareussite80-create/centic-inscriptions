'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function InscriptionEncadreurPage() {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    nom: '', email: '', telephone: '', password: '', confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.nom.trim() || !form.email.trim() || !form.password) {
      setError('Veuillez remplir tous les champs obligatoires.')
      return
    }
    if (form.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    try {
      // 1. Créer le compte Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('Un compte existe déjà avec cet email.')
        } else {
          setError('Une erreur est survenue lors de la création du compte.')
        }
        setLoading(false)
        return
      }

      if (!authData.user) {
        setError('Une erreur est survenue. Veuillez réessayer.')
        setLoading(false)
        return
      }

      // 2. Créer la ligne encadreur (statut EN_ATTENTE par défaut)
      const { error: encadreurError } = await supabase
        .from('encadreurs')
        .insert({
          id: authData.user.id,
          nom: form.nom.trim(),
          email: form.email.trim(),
          telephone: form.telephone.trim() || null,
        })

      if (encadreurError) {
        setError('Une erreur est survenue lors de la création de votre profil.')
        setLoading(false)
        return
      }

      setSubmitted(true)
    } catch (err) {
      console.error(err)
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
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

  // Page de confirmation après inscription
  if (submitted) {
    return (
      <div style={{
        minHeight: '100vh', background: 'linear-gradient(135deg, #0D1B4B 0%, #1A3A8F 60%, #2563EB 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
        fontFamily: 'Segoe UI, Arial, sans-serif'
      }}>
        <div style={{
          background: 'white', borderRadius: '24px', padding: '48px 40px',
          maxWidth: '460px', width: '100%', textAlign: 'center',
          boxShadow: '0 25px 60px rgba(0,0,0,0.3)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📨</div>
          <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#0D1B4B', marginBottom: '12px' }}>
            Compte créé avec succès !
          </h1>
          <p style={{ color: '#666', fontSize: '15px', lineHeight: '1.6', marginBottom: '24px' }}>
            Merci, <strong>{form.nom}</strong>. Votre demande a bien été reçue.
          </p>
          <div style={{
            background: '#f0f4ff', borderRadius: '16px', padding: '20px',
            marginBottom: '8px', textAlign: 'left'
          }}>
            <p style={{ fontSize: '14px', color: '#1A3A8F', lineHeight: '1.6', margin: 0 }}>
              ⏳ Votre compte est en attente de validation par l'administrateur. Vous recevrez l'accès à votre espace dès que votre compte sera activé. Vous pourrez alors vous connecter avec l'email et le mot de passe que vous venez de choisir.
            </p>
          </div>
          <button onClick={() => router.push('/')} style={{
            background: 'linear-gradient(135deg, #1A3A8F, #2563EB)',
            color: 'white', border: 'none', padding: '14px 32px',
            borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer',
            marginTop: '24px'
          }}>
            ← Retour à l'accueil
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #0D1B4B 0%, #1A3A8F 60%, #2563EB 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: 'Segoe UI, Arial, sans-serif'
    }}>
      <div style={{
        background: 'white', borderRadius: '24px',
        padding: '48px 40px', width: '100%', maxWidth: '460px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img src="/images/logo_centic.jpg" alt="CENTIC"
            style={{ width: '72px', height: '72px', borderRadius: '16px', objectFit: 'cover', marginBottom: '16px' }} />
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0D1B4B', marginBottom: '4px' }}>
            Espace Encadreur
          </h1>
          <p style={{ color: '#888', fontSize: '14px' }}>Créer votre compte</p>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: '10px', padding: '12px 16px',
            color: '#dc2626', fontSize: '14px', marginBottom: '20px'
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '18px' }}>
            <label style={labelStyle}>Nom complet *</label>
            <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })}
              placeholder="Votre nom et prénom" style={inputStyle} />
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={labelStyle}>Adresse email *</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="vous@exemple.com" style={inputStyle} />
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={labelStyle}>Téléphone</label>
            <input value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })}
              placeholder="6XXXXXXXX" style={inputStyle} />
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={labelStyle}>Mot de passe *</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="Au moins 6 caractères" style={inputStyle} />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={labelStyle}>Confirmer le mot de passe *</label>
            <input type="password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
              placeholder="••••••••" style={inputStyle} />
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '15px',
            background: loading ? '#93c5fd' : 'linear-gradient(135deg, #1A3A8F, #2563EB)',
            color: 'white', border: 'none', borderRadius: '12px',
            fontSize: '16px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer'
          }}>
            {loading ? '⏳ Création...' : 'Créer mon compte'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#888' }}>
          Vous avez déjà un compte ?{' '}
          <a href="/encadreur/connexion" style={{ color: '#2563EB', fontWeight: '700', textDecoration: 'none' }}>
            Se connecter
          </a>
        </p>
      </div>
    </div>
  )
}