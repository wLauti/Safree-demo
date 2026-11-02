import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, Image, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity, Linking } from 'react-native'
import { supabase } from '@/lib/supabase'
import { formatCurrency, type Product } from '@/lib/types'
import { colors, radius, spacing } from '@/theme'

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? 'https://safree.com'

export function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('products')
      .select('id, slug, title, price, compare_at_price, images, stock, location_state, stores(name)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(100)
    setProducts((data ?? []) as unknown as Product[])
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
      data={products}
      keyExtractor={p => p.id}
      numColumns={2}
      columnWrapperStyle={{ gap: spacing(3) }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} tintColor={colors.cream} />}
      ListEmptyComponent={<Text style={styles.empty}>No products yet.</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => Linking.openURL(`${WEB_URL}/products/${item.slug ?? item.id}`)}
        >
          <View style={styles.imageWrap}>
            {item.images?.[0]
              ? <Image source={{ uri: item.images[0] }} style={styles.image} />
              : <View style={[styles.image, { backgroundColor: colors.cardAlt }]} />}
          </View>
          <Text style={styles.storeName} numberOfLines={1}>{item.stores?.name ?? ''}</Text>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.price}>{formatCurrency(item.price)}</Text>
        </TouchableOpacity>
      )}
    />
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: spacing(12) },
  card: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, borderColor: colors.border, borderWidth: 1, padding: spacing(2), marginBottom: spacing(3) },
  imageWrap: { aspectRatio: 1, borderRadius: radius.sm, overflow: 'hidden', backgroundColor: colors.cardAlt, marginBottom: spacing(2) },
  image: { width: '100%', height: '100%' },
  storeName: { color: colors.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { color: colors.text, fontSize: 13, marginTop: 2, minHeight: 34 },
  price: { color: colors.cream, fontWeight: '700', marginTop: spacing(1) },
})
