import React, { useEffect, useState } from 'react'
import { View, ActivityIndicator, StyleSheet, Linking } from 'react-native'
import { WebView } from 'react-native-webview'
import { supabase } from '@/lib/supabase'
import { normalizeGeoPoint } from '@/lib/geo'
import { colors } from '@/theme'

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? 'https://safree.com'

interface MapPoint {
  id: string
  slug: string
  title: string
  type: string
  lng: number
  lat: number
}

// Self-contained Leaflet map (CARTO/OpenStreetMap tiles — no token, no WebGL),
// matching the web app. Rendered inside a WebView and fed markers as JSON.
function buildHtml(points: MapPoint[]): string {
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>html,body,#map{height:100%;margin:0;background:#1a1a1a}</style>
</head><body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var points = ${JSON.stringify(points)};
  var map = L.map('map').setView([31.2, -99.3], 6);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO', maxZoom: 19
  }).addTo(map);
  points.forEach(function(p){
    var color = p.type === 'fishing' ? '#E6DDBC' : '#822626';
    var icon = L.divIcon({ className:'', html:
      '<div style="width:26px;height:26px;border-radius:50%;background:'+color+';border:2px solid #E6DDBC;display:flex;align-items:center;justify-content:center;font-size:13px">'+(p.type==='fishing'?'🎣':'🦌')+'</div>',
      iconSize:[26,26], iconAnchor:[13,13] });
    var m = L.marker([p.lat, p.lng], { icon: icon }).addTo(map);
    m.on('click', function(){
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(p.slug);
    });
  });
  if (points.length) {
    var g = L.featureGroup(points.map(function(p){ return L.marker([p.lat,p.lng]); }));
    map.fitBounds(g.getBounds().pad(0.2));
  }
</script>
</body></html>`
}

export function MapScreen() {
  const [html, setHtml] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('experiences')
      .select('id, slug, title, type, location_coords')
      .eq('status', 'active')
      .limit(300)
      .then(({ data }) => {
        const points: MapPoint[] = (data ?? [])
          .map((e: any) => {
            const coords = normalizeGeoPoint(e.location_coords)
            if (!coords) return null
            return { id: e.id, slug: e.slug ?? e.id, title: e.title, type: e.type ?? 'hunt', lng: coords[0], lat: coords[1] }
          })
          .filter(Boolean) as MapPoint[]
        setHtml(buildHtml(points))
      })
  }, [])

  if (!html) {
    return <View style={styles.center}><ActivityIndicator color={colors.red} size="large" /></View>
  }

  return (
    <WebView
      style={{ flex: 1, backgroundColor: colors.bg }}
      originWhitelist={['*']}
      source={{ html }}
      onMessage={(e) => {
        const slug = e.nativeEvent.data
        if (slug) Linking.openURL(`${WEB_URL}/experiences/${slug}`)
      }}
    />
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' },
})
