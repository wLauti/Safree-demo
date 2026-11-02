import { describe, it, expect } from 'vitest'
import {
  formatCurrency, formatDate, formatRelativeDate, slugify, truncate, getInitials,
} from '@/lib/utils/formatters'

describe('formatCurrency', () => {
  it('formats whole dollars with two decimals', () => {
    expect(formatCurrency(1234.5)).toBe('$1,234.50')
  })
  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00')
  })
  it('rounds to cents', () => {
    expect(formatCurrency(9.999)).toBe('$10.00')
  })
})

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })
  it('strips punctuation', () => {
    expect(slugify('East Texas Whitetail Ranch!')).toBe('east-texas-whitetail-ranch')
  })
})

describe('truncate', () => {
  it('leaves short strings intact', () => {
    expect(truncate('short', 20)).toBe('short')
  })
  it('truncates and appends ellipsis', () => {
    expect(truncate('abcdefghij', 8)).toBe('abcde...')
  })
})

describe('getInitials', () => {
  it('returns up to two initials uppercased', () => {
    expect(getInitials('John Smith')).toBe('JS')
  })
  it('handles single name', () => {
    expect(getInitials('Cher')).toBe('C')
  })
})

describe('formatRelativeDate', () => {
  it('says Today for now', () => {
    expect(formatRelativeDate(new Date())).toBe('Today')
  })
  it('says Yesterday for 1 day ago', () => {
    const d = new Date(); d.setDate(d.getDate() - 1)
    expect(formatRelativeDate(d)).toBe('Yesterday')
  })
  it('says N days ago within a week', () => {
    const d = new Date(); d.setDate(d.getDate() - 3)
    expect(formatRelativeDate(d)).toBe('3 days ago')
  })
  it('falls back to a formatted date beyond a week', () => {
    const d = new Date(); d.setDate(d.getDate() - 30)
    expect(formatRelativeDate(d)).not.toContain('days ago')
  })
})

describe('formatDate', () => {
  it('produces a medium date string', () => {
    expect(formatDate('2026-05-29T00:00:00Z')).toMatch(/\w{3} \d{1,2}, \d{4}/)
  })
})
