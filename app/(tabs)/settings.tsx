import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  BellRing,
  CheckCircle2,
  CircleHelp,
  Database,
  FolderLock,
  Globe,
  KeyRound,
  Languages,
  LockKeyhole,
  LogOut,
  Mail,
  Palette,
  QrCode,
  RotateCcw,
  ShieldCheck,
  Store,
  User,
  Volume2,
  Wrench,
  X,
} from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import {
  BrandMark,
  Button,
  Card,
  Divider,
  Header,
  InfoBanner,
  PageIntro,
  Screen,
  SettingRow,
  StatusPill,
} from '@/components/ui';
import { confirmAction } from '@/utils/confirm';
import { testSupabaseConnection } from '@/lib/supabase';

export default function SettingsScreen() {
  const {
    colors,
    spokenLanguage,
    themeMode,
    clearAllData,
    merchantProfile,
    currentUser,
    logoutUser,
    isCloudActive,
    supabaseUrl,
    supabaseAnonKey,
    configureSupabase,
    vaultQRs,
    activeVaultQR,
    permissionState,
  } = useApp();

  const [dbModalOpen, setDbModalOpen] = useState(false);
  const [inputUrl, setInputUrl] = useState(supabaseUrl);
  const [inputAnonKey, setInputAnonKey] = useState(supabaseAnonKey);
  const [testingDb, setTestingDb] = useState(false);
  const [dbStatusMsg, setDbStatusMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    setInputUrl(supabaseUrl);
    setInputAnonKey(supabaseAnonKey);
  }, [supabaseUrl, supabaseAnonKey]);

  const handleSaveSupabase = async () => {
    setDbStatusMsg(null);
    const cleanUrl = inputUrl.trim();
    const cleanKey = inputAnonKey.trim();

    if (!cleanUrl && !cleanKey) {
      await configureSupabase('', '');
      setDbModalOpen(false);
      Alert.alert('Local Mode Enabled', 'Cleared Supabase credentials.');
      return;
    }

    setTestingDb(true);
    try {
      const check = await testSupabaseConnection(cleanUrl, cleanKey);
      await configureSupabase(cleanUrl, cleanKey);
      setDbStatusMsg({ ok: check.ok, text: check.message });
      if (check.ok) {
        Alert.alert('Supabase Connected', check.message, [
          { text: 'OK', onPress: () => setDbModalOpen(false) },
        ]);
      }
    } catch (e: any) {
      setDbStatusMsg({
        ok: false,
        text: e?.message || 'Could not verify Supabase connection.',
      });
    } finally {
      setTestingDb(false);
    }
  };

  const handleClearData = () => {
    confirmAction(
      'Clear Ledger Records',
      'Are you sure you want to clear your local payment events and expense records? This cannot be undone.',
      () => {
        clearAllData();
        Alert.alert('Records Cleared', 'All local payment and expense records have been cleared.');
      },
      { confirmText: 'Clear All Data', isDestructive: true }
    );
  };

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BrandMark size={50} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 21, fontWeight: '900' }}>DhwaniPay</Text>
          <Text style={{ color: colors.muted, marginTop: 2, fontSize: 13 }}>
            Your phone. Your payment soundbox.
          </Text>
        </View>
        <StatusPill label="READY" tone="success" />
      </View>

      <PageIntro
        title="Settings"
        description="Configure soundbox voice, Supabase cloud database, languages, and app appearance."
      />

      <View style={{ gap: 7 }}>
        <Text
          style={{
            color: colors.muted,
            fontSize: 11,
            letterSpacing: 1.2,
            fontWeight: '900',
            marginLeft: 2,
          }}
        >
          MERCHANT ACCOUNT & CLOUD DATABASE
        </Text>
        <Card padding={14}>
          {currentUser ? (
            <>
              <SettingRow
                title={currentUser.user_metadata?.business_name || 'Merchant Account'}
                description={`Logged in as ${currentUser.email} · ${
                  isCloudActive ? 'Supabase Cloud Synced' : 'Local Device Ledger'
                }`}
                icon={User}
                onPress={() => router.push('/auth')}
              />
              <Divider />
              <SettingRow
                title="Configure Supabase Database"
                description={
                  isCloudActive
                    ? `Connected: ${supabaseUrl}`
                    : 'Set Project URL & Anon Public Key for cloud sync'
                }
                icon={Database}
                right={
                  <StatusPill
                    label={isCloudActive ? 'CONNECTED' : 'SETUP'}
                    tone={isCloudActive ? 'success' : 'warning'}
                    small
                  />
                }
                onPress={() => {
                  setDbStatusMsg(null);
                  setDbModalOpen(true);
                }}
              />
              <Divider />
              <SettingRow
                title="Sign Out"
                description="Disconnect current account from this phone"
                icon={LogOut}
                danger
                onPress={() => {
                  confirmAction(
                    'Sign Out',
                    'Are you sure you want to sign out of your merchant account?',
                    async () => {
                      await logoutUser();
                      Alert.alert('Signed Out', 'You have been signed out.');
                    },
                    { confirmText: 'Sign Out', isDestructive: true }
                  );
                }}
              />
            </>
          ) : (
            <>
              <SettingRow
                title="Sign in with Email"
                description="Sync soundbox payments & ledger securely to cloud"
                icon={Mail}
                onPress={() => router.push('/auth')}
              />
              <Divider />
              <SettingRow
                title="Configure Supabase Database"
                description={
                  isCloudActive
                    ? `Connected: ${supabaseUrl}`
                    : 'Set Project URL & Anon Public Key for cloud sync'
                }
                icon={Database}
                right={
                  <StatusPill
                    label={isCloudActive ? 'CONNECTED' : 'SETUP'}
                    tone={isCloudActive ? 'success' : 'warning'}
                    small
                  />
                }
                onPress={() => {
                  setDbStatusMsg(null);
                  setDbModalOpen(true);
                }}
              />
            </>
          )}
        </Card>
      </View>

      <View style={{ gap: 7 }}>
        <Text
          style={{
            color: colors.muted,
            fontSize: 11,
            letterSpacing: 1.2,
            fontWeight: '900',
            marginLeft: 2,
          }}
        >
          MERCHANT & REAL PAYMENTS
        </Text>
        <Card padding={14}>
          <SettingRow
            title="Merchant Profile & UPI ID"
            description={`UPI: ${merchantProfile.vpa || 'Not configured'} · ${
              merchantProfile.businessName || 'Configure shop'
            }`}
            icon={Store}
            onPress={() => router.push('/merchant-profile')}
          />
          <Divider />
          <SettingRow
            title="QR Code Vault (Downloaded Standees)"
            description={`${vaultQRs.length} standees · Active: ${
              activeVaultQR ? activeVaultQR.appName : 'None'
            }`}
            icon={FolderLock}
            onPress={() => router.push('/qr-vault')}
          />
          <Divider />
          <SettingRow
            title="Collect Payment (Dynamic QR)"
            description="Dynamic on-the-fly UPI QR generation"
            icon={QrCode}
            onPress={() => router.push('/collect')}
          />
          <Divider />
          <SettingRow
            title="Payment Gateways (Razorpay / Cashfree)"
            description="Automated settlements & webhooks"
            icon={Globe}
            onPress={() => router.push('/gateway-settings')}
          />
        </Card>
      </View>

      <View style={{ gap: 7 }}>
        <Text
          style={{
            color: colors.muted,
            fontSize: 11,
            letterSpacing: 1.2,
            fontWeight: '900',
            marginLeft: 2,
          }}
        >
          SOUNDBOX AUDIO & LISTENER
        </Text>
        <Card padding={14}>
          <SettingRow
            title="Notification Listener Service"
            description={
              permissionState === 'enabled'
                ? 'Active · Intercepting UPI notifications'
                : 'Permission needed · Tap to configure'
            }
            icon={BellRing}
            right={
              <StatusPill
                label={permissionState === 'enabled' ? 'ACTIVE' : 'ACTION NEEDED'}
                tone={permissionState === 'enabled' ? 'success' : 'warning'}
                small
              />
            }
            onPress={() => router.push('/permission-guide')}
          />
          <Divider />
          <SettingRow
            title="Sound & announcements"
            description={`Spoken language: ${spokenLanguage}`}
            icon={Volume2}
            onPress={() => router.push('/announcement-settings')}
          />
          <Divider />
          <SettingRow
            title="Supported UPI sources"
            description="PhonePe, Google Pay, Paytm, BHIM"
            icon={BellRing}
            onPress={() => router.push('/sources')}
          />
          <Divider />
          <SettingRow
            title="Soundbox diagnostics"
            description="Check speaker volume and readiness"
            icon={Wrench}
            onPress={() => router.push('/health')}
          />
        </Card>
      </View>

      <View style={{ gap: 7 }}>
        <Text
          style={{
            color: colors.muted,
            fontSize: 11,
            letterSpacing: 1.2,
            fontWeight: '900',
            marginLeft: 2,
          }}
        >
          APP PREFERENCES
        </Text>
        <Card padding={14}>
          <SettingRow
            title="Language & Accessibility"
            description="Multi-language speech announcements & theme customization"
            icon={Languages}
            onPress={() => router.push('/accessibility')}
          />
          <Divider />
          <SettingRow
            title="Appearance"
            description={`Theme: ${themeMode[0].toUpperCase()}${themeMode.slice(1)}`}
            icon={Palette}
            onPress={() => router.push('/accessibility')}
          />
        </Card>
      </View>

      <View style={{ gap: 7 }}>
        <Text
          style={{
            color: colors.muted,
            fontSize: 11,
            letterSpacing: 1.2,
            fontWeight: '900',
            marginLeft: 2,
          }}
        >
          PRIVACY & MAINTENANCE
        </Text>
        <Card padding={14}>
          <SettingRow
            title="Privacy & permissions"
            description="Notification access details and on-device processing"
            icon={LockKeyhole}
            onPress={() => router.push('/privacy')}
          />
          <Divider />
          <SettingRow
            title="Help & FAQs"
            description="Frequently asked questions and guides"
            icon={CircleHelp}
            onPress={() => router.push('/help')}
          />
          <Divider />
          <SettingRow
            title="Clear ledger records"
            description="Wipe payment events and expenses to start fresh"
            icon={RotateCcw}
            danger
            onPress={handleClearData}
          />
        </Card>
      </View>

      <View style={{ alignItems: 'center', gap: 6, paddingTop: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <ShieldCheck color={colors.primary} size={15} />
          <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700' }}>
            Built for small merchants, with clarity first.
          </Text>
        </View>
        <Text style={{ color: colors.muted, fontSize: 11 }}>DhwaniPay · v1.0.0</Text>
      </View>

      {/* Supabase Configuration Modal */}
      <Modal
        visible={dbModalOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setDbModalOpen(false)}
      >
        <Screen>
          <Header
            title="Supabase Cloud Setup"
            subtitle="PostgreSQL Ledger & GoTrue Auth"
            back={
              <Pressable onPress={() => setDbModalOpen(false)} hitSlop={10}>
                <X size={22} color={colors.text} />
              </Pressable>
            }
          />

          <InfoBanner
            tone="info"
            icon={Database}
            title="Connect Your Supabase Project"
            text="Paste your Supabase Project URL and Anon Public Key below (from Supabase Dashboard > Project Settings > API). Run supabase/schema.sql in your SQL Editor to create the tables."
          />

          {dbStatusMsg ? (
            <InfoBanner
              tone={dbStatusMsg.ok ? 'success' : 'error'}
              title={dbStatusMsg.ok ? 'Connection Verified' : 'Connection Notice'}
              text={dbStatusMsg.text}
            />
          ) : null}

          <View style={{ gap: 14 }}>
            <View style={{ gap: 6 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '800',
                  color: colors.muted,
                  letterSpacing: 0.6,
                }}
              >
                SUPABASE PROJECT URL
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
                <Globe size={18} color={colors.primary} />
                <TextInput
                  value={inputUrl}
                  onChangeText={setInputUrl}
                  placeholder="https://your-project-id.supabase.co"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{ flex: 1, fontSize: 14, fontWeight: '700', color: colors.text }}
                />
              </View>
            </View>

            <View style={{ gap: 6 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '800',
                  color: colors.muted,
                  letterSpacing: 0.6,
                }}
              >
                SUPABASE ANON PUBLIC KEY
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
                <KeyRound size={18} color={colors.primary} />
                <TextInput
                  value={inputAnonKey}
                  onChangeText={setInputAnonKey}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  placeholderTextColor={colors.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{ flex: 1, fontSize: 13, fontWeight: '700', color: colors.text }}
                />
              </View>
            </View>

            {testingDb ? (
              <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 6 }}>
                  Testing connection to Supabase...
                </Text>
              </View>
            ) : (
              <Button
                title="Verify & Save Supabase Config"
                icon={CheckCircle2}
                onPress={handleSaveSupabase}
              />
            )}

            <Button
              title="Close"
              variant="secondary"
              onPress={() => setDbModalOpen(false)}
            />
          </View>
        </Screen>
      </Modal>
    </Screen>
  );
}
