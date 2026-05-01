'use client'

import type { GenerateResponse } from '@/types'

interface Props {
  response: GenerateResponse & { type: 'image' | 'pptx' }
  topic: string
}

function downloadBlob(base64: string, filename: string, mimeType: string) {
  const bytes = atob(base64)
  const arr = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  const blob = new Blob([arr], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function safeFilename(topic: string, fallback: string) {
  const slug = topic.trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()
  return slug || fallback
}

export function ChatResourceAttachment({ response, topic }: Props) {
  if (response.type === 'image') {
    return (
      <div className="mt-3 overflow-hidden rounded-xl border border-[var(--border2)] bg-[var(--surface2)]">
        <div className="flex justify-center p-3">
          <img
            src={`data:${response.mimeType};base64,${response.output}`}
            alt={topic}
            className="max-h-80 max-w-full rounded-lg object-contain"
          />
        </div>
        <div className="flex justify-end border-t border-[var(--border)] px-3 py-2">
          <button
            type="button"
            onClick={() => downloadBlob(response.output, `${safeFilename(topic, 'chalkai-image')}.png`, response.mimeType)}
            className="rounded-full bg-[var(--amber)] px-3 py-1.5 text-xs font-semibold text-[#0e0f0d] transition-transform hover:scale-[1.02]"
          >
            Download PNG
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-3 rounded-xl border border-[var(--border2)] bg-[var(--surface2)] p-3">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-[var(--border2)] bg-[var(--surface)]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-[var(--ink)]">Presentation ready</div>
          <div className="truncate text-xs text-[var(--ink3)]">{response.filename}</div>
          {response.gammaUrl && (
            <a
              href={response.gammaUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-xs font-medium text-[var(--amber)] hover:underline"
            >
              Open in Gamma
            </a>
          )}
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={() => downloadBlob(response.output, response.filename, 'application/vnd.openxmlformats-officedocument.presentationml.presentation')}
          className="rounded-full bg-[var(--amber)] px-3 py-1.5 text-xs font-semibold text-[#0e0f0d] transition-transform hover:scale-[1.02]"
        >
          Download .pptx
        </button>
      </div>
    </div>
  )
}
