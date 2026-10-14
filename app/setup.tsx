import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  ArrowLeft,
  BatteryCharging,
  BellRing,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Volume2,
} from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import { Button, Card, Header, InfoBanner, Screen } from '@/components/ui';
import { storage } from '@/utils/storage';

const steps = [
  {
    title: 'Choose notification sources',
    body: 'Select which merchant UPI apps to announce (GPay, PhonePe, Paytm).',
    icon: BellRing,
    route: '/sources',
  },
  {
    title: 'Verify notification access',
    body: 'Ensure DhwaniPay can read payment notifications.',
    icon: ShieldCheck,
    route: '/permission-guide',
  },
  {
    title: 'Test announcement voice',
    body: 'Test the device speaker and choose your regional Indian language.',
    icon: Volume2,
    route: '/voice-test',
  },
  {
    title: 'Check background battery readiness',
    body: 'Prevent Android from putting DhwaniPay to sleep during shop hours.',
    icon: BatteryCharging,
    route: '/health',
  },
] as const;

export default function SetupScreen() {
  const { colors } = useApp();
  const [completed, setCompleted] = useState<number[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const saved = await storage.getItem('dhwani_setup_completed');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setCompleted(parsed);
          }
        }
      } catch {
        // Ignore parse error
      }
    })();
  }, []);

  const completeCount = completed.length;
  const nextIndex = steps.findIndex((_, i) => !completed.includes(i));
  const next = steps[nextIndex < 0 ? 0 : nextIndex];

  return (
    <Screen>
      <Header
        title="Setup Checklist"
        subtitle="Get your phone soundbox ready"
        back={
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <ArrowLeft size={22} color={colors.text} />
          </Pressable>
        }
      />

      <View style={{ gap: 7 }}>
        <Text style={{ color: colors.text, fontSize: 28, lineHeight: 34, fontWeight: '900', letterSpacing: -0.8 }}>
          Merchant Readiness
        </Text>
        <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 22 }}>
          Complete these quick steps to ensure your phone acts as a reliable 24/7 payment soundbox.
        </Text>
      </View>

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800' }}>Setup Progress</Text>
          <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 14 }}>
            {completeCount} of {steps.length}
          </Text>
        </View>
        <View style={{ height: 8, backgroundColor: colors.surfaceSoft, borderRadius: 10, overflow: 'hidden' }}>
          <View
            style={{
              height: 8,
              width: `${(completeCount / steps.length) * 100}%`,
              backgroundColor: colors.primary,
              borderRadius: 10,
            }}
          />
        </View>
        <Text style={{ color: colors.muted, fontSize: 12 }}>
          Notification access & sound engine active
        </Text>
      </Card>

      <View style={{ gap: 10 }}>
        {steps.map((step, i) => {
          const Icon = step.icon;
          const done = completed.includes(i);
          return (
            <Pressable
              key={step.title}
              onPress={() => router.push(step.route as any)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                gap: 12,
                alignItems: 'center',
                padding: 14,
                backgroundColor: colors.surface,
                borderRadius: 18,
                borderColor: done ? colors.primary : colors.border,
                borderWidth: done ? 1.5 : 1,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: done ? colors.primarySoft : colors.surfaceSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={21} color={done ? colors.primary : colors.muted} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>
                  {step.title}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 17 }}>
                  {step.body}
                </Text>
                <Text
                  style={{
                    color: done ? colors.primary : colors.warning,
                    fontSize: 11,
                    fontWeight: '800',
                    marginTop: 2,
                  }}
                >
                  {done ? 'Configured' : i === nextIndex ? 'Next step' : 'Pending'}
                </Text>
              </View>
              {done ? (
                <CheckCircle2 color={colors.primary} size={21} />
              ) : (
                <ChevronRight color={colors.muted} size={19} />
              )}
            </Pressable>
          );
        })}
      </View>

      <Button
        title={completeCount === steps.length ? 'Return to Home' : `Continue: ${next.title}`}
        icon={ChevronRight}
        onPress={() =>
          completeCount === steps.length ? router.replace('/(tabs)') : router.push(next.route as any)
        }
      />
    </Screen>
  );
}
