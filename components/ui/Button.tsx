import { cn } from '@/lib/utils'
import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize    = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:   ButtonVariant
  size?:      ButtonSize
  loading?:   boolean
  fullWidth?: boolean
  children?:  ReactNode
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:   'bg-brand-500 text-white border-brand-500 hover:bg-brand-600 disabled:opacity-50',
  secondary: 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50',
  ghost:     'bg-transparent text-stone-600 border-transparent hover:bg-stone-100',
  danger:    'bg-red-600 text-white border-red-600 hover:bg-red-700',
}

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-5 py-2.5 text-sm rounded-xl',
}

export const Button = forwardRef(function Button(
  props: ButtonProps,
  ref: Ref<HTMLButtonElement>,
) {
  const {
    variant = 'secondary',
    size    = 'md',
    loading,
    fullWidth,
    className,
    children,
    disabled,
    ...rest
  } = props

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium border transition-colors duration-150',
        'cursor-pointer disabled:cursor-not-allowed',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {children}
    </button>
  )
})

Button.displayName = 'Button'
