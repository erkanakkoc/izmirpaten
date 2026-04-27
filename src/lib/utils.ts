import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { SiteSettings, SiteSetting } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function settingsArrayToObject(settings: SiteSetting[]): SiteSettings {
  return settings.reduce((acc, s) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(acc as any)[s.key] = s.value ?? undefined
    return acc
  }, {} as SiteSettings)
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('tr-TR').format(price) + ' ₺'
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    new: 'Yeni',
    reviewed: 'İncelendi',
    approved: 'Onaylandı',
    rejected: 'Reddedildi',
  }
  return map[status] ?? status
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800',
    reviewed: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  }
  return map[status] ?? 'bg-gray-100 text-gray-800'
}

export function buildWhatsAppUrl(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  const normalized = cleaned.startsWith('0') ? '9' + cleaned : cleaned.startsWith('90') ? cleaned : '90' + cleaned
  return `https://wa.me/${normalized}`
}
