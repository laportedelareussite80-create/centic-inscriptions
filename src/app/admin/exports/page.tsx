'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ExportsPage() {
  const [annees, setAnnees] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [modules, setModules] = useState<any[]>([])
  const [filters, setFilters] = useState({
    annee_id: '', session_id: '', categorie: '',
    classe_id: '', module_id: '', statut: ''
  })
  const [loading, setLoading] = useState(false)
  const [count, setCount] = useState<number | null>(null)
  const supabase = createClient()

  useEffect(() => { fetchOptions() }, [])
  useEffect(() => {
  if (filters.annee_id) {
    fetchCount()
  } else {
    setCount(null)
  }
}, [filters])

  const fetchOptions = async () => {
    const [{ data: a }, { data: s }, { data: c }, { data: m }] = await Promise.all([
      supabase.from('annees_formation').select('*').order('annee', { ascending: false }),
      supabase.from('sessions').select('*').order('nom'),
      supabase.from('classes').select('*').order('ordre'),
      supabase.from('modules').select('*').order('nom'),
    ])
    setAnnees(a || [])
    setSessions(s || [])
    setClasses(c || [])
    setModules(m || [])
  }

  const buildQuery = () => {
    let q = supabase.from('inscriptions').select(`
      *,
      classe:classes(nom),
      session:sessions(nom),
      annee:annees_formation(nom, annee),
      modules:inscriptions_modules(module:modules(nom)),
      tuteurs(nom_complet, telephone_principal, telephone_whatsapp, quartier)
    `)
    if (filters.annee_id) q = q.eq('annee_id', filters.annee_id)
    if (filters.session_id) q = q.eq('session_id', filters.session_id)
    if (filters.categorie) q = q.eq('categorie', filters.categorie)
    if (filters.classe_id) q = q.eq('classe_id', filters.classe_id)
    if (filters.statut) q = q.eq('statut', filters.statut)
    return q.order('created_at', { ascending: false })
  }

  const fetchCount = async () => {
    const { data } = await buildQuery()
    setCount(data?.length || 0)
  }

  const exportExcel = async () => {
    setLoading(true)
    try {
      const { data } = await buildQuery()
      if (!data || data.length === 0) {
        alert('Aucune inscription trouvée avec ces filtres.')
        setLoading(false)
        return
      }

      const XLSX = await import('xlsx')
      const rows = data.map((ins: any) => ({
        'Numéro': ins.numero_inscription,
        'Nom': ins.nom,
        'Prénom': ins.prenom || '',
        'Sexe': ins.sexe === 'MASCULIN' ? 'Masculin' : 'Féminin',
        'Date de naissance': ins.date_naissance ? new Date(ins.date_naissance).toLocaleDateString('fr-FR') : '',
        'Lieu de naissance': ins.lieu_naissance || '',
        'Catégorie': ins.categorie,
        'Classe/Niveau': ins.classe?.nom || ins.niveau_etude || '',
        'Établissement': ins.etablissement || '',
        'Modules': (ins.modules || []).map((m: any) => m.module?.nom).filter(Boolean).join(', '),
        'Session': ins.session?.nom || '',
        'Année': ins.annee?.nom || '',
        'Statut': ins.statut,
        'Statut adulte': ins.statut_adulte || '',
        'Métier/Filière': ins.metier || ins.filiere || '',
        'Email': ins.email || '',
        'Téléphone apprenant': ins.telephone || '',
        'WhatsApp apprenant': ins.telephone_whatsapp || '',
        'Quartier': ins.quartier || '',
        'Ville': ins.ville || '',
        'Parent - Nom': ins.tuteurs?.[0]?.nom_complet || '',
        'Parent - Téléphone': ins.tuteurs?.[0]?.telephone_principal || '',
        'Parent - WhatsApp': ins.tuteurs?.[0]?.telephone_whatsapp || '',
        'Parent - Quartier': ins.tuteurs?.[0]?.quartier || '',
        'A reçu offre': ins.a_recu_offre ? 'Oui' : 'Non',
        'Date inscription': new Date(ins.created_at).toLocaleDateString('fr-FR'),
        'Date validation': ins.validated_at ? new Date(ins.validated_at).toLocaleDateString('fr-FR') : '',
      }))

      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()

      // Style entêtes
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cell = XLSX.utils.encode_cell({ r: 0, c })
        if (ws[cell]) {
          ws[cell].s = {
            font: { bold: true, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '0D1B4B' } },
            alignment: { horizontal: 'center' }
          }
        }
      }

      // Largeurs colonnes
      ws['!cols'] = [
        { wch: 18 }, { wch: 20 }, { wch: 20 }, { wch: 10 },
        { wch: 16 }, { wch: 18 }, { wch: 12 }, { wch: 18 },
        { wch: 25 }, { wch: 35 }, { wch: 25 }, { wch: 22 },
        { wch: 12 }, { wch: 14 }, { wch: 20 }, { wch: 25 },
        { wch: 16 }, { wch: 16 }, { wch: 15 }, { wch: 15 },
        { wch: 22 }, { wch: 16 }, { wch: 16 }, { wch: 15 },
        { wch: 14 }, { wch: 16 }, { wch: 16 },
      ]

      XLSX.utils.book_append_sheet(wb, ws, 'Inscriptions')
      const fileName = `CENTIC_Inscriptions_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.xlsx`
      XLSX.writeFile(wb, fileName)
    } catch (e) {
      console.error(e)
      alert('Erreur lors de l\'export Excel')
    } finally {
      setLoading(false)
    }
  }

  const exportPDF = async () => {
    setLoading(true)
    try {
      const { data } = await buildQuery()
      if (!data || data.length === 0) {
        alert('Aucune inscription trouvée avec ces filtres.')
        setLoading(false)
        return
      }

      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

      // En-tête
      doc.setFillColor(13, 27, 75)
      doc.rect(0, 0, 297, 20, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('CENTIC — Liste des inscrits', 14, 13)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} — Total : ${data.length} inscription(s)`, 200, 13)

      autoTable(doc, {
        startY: 24,
        head: [[
          'Numéro', 'Nom', 'Prénom', 'Sexe', 'Naissance',
          'Catégorie', 'Classe', 'Établissement', 'Module(s)',
          'Session', 'Statut'
        ]],
        body: data.map((ins: any) => [
          ins.numero_inscription,
          ins.nom,
          ins.prenom || '',
          ins.sexe === 'MASCULIN' ? 'M' : 'F',
          ins.date_naissance ? new Date(ins.date_naissance).toLocaleDateString('fr-FR') : '',
          ins.categorie === 'PRIMAIRE' ? 'Primaire' : ins.categorie === 'SECONDAIRE' ? 'Secondaire' : 'Adulte',
          ins.classe?.nom || ins.niveau_etude || '',
          ins.etablissement || '',
          (ins.modules || []).map((m: any) => m.module?.nom).filter(Boolean).join(', '),
          ins.session?.nom || '',
          ins.statut === 'VALIDE' ? 'Validé' : ins.statut === 'EN_ATTENTE' ? 'En attente' : 'Désactivé',
        ]),
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: {
          fillColor: [13, 27, 75], textColor: 255,
          fontStyle: 'bold', fontSize: 7
        },
        alternateRowStyles: { fillColor: [240, 244, 255] },
        columnStyles: {
          0: { cellWidth: 28 },
          1: { cellWidth: 25 },
          2: { cellWidth: 22 },
          3: { cellWidth: 8 },
          4: { cellWidth: 18 },
          5: { cellWidth: 18 },
          6: { cellWidth: 20 },
          7: { cellWidth: 30 },
          8: { cellWidth: 45 },
          9: { cellWidth: 35 },
          10: { cellWidth: 18 },
        },
        margin: { left: 8, right: 8 },
        didDrawPage: (hookData: any) => {
          doc.setFontSize(7)
          doc.setTextColor(150)
          doc.text(
            `Page ${hookData.pageNumber}`,
            doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 5,
            { align: 'center' }
          )
        }
      })

      const fileName = `CENTIC_Liste_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.pdf`
      doc.save(fileName)
    } catch (e) {
      console.error(e)
      alert('Erreur lors de l\'export PDF')
    } finally {
      setLoading(false)
    }
  }

  const sessionsFiltrees = filters.categorie
    ? sessions.filter(s => s.categorie === filters.categorie)
    : sessions

  const classesFiltrees = filters.categorie
    ? classes.filter(c => c.categorie === filters.categorie)
    : classes

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#0D1B4B', marginBottom: '4px' }}>
          📤 Exports
        </h1>
        <p style={{ color: '#888', fontSize: '14px' }}>
          Exportez les données des inscrits en Excel ou PDF
        </p>
      </div>

      {/* Filtres */}
      <div style={{
        background: 'white', borderRadius: '16px', padding: '24px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '24px'
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0D1B4B', marginBottom: '20px' }}>
          🔍 Filtres d'export
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700',
              color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Année *
            </label>
            <select value={filters.annee_id}
              onChange={e => setFilters({ ...filters, annee_id: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb',
                borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }}>
              <option value="">Toutes les années</option>
              {annees.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700',
              color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Catégorie
            </label>
            <select value={filters.categorie}
              onChange={e => setFilters({ ...filters, categorie: e.target.value, session_id: '', classe_id: '' })}
              style={{ width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb',
                borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }}>
              <option value="">Toutes catégories</option>
              <option value="PRIMAIRE">🎒 Primaire</option>
              <option value="SECONDAIRE">🎓 Secondaire</option>
              <option value="ADULTE">💼 Adulte</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700',
              color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Session
            </label>
            <select value={filters.session_id}
              onChange={e => setFilters({ ...filters, session_id: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb',
                borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }}>
              <option value="">Toutes sessions</option>
              {sessionsFiltrees.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700',
              color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Classe
            </label>
            <select value={filters.classe_id}
              onChange={e => setFilters({ ...filters, classe_id: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb',
                borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }}>
              <option value="">Toutes classes</option>
              {classesFiltrees.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700',
              color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Statut
            </label>
            <select value={filters.statut}
              onChange={e => setFilters({ ...filters, statut: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb',
                borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }}>
              <option value="">Tous statuts</option>
              <option value="EN_ATTENTE">⏳ En attente</option>
              <option value="VALIDE">✅ Validé</option>
              <option value="DESACTIVE">🚫 Désactivé</option>
            </select>
          </div>
        </div>

        {/* Compteur */}
        {count !== null && (
          <div style={{
            background: '#eff6ff', borderRadius: '10px', padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <span style={{ fontSize: '20px' }}>📊</span>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#1A3A8F' }}>
              {count} inscription(s) correspondent aux filtres sélectionnés
            </p>
          </div>
        )}
      </div>

      {/* Boutons export */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Excel */}
        <div style={{
          background: 'white', borderRadius: '16px', padding: '28px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          border: '2px solid #dcfce7', textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📊</div>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0D1B4B', marginBottom: '8px' }}>
            Export Excel
          </h3>
          <p style={{ color: '#666', fontSize: '13px', marginBottom: '20px', lineHeight: 1.6 }}>
            Fichier .xlsx avec toutes les colonnes nécessaires pour la génération des attestations.
            Inclut : nom, prénom, date/lieu de naissance, classe, modules, contacts parent.
          </p>
          <button onClick={exportExcel} disabled={loading} style={{
            background: loading ? '#86efac' : 'linear-gradient(135deg, #059669, #10b981)',
            color: 'white', border: 'none', padding: '14px 32px',
            borderRadius: '12px', fontSize: '15px', fontWeight: '700',
            cursor: loading ? 'not-allowed' : 'pointer', width: '100%'
          }}>
            {loading ? '⏳ Génération...' : '⬇️ Télécharger Excel (.xlsx)'}
          </button>
        </div>

        {/* PDF */}
        <div style={{
          background: 'white', borderRadius: '16px', padding: '28px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          border: '2px solid #fef9c3', textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0D1B4B', marginBottom: '8px' }}>
            Export PDF
          </h3>
          <p style={{ color: '#666', fontSize: '13px', marginBottom: '20px', lineHeight: 1.6 }}>
            Liste complète des inscrits en format A4 paysage avec tableau.
            Idéal pour l'archivage officiel et les réunions.
          </p>
          <button onClick={exportPDF} disabled={loading} style={{
            background: loading ? '#fde68a' : 'linear-gradient(135deg, #d97706, #f59e0b)',
            color: 'white', border: 'none', padding: '14px 32px',
            borderRadius: '12px', fontSize: '15px', fontWeight: '700',
            cursor: loading ? 'not-allowed' : 'pointer', width: '100%'
          }}>
            {loading ? '⏳ Génération...' : '⬇️ Télécharger PDF (A4 paysage)'}
          </button>
        </div>
      </div>
    </div>
  )
}