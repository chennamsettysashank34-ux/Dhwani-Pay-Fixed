import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, BatteryCharging, BellOff, CircleAlert, RotateCcw, Settings2, VolumeX } from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import { Button, Header, Screen } from '@/components/ui';

const recoveryContent: Record<
  string,
  { title: string; what: string; meaning: string; action: string; route: string; icon: any }
> = {
  paused: {
    title: 'Announcements are paused.',
    what: 'The soundbox has been muted or paused by the user.',
    meaning: 'Incoming payments will still be recorded in Activity, but will not be spoken aloud until resumed.',
    action: 'Open Sound Settings',
    route: '/announcement-settings',
    icon: BellOff,
  },
  permission: {
    title: 'Notification access needs attention.',
    what: 'Android notification access may be turned off.',
    meaning: 'Without notification access, payment notifications cannot be detected from UPI apps.',
    action: 'Review Access Guide',
    route: '/permission-guide',
    icon: Settings2,
  },
  source: {
    title: 'Payment app source turned off.',
    what: 'The provider has been disabled in Sources.',
    meaning: 'Turn on PhonePe, GPay, or Paytm in Sources to enable voice announcements for that app.',
    action: 'Review Sources',
    route: '/sources',
    icon: CircleAlert,
  },
  audio: {
    title: "We couldn't play the announcement.",
    what: 'Device media volume might be zero or speech engine needs setup.',
    meaning: 'Check device media volume and ensure the preferred voice pack is downloaded.',
    action: 'Run Voice Test',
    route: '/voice-test',
    icon: VolumeX,
  },
  background: {
    title: 'Background battery optimization.',
    what: 'Android battery saver may terminate background services.',
    meaning: 'Set DhwaniPay battery usage to "Unrestricted" in Android app settings.',
    action: 'Review Health Status',
    route: '/health',
    icon: BatteryCharging,
  },
};

export default function RecoveryScreen() {
  const { colors } = useApp();
  const params = useLocalSearchParams<{ kind?: string }>();
  const kind = params.kind ?? 'permission';
  const state = recoveryContent[kind] ?? recoveryContent.permission;
  const Icon = state.icon;

  return (
    <Screen>
      <Header
        title="Troubleshooter"
        subtitle="Quick recovery guidance"
        back={
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <ArrowLeft size={22} color={colors.text} />
          </Pressable>
        }
      />

      <View style={{ alignItems: 'center', paddingTop: 18, gap: 13 }}>
        <View
          style={{
            width: 100,
            height: 100,
            borderRadius: 34,
            backgroundColor: colors.warningSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={42} color={colors.warning} />
        </View>
        <Text style={{ color: colors.text, textAlign: 'center', fontSize: 27, lineHeight: 33, fontWeight: '900', letterSpacing: -0.6 }}>
          {state.title}
        </Text>
      </View>

      <View style={{ gap: 12 }}>
        <View style={{ gap: 5 }}>
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: '900' }}>What happened?</Text>
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 22 }}>{state.what}</Text>
        </View>
        <View style={{ gap: 5 }}>
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: '900' }}>What does it mean?</Text>
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 22 }}>{state.meaning}</Text>
        </View>
      </View>

      <Button
        title={state.action}
        icon={RotateCcw}
        onPress={() => router.push(state.route as any)}
      />
      <Button
        title="Back to Home"
        variant="secondary"
        onPress={() => router.replace('/(tabs)')}
      />
    </Screen>
  );
}
