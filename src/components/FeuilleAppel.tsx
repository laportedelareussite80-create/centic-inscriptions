'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Module { id: string; nom: string }
interface Groupe { id: string; nom: string }

interface Eleve {
  inscription_id: string
  nom: string
  prenom: string | null
  numero_inscription: string
  present: boolean
}

export default function FeuilleAppel({ module, groupe, categorie, encadreurNom, onTermine }: {
  module: Module
  groupe: Groupe | null
  categorie: string
  encadreurNom: string
  onTermine: () => void
}) {
  const supabase = createClient()
  const feuilleRef = useRef<HTMLDivElement>(null)

  const [eleves, setEleves] = useState<Eleve[]>([])
  const [loading, setLoading] = useState(true)
  const [enregistrement, setEnregistrement] = useState(false)
  const [appelTermine, setAppelTermine] = useState(false)
  const [genererPdf, setGenererPdf] = useState(false)
  const [genererImage, setGenererImage] = useState(false)

  const dateAujourdhui = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  })

  const categorieLabel: Record<string, string> = {
    PRIMAIRE: 'Primaire', SECONDAIRE: 'Secondaire', ADULTE: 'Adultes'
  }

  useEffect(() => {
    fetchEleves()
  }, [module.id, groupe?.id])

  const fetchEleves = async () => {
    setLoading(true)
    let query = supabase
      .from('inscriptions_modules')
      .select('inscription_id, groupe_id, inscription:inscriptions(nom, prenom, numero_inscription)')
      .eq('module_id', module.id)

    if (groupe) {
      query = query.eq('groupe_id', groupe.id)
    }

    const { data } = await query

    setEleves((data || []).map((row: any) => ({
      inscription_id: row.inscription_id,
      nom: row.inscription?.nom || '',
      prenom: row.inscription?.prenom || null,
      numero_inscription: row.inscription?.numero_inscription || '',
      present: false,
    })).sort((a: Eleve, b: Eleve) => a.nom.localeCompare(b.nom)))
    setLoading(false)
  }

  const togglePresence = (inscriptionId: string) => {
    setEleves(prev => prev.map(e =>
      e.inscription_id === inscriptionId ? { ...e, present: !e.present } : e
    ))
  }

  const toutMarquer = (valeur: boolean) => {
    setEleves(prev => prev.map(e => ({ ...e, present: valeur })))
  }

  const enregistrerAppel = async () => {
    setEnregistrement(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Session expirée')

      const { data: appel, error: appelError } = await supabase
        .from('appels')
        .insert({
          encadreur_id: session.user.id,
          module_id: module.id,
          groupe_id: groupe?.id || null,
          categorie,
        })
        .select()
        .single()

      if (appelError) throw appelError

      const { error: detailsError } = await supabase
        .from('appels_details')
        .insert(eleves.map(e => ({
          appel_id: appel.id,
          inscription_id: e.inscription_id,
          present: e.present,
        })))

      if (detailsError) throw detailsError

      setAppelTermine(true)
    } catch (e) {
      console.error(e)
      alert('Une erreur est survenue lors de l\'enregistrement. Veuillez réessayer.')
    } finally {
      setEnregistrement(false)
    }
  }

  const telechargerImage = async () => {
    if (!feuilleRef.current) return
    setGenererImage(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(feuilleRef.current, { scale: 2, backgroundColor: '#ffffff' })
      const lien = document.createElement('a')
      lien.download = `Appel_${module.nom.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.png`
      lien.href = canvas.toDataURL('image/png')
      lien.click()
    } catch (e) {
      console.error(e)
      alert('Une erreur est survenue lors de la génération de l\'image.')
    } finally {
      setGenererImage(false)
    }
  }

  const telechargerPdf = async () => {
    if (!feuilleRef.current) return
    setGenererPdf(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')
      const canvas = await html2canvas(feuilleRef.current, { scale: 2, backgroundColor: '#ffffff' })
      const imgData = canvas.toDataURL('image/png')

      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pageWidth - 20
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 10

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, Math.min(imgHeight, pageHeight - 20))
      heightLeft -= (pageHeight - 20)

      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save(`Appel_${module.nom.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (e) {
      console.error(e)
      alert('Une erreur est survenue lors de la génération du PDF.')
    } finally {
      setGenererPdf(false)
    }
  }

  const nbPresents = eleves.filter(e => e.present).length

  if (loading) {
    return <p style={{ textAlign: 'center', color: '#888', padding: '60px' }}>⏳ Chargement de la liste...</p>
  }

  if (eleves.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px', background: 'white', borderRadius: '16px' }}>
        <p style={{ fontSize: '40px', marginBottom: '12px' }}>📭</p>
        <p style={{ color: '#888', marginBottom: '20px' }}>
          Aucun apprenant {groupe ? `dans ${groupe.nom}` : 'inscrit'} pour ce module
        </p>
        <button onClick={onTermine} style={{
          background: '#1A3A8F', color: 'white', border: 'none',
          padding: '10px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer'
        }}>← Recommencer</button>
      </div>
    )
  }

  // ÉCRAN DE FIN — après enregistrement, propose le téléchargement
  if (appelTermine) {
    return (
      <div>
        <div style={{
          background: '#dcfce7', borderRadius: '16px', padding: '20px 24px',
          marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '14px'
        }}>
          <span style={{ fontSize: '32px' }}>✅</span>
          <div>
            <p style={{ fontWeight: '800', color: '#166534', fontSize: '16px' }}>Appel enregistré avec succès !</p>
            <p style={{ fontSize: '13px', color: '#15803d' }}>
              {nbPresents} présent{nbPresents > 1 ? 's' : ''} sur {eleves.length} apprenant{eleves.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Feuille visuelle pour export */}
        <div ref={feuilleRef} style={{
          background: 'white', borderRadius: '4px', padding: '32px',
          border: '1px solid #e5e7eb', marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', borderBottom: '3px solid #0D1B4B', paddingBottom: '16px' }}>
            <img src="/images/logo_centic.jpg" alt="CENTIC" style={{ width: '56px', height: '56px', borderRadius: '10px', objectFit: 'cover' }} />
            <div>
              <p style={{ fontSize: '18px', fontWeight: '900', color: '#0D1B4B' }}>FEUILLE DE PRÉSENCE — CENTIC</p>
              <p style={{ fontSize: '13px', color: '#666' }}>{dateAujourdhui}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px', fontSize: '13px' }}>
            <p><strong>Catégorie :</strong> {categorieLabel[categorie] || categorie}</p>
            <p><strong>Module :</strong> {module.nom}</p>
            <p><strong>Groupe :</strong> {groupe ? groupe.nom : 'Tous'}</p>
            <p><strong>Encadreur :</strong> {encadreurNom}</p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#0D1B4B' }}>
                <th style={{ color: 'white', padding: '8px', textAlign: 'left', border: '1px solid #0D1B4B' }}>N°</th>
                <th style={{ color: 'white', padding: '8px', textAlign: 'left', border: '1px solid #0D1B4B' }}>Nom complet</th>
                <th style={{ color: 'white', padding: '8px', textAlign: 'left', border: '1px solid #0D1B4B' }}>N° Inscription</th>
                <th style={{ color: 'white', padding: '8px', textAlign: 'center', border: '1px solid #0D1B4B' }}>Présence</th>
              </tr>
            </thead>
            <tbody>
              {eleves.map((e, i) => (
                <tr key={e.inscription_id} style={{ background: i % 2 === 0 ? 'white' : '#f9fafb' }}>
                  <td style={{ padding: '7px 8px', border: '1px solid #e5e7eb' }}>{i + 1}</td>
                  <td style={{ padding: '7px 8px', border: '1px solid #e5e7eb', fontWeight: '600' }}>{e.nom} {e.prenom || ''}</td>
                  <td style={{ padding: '7px 8px', border: '1px solid #e5e7eb', color: '#666' }}>{e.numero_inscription}</td>
                  <td style={{
                    padding: '7px 8px', border: '1px solid #e5e7eb', textAlign: 'center',
                    fontWeight: '700', color: e.present ? '#166534' : '#991b1b'
                  }}>
                    {e.present ? 'Présent' : 'Absent'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p style={{ marginTop: '20px', fontSize: '12px', color: '#999', textAlign: 'right' }}>
            Total : {eleves.length} apprenants — {nbPresents} présents — {eleves.length - nbPresents} absents
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button onClick={telechargerPdf} disabled={genererPdf} style={{
            background: '#dc2626', color: 'white', border: 'none',
            padding: '12px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer'
          }}>
            {genererPdf ? '⏳ Génération...' : '📄 Télécharger en PDF'}
          </button>
          <button onClick={telechargerImage} disabled={genererImage} style={{
            background: '#059669', color: 'white', border: 'none',
            padding: '12px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer'
          }}>
            {genererImage ? '⏳ Génération...' : '🖼️ Télécharger en image'}
          </button>
          <button onClick={onTermine} style={{
            background: '#f3f4f6', color: '#666', border: 'none',
            padding: '12px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer'
          }}>
            ← Nouvel appel
          </button>
        </div>
      </div>
    )
  }

  // ÉCRAN DE SAISIE DE L'APPEL
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#0D1B4B', marginBottom: '4px' }}>
            Faire l'appel
          </h1>
          <p style={{ color: '#888', fontSize: '14px' }}>{dateAujourdhui}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => toutMarquer(true)} style={{
            background: '#dcfce7', color: '#166534', border: 'none',
            padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer'
          }}>✓ Tous présents</button>
          <button onClick={() => toutMarquer(false)} style={{
            background: '#fee2e2', color: '#991b1b', border: 'none',
            padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer'
          }}>✕ Tous absents</button>
        </div>
      </div>

      <div style={{
        background: '#eff6ff', borderRadius: '12px', padding: '12px 18px',
        marginBottom: '16px', fontSize: '14px', color: '#1A3A8F', fontWeight: '600'
      }}>
        👥 {nbPresents} présent{nbPresents > 1 ? 's' : ''} / {eleves.length} apprenant{eleves.length > 1 ? 's' : ''}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
        {eleves.map((e, i) => (
          <div key={e.inscription_id} onClick={() => togglePresence(e.inscription_id)} style={{
            background: 'white', borderRadius: '12px', padding: '14px 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', border: `2px solid ${e.present ? '#10b981' : '#f0f0f0'}`,
            transition: 'all 0.15s'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: '#999', fontSize: '13px', fontWeight: '700', width: '24px' }}>{i + 1}</span>
              <div>
                <p style={{ fontSize: '15px', fontWeight: '700', color: '#0D1B4B' }}>{e.nom} {e.prenom || ''}</p>
                <p style={{ fontSize: '12px', color: '#999' }}>{e.numero_inscription}</p>
              </div>
            </div>
            <div style={{
              padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '700',
              background: e.present ? '#dcfce7' : '#fee2e2',
              color: e.present ? '#166534' : '#991b1b'
            }}>
              {e.present ? '✓ Présent' : '✕ Absent'}
            </div>
          </div>
        ))}
      </div>

      <button onClick={enregistrerAppel} disabled={enregistrement} style={{
        width: '100%', background: enregistrement ? '#93c5fd' : 'linear-gradient(135deg, #059669, #10b981)',
        color: 'white', border: 'none', padding: '16px', borderRadius: '12px',
        fontSize: '16px', fontWeight: '700', cursor: enregistrement ? 'not-allowed' : 'pointer'
      }}>
        {enregistrement ? '⏳ Enregistrement...' : '✅ Valider l\'appel'}
      </button>
    </div>
  )
}