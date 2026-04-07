'use client'

import {
  createContext, useCallback, useContext, useEffect, useState,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils'

type ToastVariant = 'default' | 'success' | 'error'

interface ToastItem {
  id:      string
  message: string
  variant: ToastVariant
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback((message: string, variant: ToastVariant = 'default') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev: ToastItem[]) => [...prev, { id, message, variant }])
    setTimeout(() => {
      setToasts((prev: ToastItem[]) => prev.filter((t: ToastItem) => t.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t: ToastItem) => (
          <ToastBubble key={t.id} message={t.message} variant={t.variant} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastBubble({ message, variant }: { message: string; variant: ToastVariant }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const rafId = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(rafId)
  }, [])

  return (
    <div
      className={cn(
        'pointer-events-auto px-4 py-3 rounded-xl text-sm font-medium shadow-card-md',
        'transition-all duration-300',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
        variant === 'error'   && 'bg-red-600   text-white',
        variant === 'success' && 'bg-brand-500 text-white',
        variant === 'default' && 'bg-stone-900 text-white',
      )}
    >
      {message}
    </div>
  )
}

export function useToast(): ToastContextValue {
  return useContext(ToastContext)
}
