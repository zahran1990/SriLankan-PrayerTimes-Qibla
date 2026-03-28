// ACJU Sri Lanka Prayer Times Service
// Fetches official monthly timetable images from acju.lk and uses Gemini Vision to OCR them.

import { GoogleGenAI } from '@google/genai';

// ---------------------------------------------------------------------------
// Zone definitions — 13 ACJU zones covering all Sri Lankan districts
// ---------------------------------------------------------------------------

export interface ACJUZone {
  id: string;
  slug: string;
  districts: string[];
  name: string;
}

export const ACJU_ZONES: ACJUZone[] = [
  {
    id: '01',
    slug: '01-COLOMBO-DISTRICT-GAMPAHA-DISTRICT-KALUTARA-DISTRICT',
    name: 'Colombo / Gampaha / Kalutara',
    districts: ['Colombo', 'Gampaha', 'Kalutara', 'Homagama', 'Moratuwa', 'Negombo', 'Panadura', 'Dehiwala', 'Kesbewa', 'Kotte'],
  },
  {
    id: '02',
    slug: '02-JAFFNA-DISTRICT-NALLUR',
    name: 'Jaffna',
    districts: ['Jaffna', 'Nallur', 'Point Pedro', 'Chavakachcheri'],
  },
  {
    id: '03',
    slug: '03-MULLAITIVU-DISTRICT-KILINOCHCHI-DISTRICT-VAVUNIYA-DISTRICT',
    name: 'Mullaitivu / Kilinochchi / Vavuniya',
    districts: ['Mullaitivu', 'Kilinochchi', 'Vavuniya'],
  },
  {
    id: '04',
    slug: '04-MANNAR-DISTRICT-PUTTALAM-DISTRICT',
    name: 'Mannar / Puttalam',
    districts: ['Mannar', 'Puttalam', 'Chilaw', 'Wennappuwa'],
  },
  {
    id: '05',
    slug: '05-ANURADHAPURA-DISTRICT-POLONNARUWA-DISTRICT',
    name: 'Anuradhapura / Polonnaruwa',
    districts: ['Anuradhapura', 'Polonnaruwa', 'Mihintale'],
  },
  {
    id: '06',
    slug: '06-KURUNEGALA-DISTRICT',
    name: 'Kurunegala',
    districts: ['Kurunegala', 'Kuliyapitiya', 'Narammala', 'Wariyapola', 'Bingiriya', 'Giriulla', 'Nikaweratiya', 'Nillambe', 'Maho'],
  },
  {
    id: '07',
    slug: '07-KANDY-DISTRICT-MATALE-DISTRICT-NUWARA-ELIYA-DISTRICT',
    name: 'Kandy / Matale / Nuwara Eliya',
    districts: ['Kandy', 'Matale', 'Nuwara Eliya', 'Hatton', 'Dambulla', 'Sigiriya'],
  },
  {
    id: '08',
    slug: '08-BATTICALOA-DISTRICT-AMPARA-DISTRICT',
    name: 'Batticaloa / Ampara',
    districts: ['Batticaloa', 'Ampara', 'Kalmunai', 'Akkaraipattu', 'Sammanthurai'],
  },
  {
    id: '09',
    slug: '09-TRINCOMALEE-DISTRICT',
    name: 'Trincomalee',
    districts: ['Trincomalee', 'Kinniya', 'Muttur', 'Kantalai'],
  },
  {
    id: '10',
    slug: '10-BADULLA-DISTRICT-MONARAGALA-DISTRICT-PADIYATALAWA-DEHIATHTHAKANDIYA',
    name: 'Badulla / Monaragala',
    districts: ['Badulla', 'Monaragala', 'Bandarawela', 'Ella', 'Wellawaya', 'Padiyatalawa', 'Dehiattakandiya'],
  },
  {
    id: '11',
    slug: '11-RATNAPURA-DISTRICT-KEGALLE-DISTRICT',
    name: 'Ratnapura / Kegalle',
    districts: ['Ratnapura', 'Kegalle', 'Embilipitiya', 'Balangoda'],
  },
  {
    id: '12',
    slug: '12-GALLE-DISTRICT-MATARA-DISTRICT',
    name: 'Galle / Matara',
    districts: ['Galle', 'Matara', 'Hikkaduwa', 'Ambalangoda', 'Weligama', 'Mirissa'],
  },
  {
    id: '13',
    slug: '13-HAMBANTOTA-DISTRICT',
    name: 'Hambantota',
    districts: ['Hambantota', 'Tangalle', 'Tissamaharama', 'Kataragama'],
  },
];

