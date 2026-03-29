import React from 'react';
import { MapPin } from 'lucide-react';
import { LocationData } from '../types';

interface HeaderProps {
  location: LocationData;
  onDetectLocation: () => void;
}

export const Header: React.FC<HeaderProps> = ({ location, onDetectLocation }) => {
  const [dateStr, setDateStr] = React.useState('');

  React.useEffect(() => {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    setDateStr(new Date().toLocaleDateString('en-GB', options));
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md flex justify-between items-center w-full px-6 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4">
      <div 
        onClick={onDetectLocation}
        className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity cursor-pointer"
        title="Refresh Location"
      >
        <MapPin size={18} />
        <span className="font-headline tracking-[0.05em] uppercase text-xs font-semibold">
          {location.loading ? 'Detecting...' : location.error ? 'Location Error' : `${location.city}, ${location.country}`}
        </span>
      </div>
      <div className="text-sm font-bold text-primary hidden md:block">
        {dateStr}
      </div>
    </header>
  );
};
