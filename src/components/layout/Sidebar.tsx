'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Settings, LogOut, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
];

export function Sidebar({ userEmail, userDisplayName }: { userEmail?: string; userDisplayName?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLDivElement | null>(null);

  const onLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    router.push('/login');
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(t) && toggleRef.current && !toggleRef.current.contains(t)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const email = userEmail || '';
  const local = email ? email.split('@')[0] : '';
  const nameToUse = userDisplayName || (local ? local.charAt(0).toUpperCase() + local.slice(1) : 'User');
  const initials = nameToUse.slice(0, 2).toUpperCase();
  const displayName = nameToUse;

  return (
    <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 z-50 bg-[#FBFBFD]/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl border-r border-gray-200/60 dark:border-white/10 transition-colors duration-300">
      <div className="p-6 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </span>
          Subly
        </h1>
      </div>

      <div className="flex-1 px-3 py-2">
        <p className="px-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Menu</p>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 group",
                  isActive 
                    ? "bg-black/5 dark:bg-white/10 text-gray-900 dark:text-white font-medium shadow-sm" 
                    : "text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                <Icon size={18} className={cn("transition-colors", isActive ? "text-blue-500 dark:text-blue-400" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300")} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-200/50 dark:border-white/5 relative">
        <div 
          ref={toggleRef}
          className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer group" 
          onClick={() => setMenuOpen(v => !v)}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-200 font-bold text-xs shadow-sm ring-2 ring-white dark:ring-[#2C2C2E]">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{displayName}</p>
            <p className="text-xs text-gray-500 truncate">{email || '—'}</p>
          </div>
          <ChevronsUpDown size={14} className="text-gray-400" />
        </div>
        
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="absolute left-4 bottom-20 w-56 rounded-xl bg-white/80 dark:bg-[#2C2C2E]/90 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 shadow-2xl p-1.5"
              role="menu"
            >
              <div className="px-2 py-1.5 mb-1 border-b border-gray-100 dark:border-white/5">
                <p className="text-xs font-medium text-gray-500">My Account</p>
              </div>
              <Link
                href="/settings"
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600 transition-colors"
                onClick={() => setMenuOpen(false)}
                role="menuitem"
              >
                <Settings size={16} />
                <span>Settings</span>
              </Link>
              <button
                onClick={() => { setMenuOpen(false); onLogout(); }}
                className="mt-0.5 w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                role="menuitem"
              >
                <LogOut size={16} />
                <span>Log out</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}
