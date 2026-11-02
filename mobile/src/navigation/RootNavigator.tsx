import React from 'react'
import { View, ActivityIndicator, Text } from 'react-native'
import { NavigationContainer, DefaultTheme } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useAuth } from '@/context/AuthContext'
import { colors } from '@/theme'
import { LoginScreen } from '@/screens/LoginScreen'
import { RegisterScreen } from '@/screens/RegisterScreen'
import { ProductsScreen } from '@/screens/ProductsScreen'
import { ExperiencesScreen } from '@/screens/ExperiencesScreen'
import { MapScreen } from '@/screens/MapScreen'
import { AccountScreen } from '@/screens/AccountScreen'

export type AuthStackParamList = { Login: undefined; Register: undefined }

const AuthStack = createNativeStackNavigator<AuthStackParamList>()
const Tab = createBottomTabNavigator()

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.border,
    primary: colors.red,
  },
}

const screenHeader = {
  headerStyle: { backgroundColor: colors.bg },
  headerTitleStyle: { color: colors.cream },
  headerTintColor: colors.cream,
}

// Simple emoji tab icons to avoid extra icon-font setup.
function tabIcon(label: string) {
  return ({ color }: { color: string }) => <Text style={{ fontSize: 18, color }}>{label}</Text>
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        ...screenHeader,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.cream,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tab.Screen name="Marketplace" component={ProductsScreen} options={{ tabBarIcon: tabIcon('🛍️') }} />
      <Tab.Screen name="Experiences" component={ExperiencesScreen} options={{ tabBarIcon: tabIcon('🏔️') }} />
      <Tab.Screen name="Map" component={MapScreen} options={{ title: 'Find Grounds', tabBarIcon: tabIcon('🗺️') }} />
      <Tab.Screen name="Account" component={AccountScreen} options={{ tabBarIcon: tabIcon('👤') }} />
    </Tab.Navigator>
  )
}

function AuthFlow() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  )
}

export function RootNavigator() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.red} size="large" />
      </View>
    )
  }

  return (
    <NavigationContainer theme={navTheme}>
      {session ? <MainTabs /> : <AuthFlow />}
    </NavigationContainer>
  )
}
