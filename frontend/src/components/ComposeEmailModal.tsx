import React, { useState } from 'react';
import { X, Send, Clock, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

interface ComposeEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ComposeEmailModal: React.FC<ComposeEmailModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  
  // Format current date + 2 minutes as default ISO string formatted for datetime-local input
  const getDefaultDateTime = () => {
    const now = new Date(Date.now() + 2 * 60 * 1000);
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const getMinDateTime = () => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const [sendAt, setSendAt] = useState(getDefaultDateTime);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const setPresetOffset = (minutes: number) => {
    const target = new Date(Date.now() + minutes * 60 * 1000);
    const tzOffset = target.getTimezoneOffset() * 60000;
    const localISOTime = new Date(target.getTime() - tzOffset).toISOString().slice(0, 16);
    setSendAt(localISOTime);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!to || !subject || !body || !sendAt) {
      setError('Please fill in all required fields.');
      return;
    }

    const targetDate = new Date(sendAt);
    if (isNaN(targetDate.getTime())) {
      setError('Invalid sendAt datetime format.');
      return;
    }

    // Validate that sendAt is strictly in the future
    if (targetDate.getTime() <= Date.now()) {
      setError('Send At datetime must be in the future. Please select a future date/time.');
      return;
    }

    try {
      setSubmitting(true);
      const isoSendAt = targetDate.toISOString();

      await api.post('/emails', {
        to,
        subject,
        body,
        sendAt: isoSendAt,
      });

      const formattedTime = targetDate.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      });
      setSuccessMessage(`✅ Email scheduled successfully for ${formattedTime}!`);

      setTimeout(() => {
        setTo('');
        setSubject('');
        setBody('');
        setSendAt(getDefaultDateTime());
        setSuccessMessage(null);
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.details?.[0]?.message ||
        err.message ||
        'Failed to schedule email.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-semibold text-slate-800">Schedule New Email</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm font-medium flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Recipient Email (To) *
            </label>
            <input
              type="email"
              required
              placeholder="recipient@example.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Subject *
            </label>
            <input
              type="text"
              required
              placeholder="Email subject..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Body Content *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Write your email body here..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Send At (Date & Time) *
              </label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setPresetOffset(1)}
                  className="px-2 py-0.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 font-medium transition"
                >
                  +1 min
                </button>
                <button
                  type="button"
                  onClick={() => setPresetOffset(5)}
                  className="px-2 py-0.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 font-medium transition"
                >
                  +5 min
                </button>
                <button
                  type="button"
                  onClick={() => setPresetOffset(60)}
                  className="px-2 py-0.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 font-medium transition"
                >
                  +1 hr
                </button>
              </div>
            </div>
            <input
              type="datetime-local"
              required
              min={getMinDateTime()}
              value={sendAt}
              onChange={(e) => setSendAt(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !!successMessage}
              className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-sm rounded-lg shadow-sm transition"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Scheduling...' : 'Schedule Email'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
