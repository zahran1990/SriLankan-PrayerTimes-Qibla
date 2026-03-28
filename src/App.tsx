import React from 'react';
import { Home as HomeIcon, Compass, Settings as SettingsIcon } from 'lucide-react';
import { AnimatePresence } from 'motion/react';

// Types & Constants
import { Tab, NotificationSettings } from './types';
import { SOUND_URLS } from './constants';

// Hooks
import { useLocation } from './hooks/useLocation';
import { usePrayerTimes } from './hooks/usePrayerTimes';
import { useACJUTimes } from './hooks/useACJUTimes';

// Components
import { Header } from './components/Header';
import { LocationModal } from './components/LocationModal';
import { HomeTab } from './components/HomeTab';
import { QiblaTab } from './components/QiblaTab';
import { SettingsTab } from './components/SettingsTab';

export default function App() {
  const [activeTab, setActiveTab] = React.useState<Tab>('home');
  const [isLocationModalOpen, setIsLocationModalOpen] = React.useState(false);
  
  const [theme, setTheme] = React.useState<'light' | 'dark' | 'auto'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as 'light' | 'dark' | 'auto') || 'auto';
  });

  const [notificationSettings, setNotificationSettings] = React.useState<NotificationSettings>(() => {
    const saved = localStorage.getItem('notificationSettings');
    const defaults = {
      enabled: { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true },
      sound: 'makkah',
      method: 'ACJU'
    };
    if (!saved) return defaults;
    const parsed = JSON.parse(saved);
    return { ...defaults, ...parsed };
  });

  const { location, handleManualLocation, detectLocation } = useLocation();
  const acju = useACJUTimes(location);
  const { prayers, nextPrayer, playSound } = usePrayerTimes(location, notificationSettings, acju.times);

  // Theme Management
  React.useEffect(() => {
    localStorage.setItem('theme', theme);
    const root = window.document.documentElement;
    
    const applyTheme = (currentTheme: 'light' | 'dark' | 'auto') => {
      if (currentTheme === 'auto') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.toggle('dark', systemTheme === 'dark');
      } else {
        root.classList.toggle('dark', currentTheme === 'dark');
      }
    };

    applyTheme(theme);

    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('auto');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  // Persistence
  React.useEffect(() => {
    localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
  }, [notificationSettings]);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  const toggleNotification = async (prayerName: string) => {
    const currentlyEnabled = notificationSettings.enabled[prayerName];
    if (!currentlyEnabled) {
      await requestNotificationPermission();
    }

    setNotificationSettings(prev => ({
      ...prev,
      enabled: {
        ...prev.enabled,
        [prayerName]: !prev.enabled[prayerName]
      }
    }));
  };

  const handleTestNotification = () => {
    playSound(SOUND_URLS[notificationSettings.sound] || SOUND_URLS.standard);
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Test Notification', {
        body: 'SriLankan PrayerTimes & Qibla is ready for your spiritual journey.',
        icon: '/favicon.ico',
      });
    } else {
      alert('Please enable notifications first to see the visual alert, but you should have heard the sound!');
    }
  };

  return (
    <div className="min-h-screen max-w-4xl mx-auto flex flex-col">
      <Header location={location} onDetectLocation={detectLocation} />
      
      <main className="flex-1 px-6 pt-4">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <HomeTab 
              key="home" 
              location={location} 
              prayers={prayers} 
              nextPrayer={nextPrayer} 
              onOpenLocation={() => setIsLocationModalOpen(true)}
              onToggleNotification={toggleNotification}
              notificationSettings={notificationSettings}
              acjuState={acju}
            />
          )}
          {activeTab === 'qibla' && <QiblaTab key="qibla" location={location} />}
          {activeTab === 'settings' && (
            <SettingsTab 
              key="settings" 
              settings={notificationSettings} 
              onUpdateSettings={setNotificationSettings} 
              theme={theme}
              onUpdateTheme={setTheme}
              onTestNotification={handleTestNotification}
            />
          )}
        </AnimatePresence>
      </main>

      <LocationModal 
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSelect={handleManualLocation}
        currentLocation={location}
      />

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-8 pt-3 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl z-50 rounded-t-[2.5rem] shadow-[0_-4px_40px_rgba(0,0,0,0.04)] border-t border-neutral-100/10">
        {[
          { id: 'home', icon: <HomeIcon size={20} />, label: 'Home' },
          { id: 'qibla', icon: <Compass size={20} />, label: 'Qibla' },
          { id: 'settings', icon: <SettingsIcon size={20} />, label: 'Settings' }
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id as Tab)}
            className={`flex flex-col items-center justify-center p-3 transition-all duration-300 ease-out cursor-pointer ${
              activeTab === item.id 
                ? 'bg-primary text-white rounded-full px-6' 
                : 'text-neutral-400 hover:text-primary'
            }`}
          >
            {item.icon}
            <span className="font-body text-[10px] font-medium tracking-tight mt-1">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
