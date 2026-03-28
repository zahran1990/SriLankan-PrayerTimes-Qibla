import React from 'react';
import { Sunrise, Sun, CloudSun, Sunset, Moon } from 'lucide-react';
import { Coordinates, CalculationMethod, PrayerTimes, Madhab } from 'adhan';
import { LocationData, NotificationSettings, PrayerTime } from '../types';
import { SOUND_URLS } from '../constants';
import { DailyPrayerTimes } from '../services/acjuService';

const playSound = (url: string) => {
  const audio = new Audio(url);
  audio.crossOrigin = "anonymous";
  audio.play().catch(e => console.log('Audio play blocked or failed', e));
};

// Parse a time string like "4:52 AM" into a Date object for today
const parseTimeStr = (timeStr: string): Date => {
  const [time, meridiem] = timeStr.split(' ');
  const [hourStr, minuteStr] = time.split(':');
  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  if (meridiem === 'PM' && hour !== 12) hour += 12;
  if (meridiem === 'AM' && hour === 12) hour = 0;
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
};

export const usePrayerTimes = (
  location: LocationData,
  settings: NotificationSettings,
  acjuTimes?: DailyPrayerTimes | null
) => {
  const [prayers, setPrayers] = React.useState<PrayerTime[]>([]);
  const [nextPrayer, setNextPrayer] = React.useState<PrayerTime | null>(null);
  const lastNotifiedRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!location.latitude || !location.longitude) return;

    const now = new Date();

    // -------------------------------------------------------------------------
    // PATH A: Use official ACJU times (provided by useACJUTimes hook)
    // -------------------------------------------------------------------------
    if (acjuTimes && settings.method === 'ACJU') {
      const acjuList: PrayerTime[] = [
        {
          name: 'Fajr',
          time: acjuTimes.fajr,
          icon: React.createElement(Sunrise, { size: 24 }),
          rawDate: parseTimeStr(acjuTimes.fajr),
          hasToggle: true,
        },
        {
          name: 'Sunrise',
          time: acjuTimes.sunrise,
          icon: React.createElement(Sun, { size: 24 }),
          rawDate: parseTimeStr(acjuTimes.sunrise),
        },
        {
          name: 'Dhuhr',
          time: acjuTimes.dhuhr,
          icon: React.createElement(CloudSun, { size: 24 }),
          rawDate: parseTimeStr(acjuTimes.dhuhr),
          hasToggle: true,
        },
        {
          name: 'Asr',
          time: acjuTimes.asr,
          icon: React.createElement(Sun, { size: 24 }),
          rawDate: parseTimeStr(acjuTimes.asr),
          hasToggle: true,
        },
        {
          name: 'Maghrib',
          time: acjuTimes.maghrib,
          icon: React.createElement(Sunset, { size: 24 }),
          rawDate: parseTimeStr(acjuTimes.maghrib),
          hasToggle: true,
        },
        {
          name: 'Isha',
          time: acjuTimes.isha,
          icon: React.createElement(Moon, { size: 24 }),
          rawDate: parseTimeStr(acjuTimes.isha),
          hasToggle: true,
        },
      ];

      // Mark the currently active prayer
      for (let i = 0; i < acjuList.length - 1; i++) {
        const current = acjuList[i].rawDate!;
        const next = acjuList[i + 1].rawDate!;
        acjuList[i].active = now >= current && now < next;
      }
      acjuList[5].active = now >= acjuList[5].rawDate! || now < acjuList[0].rawDate!;

      // Determine next prayer
      let nextP = acjuList.find(p => p.rawDate && p.rawDate > now);
      let nextT = nextP?.rawDate;

      if (!nextP) {
        // Past Isha — next is tomorrow's Fajr
        const tomorrowFajr = new Date(parseTimeStr(acjuTimes.fajr));
        tomorrowFajr.setDate(tomorrowFajr.getDate() + 1);
        nextP = { name: 'Fajr', time: acjuTimes.fajr, icon: React.createElement(Sunrise, { size: 24 }), rawDate: tomorrowFajr };
        nextT = tomorrowFajr;
      }

      setPrayers(acjuList);
      setNextPrayer({ name: nextP.name, time: nextP.time, rawDate: nextT });
      return;
    }

    // -------------------------------------------------------------------------
    // PATH B: Fallback — calculate using adhan library
    // -------------------------------------------------------------------------
    const coords = new Coordinates(location.latitude, location.longitude);
    
    let params: any;
    switch (settings.method) {
      case 'ACJU':
        // Offsets calibrated against official ACJU Sri Lanka monthly timetable (Kurunegala)
        // Cross-validated across March 2026 (8 dates) + April 2026 (7 dates) — 15 data points
        // Combined averages: fajr -7, dhuhr 0, asr +1, maghrib +1, isha 0
        params = CalculationMethod.MuslimWorldLeague();
        params.fajrAngle = 18.0;
        params.ishaAngle = 18.0;
        params.madhab = Madhab.Shafi;
        params.adjustments.fajr = -7;    // adhan runs 7 min late for Fajr (consistent across both months)
        params.adjustments.dhuhr = 0;    // exact match
        params.adjustments.asr = 1;      // adhan runs 1 min early (was +2, March-only; +1 is the cross-month avg)
        params.adjustments.maghrib = 1;  // adhan runs 1 min early (stable across both months)
        params.adjustments.isha = 0;     // negligible drift — no adjustment needed
        break;
      case 'Egyptian': params = CalculationMethod.Egyptian(); break;
      case 'Karachi': params = CalculationMethod.Karachi(); break;
      case 'UmmAlQura': params = CalculationMethod.UmmAlQura(); break;
      case 'Dubai': params = CalculationMethod.Dubai(); break;
      case 'MoonsightingCommittee': params = CalculationMethod.MoonsightingCommittee(); break;
      case 'NorthAmerica': params = CalculationMethod.NorthAmerica(); break;
      case 'Kuwait': params = CalculationMethod.Kuwait(); break;
      case 'Qatar': params = CalculationMethod.Qatar(); break;
      case 'Singapore': params = CalculationMethod.Singapore(); break;
      case 'Tehran': params = CalculationMethod.Tehran(); break;
      case 'Turkey': params = CalculationMethod.Turkey(); break;
      default: params = CalculationMethod.MuslimWorldLeague();
    }

    const date = new Date();
    const prayerTimes = new PrayerTimes(coords, date, params);

    const formatTime = (timeDate: Date) =>
      timeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const currentPrayer = prayerTimes.currentPrayer();
    let next = prayerTimes.nextPrayer();
    
    let nextPrayerTimes = prayerTimes;
    if (next === 'none' || (next === 'fajr' && currentPrayer === 'isha')) {
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);
      nextPrayerTimes = new PrayerTimes(coords, nextDate, params);
      next = 'fajr';
    }

    const prayerList: PrayerTime[] = [
      { name: 'Fajr', time: formatTime(prayerTimes.fajr), icon: React.createElement(Sunrise, { size: 24 }), active: now >= prayerTimes.fajr && now < prayerTimes.sunrise, hasToggle: true, rawDate: prayerTimes.fajr },
      { name: 'Sunrise', time: formatTime(prayerTimes.sunrise), icon: React.createElement(Sun, { size: 24 }), active: now >= prayerTimes.sunrise && now < prayerTimes.dhuhr, rawDate: prayerTimes.sunrise },
      { name: 'Dhuhr', time: formatTime(prayerTimes.dhuhr), icon: React.createElement(CloudSun, { size: 24 }), active: now >= prayerTimes.dhuhr && now < prayerTimes.asr, hasToggle: true, rawDate: prayerTimes.dhuhr },
      { name: 'Asr', time: formatTime(prayerTimes.asr), icon: React.createElement(Sun, { size: 24 }), active: now >= prayerTimes.asr && now < prayerTimes.maghrib, hasToggle: true, rawDate: prayerTimes.asr },
      { name: 'Maghrib', time: formatTime(prayerTimes.maghrib), icon: React.createElement(Sunset, { size: 24 }), active: now >= prayerTimes.maghrib && now < prayerTimes.isha, hasToggle: true, rawDate: prayerTimes.maghrib },
      { name: 'Isha', time: formatTime(prayerTimes.isha), icon: React.createElement(Moon, { size: 24 }), active: now >= prayerTimes.isha || now < prayerTimes.fajr, hasToggle: true, rawDate: prayerTimes.isha },
    ];

    let nextP = prayerList.find(p => p.rawDate && p.rawDate > now);
    let nextT = nextP?.rawDate;
    if (!nextP) {
      nextP = { name: 'Fajr', time: formatTime(nextPrayerTimes.fajr), icon: React.createElement(Sunrise, { size: 24 }), rawDate: nextPrayerTimes.fajr };
      nextT = nextPrayerTimes.fajr;
    }

    setPrayers(prayerList);
    setNextPrayer({ name: nextP.name, time: nextP.time, rawDate: nextT });

  }, [location, settings, acjuTimes]);

  // Notifications
  React.useEffect(() => {
    const checkNotifications = () => {
      if (!prayers.length || !settings.enabled) return;
      const now = new Date();
      const nowStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      prayers.forEach(prayer => {
        if (settings.enabled[prayer.name] && prayer.time === nowStr) {
          if (lastNotifiedRef.current !== `${prayer.name}-${nowStr}`) {
            lastNotifiedRef.current = `${prayer.name}-${nowStr}`;
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`Time for ${prayer.name}`, {
                body: `It's time for ${prayer.name} prayer in ${location.city}.`,
                icon: '/favicon.ico',
              });
              playSound(SOUND_URLS[settings.sound] || SOUND_URLS.standard);
            }
          }
        }
      });
    };
    const interval = setInterval(checkNotifications, 30000);
    return () => clearInterval(interval);
  }, [prayers, settings, location.city]);

  return { prayers, nextPrayer, playSound };
};
