import React from 'react';
import { LocationData } from '../types';
import { DEFAULT_LOCATION } from '../constants';

export const useLocation = () => {
  const [location, setLocation] = React.useState<LocationData>({
    ...DEFAULT_LOCATION,
    loading: true,
    error: null,
    accuracy: null,
    isManual: false,
  });

  const handleManualLocation = (lat: number, lng: number, city: string, country: string, isManual: boolean) => {
    setLocation(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      city,
      country,
      isManual,
      loading: false,
      accuracy: null,
      error: null
    }));
  };

  const detectLocation = React.useCallback(() => {
    setLocation(prev => ({ ...prev, loading: true, error: null }));
    
    if (!navigator.geolocation) {
      setLocation(prev => ({ ...prev, loading: false, error: 'Geolocation not supported' }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
            {
              headers: {
                'Accept-Language': 'en',
                'User-Agent': 'TheSacredBreathApp'
              }
            }
          );
          const data = await response.json();
          const city = data.address.city || data.address.town || data.address.village || data.address.suburb || 'Unknown City';
          const country = data.address.country || 'Unknown Country';

          setLocation({
            latitude,
            longitude,
            city,
            country,
            loading: false,
            error: null,
            accuracy,
            isManual: false,
          });
        } catch (err) {
          console.error('Reverse geocoding error:', err);
          setLocation(prev => ({
            ...prev,
            loading: false,
            error: 'Failed to fetch city name',
          }));
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        setLocation(prev => ({ ...prev, loading: false, error: 'Permission denied or location unavailable' }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  React.useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  return { location, setLocation, handleManualLocation, detectLocation };
};
