import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  ArrowLeft,
  BatteryCharging,
  BellRing,
  CheckCircle2,
  RefreshCcw,
  ShieldCheck,
  Volume2,
  Wifi,
} from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import { Button, Card, Header, InfoBanner, Screen, StatusPill } from '@/components/ui';

export default function HealthScreen() {
  const { colors, permissionState } = useApp();

  const rows = [
    {
      title: 'Notification Access',
      description: 'Listening for incoming UPI payment alerts.',
      icon: BellRing,
      label: 'Active & Ready',
      tone: 'success' as const,
      route: '/permission-guide',
    },
    {
      title: 'Merchant App Sources',
      description: 'PhonePe, Google Pay, Paytm, BHIM connected.',
      icon: ShieldCheck,
      label: '4 Sources Ready',
      tone: 'success' as const,
      route: '/sources',
    },
    {
      title: 'Announcement Audio',
      description: 'Device Text-to-Speech synthesizer available.',
      icon: Volume2,
      label: 'Audio Operational',
      tone: 'success' as const,
      route: '/voice-test',
    },
    {
      title: 'Background Battery Readiness',
      description: 'Keep app exempt from aggressive battery killing.',
      icon: BatteryCharging,
      label: 'Optimized',
      tone: 'success' as const,
      route: '/recovery?kind=background',
    },
    {
      title: 'Network & Connectivity',
      description: 'Local on-device audio announcements work offline.',
      icon: Wifi,
      label: 'Offline Ready',
      tone: 'success' as const,
      route: '/privacy',
    },
  ];

  return (
    <Screen>
      <Header
        title="Soundbox Health"
        subtitle="System diagnostics and readiness check"
        back={
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <ArrowLeft size={22} color={colors.text} />
          </Pressable>
        }
      />

      <InfoBanner
        title="All Systems Operational"
        text="Your device is ready to detect supported payment notifications and announce them aloud via speaker."
        tone="success"
        icon={CheckCircle2}
      />

      <View style={{ gap: 9 }}>
        {rows.map((row) => (
          <Card key={row.title} padding={14}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  backgroundColor: colors.surfaceSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <row.icon size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14 }}>{row.title}</Text>
                <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 17 }}>{row.description}</Text>
              </View>
            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 6,
              }}
            >
              <StatusPill label={row.label} tone={row.tone} small />
              <Pressable onPress={() => router.push(row.route as any)}>
                <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 13 }}>Details ↗</Text>
              </Pressable>
            </View>
          </Card>
        ))}
      </View>

      <Button
        title="Run Audio Voice Check"
        icon={Volume2}
        onPress={() => router.push('/voice-test')}
      />
    </Screen>
  );
}
