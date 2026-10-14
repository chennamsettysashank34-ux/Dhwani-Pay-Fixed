import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  Share,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Copy,
  Globe,
  Radio,
  Zap,
} from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import { Button, Card, Header, InfoBanner, Screen, StatusPill } from '@/components/ui';

export default function GatewaySettingsScreen() {
  const { colors, merchantProfile, updateMerchantProfile, gatewayConnected } = useApp();
  const [gatewayUrl, setGatewayUrl] = useState(merchantProfile.gatewayUrl);
  const [statusLoading, setStatusLoading] = useState(false);
  const [gatewayStatus, setGatewayStatus] = useState<any>(null);

  const httpBaseUrl = gatewayUrl
    .replace('ws://', 'http://')
    .replace('wss://', 'https://')
    .replace('/ws', '');

  const razorpayWebhookUrl = `${httpBaseUrl}/api/webhooks/razorpay`;
  const cashfreeWebhookUrl = `${httpBaseUrl}/api/webhooks/cashfree`;

  const fetchStatus = async () => {
    if (!httpBaseUrl) {
      setGatewayStatus(null);
      return;
    }
    setStatusLoading(true);
    try {
      const res = await fetch(`${httpBaseUrl}/api/gateway/credentials-status`);
      if (res.ok) {
        const data = await res.json();
        setGatewayStatus(data);
      } else {
        setGatewayStatus(null);
      }
    } catch {
      setGatewayStatus(null);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [gatewayUrl]);

  const handleCopy = async (text: string, label: string) => {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        Alert.alert('Copied to Clipboard', `${label} copied:\n${text}`);
        return;
      }
      await Share.share({ message: text, title: label });
    } catch {
      Alert.alert(label, text);
    }
  };

  const handleSaveUrl = () => {
    updateMerchantProfile({ gatewayUrl: gatewayUrl.trim() });
    Alert.alert('Updated', 'Gateway server URL updated successfully.');
    fetchStatus();
  };

  const handleTestSimulatedSettlement = async (provider: 'razorpay' | 'cashfree') => {
    try {
      const res = await fetch(`${httpBaseUrl}/api/gateway/simulate-webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 250,
          payerName: 'Vikram Malhotra',
          provider,
        }),
      });
      if (res.ok) {
        Alert.alert(
          'Settlement Broadcasted!',
          `Simulated ₹250 ${provider === 'cashfree' ? 'Cashfree' : 'Razorpay'} payment broadcasted. Your soundbox should announce it right now!`
        );
      } else {
        Alert.alert('Server Error', 'Failed to trigger settlement simulation.');
      }
    } catch {
      Alert.alert(
        'Connection Error',
        `Could not reach the gateway server at ${httpBaseUrl}. Make sure 'cd server && npm run dev' is running.`
      );
    }
  };

  return (
    <Screen>
      <Header
        title="Gateway Integration"
        subtitle="Razorpay & Cashfree Setup"
        back={
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <ArrowLeft size={22} color={colors.text} />
          </Pressable>
        }
      />

      <InfoBanner
        tone="warning"
        title="Payment Gateways Under Development"
        text="Razorpay and Cashfree webhook automation and direct bank settlements are currently under development. Offline standee announcements remain active."
      />

      <View style={{ gap: 6 }}>
        <Text style={{ color: colors.text, fontSize: 26, fontWeight: '900', letterSpacing: -0.6 }}>
          Payment Gateway (Process 2)
        </Text>
        <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21 }}>
          Connect Razorpay or Cashfree to accept cryptographically verified UPI payments with automated bank settlement.
        </Text>
      </View>

      {/* Connection Status Card */}
      <Card padding={15}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
            <Radio size={20} color={gatewayConnected ? colors.primary : colors.error} />
            <Text style={{ fontSize: 15, fontWeight: '900', color: colors.text }}>
              Soundbox WebSocket
            </Text>
          </View>
          <StatusPill
            label={gatewayConnected ? 'CONNECTED' : statusLoading ? 'CHECKING...' : 'DISCONNECTED'}
            tone={gatewayConnected ? 'success' : 'error'}
          />
        </View>
        <Text style={{ fontSize: 12, color: colors.muted, lineHeight: 18 }}>
          {gatewayConnected
            ? 'Phone is actively listening for live bank payment settlement webhooks.'
            : 'Phone is disconnected. Start the local server or check the server URL below.'}
        </Text>
      </Card>

      {/* Cloud Server URL Configuration */}
      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 12, fontWeight: '800', color: colors.muted, letterSpacing: 0.6 }}>
          GATEWAY SERVER URL
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
            paddingVertical: 10,
            gap: 10,
          }}
        >
          <Globe size={18} color={colors.primary} />
          <TextInput
            value={gatewayUrl}
            onChangeText={setGatewayUrl}
            placeholder="ws://localhost:8080/ws"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            style={{ flex: 1, fontSize: 14, fontWeight: '700', color: colors.text }}
          />
          <Pressable onPress={handleSaveUrl} hitSlop={8}>
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '800' }}>SAVE</Text>
          </Pressable>
        </View>
      </View>

      {/* Gateway Providers Status */}
      <View style={{ gap: 10 }}>
        <Text style={{ fontSize: 12, fontWeight: '800', color: colors.muted, letterSpacing: 0.6 }}>
          CONFIGURED GATEWAY APIS
        </Text>

        {/* Razorpay Card */}
        <Card padding={15}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: colors.text }}>Razorpay UPI</Text>
            <StatusPill
              label={gatewayStatus?.razorpay?.configured ? 'KEYS LOADED' : 'SANDBOX READY'}
              tone={gatewayStatus?.razorpay?.configured ? 'success' : 'neutral'}
            />
          </View>
          <Text style={{ fontSize: 12, color: colors.muted, lineHeight: 18 }}>
            Uses Razorpay QR Codes API (`/v1/payments/qr_codes`) and verifies `x-razorpay-signature`.
          </Text>

          <View style={{ backgroundColor: colors.surfaceSoft, borderRadius: 10, padding: 10, gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: colors.muted }}>
                WEBHOOK URL FOR RAZORPAY DASHBOARD
              </Text>
              <Pressable onPress={() => handleCopy(razorpayWebhookUrl, 'Razorpay Webhook URL')} hitSlop={8}>
                <Copy size={14} color={colors.primary} />
              </Pressable>
            </View>
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.text }} numberOfLines={1}>
              {razorpayWebhookUrl}
            </Text>
          </View>

          <Button
            title="Test Razorpay Voice Settlement"
            variant="secondary"
            compact
            icon={Zap}
            onPress={() => handleTestSimulatedSettlement('razorpay')}
          />
        </Card>

        {/* Cashfree Card */}
        <Card padding={15}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: colors.text }}>Cashfree AutoCollect</Text>
            <StatusPill
              label={gatewayStatus?.cashfree?.configured ? 'KEYS LOADED' : 'SANDBOX READY'}
              tone={gatewayStatus?.cashfree?.configured ? 'success' : 'neutral'}
            />
          </View>
          <Text style={{ fontSize: 12, color: colors.muted, lineHeight: 18 }}>
            Uses Cashfree PG Orders API (`/pg/orders`) and verifies `x-webhook-signature`.
          </Text>

          <View style={{ backgroundColor: colors.surfaceSoft, borderRadius: 10, padding: 10, gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: colors.muted }}>
                WEBHOOK URL FOR CASHFREE DASHBOARD
              </Text>
              <Pressable onPress={() => handleCopy(cashfreeWebhookUrl, 'Cashfree Webhook URL')} hitSlop={8}>
                <Copy size={14} color={colors.primary} />
              </Pressable>
            </View>
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.text }} numberOfLines={1}>
              {cashfreeWebhookUrl}
            </Text>
          </View>

          <Button
            title="Test Cashfree Voice Settlement"
            variant="secondary"
            compact
            icon={Zap}
            onPress={() => handleTestSimulatedSettlement('cashfree')}
          />
        </Card>
      </View>

      {/* 3-Step Setup Guide */}
      <View style={{ gap: 10 }}>
        <Text style={{ fontSize: 12, fontWeight: '800', color: colors.muted, letterSpacing: 0.6 }}>
          3-STEP DASHBOARD SETUP GUIDE
        </Text>
        <Card padding={14}>
          <View style={{ gap: 10 }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }}>
              1. Add API Keys in server/.env
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted, lineHeight: 18 }}>
              Open `dhwanipay/server/.env` and paste your `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET` or `CASHFREE_APP_ID` & `CASHFREE_SECRET_KEY`.
            </Text>

            <View style={{ height: 1, backgroundColor: colors.border }} />

            <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }}>
              2. Paste Webhook URL into Gateway Dashboard
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted, lineHeight: 18 }}>
              In Razorpay: Settings ➜ Webhooks ➜ Add New Webhook. Paste the URL above, set Secret, and check `payment.captured`.
            </Text>

            <View style={{ height: 1, backgroundColor: colors.border }} />

            <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }}>
              3. Collect Dynamic Gateway Payments
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted, lineHeight: 18 }}>
              On the Collect screen, switch to "Gateway Verified" mode. When customer pays, the soundbox announces it instantly.
            </Text>
          </View>
        </Card>
      </View>

      <Button
        title="Go to Collect Payment"
        onPress={() => router.push('/collect')}
      />
    </Screen>
  );
}
