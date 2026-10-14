import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, BellRing, CheckCircle2, ShieldCheck, Smartphone } from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import { Button, Card, Header, InfoBanner, Screen, StatusPill } from '@/components/ui';

const INITIAL_SOURCES = [
  { id: 'phonepe', name: 'PhonePe for Business', desc: 'Instant QR code customer payments', enabled: true },
  { id: 'gpay', name: 'Google Pay for Business', desc: 'Google Pay merchant soundbox listener', enabled: true },
  { id: 'paytm', name: 'Paytm for Business', desc: 'Paytm QR soundbox notification alerts', enabled: true },
  { id: 'bhim', name: 'BHIM UPI & Bank Apps', desc: 'Govt BHIM & merchant banking alerts', enabled: true },
];

export default function SourcesScreen() {
  const { colors } = useApp();
  const [sources, setSources] = useState(INITIAL_SOURCES);

  const toggleSource = (id: string) => {
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  return (
    <Screen>
      <Header
        title="Notification Sources"
        subtitle="Select merchant apps to announce"
        back={
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <ArrowLeft size={22} color={colors.text} />
          </Pressable>
        }
      />

      <View style={{ gap: 7 }}>
        <Text style={{ color: colors.text, fontSize: 28, lineHeight: 34, fontWeight: '900', letterSpacing: -0.8 }}>
          Supported Payment Apps
        </Text>
        <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 22 }}>
          DhwaniPay listens for payment notifications from installed merchant apps and speaks them aloud.
        </Text>
      </View>

      <View style={{ gap: 11 }}>
        {sources.map((source) => (
          <Card key={source.id} padding={15}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 15,
                  backgroundColor: source.enabled ? colors.primarySoft : colors.surfaceSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Smartphone size={23} color={source.enabled ? colors.primary : colors.muted} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: '900' }}>
                  {source.name}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 12 }}>{source.desc}</Text>
                <StatusPill
                  label={source.enabled ? 'ACTIVE' : 'DISABLED'}
                  tone={source.enabled ? 'success' : 'neutral'}
                  small
                />
              </View>
              <Pressable
                onPress={() => toggleSource(source.id)}
                accessibilityRole="switch"
                accessibilityState={{ checked: source.enabled }}
                style={{
                  width: 46,
                  height: 28,
                  borderRadius: 20,
                  padding: 3,
                  backgroundColor: source.enabled ? colors.primary : colors.border,
                  justifyContent: 'center',
                }}
              >
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: '#FFFFFF',
                    alignSelf: source.enabled ? 'flex-end' : 'flex-start',
                  }}
                />
              </Pressable>
            </View>
          </Card>
        ))}
      </View>

      <InfoBanner
        title="Privacy Protection"
        text="DhwaniPay only detects payment amounts and merchant notifications. Personal SMS, chats, and OTPs are strictly ignored and never stored."
        icon={ShieldCheck}
        tone="info"
      />

      <Button
        title="Continue to Voice Test"
        icon={CheckCircle2}
        onPress={() => router.push('/voice-test')}
      />
    </Screen>
  );
}
