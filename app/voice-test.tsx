import React, { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, CheckCircle2, Headphones, RotateCcw, Volume2, VolumeX } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import { useApp } from '@/context/AppContext';
import { Button, Card, Header, InfoBanner, Screen, StatusPill } from '@/components/ui';

const languageCodes: Record<string, string> = { English: 'en-IN', Hindi: 'hi-IN', Telugu: 'te-IN', Kannada: 'kn-IN', Tamil: 'ta-IN', Malayalam: 'ml-IN', Marathi: 'mr-IN' };

export default function VoiceTestScreen() {
  const { colors, spokenLanguage, setSpokenLanguage } = useApp();
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => () => { Speech.stop(); }, []);

  const playSample = async () => {
    setFailed(false);
    setPlaying(true);
    try {
      await Speech.stop();
      const phrase = spokenLanguage === 'Hindi' ? 'भुगतान सूचना प्राप्त हुई। चालीस रुपये।' : spokenLanguage === 'Telugu' ? 'చెల్లింపు నోటిఫికేషన్ అందింది. నలభై రూపాయలు.' : spokenLanguage === 'Kannada' ? 'ಪಾವತಿ ಅಧಿಸೂಚನೆ ಬಂದಿದೆ. ನಲವತ್ತು ರೂಪಾಯಿಗಳು.' : spokenLanguage === 'Tamil' ? 'கட்டண அறிவிப்பு பெறப்பட்டது. நாற்பது ரூபாய்.' : 'Payment notification received for forty rupees.';
      Speech.speak(phrase, {
        language: languageCodes[spokenLanguage] ?? 'en-IN',
        rate: 0.88,
        onStart: () => setPlaying(true),
        onDone: () => setPlaying(false),
        onStopped: () => setPlaying(false),
        onError: () => { setPlaying(false); setFailed(true); },
      });
    } catch {
      setPlaying(false);
      setFailed(true);
    }
  };

  const stopSample = async () => { await Speech.stop(); setPlaying(false); };
  return (
    <Screen>
      <Header title="Voice test" subtitle="Hear it before you rely on it" back={<Pressable onPress={() => router.back()} hitSlop={10}><ArrowLeft size={22} color={colors.text} /></Pressable>} />
      <View style={{ alignItems: 'center', paddingTop: 6, gap: 12 }}>
        <View style={{ width: 146, height: 146, borderRadius: 48, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 102, height: 102, borderRadius: 35, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}><Volume2 color="#FFFFFF" size={48} strokeWidth={1.8} /></View>
        </View>
        <StatusPill label={playing ? 'SAMPLE PLAYING' : failed ? 'PLAYBACK ISSUE' : 'SAMPLE READY'} tone={playing ? 'success' : failed ? 'error' : 'neutral'} icon={playing ? Volume2 : failed ? VolumeX : CheckCircle2} />
        <Text style={{ color: colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.8 }}>Let's hear your soundbox.</Text>
        <Text style={{ textAlign: 'center', color: colors.muted, fontSize: 14, lineHeight: 21 }}>Verify speaker clarity, volume level, and regional speech accent.</Text>
      </View>

      <Card>
        <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700' }}>TEST ANNOUNCEMENT</Text>
        <Text style={{ color: colors.text, fontSize: 23, fontWeight: '900', lineHeight: 31 }}>Fifty rupees received on Google Pay.</Text>
        <View style={{ height: 1, backgroundColor: colors.border }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text style={{ color: colors.muted, fontSize: 13 }}>Spoken language</Text><Pressable onPress={() => router.push('/language')}><Text style={{ color: colors.primary, fontWeight: '800', fontSize: 13 }}>{spokenLanguage} · Change</Text></Pressable></View>
        <View style={{ height: 45, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
          {[14, 22, 30, 17, 25, 35, 21, 30, 16, 26, 19, 33, 17, 25, 13].map((h, i) => <View key={i} style={{ width: 4, height: playing ? h : Math.min(h, 9), borderRadius: 4, backgroundColor: playing ? colors.primary : colors.border }} />)}
        </View>
        <Button title={playing ? 'Stop sample' : 'Play test announcement'} icon={playing ? VolumeX : Volume2} onPress={playing ? stopSample : playSample} />
        {failed ? <InfoBanner title="We couldn't play the sample" text="Check media volume and audio output. This device may not have the selected language voice installed." tone="error" icon={VolumeX} /> : null}
      </Card>
      <InfoBanner title="Check your media volume" text="Raise the phone's media volume and make sure audio is coming from the speaker, not a connected headset." tone="info" icon={Headphones} />
      <Button title="Try again" icon={RotateCcw} variant="secondary" onPress={playSample} />
      <Button title="Back to Home" onPress={() => router.replace('/(tabs)')} />
    </Screen>
  );
}
