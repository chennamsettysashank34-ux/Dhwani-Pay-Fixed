import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Globe,
  Radio,
  Save,
  ShieldCheck,
  Smartphone,
  Store,
} from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import { Button, Card, Header, InfoBanner, Screen } from '@/components/ui';

export default function MerchantProfileScreen() {
  const { colors, merchantProfile, updateMerchantProfile, gatewayConnected } = useApp();

  const [vpa, setVpa] = useState(merchantProfile.vpa);
  const [businessName, setBusinessName] = useState(merchantProfile.businessName);
  const [mcc, setMcc] = useState(merchantProfile.mcc);
  const [mode, setMode] = useState<'notification-listener' | 'cloud-webhook'>(
    merchantProfile.mode
  );
  const [gatewayUrl, setGatewayUrl] = useState(merchantProfile.gatewayUrl);

  const handleSave = () => {
    if (!vpa.trim() || !vpa.includes('@')) {
      Alert.alert('Invalid UPI ID', 'Please enter a valid UPI ID (e.g. yourname@okhdfcbank or 9876543210@paytm).');
      return;
    }

    if (!businessName.trim()) {
      Alert.alert('Shop Name Required', 'Please enter your business or shop name.');
      return;
    }

    updateMerchantProfile({
      vpa: vpa.trim(),
      businessName: businessName.trim(),
      mcc: mcc.trim() || '5411',
      mode,
      gatewayUrl: gatewayUrl.trim(),
    });

    Alert.alert(
      'Profile Saved',
      'Your merchant UPI details and soundbox configuration have been updated.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  return (
    <Screen>
      <Header
        title="Merchant Profile"
        subtitle="UPI ID and Soundbox Mode"
        back={
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <ArrowLeft size={22} color={colors.text} />
          </Pressable>
        }
      />

      <View style={{ gap: 7 }}>
        <Text style={{ color: colors.text, fontSize: 26, fontWeight: '900', letterSpacing: -0.6 }}>
          Payment & Standee Setup
        </Text>
        <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
          Configure your real UPI ID so customers can scan your QR code and pay directly to your bank account.
        </Text>
      </View>

      {/* Form Fields */}
      <View style={{ gap: 14 }}>
        {/* Business Name */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: colors.muted, letterSpacing: 0.6 }}>
            SHOP / BUSINESS NAME
          </Text>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.border,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 14,
              paddingVertical: 12,
              gap: 10,
            }}
          >
            <Store size={20} color={colors.primary} />
            <TextInput
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="e.g. My Kirana & General Store"
              placeholderTextColor={colors.muted}
              style={{ flex: 1, fontSize: 15, fontWeight: '700', color: colors.text }}
            />
          </View>
        </View>

        {/* UPI VPA */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: colors.muted, letterSpacing: 0.6 }}>
            REAL MERCHANT UPI ID (VPA)
          </Text>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.border,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 14,
              paddingVertical: 12,
              gap: 10,
            }}
          >
            <Smartphone size={20} color={colors.primary} />
            <TextInput
              value={vpa}
              onChangeText={setVpa}
              placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              keyboardType="email-address"
              style={{ flex: 1, fontSize: 15, fontWeight: '700', color: colors.text }}
            />
          </View>
          <Text style={{ fontSize: 11, color: colors.muted, paddingLeft: 4 }}>
            Customer payments from Google Pay, PhonePe, and Paytm will credit directly here.
          </Text>
        </View>

        {/* MCC Code */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: colors.muted, letterSpacing: 0.6 }}>
            MERCHANT CATEGORY CODE (MCC)
          </Text>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.border,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 14,
              paddingVertical: 12,
              gap: 10,
            }}
          >
            <Building2 size={20} color={colors.primary} />
            <TextInput
              value={mcc}
              onChangeText={setMcc}
              placeholder="5411 (Grocery / Retail)"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              style={{ flex: 1, fontSize: 15, fontWeight: '700', color: colors.text }}
            />
          </View>
        </View>

        {/* Operating Architecture Selection */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: colors.muted, letterSpacing: 0.6 }}>
            SOUNDBOX DETECTION METHOD
          </Text>

          {/* Mode Option 1: Native Notification Listener */}
          <Pressable
            onPress={() => setMode('notification-listener')}
            style={{
              padding: 16,
              borderRadius: 16,
              backgroundColor: mode === 'notification-listener' ? colors.primarySoft : colors.surface,
              borderWidth: 1.5,
              borderColor: mode === 'notification-listener' ? colors.primary : colors.border,
              gap: 6,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Smartphone size={18} color={mode === 'notification-listener' ? colors.primaryDark : colors.text} />
                <Text style={{ fontSize: 15, fontWeight: '900', color: colors.text }}>
                  Android Notification Listener (Recommended)
                </Text>
              </View>
              {mode === 'notification-listener' ? (
                <CheckCircle2 size={18} color={colors.primary} />
              ) : null}
            </View>
            <Text style={{ fontSize: 12, color: colors.muted, lineHeight: 18 }}>
              Intercepts incoming alerts from your installed PhonePe, Google Pay, Paytm, or BHIM apps on this phone and announces them immediately without needing any bank server integration.
            </Text>
          </Pressable>

          {/* Mode Option 2: Payment Gateway Webhook */}
          <Pressable
            onPress={() => setMode('cloud-webhook')}
            style={{
              padding: 16,
              borderRadius: 16,
              backgroundColor: mode === 'cloud-webhook' ? colors.primarySoft : colors.surface,
              borderWidth: 1.5,
              borderColor: mode === 'cloud-webhook' ? colors.primary : colors.border,
              gap: 6,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Globe size={18} color={mode === 'cloud-webhook' ? colors.primaryDark : colors.text} />
                <Text style={{ fontSize: 15, fontWeight: '900', color: colors.text }}>
                  Cloud Payment Gateway (Razorpay / Cashfree)
                </Text>
              </View>
              {mode === 'cloud-webhook' ? (
                <CheckCircle2 size={18} color={colors.primary} />
              ) : null}
            </View>
            <Text style={{ fontSize: 12, color: colors.muted, lineHeight: 18 }}>
              Uses a verified backend webhook microservice with HMAC signature validation. Pushes live settled payments to this phone via real-time WebSocket.
            </Text>
          </Pressable>
        </View>

        {/* Gateway WebSocket URL (if cloud mode) */}
        {mode === 'cloud-webhook' ? (
          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: colors.muted, letterSpacing: 0.6 }}>
                GATEWAY WEBSOCKET URL
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '800',
                  color: gatewayConnected ? colors.primary : colors.error,
                }}
              >
                {gatewayConnected ? '● CONNECTED' : '○ DISCONNECTED'}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.border,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 14,
                paddingVertical: 12,
                gap: 10,
              }}
            >
              <Radio size={20} color={colors.primary} />
              <TextInput
                value={gatewayUrl}
                onChangeText={setGatewayUrl}
                placeholder="ws://localhost:8080/ws"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                style={{ flex: 1, fontSize: 14, fontWeight: '700', color: colors.text }}
              />
            </View>
          </View>
        ) : null}

        <Button title="Save Merchant Settings" icon={Save} onPress={handleSave} />
      </View>
    </Screen>
  );
}
