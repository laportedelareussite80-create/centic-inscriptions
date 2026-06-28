'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Classe { id: string; nom: string; categorie: string }
interface ModuleOption { id: string; nom: string; categorie: string }

interface InscriptionEditable {
  id: string
  nom: string
  prenom: string | null
  sexe: string
  date_naissance: string
  lieu_naissance: string
  telephone: string | null
  telephone_whatsapp: string | null
  categorie: string
  classe_id?: string | null
  etablissement?: string | null
  statut_adulte?: string | null
  metier?: string | null
  filiere?: string | null
  niveau_etude?: string | null
  email?: string | null
  quartier?: string | null
  ville?: string | null
  tuteurs?: { nom_complet: string; telephone_principal: string; telephone_whatsapp: string | null; quartier: string | null }[]
}

export default function ModalEditionInscription({
  inscription, classes, onClose, onSaved
}: {
  inscription: InscriptionEditable
  classes: Classe[]
  onClose: () => void
  onSaved: (updated: Partial<InscriptionEditable>) => void
}) {
  const supabase = createClient()
  const [form, setForm] = useState({
    nom: inscription.nom || '',
    prenom: inscription.prenom || '',
    sexe: inscription.sexe || '',
    date_naissance: inscription.date_naissance || '',
    lieu_naissance: inscription.lieu_naissance || '',
    telephone: inscription.telephone || '',
    telephone_whatsapp: inscription.telephone_whatsapp || '',
    classe_id: inscription.classe_id || '',
    etablissement: inscription.etablissement || '',
    statut_adulte: inscription.statut_adulte || '',
    metier: inscription.metier || '',
    filiere: inscription.filiere || '',
    niveau_etude: inscription.niveau_etude || '',
    email: inscription.email || '',
    quartier: inscription.quartier || '',
    ville: inscription.ville || '',
  })

  const [tuteur, setTuteur] = useState({
    nom_complet: inscription.tuteurs?.[0]?.nom_complet || '',
    telephone_principal: inscription.tuteurs?.[0]?.telephone_principal || '',
    telephone_whatsapp: inscription.tuteurs?.[0]?.telephone_whatsapp || '',
    quartier: inscription.tuteurs?.[0]?.quartier || '',
  })

  const [modulesDisponibles, setModulesDisponibles] = useState<ModuleOption[]>([])
  const [modulesSelectionnes, setModulesSelectionnes] = useState<string[]>([])
  const [chargementModules, setChargementModules] = useState(true)

  const [saving, setSaving] = useState(false)
  const [erreur, setErreur] = useState('')

  const classesFiltrees = classes.filter(c => c.categorie === inscription.categorie)

  useEffect(() => {
    fetchModulesData()
  }, [])

  const fetchModulesData = async () => {
    setChargementModules(true)
    const [{ data: tousLesModules }, { data: modulesActuels }] = await Promise.all([
      supabase
        .from('modules')
        .select('id, nom, categorie')
        .eq('est_actif', true)
        .or(`categorie.eq.${inscription.categorie},categorie.eq.MULTI`)
        .order('nom'),
      supabase
        .from('inscriptions_modules')
        .select('module_id')
        .eq('inscription_id', inscription.id),
    ])
    setModulesDisponibles(tousLesModules || [])
    setModulesSelectionnes((modulesActuels || []).map((m: any) => m.module_id))
    setChargementModules(false)
  }

  const toggleModule = (moduleId: string) => {
    setModulesSelectionnes(prev =>
      prev.includes(moduleId) ? prev.filter(m => m !== moduleId) : [...prev, moduleId]
    )
  }

  const handleSave = async () => {
    if (!form.nom.trim()) {
      setErreur('Le nom est obligatoire.')
      return
    }
    if (!form.sexe) {
      setErreur('Le sexe est obligatoire.')
      return
    }
    if (!form.date_naissance) {
      setErreur('La date de naissance est obligatoire.')
      return
    }

    setErreur('')
    setSaving(true)

    const updateData: any = {
      nom: form.nom.trim(),
      prenom: form.prenom.trim() || null,
      sexe: form.sexe,
      date_naissance: form.date_naissance,
      lieu_naissance: form.lieu_naissance.trim(),
      telephone: form.telephone.trim() || null,
      telephone_whatsapp: form.telephone_whatsapp.trim() || null,
    }

    if (inscription.categorie !== 'ADULTE') {
      updateData.classe_id = form.classe_id || null
      updateData.etablissement = form.etablissement.trim() || null
    } else {
      updateData.statut_adulte = form.statut_adulte || null
      updateData.metier = form.statut_adulte === 'PROFESSIONNEL' ? (form.metier.trim() || null) : null
      updateData.filiere = form.statut_adulte === 'ETUDIANT' ? (form.filiere.trim() || null) : null
      updateData.niveau_etude = form.statut_adulte === 'ETUDIANT' ? (form.niveau_etude.trim() || null) : null
      updateData.email = form.email.trim() || null
      updateData.quartier = form.quartier.trim() || null
      updateData.ville = form.ville.trim() || null
    }

    const { error: inscriptionError } = await supabase
      .from('inscriptions')
      .update(updateData)
      .eq('id', inscription.id)

    if (inscriptionError) {
      console.error(inscriptionError)
      setErreur('Une erreur est survenue lors de l\'enregistrement. Veuillez réessayer.')
      setSaving(false)
      return
    }

    const { error: deleteModulesError } = await supabase
      .from('inscriptions_modules')
      .delete()
      .eq('inscription_id', inscription.id)

    if (!deleteModulesError && modulesSelectionnes.length > 0) {
      await supabase.from('inscriptions_modules').insert(
        modulesSelectionnes.map(module_id => ({ inscription_id: inscription.id, module_id }))
      )
    }

    if (inscription.categorie !== 'ADULTE' && tuteur.nom_complet.trim()) {
      const { data: tuteurExistant } = await supabase
        .from('tuteurs')
        .select('id')
        .eq('inscription_id', inscription.id)
        .maybeSingle()

      const tuteurData = {
        nom_complet: tuteur.nom_complet.trim(),
        telephone_principal: tuteur.telephone_principal.trim(),
        telephone_whatsapp: tuteur.telephone_whatsapp.trim() || null,
        quartier: tuteur.quartier.trim() || null,
      }

      if (tuteurExistant) {
        await supabase.from('tuteurs').update(tuteurData).eq('id', tuteurExistant.id)
      } else {
        await supabase.from('tuteurs').insert({ inscription_id: inscription.id, ...tuteurData })
      }
    }

    onSaved(updateData)
    setSaving(false)
    onClose()
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb',
    borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', outline: 'none'
  }
  const labelStyle = {
    display: 'block' as const, fontSize: '12px', fontWeight: '700' as const,
    color: '#374151', marginBottom: '6px'
  }
  const sectionTitleStyle = {
    fontSize: '13px', fontWeight: '800' as const, color: '#0D1B4B',
    textTransform: 'uppercase' as const, letterSpacing: '0.5px',
    marginTop: '24px', marginBottom: '14px', paddingTop: '20px', borderTop: '1px solid #f0f0f0'
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div style={{
        background: 'white', borderRadius: '20px', padding: '32px',
        width: '100%', maxWidth: '620px', maxHeight: '85vh',
        overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0D1B4B', marginBottom: '4px' }}>
              ✏️ Modifier les informations
            </h2>
            <p style={{ color: '#888', fontSize: '13px' }}>
              Corrigez les erreurs de saisie signalées par le parent ou l'apprenant
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: '22px',
            cursor: 'pointer', color: '#999'
          }}>✕</button>
        </div>

        {erreur && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px',
            padding: '10px 14px', color: '#dc2626', fontSize: '13px', marginBottom: '16px'
          }}>
            ⚠️ {erreur}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
          <div>
            <label style={labelStyle}>Nom *</label>
            <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Prénom</label>
            <input value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} style={inputStyle} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
          <div>
            <label style={labelStyle}>Sexe *</label>
            <select value={form.sexe} onChange={e => setForm({ ...form, sexe: e.target.value })} style={inputStyle}>
              <option value="">-- Choisir --</option>
              <option value="MASCULIN">Masculin</option>
              <option value="FEMININ">Féminin</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Date de naissance *</label>
            <input type="date" value={form.date_naissance} onChange={e => setForm({ ...form, date_naissance: e.target.value })} style={inputStyle} />
          </div>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>Lieu de naissance</label>
          <input value={form.lieu_naissance} onChange={e => setForm({ ...form, lieu_naissance: e.target.value })} style={inputStyle} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
          <div>
            <label style={labelStyle}>Téléphone</label>
            <input value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>WhatsApp</label>
            <input value={form.telephone_whatsapp} onChange={e => setForm({ ...form, telephone_whatsapp: e.target.value })} style={inputStyle} />
          </div>
        </div>

        {inscription.categorie !== 'ADULTE' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={labelStyle}>Classe</label>
              <select value={form.classe_id} onChange={e => setForm({ ...form, classe_id: e.target.value })} style={inputStyle}>
                <option value="">-- Aucune --</option>
                {classesFiltrees.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Établissement</label>
              <input value={form.etablissement} onChange={e => setForm({ ...form, etablissement: e.target.value })} style={inputStyle} />
            </div>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Statut</label>
              <select value={form.statut_adulte} onChange={e => setForm({ ...form, statut_adulte: e.target.value })} style={inputStyle}>
                <option value="">-- Choisir --</option>
                <option value="PROFESSIONNEL">💼 Professionnel</option>
                <option value="ETUDIANT">🎓 Étudiant</option>
              </select>
            </div>
            {form.statut_adulte === 'PROFESSIONNEL' && (
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Métier</label>
                <input value={form.metier} onChange={e => setForm({ ...form, metier: e.target.value })} style={inputStyle} />
              </div>
            )}
            {form.statut_adulte === 'ETUDIANT' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={labelStyle}>Établissement</label>
                  <input value={form.etablissement} onChange={e => setForm({ ...form, etablissement: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Filière</label>
                  <input value={form.filiere} onChange={e => setForm({ ...form, filiere: e.target.value })} style={inputStyle} />
                </div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={labelStyle}>Quartier</label>
                <input value={form.quartier} onChange={e => setForm({ ...form, quartier: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Ville</label>
                <input value={form.ville} onChange={e => setForm({ ...form, ville: e.target.value })} style={inputStyle} />
              </div>
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} />
            </div>
          </>
        )}

        <h3 style={sectionTitleStyle}>📚 Modules de formation</h3>
        {chargementModules ? (
          <p style={{ color: '#888', fontSize: '13px' }}>⏳ Chargement des modules...</p>
        ) : modulesDisponibles.length === 0 ? (
          <p style={{ color: '#aaa', fontSize: '13px' }}>Aucun module disponible pour cette catégorie</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {modulesDisponibles.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleModule(m.id)}
                style={{
                  padding: '7px 14px', borderRadius: '20px',
                  border: `2px solid ${modulesSelectionnes.includes(m.id) ? '#2563EB' : '#e5e7eb'}`,
                  background: modulesSelectionnes.includes(m.id) ? '#eff6ff' : 'white',
                  color: modulesSelectionnes.includes(m.id) ? '#2563EB' : '#666',
                  fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s'
                }}
              >
                {modulesSelectionnes.includes(m.id) ? '✓ ' : ''}{m.nom}
              </button>
            ))}
          </div>
        )}

        {inscription.categorie !== 'ADULTE' && (
          <>
            <h3 style={sectionTitleStyle}>👨‍👩‍👧 Parent / Tuteur</h3>
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Nom complet du parent/tuteur</label>
              <input value={tuteur.nom_complet} onChange={e => setTuteur({ ...tuteur, nom_complet: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={labelStyle}>Téléphone principal</label>
                <input value={tuteur.telephone_principal} onChange={e => setTuteur({ ...tuteur, telephone_principal: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Téléphone WhatsApp</label>
                <input value={tuteur.telephone_whatsapp} onChange={e => setTuteur({ ...tuteur, telephone_whatsapp: e.target.value })} style={inputStyle} />
              </div>
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Quartier de résidence</label>
              <input value={tuteur.quartier} onChange={e => setTuteur({ ...tuteur, quartier: e.target.value })} style={inputStyle} />
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
          <button onClick={handleSave} disabled={saving} style={{
            background: saving ? '#93c5fd' : 'linear-gradient(135deg, #1A3A8F, #2563EB)',
            color: 'white', border: 'none', padding: '12px 28px', borderRadius: '10px',
            fontSize: '14px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer'
          }}>
            {saving ? '⏳ Enregistrement...' : '💾 Enregistrer les modifications'}
          </button>
          <button onClick={onClose} style={{
            background: '#f3f4f6', color: '#666', border: 'none',
            padding: '12px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer'
          }}>Annuler</button>
        </div>
      </div>
    </div>
  )
}