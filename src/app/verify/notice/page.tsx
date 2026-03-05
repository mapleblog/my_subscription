 'use client';
import React from 'react';

function NoticeClient() {
  'use client';
  const [sending, setSending] = React.useState(false);
  const [message, setMessage] = React.useState<string>('Please verify your email to continue.');
  const [verifyUrl, setVerifyUrl] = React.useState<string | null>(null);

  function formatRetryAfter(seconds: unknown) {
    const s = typeof seconds === 'number' ? seconds : Number(seconds);
    if (!Number.isFinite(s) || s <= 0) return null;
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    if (m <= 0) return `${r}s`;
    return `${m}m ${r}s`;
  }

  const resend = async () => {
    setSending(true);
    try {
      const res = await fetch('/api/auth/verify/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (json.success) {
        const provider = typeof json.provider === 'string' ? json.provider : 'unknown';
        const id = typeof json.id === 'string' ? json.id : null;
        setMessage(id ? `Verification email sent via ${provider}. id: ${id}` : `Verification email sent via ${provider}. Please check your inbox.`);
      } else {
        const retry = formatRetryAfter(json.retryAfterSeconds);
        if (json.error === 'Rate limited' && retry) {
          setMessage(`Rate limited. Try again in ${retry}.`);
        } else {
          setMessage(json.error || 'Failed to send verification email.');
        }
      }
      if (json.verifyUrl) {
        setVerifyUrl(json.verifyUrl);
      }
    } catch {
      setMessage('Network error. Please try again later.');
    } finally {
      setSending(false);
    }
  };

  const resetRateLimit = async () => {
    setSending(true);
    try {
      const res = await fetch('/api/auth/verify/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetRateLimit: true }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage('Rate limit reset (dev). You can resend now.');
      } else {
        setMessage(json.error || 'Failed to reset rate limit.');
      }
    } catch {
      setMessage('Network error. Please try again later.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl bg-white/80 dark:bg-white/10 backdrop-blur-md border border-white/30 dark:border-white/10 shadow-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Verification Required</h1>
        <p className="text-sm text-gray-700 dark:text-gray-300">{message}</p>
        <button
          onClick={resend}
          disabled={sending}
          className="inline-block mt-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 disabled:opacity-50"
        >
          {sending ? 'Sending…' : 'Resend Verification Email'}
        </button>
        {process.env.NODE_ENV !== 'production' && (
          <div className="mt-3">
            <button
              onClick={resetRateLimit}
              disabled={sending}
              className="text-xs text-gray-600 dark:text-gray-300 underline disabled:opacity-50"
            >
              Reset rate limit (dev)
            </button>
          </div>
        )}
        {verifyUrl && (
          <div className="mt-4">
            <a href={verifyUrl} className="inline-block bg-green-600 hover:bg-green-700 text-white rounded-xl px-4 py-2">
              Open Verification Link
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyNoticePage() {
  return <NoticeClient />;
}
