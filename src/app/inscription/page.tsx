'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Suspense } from 'react'

interface Classe { id: string; nom: string; categorie: string }
interface Module { id: string; nom: string; description: string; categorie: string; est_actif: boolean }
interface Session { id: string; nom: string; categorie: string; annee_id: string }
interface Annee { id: string; nom: string; annee: number; est_active: boolean }

function InscriptionForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const categorie = searchParams.get('categorie') || 'PRIMAIRE'
  const supabase = createClient()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [step, setStep] = useState(1)
  const totalSteps = categorie === 'ADULTE' ? 4 : 5

  // Data
  const [classes, setClasses] = useState<Classe[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [anneeActive, setAnneeActive] = useState<Annee | null>(null)
  const [modulesDisponibles, setModulesDisponibles] = useState<Module[]>([])

  // Form state
  const [form, setForm] = useState({
    nom: '', prenom: '', sexe: '', date_naissance: '', lieu_naissance: '',
    telephone: '', telephone_whatsapp: '', classe_id: '', etablissement: '',
    a_recu_offre: false, statut_adulte: '', metier: '', filiere: '',
    niveau_etude: '', email: '', quartier: '', ville: '',
    tuteur_nom: '', tuteur_telephone: '', tuteur_whatsapp: '', tuteur_quartier: ''
  })
  const [selectedModules, setSelectedModules] = useState<string[]>([])
  const [photo, setPhoto] = useState<string | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [numeroInscription, setNumeroInscription] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const categorieLabel: Record<string, string> = {
    PRIMAIRE: '🎒 Élève du primaire',
    SECONDAIRE: '🎓 Élève du secondaire',
    ADULTE: '💼 Professionnel / Étudiant'
  }

  useEffect(() => { fetchData() }, [categorie])

  useEffect(() => {
    if (form.classe_id) fetchModulesParClasse(form.classe_id)
  }, [form.classe_id])

  useEffect(() => {
  if (cameraActive) {
    startCamera()
  }
}, [cameraActive])

  const fetchData = async () => {
    const [{ data: c }, { data: m }, { data: s }, { data: a }] = await Promise.all([
      supabase.from('classes').select('*').eq('categorie', categorie).order('ordre'),
      supabase.from('modules').select('*').eq('est_actif', true),
      supabase.from('sessions').select('*').eq('categorie', categorie).eq('est_active', true),
      supabase.from('annees_formation').select('*').eq('est_active', true).single()
    ])
    setClasses(c || [])
    setModules(m || [])
    setSessions(s || [])
    setAnneeActive(a)
    if (categorie === 'ADULTE') {
      const adulteModules = (m || []).filter((mod: Module) =>
        mod.categorie === 'ADULTE' || mod.categorie === 'MULTI'
      )
      setModulesDisponibles(adulteModules)
    }
  }

  const fetchModulesParClasse = async (classeId: string) => {
    const { data } = await supabase
      .from('modules_classes')
      .select('module:modules(*)')
      .eq('classe_id', classeId)
    const mods = (data || []).map((d: any) => d.module).filter(Boolean)
    setModulesDisponibles(mods.filter((m: Module) => m.est_actif))
  }

  // Camera
const startCamera = async () => {
  try {
    if (videoRef.current?.srcObject) {
      const old = videoRef.current.srcObject as MediaStream
      old.getTracks().forEach(t => t.stop())
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
      audio: false
    })
    if (videoRef.current) {
      videoRef.current.srcObject = stream
      videoRef.current.muted = true
      videoRef.current.onloadedmetadata = async () => {
        try { await videoRef.current?.play() } catch {}
      }
    }
  } catch (err: any) {
    setCameraActive(false)
    const messages: Record<string, string> = {
      NotAllowedError: 'Accès refusé. Autorisez la caméra dans votre navigateur.',
      NotFoundError: 'Aucune caméra détectée.',
      NotReadableError: 'Caméra utilisée par une autre application.',
    }
    alert(messages[err.name] || 'Erreur caméra. Utilisez "Importer une image".')
  }
}

