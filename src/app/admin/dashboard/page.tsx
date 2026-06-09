'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Stats {
  total: number
  en_attente: number
  valides: number
  desactives: number
  primaire: number
  secondaire: number
  adulte: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    total: 0, en_attente: 0, valides: 0, desactives: 0,
    primaire: 0, secondaire: 0, adulte: 0
  })
  const [loading, setLoading] = useState(true)
  const [derniersInscrits, setDerniersInscrits] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const { data: inscriptions } = await supabase
        .from('inscriptions')
        .select('statut, categorie, created_at, nom, prenom, numero_inscription')
        .order('created_at', { ascending: false })

      if (inscriptions) {
        const s: Stats = {
          total: inscriptions.length,
          en_attente: inscriptions.filter(i => i.statut === 'EN_ATTENTE').length,
          valides: inscriptions.filter(i => i.statut === 'VALIDE').length,
          desactives: inscriptions.filter(i => i.statut === 'DESACTIVE').length,
          primaire: inscriptions.filter(i => i.categorie === 'PRIMAIRE').length,
          secondaire: inscriptions.filter(i => i.categorie === 'SECONDAIRE').length,
          adulte: inscriptions.filter(i => i.categorie === 'ADULTE').length,
        }
        setStats(s)
        setDerniersInscrits(inscriptions.slice(0, 5))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ icon, label, value, color, bg }: any) => (
    <div style={{
      background: 'white', borderRadius: '16px', padding: '24px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      borderLeft: `4px solid ${color}`,
      display: 'flex', alignItems: 'center', gap: '16px'
    }}>
      <div style={{
        width: '56px', height: '56px', borderRadius: '14px',
        background: bg, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: '26px', flexShrink: 0
      }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: '13px', color: '#888', fontWeight: '600',
          textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
          {label}
        </p>
        <p style={{ fontSize: '32px', fontWeight: '900', color: '#0D1B4B', lineHeight: 1 }}>
          {loading ? '...' : value}
        </p>
      </div>
    </div>
  )

  const statutBadge = (statut: string) => {
    const styles: Record<string, any> = {
      EN_ATTENTE: { background: '#fef9c3', color: '#854d0e', label: 'En attente' },
      VALIDE: { background: '#dcfce7', color: '#166534', label: 'Validé' },
      DESACTIVE: { background: '#fee2e2', color: '#991b1b', label: 'Désactivé' },
    }
    const s = styles[statut] || styles.EN_ATTENTE
    return (
      <span style={{
        background: s.background, color: s.color,
        padding: '4px 10px', borderRadius: '20px',
        fontSize: '12px', fontWeight: '700'
      }}>{s.label}</span>
    )
  }

  return (
    <div>
      {/* Titre */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#0D1B4B', marginBottom: '6px' }}>
          Tableau de bord
        </h1>
        <p style={{ color: '#888', fontSize: '14px' }}>
          Vue d'ensemble des inscriptions CENTIC 2026
        </p>
      </div>

      {/* STATS PRINCIPALES */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px', marginBottom: '32px'
      }}>
        <StatCard icon="👥" label="Total inscrits" value={stats.total}
          color="#2563EB" bg="#eff6ff" />
        <StatCard icon="⏳" label="En attente" value={stats.en_attente}
          color="#f59e0b" bg="#fffbeb" />
        <StatCard icon="✅" label="Validés" value={stats.valides}
          color="#10b981" bg="#ecfdf5" />
        <StatCard icon="🚫" label="Désactivés" value={stats.desactives}
          color="#ef4444" bg="#fef2f2" />
      </div>

      {/* STATS PAR CATEGORIE + DERNIERS INSCRITS */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 2fr',
        gap: '24px', marginBottom: '32px'
      }}>

        {/* Par catégorie */}
        <div style={{
          background: 'white', borderRadius: '16px', padding: '24px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0D1B4B', marginBottom: '20px' }}>
            Par catégorie
          </h2>
          {[
            { label: 'Primaire', value: stats.primaire, color: '#2563EB', emoji: '🎒' },
            { label: 'Secondaire', value: stats.secondaire, color: '#4F46E5', emoji: '🎓' },
            { label: 'Adultes', value: stats.adulte, color: '#E8510A', emoji: '💼' },
          ].map((cat) => (
            <div key={cat.label} style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '14px', color: '#444', fontWeight: '600' }}>
                  {cat.emoji} {cat.label}
                </span>
                <span style={{ fontSize: '15px', fontWeight: '800', color: '#0D1B4B' }}>
                  {loading ? '...' : cat.value}
                </span>
              </div>
              <div style={{ background: '#f3f4f6', borderRadius: '10px', height: '8px' }}>
                <div style={{
                  height: '8px', borderRadius: '10px',
                  background: cat.color,
                  width: stats.total > 0 ? `${(cat.value / stats.total) * 100}%` : '0%',
                  transition: 'width 0.8s ease'
                }} />
              </div>
            </div>
          ))}

          {/* Taux de validation */}
          <div style={{
            marginTop: '24px', padding: '16px',
            background: '#f8faff', borderRadius: '12px'
          }}>
            <p style={{ fontSize: '12px', color: '#888', marginBottom: '4px', fontWeight: '600' }}>
              TAUX DE VALIDATION
            </p>
            <p style={{ fontSize: '28px', fontWeight: '900', color: '#10b981' }}>
              {stats.total > 0
                ? `${Math.round((stats.valides / stats.total) * 100)}%`
                : '0%'}
            </p>
          </div>
        </div>

        {/* Derniers inscrits */}
        <div style={{
          background: 'white', borderRadius: '16px', padding: '24px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0D1B4B' }}>
              Dernières inscriptions
            </h2>
            <button
              onClick={() => window.location.href = '/admin/inscriptions'}
              style={{
                background: '#eff6ff', color: '#2563EB', border: 'none',
                padding: '6px 14px', borderRadius: '8px', fontSize: '13px',
                fontWeight: '700', cursor: 'pointer'
              }}
            >
              Voir tout →
            </button>
          </div>

          {loading ? (
            <p style={{ color: '#888', textAlign: 'center', padding: '32px' }}>Chargement...</p>
          ) : derniersInscrits.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ fontSize: '40px', marginBottom: '12px' }}>📭</p>
              <p style={{ color: '#888', fontSize: '14px' }}>Aucune inscription pour le moment</p>
              <p style={{ color: '#aaa', fontSize: '12px', marginTop: '4px' }}>
                Les inscriptions apparaîtront ici dès qu'elles seront soumises
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                  {['Numéro', 'Nom', 'Catégorie', 'Statut'].map(h => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '8px 12px',
                      fontSize: '12px', color: '#888', fontWeight: '700',
                      textTransform: 'uppercase', letterSpacing: '0.5px'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {derniersInscrits.map((ins, i) => (
                  <tr key={ins.numero_inscription}
                    style={{ borderBottom: '1px solid #f9fafb',
                      background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ padding: '12px', fontSize: '13px',
                      color: '#2563EB', fontWeight: '700' }}>
                      {ins.numero_inscription}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#1a1a2e', fontWeight: '600' }}>
                      {ins.nom} {ins.prenom || ''}
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px', color: '#666' }}>
                      {ins.categorie === 'PRIMAIRE' ? '🎒 Primaire'
                        : ins.categorie === 'SECONDAIRE' ? '🎓 Secondaire'
                        : '💼 Adulte'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {statutBadge(ins.statut)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Raccourcis */}
      <div style={{
        background: 'white', borderRadius: '16px', padding: '24px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0D1B4B', marginBottom: '16px' }}>
          Accès rapide
        </h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[
            { label: 'Gérer les années', href: '/admin/annees', icon: '📅', color: '#2563EB' },
            { label: 'Gérer les sessions', href: '/admin/sessions', icon: '🗂️', color: '#4F46E5' },
            { label: 'Gérer les classes', href: '/admin/classes', icon: '🏫', color: '#0891b2' },
            { label: 'Gérer les modules', href: '/admin/modules', icon: '📚', color: '#059669' },
            { label: 'Voir les inscriptions', href: '/admin/inscriptions', icon: '📋', color: '#E8510A' },
            { label: 'Exporter les données', href: '/admin/exports', icon: '📤', color: '#7c3aed' },
          ].map((item) => (
            <button
              key={item.href}
              onClick={() => window.location.href = item.href}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 18px', borderRadius: '10px', border: 'none',
                background: `${item.color}15`, color: item.color,
                fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}