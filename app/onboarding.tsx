import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowRight, CheckCircle2, IndianRupee, Smartphone, Volume2 } from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import { BrandMark, Button, Screen } from '@/components/ui';

const slides = [
  { eyebrow: 'LESS HARDWARE', title: 'Your phone is enough.', body: 'Turn a compatible Android phone you already own into a payment announcement companion.', icon: Smartphone, label: 'One phone. One less device.' },
  { eyebrow: 'KEEP SERVING', title: "We'll announce.", body: 'Hear supported payment notifications aloud instead of constantly checking your screen.', icon: Volume2, label: 'Notifications spoken clearly.' },
  { eyebrow: 'KEEP MORE', title: 'Small savings add up.', body: 'Eliminate monthly hardware soundbox rental fees and keep a ledger of daily shop expenses.', icon: IndianRupee, label: 'Zero rental charges.' },
];

export default function OnboardingScreen() {
  const { colors } = useApp();
  const [index, setIndex] = useState(0);
  const slide = slides[index];
  const Icon = slide.icon;
  return (
    <Screen contentStyle={{ flex: 1, justifyContent: 'space-between', paddingTop: 18, paddingBottom: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><BrandMark size={43} /><Text style={{ color: colors.text, fontWeight: '900', fontSize: 20 }}>DhwaniPay</Text><View style={{ flex: 1 }} /><Pressable onPress={() => router.replace('/language')}><Text style={{ color: colors.muted, fontSize: 14, fontWeight: '700' }}>Skip</Text></Pressable></View>

      <View style={{ gap: 25, paddingHorizontal: 4 }}>
        <View style={{ height: 275, borderRadius: 30, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <View style={{ position: 'absolute', width: 230, height: 230, borderRadius: 120, borderWidth: 1, borderColor: 'rgba(8,127,91,0.12)' }} />
          <View style={{ position: 'absolute', width: 180, height: 180, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(8,127,91,0.16)' }} />
          <View style={{ backgroundColor: '#FFFFFF', width: 118, height: 192, borderWidth: 5, borderColor: '#17231D', borderRadius: 27, alignItems: 'center', justifyContent: 'center', gap: 13, transform: [{ rotate: '-5deg' }] }}>
            <View style={{ width: 47, height: 5, borderRadius: 4, backgroundColor: '#DCE5DE' }} />
            <View style={{ width: 68, height: 68, borderRadius: 23, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}><Icon color="#FFFFFF" size={32} strokeWidth={2} /></View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>{[12, 22, 32, 19, 10].map((h, i) => <View key={i} style={{ height: h, width: 4, borderRadius: 3, backgroundColor: colors.primary }} />)}</View>
            <View style={{ width: 62, height: 5, borderRadius: 4, backgroundColor: '#E3E9E4' }} />
          </View>
          <View style={{ position: 'absolute', bottom: 24, backgroundColor: '#FFFFFF', borderRadius: 100, paddingVertical: 9, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 7 }}><CheckCircle2 size={16} color={colors.primary} /><Text style={{ color: colors.text, fontSize: 12, fontWeight: '800' }}>{slide.label}</Text></View>
        </View>
        <View style={{ gap: 10 }}>
          <Text style={{ color: colors.primary, fontSize: 11, letterSpacing: 1.7, fontWeight: '900' }}>{slide.eyebrow}</Text>
          <Text style={{ color: colors.text, fontSize: 32, lineHeight: 37, fontWeight: '900', letterSpacing: -1 }}>{slide.title}</Text>
          <Text style={{ color: colors.muted, fontSize: 16, lineHeight: 24 }}>{slide.body}</Text>
        </View>
      </View>

      <View style={{ gap: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 7 }}>{slides.map((s, i) => <View key={s.eyebrow} style={{ height: 7, width: i === index ? 27 : 7, borderRadius: 5, backgroundColor: i === index ? colors.primary : colors.border }} />)}</View>
        <Button title={index === slides.length - 1 ? 'Get started' : 'Next'} icon={ArrowRight} onPress={() => index === slides.length - 1 ? router.replace('/language') : setIndex((prev) => prev + 1)} />
      </View>
    </Screen>
  );
}
