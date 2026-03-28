export const SOUND_URLS: { [key: string]: string } = {
  makkah: 'https://assets.mixkit.co/active_storage/sfx/2868/2868-preview.mp3',
  madinah: 'https://assets.mixkit.co/active_storage/sfx/2867/2867-preview.mp3',
  quds: 'https://assets.mixkit.co/active_storage/sfx/2866/2866-preview.mp3',
  standard: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
};

export const CALCULATION_METHODS = [
  { id: 'ACJU', name: 'ACJU (Sri Lanka)' },
  { id: 'MuslimWorldLeague', name: 'Muslim World League' },
  { id: 'Egyptian', name: 'Egyptian General Authority' },
  { id: 'Karachi', name: 'Univ. of Islamic Sciences, Karachi' },
  { id: 'UmmAlQura', name: 'Umm al-Qura University, Makkah' },
  { id: 'Dubai', name: 'Dubai' },
  { id: 'MoonsightingCommittee', name: 'Moonsighting Committee' },
  { id: 'NorthAmerica', name: 'ISNA (North America)' },
  { id: 'Kuwait', name: 'Kuwait' },
  { id: 'Qatar', name: 'Qatar' },
  { id: 'Singapore', name: 'Singapore' },
  { id: 'Tehran', name: 'University of Tehran' },
  { id: 'Turkey', name: 'Turkey' },
];

export const DEFAULT_LOCATION = {
  latitude: 6.9271, // Default to Colombo
  longitude: 79.8612,
  city: 'Colombo',
  country: 'Sri Lanka',
};
