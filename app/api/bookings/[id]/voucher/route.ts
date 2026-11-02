export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import QRCode from 'qrcode'
import { VoucherDocument } from '@/lib/pdf/voucher'
import React from 'react'

interface Props { params: { id: string } }

export async function GET(req: Request, { params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch booking (user must own it)
  const { data: bookingRaw } = await supabase
    .from('bookings')
    .select(`
      id, ref_number, status, start_date, end_date, guests,
      subtotal, addons_total, service_fee, total, addons,
      cancellation_policy, voucher_url,
      experiences(id, title, location_city, location_state, cancellation_policy),
      stores(id, name, slug)
    `)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()
  const booking = bookingRaw as any

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  if (!['confirmed', 'completed'].includes(booking.status)) {
    return NextResponse.json({ error: 'Voucher only available for confirmed bookings' }, { status: 403 })
  }

  // Return existing voucher URL if already generated
  if (booking.voucher_url) {
    return NextResponse.redirect(booking.voucher_url)
  }

  // Generate QR code
  const bookingUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/booking/confirmation/${booking.id}`
  const qrCodeDataUrl = await QRCode.toDataURL(bookingUrl, { width: 200, margin: 1 })

  const voucherData = {
    refNumber: booking.ref_number ?? booking.id.slice(0, 8).toUpperCase(),
    bookingId: booking.id,
    qrCodeDataUrl,
    experienceTitle: booking.experiences?.title ?? 'Experience',
    storeName: booking.stores?.name ?? 'Provider',
    storePhone: null,
    storeEmail: null,
    locationCity: booking.experiences?.location_city ?? null,
    locationState: booking.experiences?.location_state ?? null,
    locationAddress: null, // revealed in UI, not in initial voucher
    startDate: booking.start_date,
    endDate: booking.end_date,
    guests: booking.guests,
    addons: (booking.addons ?? []) as { key: string; label: string; price: number }[],
    subtotal: booking.subtotal,
    addonTotal: booking.addons_total,
    serviceFee: booking.service_fee,
    total: booking.total,
    cancellationPolicy: booking.cancellation_policy ?? booking.experiences?.cancellation_policy ?? 'moderate',
    generatedAt: new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }) + ' CT',
  }

  // Render PDF — use Document directly as the root element expected by react-pdf
  const DocElement = React.createElement(VoucherDocument, { data: voucherData }) as any
  const pdfBuffer: Buffer = await (renderToBuffer as any)(DocElement)
  const pdfUint8 = new Uint8Array(pdfBuffer)

  // Upload to Supabase Storage
  try {
    const service = createServiceClient()
    const path = `vouchers/${booking.id}.pdf`
    const { data: upload } = await service.storage
      .from('vouchers')
      .upload(path, pdfUint8, { contentType: 'application/pdf', upsert: true })

    if (upload) {
      const { data: { publicUrl } } = service.storage.from('vouchers').getPublicUrl(path)
      await service.from('bookings').update({ voucher_url: publicUrl }).eq('id', booking.id)
    }
  } catch {
    // Non-fatal — still return the PDF
  }

  return new Response(pdfUint8, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="safree-${booking.ref_number ?? booking.id}.pdf"`,
    },
  })
}
