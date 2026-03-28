import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Plus } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { LocationData } from '../types';

// Fix Leaflet marker icons using CDN
const markerIcon = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const markerShadow = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const MapPicker = ({ position, onPositionChange }: { position: [number, number], onPositionChange: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });

  return <Marker position={position} />;
};

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (lat: number, lng: number, city: string, country: string, isManual: boolean) => void;
  currentLocation: LocationData;
}

export const LocationModal: React.FC<LocationModalProps> = ({ 
  isOpen, 
  onClose, 
  onSelect, 
  currentLocation 
}) => {
  const [search, setSearch] = React.useState('');
  const [results, setResults] = React.useState<any[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [mapPos, setMapPos] = React.useState<[number, number]>([currentLocation.latitude, currentLocation.longitude]);

  React.useEffect(() => {
    if (isOpen) {
      setMapPos([currentLocation.latitude, currentLocation.longitude]);
    }
  }, [isOpen, currentLocation.latitude, currentLocation.longitude]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search)}&limit=5`);
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const selectResult = (res: any) => {
    const lat = parseFloat(res.lat);
    const lng = parseFloat(res.lon);
    
    // Attempting to extract cleaner city/country names
    const displayNameParts = res.display_name.split(',');
    const city = res.address?.city || res.address?.town || displayNameParts[0];
    const country = res.address?.country || displayNameParts.pop().trim();
    
    onSelect(lat, lng, city, country, true);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-surface-container-lowest w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="p-8 space-y-6 overflow-y-auto">
          <div className="flex justify-between items-center">
            <h2 className="font-headline text-2xl font-bold text-primary">Set Location</h2>
            <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full transition-colors">
              <Plus size={24} className="rotate-45" />
            </button>
          </div>

          <form onSubmit={handleSearch} className="relative">
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search city or area..."
              className="w-full bg-surface-container-low border border-outline-variant/30 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-primary/20 font-body"
            />
            <button 
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary text-white px-4 py-2 rounded-xl font-bold text-sm"
            >
              {searching ? '...' : 'Search'}
            </button>
          </form>

          {results.length > 0 && (
            <div className="space-y-2">
              {results.map((res, idx) => (
                <button 
                  key={idx}
                  onClick={() => selectResult(res)}
                  className="w-full text-left p-4 rounded-2xl hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all flex items-center gap-3"
                >
                  <MapPin size={18} className="text-primary" />
                  <span className="text-sm font-medium truncate">{res.display_name}</span>
                </button>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <p className="text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant px-1">Map Selection</p>
            <div className="h-64 rounded-3xl overflow-hidden border border-outline-variant/30 relative z-0">
              <MapContainer center={mapPos} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapPicker position={mapPos} onPositionChange={(lat, lng) => setMapPos([lat, lng])} />
              </MapContainer>
            </div>
            <button 
              onClick={() => {
                setSearching(true);
                if ('geolocation' in navigator) {
                  navigator.geolocation.getCurrentPosition(async (pos) => {
                    try {
                      const lat = pos.coords.latitude;
                      const lng = pos.coords.longitude;
                      setMapPos([lat, lng]);
                      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
                      const data = await res.json();
                      const city = data.address.city || data.address.town || data.address.village || 'Selected Location';
                      const country = data.address.country || '';
                      onSelect(lat, lng, city, country, false);
                      onClose();
                    } catch (err) {
                      console.error('Error fetching reverse geocoding data:', err);
                    } finally {
                      setSearching(false);
                    }
                  }, (error) => {
                    console.error("Geolocation error:", error);
                    setSearching(false);
                  });
                } else {
                  console.error("Geolocation is not supported by this browser.");
                  setSearching(false);
                }
              }}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-4 rounded-2xl shadow-sm hover:opacity-90 transition-opacity"
            >
              {searching ? 'Locating...' : (
                <>
                  <MapPin size={20} />
                  Locate Me
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
