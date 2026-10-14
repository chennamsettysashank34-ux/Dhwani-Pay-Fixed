import React from 'react';
import { Alert, Linking, Platform, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, CheckCircle2, AlertCircle, LockKeyhole, Settings2, ShieldCheck } from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import { Button, Card, Header, InfoBanner, Screen, StatusPill } from '@/components/ui';

const steps = [
  'Open your phone’s Settings > Apps > Special App Access.',
  'Locate "Notification Access" or "Device & App Notifications".',
  'Turn the toggle ON for DhwaniPay.',
  'Confirm the prompt to allow DhwaniPay to announce payments.',
];

export default function PermissionGuideScreen() {
  const { colors, permissionState, requestNotificationPermission } = useApp();

  const handleOpenSettings = async () => {
    try {
      if (Platform.OS === 'android') {
        await requestNotificationPermission();
      } else if (Platform.OS !== 'web') {
        await Linking.openSettings();
      } else {
        Alert.alert('Web Mode', 'On physical Android devices, this opens Notification Access settings directly.');
      }
    } catch {
      Alert.alert('Settings', 'Please navigate to Settings > Notification Access manually.');
    }
  };

  return (
    <Screen>
      <Header
        title="Notification Access"
        subtitle="Step-by-step permission guide"
        back={
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <ArrowLeft size={22} color={colors.text} />
          </Pressable>
        }
      />

      <View
        style={{
          width: 74,
          height: 74,
          borderRadius: 24,
          backgroundColor: colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <LockKeyhole color={colors.primary} size={32} />
      </View>

      <View style={{ gap: 7 }}>
        <Text style={{ color: colors.text, fontSize: 28, fontWeight: '900', lineHeight: 34, letterSpacing: -0.8 }}>
          Enable Payment Alerts
        </Text>
        <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 22 }}>
          To speak payment amounts automatically, Android requires Notification Access. DhwaniPay only monitors payment notifications from verified banking and UPI apps.
        </Text>
      </View>

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800' }}>Access Status</Text>
          {permissionState === 'enabled' ? (
            <StatusPill label="ACTIVE & GRANTED" tone="success" icon={CheckCircle2} />
          ) : (
            <StatusPill label="ACTION REQUIRED" tone="warning" icon={AlertCircle} />
          )}
        </View>
        <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18 }}>
          {permissionState === 'enabled'
            ? 'Ready to intercept incoming UPI merchant notifications on this device.'
            : 'Grant notification listener permission to allow DhwaniPay to speak payment amounts aloud.'}
        </Text>
      </Card>

      <View style={{ gap: 12 }}>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}>Android Setup Steps</Text>
        {steps.map((text, index) => (
          <View key={text} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 10,
                backgroundColor: colors.surfaceSoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 13 }}>{index + 1}</Text>
            </View>
            <Text style={{ flex: 1, color: colors.text, fontSize: 14, lineHeight: 20, paddingTop: 3 }}>
              {text}
            </Text>
          </View>
        ))}
      </View>

      <Button
        title="Open System Settings"
        icon={Settings2}
        onPress={handleOpenSettings}
      />
      <Button
        title="Return to Home"
        variant="secondary"
        onPress={() => router.replace('/(tabs)')}
      />
    </Screen>
  );
}
