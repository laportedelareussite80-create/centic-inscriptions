'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Annee { id: string; nom: string; annee: number }
interface Session {
  id: string; annee_id: string; nom: string;
  categorie: string; description: string; est_active: boolean
  annee?: Annee
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [annees, setAnnees] = useState<Annee[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Session | null>(null)
  const [form, setForm] = useState({ annee_id: '', nom: '', categorie: 'PRIMAIRE', description: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const supabase = createClient()

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: s }, { data: a }] = await Promise.all([
      supabase.from('sessions').select('*, annee:annees_formation(id,nom,annee)').order('created_at', { ascending: false }),
      supabase.from('annees_formation').select('*').order('annee', { ascending: false })
    ])
    setSessions(s || [])
    setAnnees(a || [])
    setLoading(false)
  }

  const openCreate = () => {
    setEditItem(null)
    setForm({ annee_id: annees[0]?.id || '', nom: '', categorie: 'PRIMAIRE', description: '' })
    setShowForm(true)
  }

  const openEdit = (s: Session) => {
    setEditItem(s)
    setForm({ annee_id: s.annee_id, nom: s.nom, categorie: s.categorie, description: s.description || '' })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.nom.trim() || !form.annee_id) return
    setSaving(true)
    if (editItem) {
      await supabase.from('sessions').update(form).eq('id', editItem.id)
      setMessage({ type: 'success', text: 'Session modifiée avec succès !' })
    } else {
      await supabase.from('sessions').insert({ ...form, est_active: true })
      setMessage({ type: 'success', text: 'Session créée avec succès !' })
    }
    setShowForm(false)
    fetchAll()
    setSaving(false)
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  const toggleActive = async (s: Session) => {
    await supabase.from('sessions').update({ est_active: !s.est_active }).eq('id', s.id)
    fetchAll()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette session ?')) return
    await supabase.from('sessions').delete().eq('id', id)
    fetchAll()
    setMessage({ type: 'success', text: 'Session supprimée.' })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  const categorieLabel: Record<string, string> = {
    PRIMAIRE: '🎒 Primaire', SECONDAIRE: '🎓 Secondaire', ADULTE: '💼 Adulte'
  }
  const categorieColor: Record<string, string> = {
    PRIMAIRE: '#2563EB', SECONDAIRE: '#4F46E5', ADULTE: '#E8510A'
  }
  const categorieBg: Record<string, string> = {
    PRIMAIRE: '#eff6ff', SECONDAIRE: '#eef2ff', ADULTE: '#fff7ed'
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#0D1B4B', marginBottom: '4px' }}>
            🗂️ Sessions de formation
          </h1>
          <p style={{ color: '#888', fontSize: '14px' }}>Gérez les sessions par année et catégorie</p>
        </div>
        <button onClick={openCreate} style={{
          background: 'linear-gradient(135deg, #1A3A8F, #2563EB)', color: 'white',
          border: 'none', padding: '12px 24px', borderRadius: '12px',
          fontSize: '14px', fontWeight: '700', cursor: 'pointer'
        }}>
          ➕ Nouvelle session
        </button>
      </div>

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

      {showForm && (
        <div style={{
          background: 'white', borderRadius: '16px', padding: '28px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)', marginBottom: '24px',
          border: '2px solid #2563EB'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0D1B4B', marginBottom: '20px' }}>
            {editItem ? '✏️ Modifier la session' : '➕ Nouvelle session'}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>
                Année de formation *
              </label>
              <select value={form.annee_id} onChange={e => setForm({ ...form, annee_id: e.target.value })}
                style={{ width: '100%', padding: '12px 14px', border: '2px solid #e5e7eb',
                  borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }}>
                <option value="">-- Choisir une année --</option>
                {annees.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>
                Catégorie *
              </label>
              <select value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value })}
                style={{ width: '100%', padding: '12px 14px', border: '2px solid #e5e7eb',
                  borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }}>
                <option value="PRIMAIRE">🎒 Primaire — Kids Digital Camps</option>
                <option value="SECONDAIRE">🎓 Secondaire — Vacances Numériques</option>
                <option value="ADULTE">💼 Adulte — Formation Adultes/Étudiants</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>
              Nom de la session *
            </label>
            <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })}
              placeholder="Ex: Kids Digital Camps 2026"
              style={{ width: '100%', padding: '12px 14px', border: '2px solid #e5e7eb',
                borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }} />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>
              Description
            </label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Description de la session..." rows={3}
              style={{ width: '100%', padding: '12px 14px', border: '2px solid #e5e7eb',
                borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleSave} disabled={saving} style={{
              background: 'linear-gradient(135deg, #1A3A8F, #2563EB)', color: 'white',
              border: 'none', padding: '12px 28px', borderRadius: '10px',
              fontSize: '14px', fontWeight: '700', cursor: 'pointer'
            }}>
              {saving ? '⏳ Enregistrement...' : '💾 Enregistrer'}
            </button>
            <button onClick={() => setShowForm(false)} style={{
              background: '#f3f4f6', color: '#666', border: 'none',
              padding: '12px 24px', borderRadius: '10px', fontSize: '14px',
              fontWeight: '700', cursor: 'pointer'
            }}>Annuler</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>⏳ Chargement...</div>
      ) : sessions.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '16px', padding: '60px',
          textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: '48px', marginBottom: '12px' }}>🗂️</p>
          <p style={{ color: '#888', fontSize: '16px' }}>Aucune session créée</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sessions.map((s) => (
            <div key={s.id} style={{
              background: 'white', borderRadius: '14px', padding: '20px 24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              border: `2px solid ${s.est_active ? categorieColor[s.categorie] : '#e5e7eb'}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: categorieBg[s.categorie],
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px'
                }}>
                  {s.categorie === 'PRIMAIRE' ? '🎒' : s.categorie === 'SECONDAIRE' ? '🎓' : '💼'}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <p style={{ fontSize: '16px', fontWeight: '800', color: '#0D1B4B' }}>{s.nom}</p>
                    <span style={{
                      background: categorieBg[s.categorie], color: categorieColor[s.categorie],
                      padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700'
                    }}>{categorieLabel[s.categorie]}</span>
                    {s.est_active && <span style={{ background: '#dcfce7', color: '#166534',
                      padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700'
                    }}>✅ Active</span>}
                  </div>
                  <p style={{ fontSize: '13px', color: '#888' }}>
                    {(s.annee as any)?.nom || ''} {s.description && `— ${s.description}`}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => toggleActive(s)} style={{
                  background: s.est_active ? '#fef9c3' : '#dcfce7',
                  color: s.est_active ? '#854d0e' : '#166534',
                  border: 'none', padding: '8px 14px', borderRadius: '8px',
                  fontSize: '13px', fontWeight: '700', cursor: 'pointer'
                }}>
                  {s.est_active ? '⏸ Désactiver' : '▶ Activer'}
                </button>
                <button onClick={() => openEdit(s)} style={{
                  background: '#eff6ff', color: '#2563EB', border: 'none',
                  padding: '8px 14px', borderRadius: '8px', fontSize: '13px',
                  fontWeight: '700', cursor: 'pointer'
                }}>✏️ Modifier</button>
                <button onClick={() => handleDelete(s.id)} style={{
                  background: '#fee2e2', color: '#dc2626', border: 'none',
                  padding: '8px 14px', borderRadius: '8px', fontSize: '13px',
                  fontWeight: '700', cursor: 'pointer'
                }}>🗑️ Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}