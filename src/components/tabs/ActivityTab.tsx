import React, { useState, useMemo } from 'react';
import {
  Volume2,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Copy,
  Check,
  Trash2,
  History,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PaymentEvent } from '../../types';

export function ActivityTab() {
  const { events, speakPayment, clearEvents } = useApp();
  const [filterState, setFilterState] = useState<'All' | 'Played' | 'Pending' | 'Failed'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const playedCount = events.filter((e) => e.state === 'Played').length;
  const totalAmount = events.reduce((sum, e) => sum + (e.amount || 0), 0);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (filterState !== 'All' && e.state !== filterState) return false;
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const matchSource = e.source.toLowerCase().includes(q);
        const matchPayer = e.payerName ? e.payerName.toLowerCase().includes(q) : false;
        const matchUtr = e.utr ? e.utr.toLowerCase().includes(q) : false;
        const matchAmount = e.amount ? e.amount.toString().includes(q) : false;
        if (!matchSource && !matchPayer && !matchUtr && !matchAmount) return false;
      }
      return true;
    });
  }, [events, filterState, searchQuery]);

  const handleCopyUtr = (utr: string, id: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(utr);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Soundbox Payment Activity
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Review all intercepted UPI transactions and announcement states
          </p>
        </div>
        {events.length > 0 && (
          <button
            onClick={() => {
              if (confirm('Clear all local payment history?')) {
                clearEvents();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Amount Received
          </span>
          <p className="text-2xl font-black text-slate-900">
            ₹{totalAmount.toLocaleString('en-IN')}
          </p>
          <p className="text-xs font-semibold text-slate-500">
            Across {events.length} transaction{events.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
            Announced Aloud
          </span>
          <p className="text-2xl font-black text-emerald-700">
            {playedCount} / {events.length}
          </p>
          <p className="text-xs font-semibold text-emerald-600">
            Voice confirmations played
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by amount, payer name, or UTR number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="flex gap-1 bg-white border border-slate-200 p-1 rounded-xl overflow-x-auto">
            {(['All', 'Played', 'Pending', 'Failed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterState(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  filterState === st
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-2.5">
        {filteredEvents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
            <History className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No payment events found</p>
            <p className="text-xs text-slate-400">
              No transactions match the selected filter criteria.
            </p>
          </div>
        ) : (
          filteredEvents.map((event) => {
            return (
              <div
                key={event.id}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-3 hover:border-slate-300 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-800 font-black flex items-center justify-center text-sm shrink-0 border border-emerald-100">
                    ₹
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-slate-900 tracking-tight">
                        ₹{event.amount?.toLocaleString('en-IN') || 0}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        via {event.source}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 flex-wrap">
                      <span>{event.time}</span>
                      {event.payerName && <span>• {event.payerName}</span>}
                      {event.utr && (
                        <button
                          onClick={() => handleCopyUtr(event.utr!, event.id)}
                          className="flex items-center gap-1 text-slate-500 hover:text-slate-800 font-mono"
                          title="Copy UTR ID"
                        >
                          <span>UTR: {event.utr}</span>
                          {copiedId === event.id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-400" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {event.amount && (
                    <button
                      onClick={() =>
                        speakPayment(event.amount!, event.source, event.payerName)
                      }
                      className="p-2 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition"
                      title="Play Voice Announcement"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  )}
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      event.state === 'Played'
                        ? 'bg-emerald-100 text-emerald-800'
                        : event.state === 'Failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {event.state}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
