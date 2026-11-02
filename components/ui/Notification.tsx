'use client'

import { Toaster, toast } from 'react-hot-toast'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

// ── Toast provider (add once to root layout) ──────────────────
export function NotificationProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#525252',
          color: '#E6DDBC',
          border: '1px solid #3A3A3A',
          borderRadius: '8px',
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          maxWidth: '400px',
        },
      }}
    />
  )
}

// ── Notification helpers ─────────────────────────────────────
export const notify = {
  success: (message: string) =>
    toast.success(message, {
      icon: <CheckCircle className="h-5 w-5 text-green-400" />,
    }),
  error: (message: string) =>
    toast.error(message, {
      icon: <XCircle className="h-5 w-5 text-red-400" />,
    }),
  warning: (message: string) =>
    toast(message, {
      icon: <AlertTriangle className="h-5 w-5 text-yellow-400" />,
    }),
  info: (message: string) =>
    toast(message, {
      icon: <Info className="h-5 w-5 text-blue-400" />,
    }),
}
