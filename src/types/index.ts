export type Categorie = 'PRIMAIRE' | 'SECONDAIRE' | 'ADULTE'
export type StatutInscription = 'EN_ATTENTE' | 'VALIDE' | 'DESACTIVE'
export type Sexe = 'MASCULIN' | 'FEMININ'
export type StatutAdulte = 'PROFESSIONNEL' | 'ETUDIANT'
export type CategorieModule = 'PRIMAIRE' | 'SECONDAIRE' | 'ADULTE' | 'MULTI'

export interface AnneeFormation {
  id: string
  nom: string
  annee: number
  est_active: boolean
  created_at: string
}

export interface Session {
  id: string
  annee_id: string
  nom: string
  categorie: Categorie
  description?: string
  est_active: boolean
  created_at: string
  annee?: AnneeFormation
}

export interface Classe {
  id: string
  nom: string
  categorie: Categorie
  ordre: number
  created_at: string
}

export interface Module {
  id: string
  nom: string
  description?: string
  categorie: CategorieModule
  est_actif: boolean
  created_at: string
  classes?: Classe[]
}

export interface Tuteur {
  id: string
  inscription_id: string
  nom_complet: string
  telephone_principal: string
  telephone_whatsapp?: string
  quartier?: string
}

export interface Inscription {
  id: string
  numero_inscription: string
  annee_id: string
  session_id: string
  categorie: Categorie
  statut: StatutInscription
  nom: string
  prenom?: string
  sexe: Sexe
  date_naissance: string
  lieu_naissance: string
  telephone?: string
  telephone_whatsapp?: string
  photo_url?: string
  classe_id?: string
  etablissement?: string
  a_recu_offre: boolean
  statut_adulte?: StatutAdulte
  metier?: string
  filiere?: string
  niveau_etude?: string
  email?: string
  quartier?: string
  ville?: string
  created_at: string
  validated_at?: string
  // Relations
  classe?: Classe
  session?: Session
  annee?: AnneeFormation
  tuteur?: Tuteur
  modules?: Module[]
}

export interface InscriptionFormData {
  // Commun
  categorie: Categorie
  session_id: string
  annee_id: string
  nom: string
  prenom?: string
  sexe: Sexe
  date_naissance: string
  lieu_naissance: string
  telephone?: string
  telephone_whatsapp?: string
  photo_url?: string
  module_ids: string[]
  // Elèves
  classe_id?: string
  etablissement?: string
  a_recu_offre?: boolean
  // Tuteur
  tuteur_nom?: string
  tuteur_telephone?: string
  tuteur_whatsapp?: string
  tuteur_quartier?: string
  // Adultes
  statut_adulte?: StatutAdulte
  metier?: string
  filiere?: string
  niveau_etude?: string
  email?: string
  quartier?: string
  ville?: string
}

export interface LogAdmin {
  id: string
  action: string
  inscription_id?: string
  details?: string
  created_at: string
}

export interface DashboardStats {
  total: number
  en_attente: number
  valides: number
  desactives: number
  par_categorie: {
    primaire: number
    secondaire: number
    adulte: number
  }
}