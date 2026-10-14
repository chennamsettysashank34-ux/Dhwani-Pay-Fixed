import React, { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
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
  Check,
  CheckCircle2,
  ExternalLink,
  Eye,
  FolderLock,
  Image as ImageIcon,
  Plus,
  QrCode,
  Sparkles,
  Store,
  Trash2,
  Upload,
} from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import { Button, Card, Header, Screen, StatusPill } from '@/components/ui';
import { confirmAction } from '@/utils/confirm';
import {
  APP_PRESETS,
  QRVaultApp,
  VaultQRCode,
} from '@/constants/vaultPresets';

const ALL_APPS: QRVaultApp[] = [
  'PhonePe',
  'Google Pay',
  'Paytm',
  'BharatPe',
  'BHIM UPI',
  'Amazon Pay',
  'CRED',
  'Bank QR',
  'Other',
];

function VaultQRImage({ uri, size = '100%' }: { uri: string; size?: number | string }) {
  if (uri.startsWith('data:image/svg+xml')) {
    const rawXml = decodeURIComponent(uri.replace(/^data:image\/svg\+xml;(?:utf8|utf-8),/i, ''));
    return <SvgXml xml={rawXml} width={size as any} height={size as any} />;
  }
  return (
    <Image
      source={{ uri }}
      style={{ width: size as any, height: size as any }}
      resizeMode="contain"
    />
  );
}

