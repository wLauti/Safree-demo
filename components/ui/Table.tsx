'use client'

import { cn } from '@/lib/utils/cn'
import { ChevronUp, ChevronDown, ChevronsUpDown, Download } from 'lucide-react'
import { useState, useMemo, type ReactNode } from 'react'
import { Button } from './Button'

export interface Column<T> {
  key: keyof T | string
  header: string
  render?: (row: T) => ReactNode
  sortable?: boolean
  className?: string
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyField: keyof T
  loading?: boolean
  exportable?: boolean
  exportFilename?: string
  emptyMessage?: string
  className?: string
}

function getValue<T>(row: T, key: string): unknown {
  return key.split('.').reduce((obj: unknown, k) => (obj as Record<string, unknown>)?.[k], row)
}

export function Table<T>({ columns, data, keyField, loading, exportable, exportFilename = 'export', emptyMessage = 'No data', className }: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const sorted = useMemo(() => {
    if (!sortKey) return data
    return [...data].sort((a, b) => {
      const av = getValue(a, sortKey)
      const bv = getValue(b, sortKey)
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true })
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [data, sortKey, sortDir])

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const exportCSV = () => {
    const headers = columns.map(c => c.header).join(',')
    const rows = data.map(row =>
      columns.map(c => {
        const val = getValue(row, String(c.key))
        return `"${String(val ?? '').replace(/"/g, '""')}"`
      }).join(',')
    ).join('\n')
    const blob = new Blob([headers + '\n' + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${exportFilename}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={cn('w-full', className)}>
      {exportable && (
        <div className="flex justify-end mb-3">
          <Button variant="ghost" size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={exportCSV}>
            Export CSV
          </Button>
        </div>
      )}
      <div className="overflow-x-auto rounded-card border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-primary">
              {columns.map(col => (
                <th
                  key={String(col.key)}
                  className={cn(
                    'px-4 py-3 text-left text-label text-text-muted font-medium whitespace-nowrap',
                    col.sortable && 'cursor-pointer hover:text-text-primary select-none',
                    col.className
                  )}
                  onClick={() => col.sortable && handleSort(String(col.key))}
                >
                  <span className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && (
                      sortKey === String(col.key)
                        ? sortDir === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                        : <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {columns.map(col => (
                    <td key={String(col.key)} className="px-4 py-3">
                      <div className="h-4 bg-bg-primary rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-text-muted">
                  {emptyMessage}
                </td>
              </tr>
            ) : sorted.map(row => (
              <tr key={String(row[keyField])} className="border-b border-border hover:bg-bg-primary/50 transition-colors">
                {columns.map(col => (
                  <td key={String(col.key)} className={cn('px-4 py-3 text-text-primary', col.className)}>
                    {col.render ? col.render(row) : String(getValue(row, String(col.key)) ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
