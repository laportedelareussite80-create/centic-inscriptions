'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ModalEditionInscription from '@/components/ModalEditionInscription'

interface Inscription {
  id: string
  numero_inscription: string
  nom: string
  prenom: string
  sexe: string
  date_naissance: string
  lieu_naissance: string
  telephone: string
  telephone_whatsapp: string
  photo_url: string
  categorie: string
  statut: string
  etablissement: string
  a_recu_offre: boolean
  statut_adulte: string
  metier: string
  filiere: string
  niveau_etude: string
  email: string
  quartier: string
  ville: string
  created_at: string
  validated_at: string
  classe_id?: string
  classe?: { id: string; nom: string }
  session?: { id: string; nom: string }
  annee?: { id: string; nom: string; annee: number }
  modules?: { module: { id: string; nom: string } }[]
  tuteurs?: { nom_complet: string; telephone_principal: string; telephone_whatsapp: string; quartier: string }[]
}

export default function InscriptionsPage() {
  const [inscriptions, setInscriptions] = useState<Inscription[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [filterCategorie, setFilterCategorie] = useState('')
  const [selected, setSelected] = useState<Inscription | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [editionEnCours, setEditionEnCours] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchInscriptions()
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    const { data } = await supabase.from('classes').select('*').order('ordre')
    setClasses(data || [])
  }

  const fetchInscriptions = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('inscriptions')
      .select(`
        *,
        classe:classes(id, nom),
        session:sessions(id, nom),
        annee:annees_formation(id, nom, annee),
        modules:inscriptions_modules(module:modules(id, nom)),
        tuteurs(nom_complet, telephone_principal, telephone_whatsapp, quartier)
      `)
      .order('created_at', { ascending: false })
    setInscriptions(data || [])
    setLoading(false)
  }

  const filtered = inscriptions.filter(i => {
    const matchSearch = search === '' ||
      i.nom.toLowerCase().includes(search.toLowerCase()) ||
      (i.prenom || '').toLowerCase().includes(search.toLowerCase()) ||
      i.numero_inscription.toLowerCase().includes(search.toLowerCase())
    const matchStatut = filterStatut === '' || i.statut === filterStatut
    const matchCat = filterCategorie === '' || i.categorie === filterCategorie
    return matchSearch && matchStatut && matchCat
  })

  const handleStatut = async (id: string, statut: string) => {
    setSaving(true)
    const updateData: any = { statut }
    if (statut === 'VALIDE') updateData.validated_at = new Date().toISOString()
    await supabase.from('inscriptions').update(updateData).eq('id', id)
    await supabase.from('logs_admin').insert({
      action: statut === 'VALIDE' ? 'VALIDATION' : statut === 'DESACTIVE' ? 'DESACTIVATION' : 'REACTIVATION',
      inscription_id: id,
      details: `Statut changé vers ${statut}`
    })
    fetchInscriptions()
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, statut } : null)
    setSaving(false)
    setMessage({ type: 'success', text: `Inscription ${statut === 'VALIDE' ? 'validée' : statut === 'DESACTIVE' ? 'désactivée' : 'réactivée'} !` })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('⚠️ Supprimer définitivement cette inscription ? Cette action est irréversible.')) return
    await supabase.from('inscriptions').delete().eq('id', id)
    fetchInscriptions()
    setSelected(null)
    setMessage({ type: 'success', text: 'Inscription supprimée.' })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  const statutBadge = (statut: string) => {
    const s: Record<string, any> = {
      EN_ATTENTE: { bg: '#fef9c3', color: '#854d0e', label: '⏳ En attente' },
      VALIDE: { bg: '#dcfce7', color: '#166534', label: '✅ Validé' },
      DESACTIVE: { bg: '#fee2e2', color: '#991b1b', label: '🚫 Désactivé' },
    }
    const st = s[statut] || s.EN_ATTENTE
    return (
      <span style={{ background: st.bg, color: st.color, padding: '4px 12px',
        borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
        {st.label}
      </span>
    )
  }

  const categorieIcon: Record<string, string> = {
    PRIMAIRE: '🎒', SECONDAIRE: '🎓', ADULTE: '💼'
  }

  return (
    <div style={{ display: 'flex', gap: '24px', height: 'calc(100vh - 128px)' }}>

      {/* LISTE GAUCHE */}
      <div style={{ flex: selected ? '0 0 420px' : '1', display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#0D1B4B', marginBottom: '4px' }}>
            📋 Inscriptions
          </h1>
          <p style={{ color: '#888', fontSize: '13px' }}>
            {filtered.length} inscription(s) — {inscriptions.filter(i => i.statut === 'EN_ATTENTE').length} en attente
          </p>
        </div>

        {message.text && (
          <div style={{
            background: message.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: message.type === 'success' ? '#166534' : '#991b1b',
            padding: '10px 14px', borderRadius: '10px', marginBottom: '12px',
            fontSize: '13px', fontWeight: '600'
          }}>
            {message.text}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Rechercher..."
            style={{ flex: 1, minWidth: '160px', padding: '10px 14px', border: '2px solid #e5e7eb',
              borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }} />
          <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)}
            style={{ padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '10px',
              fontSize: '13px', fontFamily: 'inherit', outline: 'none', background: 'white' }}>
            <option value="">Tous statuts</option>
            <option value="EN_ATTENTE">⏳ En attente</option>
            <option value="VALIDE">✅ Validé</option>
            <option value="DESACTIVE">🚫 Désactivé</option>
          </select>
          <select value={filterCategorie} onChange={e => setFilterCategorie(e.target.value)}
            style={{ padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '10px',
              fontSize: '13px', fontFamily: 'inherit', outline: 'none', background: 'white' }}>
            <option value="">Toutes catégories</option>
            <option value="PRIMAIRE">🎒 Primaire</option>
            <option value="SECONDAIRE">🎓 Secondaire</option>
            <option value="ADULTE">💼 Adulte</option>
          </select>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>⏳ Chargement...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', background: 'white',
              borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: '32px', marginBottom: '8px' }}>📭</p>
              <p style={{ color: '#888' }}>Aucune inscription trouvée</p>
            </div>
          ) : filtered.map(ins => (
            <div key={ins.id}
              onClick={() => setSelected(selected?.id === ins.id ? null : ins)}
              style={{
                background: 'white', borderRadius: '12px', padding: '14px 16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer',
                border: `2px solid ${selected?.id === ins.id ? '#2563EB' : 'transparent'}`,
                transition: 'all 0.15s'
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {ins.photo_url ? (
                  <img src={ins.photo_url} alt=""
                    style={{ width: '44px', height: '44px', borderRadius: '10px',
                      objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: '44px', height: '44px', borderRadius: '10px',
                    background: '#f3f4f6', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                    {categorieIcon[ins.categorie]}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <p style={{ fontWeight: '800', color: '#0D1B4B', fontSize: '14px',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ins.nom} {ins.prenom || ''}
                    </p>
                    {statutBadge(ins.statut)}
                  </div>
                  <p style={{ fontSize: '12px', color: '#2563EB', fontWeight: '700' }}>
                    {ins.numero_inscription}
                  </p>
                  <p style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                    {categorieIcon[ins.categorie]} {ins.classe?.nom || ins.statut_adulte || ''}
                    {' · '}{new Date(ins.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DETAIL DROITE */}
      {selected && (
        <div style={{
          flex: 1, background: 'white', borderRadius: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          overflowY: 'auto', padding: '28px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {selected.photo_url ? (
                <img src={selected.photo_url} alt=""
                  style={{ width: '80px', height: '80px', borderRadius: '14px',
                    objectFit: 'cover', border: '3px solid #2563EB' }} />
              ) : (
                <div style={{ width: '80px', height: '80px', borderRadius: '14px',
                  background: '#f3f4f6', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '36px' }}>
                  {categorieIcon[selected.categorie]}
                </div>
              )}
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#0D1B4B', marginBottom: '4px' }}>
                  {selected.nom} {selected.prenom || ''}
                </h2>
                <p style={{ fontSize: '14px', color: '#2563EB', fontWeight: '700', marginBottom: '6px' }}>
                  {selected.numero_inscription}
                </p>
                {statutBadge(selected.statut)}
              </div>
            </div>
            <button onClick={() => setSelected(null)} style={{
              background: '#f3f4f6', border: 'none', borderRadius: '8px',
              padding: '8px 14px', cursor: 'pointer', fontSize: '14px', color: '#666', fontWeight: '700'
            }}>✕ Fermer</button>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {selected.statut === 'EN_ATTENTE' && (
              <button onClick={() => handleStatut(selected.id, 'VALIDE')} disabled={saving} style={{
                background: '#dcfce7', color: '#166534', border: 'none',
                padding: '10px 18px', borderRadius: '10px', fontSize: '13px',
                fontWeight: '700', cursor: 'pointer'
              }}>✅ Valider</button>
            )}
            {selected.statut === 'VALIDE' && (
              <button onClick={() => handleStatut(selected.id, 'DESACTIVE')} disabled={saving} style={{
                background: '#fef9c3', color: '#854d0e', border: 'none',
                padding: '10px 18px', borderRadius: '10px', fontSize: '13px',
                fontWeight: '700', cursor: 'pointer'
              }}>⏸ Désactiver</button>
            )}
            {selected.statut === 'DESACTIVE' && (
              <button onClick={() => handleStatut(selected.id, 'EN_ATTENTE')} disabled={saving} style={{
                background: '#eff6ff', color: '#2563EB', border: 'none',
                padding: '10px 18px', borderRadius: '10px', fontSize: '13px',
                fontWeight: '700', cursor: 'pointer'
              }}>▶ Réactiver</button>
            )}
            <button onClick={() => setEditionEnCours(true)} style={{
              background: '#fff7ed', color: '#c2410c', border: 'none',
              padding: '10px 18px', borderRadius: '10px', fontSize: '13px',
              fontWeight: '700', cursor: 'pointer'
            }}>✏️ Modifier</button>
            <button onClick={() => window.open(`/print/pdf/${selected.id}`, '_blank')} style={{
              background: '#f3e8ff', color: '#7c3aed', border: 'none',
              padding: '10px 18px', borderRadius: '10px', fontSize: '13px',
              fontWeight: '700', cursor: 'pointer'
            }}>📄 Fiche PDF</button>
            <button onClick={() => window.open(`/print/badge/${selected.id}`, '_blank')} style={{
              background: '#ecfdf5', color: '#059669', border: 'none',
              padding: '10px 18px', borderRadius: '10px', fontSize: '13px',
              fontWeight: '700', cursor: 'pointer'
            }}>🪪 Badge</button>
            <button onClick={() => handleDelete(selected.id)} style={{
              background: '#fee2e2', color: '#dc2626', border: 'none',
              padding: '10px 18px', borderRadius: '10px', fontSize: '13px',
              fontWeight: '700', cursor: 'pointer', marginLeft: 'auto'
            }}>🗑️ Supprimer</button>
          </div>

          {/* Infos */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

            <div style={{ background: '#f8faff', borderRadius: '14px', padding: '18px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0D1B4B',
                marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Apprenant
              </h3>
              {[
                { label: 'Sexe', value: selected.sexe === 'MASCULIN' ? 'Masculin' : 'Féminin' },
                { label: 'Naissance', value: `${new Date(selected.date_naissance).toLocaleDateString('fr-FR')} — ${selected.lieu_naissance}` },
                { label: 'Téléphone', value: selected.telephone || '—' },
                { label: 'WhatsApp', value: selected.telephone_whatsapp || '—' },
                ...(selected.categorie !== 'ADULTE' ? [
                  { label: 'Classe', value: selected.classe?.nom || '—' },
                  { label: 'Établissement', value: selected.etablissement || '—' },
                  { label: 'Offre reçue', value: selected.a_recu_offre ? '✅ Oui' : '❌ Non' },
                ] : [
                  { label: 'Statut', value: selected.statut_adulte || '—' },
                  { label: 'Métier/Filière', value: selected.metier || selected.filiere || '—' },
                  { label: 'Niveau', value: selected.niveau_etude || '—' },
                  { label: 'Email', value: selected.email || '—' },
                  { label: 'Quartier', value: selected.quartier || '—' },
                  { label: 'Ville', value: selected.ville || '—' },
                ]),
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between',
                  padding: '6px 0', borderBottom: '1px solid #e5e7eb', fontSize: '13px' }}>
                  <span style={{ color: '#888', fontWeight: '600' }}>{row.label}</span>
                  <span style={{ color: '#0D1B4B', fontWeight: '700', textAlign: 'right', maxWidth: '60%' }}>{row.value}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#f8faff', borderRadius: '14px', padding: '18px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0D1B4B',
                  marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Modules
                </h3>
                {selected.modules && selected.modules.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {selected.modules.map((m: any, i: number) => m.module && (
                      <span key={i} style={{ background: '#eff6ff', color: '#2563EB',
                        padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '700' }}>
                        📚 {m.module.nom}
                      </span>
                    ))}
                  </div>
                ) : <p style={{ color: '#888', fontSize: '13px' }}>Aucun module</p>}
              </div>

              {selected.categorie !== 'ADULTE' && selected.tuteurs && selected.tuteurs.length > 0 && (
                <div style={{ background: '#f8faff', borderRadius: '14px', padding: '18px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0D1B4B',
                    marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Parent / Tuteur
                  </h3>
                  {[
                    { label: 'Nom', value: selected.tuteurs[0].nom_complet },
                    { label: 'Téléphone', value: selected.tuteurs[0].telephone_principal },
                    { label: 'WhatsApp', value: selected.tuteurs[0].telephone_whatsapp || '—' },
                    { label: 'Quartier', value: selected.tuteurs[0].quartier || '—' },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between',
                      padding: '6px 0', borderBottom: '1px solid #e5e7eb', fontSize: '13px' }}>
                      <span style={{ color: '#888', fontWeight: '600' }}>{row.label}</span>
                      <span style={{ color: '#0D1B4B', fontWeight: '700' }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ background: '#f8faff', borderRadius: '14px', padding: '18px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0D1B4B',
                  marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Session
                </h3>
                {[
                  { label: 'Année', value: selected.annee?.nom || '—' },
                  { label: 'Session', value: selected.session?.nom || '—' },
                  { label: 'Inscrit le', value: new Date(selected.created_at).toLocaleDateString('fr-FR') },
                  { label: 'Validé le', value: selected.validated_at ? new Date(selected.validated_at).toLocaleDateString('fr-FR') : '—' },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between',
                    padding: '6px 0', borderBottom: '1px solid #e5e7eb', fontSize: '13px' }}>
                    <span style={{ color: '#888', fontWeight: '600' }}>{row.label}</span>
                    <span style={{ color: '#0D1B4B', fontWeight: '700' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {editionEnCours && selected && (
        <ModalEditionInscription
          inscription={selected as any}
          classes={classes}
          onClose={() => setEditionEnCours(false)}
          onSaved={(updated) => {
            setSelected(prev => prev ? { ...prev, ...updated } as Inscription : null)
            fetchInscriptions()
          }}
        />
      )}
    </div>
  )
}