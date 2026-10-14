import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Check, Languages, Moon, Sun, Type, Volume2 } from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import { Button, Card, Header, InfoBanner, Screen } from '@/components/ui';

const languages = [
  { name: 'English', native: 'English' }, { name: 'Hindi', native: 'हिंदी' }, { name: 'Telugu', native: 'తెలుగు' },
  { name: 'Kannada', native: 'ಕನ್ನಡ' }, { name: 'Tamil', native: 'தமிழ்' }, { name: 'Malayalam', native: 'മലയാളം' }, { name: 'Marathi', native: 'मराठी' },
];

export default function AccessibilityScreen() {
  const { colors, spokenLanguage, interfaceLanguage, setSpokenLanguage, setInterfaceLanguage, themeMode, setThemeMode } = useApp();
  return (
    <Screen>
      <Header title="Language & accessibility" subtitle="Make DhwaniPay easier to use" back={<Pressable onPress={() => router.back()} hitSlop={10}><ArrowLeft size={22} color={colors.text} /></Pressable>} />
      
      {/* Under Development Banner */}
      <InfoBanner
        tone="warning"
        title="Language & Accessibility Under Development"
        text="Custom regional interface translations and high-contrast accessibility tools are currently under development."
      />

      <View style={{ gap: 8 }}><Text style={{ color: colors.text, fontSize: 28, lineHeight: 34, fontWeight: '900', letterSpacing: -0.8 }}>Made to feel familiar.</Text><Text style={{ color: colors.muted, fontSize: 15, lineHeight: 22 }}>Choose app language and spoken announcements separately.</Text></View>

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Languages size={20} color={colors.primary} /><Text style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}>App interface language</Text></View>
        {languages.map((item) => {
          const selected = interfaceLanguage === item.name;
          return <Pressable key={item.name} onPress={() => setInterfaceLanguage(item.name)} style={{ flexDirection: 'row', alignItems: 'center', minHeight: 42, gap: 10 }}><Text style={{ flex: 1, color: colors.text, fontSize: 14, fontWeight: selected ? '800' : '500' }}>{item.native} <Text style={{ color: colors.muted, fontSize: 12 }}>· {item.name}</Text></Text>{selected ? <Check color={colors.primary} size={18} /> : null}</Pressable>;
        })}
        <Text style={{ color: colors.muted, fontSize: 11, lineHeight: 17 }}>Spoken language dynamically configures the voice announcement synthesis engine.</Text>
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Volume2 size={20} color={colors.primary} /><Text style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}>Spoken language</Text></View>
        {languages.map((item) => {
          const selected = spokenLanguage === item.name;
          return <Pressable key={item.name} onPress={() => setSpokenLanguage(item.name)} style={{ flexDirection: 'row', alignItems: 'center', minHeight: 42, gap: 10 }}><Text style={{ flex: 1, color: colors.text, fontSize: 14, fontWeight: selected ? '800' : '500' }}>{item.native} <Text style={{ color: colors.muted, fontSize: 12 }}>· {item.name}</Text></Text>{selected ? <Check color={colors.primary} size={18} /> : null}</Pressable>;
        })}
        <Button title="Hear sample voice" icon={Volume2} variant="secondary" onPress={() => router.push('/voice-test')} />
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Sun size={20} color={colors.primary} /><Text style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}>Appearance</Text></View>
        <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18 }}>Choose system appearance or set it manually.</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[{ value: 'system', label: 'System', icon: Type }, { value: 'light', label: 'Light', icon: Sun }, { value: 'dark', label: 'Dark', icon: Moon }].map((theme) => {
            const active = themeMode === theme.value;
            const Icon = theme.icon;
            return <Pressable key={theme.value} onPress={() => setThemeMode(theme.value as any)} style={{ flex: 1, alignItems: 'center', gap: 7, paddingVertical: 13, borderRadius: 15, backgroundColor: active ? colors.primarySoft : colors.surfaceSoft, borderColor: active ? colors.primary : 'transparent', borderWidth: active ? 1.5 : 1 }}><Icon size={20} color={active ? colors.primary : colors.muted} /><Text style={{ color: active ? colors.primary : colors.text, fontSize: 12, fontWeight: '800' }}>{theme.label}</Text></Pressable>;
          })}
        </View>
      </Card>
      <Card padding={14}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center' }}><Type size={20} color={colors.primary} /></View><View style={{ flex: 1, gap: 4 }}><Text style={{ color: colors.text, fontWeight: '800', fontSize: 14 }}>Text size and touch targets</Text><Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18 }}>Uses system text scaling and touch areas sized for everyday use. High-contrast mode is not separately implemented.</Text></View></View>
      </Card>
    </Screen>
  );
}
