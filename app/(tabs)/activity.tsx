import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { BellRing, Clock3, IndianRupee, Volume2 } from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import { Card, EventRow, PageIntro, Screen, StatusPill } from '@/components/ui';

type Filter = 'All' | 'Announced' | 'Pending';
const filters: Filter[] = ['All', 'Announced', 'Pending'];

export default function ActivityScreen() {
  const { colors, events, speakPayment } = useApp();
  const [filter, setFilter] = useState<Filter>('All');

  const filtered = useMemo(
    () =>
      events.filter((event) => {
        if (filter === 'Announced') return event.state === 'Played';
        if (filter === 'Pending') return event.state === 'Pending';
        return true;
      }),
    [events, filter]
  );

  const playedCount = events.filter((event) => event.state === 'Played').length;
  const totalReceived = events.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <Screen>
      <PageIntro
        eyebrow="Soundbox History"
        title="Payment Activity"
        description="Review all customer UPI payments detected and announced by your DhwaniPay soundbox."
      />

      {/* Summary Cards */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View
          style={{
            flex: 1,
            padding: 15,
            borderRadius: 18,
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
            gap: 6,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <IndianRupee size={15} color={colors.primary} />
            <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '700' }}>TOTAL AMOUNT</Text>
          </View>
          <Text style={{ color: colors.text, fontSize: 24, fontWeight: '900', letterSpacing: -0.6 }}>
            ₹{totalReceived.toLocaleString('en-IN')}
          </Text>
        </View>

        <View
          style={{
            flex: 1,
            padding: 15,
            borderRadius: 18,
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
            gap: 6,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Volume2 size={15} color={colors.primary} />
            <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '700' }}>ANNOUNCED</Text>
          </View>
          <Text style={{ color: colors.primaryDark, fontSize: 24, fontWeight: '900', letterSpacing: -0.6 }}>
            {playedCount} / {events.length}
          </Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={{ gap: 11 }}>
        <Text style={{ color: colors.text, fontWeight: '800', fontSize: 18 }}>Payment Timeline</Text>
        <View style={{ flexDirection: 'row', gap: 7 }}>
          {filters.map((item) => {
            const active = item === filter;
            return (
              <Pressable
                key={item}
                onPress={() => setFilter(item)}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 10,
                  borderRadius: 100,
                  backgroundColor: active ? colors.primary : colors.surface,
                  borderColor: active ? colors.primary : colors.border,
                  borderWidth: 1,
                  minHeight: 40,
                }}
              >
                <Text style={{ fontSize: 12, color: active ? '#FFFFFF' : colors.muted, fontWeight: '800' }}>
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Payment Events List */}
        <Card padding={15}>
          {filtered.length > 0 ? (
            filtered.map((event, index) => (
              <View key={event.id}>
                <EventRow
                  amount={event.amount}
                  source={event.source}
                  time={event.time}
                  state={event.state}
                  onPress={() => router.push(`/event/${event.id}` as any)}
                  onSpeak={() => event.amount && speakPayment(event.amount, event.source)}
                />
                {index < filtered.length - 1 ? (
                  <View style={{ height: 1, backgroundColor: colors.border }} />
                ) : null}
              </View>
            ))
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 24, gap: 9 }}>
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
                <Clock3 size={22} color={colors.muted} />
              </View>
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15 }}>
                No payments in this view
              </Text>
              <Text style={{ color: colors.muted, textAlign: 'center', fontSize: 13, lineHeight: 20 }}>
                Incoming payments announced by DhwaniPay will show up here.
              </Text>
            </View>
          )}
        </Card>
      </View>
    </Screen>
  );
}
