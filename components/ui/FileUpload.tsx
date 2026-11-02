'use client'

import { cn } from '@/lib/utils/cn'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, FileImage } from 'lucide-react'
import Image from 'next/image'

interface FileUploadProps {
  onFilesChange: (files: File[]) => void
  accept?: Record<string, string[]>
  maxSize?: number
  multiple?: boolean
  maxFiles?: number
  className?: string
  label?: string
}

interface Preview {
  file: File
  url: string
}

export function FileUpload({
  onFilesChange,
  accept = { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
  maxSize = 5 * 1024 * 1024, // 5 MB
  multiple = true,
  maxFiles = 10,
  className,
  label,
}: FileUploadProps) {
  const [previews, setPreviews] = useState<Preview[]>([])
  const [error, setError] = useState<string | null>(null)

  // Keep a stable ref to onFilesChange so the effect below doesn't
  // re-run on every render (onFilesChange is recreated each render).
  const onFilesChangeRef = useRef(onFilesChange)
  useLayoutEffect(() => { onFilesChangeRef.current = onFilesChange })

  // Notify parent whenever previews change — outside of setState to avoid
  // the "setState during render" warning.
  useEffect(() => {
    onFilesChangeRef.current(previews.map(p => p.file))
  }, [previews])

  const onDrop = useCallback((accepted: File[], rejected: import('react-dropzone').FileRejection[]) => {
    setError(null)
    if (rejected.length > 0) {
      setError(rejected[0].errors[0]?.message ?? 'Invalid file')
      return
    }
    const newPreviews = accepted.map(file => ({ file, url: URL.createObjectURL(file) }))
    setPreviews(prev => [...prev, ...newPreviews].slice(0, maxFiles))
  }, [maxFiles])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple,
    maxFiles,
  })

  const removeFile = (index: number) => {
    setPreviews(prev => {
      URL.revokeObjectURL(prev[index].url)
      return prev.filter((_, i) => i !== index)
      // onFilesChange will be called by the useEffect above
    })
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <div className={cn('w-full', className)}>
      {label && <p className="text-label text-text-muted mb-1.5">{label}</p>}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-card p-8 text-center cursor-pointer transition-colors duration-200',
          isDragActive
            ? 'border-red-primary bg-red-primary/10'
            : 'border-border hover:border-red-primary hover:bg-red-primary/5'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-10 w-10 text-text-muted mx-auto mb-3" />
        <p className="text-text-primary font-body text-sm">
          {isDragActive ? 'Drop files here...' : 'Drag & drop files or click to browse'}
        </p>
        <p className="text-text-muted text-xs mt-1">
          Max {formatBytes(maxSize)} per file · {Object.values(accept).flat().join(', ')}
        </p>
      </div>
      {error && <p className="mt-2 text-xs text-red-primary">{error}</p>}
      {previews.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {previews.map((preview, i) => (
            <div key={i} className="relative group aspect-square rounded-card overflow-hidden border border-border">
              <Image src={preview.url} alt={preview.file.name} fill className="object-cover" />
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove file"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
