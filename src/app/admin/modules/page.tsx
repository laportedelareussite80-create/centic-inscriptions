'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import GestionGroupesModule from '@/components/GestionGroupesModule'

interface Classe { id: string; nom: string; categorie: string }
interface Module {
  id: string; nom: string; description: string;
  categorie: string; est_actif: boolean
  classes?: Classe[]
}

export default function ModulesPage() {
  const [modules, setModules] = useState<Module[]>([])
  const [classes, setClasses] = useState<Classe[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Module | null>(null)
  const [form, setForm] = useState({ nom: '', description: '', categorie: 'PRIMAIRE' })
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [moduleGroupes, setModuleGroupes] = useState<Module | null>(null)
  const supabase = createClient()

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: m }, { data: c }] = await Promise.all([
      supabase.from('modules').select('*, classes:modules_classes(classe:classes(*))').order('created_at', { ascending: false }),
      supabase.from('classes').select('*').order('ordre')
    ])
    setModules((m || []).map((mod: any) => ({
      ...mod,
      classes: mod.classes?.map((mc: any) => mc.classe) || []
    })))
    setClasses(c || [])
    setLoading(false)
  }

  const openCreate = () => {
    setEditItem(null)
    setForm({ nom: '', description: '', categorie: 'PRIMAIRE' })
    setSelectedClasses([])
    setShowForm(true)
  }

  const openEdit = async (m: Module) => {
    setEditItem(m)
    setForm({ nom: m.nom, description: m.description || '', categorie: m.categorie })
    const { data } = await supabase.from('modules_classes').select('classe_id').eq('module_id', m.id)
    setSelectedClasses((data || []).map((d: any) => d.classe_id))
    setShowForm(true)
  }

  const toggleClasse = (id: string) => {
    setSelectedClasses(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const handleSave = async () => {
    if (!form.nom.trim()) return
    setSaving(true)
    let moduleId = editItem?.id

    if (editItem) {
      await supabase.from('modules').update(form).eq('id', editItem.id)
      await supabase.from('modules_classes').delete().eq('module_id', editItem.id)
    } else {
      const { data } = await supabase.from('modules').insert({ ...form, est_actif: true }).select().single()
      moduleId = data?.id
    }

    if (moduleId && selectedClasses.length > 0) {
      await supabase.from('modules_classes').insert(
        selectedClasses.map(classe_id => ({ module_id: moduleId, classe_id }))
      )
    }

    setShowForm(false)
    fetchAll()
    setSaving(false)
    setMessage({ type: 'success', text: editItem ? 'Module modifié !' : 'Module créé !' })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  const toggleActif = async (m: Module) => {
    await supabase.from('modules').update({ est_actif: !m.est_actif }).eq('id', m.id)
    fetchAll()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce module ?')) return
    await supabase.from('modules').delete().eq('id', id)
    fetchAll()
    setMessage({ type: 'success', text: 'Module supprimé.' })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  const categorieColor: Record<string, string> = {
    PRIMAIRE: '#2563EB', SECONDAIRE: '#4F46E5', ADULTE: '#E8510A', MULTI: '#059669'
  }
  const categorieBg: Record<string, string> = {
    PRIMAIRE: '#eff6ff', SECONDAIRE: '#eef2ff', ADULTE: '#fff7ed', MULTI: '#ecfdf5'
  }
  const categorieLabel: Record<string, string> = {
    PRIMAIRE: '🎒 Primaire', SECONDAIRE: '🎓 Secondaire', ADULTE: '💼 Adulte', MULTI: '🌐 Multi'
  }

  const classesFiltrees = form.categorie === 'MULTI'
    ? classes
    : classes.filter(c => c.categorie === form.categorie)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#0D1B4B', marginBottom: '4px' }}>
            📚 Modules de formation
          </h1>
          <p style={{ color: '#888', fontSize: '14px' }}>Gérez les modules et associez-les aux classes</p>
        </div>
        <button onClick={openCreate} style={{
          background: 'linear-gradient(135deg, #1A3A8F, #2563EB)', color: 'white',
          border: 'none', padding: '12px 24px', borderRadius: '12px',
          fontSize: '14px', fontWeight: '700', cursor: 'pointer'
        }}>
          ➕ Nouveau module
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
            {editItem ? '✏️ Modifier le module' : '➕ Nouveau module'}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>
                Nom du module *
              </label>
              <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })}
                placeholder="Ex: Initiation à l'informatique"
                style={{ width: '100%', padding: '12px 14px', border: '2px solid #e5e7eb',
                  borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>
                Catégorie *
              </label>
              <select value={form.categorie} onChange={e => { setForm({ ...form, categorie: e.target.value }); setSelectedClasses([]) }}
                style={{ width: '100%', padding: '12px 14px', border: '2px solid #e5e7eb',
                  borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }}>
                <option value="PRIMAIRE">🎒 Primaire</option>
                <option value="SECONDAIRE">🎓 Secondaire</option>
                <option value="ADULTE">💼 Adulte</option>
                <option value="MULTI">🌐 Multi (toutes catégories)</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>
              Description
            </label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Description du module..." rows={2}
              style={{ width: '100%', padding: '12px 14px', border: '2px solid #e5e7eb',
                borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', resize: 'vertical' }} />
          </div>

          {/* Association aux classes */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '12px' }}>
              Classes autorisées pour ce module
            </label>
            {classesFiltrees.length === 0 ? (
              <p style={{ color: '#aaa', fontSize: '13px' }}>Aucune classe disponible pour cette catégorie</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedClasses(
                    selectedClasses.length === classesFiltrees.length
                      ? []
                      : classesFiltrees.map(c => c.id)
                  )}
                  style={{
                    padding: '6px 14px', borderRadius: '20px', border: '2px solid #0D1B4B',
                    background: selectedClasses.length === classesFiltrees.length ? '#0D1B4B' : 'white',
                    color: selectedClasses.length === classesFiltrees.length ? 'white' : '#0D1B4B',
                    fontSize: '13px', fontWeight: '700', cursor: 'pointer'
                  }}
                >
                  {selectedClasses.length === classesFiltrees.length ? '✓ Tout désélectionner' : 'Tout sélectionner'}
                </button>
                {classesFiltrees.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleClasse(c.id)}
                    style={{
                      padding: '6px 14px', borderRadius: '20px',
                      border: `2px solid ${selectedClasses.includes(c.id) ? categorieColor[form.categorie] : '#e5e7eb'}`,
                      background: selectedClasses.includes(c.id) ? categorieBg[form.categorie] : 'white',
                      color: selectedClasses.includes(c.id) ? categorieColor[form.categorie] : '#666',
                      fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s'
                    }}
                  >
                    {selectedClasses.includes(c.id) ? '✓ ' : ''}{c.nom}
                  </button>
                ))}
              </div>
            )}
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
      ) : modules.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '16px', padding: '60px',
          textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: '48px', marginBottom: '12px' }}>📚</p>
          <p style={{ color: '#888', fontSize: '16px' }}>Aucun module créé</p>
          <p style={{ color: '#aaa', fontSize: '14px' }}>Cliquez sur "Nouveau module" pour commencer</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {modules.map((m) => (
            <div key={m.id} style={{
              background: 'white', borderRadius: '14px', padding: '20px 24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: `2px solid ${m.est_actif ? categorieColor[m.categorie] : '#e5e7eb'}`
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <p style={{ fontSize: '16px', fontWeight: '800', color: '#0D1B4B' }}>{m.nom}</p>
                    <span style={{
                      background: categorieBg[m.categorie], color: categorieColor[m.categorie],
                      padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700'
                    }}>{categorieLabel[m.categorie]}</span>
                    {!m.est_actif && (
                      <span style={{ background: '#fee2e2', color: '#dc2626',
                        padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700'
                      }}>Inactif</span>
                    )}
                  </div>
                  {m.description && (
                    <p style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>{m.description}</p>
                  )}
                  {m.classes && m.classes.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {m.classes.map((c: any) => c && (
                        <span key={c.id} style={{
                          background: '#f3f4f6', color: '#374151',
                          padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600'
                        }}>{c.nom}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginLeft: '16px', flexShrink: 0 }}>
                  <button onClick={() => toggleActif(m)} style={{
                    background: m.est_actif ? '#fef9c3' : '#dcfce7',
                    color: m.est_actif ? '#854d0e' : '#166534',
                    border: 'none', padding: '8px 14px', borderRadius: '8px',
                    fontSize: '13px', fontWeight: '700', cursor: 'pointer'
                  }}>
                    {m.est_actif ? '⏸ Désactiver' : '▶ Activer'}
                  </button>
                  <button onClick={() => setModuleGroupes(m)} style={{
                    background: '#f0fdf4', color: '#15803d', border: 'none',
                    padding: '8px 14px', borderRadius: '8px', fontSize: '13px',
                    fontWeight: '700', cursor: 'pointer'
                  }}>👥 Groupes</button>
                  <button onClick={() => openEdit(m)} style={{
                    background: '#eff6ff', color: '#2563EB', border: 'none',
                    padding: '8px 14px', borderRadius: '8px', fontSize: '13px',
                    fontWeight: '700', cursor: 'pointer'
                  }}>✏️ Modifier</button>
                  <button onClick={() => handleDelete(m.id)} style={{
                    background: '#fee2e2', color: '#dc2626', border: 'none',
                    padding: '8px 14px', borderRadius: '8px', fontSize: '13px',
                    fontWeight: '700', cursor: 'pointer'
                  }}>🗑️ Supprimer</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {moduleGroupes && (
        <GestionGroupesModule
          moduleId={moduleGroupes.id}
          moduleNom={moduleGroupes.nom}
          onClose={() => setModuleGroupes(null)}
        />
      )}
    </div>
  )
}