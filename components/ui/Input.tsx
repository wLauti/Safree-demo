'use client'

import { cn } from '@/lib/utils/cn'
import { Search } from 'lucide-react'
import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-label text-text-muted mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'input-base',
            error && 'border-red-primary focus:ring-red-primary',
            className
          )}
          {...props}
        />
        {hint && !error && <p className="mt-1 text-xs text-text-muted">{hint}</p>}
        {error && <p className="mt-1 text-xs text-red-primary">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

// ── Search input ─────────────────────────────────────────────
interface SearchInputProps extends Omit<InputProps, 'type'> {}

export function SearchInput({ className, ...props }: SearchInputProps) {
  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
      <Input type="search" className={cn('pl-10', className)} {...props} />
    </div>
  )
}

// ── Select ───────────────────────────────────────────────────
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export function Select({ label, error, options, placeholder, className, id, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-label text-text-muted mb-1.5">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn('input-base appearance-none cursor-pointer', error && 'border-red-primary', className)}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value} className="bg-bg-primary">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-primary">{error}</p>}
    </div>
  )
}

// ── Textarea ─────────────────────────────────────────────────
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, rows = 4, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="block text-label text-text-muted mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={cn(
            'input-base resize-y min-h-[100px]',
            error && 'border-red-primary',
            className
          )}
          {...props}
        />
        {hint && !error && <p className="mt-1 text-xs text-text-muted">{hint}</p>}
        {error && <p className="mt-1 text-xs text-red-primary">{error}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'
