// Server-only — never import in client components
import React from 'react'
import {
  Document, Page, View, Text, Image, StyleSheet,
} from '@react-pdf/renderer'

// ── Colour tokens (mirrored from Safree design system) ─────────
const C = {
  bg: '#262525',
  bgLight: '#323030',
  red: '#822626',
  cream: '#E6DDBC',
  muted: '#9A9A9A',
  border: '#3A3A3A',
  white: '#FFFFFF',
}

const S = StyleSheet.create({
  page: { backgroundColor: C.bg, fontFamily: 'Helvetica', fontSize: 10, color: C.cream, flexDirection: 'column' },
  header: { backgroundColor: C.red, padding: '20 30', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logoText: { fontSize: 28, fontFamily: 'Helvetica-Bold', color: C.cream, letterSpacing: 4 },
  headerSub: { fontSize: 10, color: C.cream, opacity: 0.8, marginTop: 2, letterSpacing: 1 },
  body: { padding: '20 30', flex: 1 },
  section: { marginBottom: 16, borderBottom: `1 solid ${C.border}`, paddingBottom: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { color: C.muted, fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.8 },
  value: { color: C.cream, fontSize: 10, fontFamily: 'Helvetica-Bold' },
  refNumber: { fontSize: 24, fontFamily: 'Helvetica-Bold', color: C.cream, letterSpacing: 3, marginBottom: 4 },
  badge: { backgroundColor: C.red, color: C.cream, padding: '4 10', borderRadius: 4, fontSize: 9, fontFamily: 'Helvetica-Bold', letterSpacing: 1, alignSelf: 'flex-start', marginTop: 4 },
  qrSection: { flexDirection: 'row', gap: 20, alignItems: 'center', marginBottom: 16, backgroundColor: C.bgLight, padding: 12, borderRadius: 6 },
  qrBox: { width: 80, height: 80, backgroundColor: C.white, padding: 4, borderRadius: 4 },
  sectionTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  priceLabel: { color: C.muted, fontSize: 9 },
  priceValue: { color: C.cream, fontSize: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', borderTop: `1 solid ${C.border}`, paddingTop: 6, marginTop: 4 },
  totalLabel: { color: C.cream, fontSize: 12, fontFamily: 'Helvetica-Bold' },
  totalValue: { color: C.cream, fontSize: 14, fontFamily: 'Helvetica-Bold' },
  footer: { backgroundColor: C.bgLight, padding: '12 30', borderTop: `1 solid ${C.border}` },
  footerText: { fontSize: 8, color: C.muted, textAlign: 'center', marginBottom: 2 },
  stamp: { position: 'absolute', bottom: 80, right: 30, border: `2 solid ${C.red}`, borderRadius: 4, padding: '4 8', transform: 'rotate(-15deg)' },
  stampText: { color: C.red, fontSize: 9, fontFamily: 'Helvetica-Bold', letterSpacing: 1 },
})

function fmt(n: number) { return `$${n.toFixed(2)}` }
function fmtDate(d: string) { return new Date(d + 'T00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }) }

export interface VoucherData {
  refNumber: string
  bookingId: string
  qrCodeDataUrl: string       // base64 PNG data URL
  experienceTitle: string
  storeName: string
  storePhone?: string | null
  storeEmail?: string | null
  locationCity?: string | null
  locationState?: string | null
  locationAddress?: string | null  // full address revealed post-payment
  startDate: string
  endDate: string
  guests: number
  addons: { key: string; label: string; price: number }[]
  subtotal: number
  addonTotal: number
  serviceFee: number
  total: number
  cancellationPolicy: string
  generatedAt: string
}

export function VoucherDocument({ data }: { data: VoucherData }) {
  const nights = Math.round((new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / 86400000)

  return (
    <Document title={`Safree Booking ${data.refNumber}`} author="Safree">
      <Page size="A4" style={S.page}>

        {/* ── Header ─────────────────────────────────────────── */}
        <View style={S.header}>
          <View>
            <Text style={S.logoText}>SAFREE</Text>
            <Text style={S.headerSub}>BOOKING CONFIRMATION</Text>
          </View>
          {data.qrCodeDataUrl && (
            <View style={[S.qrBox, { width: 64, height: 64 }]}>
              <Image src={data.qrCodeDataUrl} style={{ width: 56, height: 56 }} />
            </View>
          )}
        </View>

        <View style={S.body}>

          {/* ── Booking reference ────────────────────────────── */}
          <View style={[S.section, { marginBottom: 14, paddingBottom: 14 }]}>
            <Text style={{ fontSize: 8, color: C.muted, letterSpacing: 1, marginBottom: 4 }}>BOOKING REFERENCE</Text>
            <Text style={S.refNumber}>{data.refNumber}</Text>
            <View style={S.badge}><Text>CONFIRMED</Text></View>
          </View>

          {/* ── Experience + Provider ────────────────────────── */}
          <View style={S.section}>
            <Text style={S.sectionTitle}>Experience</Text>
            <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: C.cream, marginBottom: 6 }}>{data.experienceTitle}</Text>
            <View style={S.row}>
              <Text style={S.label}>Provider</Text>
              <Text style={S.value}>{data.storeName}</Text>
            </View>
            {data.storePhone && (
              <View style={S.row}>
                <Text style={S.label}>Phone</Text>
                <Text style={S.value}>{data.storePhone}</Text>
              </View>
            )}
            {data.storeEmail && (
              <View style={S.row}>
                <Text style={S.label}>Email</Text>
                <Text style={S.value}>{data.storeEmail}</Text>
              </View>
            )}
          </View>

          {/* ── Dates + Location ─────────────────────────────── */}
          <View style={S.section}>
            <Text style={S.sectionTitle}>Trip Details</Text>
            <View style={S.row}>
              <Text style={S.label}>Check-in</Text>
              <Text style={S.value}>{fmtDate(data.startDate)}</Text>
            </View>
            <View style={S.row}>
              <Text style={S.label}>Check-out</Text>
              <Text style={S.value}>{fmtDate(data.endDate)}</Text>
            </View>
            <View style={S.row}>
              <Text style={S.label}>Duration</Text>
              <Text style={S.value}>{nights} {nights === 1 ? 'night' : 'nights'}</Text>
            </View>
            <View style={S.row}>
              <Text style={S.label}>Party size</Text>
              <Text style={S.value}>{data.guests} {data.guests === 1 ? 'hunter' : 'hunters'}</Text>
            </View>
            <View style={S.row}>
              <Text style={S.label}>Location</Text>
              <Text style={S.value}>
                {data.locationAddress ?? [data.locationCity, data.locationState].filter(Boolean).join(', ')}
              </Text>
            </View>
          </View>

          {/* ── Add-ons ──────────────────────────────────────── */}
          {data.addons.length > 0 && (
            <View style={S.section}>
              <Text style={S.sectionTitle}>Included Add-ons</Text>
              {data.addons.map((a, i) => (
                <View key={i} style={S.row}>
                  <Text style={S.label}>✓ {a.label}</Text>
                  <Text style={S.value}>{fmt(a.price)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── Payment summary ───────────────────────────────── */}
          <View style={[S.section, { borderBottom: 0 }]}>
            <Text style={S.sectionTitle}>Payment Summary</Text>
            <View style={S.priceRow}>
              <Text style={S.priceLabel}>Experience fee</Text>
              <Text style={S.priceValue}>{fmt(data.subtotal)}</Text>
            </View>
            {data.addonTotal > 0 && (
              <View style={S.priceRow}>
                <Text style={S.priceLabel}>Add-ons</Text>
                <Text style={S.priceValue}>{fmt(data.addonTotal)}</Text>
              </View>
            )}
            <View style={S.priceRow}>
              <Text style={S.priceLabel}>Safree service fee</Text>
              <Text style={S.priceValue}>{fmt(data.serviceFee)}</Text>
            </View>
            <View style={S.totalRow}>
              <Text style={S.totalLabel}>TOTAL PAID</Text>
              <Text style={S.totalValue}>{fmt(data.total)}</Text>
            </View>
          </View>

          {/* ── Cancellation policy ───────────────────────────── */}
          <View style={{ marginTop: 10, backgroundColor: C.bgLight, borderRadius: 4, padding: 10 }}>
            <Text style={{ fontSize: 8, color: C.muted, fontFamily: 'Helvetica-Bold', marginBottom: 3 }}>
              CANCELLATION POLICY: {(data.cancellationPolicy ?? '').toUpperCase()}
            </Text>
            <Text style={{ fontSize: 8, color: C.muted, lineHeight: 1.5 }}>
              Your funds are held in escrow and released to the provider 7 days after your experience completes.
              Disputes must be opened within 7 days of completion.
              Safree Support: support@safree.com
            </Text>
          </View>
        </View>

        {/* ── Footer ─────────────────────────────────────────── */}
        <View style={S.footer}>
          <Text style={S.footerText}>
            This voucher is your proof of booking. Present to provider on arrival.
          </Text>
          <Text style={S.footerText}>
            Generated: {data.generatedAt} · Booking ID: {data.bookingId}
          </Text>
          <Text style={S.footerText}>
            © {new Date().getFullYear()} Safree · Premium Outdoor Marketplace · safree.com
          </Text>
        </View>

      </Page>
    </Document>
  )
}
