import React from 'react';

export type Tab = 'home' | 'qibla' | 'settings';

export interface LocationData {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  loading: boolean;
  error: string | null;
  accuracy: number | null;
  isManual: boolean;
  timezone?: string;
}

export interface NotificationSettings {
  enabled: { [key: string]: boolean };
  sound: string;
  method: string;
  use24HourFormat: boolean;
}

export interface PrayerTime {
  name: string;
  time: string;
  icon: React.ReactNode;
  active?: boolean;
  hasToggle?: boolean;
  rawDate?: Date;
}
