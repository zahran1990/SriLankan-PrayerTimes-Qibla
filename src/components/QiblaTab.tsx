import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Map as MapIcon, Navigation, Compass } from 'lucide-react';
import { Coordinates, Qibla } from 'adhan';
import { LocationData } from '../types';

interface QiblaTabProps {
  location: LocationData;
}

const getCompassDirection = (angle: number) => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(((angle %= 360) < 0 ? angle + 360 : angle) / 45) % 8;
  return directions[index];
};



export const QiblaTab: React.FC<QiblaTabProps> = ({ location }) => {
  const [qiblaAngle, setQiblaAngle] = React.useState(128);
  const [distance, setDistance] = React.useState(0);
  const [heading, setHeading] = React.useState<number | null>(null);
  const [calibrationError, setCalibrationError] = React.useState<string | null>(null);
  const [isCalibrating, setIsCalibrating] = React.useState(false);
  const hasAbsoluteRef = React.useRef(false);

  React.useEffect(() => {
    if (location.latitude && location.longitude) {
      const coords = new Coordinates(location.latitude, location.longitude);
      const angle = Qibla(coords);
      setQiblaAngle(Math.round(angle));

      // Haversine formula for distance to Mecca (21.4225, 39.8262)
      const R = 6371; // Earth radius in km
      const lat1 = location.latitude * Math.PI / 180;
      const lat2 = 21.4225 * Math.PI / 180;
      const dLat = (21.4225 - location.latitude) * Math.PI / 180;
      const dLon = (39.8262 - location.longitude) * Math.PI / 180;

      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      setDistance(Math.round(R * c));
    }
  }, [location]);

  const handleOrientation = React.useCallback((event: any) => {
    let compassHeading = null;
    if (event.webkitCompassHeading !== undefined && event.webkitCompassHeading !== null) {
      // iOS
      compassHeading = event.webkitCompassHeading;
    } else if (event.type === 'deviceorientationabsolute' && event.alpha !== null) {
      hasAbsoluteRef.current = true;
      compassHeading = 360 - event.alpha;
    } else if (event.type === 'deviceorientation' && event.alpha !== null) {
      // Fallback: only use relative deviceorientation if we haven't received an absolute event
      if (!hasAbsoluteRef.current) {
        compassHeading = 360 - event.alpha;
      }
    } else if (event.alpha !== null) {
      // General fallback
      compassHeading = 360 - event.alpha;
    }
    
    if (compassHeading !== null) {
      let normalized = Math.round(compassHeading) % 360;
      if (normalized < 0) normalized += 360;
      setHeading(normalized);
      setIsCalibrating(false);
    }
  }, []);

  const startCompass = () => {
    setCalibrationError(null);
    setIsCalibrating(true);
    
    // Request permission (iOS 13+)
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      (DeviceOrientationEvent as any).requestPermission()
        .then((permissionState: string) => {
          if (permissionState === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation, true);
          } else {
            setCalibrationError('Permission denied. Please allow compass access in your settings.');
            setIsCalibrating(false);
          }
        })
        .catch(() => {
          setCalibrationError('Sensor access requires HTTPS.');
          setIsCalibrating(false);
        });
    } else {
      // Non-iOS Devices
      window.addEventListener('deviceorientationabsolute', handleOrientation, true);
      // Fallback
      window.addEventListener('deviceorientation', handleOrientation, true);
    }
  };

  React.useEffect(() => {
    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [handleOrientation]);

  // Calculate the relative rotation of the compass based on the live device heading.
  // The compass 'dial' (N/S/E/W) rotates opposite to the heading, and the Kaaba pointer is absolute + relative diff.
  const compassRotation = heading !== null ? -heading : 0;
  const pointerRotation = heading !== null ? qiblaAngle - heading : qiblaAngle;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-8 pb-32"
    >
      <div className="space-y-1">
        <h1 className="font-headline text-4xl font-extrabold text-primary tracking-tight">Qibla Finder</h1>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface-container-low p-5 rounded-2xl flex flex-col justify-between h-32 shadow-sm">
          <Compass className="text-primary" size={32} />
          <div>
            <p className="text-xs font-label text-on-surface-variant uppercase tracking-wider">Angle</p>
            <p className="text-xl font-headline font-bold text-primary">{qiblaAngle}° {getCompassDirection(qiblaAngle)}</p>
          </div>
        </div>
        <div className="bg-surface-container-low p-5 rounded-2xl flex flex-col justify-between h-32 shadow-sm">
          <Navigation className="text-secondary" size={32} />
          <div>
            <p className="text-xs font-label text-on-surface-variant uppercase tracking-wider">Distance</p>
            <p className="text-xl font-headline font-bold text-primary">{distance.toLocaleString()} km</p>
          </div>
        </div>
      </div>

      <section className="flex flex-col items-center justify-center py-12 relative">
        <div className="relative w-72 h-72 md:w-96 md:h-96 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-[12px] border-surface-container shadow-inner"></div>
          <div className="absolute inset-4 rounded-full border border-outline-variant/30"></div>
          
          <motion.div 
            animate={{ rotate: compassRotation }}
            transition={{ type: 'spring', stiffness: 50, damping: 15 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <span className="absolute top-8 font-headline font-bold text-on-surface-variant">N</span>
            <span className="absolute bottom-8 font-headline font-bold text-on-surface-variant">S</span>
            <span className="absolute left-8 font-headline font-bold text-on-surface-variant">W</span>
            <span className="absolute right-8 font-headline font-bold text-on-surface-variant">E</span>
          </motion.div>

          <motion.div 
            animate={{ rotate: pointerRotation }}
            transition={{ type: 'spring', stiffness: 50, damping: 15 }}
            className="relative w-full h-full flex items-center justify-center"
          >

            <div className="z-10 relative flex flex-col items-center">
              <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-b-[120px] border-b-primary drop-shadow-lg"></div>
              <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-t-[80px] border-t-secondary-fixed-dim -mt-[1px] opacity-40"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-surface-container-lowest border-4 border-secondary shadow-md flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
              </div>
            </div>

            <div className="absolute -top-14 flex flex-col items-center gap-2 pointer-events-none">
              <div className="relative group grayscale-0 filter transition-all duration-300">
                <img 
                  src="/kaaba-3d.png" 
                  alt="Kaaba Direction" 
                  className="w-14 h-14 object-contain filter drop-shadow-[0_20px_20px_rgba(0,0,0,0.5)] transform -translate-y-2"
                />
              </div>
            </div>
          </motion.div>
        </div>

        <div className="mt-12 text-center max-w-xs space-y-2">
          {heading === null && (
            <p className="text-on-surface-variant text-sm font-medium">
              Sensor inactive. Compass shows absolute angle.
            </p>
          )}
          {calibrationError && (
            <p className="text-red-500 text-sm font-medium">{calibrationError}</p>
          )}
          <p className="text-on-surface-variant text-sm leading-relaxed">
            Keep your device flat and move it in a <span className="text-primary font-bold">figure 8</span> motion to increase accuracy.
          </p>
        </div>
      </section>

      <div className="space-y-4">
        <button 
          onClick={startCompass}
          disabled={heading !== null || isCalibrating}
          className="w-full bg-primary text-on-primary font-headline font-bold py-5 rounded-full flex items-center justify-center gap-3 shadow-xl hover:opacity-95 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Compass size={20} />
          {heading !== null ? 'Sensor Active' : isCalibrating ? 'Calibrating...' : 'Calibrate Sensor'}
        </button>

        <div className="bg-surface-container-lowest p-6 rounded-[2rem] shadow-sm border border-outline-variant/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed">
              <MapPin size={24} />
            </div>
            <div>
              <h3 className="font-headline font-bold text-primary">
                {location.loading ? 'Detecting...' : location.city}
              </h3>
              <p className="text-xs text-on-surface-variant font-medium">
                {location.loading ? 'Fetching coordinates...' : `Lat: ${location.latitude.toFixed(4)}° N, Long: ${location.longitude.toFixed(4)}° E`}
              </p>
            </div>
          </div>
          <button className="text-primary hover:bg-primary-fixed/20 p-2 rounded-full transition-colors">
            <MapPin size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
