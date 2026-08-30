import React, { useState, useEffect } from 'react';
import { Email } from '../types';
import { StatusBadge } from './StatusBadge';
import { ExternalLink, Mail, Calendar, AlertCircle, Ban, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../services/api';

interface EmailTableProps {
  emails: Email[];
  loading: boolean;
  onRefresh: () => void;
}

export const EmailTable: React.FC<EmailTableProps> = ({ emails, loading, onRefresh }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const pageSize = 10;

  // Live timer tick every 10s to keep relative countdowns fresh
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  // Reset to page 1 whenever email length/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [emails.length]);

  const totalPages = Math.ceil(emails.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedEmails = emails.slice(startIndex, startIndex + pageSize);

  const handleCancel = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this scheduled email?')) return;
    try {
      setCancellingId(id);
      await api.delete(`/emails/${id}`);
      onRefresh();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to cancel scheduled email');
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'medium',
    });
  };

  const formatRelativeTime = (sendAtISO: string) => {
    const targetMs = new Date(sendAtISO).getTime();
    const diffMs = targetMs - now;

    if (diffMs <= 0) return 'due now';

    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `in ${diffSec} sec`;

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `in ${diffMin} min`;

    const diffHr = Math.floor(diffMin / 60);
    const remMin = diffMin % 60;
    if (diffHr < 24) return `in ${diffHr} hr${remMin > 0 ? ` ${remMin} min` : ''}`;

    const diffDays = Math.floor(diffHr / 24);
    return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
  };

  if (loading && emails.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-slate-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <Mail className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">No emails found</h3>
        <p className="text-slate-500 text-sm mt-1">
          No scheduled, sent, failed, or cancelled emails match the current view.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3.5">Recipient</th>
              <th className="px-6 py-3.5">Subject & Body</th>
              <th className="px-6 py-3.5">Schedule / Sent Time</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {paginatedEmails.map((email) => (
              <tr key={email.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                  {email.to}
                </td>
                <td className="px-6 py-4 max-w-md">
                  <div className="font-semibold text-slate-800 truncate">{email.subject}</div>
                  <div className="text-slate-500 text-xs truncate mt-0.5">{email.body}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-600 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <div className="flex flex-col">
                      <span>
                        {email.status === 'SENT'
                          ? formatDate(email.sentAt)
                          : formatDate(email.sendAt)}
                      </span>
                      {email.status === 'SCHEDULED' && (
                        <span className="text-[11px] font-semibold text-blue-600">
                          {formatRelativeTime(email.sendAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={email.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {email.status === 'SCHEDULED' ? (
                    <button
                      onClick={() => handleCancel(email.id)}
                      disabled={cancellingId === email.id}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-md transition disabled:opacity-50"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>{cancellingId === email.id ? 'Cancelling...' : 'Cancel'}</span>
                    </button>
                  ) : email.status === 'SENT' && email.etherealPreviewUrl ? (
                    <a
                      href={email.etherealPreviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md border border-blue-200 transition"
                    >
                      <span>View Inbox</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : email.status === 'FAILED' && email.error ? (
                    <span
                      title={email.error}
                      className="inline-flex items-center gap-1 text-xs text-rose-600 bg-rose-50 px-2.5 py-1 rounded border border-rose-200"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span className="max-w-[150px] truncate">{email.error}</span>
                    </span>
                  ) : (
                    <span className="text-slate-400 text-xs">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing <span className="font-semibold text-slate-800">{startIndex + 1}</span> to{' '}
            <span className="font-semibold text-slate-800">
              {Math.min(startIndex + pageSize, emails.length)}
            </span>{' '}
            of <span className="font-semibold text-slate-800">{emails.length}</span> emails
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1.5 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white flex items-center gap-1 transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <span className="font-semibold px-1">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1.5 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white flex items-center gap-1 transition"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
