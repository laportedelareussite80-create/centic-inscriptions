'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import FeuilleAppel from '@/components/FeuilleAppel'

interface Module {
  id: string
  nom: string
  description: string
  categorie: string
}
interface Groupe {
  id: string
  nom: string
}
interface Encadreur {
  nom: string
}

type Etape = 'CATEGORIE' | 'MODULE' | 'GROUPE' | 'APPEL'

const categories = [
  { value: 'PRIMAIRE', label: 'Primaire', icon: '🎒', color: '#2563EB', bg: '#eff6ff' },
  { value: 'SECONDAIRE', label: 'Secondaire', icon: '🎓', color: '#4F46E5', bg: '#eef2ff' },
  { value: 'ADULTE', label: 'Adultes', icon: '💼', color: '#E8510A', bg: '#fff7ed' },
]

export default function EncadreurDashboard() {
  const router = useRouter()
  const supabase = createClient()

  const [encadreur, setEncadreur] = useState<Encadreur | null>(null)
  const [verificationEnCours, setVerificationEnCours] = useState(true)

  const [etape, setEtape] = useState<Etape>('CATEGORIE')
  const [categorieChoisie, setCategorieChoisie] = useState<string | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [moduleChoisi, setModuleChoisi] = useState<Module | null>(null)
  const [groupes, setGroupes] = useState<Groupe[]>([])
  const [groupeChoisi, setGroupeChoisi] = useState<Groupe | null>(null)
  const [loadingModules, setLoadingModules] = useState(false)
  const [loadingGroupes, setLoadingGroupes] = useState(false)

  useEffect(() => {
    verifierAcces()
  }, [])

  const verifierAcces = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/encadreur/connexion')
      return
    }

    const { data, error } = await supabase
      .from('encadreurs')
      .select('nom, statut')
      .eq('id', session.user.id)
      .single()

    if (error || !data || data.statut !== 'VALIDE') {
      await supabase.auth.signOut()
      router.push('/encadreur/connexion')
      return
    }

    setEncadreur({ nom: data.nom })
    setVerificationEnCours(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/encadreur/connexion')
  }

  const choisirCategorie = async (cat: string) => {
    setCategorieChoisie(cat)
    setLoadingModules(true)
    const { data } = await supabase
      .from('modules')
      .select('id, nom, description, categorie')
      .eq('est_actif', true)
      .or(`categorie.eq.${cat},categorie.eq.MULTI`)
      .order('nom')
    setModules(data || [])
    setLoadingModules(false)
    setEtape('MODULE')
  }

  const choisirModule = async (mod: Module) => {
    setModuleChoisi(mod)
    setLoadingGroupes(true)
    const { data } = await supabase
      .from('groupes')
      .select('id, nom')
      .eq('module_id', mod.id)
      .order('nom')
    setGroupes(data || [])
    setLoadingGroupes(false)

    if ((data || []).length === 0) {
      setGroupeChoisi(null)
      setEtape('APPEL')
    } else {
      setEtape('GROUPE')
    }
  }

  const choisirGroupe = (g: Groupe | null) => {
    setGroupeChoisi(g)
    setEtape('APPEL')
  }

  const retourner = () => {
    if (etape === 'MODULE') {
      setEtape('CATEGORIE')
      setCategorieChoisie(null)
    } else if (etape === 'GROUPE') {
      setEtape('MODULE')
      setModuleChoisi(null)
    } else if (etape === 'APPEL') {
      if (groupes.length > 0) {
        setEtape('GROUPE')
        setGroupeChoisi(null)
      } else {
        setEtape('MODULE')
        setModuleChoisi(null)
      }
    }
  }

  const recommencer = () => {
    setEtape('CATEGORIE')
    setCategorieChoisie(null)
    setModuleChoisi(null)
    setGroupeChoisi(null)
    setModules([])
    setGroupes([])
  }

  if (verificationEnCours) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f8faff', fontFamily: 'Segoe UI, Arial, sans-serif'
      }}>
        <p style={{ color: '#888' }}>⏳ Vérification de votre accès...</p>
      </div>
    )
  }

  const categorieInfo = categories.find(c => c.value === categorieChoisie)

  return (
    <div style={{ minHeight: '100vh', background: '#f8faff', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
      <header style={{
        background: 'white', padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)', position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {etape !== 'CATEGORIE' && (
            <button onClick={retourner} style={{
              background: '#f3f4f6', border: 'none', borderRadius: '8px',
              padding: '8px 14px', cursor: 'pointer', fontSize: '14px', fontWeight: '700', color: '#444'
            }}>← Retour</button>
          )}
          <img src="/images/logo_centic.jpg" alt="CENTIC"
            style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }} />
          <div>
            <p style={{ fontWeight: '800', color: '#0D1B4B', fontSize: '15px' }}>Espace Encadreur</p>
            <p style={{ fontSize: '12px', color: '#888' }}>{encadreur?.nom}</p>
          </div>
        </div>
        <button onClick={handleLogout} style={{
          background: 'rgba(239,68,68,0.1)', color: '#dc2626', border: 'none',
          padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer'
        }}>🚪 Déconnexion</button>
      </header>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 20px' }}>

        {etape !== 'CATEGORIE' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
            {categorieInfo && (
              <span style={{
                background: categorieInfo.bg, color: categorieInfo.color,
                padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '700'
              }}>{categorieInfo.icon} {categorieInfo.label}</span>
            )}
            {moduleChoisi && (
              <>
                <span style={{ color: '#ccc' }}>→</span>
                <span style={{
                  background: '#f3f4f6', color: '#374151',
                  padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '700'
                }}>📚 {moduleChoisi.nom}</span>
              </>
            )}
            {(groupeChoisi || (etape === 'APPEL' && groupes.length === 0)) && (
              <>
                <span style={{ color: '#ccc' }}>→</span>
                <span style={{
                  background: '#f3f4f6', color: '#374151',
                  padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '700'
                }}>👥 {groupeChoisi ? groupeChoisi.nom : 'Tous les apprenants'}</span>
              </>
            )}
          </div>
        )}

        {etape === 'CATEGORIE' && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#0D1B4B', marginBottom: '6px' }}>
              Bonjour, {encadreur?.nom?.split(' ')[0]} 👋
            </h1>
            <p style={{ color: '#888', fontSize: '14px', marginBottom: '32px' }}>
              Choisissez la catégorie pour commencer l'appel
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {categories.map(cat => (
                <button key={cat.value} onClick={() => choisirCategorie(cat.value)} style={{
                  background: 'white', border: `2px solid ${cat.bg}`, borderRadius: '20px',
                  padding: '32px 24px', cursor: 'pointer', textAlign: 'left',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)', transition: 'all 0.2s'
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = cat.color; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = cat.bg; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)' }}
                >
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '16px', background: cat.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '28px', marginBottom: '16px'
                  }}>{cat.icon}</div>
                  <p style={{ fontSize: '18px', fontWeight: '800', color: '#0D1B4B' }}>{cat.label}</p>
                  <p style={{ fontSize: '13px', color: '#999', marginTop: '4px' }}>Faire l'appel →</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {etape === 'MODULE' && (
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#0D1B4B', marginBottom: '6px' }}>
              Choisissez le module
            </h1>
            <p style={{ color: '#888', fontSize: '14px', marginBottom: '28px' }}>
              Sélectionnez le module de formation pour cette séance
            </p>
            {loadingModules ? (
              <p style={{ textAlign: 'center', color: '#888', padding: '40px' }}>⏳ Chargement...</p>
            ) : modules.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', background: 'white', borderRadius: '16px' }}>
                <p style={{ fontSize: '40px', marginBottom: '12px' }}>📭</p>
                <p style={{ color: '#888' }}>Aucun module actif pour cette catégorie</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {modules.map(m => (
                  <button key={m.id} onClick={() => choisirModule(m)} style={{
                    background: 'white', border: '2px solid #f0f0f0', borderRadius: '14px',
                    padding: '18px 22px', cursor: 'pointer', textAlign: 'left',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'all 0.15s'
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.borderColor = '#2563EB'}
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.borderColor = '#f0f0f0'}
                  >
                    <div>
                      <p style={{ fontSize: '16px', fontWeight: '700', color: '#0D1B4B' }}>📚 {m.nom}</p>
                      {m.description && <p style={{ fontSize: '13px', color: '#999', marginTop: '2px' }}>{m.description}</p>}
                    </div>
                    <span style={{ color: '#ccc', fontSize: '20px' }}>→</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {etape === 'GROUPE' && (
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#0D1B4B', marginBottom: '6px' }}>
              Choisissez le groupe
            </h1>
            <p style={{ color: '#888', fontSize: '14px', marginBottom: '28px' }}>
              Ce module est divisé en plusieurs groupes — lequel allez-vous faire ?
            </p>
            {loadingGroupes ? (
              <p style={{ textAlign: 'center', color: '#888', padding: '40px' }}>⏳ Chargement...</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                {groupes.map(g => (
                  <button key={g.id} onClick={() => choisirGroupe(g)} style={{
                    background: 'white', border: '2px solid #f0f0f0', borderRadius: '16px',
                    padding: '24px', cursor: 'pointer', textAlign: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'all 0.15s'
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.borderColor = '#2563EB'}
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.borderColor = '#f0f0f0'}
                  >
                    <p style={{ fontSize: '28px', marginBottom: '8px' }}>👥</p>
                    <p style={{ fontSize: '16px', fontWeight: '800', color: '#0D1B4B' }}>{g.nom}</p>
                  </button>
                ))}
                <button onClick={() => choisirGroupe(null)} style={{
                  background: '#f8faff', border: '2px dashed #ccc', borderRadius: '16px',
                  padding: '24px', cursor: 'pointer', textAlign: 'center'
                }}>
                  <p style={{ fontSize: '28px', marginBottom: '8px' }}>🌐</p>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: '#666' }}>Tous les groupes</p>
                </button>
              </div>
            )}
          </div>
        )}

        {etape === 'APPEL' && moduleChoisi && categorieChoisie && (
          <FeuilleAppel
            module={moduleChoisi}
            groupe={groupeChoisi}
            categorie={categorieChoisie}
            encadreurNom={encadreur?.nom || ''}
            onTermine={recommencer}
          />
        )}
      </div>
    </div>
  )
}