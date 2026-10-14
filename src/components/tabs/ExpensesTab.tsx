import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Expense, ExpenseCategory, ExpenseStatus } from '../../types';

const CATEGORIES: ExpenseCategory[] = [
  'Inventory',
  'Food & Tea',
  'Utilities',
  'Rent',
  'Salary',
  'Supplies',
  'Other',
];

const PAYMENT_METHODS = ['Cash', 'UPI', 'Card', 'Bank Transfer'] as const;

export function ExpensesTab() {
  const {
    expenses,
    addExpense,
    removeExpense,
    toggleExpenseStatus,
    speakExpense,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<'All' | 'done' | 'pending'>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Inventory');
  const [status, setStatus] = useState<ExpenseStatus>('done');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card' | 'Bank Transfer'>('Cash');
  const [note, setNote] = useState('');
  const [announceOnAdd, setAnnounceOnAdd] = useState(true);

  // Financial Metrics
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

  // Filtered List
  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      if (statusFilter !== 'All' && item.status !== statusFilter) return false;
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchNote = item.note ? item.note.toLowerCase().includes(q) : false;
        if (!matchTitle && !matchNote) return false;
      }
      return true;
    });
  }, [expenses, statusFilter, selectedCategory, searchQuery]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!title.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid title and positive amount.');
      return;
    }

    addExpense(
      {
        title: title.trim(),
        amount: parsedAmount,
        category,
        date: 'Today',
        status,
        paymentMethod,
        note: note.trim() || undefined,
      },
      announceOnAdd
    );

    setIsAddModalOpen(false);
    setTitle('');
    setAmount('');
    setNote('');
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Shop Expense Ledger
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Daily merchant supplier payouts, inventory & store expenses
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-md shadow-emerald-700/20 transition active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Expense
          </span>
          <p className="text-xl font-black text-slate-900">
            ₹{totalAmount.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] font-semibold text-slate-500">
            {expenses.length} record{expenses.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
            Paid / Settled
          </span>
          <p className="text-xl font-black text-emerald-700">
            ₹{doneAmount.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] font-semibold text-emerald-600">
            Cleared invoices
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
            Due / Pending
          </span>
          <p className="text-xl font-black text-amber-700">
            ₹{pendingAmount.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] font-semibold text-amber-600">
            Unpaid balance
          </p>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search expenses by title or note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="flex gap-1 bg-white border border-slate-200 p-1 rounded-xl">
            {(['All', 'done', 'pending'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition capitalize ${
                  statusFilter === st
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'done' ? 'Settled' : st === 'pending' ? 'Due' : 'All'}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap transition border ${
              selectedCategory === 'All'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap transition border ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Expense Items List */}
      <div className="space-y-2.5">
        {filteredExpenses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
            <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No expenses recorded yet</p>
            <p className="text-xs text-slate-400">
              Track your daily shop supplier payouts, inventory, tea, and utilities.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-2 px-4 py-2 bg-[#087F5B] text-white rounded-xl text-xs font-bold hover:bg-[#07533F] transition shadow-sm inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Record First Expense</span>
            </button>
          </div>
        ) : (
          filteredExpenses.map((exp) => {
            const isDone = exp.status === 'done';
            return (
              <div
                key={exp.id}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-3 hover:border-slate-300 transition"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleExpenseStatus(exp.id)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${
                      isDone
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                    title={isDone ? 'Mark as Pending' : 'Mark as Settled'}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-slate-900">
                        {exp.title}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                        {exp.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span>{exp.date}</span>
                      <span>• {exp.paymentMethod || 'Cash'}</span>
                      {exp.note && <span>• {exp.note}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-base font-black text-slate-900 block">
                      ₹{exp.amount.toLocaleString('en-IN')}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        isDone ? 'text-emerald-700' : 'text-amber-600'
                      }`}
                    >
                      {isDone ? 'Paid' : 'Due'}
                    </span>
                  </div>

                  <button
                    onClick={() => speakExpense(exp)}
                    className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                    title="Speak Expense Announcement"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => removeExpense(exp.id)}
                    className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                    title="Delete Expense"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Expense Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">Add Shop Expense</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Description / Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Milk wholesale crates, Packaging bags"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ExpenseStatus)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="done">Settled (Paid)</option>
                    <option value="pending">Due (Pending)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Vendor Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid via cash to driver"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="announceCheck"
                  checked={announceOnAdd}
                  onChange={(e) => setAnnounceOnAdd(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="announceCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Speak announcement on save
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm rounded-xl shadow-md transition active:scale-[0.98]"
              >
                Record Expense
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
