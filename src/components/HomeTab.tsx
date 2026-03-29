import React from 'react';
import { motion } from 'motion/react';
import { Clock, ChevronRight, Quote, Map as MapIcon, Info } from 'lucide-react';
import { LocationData, PrayerTime, NotificationSettings } from '../types';
import { CALCULATION_METHODS } from '../constants';
import { ACJUTimesState } from '../hooks/useACJUTimes';

interface HomeTabProps {
  location: LocationData;
  prayers: PrayerTime[];
  nextPrayer: PrayerTime | null;
  onOpenLocation: () => void;
  onToggleNotification: (prayerName: string) => void;
  notificationSettings: NotificationSettings;
  acjuState: ACJUTimesState;
}

export const HomeTab: React.FC<HomeTabProps> = ({ 
  location, 
  prayers, 
  nextPrayer, 
  onOpenLocation, 
  onToggleNotification, 
  notificationSettings,
  acjuState
}) => {
  const [timeLeft, setTimeLeft] = React.useState('');

  React.useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      if (nextPrayer?.rawDate) {
        const diff = nextPrayer.rawDate.getTime() - now.getTime();
        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeLeft(`${hours}h ${minutes}m`);
        } else {
          setTimeLeft('Now');
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [nextPrayer]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-12 pb-6"
    >
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary to-primary-container p-8 md:p-12 text-on-primary shadow-2xl">
        <div className="absolute top-0 right-0 opacity-10 translate-x-10 -translate-y-10">
           <MapIcon size={240} />
        </div>
        <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <p className="font-headline tracking-[0.2em] uppercase text-on-primary-container font-semibold text-xs">Next Prayer</p>
            <h1 className="font-headline text-7xl md:text-8xl font-extrabold tracking-tighter uppercase">
              {nextPrayer?.name || '---'}
            </h1>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md w-fit px-4 py-2 rounded-full border border-white/10">
              <Clock size={20} className="text-secondary-fixed" />
              <p className="text-xl font-medium">in {timeLeft || '--h --m'}</p>
            </div>
          </div>
          <div className="flex flex-col md:items-end justify-center space-y-1">
            <p className="text-on-primary-container font-medium text-lg">Time</p>
            <div className="font-headline text-5xl md:text-6xl font-bold">
              {nextPrayer?.time || '--:--'}
            </div>
          </div>
        </div>
      </section>

      {/* Daily Prayers */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-2">
          <h2 className="font-headline text-3xl font-bold tracking-tight text-primary">Daily Prayers</h2>
          {acjuState.isLoading ? (
            <p className="text-on-surface-variant font-medium text-sm animate-pulse">⟳ Fetching ACJU official times…</p>
          ) : acjuState.isACJU && notificationSettings.method === 'ACJU' ? (
            <p className="text-green-600 dark:text-green-400 font-semibold text-sm flex items-center gap-1">
              ✓ ACJU Official • {acjuState.zone?.name}
            </p>
          ) : (
            <p className="text-on-surface-variant font-medium text-sm">
              {CALCULATION_METHODS.find(m => m.id === notificationSettings.method)?.name || 'Standard'} • Shafi'i
            </p>
          )}
        </div>

        {/* Disclaimer Note (Moved) */}
        <p className="text-xs font-medium text-on-surface-variant italic opacity-70 -mt-2">
          "Note: Prayer times may vary by a few minutes (+/-). Thank you!"
        </p>

        <div className="grid grid-cols-1 gap-3">
          {prayers.map((prayer) => (
            <div 
              key={prayer.name}
              className={`group rounded-2xl flex flex-row items-center justify-between p-4 h-auto min-h-[72px] shadow-sm transition-all duration-300 border ${
                prayer.active 
                  ? 'bg-primary-container/10 border-primary/30' 
                  : 'bg-surface-container-lowest border-outline-variant/30 hover:border-primary/20 hover:bg-surface-container'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`${prayer.active ? 'text-primary' : 'text-primary/60'}`}>
                  {prayer.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`font-headline font-bold text-base ${prayer.active ? 'text-primary' : ''}`}>{prayer.name}</h3>
                    {prayer.active && <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>}
                  </div>
                  <p className={`${prayer.active ? 'text-primary font-bold' : 'text-on-surface-variant'} text-sm`}>{prayer.time}</p>
                </div>
              </div>
              {prayer.hasToggle && (
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleNotification(prayer.name);
                  }}
                  className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${notificationSettings.enabled[prayer.name] ? 'bg-primary' : 'bg-surface-container-high'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${notificationSettings.enabled[prayer.name] ? 'right-1' : 'left-1'}`}></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Compact Location Section */}
      <section className="grid grid-cols-1 gap-6">
        <div className="bg-surface-container-lowest rounded-3xl overflow-hidden flex flex-row shadow-sm border border-outline-variant/10">
          <div className="p-4 flex flex-col justify-center space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 text-primary/60">
              <MapIcon size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Current Location</span>
            </div>
            <div>
              <h4 className="font-headline text-lg font-bold truncate">
                {location.loading ? 'Detecting...' : location.error ? 'Error' : `${location.city}, ${location.country}`}
              </h4>
              <p className="text-[11px] text-on-surface-variant truncate opacity-80 uppercase tracking-tighter">
                {location.loading ? 'Fetching coordinates...' : location.error ? location.error : `Lat: ${location.latitude.toFixed(4)} • Lng: ${location.longitude.toFixed(4)}`}
              </p>
            </div>
            <button 
              onClick={onOpenLocation}
              className="text-primary font-bold text-xs hover:underline transition-all flex items-center gap-1 group w-fit"
            >
              Update Location
              <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
          <div className="relative w-32 md:w-48 bg-surface-variant overflow-hidden border-l border-outline-variant/10">
            <img 
              className="w-full h-full object-cover grayscale opacity-40 contrast-125 scale-110" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBDtkKNXrtI9fiSnI9gIMQhZQu1UpDioa2XqD9J4T8GJNOVioeOZJAfArrNj9wvRTKRuSefhXfE6XKVtUMBurhPa8RQcekjGTSr7_ubKcuZiSh5ngJeKdfMd9luuB1EAgI3RnmdoK-iBe4scn7BuTCzZVtcvGtbVDRGpjGBHA_fE3044FDJTVWyqFGCesBsx4gpk4fIKxvu6elKkpgWvMLovdTMYhpUzjrkuT3PCywrDi6O3R3J92f9rX6jwQfUeRTzXdFu4W8LNHOf" 
              alt="Map"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 bg-primary rounded-full shadow-[0_0_15px_rgba(0,50,41,0.4)] border-2 border-white"></div>
            </div>
            {location.accuracy && location.accuracy > 100 && (
              <div className="absolute bottom-1 left-1 right-1 bg-error/90 text-white text-[8px] p-1 rounded-md backdrop-blur-sm flex items-center gap-1">
                <Info size={10} />
                Low Precision
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Daily Verse */}
      <section className="bg-surface-container-low rounded-[2.5rem] p-10 text-center space-y-6 border border-outline-variant/20 shadow-sm">
        <Quote size={40} className="text-primary mx-auto opacity-50" fill="currentColor" />
        <p className="font-body text-2xl italic text-primary/80 leading-relaxed max-w-2xl mx-auto">
          "Verily, in the remembrance of Allah do hearts find rest."
        </p>
        <p className="font-headline font-bold tracking-widest text-xs uppercase text-on-surface-variant">Surah Ar-Ra'd 13:28</p>
      </section>
    </motion.div>
  );
};
