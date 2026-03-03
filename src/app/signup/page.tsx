import React from 'react';
import Link from 'next/link';
import SignupForm from '@/components/auth/SignupForm';

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-black flex items-center justify-center p-6">
      <div className="relative w-full max-w-md">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute top-24 -right-24 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl" />
        <div className="relative z-10 rounded-3xl bg-white/80 dark:bg-white/10 backdrop-blur-md border border-white/30 dark:border-white/10 shadow-lg p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Account</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Join Subly and start tracking</p>
          </div>
          <SignupForm />
          <div className="text-sm text-gray-600 dark:text-gray-400 text-center mt-4">
            Already have an account? <Link href="/login" className="hover:underline">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
