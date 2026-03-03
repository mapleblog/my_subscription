'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const slides = [
  {
    title: 'Track Subscriptions',
    description: 'Stay on top of your monthly spend with elegant insights.',
  },
  {
    title: 'Smart Reminders',
    description: 'Get notified before renewals to avoid unwanted charges.',
  },
  {
    title: 'Multi-Currency',
    description: 'Convert seamlessly to MYR with real-time rates.',
  },
];

export default function AuthCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const next = () => setIndex((i) => (i + 1) % slides.length);
  const prev = () => setIndex((i) => (i - 1 + slides.length) % slides.length);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20" />
      <div className="absolute inset-0 p-8 flex flex-col justify-center">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="max-w-md"
          >
            <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">
              {slides[index].title}
            </h2>
            <p className="mt-3 text-gray-700 dark:text-gray-300">
              {slides[index].description}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex items-center gap-3">
          <button
            aria-label="Previous"
            onClick={prev}
            className="rounded-full bg-white/70 dark:bg-white/10 border border-white/30 dark:border-white/10 backdrop-blur px-3 py-1 text-sm text-gray-700 dark:text-white hover:bg-white/90"
          >
            Prev
          </button>
          <button
            aria-label="Next"
            onClick={next}
            className="rounded-full bg-white/70 dark:bg-white/10 border border-white/30 dark:border-white/10 backdrop-blur px-3 py-1 text-sm text-gray-700 dark:text-white hover:bg-white/90"
          >
            Next
          </button>
          <div className="ml-2 flex gap-2">
            {slides.map((_, i) => (
              <span
                key={i}
                className={`h-2 w-2 rounded-full ${i === index ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
