import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  Database,
  Lock,
  LogIn,
  LogOut,
  Mail,
  ShieldCheck,
  Store,
  UserPlus,
} from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import { BrandMark, Button, Card, Header, InfoBanner, Screen, StatusPill } from '@/components/ui';
import { confirmAction } from '@/utils/confirm';
import {
  signInWithEmail,
  signUpWithEmail,
} from '@/lib/supabase';

const POPULAR_LANGUAGES = ['English', 'Hindi', 'Telugu', 'Kannada', 'Tamil', 'Marathi'];

export default function AuthScreen() {
  const {
    colors,
    loginUser,
    logoutUser,
    currentUser,
    isCloudActive,
  } = useApp();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [vpa, setVpa] = useState('');
  const [spokenLanguage, setSpokenLanguage] = useState('English');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const navigateToDashboard = () => {
    try {
      router.replace('/(tabs)');
    } catch {
      try {
        router.replace('/');
      } catch {
        router.navigate('/(tabs)');
      }
    }
  };

  const handleAuthSubmit = async () => {
    setErrorMsg(null);

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (mode === 'signup' && !businessName.trim()) {
      setErrorMsg('Please enter your shop or business name.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const result = await signUpWithEmail(email, password, {
          businessName: businessName.trim(),
          vpa: vpa.trim() || `${email.split('@')[0]}@okhdfcbank`,
          spokenLanguage,
        });

        if (result.error) {
          setErrorMsg(result.error);
        } else if (result.user) {
          loginUser(result.user);
          navigateToDashboard();
        } else {
          setErrorMsg('Registration completed. Please sign in to continue.');
          setMode('signin');
        }
      } else {
        const result = await signInWithEmail(email, password);

        if (result.error) {
          setErrorMsg(result.error);
        } else if (result.user) {
          loginUser(result.user);
          navigateToDashboard();
        } else {
          setErrorMsg('Authentication did not return a valid user session.');
        }
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Header
        title={
          currentUser
            ? 'Merchant Account'
            : mode === 'signin'
            ? 'Merchant Sign In'
            : 'Create Merchant Account'
        }
        subtitle={currentUser ? 'Connected Soundbox Session' : 'Compulsory Merchant Login'}
        back={
          currentUser ? (
            <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
              <ArrowLeft size={22} color={colors.text} />
            </Pressable>
          ) : undefined
        }
        right={
          <StatusPill
            label={isCloudActive ? 'CLOUD SYNC' : 'LOCAL'}
            tone={isCloudActive ? 'success' : 'neutral'}
            small
          />
        }
      />

      {/* Brand Hero when not logged in */}
      {!currentUser ? (
        <View style={{ alignItems: 'center', gap: 10, paddingTop: 6, paddingBottom: 6 }}>
          <BrandMark size={58} />
          <View style={{ alignItems: 'center', gap: 3 }}>
            <Text
              style={{
                fontSize: 22,
                fontWeight: '900',
                color: colors.text,
                letterSpacing: -0.6,
              }}
            >
              DhwaniPay Soundbox
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: colors.muted,
                textAlign: 'center',
                lineHeight: 18,
                paddingHorizontal: 16,
              }}
            >
              Authentication required to open and operate the audio soundbox on this device.
            </Text>
          </View>
        </View>
      ) : null}

      {/* Current Logged In Account Banner */}
      {currentUser ? (
        <Card padding={18} style={{ gap: 14, borderColor: colors.primary, borderWidth: 1.5 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: colors.primarySoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Store size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: 16, fontWeight: '900', color: colors.text }}>
                {currentUser.user_metadata?.business_name || 'Active Merchant'}
              </Text>
              <Text style={{ fontSize: 13, color: colors.muted }}>{currentUser.email}</Text>
            </View>
            <StatusPill label={isCloudActive ? 'SUPABASE SYNC' : 'LOGGED IN'} tone="success" small />
          </View>

          <View
            style={{
              backgroundColor: colors.surfaceSoft,
              borderRadius: 12,
              padding: 12,
              gap: 4,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '800', color: colors.muted }}>
              PRIMARY UPI ID (VPA)
            </Text>
            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>
              {currentUser.user_metadata?.vpa || 'Not configured'}
            </Text>
          </View>

          <Button
            title="Continue to Soundbox Dashboard"
            icon={ArrowRight}
            onPress={navigateToDashboard}
          />


          <Button
            title="Sign Out"
            variant="secondary"
            icon={LogOut}
            onPress={() => {
              confirmAction(
                'Sign Out',
                'Are you sure you want to sign out of your merchant account? You will need to sign in again to use the soundbox.',
                async () => {
                  await logoutUser();
                },
                { confirmText: 'Sign Out', isDestructive: true }
              );
            }}
          />
        </Card>
      ) : (
        <>
          {/* Auth Mode Switcher */}
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: colors.surfaceSoft,
              borderRadius: 16,
              padding: 4,
              gap: 4,
            }}
          >
            <Pressable
              onPress={() => {
                setMode('signin');
                setErrorMsg(null);
              }}
              style={{
                flex: 1,
                paddingVertical: 10,
                alignItems: 'center',
                borderRadius: 12,
                backgroundColor: mode === 'signin' ? colors.surface : 'transparent',
                elevation: mode === 'signin' ? 1 : 0,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '800',
                  color: mode === 'signin' ? colors.primary : colors.muted,
                }}
              >
                Sign In
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setMode('signup');
                setErrorMsg(null);
              }}
              style={{
                flex: 1,
                paddingVertical: 10,
                alignItems: 'center',
                borderRadius: 12,
                backgroundColor: mode === 'signup' ? colors.surface : 'transparent',
                elevation: mode === 'signup' ? 1 : 0,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '800',
                  color: mode === 'signup' ? colors.primary : colors.muted,
                }}
              >
                Create Account
              </Text>
            </Pressable>
          </View>

          {/* Error Message */}
          {errorMsg ? (
            <InfoBanner title="Authentication Notice" text={errorMsg} tone="error" />
          ) : null}

          {/* Form Fields */}
          <View style={{ gap: 13 }}>
            {/* Email Address */}
            <View style={{ gap: 6 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '800',
                  color: colors.muted,
                  letterSpacing: 0.6,
                }}
              >
                EMAIL ADDRESS
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.surface,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  gap: 10,
                }}
              >
                <Mail size={19} color={colors.primary} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="merchant@example.com"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={{ flex: 1, fontSize: 15, fontWeight: '700', color: colors.text }}
                />
              </View>
            </View>

            {/* Password */}
            <View style={{ gap: 6 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '800',
                  color: colors.muted,
                  letterSpacing: 0.6,
                }}
              >
                PASSWORD
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.surface,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  gap: 10,
                }}
              >
                <Lock size={19} color={colors.primary} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 6 characters"
                  placeholderTextColor={colors.muted}
                  secureTextEntry
                  style={{ flex: 1, fontSize: 15, fontWeight: '700', color: colors.text }}
                />
              </View>
            </View>

            {/* Registration Specific Fields */}
            {mode === 'signup' ? (
              <>
                {/* Shop Name */}
                <View style={{ gap: 6 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '800',
                      color: colors.muted,
                      letterSpacing: 0.6,
                    }}
                  >
                    SHOP / STORE NAME
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: colors.surface,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: colors.border,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      gap: 10,
                    }}
                  >
                    <Store size={19} color={colors.primary} />
                    <TextInput
                      value={businessName}
                      onChangeText={setBusinessName}
                      placeholder="e.g. Sharma Kirana & General Store"
                      placeholderTextColor={colors.muted}
                      style={{ flex: 1, fontSize: 15, fontWeight: '700', color: colors.text }}
                    />
                  </View>
                </View>

                {/* UPI ID */}
                <View style={{ gap: 6 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '800',
                      color: colors.muted,
                      letterSpacing: 0.6,
                    }}
                  >
                    PRIMARY UPI ID (VPA)
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: colors.surface,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: colors.border,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      gap: 10,
                    }}
                  >
                    <KeyRound size={19} color={colors.primary} />
                    <TextInput
                      value={vpa}
                      onChangeText={setVpa}
                      placeholder="e.g. sharmastore@okhdfcbank"
                      placeholderTextColor={colors.muted}
                      autoCapitalize="none"
                      style={{ flex: 1, fontSize: 15, fontWeight: '700', color: colors.text }}
                    />
                  </View>
                </View>

                {/* Announcement Language */}
                <View style={{ gap: 6 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '800',
                      color: colors.muted,
                      letterSpacing: 0.6,
                    }}
                  >
                    SOUNDBOX VOICE LANGUAGE
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {POPULAR_LANGUAGES.map((lang) => {
                      const selected = spokenLanguage === lang;
                      return (
                        <Pressable
                          key={lang}
                          onPress={() => setSpokenLanguage(lang)}
                          style={{
                            paddingVertical: 7,
                            paddingHorizontal: 12,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: selected ? colors.primary : colors.border,
                            backgroundColor: selected ? colors.primarySoft : colors.surface,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: '800',
                              color: selected ? colors.primary : colors.muted,
                            }}
                          >
                            {lang}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </>
            ) : null}

            {/* Submit Button */}
            {loading ? (
              <View style={{ paddingVertical: 14, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 8 }}>
                  Authenticating merchant session...
                </Text>
              </View>
            ) : (
              <Button
                title={mode === 'signin' ? 'Sign In to Soundbox' : 'Register & Start Soundbox'}
                icon={mode === 'signin' ? LogIn : UserPlus}
                onPress={handleAuthSubmit}
              />
            )}
          </View>
        </>
      )}

      {/* Cloud Sync Status Indicator */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 13,
          borderRadius: 16,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: isCloudActive ? colors.primary : colors.border,
          gap: 10,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <Database size={18} color={isCloudActive ? colors.primary : colors.muted} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }}>
              {isCloudActive ? 'Cloud Ledger Synchronized' : 'Offline Device Storage'}
            </Text>
            <Text style={{ fontSize: 11, color: colors.muted }} numberOfLines={1}>
              {isCloudActive
                ? 'Transactions securely backed up to cloud ledger'
                : 'Transactions saved securely on this device'}
            </Text>
          </View>
        </View>
        <StatusPill
          label={isCloudActive ? 'CLOUD' : 'LOCAL'}
          tone={isCloudActive ? 'success' : 'neutral'}
          small
        />
      </View>
    </Screen>
  );
}
