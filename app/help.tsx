import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, ChevronDown, CircleHelp, Headphones, Mail } from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import { Button, Card, Header, Screen } from '@/components/ui';

const faqs = [
  {
    q: 'How does DhwaniPay work?',
    a: 'DhwaniPay turns your smartphone into a smart voice soundbox. When customers pay using UPI QR codes, it instantly speaks out the amount aloud in your selected language, eliminating the need to rent separate hardware soundboxes.',
  },
  {
    q: 'How do I record and track shop expenses?',
    a: 'Go to the Expenses tab, tap "+ Add New Expense", enter the title and amount, choose a category (such as Inventory, Food & Tea, Electricity, Rent), and tap Save. You can also turn on instant voice announcement.',
  },
  {
    q: 'How do I mark an expense as Done or Paid?',
    a: 'Simply tap the "Mark as Done" / "Paid / Done" button on any expense card. It toggles status instantly and announces the completed expense aloud.',
  },
  {
    q: 'Why is notification access required?',
    a: 'Android requires Notification Access to detect incoming payment notifications from merchant UPI apps like PhonePe, Google Pay, Paytm, and BHIM.',
  },
  {
    q: 'Does DhwaniPay read my private messages or OTPs?',
    a: 'No. DhwaniPay strictly filters for payment alerts from verified financial apps. Personal chats, OTPs, and private messages are ignored and never read or stored.',
  },
  {
    q: 'How do I change the announcement language?',
    a: 'Go to Settings > Language & accessibility, and select from supported languages including Hindi, English, Telugu, Kannada, Tamil, Malayalam, and Marathi.',
  },
  {
    q: 'What should I do if voice announcements do not play?',
    a: 'Ensure your phone media volume is turned up to maximum and not muted. You can also run the Voice Test in Settings to verify device speaker output.',
  },
  {
    q: 'Can I delete or remove recorded expenses?',
    a: 'Yes, tap the trash icon on any expense row in the Expenses tab to delete it.',
  },
];

export default function HelpScreen() {
  const { colors } = useApp();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <Screen>
      <Header
        title="Help & FAQs"
        subtitle="Answers to common questions"
        back={
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <ArrowLeft size={22} color={colors.text} />
          </Pressable>
        }
      />

      <View style={{ gap: 7 }}>
        <Text style={{ color: colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.8 }}>
          Merchant Support
        </Text>
        <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 22 }}>
          Everything you need to know about setting up and using your phone soundbox and ledger.
        </Text>
      </View>

      <Card padding={7}>
        {faqs.map((faq, i) => (
          <View key={faq.q}>
            <Pressable
              onPress={() => setOpen(open === i ? null : i)}
              style={{
                minHeight: 54,
                paddingHorizontal: 12,
                paddingVertical: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 14, lineHeight: 20, flex: 1, fontWeight: '800' }}>
                {faq.q}
              </Text>
              <ChevronDown
                color={colors.muted}
                size={18}
                style={{ transform: [{ rotate: open === i ? '180deg' : '0deg' }] }}
              />
            </Pressable>
            {open === i ? (
              <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 21, paddingHorizontal: 12, paddingBottom: 15 }}>
                {faq.a}
              </Text>
            ) : null}
            {i < faqs.length - 1 ? (
              <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 12 }} />
            ) : null}
          </View>
        ))}
      </Card>

      <View style={{ gap: 9, alignItems: 'center', paddingTop: 6 }}>
        <View
          style={{
            width: 50,
            height: 50,
            borderRadius: 17,
            backgroundColor: colors.surfaceSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Headphones size={22} color={colors.primary} />
        </View>
        <Text style={{ color: colors.text, fontSize: 15, fontWeight: '900' }}>Have a question?</Text>
        <Text style={{ color: colors.muted, fontSize: 13, textAlign: 'center', lineHeight: 19 }}>
          We are committed to helping small shops and merchants run effortlessly.
        </Text>
        <Button
          title="Soundbox Voice Test"
          onPress={() => router.push('/voice-test')}
        />
      </View>
    </Screen>
  );
}
