import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronRight,
  Volume2,
  CheckCircle2,
  Clock,
  Trash2,
  ShoppingBag,
  Coffee,
  Zap,
  Building2,
  Users,
  Package,
  Receipt,
  RotateCcw,
  type LucideIcon,
} from 'lucide-react-native';
import { useApp, Expense } from '@/context/AppContext';

export function Screen({ children, scroll = true, contentStyle }: { children: React.ReactNode; scroll?: boolean; contentStyle?: ViewStyle }) {
  const { colors } = useApp();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      {scroll ? (
        <ScrollView contentContainerStyle={[styles.screenContent, contentStyle]} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.screenContent, { flex: 1 }, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function BrandMark({ size = 42, inverse = false }: { size?: number; inverse?: boolean }) {
  const { colors } = useApp();
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.34, backgroundColor: inverse ? 'rgba(255,255,255,0.16)' : colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
      <Volume2 size={size * 0.52} color={inverse ? '#FFFFFF' : colors.primary} strokeWidth={2.4} />
      <Text style={{ position: 'absolute', right: size * 0.09, bottom: size * 0.04, fontSize: size * 0.24, fontWeight: '900', color: inverse ? '#FFFFFF' : colors.primary }}>₹</Text>
    </View>
  );
}

export function Header({ title, subtitle, back, right }: { title: string; subtitle?: string; back?: React.ReactNode; right?: React.ReactNode }) {
  const { colors } = useApp();
  return (
    <View style={styles.headerRow}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
        {back}
        <View style={{ flex: 1 }}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>{title}</Text>
          {subtitle ? <Text style={[styles.pageSubtitle, { color: colors.muted }]}>{subtitle}</Text> : null}
        </View>
      </View>
      {right}
    </View>
  );
}

export function Eyebrow({ children, color }: { children: React.ReactNode; color?: string }) {
  const { colors } = useApp();
  return <Text style={[styles.eyebrow, { color: color ?? colors.muted }]}>{children}</Text>;
}

export function SectionHeading({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const { colors } = useApp();
  return (
    <View style={styles.sectionHeading}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '700' }}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Card({ children, style, padding = 16 }: { children: React.ReactNode; style?: ViewStyle; padding?: number }) {
  const { colors } = useApp();
  return <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding }, style]}>{children}</View>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon: Icon,
  disabled = false,
  style,
  compact = false,
  accessibilityLabel,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'light';
  icon?: LucideIcon;
  disabled?: boolean;
  style?: ViewStyle;
  compact?: boolean;
  accessibilityLabel?: string;
}) {
  const { colors } = useApp();
  const backgroundColor =
    variant === 'primary'
      ? colors.primary
      : variant === 'danger'
      ? colors.errorSoft
      : variant === 'light'
      ? '#FFFFFF'
      : variant === 'secondary'
      ? colors.surfaceSoft
      : 'transparent';
  const foregroundColor =
    variant === 'primary'
      ? '#FFFFFF'
      : variant === 'danger'
      ? colors.error
      : variant === 'light'
      ? '#07533F'
      : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor,
          opacity: disabled ? 0.45 : pressed ? 0.82 : 1,
          borderColor: variant === 'secondary' ? colors.border : 'transparent',
          paddingVertical: compact ? 10 : 15,
          paddingHorizontal: compact ? 13 : 17,
        },
        style,
      ]}
    >
      {Icon ? <Icon size={compact ? 17 : 19} color={foregroundColor} strokeWidth={2.25} /> : null}
      <Text style={{ color: foregroundColor, fontWeight: '700', fontSize: compact ? 14 : 16 }}>{title}</Text>
    </Pressable>
  );
}

export function StatusPill({
  label,
  tone = 'neutral',
  icon: Icon,
  small = false,
}: {
  label: string;
  tone?: 'success' | 'warning' | 'error' | 'neutral' | 'dark';
  icon?: LucideIcon;
  small?: boolean;
}) {
  const { colors } = useApp();
  const map = {
    success: { bg: colors.primarySoft, fg: colors.primaryDark },
    warning: { bg: colors.warningSoft, fg: colors.warning },
    error: { bg: colors.errorSoft, fg: colors.error },
    neutral: { bg: colors.surfaceSoft, fg: colors.muted },
    dark: { bg: 'rgba(255,255,255,0.14)', fg: '#FFFFFF' },
  }[tone];
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: small ? 8 : 10,
        paddingVertical: small ? 5 : 7,
        borderRadius: 100,
        backgroundColor: map.bg,
      }}
    >
      {Icon ? <Icon size={small ? 12 : 14} color={map.fg} strokeWidth={2.4} /> : null}
      <Text style={{ color: map.fg, fontSize: small ? 11 : 12, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

export function SettingRow({
  title,
  description,
  icon: Icon,
  onPress,
  right,
  danger = false,
}: {
  title: string;
  description?: string;
  icon: LucideIcon;
  onPress?: () => void;
  right?: React.ReactNode;
  danger?: boolean;
}) {
  const { colors } = useApp();
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.settingRow, { opacity: pressed && onPress ? 0.72 : 1 }]}>
      <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: danger ? colors.errorSoft : colors.surfaceSoft, alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={20} color={danger ? colors.error : colors.primary} strokeWidth={2.1} />
      </View>
      <View style={{ flex: 1, paddingRight: 8 }}>
        <Text style={{ color: danger ? colors.error : colors.text, fontWeight: '700', fontSize: 15 }}>{title}</Text>
        {description ? <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: 3 }}>{description}</Text> : null}
      </View>
      {right ?? (onPress ? <ChevronRight size={19} color={colors.muted} /> : null)}
    </Pressable>
  );
}

