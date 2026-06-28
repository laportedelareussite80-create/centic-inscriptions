'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Encadreur {
  id: string
  nom: string
  email: string
  telephone: string | null
  statut: 'EN_ATTENTE' | 'VALIDE' | 'REJETE'
  cree_a: string
  valide_a: string | null
}

export default function AdminEncadreursPage() {
  const supabase = createClient()
  const [encadreurs, setEncadreurs] = useState<Encadreur[]>([])
  const [loading, setLoading] = useState(true)
  const [filtre, setFiltre] = useState<'TOUS' | 'EN_ATTENTE' | 'VALIDE' | 'REJETE'>('EN_ATTENTE')
  const [actionEnCours, setActionEnCours] = useState<string | null>(null)

  useEffect(() => {
    fetchEncadreurs()
  }, [])

  const fetchEncadreurs = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('encadreurs')
      .select('*')
      .order('cree_a', { ascending: false })

    if (!error && data) setEncadreurs(data)
    setLoading(false)
  }

  const changerStatut = async (id: string, nouveauStatut: 'VALIDE' | 'REJETE') => {
    setActionEnCours(id)
    const { error } = await supabase
      .from('encadreurs')
      .update({
        statut: nouveauStatut,
        valide_a: nouveauStatut === 'VALIDE' ? new Date().toISOString() : null
      })
      .eq('id', id)

    if (!error) {
      setEncadreurs(prev => prev.map(e =>
        e.id === id ? { ...e, statut: nouveauStatut, valide_a: nouveauStatut === 'VALIDE' ? new Date().toISOString() : null } : e
      ))
    } else {
      alert('Une erreur est survenue. Veuillez réessayer.')
    }
    setActionEnCours(null)
  }

  const encadreursAffiches = filtre === 'TOUS'
    ? encadreurs
    : encadreurs.filter(e => e.statut === filtre)

  const compteurs = {
    en_attente: encadreurs.filter(e => e.statut === 'EN_ATTENTE').length,
    valides: encadreurs.filter(e => e.statut === 'VALIDE').length,
    rejetes: encadreurs.filter(e => e.statut === 'REJETE').length,
  }

  const statutBadge = (statut: string) => {
    const styles: Record<string, any> = {
      EN_ATTENTE: { background: '#fef9c3', color: '#854d0e', label: '⏳ En attente' },
      VALIDE: { background: '#dcfce7', color: '#166534', label: '✅ Validé' },
      REJETE: { background: '#fee2e2', color: '#991b1b', label: '🚫 Rejeté' },
    }
    const s = styles[statut] || styles.EN_ATTENTE
    return (
      <span style={{
        background: s.background, color: s.color,
        padding: '4px 12px', borderRadius: '20px',
        fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap'
      }}>{s.label}</span>
    )
  }

  const filtreBtn = (key: typeof filtre, label: string, count?: number) => (
    <button
      onClick={() => setFiltre(key)}
      style={{
        padding: '8px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer',
        background: filtre === key ? '#1A3A8F' : '#f3f4f6',
        color: filtre === key ? 'white' : '#666',
        fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px'
      }}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span style={{
          background: filtre === key ? 'rgba(255,255,255,0.25)' : '#E8510A',
          color: filtre === key ? 'white' : 'white',
          borderRadius: '10px', padding: '1px 7px', fontSize: '11px'
        }}>{count}</span>
      )}
    </button>
  )

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#0D1B4B', marginBottom: '6px' }}>
          Gestion des encadreurs
        </h1>
        <p style={{ color: '#888', fontSize: '14px' }}>
          Validez les comptes des encadreurs pour leur donner accès à l'interface d'appel
        </p>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {filtreBtn('EN_ATTENTE', 'En attente', compteurs.en_attente)}
        {filtreBtn('VALIDE', 'Validés', compteurs.valides)}
        {filtreBtn('REJETE', 'Rejetés', compteurs.rejetes)}
        {filtreBtn('TOUS', 'Tous')}
      </div>

      {/* Liste */}
      <div style={{
        background: 'white', borderRadius: '16px', padding: '8px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
      }}>
        {loading ? (
          <p style={{ color: '#888', textAlign: 'center', padding: '48px' }}>Chargement...</p>
        ) : encadreursAffiches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <p style={{ fontSize: '40px', marginBottom: '12px' }}>🧑‍🏫</p>
            <p style={{ color: '#888', fontSize: '14px' }}>
              {filtre === 'EN_ATTENTE' ? 'Aucun compte en attente de validation' : 'Aucun encadreur dans cette catégorie'}
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                {['Nom', 'Email', 'Téléphone', 'Statut', 'Date de demande', 'Actions'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '14px 16px',
                    fontSize: '12px', color: '#888', fontWeight: '700',
                    textTransform: 'uppercase', letterSpacing: '0.5px'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {encadreursAffiches.map((enc, i) => (
                <tr key={enc.id} style={{
                  borderBottom: '1px solid #f9fafb',
                  background: i % 2 === 0 ? 'white' : '#fafafa'
                }}>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#1a1a2e', fontWeight: '700' }}>
                    {enc.nom}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#666' }}>
                    {enc.email}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#666' }}>
                    {enc.telephone || '—'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {statutBadge(enc.statut)}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#888' }}>
                    {new Date(enc.cree_a).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {enc.statut === 'EN_ATTENTE' ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => changerStatut(enc.id, 'VALIDE')}
                          disabled={actionEnCours === enc.id}
                          style={{
                            background: '#10b981', color: 'white', border: 'none',
                            padding: '7px 14px', borderRadius: '8px', fontSize: '12px',
                            fontWeight: '700', cursor: 'pointer'
                          }}
                        >
                          ✓ Valider
                        </button>
                        <button
                          onClick={() => changerStatut(enc.id, 'REJETE')}
                          disabled={actionEnCours === enc.id}
                          style={{
                            background: '#fee2e2', color: '#991b1b', border: 'none',
                            padding: '7px 14px', borderRadius: '8px', fontSize: '12px',
                            fontWeight: '700', cursor: 'pointer'
                          }}
                        >
                          ✕ Rejeter
                        </button>
                      </div>
                    ) : enc.statut === 'VALIDE' ? (
                      <button
                        onClick={() => changerStatut(enc.id, 'REJETE')}
                        disabled={actionEnCours === enc.id}
                        style={{
                          background: '#f3f4f6', color: '#666', border: 'none',
                          padding: '7px 14px', borderRadius: '8px', fontSize: '12px',
                          fontWeight: '700', cursor: 'pointer'
                        }}
                      >
                        Révoquer l'accès
                      </button>
                    ) : (
                      <button
                        onClick={() => changerStatut(enc.id, 'VALIDE')}
                        disabled={actionEnCours === enc.id}
                        style={{
                          background: '#eff6ff', color: '#2563EB', border: 'none',
                          padding: '7px 14px', borderRadius: '8px', fontSize: '12px',
                          fontWeight: '700', cursor: 'pointer'
                        }}
                      >
                        Valider quand même
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}