import { cn } from '@/lib/utils/cn'
import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  children: ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-red-primary text-accent-cream hover:bg-red-dark border-transparent',
  secondary: 'bg-bg-secondary text-text-primary border-border hover:bg-opacity-80',
  ghost: 'bg-transparent text-text-primary border-border hover:bg-bg-secondary',
  danger: 'bg-red-dark text-accent-cream hover:bg-red-primary border-transparent',
  icon: 'bg-transparent text-text-muted hover:text-text-primary border-transparent p-2',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'text-xs px-3 py-1.5 tracking-wider',
  md: 'text-sm px-6 py-3 tracking-wide',
  lg: 'text-base px-8 py-4 tracking-wide',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-card border font-heading font-semibold uppercase transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        variant !== 'icon' && sizeStyles[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  )
}
