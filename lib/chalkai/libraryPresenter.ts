import type { SavedResource } from './resourceStore'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export interface ResourceDisplayMeta {
  typeLabel: string
  dateLabel: string
  preview:   string
}

function titleCase(value: string): string {
  return value
    .replace(/_/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^./, (char) => char.toUpperCase())
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return 'Unknown date'
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`
}

function previewFor(resource: SavedResource): string {
  if (resource.type === 'image') return 'Generated image'
  if (resource.type === 'pptx') return 'Presentation file'

  const preview = resource.output.replace(/\s+/g, ' ').trim()
  if (preview.length <= 120) return preview
  return `${preview.slice(0, 117).trim()}...`
}

export function getResourceDisplayMeta(resource: SavedResource): ResourceDisplayMeta {
  return {
    typeLabel: titleCase(resource.resourceType),
    dateLabel: formatDate(resource.createdAt),
    preview:   previewFor(resource),
  }
}
