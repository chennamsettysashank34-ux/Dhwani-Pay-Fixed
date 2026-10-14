import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Database, Eye, LockKeyhole, ShieldCheck, Trash2 } from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import { Button, Card, Header, InfoBanner, Screen } from '@/components/ui';

const topics = [
  {
    title: 'Why notification access is used',
    body: 'Notification access allows DhwaniPay to detect incoming payment confirmations from UPI merchant apps and announce the received amount aloud.',
  },
  {
    title: '100% On-Device Processing',
    body: 'All speech synthesis and ledger calculations are handled locally on your device. Your sales and expense data are not sold or uploaded to third-party ad networks.',
  },
  {
    title: 'Zero access to PINs or passwords',
    body: 'DhwaniPay never requests or has access to your UPI PIN, banking login, debit card numbers, or bank accounts.',
  },
  {
    title: 'Local data control',
    body: 'Your transactions and expense records remain under your control. You can remove any expense or reset default records anytime from Settings.',
  },
];

export default function PrivacyScreen() {
  const { colors } = useApp();

  return (
    <Screen>
      <Header
        title="Privacy & Consent"
        subtitle="Transparent merchant data protection"
        back={
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <ArrowLeft size={22} color={colors.text} />
          </Pressable>
        }
      />

      <View
        style={{
          width: 70,
          height: 70,
          borderRadius: 24,
          backgroundColor: colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ShieldCheck size={33} color={colors.primary} />
      </View>

      <View style={{ gap: 7 }}>
        <Text style={{ color: colors.text, fontSize: 28, fontWeight: '900', lineHeight: 34, letterSpacing: -0.8 }}>
          Your Trust Comes First
        </Text>
        <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 22 }}>
          DhwaniPay is engineered for security and merchant privacy. All audio announcements run completely on-device.
        </Text>
      </View>

      <InfoBanner
        title="Never Share Payment Secrets"
        text="DhwaniPay will never ask for a UPI PIN, banking password, OTP, or credit card CVV."
        tone="success"
        icon={LockKeyhole}
      />

      <View style={{ gap: 10 }}>
        {topics.map((topic, index) => {
          const icons = [Eye, Database, LockKeyhole, Trash2];
          const Icon = icons[index];
          return (
            <Card key={topic.title} padding={14}>
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    backgroundColor: colors.surfaceSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={19} color={colors.primary} />
                </View>
                <View style={{ flex: 1, gap: 5 }}>
                  <Text style={{ color: colors.text, fontSize: 14, fontWeight: '900' }}>
                    {topic.title}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 20 }}>
                    {topic.body}
                  </Text>
                </View>
              </View>
            </Card>
          );
        })}
      </View>

      <Button
        title="Check Permission Details"
        onPress={() => router.push('/permission-guide')}
      />
    </Screen>
  );
}
