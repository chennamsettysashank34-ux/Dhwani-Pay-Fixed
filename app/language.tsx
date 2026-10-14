import React from 'react';
import { Pressable, Text, View, Alert } from 'react-native';
import { router } from 'expo-router';
import * as Speech from 'expo-speech';
import { ArrowLeft, Check, Languages, Volume2 } from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import { Button, Header, Screen, StatusPill } from '@/components/ui';

const languages = [
  { name: 'English', native: 'English', code: 'en-IN' },
  { name: 'Hindi', native: 'हिंदी', code: 'hi-IN' },
  { name: 'Telugu', native: 'తెలుగు', code: 'te-IN' },
  { name: 'Kannada', native: 'ಕನ್ನಡ', code: 'kn-IN' },
  { name: 'Tamil', native: 'தமிழ்', code: 'ta-IN' },
  { name: 'Malayalam', native: 'മലയാളം', code: 'ml-IN' },
  { name: 'Marathi', native: 'मराठी', code: 'mr-IN' },
];

export default function LanguageScreen() {
  const { colors, spokenLanguage, setSpokenLanguage } = useApp();
  const preview = () => {
    const selected = languages.find((item) => item.name === spokenLanguage) ?? languages[0];
    try {
      Speech.speak(selected.name === 'Hindi' ? 'भुगतान सूचना प्राप्त हुई।' : selected.name === 'Telugu' ? 'చెల్లింపు నోటిఫికేషన్ అందింది.' : selected.name === 'Kannada' ? 'ಪಾವತಿ ಅಧಿಸೂಚನೆ ಬಂದಿದೆ.' : selected.name === 'Tamil' ? 'கட்டண அறிவிப்பு பெறப்பட்டது.' : 'Payment notification received for forty rupees.', { language: selected.code, rate: 0.88 });
    } catch {
      Alert.alert('Sample voice unavailable', 'Check whether a speech voice is installed on this device.');
    }
  };

  return (
    <Screen>
      <Header title="Choose your language" subtitle="You can change this later." back={<Pressable onPress={() => router.back()} hitSlop={10}><ArrowLeft size={22} color={colors.text} /></Pressable>} />
      <View style={{ gap: 7, marginTop: 4 }}>
        <Text style={{ color: colors.text, fontSize: 28, lineHeight: 34, fontWeight: '900', letterSpacing: -0.8 }}>Let's set up your soundbox.</Text>
        <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 22 }}>Choose the language you want to hear in payment announcements.</Text>
      </View>
      <View style={{ gap: 9 }}>
        {languages.map((language) => {
          const selected = spokenLanguage === language.name;
          return <Pressable key={language.name} onPress={() => setSpokenLanguage(language.name)} accessibilityRole="radio" accessibilityState={{ selected }} style={{ minHeight: 62, borderRadius: 17, paddingVertical: 11, paddingHorizontal: 14, borderWidth: selected ? 2 : 1, borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primarySoft : colors.surface, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: selected ? colors.surface : colors.surfaceSoft, alignItems: 'center', justifyContent: 'center' }}><Languages size={19} color={selected ? colors.primary : colors.muted} /></View>
            <View style={{ flex: 1 }}><Text style={{ color: colors.text, fontWeight: '800', fontSize: 15 }}>{language.native}</Text><Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>{language.name}</Text></View>
            {selected ? <Check size={20} color={colors.primary} /> : <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border }} />}
          </Pressable>;
        })}
      </View>
      <Button title="Hear sample voice" icon={Volume2} onPress={preview} variant="secondary" />
      <View style={{ gap: 11 }}>
        <StatusPill label={`Spoken language · ${spokenLanguage}`} tone="success" />
        <Button title="Continue" onPress={() => router.push('/setup')} icon={Check} />
      </View>
    </Screen>
  );
}
