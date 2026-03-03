'use client';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type LoginInput = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json.success) {
      router.push('/dashboard');
    } else {
      alert(json.error || 'Login failed');
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          {...register('email')}
          className={cn(
            'w-full p-3 rounded-xl bg-gray-50 dark:bg-[#2C2C2E] border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-black/20 outline-none transition-all text-gray-900 dark:text-white'
          )}
        />
        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          {...register('password')}
          className={cn(
            'w-full p-3 rounded-xl bg-gray-50 dark:bg-[#2C2C2E] border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-black/20 outline-none transition-all text-gray-900 dark:text-white'
          )}
        />
        {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          'w-full p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors disabled:opacity-50'
        )}
      >
        {isSubmitting ? 'Signing In…' : 'Sign In'}
      </button>

      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <a href="#" className="hover:underline">
          Forgot password?
        </a>
        <a href="/signup" className="hover:underline">Create account</a>
      </div>
    </motion.form>
  );
}
