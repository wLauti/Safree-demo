import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import { useAuth } from '@/context/AuthContext'
import { colors, radius, spacing } from '@/theme'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { AuthStackParamList } from '@/navigation/RootNavigator'

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>

export function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setError(null)
    setLoading(true)
    const { error } = await signIn(email.trim(), password)
    setLoading(false)
    if (error) setError(error)
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.logo}>
        Saf<Text style={{ color: colors.red }}>ree</Text>
      </Text>
      <Text style={styles.subtitle}>Sign in to your account</Text>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.cream} /> : <Text style={styles.buttonText}>SIGN IN</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Don&apos;t have an account? Sign up free</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing(6), justifyContent: 'center' },
  logo: { fontSize: 38, fontWeight: '800', color: colors.cream, textAlign: 'center', letterSpacing: 2 },
  subtitle: { color: colors.textMuted, textAlign: 'center', marginBottom: spacing(8), marginTop: spacing(2) },
  input: {
    backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md,
    paddingHorizontal: spacing(4), paddingVertical: spacing(3.5), color: colors.text, marginBottom: spacing(3),
  },
  button: {
    backgroundColor: colors.red, borderRadius: radius.md, paddingVertical: spacing(4),
    alignItems: 'center', marginTop: spacing(2),
  },
  buttonText: { color: colors.cream, fontWeight: '700', letterSpacing: 1 },
  link: { color: colors.cream, textAlign: 'center', marginTop: spacing(6) },
  errorBox: { backgroundColor: 'rgba(130,38,38,0.15)', borderColor: colors.red, borderWidth: 1, borderRadius: radius.md, padding: spacing(3), marginBottom: spacing(4) },
  errorText: { color: '#f87171', fontSize: 13 },
})
