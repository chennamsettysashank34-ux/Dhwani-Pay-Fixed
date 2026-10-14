import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { AppProvider, useApp } from '@/context/AppContext';
import { BrandMark } from '@/components/ui';

// Prevent splash screen from auto-hiding before auth & storage hydrate
try {
  SplashScreen.preventAutoHideAsync().catch(() => {});
} catch {
  // Ignore if unavailable
}

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMessage: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unexpected application error',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.warn('[DhwaniPay RootErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: '#F7F9F6',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            gap: 14,
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#17231D', textAlign: 'center' }}>
            DhwaniPay Recovery Mode
          </Text>
          <Text style={{ fontSize: 13, color: '#6B7A70', textAlign: 'center', lineHeight: 20 }}>
            {this.state.errorMessage}
          </Text>
          <Pressable
            onPress={() => this.setState({ hasError: false, errorMessage: '' })}
            style={{
              marginTop: 8,
              backgroundColor: '#087F5B',
              paddingHorizontal: 22,
              paddingVertical: 13,
              borderRadius: 14,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 15 }}>
              Reload Soundbox
            </Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

function AppNavigator() {
  const { colors, isDark, currentUser, authLoading } = useApp();
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const isNavReady = Boolean(rootNavigationState?.key);

  useEffect(() => {
    if (!authLoading) {
      try {
        SplashScreen.hideAsync().catch(() => {});
      } catch {
        // Ignore
      }
    }
  }, [authLoading]);

  useEffect(() => {
    if (authLoading || !isNavReady) return;

    const firstSegment = segments[0] as string | undefined;
    const isAuthRoute = firstSegment === 'auth' || firstSegment === 'login';

    const timer = setTimeout(() => {
      try {
        if (!currentUser && !isAuthRoute) {
          // Compulsory authentication: user cannot enter app without logging in
          router.replace('/auth');
        } else if (currentUser && isAuthRoute) {
          // Already logged in: redirect to dashboard
          router.replace('/(tabs)');
        }
      } catch (e) {
        console.warn('Navigation redirect deferred:', e);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [currentUser, authLoading, isNavReady, segments]);

  const bgColor = colors?.background || '#F7F9F6';
  const primaryColor = colors?.primary || '#087F5B';
  const mutedColor = colors?.muted || '#6B7A70';

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: bgColor },
          animation: 'slide_from_right',
        }}
      >
        {/* Authentication Routes (Compulsory Entry Point) */}
        <Stack.Screen name="auth" options={{ gestureEnabled: false }} />
        <Stack.Screen name="login" options={{ gestureEnabled: false }} />

        {/* Protected App Routes */}
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="language" />
        <Stack.Screen name="setup" />
        <Stack.Screen name="sources" />
        <Stack.Screen name="permission-guide" />
        <Stack.Screen name="voice-test" />
        <Stack.Screen name="health" />
        <Stack.Screen name="recovery" />
        <Stack.Screen name="announcement-settings" />
        <Stack.Screen name="accessibility" />
        <Stack.Screen name="privacy" />
        <Stack.Screen name="help" />
        <Stack.Screen name="demo" />
        <Stack.Screen name="collect" />
        <Stack.Screen name="merchant-profile" />
        <Stack.Screen name="qr-vault" />
        <Stack.Screen name="gateway-settings" />
        <Stack.Screen name="event/[id]" />
      </Stack>

      {(authLoading || !isNavReady) && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: bgColor,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              zIndex: 999,
            },
          ]}
        >
          <BrandMark size={64} />
          <ActivityIndicator size="large" color={primaryColor} />
          <Text
            style={{
              color: mutedColor,
              fontSize: 13,
              fontWeight: '700',
              letterSpacing: 0.4,
            }}
          >
            Securing DhwaniPay Soundbox...
          </Text>
        </View>
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootErrorBoundary>
        <SafeAreaProvider>
          <AppProvider>
            <AppNavigator />
          </AppProvider>
        </SafeAreaProvider>
      </RootErrorBoundary>
    </GestureHandlerRootView>
  );
}
