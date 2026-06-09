'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Annee {
  id: string
  nom: string
  annee: number
  est_active: boolean
  created_at: string
}

export default function AnneesPage() {
  const [annees, setAnnees] = useState<Annee[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Annee | null>(null)
  const [nom, setNom] = useState('')
  const [annee, setAnnee] = useState(new Date().getFullYear())
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const supabase = createClient()

  useEffect(() => { fetchAnnees() }, [])

  const fetchAnnees = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('annees_formation')
      .select('*')
      .order('annee', { ascending: false })
    setAnnees(data || [])
    setLoading(false)
  }

  const openCreate = () => {
    setEditItem(null)
    setNom('')
    setAnnee(new Date().getFullYear())
    setShowForm(true)
  }

  const openEdit = (a: Annee) => {
    setEditItem(a)
    setNom(a.nom)
    setAnnee(a.annee)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!nom.trim()) return
    setSaving(true)
    if (editItem) {
      await supabase.from('annees_formation').update({ nom, annee }).eq('id', editItem.id)
      setMessage({ type: 'success', text: 'Année modifiée avec succès !' })
    } else {
      await supabase.from('annees_formation').insert({ nom, annee, est_active: false })
      setMessage({ type: 'success', text: 'Année créée avec succès !' })
    }
    setShowForm(false)
    fetchAnnees()
    setSaving(false)
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  const toggleActive = async (a: Annee) => {
    await supabase.from('annees_formation').update({ est_active: !a.est_active }).eq('id', a.id)
    fetchAnnees()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette année ? Toutes les sessions associées seront supprimées.')) return
    await supabase.from('annees_formation').delete().eq('id', id)
    fetchAnnees()
    setMessage({ type: 'success', text: 'Année supprimée.' })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  return (
    <div>
      {/* Titre */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#0D1B4B', marginBottom: '4px' }}>
            📅 Années de formation
          </h1>
          <p style={{ color: '#888', fontSize: '14px' }}>Gérez les années de formation CENTIC</p>
        </div>
        <button onClick={openCreate} style={{
          background: 'linear-gradient(135deg, #1A3A8F, #2563EB)',
          color: 'white', border: 'none', padding: '12px 24px',
          borderRadius: '12px', fontSize: '14px', fontWeight: '700',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          ➕ Nouvelle année
        </button>
      </div>

      {/* Message */}
      {message.text && (
        <div style={{
          background: message.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: message.type === 'success' ? '#166534' : '#991b1b',
          padding: '12px 16px', borderRadius: '10px', marginBottom: '20px',
          fontSize: '14px', fontWeight: '600'
        }}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      {/* Formulaire */}
      {showForm && (
        <div style={{
          background: 'white', borderRadius: '16px', padding: '28px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)', marginBottom: '24px',
          border: '2px solid #2563EB'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0D1B4B', marginBottom: '20px' }}>
            {editItem ? '✏️ Modifier l\'année' : '➕ Nouvelle année'}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700',
                color: '#374151', marginBottom: '8px' }}>
                Nom de l'année *
              </label>
              <input
                value={nom}
                onChange={e => setNom(e.target.value)}
                placeholder="Ex: Vacances Numériques 2026"
                style={{
                  width: '100%', padding: '12px 14px',
                  border: '2px solid #e5e7eb', borderRadius: '10px',
                  fontSize: '14px', outline: 'none', fontFamily: 'inherit'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700',
                color: '#374151', marginBottom: '8px' }}>
                Année *
              </label>
              <input
                type="number"
                value={annee}
                onChange={e => setAnnee(Number(e.target.value))}
                style={{
                  width: '100%', padding: '12px 14px',
                  border: '2px solid #e5e7eb', borderRadius: '10px',
                  fontSize: '14px', outline: 'none', fontFamily: 'inherit'
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleSave} disabled={saving} style={{
              background: 'linear-gradient(135deg, #1A3A8F, #2563EB)',
              color: 'white', border: 'none', padding: '12px 28px',
              borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer'
            }}>
              {saving ? '⏳ Enregistrement...' : '💾 Enregistrer'}
            </button>
            <button onClick={() => setShowForm(false)} style={{
              background: '#f3f4f6', color: '#666', border: 'none',
              padding: '12px 24px', borderRadius: '10px', fontSize: '14px',
              fontWeight: '700', cursor: 'pointer'
            }}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>⏳ Chargement...</div>
      ) : annees.length === 0 ? (
        <div style={{
          background: 'white', borderRadius: '16px', padding: '60px',
          textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
        }}>
          <p style={{ fontSize: '48px', marginBottom: '12px' }}>📅</p>
          <p style={{ color: '#888', fontSize: '16px', marginBottom: '4px' }}>Aucune année créée</p>
          <p style={{ color: '#aaa', fontSize: '14px' }}>Cliquez sur "Nouvelle année" pour commencer</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {annees.map((a) => (
            <div key={a.id} style={{
              background: 'white', borderRadius: '14px', padding: '20px 24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              border: a.est_active ? '2px solid #10b981' : '2px solid transparent'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: a.est_active ? '#ecfdf5' : '#f3f4f6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px'
                }}>📅</div>
                <div>
                  <p style={{ fontSize: '16px', fontWeight: '800', color: '#0D1B4B', marginBottom: '2px' }}>
                    {a.nom}
                  </p>
                  <p style={{ fontSize: '13px', color: '#888' }}>Année : {a.annee}</p>
                </div>
                {a.est_active && (
                  <span style={{
                    background: '#dcfce7', color: '#166534',
                    padding: '4px 12px', borderRadius: '20px',
                    fontSize: '12px', fontWeight: '700'
                  }}>✅ Active</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => toggleActive(a)} style={{
                  background: a.est_active ? '#fef9c3' : '#dcfce7',
                  color: a.est_active ? '#854d0e' : '#166534',
                  border: 'none', padding: '8px 16px', borderRadius: '8px',
                  fontSize: '13px', fontWeight: '700', cursor: 'pointer'
                }}>
                  {a.est_active ? '⏸ Désactiver' : '▶ Activer'}
                </button>
                <button onClick={() => openEdit(a)} style={{
                  background: '#eff6ff', color: '#2563EB', border: 'none',
                  padding: '8px 16px', borderRadius: '8px', fontSize: '13px',
                  fontWeight: '700', cursor: 'pointer'
                }}>
                  ✏️ Modifier
                </button>
                <button onClick={() => handleDelete(a.id)} style={{
                  background: '#fee2e2', color: '#dc2626', border: 'none',
                  padding: '8px 16px', borderRadius: '8px', fontSize: '13px',
                  fontWeight: '700', cursor: 'pointer'
                }}>
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}