const capturePhoto = () => {
  if (videoRef.current && canvasRef.current) {
    const video = videoRef.current
    canvasRef.current.width = video.videoWidth
    canvasRef.current.height = video.videoHeight
    const ctx = canvasRef.current.getContext('2d')
    // Retourner l'image pour annuler l'effet miroir
    ctx?.save()
    ctx?.translate(canvasRef.current.width, 0)
    ctx?.scale(-1, 1)
    ctx?.drawImage(video, 0, 0)
    ctx?.restore()
    setPhoto(canvasRef.current.toDataURL('image/jpeg', 0.8))
    const stream = video.srcObject as MediaStream
    stream?.getTracks().forEach(t => t.stop())
    setCameraActive(false)
  }
}

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => setPhoto(ev.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const toggleModule = (id: string) => {
    setSelectedModules(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  const validateStep = () => {
    const newErrors: Record<string, string> = {}
    if (step === 1) {
      if (!form.nom.trim()) newErrors.nom = 'Le nom est obligatoire'
      if (!form.sexe) newErrors.sexe = 'Le sexe est obligatoire'
      if (!form.date_naissance) newErrors.date_naissance = 'La date de naissance est obligatoire'
      if (!form.lieu_naissance.trim()) newErrors.lieu_naissance = 'Le lieu de naissance est obligatoire'
      if (categorie !== 'ADULTE' && !form.classe_id) newErrors.classe_id = 'La classe est obligatoire'
      if (categorie !== 'ADULTE' && !form.etablissement.trim()) newErrors.etablissement = 'L\'établissement est obligatoire'
      if (categorie === 'ADULTE' && !form.statut_adulte) newErrors.statut_adulte = 'Le statut est obligatoire'
      if (categorie === 'ADULTE' && !form.quartier.trim()) newErrors.quartier = 'Le quartier est obligatoire'
      if (categorie === 'ADULTE' && !form.ville.trim()) newErrors.ville = 'La ville est obligatoire'
    }
    if (step === 2 && !photo) newErrors.photo = 'La photo est obligatoire'
    if (step === 3 && selectedModules.length === 0) newErrors.modules = 'Choisissez au moins un module'
    if (step === 4 && categorie !== 'ADULTE') {
      if (!form.tuteur_nom.trim()) newErrors.tuteur_nom = 'Le nom du parent est obligatoire'
      if (!form.tuteur_telephone.trim()) newErrors.tuteur_telephone = 'Le téléphone est obligatoire'
      if (!form.tuteur_quartier.trim()) newErrors.tuteur_quartier = 'Le quartier est obligatoire'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => { if (validateStep()) setStep(s => s + 1) }
  const prevStep = () => setStep(s => s - 1)

  const handleSubmit = async () => {
    if (!validateStep()) return
    setSubmitting(true)
    try {
      // Upload photo vers Supabase Storage ou utiliser base64
      let photoUrl = photo

      // Générer le numéro d'inscription
      const { count } = await supabase
        .from('inscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('annee_id', anneeActive?.id)

      const sequence = String((count || 0) + 1).padStart(4, '0')
      const numero = `CENTIC-${anneeActive?.annee || 2026}-${sequence}`

      // Créer l'inscription
      const inscriptionData: any = {
        numero_inscription: numero,
        annee_id: anneeActive?.id,
        session_id: sessions[0]?.id,
        categorie,
        statut: 'EN_ATTENTE',
        nom: form.nom.trim(),
        prenom: form.prenom.trim() || null,
        sexe: form.sexe,
        date_naissance: form.date_naissance,
        lieu_naissance: form.lieu_naissance.trim(),
        telephone: form.telephone || null,
        telephone_whatsapp: form.telephone_whatsapp || null,
        photo_url: photoUrl,
        a_recu_offre: form.a_recu_offre,
      }

      if (categorie !== 'ADULTE') {
        inscriptionData.classe_id = form.classe_id
        inscriptionData.etablissement = form.etablissement.trim()
      } else {
        inscriptionData.statut_adulte = form.statut_adulte
        inscriptionData.metier = form.statut_adulte === 'PROFESSIONNEL' ? form.metier : null
        inscriptionData.filiere = form.statut_adulte === 'ETUDIANT' ? form.filiere : null
        inscriptionData.niveau_etude = form.statut_adulte === 'ETUDIANT' ? form.niveau_etude : null
        inscriptionData.email = form.email || null
        inscriptionData.quartier = form.quartier
        inscriptionData.ville = form.ville
      }

      const { data: inscription, error } = await supabase
        .from('inscriptions')
        .insert(inscriptionData)
        .select()
        .single()

      if (error) throw error

      // Modules
      if (selectedModules.length > 0) {
        await supabase.from('inscriptions_modules').insert(
          selectedModules.map(module_id => ({ inscription_id: inscription.id, module_id }))
        )
      }

      // Tuteur (élèves)
      if (categorie !== 'ADULTE' && form.tuteur_nom) {
        await supabase.from('tuteurs').insert({
          inscription_id: inscription.id,
          nom_complet: form.tuteur_nom,
          telephone_principal: form.tuteur_telephone,
          telephone_whatsapp: form.tuteur_whatsapp || null,
          quartier: form.tuteur_quartier
        })
      }

      setNumeroInscription(numero)
      setSubmitted(true)
    } catch (e) {
      console.error(e)
      alert('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setSubmitting(false)
    }
  }

  // Page de confirmation
  if (submitted) {
    return (
      <div style={{
        minHeight: '100vh', background: 'linear-gradient(135deg, #0D1B4B, #2563EB)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
        fontFamily: 'Segoe UI, Arial, sans-serif'
      }}>
        <div style={{
          background: 'white', borderRadius: '24px', padding: '48px 40px',
          maxWidth: '500px', width: '100%', textAlign: 'center',
          boxShadow: '0 25px 60px rgba(0,0,0,0.3)'
        }}>
          <div style={{ fontSize: '72px', marginBottom: '16px' }}>🎉</div>
          <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#0D1B4B', marginBottom: '8px' }}>
            Inscription soumise !
          </h1>
          <p style={{ color: '#666', marginBottom: '24px', fontSize: '15px' }}>
            Votre dossier a été enregistré avec succès et est en attente de validation.
          </p>
          <div style={{
            background: '#f0f4ff', borderRadius: '16px', padding: '20px',
            marginBottom: '28px'
          }}>
            <p style={{ fontSize: '13px', color: '#888', marginBottom: '6px', fontWeight: '600' }}>
              VOTRE NUMÉRO D'INSCRIPTION
            </p>
            <p style={{ fontSize: '28px', fontWeight: '900', color: '#2563EB', letterSpacing: '1px' }}>
              {numeroInscription}
            </p>
          </div>
          <p style={{ color: '#888', fontSize: '14px', marginBottom: '24px' }}>
            Conservez ce numéro. Présentez-vous au centre CENTIC pour finaliser votre inscription.
          </p>
          <button onClick={() => router.push('/')} style={{
            background: 'linear-gradient(135deg, #1A3A8F, #2563EB)',
            color: 'white', border: 'none', padding: '14px 32px',
            borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer'
          }}>
            ← Retour à l'accueil
          </button>
        </div>
      </div>
    )
  }

  const inputStyle = (field: string) => ({
    width: '100%', padding: '12px 14px',
    border: `2px solid ${errors[field] ? '#ef4444' : '#e5e7eb'}`,
    borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', outline: 'none'
  })

  const labelStyle = {
    display: 'block' as const, fontSize: '13px', fontWeight: '700' as const,
    color: '#374151', marginBottom: '8px'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4ff', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
      {/* Header */}
      <header style={{
        background: 'white', padding: '14px 24px',
        display: 'flex', alignItems: 'center', gap: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)', position: 'sticky', top: 0, zIndex: 100
      }}>
        <button onClick={() => router.push('/')} style={{
          background: '#f3f4f6', border: 'none', borderRadius: '8px',
          padding: '8px 14px', cursor: 'pointer', fontSize: '14px', fontWeight: '700', color: '#444'
        }}>← Retour</button>
        <div>
          <p style={{ fontWeight: '800', color: '#0D1B4B', fontSize: '16px' }}>
            Formulaire d'inscription
          </p>
          <p style={{ fontSize: '12px', color: '#888' }}>{categorieLabel[categorie]}</p>
        </div>
      </header>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 16px' }}>
        {/* Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', flex: s < totalSteps ? 1 : 'none' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: '800', fontSize: '14px', transition: 'all 0.3s',
                background: s < step ? '#10b981' : s === step ? '#1A3A8F' : '#e5e7eb',
                color: s <= step ? 'white' : '#999'
              }}>
                {s < step ? '✓' : s}
              </div>
              {s < totalSteps && (
                <div style={{
                  flex: 1, height: '3px', margin: '0 4px',
                  background: s < step ? '#10b981' : '#e5e7eb',
                  transition: 'background 0.3s'
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Formulaire card */}
        <div style={{
          background: 'white', borderRadius: '20px', padding: '32px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>

          {/* ETAPE 1 — Informations personnelles */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0D1B4B', marginBottom: '6px' }}>
                Étape 1 — Informations personnelles
              </h2>
              <p style={{ color: '#888', fontSize: '14px', marginBottom: '24px' }}>
                Renseignez les informations de l'apprenant
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>Nom *</label>
                  <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })}
                    placeholder="Nom de famille" style={inputStyle('nom')} />
                  {errors.nom && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.nom}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Prénom</label>
                  <input value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })}
                    placeholder="Prénom (facultatif)" style={inputStyle('prenom')} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>Sexe *</label>
                  <select value={form.sexe} onChange={e => setForm({ ...form, sexe: e.target.value })}
                    style={inputStyle('sexe')}>
                    <option value="">-- Choisir --</option>
                    <option value="MASCULIN">Masculin</option>
                    <option value="FEMININ">Féminin</option>
                  </select>
                  {errors.sexe && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.sexe}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Date de naissance *</label>
                  <input type="date" value={form.date_naissance}
                    onChange={e => setForm({ ...form, date_naissance: e.target.value })}
                    style={inputStyle('date_naissance')} />
                  {errors.date_naissance && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.date_naissance}</p>}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Lieu de naissance *</label>
                <input value={form.lieu_naissance} onChange={e => setForm({ ...form, lieu_naissance: e.target.value })}
                  placeholder="Ville ou village de naissance" style={inputStyle('lieu_naissance')} />
                {errors.lieu_naissance && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.lieu_naissance}</p>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>Téléphone</label>
                  <input value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })}
                    placeholder="Ex: 6XXXXXXXX" style={inputStyle('telephone')} />
                </div>
                <div>
                  <label style={labelStyle}>WhatsApp</label>
                  <input value={form.telephone_whatsapp} onChange={e => setForm({ ...form, telephone_whatsapp: e.target.value })}
                    placeholder="Ex: 6XXXXXXXX" style={inputStyle('telephone_whatsapp')} />
                </div>
              </div>

              {/* Champs spécifiques élèves */}
              {categorie !== 'ADULTE' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label style={labelStyle}>Classe actuelle *</label>
                      <select value={form.classe_id} onChange={e => setForm({ ...form, classe_id: e.target.value })}
                        style={inputStyle('classe_id')}>
                        <option value="">-- Choisir une classe --</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                      </select>
                      {errors.classe_id && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.classe_id}</p>}
                    </div>
                    <div>
                      <label style={labelStyle}>Établissement d'origine *</label>
                      <input value={form.etablissement} onChange={e => setForm({ ...form, etablissement: e.target.value })}
                        placeholder="Nom de l'école" style={inputStyle('etablissement')} />
                      {errors.etablissement && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.etablissement}</p>}
                    </div>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.a_recu_offre}
                        onChange={e => setForm({ ...form, a_recu_offre: e.target.checked })}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                      <span style={{ fontSize: '14px', color: '#374151', fontWeight: '600' }}>
                        J'ai reçu une offre de formation CENTIC
                      </span>
                    </label>
                  </div>
                </>
              )}

              {/* Champs spécifiques adultes */}
              {categorie === 'ADULTE' && (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={labelStyle}>Statut *</label>
                    <select value={form.statut_adulte} onChange={e => setForm({ ...form, statut_adulte: e.target.value })}
                      style={inputStyle('statut_adulte')}>
                      <option value="">-- Choisir votre statut --</option>
                      <option value="PROFESSIONNEL">💼 Professionnel</option>
                      <option value="ETUDIANT">🎓 Étudiant</option>
                    </select>
                    {errors.statut_adulte && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.statut_adulte}</p>}
                  </div>

                  {form.statut_adulte === 'PROFESSIONNEL' && (
                    <div style={{ marginBottom: '16px' }}>
                      <label style={labelStyle}>Métier / Profession</label>
                      <input value={form.metier} onChange={e => setForm({ ...form, metier: e.target.value })}
                        placeholder="Ex: Enseignant, Comptable, Entrepreneur..." style={inputStyle('metier')} />
                    </div>
                  )}

                  {form.statut_adulte === 'ETUDIANT' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <label style={labelStyle}>Établissement</label>
                        <input value={form.etablissement} onChange={e => setForm({ ...form, etablissement: e.target.value })}
                          placeholder="Université ou école" style={inputStyle('etablissement')} />
                      </div>
                      <div>
                        <label style={labelStyle}>Filière</label>
                        <input value={form.filiere} onChange={e => setForm({ ...form, filiere: e.target.value })}
                          placeholder="Ex: Informatique, Gestion..." style={inputStyle('filiere')} />
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label style={labelStyle}>Quartier *</label>
                      <input value={form.quartier} onChange={e => setForm({ ...form, quartier: e.target.value })}
                        placeholder="Quartier de résidence" style={inputStyle('quartier')} />
                      {errors.quartier && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.quartier}</p>}
                    </div>
                    <div>
                      <label style={labelStyle}>Ville *</label>
                      <input value={form.ville} onChange={e => setForm({ ...form, ville: e.target.value })}
                        placeholder="Ex: Yaoundé, Douala..." style={inputStyle('ville')} />
                      {errors.ville && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.ville}</p>}
                    </div>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={labelStyle}>Email</label>
                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="email@exemple.com (facultatif)" style={inputStyle('email')} />
                  </div>
                </>
              )}
            </div>
          )}

          {/* ETAPE 2 — Photo */}
{step === 2 && (
  <div>
    <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0D1B4B', marginBottom: '6px' }}>
      Étape 2 — Photo
    </h2>
    <p style={{ color: '#888', fontSize: '14px', marginBottom: '24px' }}>
      Prenez ou importez une photo de l'apprenant
    </p>

    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>

      {/* Carré photo */}
      <div style={{
        width: '160px', height: '160px', borderRadius: '12px',
        border: '2px dashed #2563EB', background: '#f8faff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', flexShrink: 0
      }}>
        {photo ? (
          <img src={photo} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ textAlign: 'center', color: '#ccc' }}>
            <div style={{ fontSize: '48px' }}>👤</div>
            <p style={{ fontSize: '11px', marginTop: '4px' }}>Aucune photo</p>
          </div>
        )}
      </div>

      {/* Boutons */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => setCameraActive(true)}
          style={{
            background: '#2563EB', color: 'white', border: 'none',
            padding: '10px 20px', borderRadius: '10px', fontSize: '14px',
            fontWeight: '700', cursor: 'pointer', display: 'flex',
            alignItems: 'center', gap: '6px'
          }}>
          📷 Prendre une photo
        </button>

        <label style={{
          background: '#f3f4f6', color: '#444', border: 'none',
          padding: '10px 20px', borderRadius: '10px', fontSize: '14px',
          fontWeight: '700', cursor: 'pointer', display: 'flex',
          alignItems: 'center', gap: '6px'
        }}>
          🖼️ Importer une photo
          <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
        </label>
      </div>

      <p style={{ fontSize: '11px', color: '#aaa' }}>JPG, PNG — max 5 Mo</p>
    </div>

    {/* MODAL CAMERA */}
    {cameraActive && (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.85)', zIndex: 9999,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '20px'
      }}>
        <div style={{
          background: 'white', borderRadius: '20px', padding: '24px',
          width: '100%', maxWidth: '500px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0D1B4B' }}>
              Prendre une photo
            </h3>
            <button onClick={() => {
              const stream = videoRef.current?.srcObject as MediaStream
              stream?.getTracks().forEach(t => t.stop())
              setCameraActive(false)
            }} style={{
              background: 'none', border: 'none', fontSize: '20px',
              cursor: 'pointer', color: '#666'
            }}>✕</button>
          </div>

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%', borderRadius: '12px',
              background: '#000', display: 'block',
              transform: 'scaleX(-1)'
            }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button onClick={() => {
              const stream = videoRef.current?.srcObject as MediaStream
              stream?.getTracks().forEach(t => t.stop())
              setCameraActive(false)
            }} style={{
              flex: 1, background: '#f3f4f6', color: '#666', border: 'none',
              padding: '12px', borderRadius: '10px', fontSize: '14px',
              fontWeight: '700', cursor: 'pointer'
            }}>
              Annuler
            </button>
            <button onClick={capturePhoto} style={{
              flex: 2, background: '#2563EB', color: 'white', border: 'none',
              padding: '12px', borderRadius: '10px', fontSize: '14px',
              fontWeight: '700', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}>
              📸 Capturer
            </button>
          </div>
        </div>
      </div>
    )}

    {errors.photo && (
      <p style={{ color: '#ef4444', fontSize: '13px', textAlign: 'center', marginTop: '8px' }}>
        {errors.photo}
      </p>
    )}
  </div>
)}
          {/* ETAPE 3 — Modules */}
          {step === 3 && (
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0D1B4B', marginBottom: '6px' }}>
                Étape 3 — Modules de formation
              </h2>
              <p style={{ color: '#888', fontSize: '14px', marginBottom: '24px' }}>
                Sélectionnez un ou plusieurs modules
              </p>
              {modulesDisponibles.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', background: '#f9fafb', borderRadius: '12px' }}>
                  <p style={{ fontSize: '32px', marginBottom: '8px' }}>📚</p>
                  <p style={{ color: '#888' }}>
                    {form.classe_id ? 'Aucun module disponible pour cette classe' : 'Veuillez d\'abord sélectionner une classe'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {modulesDisponibles.map(m => (
                    <div key={m.id} onClick={() => toggleModule(m.id)} style={{
                      padding: '16px 20px', borderRadius: '12px', cursor: 'pointer',
                      border: `2px solid ${selectedModules.includes(m.id) ? '#2563EB' : '#e5e7eb'}`,
                      background: selectedModules.includes(m.id) ? '#eff6ff' : 'white',
                      transition: 'all 0.2s'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '24px', height: '24px', borderRadius: '6px', flexShrink: 0,
                          border: `2px solid ${selectedModules.includes(m.id) ? '#2563EB' : '#d1d5db'}`,
                          background: selectedModules.includes(m.id) ? '#2563EB' : 'white',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontSize: '14px', fontWeight: '800'
                        }}>
                          {selectedModules.includes(m.id) ? '✓' : ''}
                        </div>
                        <div>
                          <p style={{ fontWeight: '700', color: '#0D1B4B', fontSize: '15px' }}>{m.nom}</p>
                          {m.description && <p style={{ color: '#888', fontSize: '13px', marginTop: '2px' }}>{m.description}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {errors.modules && <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '12px' }}>{errors.modules}</p>}
            </div>
          )}

          {/* ETAPE 4 — Parent/Tuteur (élèves seulement) */}
          {step === 4 && categorie !== 'ADULTE' && (
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0D1B4B', marginBottom: '6px' }}>
                Étape 4 — Parent / Tuteur
              </h2>
              <p style={{ color: '#888', fontSize: '14px', marginBottom: '24px' }}>
                Informations du parent ou tuteur légal
              </p>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Nom complet du parent/tuteur *</label>
                <input value={form.tuteur_nom} onChange={e => setForm({ ...form, tuteur_nom: e.target.value })}
                  placeholder="Nom et prénom du parent" style={inputStyle('tuteur_nom')} />
                {errors.tuteur_nom && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.tuteur_nom}</p>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>Téléphone principal *</label>
                  <input value={form.tuteur_telephone} onChange={e => setForm({ ...form, tuteur_telephone: e.target.value })}
                    placeholder="6XXXXXXXX" style={inputStyle('tuteur_telephone')} />
                  {errors.tuteur_telephone && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.tuteur_telephone}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Téléphone WhatsApp</label>
                  <input value={form.tuteur_whatsapp} onChange={e => setForm({ ...form, tuteur_whatsapp: e.target.value })}
                    placeholder="6XXXXXXXX" style={inputStyle('tuteur_whatsapp')} />
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Quartier de résidence *</label>
                <input value={form.tuteur_quartier} onChange={e => setForm({ ...form, tuteur_quartier: e.target.value })}
                  placeholder="Quartier du parent" style={inputStyle('tuteur_quartier')} />
                {errors.tuteur_quartier && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.tuteur_quartier}</p>}
              </div>
            </div>
          )}

          {/* ETAPE 5 (ou 4 adulte) — Récapitulatif */}
          {((step === 5 && categorie !== 'ADULTE') || (step === 4 && categorie === 'ADULTE')) && (
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0D1B4B', marginBottom: '6px' }}>
                Récapitulatif
              </h2>
              <p style={{ color: '#888', fontSize: '14px', marginBottom: '24px' }}>
                Vérifiez vos informations avant de soumettre
              </p>
              <div style={{ background: '#f8faff', borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
                {photo && (
                  <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <img src={photo} alt="Photo" style={{ width: '80px', height: '80px',
                      objectFit: 'cover', borderRadius: '12px', border: '3px solid #2563EB' }} />
                  </div>
                )}
                {[
                  { label: 'Nom', value: `${form.nom} ${form.prenom}`.trim() },
                  { label: 'Sexe', value: form.sexe === 'MASCULIN' ? 'Masculin' : 'Féminin' },
                  { label: 'Date de naissance', value: form.date_naissance },
                  { label: 'Lieu de naissance', value: form.lieu_naissance },
                  ...(categorie !== 'ADULTE' ? [
                    { label: 'Classe', value: classes.find(c => c.id === form.classe_id)?.nom || '' },
                    { label: 'Établissement', value: form.etablissement },
                    { label: 'Offre reçue', value: form.a_recu_offre ? 'Oui' : 'Non' },
                  ] : [
                    { label: 'Statut', value: form.statut_adulte },
                    { label: 'Quartier', value: form.quartier },
                    { label: 'Ville', value: form.ville },
                  ]),
                  { label: 'Modules', value: selectedModules.map(id => modulesDisponibles.find(m => m.id === id)?.nom).join(', ') },
                ].filter(r => r.value).map((row, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', padding: '8px 0',
                    borderBottom: '1px solid #e5e7eb', fontSize: '14px'
                  }}>
                    <span style={{ color: '#888', fontWeight: '600' }}>{row.label}</span>
                    <span style={{ color: '#0D1B4B', fontWeight: '700', textAlign: 'right', maxWidth: '60%' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #f3f4f6' }}>
            {step > 1 ? (
              <button onClick={prevStep} style={{
                background: '#f3f4f6', color: '#666', border: 'none',
                padding: '12px 24px', borderRadius: '10px', fontSize: '14px',
                fontWeight: '700', cursor: 'pointer'
              }}>← Précédent</button>
            ) : <div />}

            {((step < totalSteps)) ? (
              <button onClick={nextStep} style={{
                background: 'linear-gradient(135deg, #1A3A8F, #2563EB)', color: 'white',
                border: 'none', padding: '12px 28px', borderRadius: '10px',
                fontSize: '14px', fontWeight: '700', cursor: 'pointer'
              }}>Suivant →</button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting} style={{
                background: submitting ? '#93c5fd' : 'linear-gradient(135deg, #059669, #10b981)',
                color: 'white', border: 'none', padding: '12px 32px',
                borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer'
              }}>
                {submitting ? '⏳ Envoi...' : '✅ Soumettre l\'inscription'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function InscriptionPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>Chargement...</div>}>
      <InscriptionForm />
    </Suspense>
  )
}