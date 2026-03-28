import React from 'react';
import {
  getACJUZone,
  buildTimetableImageUrl,
  fetchTimetableViaGemini,
  getCachedTimetable,
  cacheTimetable,
  getTodayFromTimetable,
  type DailyPrayerTimes,
  type ACJUZone,
} from '../services/acjuService';
import { LocationData } from '../types';

export interface ACJUTimesState {
  times: DailyPrayerTimes | null;
  zone: ACJUZone | null;
  isLoading: boolean;
  isACJU: boolean; // true when using official ACJU data (not fallback)
  error: string | null;
}

export const useACJUTimes = (location: LocationData): ACJUTimesState => {
  const [state, setState] = React.useState<ACJUTimesState>({
    times: null,
    zone: null,
    isLoading: false,
    isACJU: false,
    error: null,
  });

  React.useEffect(() => {
    // Only run for Sri Lanka when location is ready
    if (
      location.loading ||
      !location.latitude ||
      !location.longitude ||
      !location.city ||
      !location.country.toLowerCase().includes('sri lanka')
    ) {
      setState(prev => ({ ...prev, isLoading: false, isACJU: false, times: null }));
      return;
    }

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const zone = getACJUZone(location.city, location.country);

    // 1. Try cache first
    const cached = getCachedTimetable(zone.id, month, year);
    if (cached) {
      const todayTimes = getTodayFromTimetable(cached, now);
      setState({ times: todayTimes, zone, isLoading: false, isACJU: !!todayTimes, error: null });
      return;
    }

    // 2. Fetch fresh from ACJU via Gemini Vision
    setState(prev => ({ ...prev, isLoading: true, zone, error: null }));

    const imageUrl = buildTimetableImageUrl(zone, month, year);

    fetchTimetableViaGemini(imageUrl, zone.name, month, year)
      .then(timetable => {
        cacheTimetable(zone.id, month, year, timetable);
        const todayTimes = getTodayFromTimetable(timetable, now);
        setState({ times: todayTimes, zone, isLoading: false, isACJU: !!todayTimes, error: null });
      })
      .catch(err => {
        console.warn('[ACJU] Failed to fetch timetable — falling back to adhan calculation:', err);
        setState(prev => ({
          ...prev,
          isLoading: false,
          isACJU: false,
          error: 'Could not fetch ACJU times. Using calculated times.',
        }));
      });
  }, [location.city, location.country, location.latitude, location.longitude, location.loading]);

  return state;
};
