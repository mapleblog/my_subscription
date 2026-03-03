
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="min-h-screen px-6 py-8 pb-24 md:pb-8 w-full max-w-7xl mx-auto">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        </div>
        
        <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 border border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-full text-blue-600 dark:text-blue-400">
              <Settings size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">App Preferences</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Customize your experience</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#2C2C2E] rounded-xl">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Currency</p>
                <p className="text-sm text-gray-500">Default currency for new subscriptions</p>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">MYR</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#2C2C2E] rounded-xl">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Theme</p>
                <p className="text-sm text-gray-500">Appearance mode</p>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">System</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#2C2C2E] rounded-xl">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Notifications</p>
                <p className="text-sm text-gray-500">Manage payment reminders</p>
              </div>
              <span className="text-sm font-bold text-green-500">Enabled</span>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-gray-400 mt-8">
          <p>Subly v0.1.0</p>
          <p>Designed with ❤️</p>
        </div>
      </div>
    </div>
  );
}
