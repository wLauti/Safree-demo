import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native'
import { useAuth } from '@/context/AuthContext'
import { colors, radius, spacing } from '@/theme'

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? 'https://safree.com'

export function AccountScreen() {
  const { user, signOut } = useAuth()

  const links: { label: string; path: string }[] = [
    { label: 'My Orders', path: '/user/orders' },
    { label: 'My Bookings', path: '/user/bookings' },
    { label: 'Saved Items', path: '/user/saved' },
    { label: 'Notifications', path: '/user/notifications' },
    { label: 'Settings', path: '/user/settings' },
  ]

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.user_metadata?.full_name ?? user?.email ?? '?').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={styles.name}>{user?.user_metadata?.full_name ?? 'Member'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
      </View>

      <View style={styles.list}>
        {links.map(l => (
          <TouchableOpacity key={l.path} style={styles.item} onPress={() => Linking.openURL(`${WEB_URL}${l.path}`)}>
            <Text style={styles.itemText}>{l.label}</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.note}>
        Checkout, bookings and account management open the full Safree web experience.
        Native flows are coming in a future release.
      </Text>

      <TouchableOpacity style={styles.signOut} onPress={signOut}>
        <Text style={styles.signOutText}>SIGN OUT</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing(5) },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing(3), marginBottom: spacing(8) },
  avatar: { width: 56, height: 56, borderRadius: radius.full, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.cream, fontSize: 22, fontWeight: '700' },
  name: { color: colors.text, fontSize: 18, fontWeight: '600' },
  email: { color: colors.textMuted, fontSize: 13 },
  list: { backgroundColor: colors.card, borderRadius: radius.md, borderColor: colors.border, borderWidth: 1, overflow: 'hidden' },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing(4), paddingHorizontal: spacing(4), borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
  itemText: { color: colors.text, fontSize: 15 },
  chevron: { color: colors.textMuted, fontSize: 20 },
  note: { color: colors.textMuted, fontSize: 12, marginTop: spacing(5), lineHeight: 18 },
  signOut: { marginTop: 'auto', borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, paddingVertical: spacing(4), alignItems: 'center' },
  signOutText: { color: '#f87171', fontWeight: '700', letterSpacing: 1 },
})
