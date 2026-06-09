'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function BadgePage() {
  const { id } = useParams()
  const [inscription, setInscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const badgeRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => { fetchInscription() }, [id])

  const fetchInscription = async () => {
    const { data } = await supabase
      .from('inscriptions')
      .select(`
        *,
        classe:classes(nom),
        session:sessions(nom),
        annee:annees_formation(nom, annee),
        modules:inscriptions_modules(module:modules(nom)),
        tuteurs(nom_complet, telephone_principal)
      `)
      .eq('id', id)
      .single()
    setInscription(data)
    setLoading(false)
  }

  const downloadBadge = async () => {
    setDownloading(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(badgeRef.current!, {
        scale: 4,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: badgeRef.current!.offsetWidth,
        height: badgeRef.current!.offsetHeight,
      })
      const link = document.createElement('a')
      link.download = `badge-${inscription.numero_inscription}.png`
      link.href = canvas.toDataURL('image/png', 1.0)
      link.click()
    } catch (e) {
      console.error(e)
      alert('Erreur lors du téléchargement')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center',
      minHeight: '100vh', fontFamily: 'Arial' }}>⏳ Chargement...</div>
  )
  if (!inscription) return <div>Introuvable</div>

  const modules = inscription.modules?.map((m: any) => m.module?.nom).filter(Boolean) || []
  const tuteur = inscription.tuteurs?.[0]

  const categorieColor: Record<string, string> = {
    PRIMAIRE: '#2563EB', SECONDAIRE: '#4F46E5', ADULTE: '#E8510A'
  }
  const categorieLabel: Record<string, string> = {
    PRIMAIRE: 'Primaire', SECONDAIRE: 'Secondaire',
    ADULTE: inscription.statut_adulte === 'ETUDIANT' ? 'Étudiant' : 'Professionnel'
  }
  const color = categorieColor[inscription.categorie]

  // 85.6mm x 54mm = 323px x 204px à 96dpi
  // On affiche en x2 pour la clarté à l'écran
  const W = 646
  const H = 408

  return (
    <div style={{
      minHeight: '100vh', background: '#1a1a2e',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px', fontFamily: 'Arial, sans-serif'
    }}>
      {/* Titre */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 style={{ color: 'white', margin: '0 0 4px', fontSize: '20px' }}>
          🪪 Badge — {inscription.nom} {inscription.prenom || ''}
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '13px' }}>
          Dimensions réelles : 85,6 × 54 mm — Téléchargez l'image PNG et placez-la sur votre mise en page
        </p>
      </div>

      {/* BADGE */}
      <div ref={badgeRef} style={{
        width: `${W}px`, height: `${H}px`,
        background: 'white',
        border: `4px solid ${color}`,
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Arial, sans-serif',
        boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
        flexShrink: 0
      }}>
        {/* Header */}
        <div style={{
          background: color, padding: '10px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/images/logo_centic.jpg" alt="CENTIC"
              style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />
            <div>
              <p style={{ margin: 0, color: 'white', fontWeight: '900', fontSize: '16px', letterSpacing: '1px' }}>
                CENTIC
              </p>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '9px' }}>
                Vacances Numériques {inscription.annee?.annee || ''}
              </p>
            </div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.2)', color: 'white',
            padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '800'
          }}>
            {categorieLabel[inscription.categorie]}
          </div>
        </div>

        {/* Corps */}
        <div style={{ flex: 1, display: 'flex', gap: '16px', padding: '12px 16px' }}>
          {/* Photo */}
          <div style={{ flexShrink: 0 }}>
            {inscription.photo_url ? (
              <img src={inscription.photo_url} alt="Photo"
                style={{ width: '120px', height: '160px', objectFit: 'cover',
                  border: `3px solid ${color}`, borderRadius: '8px' }} />
            ) : (
              <div style={{ width: '120px', height: '160px',
                border: `3px dashed ${color}`, borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '40px', color: '#ccc', background: '#f9f9f9' }}>👤</div>
            )}
          </div>

          {/* Infos */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              {/* Nom */}
              <h2 style={{ margin: '0 0 2px', fontSize: '22px', fontWeight: '900',
                color: '#0D1B4B', lineHeight: 1.1 }}>
                {inscription.nom}
              </h2>
              {inscription.prenom && (
                <p style={{ margin: '0 0 6px', fontSize: '16px', color: '#444', lineHeight: 1.1 }}>
                  {inscription.prenom}
                </p>
              )}

              {/* Numéro */}
              <div style={{
                background: `${color}15`, border: `1px solid ${color}40`,
                borderRadius: '6px', padding: '4px 10px', marginBottom: '8px',
                display: 'inline-block'
              }}>
                <p style={{ margin: 0, fontSize: '12px', color: color, fontWeight: '800', letterSpacing: '1px' }}>
                  {inscription.numero_inscription}
                </p>
              </div>

              {/* Classe */}
              {inscription.classe?.nom && (
                <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#555' }}>
                  📚 {inscription.classe.nom}
                </p>
              )}

              {/* Modules */}
              <div style={{ marginTop: '4px' }}>
                {modules.slice(0, 2).map((m: string, i: number) => (
                  <div key={i} style={{
                    background: `${color}15`, color: color,
                    padding: '3px 10px', borderRadius: '6px',
                    fontSize: '11px', fontWeight: '700', marginBottom: '3px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {m}
                  </div>
                ))}
                {modules.length > 2 && (
                  <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#888' }}>
                    +{modules.length - 2} autre(s) module(s)
                  </p>
                )}
              </div>
            </div>

            {/* Parent */}
            {tuteur && (
              <div style={{
                background: '#f8faff', borderRadius: '8px',
                padding: '6px 10px', marginTop: '8px',
                borderLeft: `3px solid ${color}`
              }}>
                <p style={{ margin: '0 0 2px', fontSize: '9px', color: '#888',
                  textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>
                  Parent / Tuteur
                </p>
                <p style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: '#0D1B4B' }}>
                  {tuteur.nom_complet}
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: color, fontWeight: '700' }}>
                  📞 {tuteur.telephone_principal}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          background: '#f0f4ff', padding: '6px 16px',
          borderTop: `2px solid ${color}30`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0
        }}>
          <p style={{ margin: 0, fontSize: '10px', color: '#888' }}>
            {inscription.session?.nom || ''}
          </p>
          <p style={{ margin: 0, fontSize: '10px', color: '#888', fontWeight: '700' }}>
            CENTIC {inscription.annee?.annee || ''}
          </p>
        </div>
      </div>

      {/* Boutons */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
        <button onClick={() => window.close()} style={{
          background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)',
          padding: '12px 24px', borderRadius: '10px', fontSize: '14px',
          fontWeight: '700', cursor: 'pointer'
        }}>← Fermer</button>
        <button onClick={downloadBadge} disabled={downloading} style={{
          background: downloading ? '#666' : 'linear-gradient(135deg, #059669, #10b981)',
          color: 'white', border: 'none', padding: '12px 28px',
          borderRadius: '10px', fontSize: '14px', fontWeight: '700',
          cursor: downloading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          {downloading ? '⏳ Génération...' : '⬇️ Télécharger le badge PNG'}
        </button>
      </div>

      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '16px', textAlign: 'center' }}>
        Téléchargez l'image PNG puis placez plusieurs badges sur une feuille A4 avec Word, Canva ou tout autre outil
      </p>
    </div>
  )
}