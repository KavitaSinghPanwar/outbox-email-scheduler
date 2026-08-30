import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import { EmailTable } from '../components/EmailTable';
import { ComposeEmailModal } from '../components/ComposeEmailModal';
import { Email, EmailStatus, EmailListResponse } from '../types';
import { api } from '../services/api';
import {
  RotateCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Inbox,
  Sparkles,
  Ban,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [allEmails, setAllEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | EmailStatus>('ALL');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  const fetchEmails = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      // Fetch all emails to maintain true summary card counts
      const response = await api.get<EmailListResponse>('/emails');
      setAllEmails(response.data.emails);
    } catch (err) {
      console.error('Failed to fetch emails:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  // Auto refresh interval (every 5 seconds)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchEmails();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchEmails]);

  // True summary stats counters calculated from full email list
  const totalCount = allEmails.length;
  const scheduledCount = allEmails.filter((e) => e.status === 'SCHEDULED').length;
  const sentCount = allEmails.filter((e) => e.status === 'SENT').length;
  const failedCount = allEmails.filter((e) => e.status === 'FAILED').length;
  const cancelledCount = allEmails.filter((e) => e.status === 'CANCELLED').length;

  // Filter emails based on selected tab
  const displayedEmails =
    activeTab === 'ALL'
      ? allEmails
      : allEmails.filter((e) => e.status === activeTab);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar onOpenCompose={() => setIsComposeOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header Title & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Email Dashboard</h2>
            <p className="text-sm text-slate-500 mt-1">
              Monitor, schedule, and track background email delivery jobs
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Auto Refresh Toggle */}
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm cursor-pointer hover:bg-slate-50 transition">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span>Auto-refresh (5s)</span>
            </label>

            {/* Manual Refresh Button */}
            <button
              onClick={() => fetchEmails(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-sm transition"
            >
              <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => setActiveTab('ALL')}
            className={`p-5 bg-white rounded-xl border transition cursor-pointer shadow-sm ${
              activeTab === 'ALL' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Total Emails</span>
              <Inbox className="w-5 h-5 text-slate-400" />
            </div>
            <div className="mt-2 text-3xl font-extrabold text-slate-900">{totalCount}</div>
          </div>

          <div
            onClick={() => setActiveTab('SCHEDULED')}
            className={`p-5 bg-white rounded-xl border transition cursor-pointer shadow-sm ${
              activeTab === 'SCHEDULED' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Scheduled</span>
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <div className="mt-2 text-3xl font-extrabold text-blue-600">{scheduledCount}</div>
          </div>

          <div
            onClick={() => setActiveTab('SENT')}
            className={`p-5 bg-white rounded-xl border transition cursor-pointer shadow-sm ${
              activeTab === 'SENT' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-emerald-600 tracking-wider">Sent</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="mt-2 text-3xl font-extrabold text-emerald-600">{sentCount}</div>
          </div>

          <div
            onClick={() => setActiveTab('FAILED')}
            className={`p-5 bg-white rounded-xl border transition cursor-pointer shadow-sm ${
              activeTab === 'FAILED' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-rose-600 tracking-wider">Failed</span>
              <AlertCircle className="w-5 h-5 text-rose-500" />
            </div>
            <div className="mt-2 text-3xl font-extrabold text-rose-600">{failedCount}</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="border-b border-slate-200 flex space-x-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'ALL'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            All Jobs ({totalCount})
          </button>

          <button
            onClick={() => setActiveTab('SCHEDULED')}
            className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'SCHEDULED'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>Scheduled</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">{scheduledCount}</span>
          </button>

          <button
            onClick={() => setActiveTab('SENT')}
            className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'SENT'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>Sent</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700">{sentCount}</span>
          </button>

          <button
            onClick={() => setActiveTab('FAILED')}
            className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'FAILED'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>Failed</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-rose-100 text-rose-700">{failedCount}</span>
          </button>

          {cancelledCount > 0 && (
            <button
              onClick={() => setActiveTab('CANCELLED')}
              className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'CANCELLED'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Ban className="w-3.5 h-3.5 text-amber-600" />
              <span>Cancelled</span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800">{cancelledCount}</span>
            </button>
          )}
        </div>

        {/* Informational Callout */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 text-xs text-amber-800 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Ethereal Fake SMTP Inbox:</strong> When an email job transitions to <span className="font-semibold text-emerald-700">Sent</span>, click the <span className="font-semibold text-blue-700">View Inbox</span> button in the table to view the rendered message in your browser via Ethereal Mail preview!
          </div>
        </div>

        {/* Email Table */}
        <EmailTable emails={displayedEmails} loading={loading} onRefresh={() => fetchEmails(true)} />
      </main>

      {/* Compose Email Modal */}
      <ComposeEmailModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSuccess={() => fetchEmails(true)}
      />
    </div>
  );
};
