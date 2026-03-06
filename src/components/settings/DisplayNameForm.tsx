'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DisplayNameForm({ initialName }: { initialName: string }) {
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/user/display-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: name }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage('Saved');
        router.refresh();
      } else {
        setMessage(json.error || 'Failed');
      }
    } catch {
      setMessage('Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 rounded-xl bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-white/10 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        placeholder="Enter display name"
      />
      <button
        type="submit"
        disabled={saving}
        className="rounded-xl px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
      {message && <span className="text-sm text-gray-600 dark:text-gray-400">{message}</span>}
    </form>
  );
}
