import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, BellRing, CircleAlert, Clock3, ShieldCheck, Volume2 } from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import { Button, Card, Header, Screen, StatusPill } from '@/components/ui';

export default function EventDetailScreen() {
  const { colors, events, speakPayment } = useApp();
  const params = useLocalSearchParams<{ id: string }>();
  const event = events.find((item) => item.id === params.id);

  if (!event) {
    return (
      <Screen>
        <Header
          title="Payment Details"
          back={
            <Pressable onPress={() => router.back()}>
              <ArrowLeft size={22} color={colors.text} />
            </Pressable>
          }
        />
        <View style={{ gap: 12 }}>
          <Text style={{ color: colors.text, fontSize: 24, fontWeight: '900' }}>
            This event is no longer available.
          </Text>
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21 }}>
            The transaction record could not be found.
          </Text>
          <Button title="Back to Activity" onPress={() => router.replace('/(tabs)/activity')} />
        </View>
      </Screen>
    );
  }

  const tone = event.state === 'Played' ? 'success' : event.state === 'Failed' ? 'error' : 'warning';
  const stateLabel =
    event.state === 'Played'
      ? 'Announced successfully'
      : event.state === 'Failed'
      ? 'Announcement failed'
      : 'Announcement pending';

  return (
    <Screen>
      <Header
        title="Payment Details"
        subtitle="Soundbox notification record"
        back={
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <ArrowLeft size={22} color={colors.text} />
          </Pressable>
        }
      />

      <View style={{ alignItems: 'center', paddingTop: 12, gap: 10 }}>
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 30,
            backgroundColor: colors.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Volume2 size={38} color={colors.primary} />
        </View>
        <Text style={{ color: colors.text, fontSize: 42, lineHeight: 48, fontWeight: '900', letterSpacing: -1 }}>
          {event.amount != null ? `₹${event.amount}` : 'Payment notification'}
        </Text>
        <StatusPill label={stateLabel} tone={tone} />
      </View>

      <Card>
        <Text style={{ color: colors.text, fontSize: 17, fontWeight: '900' }}>Transaction Info</Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <BellRing size={19} color={colors.primary} />
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={{ color: colors.muted, fontSize: 12 }}>Payment Provider</Text>
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>{event.source}</Text>
          </View>
        </View>

        <View style={{ height: 1, backgroundColor: colors.border }} />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Clock3 size={19} color={colors.primary} />
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={{ color: colors.muted, fontSize: 12 }}>Time Received</Text>
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>{event.time}</Text>
          </View>
        </View>

        <View style={{ height: 1, backgroundColor: colors.border }} />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Volume2 size={19} color={colors.primary} />
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={{ color: colors.muted, fontSize: 12 }}>Soundbox Status</Text>
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>{stateLabel}</Text>
          </View>
        </View>

        {event.note ? <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19 }}>{event.note}</Text> : null}
      </Card>

      {event.amount ? (
        <Button
          title="Replay Voice Announcement"
          icon={Volume2}
          onPress={() => speakPayment(event.amount!, event.source)}
        />
      ) : null}

      {event.state === 'Failed' ? (
        <Button
          title="Open Audio Troubleshooter"
          icon={CircleAlert}
          variant="secondary"
          onPress={() => router.push('/recovery?kind=audio')}
        />
      ) : null}

      <Button title="Back to Activity" onPress={() => router.replace('/(tabs)/activity')} variant="secondary" />
    </Screen>
  );
}
