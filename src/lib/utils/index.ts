import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateNumeroInscription(annee: number, sequence: number): string {
  const seq = String(sequence).padStart(4, '0')
  return `CENTIC-${annee}-${seq}`
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function getCategorieLabel(categorie: string): string {
  const labels: Record<string, string> = {
    PRIMAIRE: 'Primaire',
    SECONDAIRE: 'Secondaire',
    ADULTE: 'Adulte / Etudiant'
  }
  return labels[categorie] || categorie
}

export function getStatutLabel(statut: string): string {
  const labels: Record<string, string> = {
    EN_ATTENTE: 'En attente',
    VALIDE: 'Validé',
    DESACTIVE: 'Désactivé'
  }
  return labels[statut] || statut
}

export function getStatutColor(statut: string): string {
  const colors: Record<string, string> = {
    EN_ATTENTE: 'bg-yellow-100 text-yellow-800',
    VALIDE: 'bg-green-100 text-green-800',
    DESACTIVE: 'bg-red-100 text-red-800'
  }
  return colors[statut] || 'bg-gray-100 text-gray-800'
}