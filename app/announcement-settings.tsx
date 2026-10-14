import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, BellRing, Languages, Pause, Play, Volume2, ShieldCheck } from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import { Button, Card, Header, InfoBanner, Screen, SettingRow, StatusPill } from '@/components/ui';

export default function AnnouncementSettingsScreen() {
  const { colors, announcementsEnabled, setAnnouncementsEnabled, spokenLanguage } = useApp();

  return (
    <Screen>
      <Header
        title="Sound & announcements"
        subtitle="Manage voice announcements for payments and expenses"
        back={
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <ArrowLeft size={22} color={colors.text} />
          </Pressable>
        }
      />

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              backgroundColor: colors.primarySoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Volume2 size={24} color={colors.primary} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}>
              Voice Soundbox
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 17 }}>
              {announcementsEnabled
                ? 'Soundbox announcements are enabled.'
                : 'Soundbox announcements are paused.'}
            </Text>
          </View>
          <Pressable
            onPress={() => setAnnouncementsEnabled(!announcementsEnabled)}
            accessibilityRole="switch"
            accessibilityState={{ checked: announcementsEnabled }}
            style={{
              width: 48,
              height: 29,
              borderRadius: 20,
              padding: 3,
              backgroundColor: announcementsEnabled ? colors.primary : colors.border,
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 23,
                height: 23,
                borderRadius: 12,
                backgroundColor: '#FFFFFF',
                alignSelf: announcementsEnabled ? 'flex-end' : 'flex-start',
              }}
            />
          </Pressable>
        </View>
        <StatusPill
          label={announcementsEnabled ? 'ONLINE & ACTIVE' : 'MUTED'}
          tone={announcementsEnabled ? 'success' : 'neutral'}
        />
      </Card>

      <Card padding={14}>
        <SettingRow
          title="Spoken language"
          description={`Selected speech language: ${spokenLanguage}`}
          icon={Languages}
          onPress={() => router.push('/language')}
        />
        <View style={{ height: 1, backgroundColor: colors.border }} />
        <SettingRow
          title="Test soundbox voice"
          description="Hear sample speech announcement on this device"
          icon={BellRing}
          onPress={() => router.push('/voice-test')}
        />
      </Card>

      <InfoBanner
        title="Speaker recommendations"
        text="For busy shops, keep your phone's media volume at maximum or connect via Bluetooth to an external portable speaker."
        tone="info"
        icon={Volume2}
      />

      <Button
        title={announcementsEnabled ? 'Pause announcements' : 'Resume announcements'}
        icon={announcementsEnabled ? Pause : Play}
        onPress={() => setAnnouncementsEnabled(!announcementsEnabled)}
      />
    </Screen>
  );
}
