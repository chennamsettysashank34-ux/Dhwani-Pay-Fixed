import React from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, BellRing, Play, RotateCcw, Volume2 } from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import { Button, Card, Header, Screen, StatusPill } from '@/components/ui';

export default function DemoScreen() {
  const { colors, addPaymentEvent, resetDemo, events, speakPayment } = useApp();

  const handleTestPayment = (amount: number, source: string) => {
    addPaymentEvent(amount, source);
    Alert.alert('Payment Announced', `Simulated payment of ₹${amount} on ${source}.`);
  };

  return (
    <Screen>
      <Header
        title="Payment Tester"
        subtitle="Simulate and test incoming soundbox announcements"
        back={
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <ArrowLeft size={22} color={colors.text} />
          </Pressable>
        }
      />

      <View style={{ gap: 7 }}>
        <Text style={{ color: colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.8, lineHeight: 34 }}>
          Audio & Payment Testing
        </Text>
        <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 22 }}>
          Trigger test transactions to verify that speaker audio, regional languages, and volume levels work cleanly.
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <StatusPill label="SOUNDBOX READY" tone="success" />
        <StatusPill label={`${events.length} transactions logged`} tone="neutral" />
      </View>

      <View style={{ gap: 10 }}>
        <Text style={{ color: colors.text, fontSize: 17, fontWeight: '900' }}>Test Incoming UPI Payments</Text>

        <Card padding={13}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
              <BellRing color={colors.primary} size={21} />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14 }}>₹50 on Google Pay</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>Speak ₹50 payment notification</Text>
            </View>
          </View>
          <Button
            title="Announce ₹50 Payment"
            icon={Play}
            onPress={() => handleTestPayment(50, 'Google Pay for Business')}
          />
        </Card>

        <Card padding={13}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
              <BellRing color={colors.primary} size={21} />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14 }}>₹200 on PhonePe</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>Speak ₹200 payment notification</Text>
            </View>
          </View>
          <Button
            title="Announce ₹200 Payment"
            icon={Play}
            onPress={() => handleTestPayment(200, 'PhonePe Merchant')}
          />
        </Card>

        <Card padding={13}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
              <BellRing color={colors.primary} size={21} />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14 }}>₹1,500 on Paytm</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>Speak large amount notification</Text>
            </View>
          </View>
          <Button
            title="Announce ₹1,500 Payment"
            icon={Play}
            onPress={() => handleTestPayment(1500, 'Paytm for Business')}
          />
        </Card>
      </View>

      <View style={{ gap: 10 }}>
        <Text style={{ color: colors.text, fontSize: 17, fontWeight: '900' }}>Clear Test History</Text>
        <Button
          title="Clear Test Records"
          icon={RotateCcw}
          onPress={() => {
            resetDemo();
            Alert.alert('Cleared', 'All test transactions have been cleared.');
          }}
          variant="secondary"
        />
        <Button
          title="Return to Home"
          onPress={() => router.replace('/(tabs)')}
        />
      </View>
    </Screen>
  );
}
