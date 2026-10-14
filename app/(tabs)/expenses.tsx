import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  Plus,
  Search,
  CheckCircle2,
  Clock,
  IndianRupee,
  Volume2,
  Filter,
  X,
  Coffee,
  ShoppingBag,
  Zap,
  Building2,
  Users,
  Package,
  Receipt,
} from 'lucide-react-native';
import {
  useApp,
  Expense,
  ExpenseCategory,
  ExpenseStatus,
} from '@/context/AppContext';
import {
  Button,
  Card,
  ExpenseRow,
  PageIntro,
  Screen,
  SectionHeading,
  StatusPill,
} from '@/components/ui';
import { confirmAction } from '@/utils/confirm';

const CATEGORIES: ExpenseCategory[] = [
  'Inventory',
  'Food & Tea',
  'Utilities',
  'Rent',
  'Salary',
  'Supplies',
  'Other',
];

const PAYMENT_METHODS = ['UPI', 'Cash', 'Card', 'Bank Transfer'] as const;

type FilterStatus = 'All' | 'Done' | 'Pending';

export default function ExpensesScreen() {
  const { colors, expenses, addExpense, removeExpense, toggleExpenseStatus, speakExpense } =
    useApp();

  const [statusFilter, setStatusFilter] = useState<FilterStatus>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  // New expense form state
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState<ExpenseCategory>('Inventory');
  const [newStatus, setNewStatus] = useState<ExpenseStatus>('done');
  const [newMethod, setNewMethod] = useState<'UPI' | 'Cash' | 'Card' | 'Bank Transfer'>('Cash');
  const [newNote, setNewNote] = useState('');
  const [announceOnAdd, setAnnounceOnAdd] = useState(true);

  // Metrics
  const totalAmount = useMemo(
    () => expenses.reduce((sum, item) => sum + item.amount, 0),
    [expenses]
  );
  const doneAmount = useMemo(
    () =>
      expenses
        .filter((item) => item.status === 'done')
        .reduce((sum, item) => sum + item.amount, 0),
    [expenses]
  );
  const pendingAmount = useMemo(
    () =>
      expenses
        .filter((item) => item.status === 'pending')
        .reduce((sum, item) => sum + item.amount, 0),
    [expenses]
  );
  const doneCount = useMemo(
    () => expenses.filter((item) => item.status === 'done').length,
    [expenses]
  );
  const pendingCount = useMemo(
    () => expenses.filter((item) => item.status === 'pending').length,
    [expenses]
  );

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      // Status filter
      if (statusFilter === 'Done' && item.status !== 'done') return false;
      if (statusFilter === 'Pending' && item.status !== 'pending') return false;

      // Category filter
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;

      // Search query
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesNote = item.note ? item.note.toLowerCase().includes(q) : false;
        const matchesCategory = item.category.toLowerCase().includes(q);
        if (!matchesTitle && !matchesNote && !matchesCategory) return false;
      }

      return true;
    });
  }, [expenses, statusFilter, selectedCategory, searchQuery]);

  const handleOpenAddModal = () => {
    setNewTitle('');
    setNewAmount('');
    setNewCategory('Inventory');
    setNewStatus('done');
    setNewMethod('Cash');
    setNewNote('');
    setModalVisible(true);
  };

  const handleSaveExpense = () => {
    const trimmedTitle = newTitle.trim();
    const parsedAmount = parseFloat(newAmount.trim());

    if (!trimmedTitle) {
      Alert.alert('Missing Title', 'Please enter a description or name for this expense.');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount in ₹.');
      return;
    }

    const now = new Date();
    const timeString = now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    addExpense(
      {
        title: trimmedTitle,
        amount: parsedAmount,
        category: newCategory,
        date: `Today, ${timeString}`,
        status: newStatus,
        paymentMethod: newMethod,
        note: newNote.trim() || undefined,
      },
      announceOnAdd
    );

    setModalVisible(false);
  };

  const handleDeleteExpense = (id: string, title: string) => {
    confirmAction(
      'Remove Expense',
      `Are you sure you want to remove "${title}"?`,
      () => removeExpense(id),
      { confirmText: 'Remove', isDestructive: true }
    );
  };

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <PageIntro
          eyebrow="Merchant Ledger"
          title="Expenses"
          description="Track, announce, and manage your daily shop expenses."
        />
      </View>

      {/* Top Action Button */}
      <Button
        title="+ Add New Expense"
        icon={Plus}
        onPress={handleOpenAddModal}
        style={{ marginTop: -10 }}
      />

      {/* Financial Overview Metrics */}
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
            <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '800' }}>TOTAL EXPENSES</Text>
          </View>
          <Text style={{ color: colors.text, fontSize: 24, fontWeight: '900', letterSpacing: -0.6 }}>
            ₹{totalAmount.toLocaleString('en-IN')}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 11 }}>{expenses.length} records</Text>
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
            <CheckCircle2 size={15} color={colors.primaryDark} />
            <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '800' }}>PAID / DONE</Text>
          </View>
          <Text style={{ color: colors.primaryDark, fontSize: 24, fontWeight: '900', letterSpacing: -0.6 }}>
            ₹{doneAmount.toLocaleString('en-IN')}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 11 }}>{doneCount} paid</Text>
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
            <Clock size={15} color={colors.warning} />
            <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '800' }}>PENDING DUE</Text>
          </View>
          <Text style={{ color: colors.warning, fontSize: 24, fontWeight: '900', letterSpacing: -0.6 }}>
            ₹{pendingAmount.toLocaleString('en-IN')}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 11 }}>{pendingCount} due</Text>
        </View>
      </View>

      {/* Filter Tabs: All, Done, Pending */}
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['All', 'Done', 'Pending'] as FilterStatus[]).map((tab) => {
            const active = tab === statusFilter;
            const count =
              tab === 'All'
                ? expenses.length
                : tab === 'Done'
                ? doneCount
                : pendingCount;
            return (
              <Pressable
                key={tab}
                onPress={() => setStatusFilter(tab)}
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
                <Text
                  style={{
                    fontSize: 12,
                    color: active ? '#FFFFFF' : colors.muted,
                    fontWeight: '800',
                  }}
                >
                  {tab === 'Done' ? 'Paid / Done' : tab === 'Pending' ? 'Pending Due' : 'All'} ({count})
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Search Bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 14,
            paddingHorizontal: 12,
            height: 44,
            gap: 9,
          }}
        >
          <Search size={18} color={colors.muted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by title, category, note..."
            placeholderTextColor={colors.muted}
            style={{
              flex: 1,
              color: colors.text,
              fontSize: 14,
              paddingVertical: 0,
            }}
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <X size={16} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>

        {/* Category Horizontal Scroll Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 2 }}>
          {['All', ...CATEGORIES].map((cat) => {
            const active = cat === selectedCategory;
            return (
              <Pressable
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={{
                  paddingHorizontal: 13,
                  paddingVertical: 7,
                  borderRadius: 100,
                  backgroundColor: active ? colors.primarySoft : colors.surface,
                  borderColor: active ? colors.primary : colors.border,
                  borderWidth: 1,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: active ? colors.primaryDark : colors.muted,
                  }}
                >
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Expenses List */}
      <View style={{ gap: 11 }}>
        <SectionHeading
          title={`Expenses (${filteredExpenses.length})`}
          action={expenses.length > 0 ? 'Announce All' : undefined}
          onAction={() => {
            if (expenses.length > 0) {
              speakExpense(expenses[0]);
            }
          }}
        />

        <Card padding={15}>
          {filteredExpenses.length > 0 ? (
            filteredExpenses.map((expense, index) => (
              <View key={expense.id}>
                <ExpenseRow
                  expense={expense}
                  onToggleStatus={() => toggleExpenseStatus(expense.id, true)}
                  onSpeak={() => speakExpense(expense)}
                  onDelete={() => handleDeleteExpense(expense.id, expense.title)}
                />
                {index < filteredExpenses.length - 1 ? (
                  <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 3 }} />
                ) : null}
              </View>
            ))
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 28, gap: 10 }}>
              <View
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 18,
                  backgroundColor: colors.surfaceSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Receipt size={26} color={colors.muted} />
              </View>
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>
                No expenses found
              </Text>
              <Text
                style={{
                  color: colors.muted,
                  textAlign: 'center',
                  fontSize: 13,
                  lineHeight: 20,
                  paddingHorizontal: 20,
                }}
              >
                {searchQuery || statusFilter !== 'All' || selectedCategory !== 'All'
                  ? 'Try adjusting your filters or search terms.'
                  : 'Start recording daily purchases, chai, bills, and stock expenses.'}
              </Text>
              <Button
                title="+ Add Expense"
                compact
                variant="primary"
                onPress={handleOpenAddModal}
                style={{ marginTop: 6 }}
              />
            </View>
          )}
        </Card>
      </View>

      {/* Add Expense Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 22,
              maxHeight: '90%',
              gap: 16,
            }}
          >
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ color: colors.text, fontSize: 20, fontWeight: '900' }}>
                  Add Expense
                </Text>
                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
                  Record a shop purchase, bill, or payout
                </Text>
              </View>
              <Pressable
                onPress={() => setModalVisible(false)}
                hitSlop={10}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: colors.surfaceSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
              {/* Title Input */}
              <View style={{ gap: 6 }}>
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: '800' }}>
                  Expense Title *
                </Text>
                <TextInput
                  value={newTitle}
                  onChangeText={setNewTitle}
                  placeholder="e.g. Milk & Dairy stock, Chai for staff, Rent"
                  placeholderTextColor={colors.muted}
                  style={{
                    backgroundColor: colors.surfaceSoft,
                    borderColor: colors.border,
                    borderWidth: 1,
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    color: colors.text,
                    fontSize: 15,
                  }}
                />
              </View>

              {/* Amount Input */}
              <View style={{ gap: 6 }}>
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: '800' }}>
                  Amount in ₹ *
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.surfaceSoft,
                    borderColor: colors.border,
                    borderWidth: 1,
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    height: 50,
                    gap: 8,
                  }}
                >
                  <Text style={{ color: colors.primary, fontSize: 18, fontWeight: '900' }}>₹</Text>
                  <TextInput
                    value={newAmount}
                    onChangeText={setNewAmount}
                    placeholder="0"
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                    style={{
                      flex: 1,
                      color: colors.text,
                      fontSize: 18,
                      fontWeight: '800',
                      paddingVertical: 0,
                    }}
                  />
                </View>
              </View>

              {/* Category Picker */}
              <View style={{ gap: 6 }}>
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: '800' }}>
                  Category
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                  {CATEGORIES.map((cat) => {
                    const active = cat === newCategory;
                    return (
                      <Pressable
                        key={cat}
                        onPress={() => setNewCategory(cat)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 7,
                          borderRadius: 10,
                          backgroundColor: active ? colors.primary : colors.surfaceSoft,
                          borderColor: active ? colors.primary : colors.border,
                          borderWidth: 1,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '700',
                            color: active ? '#FFFFFF' : colors.text,
                          }}
                        >
                          {cat}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Status Picker (Done vs Pending) */}
              <View style={{ gap: 6 }}>
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: '800' }}>
                  Status
                </Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Pressable
                    onPress={() => setNewStatus('done')}
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      paddingVertical: 12,
                      borderRadius: 14,
                      backgroundColor: newStatus === 'done' ? colors.primarySoft : colors.surfaceSoft,
                      borderColor: newStatus === 'done' ? colors.primary : colors.border,
                      borderWidth: 1.5,
                    }}
                  >
                    <CheckCircle2
                      size={16}
                      color={newStatus === 'done' ? colors.primaryDark : colors.muted}
                      strokeWidth={2.4}
                    />
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '800',
                        color: newStatus === 'done' ? colors.primaryDark : colors.muted,
                      }}
                    >
                      Paid / Done
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setNewStatus('pending')}
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      paddingVertical: 12,
                      borderRadius: 14,
                      backgroundColor: newStatus === 'pending' ? colors.warningSoft : colors.surfaceSoft,
                      borderColor: newStatus === 'pending' ? colors.warning : colors.border,
                      borderWidth: 1.5,
                    }}
                  >
                    <Clock
                      size={16}
                      color={newStatus === 'pending' ? colors.warning : colors.muted}
                      strokeWidth={2.4}
                    />
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '800',
                        color: newStatus === 'pending' ? colors.warning : colors.muted,
                      }}
                    >
                      Pending Due
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Payment Method */}
              <View style={{ gap: 6 }}>
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: '800' }}>
                  Payment Method
                </Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {PAYMENT_METHODS.map((method) => {
                    const active = method === newMethod;
                    return (
                      <Pressable
                        key={method}
                        onPress={() => setNewMethod(method)}
                        style={{
                          flex: 1,
                          alignItems: 'center',
                          justifyContent: 'center',
                          paddingVertical: 9,
                          borderRadius: 10,
                          backgroundColor: active ? colors.primary : colors.surfaceSoft,
                          borderColor: active ? colors.primary : colors.border,
                          borderWidth: 1,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: '700',
                            color: active ? '#FFFFFF' : colors.text,
                          }}
                        >
                          {method}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Note / Remarks */}
              <View style={{ gap: 6 }}>
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: '800' }}>
                  Note (Optional)
                </Text>
                <TextInput
                  value={newNote}
                  onChangeText={setNewNote}
                  placeholder="e.g. Paid to vendor Suresh, Bill receipt #42"
                  placeholderTextColor={colors.muted}
                  style={{
                    backgroundColor: colors.surfaceSoft,
                    borderColor: colors.border,
                    borderWidth: 1,
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    color: colors.text,
                    fontSize: 14,
                  }}
                />
              </View>

              {/* Announce Toggle */}
              <Pressable
                onPress={() => setAnnounceOnAdd(!announceOnAdd)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  backgroundColor: colors.surfaceSoft,
                  padding: 12,
                  borderRadius: 14,
                }}
              >
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    backgroundColor: colors.primarySoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Volume2 size={17} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '800', fontSize: 13 }}>
                    Announce with Dhwani voice
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 11 }}>
                    Speak aloud when saved
                  </Text>
                </View>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    borderWidth: 1.5,
                    borderColor: announceOnAdd ? colors.primary : colors.muted,
                    backgroundColor: announceOnAdd ? colors.primary : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {announceOnAdd ? <CheckCircle2 size={16} color="#FFFFFF" /> : null}
                </View>
              </Pressable>

              {/* Actions */}
              <View style={{ gap: 9, marginTop: 6, marginBottom: 16 }}>
                <Button title="Save Expense" onPress={handleSaveExpense} />
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={() => setModalVisible(false)}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
