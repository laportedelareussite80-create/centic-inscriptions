'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Groupe { id: string; nom: string; module_id: string }
interface ElevePourGroupe {
  inscription_id: string
  nom: string
  prenom: string | null
  numero_inscription: string
  groupe_id: string | null
}

export default function GestionGroupesModule({ moduleId, moduleNom, onClose }: {
  moduleId: string
  moduleNom: string
  onClose: () => void
}) {
  const supabase = createClient()
  const [groupes, setGroupes] = useState<Groupe[]>([])
  const [eleves, setEleves] = useState<ElevePourGroupe[]>([])
  const [loading, setLoading] = useState(true)
  const [nouveauGroupe, setNouveauGroupe] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchData()
  }, [moduleId])

  const fetchData = async () => {
    setLoading(true)
    const [{ data: g }, { data: im }] = await Promise.all([
      supabase.from('groupes').select('*').eq('module_id', moduleId).order('nom'),
      supabase
        .from('inscriptions_modules')
        .select('inscription_id, groupe_id, inscription:inscriptions(nom, prenom, numero_inscription)')
        .eq('module_id', moduleId)
    ])

    setGroupes(g || [])
    setEleves((im || []).map((row: any) => ({
      inscription_id: row.inscription_id,
      groupe_id: row.groupe_id,
      nom: row.inscription?.nom || '',
      prenom: row.inscription?.prenom || null,
      numero_inscription: row.inscription?.numero_inscription || '',
    })).sort((a: ElevePourGroupe, b: ElevePourGroupe) => a.nom.localeCompare(b.nom)))
    setLoading(false)
  }

const creerGroupe = async () => {
    if (!nouveauGroupe.trim()) return
    setCreating(true)
    const { data, error } = await supabase
      .from('groupes')
      .insert({ module_id: moduleId, nom: nouveauGroupe.trim() })
      .select()
      .single()

    if (!error && data) {
      setGroupes(prev => [...prev, data].sort((a, b) => a.nom.localeCompare(b.nom)))
      setNouveauGroupe('')
    } else {
      alert('Une erreur est survenue lors de la création du groupe.')
    }
    setCreating(false)
  }
  
  const supprimerGroupe = async (groupeId: string) => {
    if (!confirm('Supprimer ce groupe ? Les élèves assignés repasseront en "Sans groupe".')) return
    const { error } = await supabase.from('groupes').delete().eq('id', groupeId)
    if (!error) {
      setGroupes(prev => prev.filter(g => g.id !== groupeId))
      setEleves(prev => prev.map(e => e.groupe_id === groupeId ? { ...e, groupe_id: null } : e))
    }
  }

  const assignerGroupe = async (inscriptionId: string, groupeId: string | null) => {
    setEleves(prev => prev.map(e =>
      e.inscription_id === inscriptionId ? { ...e, groupe_id: groupeId } : e
    ))
    const { error } = await supabase
      .from('inscriptions_modules')
      .update({ groupe_id: groupeId })
      .eq('inscription_id', inscriptionId)
      .eq('module_id', moduleId)

    if (error) {
      alert('Une erreur est survenue lors de l\'assignation. Veuillez réessayer.')
      fetchData()
    }
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div style={{
        background: 'white', borderRadius: '20px', padding: '32px',
        width: '100%', maxWidth: '720px', maxHeight: '85vh',
        overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0D1B4B', marginBottom: '4px' }}>
              👥 Groupes — {moduleNom}
            </h2>
            <p style={{ color: '#888', fontSize: '13px' }}>
              Créez des groupes et assignez les apprenants inscrits à ce module
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: '22px',
            cursor: 'pointer', color: '#999'
          }}>✕</button>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#888', padding: '40px' }}>⏳ Chargement...</p>
        ) : (
          <>
            {/* Création de groupe */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '10px' }}>
                Groupes de ce module
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                {groupes.length === 0 ? (
                  <p style={{ color: '#aaa', fontSize: '13px' }}>
                    Aucun groupe créé — tous les apprenants apparaîtront ensemble lors de l'appel
                  </p>
                ) : (
                  groupes.map(g => (
                    <span key={g.id} style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      background: '#eff6ff', color: '#2563EB',
                      padding: '6px 8px 6px 14px', borderRadius: '20px',
                      fontSize: '13px', fontWeight: '700'
                    }}>
                      {g.nom}
                      <button onClick={() => supprimerGroupe(g.id)} style={{
                        background: 'rgba(37,99,235,0.15)', border: 'none', borderRadius: '50%',
                        width: '20px', height: '20px', cursor: 'pointer', color: '#2563EB',
                        fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>✕</button>
                    </span>
                  ))
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  value={nouveauGroupe}
                  onChange={e => setNouveauGroupe(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && creerGroupe()}
                  placeholder="Ex: Groupe 1"
                  style={{
                    flex: 1, padding: '10px 14px', border: '2px solid #e5e7eb',
                    borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', outline: 'none'
                  }}
                />
                <button onClick={creerGroupe} disabled={creating || !nouveauGroupe.trim()} style={{
                  background: '#1A3A8F', color: 'white', border: 'none',
                  padding: '10px 20px', borderRadius: '10px', fontSize: '14px',
                  fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap'
                }}>
                  + Ajouter
                </button>
              </div>
            </div>

            {/* Liste des élèves */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '10px' }}>
                Apprenants inscrits ({eleves.length})
              </label>
              {eleves.length === 0 ? (
                <p style={{ color: '#aaa', fontSize: '13px', textAlign: 'center', padding: '24px', background: '#f9fafb', borderRadius: '10px' }}>
                  Aucun apprenant inscrit à ce module pour le moment
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {eleves.map(el => (
                    <div key={el.inscription_id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', background: '#fafafa', borderRadius: '10px'
                    }}>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: '700', color: '#0D1B4B' }}>
                          {el.nom} {el.prenom || ''}
                        </p>
                        <p style={{ fontSize: '12px', color: '#888' }}>{el.numero_inscription}</p>
                      </div>
                      <select
                        value={el.groupe_id || ''}
                        onChange={e => assignerGroupe(el.inscription_id, e.target.value || null)}
                        style={{
                          padding: '8px 12px', border: '2px solid #e5e7eb', borderRadius: '8px',
                          fontSize: '13px', fontFamily: 'inherit', outline: 'none', fontWeight: '600',
                          color: '#374151', background: 'white'
                        }}
                      >
                        <option value="">Sans groupe</option>
                        {groupes.map(g => (
                          <option key={g.id} value={g.id}>{g.nom}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}