export function InfoBanner({ title, text, tone = 'warning', icon: Icon }: { title: string; text: string; tone?: 'warning' | 'success' | 'error' | 'info'; icon?: LucideIcon }) {
  const { colors } = useApp();
  const c =
    tone === 'success'
      ? { bg: colors.primarySoft, fg: colors.primaryDark }
      : tone === 'error'
      ? { bg: colors.errorSoft, fg: colors.error }
      : tone === 'info'
      ? { bg: colors.surfaceSoft, fg: colors.primary }
      : { bg: colors.warningSoft, fg: colors.warning };
  return (
    <View style={{ padding: 14, backgroundColor: c.bg, borderRadius: 16, flexDirection: 'row', gap: 10 }}>
      {Icon ? <Icon size={20} color={c.fg} strokeWidth={2.2} style={{ marginTop: 1 }} /> : null}
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ color: c.fg, fontWeight: '800', fontSize: 14 }}>{title}</Text>
        <Text style={{ color: c.fg, fontSize: 13, lineHeight: 19 }}>{text}</Text>
      </View>
    </View>
  );
}

export function Divider() {
  const { colors } = useApp();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: 2 }} />;
}

export function MetricCard({ label, value, detail, icon: Icon, accent = false }: { label: string; value: string; detail?: string; icon: LucideIcon; accent?: boolean }) {
  const { colors } = useApp();
  return (
    <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: accent ? colors.primarySoft : colors.surfaceSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color={accent ? colors.primary : colors.muted} />
        </View>
        {accent ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary }} /> : null}
      </View>
      <Text style={{ color: colors.text, fontSize: 26, fontWeight: '800', marginTop: 15, letterSpacing: -0.8 }}>{value}</Text>
      <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700', marginTop: 3 }}>{label}</Text>
      {detail ? <Text style={{ color: colors.muted, fontSize: 11, marginTop: 5, lineHeight: 15 }}>{detail}</Text> : null}
    </View>
  );
}

export function PrimaryScreenAction({ title, description, icon: Icon, onPress }: { title: string; description: string; icon: LucideIcon; onPress: () => void }) {
  const { colors } = useApp();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}>
      <View style={{ width: 42, height: 42, backgroundColor: colors.primarySoft, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, color: colors.text, fontWeight: '800' }}>{title}</Text>
        <Text style={{ marginTop: 3, fontSize: 12, color: colors.muted, lineHeight: 17 }}>{description}</Text>
      </View>
      <ChevronRight size={18} color={colors.muted} />
    </Pressable>
  );
}

