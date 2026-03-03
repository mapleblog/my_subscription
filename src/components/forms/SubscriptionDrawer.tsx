
'use client';

import { Drawer } from 'vaul';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from '@/hooks/use-media-query';
import { SubscriptionForm, SubscriptionFormProps } from './SubscriptionForm';

interface SubscriptionDrawerProps extends Omit<SubscriptionFormProps, 'onSuccess' | 'onCancel'> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscriptionDrawer({ 
  open, 
  onOpenChange, 
  categories = [], 
  subscription 
}: SubscriptionDrawerProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const handleSuccess = () => {
    onOpenChange(false);
  };

  if (isDesktop) {
    return (
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => onOpenChange(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={() => onOpenChange(false)}
                  className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-8 max-h-[90vh] overflow-y-auto">
                <SubscriptionForm
                  categories={categories}
                  subscription={subscription}
                  onSuccess={handleSuccess}
                  onCancel={() => onOpenChange(false)}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50 backdrop-blur-[2px]" />
        <Drawer.Content className="bg-white dark:bg-[#1C1C1E] flex flex-col rounded-t-[10px] h-[90vh] mt-24 fixed bottom-0 left-0 right-0 z-50 outline-none">
          <div className="p-4 bg-white dark:bg-[#1C1C1E] rounded-t-[10px] flex-1 overflow-y-auto">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 dark:bg-gray-700 mb-8" />
            
            <div className="max-w-md mx-auto relative">
              <div className="absolute top-0 right-0 z-10">
                <Drawer.Close asChild>
                  <button className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400">
                    <X size={20} />
                  </button>
                </Drawer.Close>
              </div>

              <SubscriptionForm
                categories={categories}
                subscription={subscription}
                onSuccess={handleSuccess}
                onCancel={() => onOpenChange(false)}
              />
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
