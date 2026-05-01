'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { deleteResource, listResources, type SavedResource } from '@/lib/chalkai/resourceStore'
import { getResourceDisplayMeta } from '@/lib/chalkai/libraryPresenter'

export function LibraryPanel() {
  const [resources, setResources] = useState<SavedResource[]>([])

  useEffect(() => {
    setResources(listResources())
  }, [])

  function removeResource(id: string) {
    deleteResource(id)
    setResources(listResources())
  }

  return (
    <div className="min-h-screen px-4 pb-6 pt-20 md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="flex flex-col gap-2 border-b border-[var(--border)] pb-5">
          <div className="text-[11px] uppercase tracking-widest text-[var(--ink3)]">ChalkAI</div>
          <h1 className="font-serif text-[34px] italic leading-tight text-[var(--ink)]">Library</h1>
        </header>

        {resources.length === 0 ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border2)] bg-[var(--surface)]/40 p-10 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border2)] bg-[var(--surface)]">
              <svg className="ico ico--lg" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 19.5V5a2 2 0 012-2h12a2 2 0 012 2v14.5" />
                <path d="M4 19.5A2.5 2.5 0 006.5 22H20" />
                <path d="M8 7h8M8 11h8" />
              </svg>
            </div>
            <h2 className="font-serif text-[24px] italic text-[var(--ink)]">No saved resources yet</h2>
            <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-[var(--ink2)]">
              Generate a resource and save it to history. It will appear here for quick review and reuse.
            </p>
            <Link
              href={'/chalkai?mode=generator' as Route}
              className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-[var(--ink)] px-4 text-[13px] font-medium text-[var(--paper)] transition-opacity hover:opacity-90"
            >
              Create a resource
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {resources.map((resource) => (
              <ResourceRow key={resource.id} resource={resource} onRemove={removeResource} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ResourceRow({
  resource,
  onRemove,
}: {
  resource: SavedResource
  onRemove: (id: string) => void
}) {
  const meta = getResourceDisplayMeta(resource)

  return (
    <article className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="tag tag--amber">{meta.typeLabel}</span>
            <span className="text-[12px] text-[var(--ink3)]">{meta.dateLabel}</span>
          </div>
          <h2 className="truncate text-[15px] font-semibold text-[var(--ink)]">{resource.title}</h2>
          <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[var(--ink2)]">{meta.preview}</p>
        </div>

        <button
          type="button"
          onClick={() => onRemove(resource.id)}
          className="inline-flex h-9 flex-shrink-0 items-center justify-center rounded-md border border-[var(--border2)] px-3 text-[12px] font-medium text-[var(--ink2)] transition-colors hover:border-[var(--red)] hover:text-[var(--red)]"
        >
          Remove
        </button>
      </div>
    </article>
  )
}