export default function QRVaultScreen() {
  const {
    colors,
    merchantProfile,
    vaultQRs,
    activeVaultQR,
    addVaultQR,
    removeVaultQR,
    setActiveVaultQR,
  } = useApp();

  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [fullscreenQR, setFullscreenQR] = useState<VaultQRCode | null>(null);

  // Upload Form State
  const [formApp, setFormApp] = useState<QRVaultApp>('PhonePe');
  const [formTitle, setFormTitle] = useState(APP_PRESETS.PhonePe.defaultTitle);
  const [formVpa, setFormVpa] = useState(merchantProfile.vpa || APP_PRESETS.PhonePe.sampleVpa);
  const [formImageUri, setFormImageUri] = useState<string>('');
  const [formIsPrimary, setFormIsPrimary] = useState(false);

  const handleSelectApp = (app: QRVaultApp) => {
    setFormApp(app);
    const preset = APP_PRESETS[app];
    if (preset) {
      setFormTitle(preset.defaultTitle);
      if (!formVpa) {
        setFormVpa(preset.sampleVpa);
      }
    }
  };

  const handlePickFile = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            const base64 = evt.target?.result as string;
            setFormImageUri(base64);

            const fname = (file.name || '').toLowerCase();
            if (fname.includes('phonepe')) handleSelectApp('PhonePe');
            else if (fname.includes('gpay') || fname.includes('google')) handleSelectApp('Google Pay');
            else if (fname.includes('paytm')) handleSelectApp('Paytm');
            else if (fname.includes('bharatpe')) handleSelectApp('BharatPe');
            else if (fname.includes('bhim')) handleSelectApp('BHIM UPI');
            else if (fname.includes('amazon')) handleSelectApp('Amazon Pay');
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      try {
        const ImagePicker = require('expo-image-picker');
        if (ImagePicker && ImagePicker.launchImageLibraryAsync) {
          ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: false,
            quality: 0.85,
            base64: true,
          })
            .then((result: any) => {
              if (!result.canceled && result.assets?.[0]) {
                const asset = result.assets[0];
                const uri = asset.base64
                  ? `data:image/jpeg;base64,${asset.base64}`
                  : asset.uri;
                setFormImageUri(uri);
              }
            })
            .catch((err: any) => {
              console.warn('Image picker error', err);
              handleUseSampleTemplate();
            });
          return;
        }
      } catch {
        // Fallback to preset template
      }
      handleUseSampleTemplate();
    }
  };

  const handleUseSampleTemplate = () => {
    const preset = APP_PRESETS[formApp];
    const color = preset.brandColor;
    const name = preset.appName;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 280">
      <rect width="280" height="280" rx="20" fill="${color}"/>
      <rect x="20" y="20" width="240" height="240" rx="14" fill="#FFFFFF"/>
      <rect x="36" y="36" width="60" height="60" rx="8" fill="${color}"/>
      <rect x="46" y="46" width="40" height="40" rx="4" fill="#FFFFFF"/>
      <rect x="54" y="54" width="24" height="24" rx="2" fill="${color}"/>
      <rect x="184" y="36" width="60" height="60" rx="8" fill="${color}"/>
      <rect x="194" y="46" width="40" height="40" rx="4" fill="#FFFFFF"/>
      <rect x="202" y="54" width="24" height="24" rx="2" fill="${color}"/>
      <rect x="36" y="184" width="60" height="60" rx="8" fill="${color}"/>
      <rect x="46" y="194" width="40" height="40" rx="4" fill="#FFFFFF"/>
      <rect x="54" y="202" width="24" height="24" rx="2" fill="${color}"/>
      <rect x="110" y="40" width="24" height="52" fill="${color}"/>
      <rect x="144" y="40" width="28" height="26" fill="${color}"/>
      <rect x="144" y="76" width="28" height="16" fill="${color}"/>
      <rect x="40" y="110" width="52" height="20" fill="${color}"/>
      <rect x="40" y="140" width="30" height="32" fill="${color}"/>
      <rect x="184" y="110" width="60" height="20" fill="${color}"/>
      <rect x="200" y="140" width="44" height="32" fill="${color}"/>
      <rect x="110" y="184" width="52" height="20" fill="${color}"/>
      <rect x="110" y="214" width="28" height="30" fill="${color}"/>
      <rect x="148" y="214" width="14" height="30" fill="${color}"/>
      <rect x="184" y="184" width="60" height="60" rx="6" fill="${color}"/>
      <rect x="114" y="114" width="52" height="52" rx="10" fill="${color}"/>
      <text x="140" y="146" fill="#FFFFFF" font-family="sans-serif" font-size="16" font-weight="900" text-anchor="middle">${name.slice(0, 4)}</text>
    </svg>`;
    setFormImageUri(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`);
  };

  const handleSaveQR = () => {
    if (!formImageUri.trim()) {
      Alert.alert('QR Image Required', 'Please choose an image file or tap "Use Preset Standee" before saving.');
      return;
    }

    addVaultQR({
      appName: formApp,
      title: formTitle.trim() || APP_PRESETS[formApp].defaultTitle,
      imageUri: formImageUri.trim(),
      vpa: formVpa.trim() || undefined,
      isPrimary: formIsPrimary,
    });

    setIsUploadModalOpen(false);
    setFormImageUri('');
    Alert.alert('Standee Saved', `Your original ${formApp} QR code has been saved to the vault.`);
  };

  const handleDelete = (qr: VaultQRCode) => {
    confirmAction(
      'Remove Standee',
      `Are you sure you want to remove "${qr.title}" from your vault?`,
      () => removeVaultQR(qr.id),
      { confirmText: 'Remove', isDestructive: true }
    );
  };

  const filteredQRs =
    selectedFilter === 'All'
      ? vaultQRs
      : vaultQRs.filter((q) => q.appName === selectedFilter);

  return (
    <Screen>
      <Header
        title="QR Code Vault"
        subtitle="Original Downloaded Standees"
        back={
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <ArrowLeft size={22} color={colors.text} />
          </Pressable>
        }
        right={
          <Pressable
            onPress={() => setIsUploadModalOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Upload New QR"
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 12,
              backgroundColor: colors.primary,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '800' }}>Add QR</Text>
          </Pressable>
        }
      />

      {/* Vault Info Hero Banner */}
      <Card
        padding={16}
        style={{
          backgroundColor: '#0F172A',
          borderColor: '#1E293B',
          gap: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,0.12)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FolderLock size={20} color="#38BDF8" strokeWidth={2.2} />
            </View>
            <View>
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '900' }}>
                Multi-App Standee Vault
              </Text>
              <Text style={{ color: '#94A3B8', fontSize: 12 }}>
                {vaultQRs.length} standees saved · Ready for counter display
              </Text>
            </View>
          </View>
          <StatusPill label="OFFLINE SAFE" tone="dark" small />
        </View>

        {activeVaultQR ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(255,255,255,0.06)',
              borderRadius: 14,
              padding: 10,
              gap: 12,
            }}
          >
            <View
              style={{
                width: 50,
                height: 50,
                borderRadius: 10,
                backgroundColor: '#FFFFFF',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <VaultQRImage uri={activeVaultQR.imageUri} size={44} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ color: '#38BDF8', fontSize: 11, fontWeight: '800' }}>
                  ACTIVE STANDEE
                </Text>
                <Text style={{ color: '#E2E8F0', fontSize: 13, fontWeight: '800' }}>
                  {activeVaultQR.appName}
                </Text>
              </View>
              <Text style={{ color: '#94A3B8', fontSize: 11 }} numberOfLines={1}>
                {activeVaultQR.title} · {activeVaultQR.vpa || 'Ready'}
              </Text>
            </View>
            <Pressable
              onPress={() => setFullscreenQR(activeVaultQR)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 10,
                backgroundColor: '#38BDF8',
              }}
            >
              <Text style={{ color: '#0F172A', fontSize: 12, fontWeight: '900' }}>PRESENT</Text>
            </Pressable>
          </View>
        ) : null}
      </Card>

      {/* App Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
      >
        <Pressable
          onPress={() => setSelectedFilter('All')}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 12,
            backgroundColor: selectedFilter === 'All' ? colors.primary : colors.surface,
            borderWidth: 1,
            borderColor: selectedFilter === 'All' ? colors.primary : colors.border,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '800',
              color: selectedFilter === 'All' ? '#FFFFFF' : colors.text,
            }}
          >
            All ({vaultQRs.length})
          </Text>
        </Pressable>

        {ALL_APPS.map((app) => {
          const count = vaultQRs.filter((q) => q.appName === app).length;
          const isSelected = selectedFilter === app;
          const preset = APP_PRESETS[app];
          return (
            <Pressable
              key={app}
              onPress={() => setSelectedFilter(app)}
              style={{
                paddingHorizontal: 13,
                paddingVertical: 8,
                borderRadius: 12,
                backgroundColor: isSelected ? preset.brandColor : colors.surface,
                borderWidth: 1,
                borderColor: isSelected ? preset.brandColor : colors.border,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '800',
                  color: isSelected ? '#FFFFFF' : colors.text,
                }}
              >
                {app} {count > 0 ? `(${count})` : ''}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Saved Standee Cards */}
      <View style={{ gap: 14 }}>
        {filteredQRs.length === 0 ? (
          <Card padding={24} style={{ alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: colors.surfaceSoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <QrCode size={28} color={colors.muted} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>
              No QR Codes Saved for {selectedFilter}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: colors.muted,
                textAlign: 'center',
                lineHeight: 18,
                maxWidth: 280,
              }}
            >
              Download your original QR from {selectedFilter === 'All' ? 'PhonePe or Paytm' : selectedFilter} and tap upload to store it here.
            </Text>
            <Button
              title="Upload QR Code"
              icon={Upload}
              variant="primary"
              compact
              onPress={() => {
                if (selectedFilter !== 'All') {
                  handleSelectApp(selectedFilter as QRVaultApp);
                }
                setIsUploadModalOpen(true);
              }}
            />
          </Card>
        ) : (
          filteredQRs.map((qr) => {
            const preset = APP_PRESETS[qr.appName] || APP_PRESETS.Other;
            const isCurrentActive = qr.isPrimary || activeVaultQR?.id === qr.id;

            return (
              <Card
                key={qr.id}
                padding={16}
                style={{
                  borderWidth: isCurrentActive ? 2 : 1,
                  borderColor: isCurrentActive ? preset.brandColor : colors.border,
                  gap: 12,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                    <View
                      style={{
                        paddingHorizontal: 9,
                        paddingVertical: 5,
                        borderRadius: 8,
                        backgroundColor: preset.bgLight,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '900',
                          color: preset.textColor,
                        }}
                      >
                        {qr.appName}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '800',
                        color: colors.text,
                      }}
                      numberOfLines={1}
                    >
                      {qr.title}
                    </Text>
                  </View>

                  {isCurrentActive ? (
                    <StatusPill label="ACTIVE" tone="success" small />
                  ) : null}
                </View>

                <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
                  <Pressable
                    onPress={() => setFullscreenQR(qr)}
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: 14,
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: colors.border,
                      padding: 6,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <VaultQRImage uri={qr.imageUri} size={88} />
                    <View
                      style={{
                        position: 'absolute',
                        right: 4,
                        bottom: 4,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        borderRadius: 6,
                        padding: 3,
                      }}
                    >
                      <Eye size={12} color="#FFFFFF" />
                    </View>
                  </Pressable>

                  <View style={{ flex: 1, gap: 5 }}>
                    {qr.vpa ? (
                      <View style={{ gap: 2 }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: colors.muted }}>
                          UPI ID (VPA)
                        </Text>
                        <Text
                          style={{ fontSize: 13, fontWeight: '700', color: colors.text }}
                          numberOfLines={1}
                        >
                          {qr.vpa}
                        </Text>
                      </View>
                    ) : null}

                    <Text style={{ fontSize: 11, color: colors.muted }}>
                      Added: {qr.createdAt}
                    </Text>

                    <Text style={{ fontSize: 11, color: preset.brandColor, fontWeight: '700' }}>
                      {preset.tagline}
                    </Text>
                  </View>
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    gap: 8,
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: colors.border,
                    paddingTop: 10,
                  }}
                >
                  <Button
                    title="Present to Customer"
                    icon={Eye}
                    variant="primary"
                    compact
                    style={{ flex: 1 }}
                    onPress={() => setFullscreenQR(qr)}
                  />

                  {!isCurrentActive ? (
                    <Button
                      title="Set Active"
                      icon={Check}
                      variant="secondary"
                      compact
                      onPress={() => setActiveVaultQR(qr.id)}
                    />
                  ) : null}

                  <Pressable
                    onPress={() => handleDelete(qr)}
                    accessibilityLabel="Delete QR"
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      backgroundColor: colors.surfaceSoft,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Trash2 size={16} color={colors.error} />
                  </Pressable>
                </View>
              </Card>
            );
          })
        )}
      </View>

      <Pressable
        onPress={() => router.push('/collect')}
        style={({ pressed }) => ({
          padding: 14,
          borderRadius: 16,
          backgroundColor: colors.surfaceSoft,
          borderWidth: 1,
          borderColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Store size={20} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>
            Go to Collect Payment Screen
          </Text>
          <Text style={{ fontSize: 11, color: colors.muted }}>
            Display your active QR with custom counter bill amounts
          </Text>
        </View>
        <ExternalLink size={16} color={colors.muted} />
      </Pressable>

      {/* Upload QR Modal */}
      <Modal
        visible={isUploadModalOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsUploadModalOpen(false)}
      >
        <Screen>
          <Header
            title="Upload App Standee"
            subtitle="Save original PhonePe, GPay, or Paytm QR"
            back={
              <Pressable onPress={() => setIsUploadModalOpen(false)} hitSlop={10}>
                <ArrowLeft size={22} color={colors.text} />
              </Pressable>
            }
          />

          <View style={{ gap: 16, paddingBottom: 20 }}>
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: colors.muted, letterSpacing: 0.6 }}>
                1. SELECT UPI APP SOURCE
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {ALL_APPS.map((app) => {
                  const isSelected = formApp === app;
                  const preset = APP_PRESETS[app];
                  return (
                    <Pressable
                      key={app}
                      onPress={() => handleSelectApp(app)}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderRadius: 14,
                        backgroundColor: isSelected ? preset.brandColor : colors.surface,
                        borderWidth: 1.5,
                        borderColor: isSelected ? preset.brandColor : colors.border,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: '800',
                          color: isSelected ? '#FFFFFF' : colors.text,
                        }}
                      >
                        {app}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: colors.muted, letterSpacing: 0.6 }}>
                2. ORIGINAL QR IMAGE
              </Text>

              {formImageUri ? (
                <View
                  style={{
                    borderRadius: 16,
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1.5,
                    borderColor: APP_PRESETS[formApp].brandColor,
                    padding: 16,
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <VaultQRImage uri={formImageUri} size={180} />
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Button
                      title="Change Image"
                      icon={Upload}
                      variant="secondary"
                      compact
                      onPress={handlePickFile}
                    />
                    <Button
                      title="Clear"
                      variant="danger"
                      compact
                      onPress={() => setFormImageUri('')}
                    />
                  </View>
                </View>
              ) : (
                <View
                  style={{
                    borderRadius: 16,
                    borderWidth: 2,
                    borderStyle: 'dashed',
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    padding: 24,
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 16,
                      backgroundColor: APP_PRESETS[formApp].bgLight,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Upload size={24} color={APP_PRESETS[formApp].textColor} />
                  </View>
                  <View style={{ alignItems: 'center', gap: 3 }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>
                      Pick Image from Device
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.muted, textAlign: 'center' }}>
                      PNG, JPG, or screenshot downloaded from {formApp}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Button
                      title="Browse Gallery / Files"
                      icon={ImageIcon}
                      variant="primary"
                      compact
                      onPress={handlePickFile}
                    />
                    <Button
                      title="Use Preset Standee"
                      icon={Sparkles}
                      variant="secondary"
                      compact
                      onPress={handleUseSampleTemplate}
                    />
                  </View>
                </View>
              )}
            </View>

            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: colors.muted, letterSpacing: 0.6 }}>
                3. STANDEE TITLE / COUNTER LABEL
              </Text>
              <TextInput
                value={formTitle}
                onChangeText={setFormTitle}
                placeholder="e.g. Counter 1 Main Standee"
                placeholderTextColor={colors.muted}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 15,
                  fontWeight: '700',
                  color: colors.text,
                }}
              />
            </View>

            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: colors.muted, letterSpacing: 0.6 }}>
                4. ASSOCIATED UPI ID (OPTIONAL)
              </Text>
              <TextInput
                value={formVpa}
                onChangeText={setFormVpa}
                placeholder="e.g. sharma.store@ybl"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                keyboardType="email-address"
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 15,
                  fontWeight: '700',
                  color: colors.text,
                }}
              />
            </View>

            <Pressable
              onPress={() => setFormIsPrimary(!formIsPrimary)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                backgroundColor: colors.surface,
                padding: 14,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: formIsPrimary ? colors.primary : colors.border,
              }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  backgroundColor: formIsPrimary ? colors.primary : 'transparent',
                  borderWidth: 2,
                  borderColor: formIsPrimary ? colors.primary : colors.muted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {formIsPrimary ? <Check size={14} color="#FFFFFF" strokeWidth={3} /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>
                  Set as Active Standee
                </Text>
                <Text style={{ fontSize: 11, color: colors.muted }}>
                  Defaults to this QR on the Collect Payment and Home screens
                </Text>
              </View>
            </Pressable>

            <Button
              title="Save Standee to Vault"
              icon={CheckCircle2}
              variant="primary"
              onPress={handleSaveQR}
            />
          </View>
        </Screen>
      </Modal>

      {/* Fullscreen Customer Presentation Modal */}
      <Modal
        visible={!!fullscreenQR}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setFullscreenQR(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.85)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          {fullscreenQR ? (
            <View
              style={{
                width: '100%',
                maxWidth: 380,
                backgroundColor: '#FFFFFF',
                borderRadius: 28,
                padding: 24,
                alignItems: 'center',
                gap: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
                elevation: 10,
              }}
            >
              <View style={{ width: '100%', alignItems: 'center', gap: 4 }}>
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                    borderRadius: 10,
                    backgroundColor: APP_PRESETS[fullscreenQR.appName].bgLight,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '900',
                      color: APP_PRESETS[fullscreenQR.appName].textColor,
                    }}
                  >
                    {fullscreenQR.appName.toUpperCase()} ACCEPTED
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: '900',
                    color: '#0F172A',
                    textAlign: 'center',
                  }}
                  numberOfLines={1}
                >
                  {merchantProfile.businessName}
                </Text>
                {fullscreenQR.vpa ? (
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B' }}>
                    UPI ID: {fullscreenQR.vpa}
                  </Text>
                ) : null}
              </View>

              <View
                style={{
                  width: 250,
                  height: 250,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 8,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                }}
              >
                <VaultQRImage uri={fullscreenQR.imageUri} size={230} />
              </View>

              <View
                style={{
                  backgroundColor: '#F1F5F9',
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#334155' }}>
                  Scan with any UPI app · Instant Soundbox Alert
                </Text>
              </View>

              <Button
                title="Close Counter View"
                variant="secondary"
                compact
                style={{ width: '100%' }}
                onPress={() => setFullscreenQR(null)}
              />
            </View>
          ) : null}
        </View>
      </Modal>
    </Screen>
  );
}
