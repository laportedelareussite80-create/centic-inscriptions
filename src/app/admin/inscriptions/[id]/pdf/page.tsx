'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
        * { box-sizing: border-box; }
        @media print {
          .no-print { display: none !important; }
          body { margin: 0 !important; background: white !important; }
          .page-wrapper { padding: 0 !important; background: white !important; }
          .fiche { box-shadow: none !important; margin: 0 !important; width: 100% !important; }
        }
        @page { size: A4 portrait; margin: 8mm; }
        body { font-family: Arial, sans-serif; margin: 0; background: #f0f4ff; }
      `}</style>

      {/* Boutons */}
      <div className="no-print" style={{
        position: 'fixed', top: '12px', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: '10px', zIndex: 100,
        background: 'white', padding: '10px 16px', borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
      }}>
        <button onClick={() => window.close()} style={{
          background: '#f3f4f6', color: '#444', border: 'none',
          padding: '8px 16px', borderRadius: '8px', fontSize: '13px',
          fontWeight: '700', cursor: 'pointer'
        }}>← Fermer</button>
        <button onClick={() => window.print()} style={{
          background: 'linear-gradient(135deg, #1A3A8F, #2563EB)', color: 'white',
          border: 'none', padding: '8px 20px', borderRadius: '8px',
          fontSize: '13px', fontWeight: '700', cursor: 'pointer'
        }}>🖨️ Imprimer / PDF</button>
      </div>

      {/* PAGE */}
      <div className="page-wrapper" style={{
        display: 'flex', justifyContent: 'center',
        padding: '70px 20px 20px', background: '#f0f4ff', minHeight: '100vh'
      }}>
        <div className="fiche" style={{
          width: '210mm', background: 'white',
          boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
          fontFamily: 'Arial, sans-serif'
        }}>

          {/* EN-TETE */}
          <div style={{
            background: 'linear-gradient(135deg, #0D1B4B, #1A3A8F)',
            padding: '16px 24px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', color: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src="/images/logo.jpg" alt="CENTIC"
                style={{ width: '52px', height: '52px', borderRadius: '10px', objectFit: 'cover' }} />
              <div>
                <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '900', letterSpacing: '1px' }}>CENTIC</h1>
                <p style={{ margin: 0, fontSize: '9px', opacity: 0.8, lineHeight: 1.4 }}>
                  Centre d'Education aux outils des nouvelles<br />
                  Technologies de l'Information et de la Communication
                </p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '9px', opacity: 0.7, marginBottom: '2px', letterSpacing: '1px' }}>
                FICHE D'INSCRIPTION
              </p>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: '900', letterSpacing: '2px' }}>
                {inscription.numero_inscription}
              </p>
              <p style={{ margin: 0, fontSize: '9px', opacity: 0.7, marginTop: '2px' }}>
                {inscription.annee?.nom || ''}
              </p>
            </div>
          </div>

          {/* STATUT */}
          <div style={{
            background: inscription.statut === 'VALIDE' ? '#dcfce7' : '#fef9c3',
            padding: '5px 24px', display: 'flex', alignItems: 'center', gap: '6px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <span style={{ fontSize: '12px' }}>{inscription.statut === 'VALIDE' ? '✅' : '⏳'}</span>
            <span style={{
              fontSize: '10px', fontWeight: '800', letterSpacing: '1px',
              color: inscription.statut === 'VALIDE' ? '#166534' : '#854d0e',
              textTransform: 'uppercase'
            }}>
              {inscription.statut === 'VALIDE' ? 'Inscription validée' : 'En attente de validation'}
            </span>
            {inscription.validated_at && (
              <span style={{ fontSize: '9px', color: '#888', marginLeft: 'auto' }}>
                Validée le {new Date(inscription.validated_at).toLocaleDateString('fr-FR')}
              </span>
            )}
          </div>

          {/* CORPS */}
          <div style={{ padding: '16px 24px' }}>

            {/* Apprenant */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
              <div style={{ flexShrink: 0 }}>
                {inscription.photo_url ? (
                  <img src={inscription.photo_url} alt="Photo"
                    style={{ width: '90px', height: '110px', objectFit: 'cover',
                      border: '2px solid #0D1B4B', borderRadius: '6px' }} />
                ) : (
                  <div style={{ width: '90px', height: '110px',
                    border: '2px dashed #ccc', borderRadius: '6px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#ccc', fontSize: '28px' }}>👤</div>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{
                  background: '#0D1B4B', color: 'white', padding: '4px 12px',
                  borderRadius: '6px', marginBottom: '8px', display: 'inline-block'
                }}>
                  <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {inscription.categorie === 'PRIMAIRE' ? '🎒 Élève du Primaire' :
                     inscription.categorie === 'SECONDAIRE' ? '🎓 Élève du Secondaire' : '💼 Professionnel / Étudiant'}
                  </span>
                </div>

                <h2 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '900', color: '#0D1B4B' }}>
                  {inscription.nom} {inscription.prenom || ''}
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
                  {[
                    { label: 'Sexe', value: inscription.sexe === 'MASCULIN' ? 'Masculin' : 'Féminin' },
                    { label: 'Date de naissance', value: new Date(inscription.date_naissance).toLocaleDateString('fr-FR') },
                    { label: 'Lieu de naissance', value: inscription.lieu_naissance },
                    { label: 'Téléphone', value: inscription.telephone || '—' },
                    ...(inscription.categorie !== 'ADULTE' ? [
                      { label: 'Classe', value: inscription.classe?.nom || '—' },
                      { label: 'Établissement', value: inscription.etablissement || '—' },
                      { label: 'Offre reçue', value: inscription.a_recu_offre ? 'Oui' : 'Non' },
                    ] : [
                      { label: 'Statut', value: inscription.statut_adulte || '—' },
                      { label: 'Métier/Filière', value: inscription.metier || inscription.filiere || '—' },
                      { label: 'Quartier', value: inscription.quartier || '—' },
                      { label: 'Ville', value: inscription.ville || '—' },
                    ]),
                  ].map((row, i) => (
                    <div key={i} style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '3px' }}>
                      <span style={{ fontSize: '8px', color: '#888', textTransform: 'uppercase',
                        letterSpacing: '0.5px', fontWeight: '700' }}>{row.label}</span>
                      <p style={{ margin: '1px 0 0', fontSize: '11px', fontWeight: '700', color: '#1a1a2e' }}>
                        {row.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ height: '1px', background: '#e5e7eb', margin: '10px 0' }} />

            {/* Modules */}
            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ background: '#0D1B4B', color: 'white', padding: '2px 10px',
                  borderRadius: '20px', fontSize: '9px', fontWeight: '800',
                  textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Modules de formation
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {modules.length > 0 ? modules.map((m: string, i: number) => (
                  <span key={i} style={{
                    background: '#eff6ff', color: '#1A3A8F',
                    padding: '4px 12px', borderRadius: '20px',
                    fontSize: '11px', fontWeight: '700', border: '1px solid #bfdbfe'
                  }}>📚 {m}</span>
                )) : <p style={{ color: '#888', fontSize: '11px' }}>Aucun module</p>}
              </div>
            </div>

            {/* Parent/Tuteur */}
            {inscription.categorie !== 'ADULTE' && tuteur && (
              <>
                <div style={{ height: '1px', background: '#e5e7eb', margin: '10px 0' }} />
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ marginBottom: '6px' }}>
                    <span style={{ background: '#0D1B4B', color: 'white', padding: '2px 10px',
                      borderRadius: '20px', fontSize: '9px', fontWeight: '800',
                      textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Parent / Tuteur légal
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px 12px' }}>
                    {[
                      { label: 'Nom complet', value: tuteur.nom_complet },
                      { label: 'Téléphone', value: tuteur.telephone_principal },
                      { label: 'WhatsApp', value: tuteur.telephone_whatsapp || '—' },
                      { label: 'Quartier', value: tuteur.quartier || '—' },
                    ].map((row, i) => (
                      <div key={i} style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '3px' }}>
                        <span style={{ fontSize: '8px', color: '#888', textTransform: 'uppercase',
                          letterSpacing: '0.5px', fontWeight: '700' }}>{row.label}</span>
                        <p style={{ margin: '1px 0 0', fontSize: '11px', fontWeight: '700', color: '#1a1a2e' }}>
                          {row.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div style={{ height: '1px', background: '#e5e7eb', margin: '10px 0' }} />

            {/* Session */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ marginBottom: '6px' }}>
                <span style={{ background: '#0D1B4B', color: 'white', padding: '2px 10px',
                  borderRadius: '20px', fontSize: '9px', fontWeight: '800',
                  textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Session de formation
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px 12px' }}>
                {[
                  { label: 'Année', value: inscription.annee?.nom || '—' },
                  { label: 'Session', value: inscription.session?.nom || '—' },
                  { label: 'Date d\'inscription', value: new Date(inscription.created_at).toLocaleDateString('fr-FR') },
                ].map((row, i) => (
                  <div key={i} style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '3px' }}>
                    <span style={{ fontSize: '8px', color: '#888', textTransform: 'uppercase',
                      letterSpacing: '0.5px', fontWeight: '700' }}>{row.label}</span>
                    <p style={{ margin: '1px 0 0', fontSize: '11px', fontWeight: '700', color: '#1a1a2e' }}>
                      {row.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Cachet + Signature */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ border: '2px dashed #ccc', borderRadius: '8px',
                padding: '14px', textAlign: 'center', minHeight: '60px' }}>
                <p style={{ margin: 0, fontSize: '9px', color: '#aaa', fontWeight: '600',
                  textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cachet du centre</p>
              </div>
              <div style={{ border: '2px dashed #ccc', borderRadius: '8px',
                padding: '14px', textAlign: 'center', minHeight: '60px' }}>
                <p style={{ margin: 0, fontSize: '9px', color: '#aaa', fontWeight: '600',
                  textTransform: 'uppercase', letterSpacing: '0.5px' }}>Signature du directeur</p>
              </div>
            </div>
          </div>

          {/* PIED DE PAGE */}
          <div style={{
            background: '#f8faff', padding: '8px 24px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <p style={{ margin: 0, fontSize: '9px', color: '#888' }}>
              Document généré le {new Date().toLocaleDateString('fr-FR')} — CENTIC
            </p>
            <p style={{ margin: 0, fontSize: '9px', color: '#888' }}>
              {inscription.numero_inscription}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}