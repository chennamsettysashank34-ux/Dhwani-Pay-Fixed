import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { router } from 'expo-router';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  FolderLock,
  Globe,
  IndianRupee,
  QrCode,
  Radio,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Smartphone,
  Volume2,
  Zap,
} from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import { Button, Card, Header, InfoBanner, Screen, StatusPill } from '@/components/ui';
import { UPIQRCode } from '@/components/UPIQRCode';
import { buildUpiUri, formatInr, launchUpiIntent } from '@/utils/upi';
import { APP_PRESETS } from '@/constants/vaultPresets';

const QUICK_AMOUNTS = [20, 50, 100, 200, 500];

type CollectMode = 'vault' | 'standee' | 'gateway';

export default function CollectPaymentScreen() {
  const {
    colors,
    merchantProfile,
    recordRealPayment,
    speakPayment,
    announcementsEnabled,
    gatewayConnected,
    events,
    vaultQRs,
    activeVaultQR,
    setActiveVaultQR,
  } = useApp();

  const [collectMode, setCollectMode] = useState<CollectMode>(
    vaultQRs.length > 0 && activeVaultQR ? 'vault' : 'standee'
  );
  const [gatewayProvider, setGatewayProvider] = useState<'razorpay' | 'cashfree'>('razorpay');
  const [amountStr, setAmountStr] = useState<string>('');
  const [note, setNote] = useState<string>('');

  // Dynamic Gateway QR state
  const [gatewayQrData, setGatewayQrData] = useState<any>(null);
  const [isGeneratingGatewayQr, setIsGeneratingGatewayQr] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<any>(null);

  const numericAmount = parseFloat(amountStr) || undefined;

  // Derive HTTP server URL from merchant WebSocket URL
  const httpBaseUrl = merchantProfile.gatewayUrl
    .replace('ws://', 'http://')
    .replace('wss://', 'https://')
    .replace('/ws', '');

  // 1. Direct Merchant Standee UPI URI (NPCI standard)
  const standeeUpiUri = useMemo(() => {
    const targetVpa = (collectMode === 'vault' && activeVaultQR?.vpa) ? activeVaultQR.vpa : merchantProfile.vpa;
    try {
      return buildUpiUri({
        vpa: targetVpa,
        payeeName: merchantProfile.businessName,
        amount: numericAmount,
        note: note || undefined,
        mcc: merchantProfile.mcc,
      });
    } catch {
      return `upi://pay?pa=${encodeURIComponent(targetVpa)}&pn=${encodeURIComponent(
        merchantProfile.businessName
      )}&cu=INR`;
    }
  }, [merchantProfile, numericAmount, note, collectMode, activeVaultQR]);

  // Request a Dynamic Gateway QR from the backend server
  const handleGenerateGatewayQr = async () => {
    if (!numericAmount || numericAmount <= 0) {
      Alert.alert('Amount Required', 'Please enter a valid bill amount to generate a gateway QR.');
      return;
    }

    setIsGeneratingGatewayQr(true);
    setPaymentSuccessData(null);

    try {
      const res = await fetch(`${httpBaseUrl}/api/gateway/create-qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numericAmount,
          customerName: 'Store Customer',
          notes: note,
          provider: gatewayProvider,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const json = await res.json();
      if (json.success && json.data) {
        setGatewayQrData(json.data);
      } else {
        throw new Error(json.error || 'Failed to generate QR');
      }
    } catch (err: any) {
      console.warn('Failed to contact gateway server:', err);
      // Local fallback simulation if server is offline
      const mockId = `qr_${Date.now().toString(36)}`;
      setGatewayQrData({
        provider: gatewayProvider,
        qrId: mockId,
        qrPayload: `upi://pay?pa=${gatewayProvider}.demo@bank&pn=DhwaniPay%20Merchant&am=${numericAmount.toFixed(2)}&cu=INR&tr=${mockId}`,
        amount: numericAmount,
        isMock: true,
      });
    } finally {
      setIsGeneratingGatewayQr(false);
    }
  };

  // Watch for incoming payment events matching the gateway QR session
  useEffect(() => {
    if (collectMode === 'gateway' && gatewayQrData && events.length > 0) {
      const latest = events[0];
      if (latest && !latest.simulated && latest.amount === gatewayQrData.amount) {
        setPaymentSuccessData({
          amount: latest.amount,
          payer: latest.payerName || 'Verified Customer',
          source: latest.source,
          time: latest.time,
        });
      }
    }
  }, [events, collectMode, gatewayQrData]);

  // Active QR string depending on mode
  const activeQrUri =
    collectMode === 'gateway' && gatewayQrData
      ? gatewayQrData.qrPayload
      : standeeUpiUri;

  const handleLaunchUpiApp = async () => {
    const success = await launchUpiIntent(activeQrUri);
    if (!success) {
      Alert.alert(
        'UPI App Not Found',
        'Could not find a supported UPI app on this device. Customers can scan the QR code above with Google Pay, PhonePe, Paytm, or BHIM.'
      );
    }
  };

  const handleTestAnnouncement = () => {
    const amt = numericAmount || 150;
    speakPayment(amt, collectMode === 'gateway' ? `${gatewayProvider === 'cashfree' ? 'Cashfree' : 'Razorpay'} UPI` : 'UPI');
  };

  const handleSimulatePaymentReceived = () => {
    const amt = numericAmount || 150;
    const providerName = gatewayProvider === 'cashfree' ? 'Cashfree UPI' : 'Razorpay UPI';
    recordRealPayment(amt, 'Sunita Verma', collectMode === 'gateway' ? providerName : 'PhonePe Merchant', `UTR${Date.now().toString().slice(-8)}`);
    setPaymentSuccessData({
      amount: amt,
      payer: 'Sunita Verma',
      source: collectMode === 'gateway' ? providerName : 'PhonePe Merchant',
      time: 'Just now',
    });
  };

  return (
    <Screen>
      <Header
        title="Collect Payment"
        subtitle={collectMode === 'gateway' ? 'Bank-Settled Gateway QR' : 'Standee UPI QR'}
        back={
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <ArrowLeft size={22} color={colors.text} />
          </Pressable>
        }
        right={
          <Pressable
            onPress={() => router.push(collectMode === 'gateway' ? '/gateway-settings' : '/merchant-profile')}
            accessibilityRole="button"
            accessibilityLabel="Configure settings"
            style={{
              padding: 8,
              borderRadius: 12,
              backgroundColor: colors.surfaceSoft,
            }}
          >
            <Settings2 size={20} color={colors.text} />
          </Pressable>
        }
      />

      {/* Under Development Banner */}
      <InfoBanner
        tone="warning"
        title="Dynamic QR Under Development"
        text="Generating on-the-fly UPI QR codes with customized bill amounts is currently under development. To collect payments in the meantime, select your saved Standees from the QR Vault."
      />

      {/* Mode Selector: Vault App Standee vs Standee UPI vs Gateway Verified */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: colors.surfaceSoft,
          borderRadius: 16,
          padding: 4,
          gap: 4,
        }}
      >
        <Pressable
          onPress={() => setCollectMode('vault')}
          style={{
            flex: 1,
            paddingVertical: 10,
            alignItems: 'center',
            borderRadius: 12,
            backgroundColor: collectMode === 'vault' ? colors.surface : 'transparent',
            shadowColor: collectMode === 'vault' ? '#000' : 'transparent',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.08,
            shadowRadius: 2,
            elevation: collectMode === 'vault' ? 1 : 0,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '800',
              color: collectMode === 'vault' ? colors.primary : colors.muted,
            }}
          >
            Vault Standee
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setCollectMode('standee')}
          style={{
            flex: 1,
            paddingVertical: 10,
            alignItems: 'center',
            borderRadius: 12,
            backgroundColor: collectMode === 'standee' ? colors.surface : 'transparent',
            shadowColor: collectMode === 'standee' ? '#000' : 'transparent',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.08,
            shadowRadius: 2,
            elevation: collectMode === 'standee' ? 1 : 0,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '800',
              color: collectMode === 'standee' ? colors.primary : colors.muted,
            }}
          >
            Vector UPI
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            setCollectMode('gateway');
            if (!gatewayQrData) {
              handleGenerateGatewayQr();
            }
          }}
          style={{
            flex: 1,
            paddingVertical: 10,
            alignItems: 'center',
            borderRadius: 12,
            backgroundColor: collectMode === 'gateway' ? colors.surface : 'transparent',
            shadowColor: collectMode === 'gateway' ? '#000' : 'transparent',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.08,
            shadowRadius: 2,
            elevation: collectMode === 'gateway' ? 1 : 0,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '800',
              color: collectMode === 'gateway' ? colors.primary : colors.muted,
            }}
          >
            Gateway QR
          </Text>
        </Pressable>
      </View>

      {/* Vault Standee Sub-selector (if Vault Mode) */}
      {collectMode === 'vault' ? (
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: colors.muted, letterSpacing: 0.5 }}>
              SAVED STANDEE:
            </Text>
            <Pressable onPress={() => router.push('/qr-vault')} hitSlop={8}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary }}>
                + Add Standee ({vaultQRs.length}) ➔
              </Text>
            </Pressable>
          </View>
          {vaultQRs.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {vaultQRs.map((q) => {
                const isSelected = activeVaultQR?.id === q.id;
                const preset = APP_PRESETS[q.appName] || APP_PRESETS.Other;
                return (
                  <Pressable
                    key={q.id}
                    onPress={() => setActiveVaultQR(q.id)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 7,
                      borderRadius: 12,
                      backgroundColor: isSelected ? preset.brandColor : colors.surface,
                      borderWidth: 1,
                      borderColor: isSelected ? preset.brandColor : colors.border,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '800',
                        color: isSelected ? '#FFFFFF' : colors.text,
                      }}
                    >
                      {q.appName} ({q.title.split(' ')[0]})
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : (
            <Pressable
              onPress={() => router.push('/qr-vault')}
              style={{
                padding: 12,
                borderRadius: 12,
                backgroundColor: colors.surfaceSoft,
                borderWidth: 1,
                borderColor: colors.border,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text style={{ fontSize: 12, color: colors.muted, fontWeight: '600' }}>
                No standees saved yet. Tap to upload PhonePe/GPay QR.
              </Text>
              <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '800' }}>Upload ➔</Text>
            </Pressable>
          )}
        </View>
      ) : null}

      {/* Gateway Provider Sub-selector (if Gateway Mode) */}
      {collectMode === 'gateway' ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 12,
            borderRadius: 14,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Globe size={18} color={colors.primary} />
            <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }}>
              Select Gateway:
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Pressable
              onPress={() => setGatewayProvider('razorpay')}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: gatewayProvider === 'razorpay' ? colors.primary : colors.surfaceSoft,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '800',
                  color: gatewayProvider === 'razorpay' ? '#FFFFFF' : colors.text,
                }}
              >
                Razorpay
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setGatewayProvider('cashfree')}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: gatewayProvider === 'cashfree' ? colors.primary : colors.surfaceSoft,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '800',
                  color: gatewayProvider === 'cashfree' ? '#FFFFFF' : colors.text,
                }}
              >
                Cashfree
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* Amount Input */}
      <View style={{ gap: 8 }}>
        <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '800', letterSpacing: 0.8 }}>
          BILL AMOUNT
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderRadius: 18,
            borderWidth: 1.5,
            borderColor: amountStr ? colors.primary : colors.border,
            paddingHorizontal: 16,
            paddingVertical: 12,
            gap: 10,
          }}
        >
          <IndianRupee size={24} color={amountStr ? colors.primary : colors.muted} />
          <TextInput
            placeholder="0.00"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
            value={amountStr}
            onChangeText={(txt) => {
              setAmountStr(txt);
              setPaymentSuccessData(null);
            }}
            style={{
              flex: 1,
              fontSize: 22,
              fontWeight: '900',
              color: colors.text,
            }}
          />
          {amountStr ? (
            <Pressable onPress={() => setAmountStr('')} hitSlop={10}>
              <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700' }}>CLEAR</Text>
            </Pressable>
          ) : null}
        </View>

        {/* Quick Amount Chips */}
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {QUICK_AMOUNTS.map((amt) => {
            const isSelected = amountStr === String(amt);
            return (
              <Pressable
                key={amt}
                onPress={() => {
                  setAmountStr(String(amt));
                  setPaymentSuccessData(null);
                }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 12,
                  backgroundColor: isSelected ? colors.primary : colors.surface,
                  borderWidth: 1,
                  borderColor: isSelected ? colors.primary : colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '800',
                    color: isSelected ? '#FFFFFF' : colors.text,
                  }}
                >
                  ₹{amt}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Payment Success Card (If verified payment arrived) */}
      {paymentSuccessData ? (
        <Card padding={20} style={{ backgroundColor: colors.primarySoft, borderColor: colors.primary }}>
          <View style={{ alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle2 size={36} color="#FFFFFF" strokeWidth={2.5} />
            </View>
            <Text style={{ fontSize: 22, fontWeight: '900', color: colors.primaryDark }}>
              Payment Confirmed!
            </Text>
            <Text style={{ fontSize: 28, fontWeight: '900', color: colors.primaryDark }}>
              ₹{paymentSuccessData.amount}
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
              Received from {paymentSuccessData.payer} on {paymentSuccessData.source}
            </Text>
            <Button
              title="Next Bill / New Payment"
              variant="primary"
              compact
              onPress={() => {
                setPaymentSuccessData(null);
                setAmountStr('');
                setGatewayQrData(null);
              }}
            />
          </View>
        </Card>
      ) : (
        /* Active Scannable QR Card */
        <View style={{ alignItems: 'center', paddingVertical: 4 }}>
          {isGeneratingGatewayQr ? (
            <View
              style={{
                width: 260,
                height: 320,
                borderRadius: 24,
                backgroundColor: colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
              }}
            >
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ fontSize: 13, fontWeight: '800', color: colors.muted }}>
                Creating Secure {gatewayProvider === 'cashfree' ? 'Cashfree' : 'Razorpay'} QR...
              </Text>
            </View>
          ) : collectMode === 'vault' && activeVaultQR ? (
            /* Uploaded Original Standee from Vault */
            <View
              style={{
                width: 280,
                borderRadius: 24,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: colors.border,
                padding: 16,
                alignItems: 'center',
                gap: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
                elevation: 3,
              }}
            >
              <View style={{ alignItems: 'center', gap: 3 }}>
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 8,
                    backgroundColor: APP_PRESETS[activeVaultQR.appName]?.bgLight || '#F1F5F9',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '900',
                      color: APP_PRESETS[activeVaultQR.appName]?.textColor || '#334155',
                    }}
                  >
                    {activeVaultQR.appName.toUpperCase()} ORIGINAL STANDEE
                  </Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#0F172A' }} numberOfLines={1}>
                  {merchantProfile.businessName}
                </Text>
                {activeVaultQR.vpa ? (
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748B' }}>
                    UPI ID: {activeVaultQR.vpa}
                  </Text>
                ) : null}
              </View>

              <View
                style={{
                  width: 230,
                  height: 230,
                  borderRadius: 16,
                  overflow: 'hidden',
                  backgroundColor: '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {activeVaultQR.imageUri.startsWith('data:image/svg+xml') ? (
                  <SvgXml
                    xml={decodeURIComponent(
                      activeVaultQR.imageUri.replace(/^data:image\/svg\+xml;(?:utf8|utf-8),/i, '')
                    )}
                    width={220}
                    height={220}
                  />
                ) : (
                  <Image
                    source={{ uri: activeVaultQR.imageUri }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="contain"
                  />
                )}
              </View>

              {numericAmount && numericAmount > 0 ? (
                <View
                  style={{
                    backgroundColor: '#DDF7EA',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 6,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#07533F' }}>BILL AMOUNT</Text>
                  <Text style={{ fontSize: 20, fontWeight: '900', color: '#07533F' }}>₹{numericAmount}</Text>
                </View>
              ) : (
                <View
                  style={{
                    backgroundColor: '#F1F5F9',
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569' }}>
                    Scan with any UPI app
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <UPIQRCode
              upiUri={activeQrUri}
              size={230}
              payeeName={
                collectMode === 'gateway'
                  ? `${merchantProfile.businessName} (${gatewayProvider === 'cashfree' ? 'Cashfree' : 'Razorpay'})`
                  : merchantProfile.businessName
              }
              vpa={
                collectMode === 'gateway'
                  ? `${gatewayProvider}.pos@bank`
                  : merchantProfile.vpa
              }
              amount={numericAmount}
            />
          )}
        </View>
      )}

      {/* Live Soundbox Status Indicator */}
      <Card padding={14}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: announcementsEnabled ? colors.primarySoft : colors.surfaceSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Volume2
              size={18}
              color={announcementsEnabled ? colors.primary : colors.muted}
            />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }}>
              {collectMode === 'gateway'
                ? `Gateway Listener: ${gatewayConnected ? 'Live & Connected' : 'Local Sandbox'}`
                : `Standee Soundbox: ${announcementsEnabled ? 'Active' : 'Muted'}`}
            </Text>
            <Text style={{ fontSize: 11, color: colors.muted }}>
              {collectMode === 'gateway'
                ? 'Webhook will verify bank settlement and trigger instant announcement.'
                : 'Phone will detect PhonePe, Google Pay, or Paytm notification.'}
            </Text>
          </View>
        </View>
      </Card>

      {/* Action Buttons */}
      <View style={{ gap: 10 }}>
        {collectMode === 'gateway' ? (
          <Button
            title="Refresh / Re-generate Gateway QR"
            icon={RefreshCw}
            variant="secondary"
            onPress={handleGenerateGatewayQr}
          />
        ) : null}

        <Button
          title="Open in UPI App on this Phone"
          icon={ExternalLink}
          variant="secondary"
          onPress={handleLaunchUpiApp}
        />

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button
            title="Test Voice"
            icon={Volume2}
            variant="secondary"
            style={{ flex: 1 }}
            compact
            onPress={handleTestAnnouncement}
          />
          <Button
            title="Simulate Settlement"
            icon={CheckCircle2}
            variant="primary"
            style={{ flex: 1 }}
            compact
            onPress={handleSimulatePaymentReceived}
          />
        </View>
      </View>
    </Screen>
  );
}
