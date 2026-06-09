'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Classe { id: string; nom: string; categorie: string; ordre: number }

const CLASSES_DEFAUT = [
  { nom: 'CE2', categorie: 'PRIMAIRE', ordre: 1 },
  { nom: 'CM1', categorie: 'PRIMAIRE', ordre: 2 },
  { nom: 'CM2', categorie: 'PRIMAIRE', ordre: 3 },
  { nom: '6ème', categorie: 'SECONDAIRE', ordre: 4 },
  { nom: '5ème', categorie: 'SECONDAIRE', ordre: 5 },
  { nom: '4ème', categorie: 'SECONDAIRE', ordre: 6 },
  { nom: '3ème', categorie: 'SECONDAIRE', ordre: 7 },
  { nom: '2nde', categorie: 'SECONDAIRE', ordre: 8 },
  { nom: '1ère', categorie: 'SECONDAIRE', ordre: 9 },
  { nom: 'Terminale', categorie: 'SECONDAIRE', ordre: 10 },
]

export default function ClassesPage() {
  const [classes, setClasses] = useState<Classe[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Classe | null>(null)
  const [form, setForm] = useState({ nom: '', categorie: 'PRIMAIRE', ordre: 0 })
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const supabase = createClient()

  useEffect(() => { fetchClasses() }, [])

  const fetchClasses = async () => {
    setLoading(true)
    const { data } = await supabase.from('classes').select('*').order('ordre')
    setClasses(data || [])
    setLoading(false)
  }

  const openCreate = () => {
    setEditItem(null)
    setForm({ nom: '', categorie: 'PRIMAIRE', ordre: classes.length + 1 })
    setShowForm(true)
  }

  const openEdit = (c: Classe) => {
    setEditItem(c)
    setForm({ nom: c.nom, categorie: c.categorie, ordre: c.ordre })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.nom.trim()) return
    setSaving(true)
    if (editItem) {
      await supabase.from('classes').update(form).eq('id', editItem.id)
      setMessage({ type: 'success', text: 'Classe modifiée !' })
    } else {
      await supabase.from('classes').insert(form)
      setMessage({ type: 'success', text: 'Classe créée !' })
    }
    setShowForm(false)
    fetchClasses()
    setSaving(false)
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette classe ?')) return
    await supabase.from('classes').delete().eq('id', id)
    fetchClasses()
    setMessage({ type: 'success', text: 'Classe supprimée.' })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  const importerDefaut = async () => {
    if (!confirm('Importer toutes les classes par défaut (CE2 → Terminale) ?')) return
    setImporting(true)
    await supabase.from('classes').insert(CLASSES_DEFAUT)
    fetchClasses()
    setImporting(false)
    setMessage({ type: 'success', text: 'Classes importées avec succès !' })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  const categorieColor: Record<string, string> = {
    PRIMAIRE: '#2563EB', SECONDAIRE: '#4F46E5', ADULTE: '#E8510A'
  }
  const categorieBg: Record<string, string> = {
    PRIMAIRE: '#eff6ff', SECONDAIRE: '#eef2ff', ADULTE: '#fff7ed'
  }
  const categorieLabel: Record<string, string> = {
    PRIMAIRE: '🎒 Primaire', SECONDAIRE: '🎓 Secondaire', ADULTE: '💼 Adulte'
  }

  const grouped = {
    PRIMAIRE: classes.filter(c => c.categorie === 'PRIMAIRE'),
    SECONDAIRE: classes.filter(c => c.categorie === 'SECONDAIRE'),
    ADULTE: classes.filter(c => c.categorie === 'ADULTE'),
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#0D1B4B', marginBottom: '4px' }}>
            🏫 Classes & Niveaux
          </h1>
          <p style={{ color: '#888', fontSize: '14px' }}>Gérez les classes disponibles par catégorie</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {classes.length === 0 && (
            <button onClick={importerDefaut} disabled={importing} style={{
              background: '#dcfce7', color: '#166534', border: 'none',
              padding: '12px 20px', borderRadius: '12px', fontSize: '14px',
              fontWeight: '700', cursor: 'pointer'
            }}>
              {importing ? '⏳...' : '⚡ Importer les classes par défaut'}
            </button>
          )}
          <button onClick={openCreate} style={{
            background: 'linear-gradient(135deg, #1A3A8F, #2563EB)', color: 'white',
            border: 'none', padding: '12px 24px', borderRadius: '12px',
            fontSize: '14px', fontWeight: '700', cursor: 'pointer'
          }}>
            ➕ Nouvelle classe
          </button>
        </div>
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
            {editItem ? '✏️ Modifier la classe' : '➕ Nouvelle classe'}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>
                Nom de la classe *
              </label>
              <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })}
                placeholder="Ex: CM2, 6ème, Terminale..."
                style={{ width: '100%', padding: '12px 14px', border: '2px solid #e5e7eb',
                  borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>
                Catégorie *
              </label>
              <select value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value })}
                style={{ width: '100%', padding: '12px 14px', border: '2px solid #e5e7eb',
                  borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }}>
                <option value="PRIMAIRE">🎒 Primaire</option>
                <option value="SECONDAIRE">🎓 Secondaire</option>
                <option value="ADULTE">💼 Adulte</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>
                Ordre
              </label>
              <input type="number" value={form.ordre} onChange={e => setForm({ ...form, ordre: Number(e.target.value) })}
                style={{ width: '100%', padding: '12px 14px', border: '2px solid #e5e7eb',
                  borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }} />
            </div>
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
      ) : classes.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '16px', padding: '60px',
          textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: '48px', marginBottom: '12px' }}>🏫</p>
          <p style={{ color: '#888', fontSize: '16px', marginBottom: '8px' }}>Aucune classe créée</p>
          <p style={{ color: '#aaa', fontSize: '14px' }}>Utilisez le bouton "Importer les classes par défaut" pour démarrer rapidement</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {(['PRIMAIRE', 'SECONDAIRE', 'ADULTE'] as const).map(cat => (
            grouped[cat].length > 0 && (
              <div key={cat} style={{
                background: 'white', borderRadius: '16px', padding: '20px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                border: `2px solid ${categorieBg[cat]}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px',
                  paddingBottom: '12px', borderBottom: `2px solid ${categorieBg[cat]}` }}>
                  <span style={{ fontSize: '20px' }}>
                    {cat === 'PRIMAIRE' ? '🎒' : cat === 'SECONDAIRE' ? '🎓' : '💼'}
                  </span>
                  <div>
                    <p style={{ fontWeight: '800', color: categorieColor[cat], fontSize: '15px' }}>
                      {categorieLabel[cat]}
                    </p>
                    <p style={{ fontSize: '12px', color: '#888' }}>{grouped[cat].length} classe(s)</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {grouped[cat].map(c => (
                    <div key={c.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', background: categorieBg[cat],
                      borderRadius: '10px'
                    }}>
                      <span style={{ fontWeight: '700', color: '#0D1B4B', fontSize: '14px' }}>{c.nom}</span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => openEdit(c)} style={{
                          background: 'white', color: '#2563EB', border: 'none',
                          padding: '4px 10px', borderRadius: '6px', fontSize: '12px',
                          fontWeight: '700', cursor: 'pointer'
                        }}>✏️</button>
                        <button onClick={() => handleDelete(c.id)} style={{
                          background: 'white', color: '#dc2626', border: 'none',
                          padding: '4px 10px', borderRadius: '6px', fontSize: '12px',
                          fontWeight: '700', cursor: 'pointer'
                        }}>🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  )
}