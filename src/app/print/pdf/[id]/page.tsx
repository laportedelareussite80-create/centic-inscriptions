'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

export default function FichePDFPage() {
  const { id } = useParams()
  const router = useRouter()
  const [inscription, setInscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
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
        tuteurs(nom_complet, telephone_principal, telephone_whatsapp, quartier)
      `)
      .eq('id', id)
      .single()
    setInscription(data)
    setLoading(false)
  }

  const handlePrint = () => window.print()

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center',
      minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      ⏳ Chargement...
    </div>
  )

  if (!inscription) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center',
      minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      Inscription introuvable
    </div>
  )

  const modules = inscription.modules?.map((m: any) => m.module?.nom).filter(Boolean) || []
  const tuteur = inscription.tuteurs?.[0]

  return (
    <>
  <style>{`
  @media print {
    .no-print { display: none !important; }
    header { display: none !important; }
    aside { display: none !important; }
    nav { display: none !important; }
    body { margin: 0 !important; background: white !important; }
    .fiche { 
      box-shadow: none !important; 
      margin: 0 !important;
      width: 100% !important;
      min-height: unset !important;
    }
    div[style*="margin-left"] { margin-left: 0 !important; }
    div[style*="padding: 80px"] { padding: 0 !important; }
  }
  @page { 
    size: A4; 
    margin: 8mm;
  }
  body { font-family: Arial, sans-serif; background: #f0f4ff; }
`}</style>

      {/* Boutons actions */}
      <div className="no-print" style={{
        position: 'fixed', top: '16px', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: '12px', zIndex: 100,
        background: 'white', padding: '12px 20px', borderRadius: '14px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
      }}>
        <button onClick={() => router.back()} style={{
          background: '#f3f4f6', color: '#444', border: 'none',
          padding: '10px 20px', borderRadius: '10px', fontSize: '14px',
          fontWeight: '700', cursor: 'pointer'
        }}>← Retour</button>
        <button onClick={handlePrint} style={{
          background: 'linear-gradient(135deg, #1A3A8F, #2563EB)', color: 'white',
          border: 'none', padding: '10px 24px', borderRadius: '10px',
          fontSize: '14px', fontWeight: '700', cursor: 'pointer'
        }}>🖨️ Imprimer / Sauvegarder PDF</button>
      </div>

      {/* FICHE A4 */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 24px 40px', minHeight: '100vh' }}>
        <div className="fiche" style={{
          width: '210mm', minHeight: '297mm', background: 'white',
          boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
          display: 'flex', flexDirection: 'column'
        }}>

          {/* EN-TETE */}
          <div style={{
            background: 'linear-gradient(135deg, #0D1B4B, #1A3A8F)',
            padding: '24px 32px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', color: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <img src="/images/logo_centic.jpg" alt="CENTIC"
                style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover' }} />
              <div>
                <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900', letterSpacing: '1px' }}>CENTIC</h1>
                <p style={{ margin: 0, fontSize: '11px', opacity: 0.8, lineHeight: 1.4 }}>
                  Centre d'Education aux outils des nouvelles<br />
                  Technologies de l'Information et de la Communication
                </p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '11px', opacity: 0.7, marginBottom: '4px' }}>
                FICHE D'INSCRIPTION
              </p>
              <p style={{ margin: 0, fontSize: '20px', fontWeight: '900', letterSpacing: '2px' }}>
                {inscription.numero_inscription}
              </p>
              <p style={{ margin: 0, fontSize: '11px', opacity: 0.7, marginTop: '4px' }}>
                {inscription.annee?.nom || ''}
              </p>
            </div>
          </div>

          {/* STATUT BADGE */}
          <div style={{
            background: inscription.statut === 'VALIDE' ? '#dcfce7' : '#fef9c3',
            padding: '8px 32px', display: 'flex', alignItems: 'center', gap: '8px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <span style={{ fontSize: '14px' }}>
              {inscription.statut === 'VALIDE' ? '✅' : '⏳'}
            </span>
            <span style={{
              fontSize: '12px', fontWeight: '800', letterSpacing: '1px',
              color: inscription.statut === 'VALIDE' ? '#166534' : '#854d0e',
              textTransform: 'uppercase'
            }}>
              {inscription.statut === 'VALIDE' ? 'Inscription validée' : 'En attente de validation'}
            </span>
            {inscription.validated_at && (
              <span style={{ fontSize: '11px', color: '#888', marginLeft: 'auto' }}>
                Validée le {new Date(inscription.validated_at).toLocaleDateString('fr-FR')}
              </span>
            )}
          </div>

          {/* CORPS */}
          <div style={{ padding: '28px 32px', flex: 1 }}>

            {/* Section apprenant */}
            <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>

              {/* Photo */}
              <div style={{ flexShrink: 0 }}>
                {inscription.photo_url ? (
                  <img src={inscription.photo_url} alt="Photo"
                    style={{ width: '110px', height: '130px', objectFit: 'cover',
                      border: '3px solid #0D1B4B', borderRadius: '8px' }} />
                ) : (
                  <div style={{ width: '110px', height: '130px',
                    border: '3px dashed #ccc', borderRadius: '8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#ccc', fontSize: '32px' }}>👤</div>
                )}
              </div>

              {/* Infos principales */}
              <div style={{ flex: 1 }}>
                <div style={{
                  background: '#0D1B4B', color: 'white', padding: '8px 16px',
                  borderRadius: '8px', marginBottom: '12px', display: 'inline-block'
                }}>
                  <span style={{ fontSize: '11px', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {inscription.categorie === 'PRIMAIRE' ? '🎒 Élève du Primaire' :
                     inscription.categorie === 'SECONDAIRE' ? '🎓 Élève du Secondaire' : '💼 Professionnel / Étudiant'}
                  </span>
                </div>

                <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '900', color: '#0D1B4B' }}>
                  {inscription.nom} {inscription.prenom || ''}
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', marginTop: '10px' }}>
                  {[
                    { label: 'Sexe', value: inscription.sexe === 'MASCULIN' ? 'Masculin' : 'Féminin' },
                    { label: 'Date de naissance', value: new Date(inscription.date_naissance).toLocaleDateString('fr-FR') },
                    { label: 'Lieu de naissance', value: inscription.lieu_naissance },
                    { label: 'Téléphone', value: inscription.telephone || '—' },
                    ...(inscription.categorie !== 'ADULTE' ? [
                      { label: 'Classe', value: inscription.classe?.nom || '—' },
                      { label: 'Établissement', value: inscription.etablissement || '—' },
                    ] : [
                      { label: 'Statut', value: inscription.statut_adulte || '—' },
                      { label: 'Métier/Filière', value: inscription.metier || inscription.filiere || '—' },
                      { label: 'Quartier', value: inscription.quartier || '—' },
                      { label: 'Ville', value: inscription.ville || '—' },
                    ]),
                  ].map((row, i) => (
                    <div key={i} style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '4px' }}>
                      <span style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase',
                        letterSpacing: '0.5px', fontWeight: '700' }}>{row.label}</span>
                      <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: '700', color: '#1a1a2e' }}>
                        {row.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ height: '1px', background: '#e5e7eb', margin: '0 0 20px' }} />

            {/* Modules */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: '800', color: '#0D1B4B',
                textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px',
                display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: '#0D1B4B', color: 'white', padding: '2px 10px',
                  borderRadius: '20px', fontSize: '11px' }}>
                  Modules de formation
                </span>
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {modules.length > 0 ? modules.map((m: string, i: number) => (
                  <span key={i} style={{
                    background: '#eff6ff', color: '#1A3A8F',
                    padding: '6px 16px', borderRadius: '20px',
                    fontSize: '13px', fontWeight: '700',
                    border: '1px solid #bfdbfe'
                  }}>📚 {m}</span>
                )) : <p style={{ color: '#888', fontSize: '13px' }}>Aucun module</p>}
              </div>
            </div>

            {/* Parent/Tuteur */}
            {inscription.categorie !== 'ADULTE' && tuteur && (
              <>
                <div style={{ height: '1px', background: '#e5e7eb', margin: '0 0 20px' }} />
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '12px', fontWeight: '800', color: '#0D1B4B',
                    textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
                    <span style={{ background: '#0D1B4B', color: 'white', padding: '2px 10px',
                      borderRadius: '20px', fontSize: '11px' }}>
                      Parent / Tuteur légal
                    </span>
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px 16px' }}>
                    {[
                      { label: 'Nom complet', value: tuteur.nom_complet },
                      { label: 'Téléphone', value: tuteur.telephone_principal },
                      { label: 'WhatsApp', value: tuteur.telephone_whatsapp || '—' },
                      { label: 'Quartier', value: tuteur.quartier || '—' },
                    ].map((row, i) => (
                      <div key={i} style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '4px' }}>
                        <span style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase',
                          letterSpacing: '0.5px', fontWeight: '700' }}>{row.label}</span>
                        <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: '700', color: '#1a1a2e' }}>
                          {row.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div style={{ height: '1px', background: '#e5e7eb', margin: '0 0 20px' }} />

            {/* Session */}
            <div style={{ marginBottom: '28px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: '800', color: '#0D1B4B',
                textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
                <span style={{ background: '#0D1B4B', color: 'white', padding: '2px 10px',
                  borderRadius: '20px', fontSize: '11px' }}>
                  Session de formation
                </span>
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px 16px' }}>
                {[
                  { label: 'Année', value: inscription.annee?.nom || '—' },
                  { label: 'Session', value: inscription.session?.nom || '—' },
                  { label: 'Date d\'inscription', value: new Date(inscription.created_at).toLocaleDateString('fr-FR') },
                ].map((row, i) => (
                  <div key={i} style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase',
                      letterSpacing: '0.5px', fontWeight: '700' }}>{row.label}</span>
                    <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: '700', color: '#1a1a2e' }}>
                      {row.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Zone cachet + signature */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: 'auto' }}>
              <div style={{
                border: '2px dashed #ccc', borderRadius: '10px',
                padding: '20px', textAlign: 'center', minHeight: '80px'
              }}>
                <p style={{ margin: 0, fontSize: '11px', color: '#aaa', fontWeight: '600',
                  textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Cachet du centre
                </p>
              </div>
              <div style={{
                border: '2px dashed #ccc', borderRadius: '10px',
                padding: '20px', textAlign: 'center', minHeight: '80px'
              }}>
                <p style={{ margin: 0, fontSize: '11px', color: '#aaa', fontWeight: '600',
                  textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Signature du directeur
                </p>
              </div>
            </div>
          </div>

          {/* PIED DE PAGE */}
          <div style={{
            background: '#f8faff', padding: '12px 32px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <p style={{ margin: 0, fontSize: '10px', color: '#888' }}>
              Document généré le {new Date().toLocaleDateString('fr-FR')} — CENTIC
            </p>
            <p style={{ margin: 0, fontSize: '10px', color: '#888' }}>
              {inscription.numero_inscription}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}