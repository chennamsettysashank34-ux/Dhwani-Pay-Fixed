import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  BellRing,
  CircleHelp,
  Database,
  FolderLock,
  Globe,
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
    vaultQRs,
    activeVaultQR,
    permissionState,
  } = useApp();

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
                title="Cloud Ledger Sync"
                description={
                  isCloudActive
                    ? 'All transactions synced securely to merchant cloud'
                    : 'Running in offline local storage mode'
                }
                icon={Database}
                right={
                  <StatusPill
                    label={isCloudActive ? 'ACTIVE' : 'OFFLINE'}
                    tone={isCloudActive ? 'success' : 'neutral'}
                    small
                  />
                }
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
                title="Cloud Ledger Sync"
                description={
                  isCloudActive
                    ? 'Cloud backend ready · Sign in to link store'
                    : 'Running in offline local storage mode'
                }
                icon={Database}
                right={
                  <StatusPill
                    label={isCloudActive ? 'READY' : 'OFFLINE'}
                    tone={isCloudActive ? 'success' : 'neutral'}
                    small
                  />
                }
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


    </Screen>
  );
}