// Month abbreviations used in ACJU URLs
const MONTH_SLUGS: Record<number, string> = {
  1: 'Jan', 2: 'Feb', 3: 'Mar', 4: 'Apr', 5: 'May', 6: 'Jun',
  7: 'Jul', 8: 'Aug', 9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Dec',
};

// Upload base URL — all 2026 files were uploaded to this path
const ACJU_BASE_URL = 'https://www.acju.lk/wp-content/uploads/2025/07';

// ---------------------------------------------------------------------------
// Zone resolution — map user's city/district name to an ACJU zone
// ---------------------------------------------------------------------------

export function getACJUZone(city: string, country: string): ACJUZone {
  if (!country.toLowerCase().includes('sri lanka') && !country.toLowerCase().includes('ceylon')) {
    return ACJU_ZONES[0];
  }
  const cityLower = city.toLowerCase();
  for (const zone of ACJU_ZONES) {
    if (zone.districts.some(d => cityLower.includes(d.toLowerCase()) || d.toLowerCase().includes(cityLower))) {
      return zone;
    }
  }
  return ACJU_ZONES[0]; // Default to Colombo zone
}

// ---------------------------------------------------------------------------
// URL builder
// ---------------------------------------------------------------------------

export function buildTimetableImageUrl(zone: ACJUZone, month: number, _year: number): string {
  const monthSlug = MONTH_SLUGS[month];
  return `${ACJU_BASE_URL}/${zone.slug}-${month}-${monthSlug}-scaled.jpg`;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DailyPrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

export type MonthlyTimetable = Record<string, DailyPrayerTimes>; // key = day number ("1"–"31")

// ---------------------------------------------------------------------------
// Gemini Vision OCR
// Uses Gemini's fileData.fileUri to load the image URL server-side,
// bypassing browser CORS restrictions entirely.
// ---------------------------------------------------------------------------

export async function fetchTimetableViaGemini(
  imageUrl: string,
  zoneName: string,
  month: number,
  year: number
): Promise<MonthlyTimetable> {
  const apiKey = process.env.GEMINI_API_KEY as string | undefined;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const ai = new GoogleGenAI({ apiKey });
  const monthName = new Date(year, month - 1, 1).toLocaleString('en', { month: 'long' });

  const prompt = `This is the official ACJU Sri Lanka prayer timetable for the ${zoneName} zone, ${monthName} ${year}.
Look at the table carefully. Each row represents one day of the month.
The columns are: Date, Fajr, Sunrise (or Ishraq), Dhuhr (or Luhr), Asr, Maghrib, Isha.

Extract ALL prayer times from EVERY row in the table.
Return ONLY a valid JSON object with the day number (1-31) as the key and the times as values.
Use 12-hour format like "4:52 AM" / "12:15 PM". Do not add markdown, only output raw JSON.

Example format:
{"1":{"fajr":"5:05 AM","sunrise":"6:22 AM","dhuhr":"12:22 PM","asr":"3:41 PM","maghrib":"6:22 PM","isha":"7:31 PM"},"2":{...}}`;

  // Gemini fetches the image by URL server-side — no CORS issues.
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [
      {
        role: 'user',
        parts: [
          {
            fileData: {
              mimeType: 'image/jpeg',
              fileUri: imageUrl,
            },
          },
          { text: prompt },
        ],
      },
    ],
  });

  const text = response.text ?? '';
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parsed: MonthlyTimetable = JSON.parse(clean);
  return parsed;
}

// ---------------------------------------------------------------------------
// Cache helpers
// ---------------------------------------------------------------------------

const getCacheKey = (zoneId: string, month: number, year: number) =>
  `acju-timetable-${zoneId}-${year}-${month}`;

export function getCachedTimetable(zoneId: string, month: number, year: number): MonthlyTimetable | null {
  try {
    const key = getCacheKey(zoneId, month, year);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as MonthlyTimetable;
  } catch {
    return null;
  }
}

export function cacheTimetable(zoneId: string, month: number, year: number, data: MonthlyTimetable): void {
  try {
    const key = getCacheKey(zoneId, month, year);
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // localStorage quota exceeded — silently skip
  }
}

export function getTodayFromTimetable(timetable: MonthlyTimetable, date: Date): DailyPrayerTimes | null {
  const day = date.getDate().toString();
  return timetable[day] ?? null;
}
