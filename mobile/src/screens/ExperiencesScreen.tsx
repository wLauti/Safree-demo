import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, Image, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity, Linking } from 'react-native'
import { supabase } from '@/lib/supabase'
import { formatCurrency, type Experience } from '@/lib/types'
import { colors, radius, spacing } from '@/theme'

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? 'https://safree.com'

export function ExperiencesScreen() {
  const [items, setItems] = useState<Experience[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('experiences')
      .select('id, slug, title, type, price_per_person, images, location_state, location_city, avg_rating, review_count, location_coords, stores(name, is_verified)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(100)
    setItems((data ?? []) as unknown as Experience[])
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.red} size="large" /></View>
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing(3) }}
      data={items}
      keyExtractor={e => e.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} tintColor={colors.cream} />}
      ListEmptyComponent={<Text style={styles.empty}>No experiences yet.</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => Linking.openURL(`${WEB_URL}/experiences/${item.slug ?? item.id}`)}
        >
          <View style={styles.imageWrap}>
            {item.images?.[0]
              ? <Image source={{ uri: item.images[0] }} style={styles.image} />
              : <View style={[styles.image, { backgroundColor: colors.cardAlt }]} />}
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.type === 'fishing' ? '🎣 Fishing' : '🦌 Hunt'}</Text>
            </View>
          </View>
          <View style={{ padding: spacing(3) }}>
            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.location} numberOfLines={1}>
              {[item.location_city, item.location_state].filter(Boolean).join(', ')}
            </Text>
            <View style={styles.row}>
              <Text style={styles.price}>{formatCurrency(item.price_per_person)} <Text style={styles.perPerson}>/ person</Text></Text>
              {item.review_count > 0 && <Text style={styles.rating}>★ {item.avg_rating?.toFixed(1)}</Text>}
            </View>
          </View>
        </TouchableOpacity>
      )}
    />
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: spacing(12) },
  card: { backgroundColor: colors.card, borderRadius: radius.md, borderColor: colors.border, borderWidth: 1, overflow: 'hidden', marginBottom: spacing(3) },
  imageWrap: { aspectRatio: 16 / 9, backgroundColor: colors.cardAlt },
  image: { width: '100%', height: '100%' },
  badge: { position: 'absolute', top: spacing(2), left: spacing(2), backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: radius.full, paddingHorizontal: spacing(2.5), paddingVertical: spacing(1) },
  badgeText: { color: colors.cream, fontSize: 11 },
  title: { color: colors.text, fontSize: 16, fontWeight: '600' },
  location: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing(2) },
  price: { color: colors.cream, fontWeight: '700', fontSize: 15 },
  perPerson: { color: colors.textMuted, fontSize: 11, fontWeight: '400' },
  rating: { color: colors.cream, fontSize: 13 },
})
