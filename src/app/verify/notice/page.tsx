 'use client';
import React from 'react';

function NoticeClient() {
  'use client';
  const [sending, setSending] = React.useState(false);
  const [message, setMessage] = React.useState<string>('Please verify your email to continue.');
  const [verifyUrl, setVerifyUrl] = React.useState<string | null>(null);

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
        setMessage('Verification email sent. Please check your inbox.');
        if (json.verifyUrl) {
          setVerifyUrl(json.verifyUrl);
        }
      } else {
        setMessage(json.error || 'Failed to send verification email.');
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
