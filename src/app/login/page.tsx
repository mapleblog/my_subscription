import React from 'react';
import LoginForm from '@/components/auth/LoginForm';
import AuthCarousel from '@/components/auth/AuthCarousel';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-black flex items-center justify-center p-0 md:p-6">
      <div className="relative w-full max-w-6xl md:h-[70vh] lg:h-[80vh] grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-6">
        <div className="relative rounded-none md:rounded-3xl overflow-hidden">
          <AuthCarousel />
        </div>
        <div className="relative">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl" />
          <div className="absolute top-24 -right-24 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl" />
          <div className="relative z-10 rounded-none md:rounded-3xl bg-white/80 dark:bg-white/10 backdrop-blur-md border border-white/30 dark:border-white/10 shadow-lg p-8 md:p-10 h-full flex items-center">
            <div className="w-full">
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome Back</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sign in to manage your subscriptions
                </p>
              </div>
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
