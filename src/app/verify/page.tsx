'use client';
import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function VerifyClient() {
  const sp = useSearchParams();
  const token = sp.get('token');
  const [status, setStatus] = React.useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = React.useState<string>('Verifying…');

  React.useEffect(() => {
    async function run() {
      if (!token) {
        setStatus('error');
        setMessage('Missing token');
        return;
      }
      const res = await fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`);
      const json = await res.json();
      if (json.success) {
        setStatus('success');
        setMessage('Email verified. You can now access all features.');
      } else {
        setStatus('error');
        setMessage(json.error || 'Verification failed');
      }
    }
    run();
  }, [token]);

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl bg-white/80 dark:bg-white/10 backdrop-blur-md border border-white/30 dark:border-white/10 shadow-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Email Verification</h1>
        <p className="text-sm text-gray-700 dark:text-gray-300">{message}</p>
        {status === 'success' && (
          <a href="/dashboard" className="inline-block mt-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2">Go to Dashboard</a>
        )}
        {status === 'error' && (
          <a href="/verify/notice" className="inline-block mt-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2">Resend Verification Email</a>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F5F5F7] dark:bg-black flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl bg-white/80 dark:bg-white/10 backdrop-blur-md border border-white/30 dark:border-white/10 shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Email Verification</h1>
          <p className="text-sm text-gray-700 dark:text-gray-300">Loading…</p>
        </div>
      </div>
    }>
      <VerifyClient />
    </Suspense>
  );
}