export function EventRow({
  amount,
  source,
  time,
  state,
  simulated,
  onPress,
  onSpeak,
}: {
  amount?: number;
  source: string;
  time: string;
  state: 'Played' | 'Pending' | 'Failed';
  simulated?: boolean;
  onPress?: () => void;
  onSpeak?: () => void;
}) {
  const { colors } = useApp();
  const tone = state === 'Played' ? 'success' : state === 'Failed' ? 'error' : 'warning';
  const label = state === 'Played' ? 'Announced' : state === 'Failed' ? 'Failed' : 'Pending';
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, opacity: pressed && onPress ? 0.75 : 1 })}>
      <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: state === 'Failed' ? colors.errorSoft : colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
        <Volume2 size={20} color={state === 'Failed' ? colors.error : colors.primary} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>{amount != null ? `₹${amount}` : 'Payment notification'}</Text>
          <StatusPill label={label} tone={tone} small />
        </View>
        <Text numberOfLines={1} style={{ fontSize: 12, color: colors.muted }}>{source} · {time}</Text>
      </View>
      {onSpeak ? (
        <Pressable
          onPress={onSpeak}
          hitSlop={6}
          style={({ pressed }) => ({
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: colors.surfaceSoft,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Volume2 size={16} color={colors.primary} />
        </Pressable>
      ) : null}
      {onPress ? <ChevronRight size={18} color={colors.muted} /> : null}
    </Pressable>
  );
}

export function ExpenseRow({
  expense,
  onToggleStatus,
  onSpeak,
  onDelete,
  compact = false,
}: {
  expense: Expense;
  onToggleStatus?: () => void;
  onSpeak?: () => void;
  onDelete?: () => void;
  compact?: boolean;
}) {
  const { colors } = useApp();
  const isDone = expense.status === 'done';

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Inventory':
        return ShoppingBag;
      case 'Food & Tea':
        return Coffee;
      case 'Utilities':
        return Zap;
      case 'Rent':
        return Building2;
      case 'Salary':
        return Users;
      case 'Supplies':
        return Package;
      default:
        return Receipt;
    }
  };

  const CategoryIcon = getCategoryIcon(expense.category);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: compact ? 10 : 13,
      }}
    >
      <View
        style={{
          width: compact ? 38 : 44,
          height: compact ? 38 : 44,
          borderRadius: 14,
          backgroundColor: isDone ? colors.primarySoft : colors.surfaceSoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CategoryIcon
          size={compact ? 18 : 20}
          color={isDone ? colors.primary : colors.muted}
          strokeWidth={2.2}
        />
      </View>

      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <Text
            numberOfLines={1}
            style={{
              color: colors.text,
              fontWeight: '800',
              fontSize: compact ? 14 : 15,
              flex: 1,
              textDecorationLine: isDone ? 'line-through' : 'none',
              opacity: isDone ? 0.75 : 1,
            }}
          >
            {expense.title}
          </Text>
          <Text
            style={{
              color: isDone ? colors.primaryDark : colors.text,
              fontWeight: '900',
              fontSize: compact ? 15 : 17,
              letterSpacing: -0.4,
            }}
          >
            ₹{expense.amount.toLocaleString('en-IN')}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Text style={{ fontSize: 12, color: colors.muted }}>
            {expense.category} · {expense.date}
          </Text>
          {expense.paymentMethod ? (
            <View
              style={{
                backgroundColor: colors.surfaceSoft,
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 4,
              }}
            >
              <Text style={{ fontSize: 10, color: colors.muted, fontWeight: '700' }}>
                {expense.paymentMethod}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 4 }}>
          {onToggleStatus ? (
            <Pressable
              onPress={onToggleStatus}
              hitSlop={6}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
                backgroundColor: isDone ? colors.primarySoft : colors.warningSoft,
              }}
            >
              {isDone ? (
                <CheckCircle2 size={13} color={colors.primaryDark} strokeWidth={2.4} />
              ) : (
                <Clock size={13} color={colors.warning} strokeWidth={2.4} />
              )}
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '800',
                  color: isDone ? colors.primaryDark : colors.warning,
                }}
              >
                {isDone ? 'Paid / Done' : 'Mark as Done'}
              </Text>
            </Pressable>
          ) : null}

          {onSpeak ? (
            <Pressable
              onPress={onSpeak}
              hitSlop={6}
              accessibilityLabel="Announce expense voice"
              style={({ pressed }) => ({
                width: 28,
                height: 28,
                borderRadius: 8,
                backgroundColor: colors.surfaceSoft,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Volume2 size={14} color={colors.primary} />
            </Pressable>
          ) : null}

          {onDelete ? (
            <Pressable
              onPress={onDelete}
              hitSlop={6}
              accessibilityLabel="Delete expense"
              style={({ pressed }) => ({
                width: 28,
                height: 28,
                borderRadius: 8,
                backgroundColor: colors.errorSoft,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Trash2 size={14} color={colors.error} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export function PageIntro({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  const { colors } = useApp();
  return (
    <View style={{ gap: 7, marginBottom: 16 }}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <Text style={{ color: colors.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.8, lineHeight: 34 }}>{title}</Text>
      {description ? <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 22 }}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screenContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28, gap: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 54, marginBottom: 2 },
  pageTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.6 },
  pageSubtitle: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  eyebrow: { fontSize: 11, letterSpacing: 1.3, fontWeight: '800', textTransform: 'uppercase' },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 },
  sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  card: { borderRadius: 21, borderWidth: 1, gap: 12 },
  button: { minHeight: 48, borderRadius: 16, flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 68, paddingVertical: 10 },
  metricCard: { flex: 1, borderRadius: 19, borderWidth: 1, padding: 15, minHeight: 148 },
  actionCard: { flex: 1, borderWidth: 1, borderRadius: 19, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11, minHeight: 86 },
});
