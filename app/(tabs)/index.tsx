import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  ArrowRight,
  AudioLines,
  BellRing,
  Clock3,
  Cloud,
  Database,
  IndianRupee,
  LogIn,
  Pause,
  Play,
  Plus,
  FolderLock,
  QrCode,
  Receipt,
  Settings2,
  TrendingDown,
  TrendingUp,
  Volume2,
} from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import {
  BrandMark,
  Button,
  Card,
  EventRow,
  ExpenseRow,
  Eyebrow,
  MetricCard,
  PrimaryScreenAction,
  Screen,
  SectionHeading,
  StatusPill,
} from '@/components/ui';

export default function HomeScreen() {
  const {
    colors,
    merchantProfile,
    currentUser,
    isCloudActive,
    vaultQRs,
    announcementsEnabled,
    setAnnouncementsEnabled,
    events,
    expenses,
    toggleExpenseStatus,
    removeExpense,
    speakExpense,
    speakPayment,
    permissionState,
    requestNotificationPermission,
  } = useApp();

  const latestPayment = events[0];
  const playedCount = events.filter((e) => e.state === 'Played').length;

  // Filter financial metrics for actual today's transactions
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayEvents = events.filter((e) => !e.date || e.date === todayDateStr);
  const totalReceived = todayEvents.reduce((sum, e) => sum + (e.amount || 0), 0);

  const todayExpenses = expenses.filter((e) => {
    return e.date.toLowerCase().includes('today') || e.date.startsWith(todayDateStr);
  });
  const totalExpenses = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
  const pendingExpenses = todayExpenses.filter((e) => e.status === 'pending');
  const pendingTotal = pendingExpenses.reduce((sum, e) => sum + e.amount, 0);

  const statusLabel = announcementsEnabled ? 'SOUNDBOX ACTIVE' : 'SOUNDBOX PAUSED';

  return (
    <Screen>
      {/* Brand Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
        <BrandMark size={46} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 21, fontWeight: '900', letterSpacing: -0.6 }}>
            DhwaniPay
          </Text>
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 1 }}>
            Smart Merchant Soundbox & Ledger
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/(tabs)/settings')}
          accessibilityRole="button"
          accessibilityLabel="Settings"
          style={{
            width: 44,
            height: 44,
            borderRadius: 15,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Settings2 color={colors.text} size={20} />
        </Pressable>
      </View>

      {/* Supabase Cloud Sync / Auth Banner */}
      {currentUser ? (
        <Pressable
          onPress={() => router.push('/auth')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 14,
            paddingVertical: 9,
            borderRadius: 14,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
            <Cloud size={16} color={colors.primary} />
            <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }} numberOfLines={1}>
              {currentUser.user_metadata?.business_name || currentUser.email}
            </Text>
          </View>
          <StatusPill
            label="CLOUD SYNCED"
            tone="success"
            small
          />
        </Pressable>
      ) : (
        <Pressable
          onPress={() => router.push('/auth')}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 14,
            backgroundColor: colors.primarySoft,
            borderWidth: 1.5,
            borderColor: colors.primary,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
            <LogIn size={16} color={colors.primaryDark} />
            <Text style={{ fontSize: 13, fontWeight: '800', color: colors.primaryDark }}>
              Email Login · Sync soundbox across devices
            </Text>
          </View>
          <Text style={{ fontSize: 11, fontWeight: '900', color: colors.primaryDark }}>SIGN IN ➔</Text>
        </Pressable>
      )}

      {/* Notification Access Banner if not granted */}
      {permissionState !== 'enabled' && (
        <Pressable
          onPress={requestNotificationPermission}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 14,
            borderRadius: 16,
            backgroundColor: '#FEF3C7',
            borderWidth: 1.5,
            borderColor: '#F59E0B',
            gap: 12,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <BellRing size={16} color="#B45309" />
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#92400E' }}>
                Notification Access Needed
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: '#B45309' }}>
              Tap to allow DhwaniPay to intercept & announce incoming UPI payments.
            </Text>
          </View>
          <StatusPill label="ENABLE" tone="warning" small />
        </Pressable>
      )}

      {/* Greeting */}
      <View style={{ gap: 4 }}>
        <Eyebrow color={colors.muted}>Shop Dashboard</Eyebrow>
        <Text style={{ color: colors.text, fontSize: 27, lineHeight: 32, fontWeight: '900', letterSpacing: -0.8 }}>
          Serve customers.{'\n'}We'll announce payments.
        </Text>
      </View>

      {/* Main Soundbox Control Card */}
      <View
        style={{
          backgroundColor: '#07533F',
          borderRadius: 24,
          padding: 20,
          overflow: 'hidden',
          gap: 16,
        }}
      >
        <View
          style={{
            position: 'absolute',
            right: -20,
            top: -25,
            width: 150,
            height: 150,
            borderRadius: 75,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.10)',
          }}
        />
        <View
          style={{
            position: 'absolute',
            right: 6,
            top: 2,
            width: 110,
            height: 110,
            borderRadius: 55,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.10)',
          }}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <StatusPill
            label={statusLabel}
            tone="dark"
            icon={announcementsEnabled ? Volume2 : Pause}
          />
          <AudioLines color="rgba(255,255,255,0.85)" size={24} />
        </View>

        <View style={{ gap: 6 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 21, lineHeight: 26, fontWeight: '900', letterSpacing: -0.4 }}>
            {announcementsEnabled
              ? 'Voice soundbox is listening'
              : 'Voice announcements are paused'}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.82)', fontSize: 13, lineHeight: 20 }}>
            {announcementsEnabled
              ? 'Incoming UPI payments will be announced aloud instantly in your chosen language.'
              : 'Announcements are temporarily muted. Tap resume when ready.'}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button
            title={announcementsEnabled ? 'Pause Voice' : 'Resume Voice'}
            onPress={() => setAnnouncementsEnabled(!announcementsEnabled)}
            variant="light"
            icon={announcementsEnabled ? Pause : Play}
            style={{ flex: 1 }}
          />
          <Pressable
            onPress={() => router.push('/voice-test')}
            accessibilityRole="button"
            accessibilityLabel="Test soundbox voice"
            style={({ pressed }) => ({
              height: 48,
              width: 48,
              borderRadius: 15,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.18)',
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <Volume2 color="#FFFFFF" size={21} />
          </Pressable>
        </View>
      </View>

      {/* Today's Financial Overview Cards */}
      <View style={{ gap: 10 }}>
        <SectionHeading title="Today's Summary" />
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
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <TrendingUp size={16} color={colors.primary} />
              <Text style={{ fontSize: 10, fontWeight: '800', color: colors.primaryDark }}>RECEIVED</Text>
            </View>
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: '900', letterSpacing: -0.6 }}>
              ₹{totalReceived.toLocaleString('en-IN')}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 11 }}>{todayEvents.length} payments today</Text>
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
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <TrendingDown size={16} color={colors.error} />
              <Text style={{ fontSize: 10, fontWeight: '800', color: colors.error }}>EXPENSES</Text>
            </View>
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: '900', letterSpacing: -0.6 }}>
              ₹{totalExpenses.toLocaleString('en-IN')}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 11 }}>
              {pendingExpenses.length > 0 ? `₹${pendingTotal} pending` : 'All paid'}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={{ gap: 10 }}>
        <SectionHeading title="Quick Actions" />

        {/* Real In-Person Payment Standee Collection Button */}
        <Pressable
          onPress={() => router.push('/collect')}
          style={({ pressed }) => ({
            padding: 16,
            borderRadius: 20,
            backgroundColor: colors.primarySoft,
            borderWidth: 1.5,
            borderColor: colors.primary,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <QrCode size={26} color="#FFFFFF" strokeWidth={2.2} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <Text style={{ color: colors.primaryDark, fontWeight: '900', fontSize: 16 }}>
                Collect UPI Payment
              </Text>
              <StatusPill label="INSTANT QR" tone="success" small />
            </View>
            <Text style={{ color: colors.muted, fontSize: 12 }}>
              Generate dynamic amount QR & standees · Instant soundbox
            </Text>
          </View>
          <ArrowRight size={20} color={colors.primary} />
        </Pressable>

        {/* QR Code Vault Button */}
        <Pressable
          onPress={() => router.push('/qr-vault')}
          style={({ pressed }) => ({
            padding: 14,
            borderRadius: 18,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: '#0F172A',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FolderLock size={22} color="#38BDF8" strokeWidth={2.2} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 15 }}>
                QR Code Vault
              </Text>
              <StatusPill label={`${vaultQRs.length} SAVED`} tone="neutral" small />
            </View>
            <Text style={{ color: colors.muted, fontSize: 12 }}>
              PhonePe, GPay & Paytm standees · Upload & present
            </Text>
          </View>
          <ArrowRight size={18} color={colors.muted} />
        </Pressable>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable
            onPress={() => router.push('/(tabs)/expenses')}
            style={({ pressed }) => ({
              flex: 1,
              padding: 14,
              borderRadius: 18,
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 13,
                backgroundColor: colors.primarySoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Plus size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14 }}>Add Expense</Text>
              <Text style={{ color: colors.muted, fontSize: 11 }}>Record purchases</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => router.push('/voice-test')}
            style={({ pressed }) => ({
              flex: 1,
              padding: 14,
              borderRadius: 18,
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 13,
                backgroundColor: colors.surfaceSoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Volume2 size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14 }}>Test Voice</Text>
              <Text style={{ color: colors.muted, fontSize: 11 }}>Speaker check</Text>
            </View>
          </Pressable>
        </View>
      </View>

      {/* Recent Expenses List with 1-tap Done & Voice */}
      <View style={{ gap: 10 }}>
        <SectionHeading
          title="Recent Expenses"
          action="View all"
          onAction={() => router.push('/(tabs)/expenses')}
        />
        <Card padding={14}>
          {expenses.length > 0 ? (
            expenses.slice(0, 3).map((expense, index) => (
              <View key={expense.id}>
                <ExpenseRow
                  expense={expense}
                  onToggleStatus={() => toggleExpenseStatus(expense.id, true)}
                  onSpeak={() => speakExpense(expense)}
                  onDelete={() => removeExpense(expense.id)}
                  compact
                />
                {index < Math.min(expenses.length, 3) - 1 ? (
                  <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 2 }} />
                ) : null}
              </View>
            ))
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 18, gap: 7 }}>
              <Receipt size={24} color={colors.muted} />
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14 }}>No expenses recorded yet.</Text>
              <Button
                title="+ Add First Expense"
                compact
                variant="secondary"
                onPress={() => router.push('/(tabs)/expenses')}
              />
            </View>
          )}
        </Card>
      </View>

      {/* Latest Soundbox Received Payment */}
      <View style={{ gap: 10 }}>
        <SectionHeading
          title="Recent Soundbox Payments"
          action="View all"
          onAction={() => router.push('/(tabs)/activity')}
        />
        {latestPayment ? (
          <Card padding={14}>
            <EventRow
              amount={latestPayment.amount}
              source={latestPayment.source}
              time={latestPayment.time}
              state={latestPayment.state}
              onPress={() => router.push(`/event/${latestPayment.id}` as any)}
              onSpeak={() => latestPayment.amount && speakPayment(latestPayment.amount, latestPayment.source)}
            />
          </Card>
        ) : (
          <Card padding={18}>
            <View style={{ alignItems: 'center', gap: 7, paddingVertical: 6 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 15,
                  backgroundColor: colors.surfaceSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BellRing size={20} color={colors.muted} />
              </View>
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15 }}>
                Waiting for incoming payments
              </Text>
              <Text style={{ color: colors.muted, textAlign: 'center', fontSize: 12, lineHeight: 18 }}>
                When customers pay via UPI QR code, DhwaniPay will announce the payment here.
              </Text>
            </View>
          </Card>
        )}
      </View>
    </Screen>
  );
}
