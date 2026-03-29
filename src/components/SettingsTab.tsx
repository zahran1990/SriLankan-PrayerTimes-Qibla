import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Palette, Ruler, HelpCircle, Info, ShieldCheck, Clock } from 'lucide-react';
import { NotificationSettings } from '../types';
import { CALCULATION_METHODS } from '../constants';

interface SettingsTabProps {
  settings: NotificationSettings;
  onUpdateSettings: (settings: NotificationSettings) => void;
  onTestNotification: () => void;
  theme: 'light' | 'dark' | 'auto';
  onUpdateTheme: (theme: 'light' | 'dark' | 'auto') => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ 
  settings, 
  onUpdateSettings, 
  onTestNotification, 
  theme, 
  onUpdateTheme 
}) => {
  const [isHelpExpanded, setIsHelpExpanded] = React.useState(false);
  const [isDisclaimerExpanded, setIsDisclaimerExpanded] = React.useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8 pb-6"
    >
      <div className="space-y-1">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight text-primary">Settings</h1>
      </div>

      <div className="space-y-6">
        <section>
          <div className="bg-surface-container-lowest rounded-3xl p-2 space-y-1 shadow-sm">
            <div className="p-3 space-y-3">
              <div className="flex items-center gap-3 px-1">
                <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                  <Ruler size={16} />
                </div>
                <p className="font-bold text-on-surface text-sm">Calculation Method</p>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <select 
                  value={settings.method}
                  onChange={(e) => onUpdateSettings({ ...settings, method: e.target.value })}
                  className="w-full p-3 rounded-2xl bg-surface-container-low text-on-surface border-none focus:ring-2 focus:ring-primary text-sm font-medium appearance-none cursor-pointer"
                >
                  {CALCULATION_METHODS.map((method) => (
                    <option key={method.id} value={method.id}>
                      {method.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button 
              onClick={onTestNotification}
              className="w-full text-left p-4 hover:bg-surface-container-low transition-colors text-primary font-bold text-sm"
            >
              Test Notification Sound
            </button>
          </div>
        </section>

        <section>
          <div className="bg-surface-container-low rounded-3xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-secondary-container rounded-full flex items-center justify-center text-on-secondary-container">
                  <Clock size={16} />
                </div>
                <div>
                  <p className="font-bold text-sm text-primary">24-Hour Format</p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">Show times like 14:30 instead of 02:30 PM</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-2">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.use24HourFormat || false}
                  onChange={(e) => onUpdateSettings({ ...settings, use24HourFormat: e.target.checked })}
                />
                <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </section>

        <section>
          <div className="bg-surface-container-low rounded-3xl p-4 flex flex-col justify-between min-h-[140px] shadow-sm">
            <div className="w-8 h-8 bg-secondary-container rounded-full flex items-center justify-center text-on-secondary-container">
              <Palette size={18} />
            </div>
            <div>
              <p className="font-bold text-sm text-primary">Display Theme</p>
              <p className="text-[11px] text-on-surface-variant mb-3">Current: {theme.charAt(0).toUpperCase() + theme.slice(1)}</p>
              <div className="flex gap-2">
                {(['auto', 'light', 'dark'] as const).map((t) => (
                  <button 
                    key={t}
                    onClick={() => onUpdateTheme(t)}
                    className={`flex-1 py-1.5 rounded-full text-[10px] font-bold active:scale-95 transition-all ${theme === t ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface'}`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-headline text-[10px] font-bold tracking-[0.15em] uppercase text-on-surface-variant mb-2 px-2">Support & Info</h2>
          <div className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-sm">
            <div 
              onClick={() => setIsHelpExpanded(!isHelpExpanded)}
              className="flex flex-col p-4 hover:bg-surface-container-low transition-colors cursor-pointer group border-b border-surface-container-low"
            >
              <div className="flex items-center gap-3">
                <div className="text-secondary"><HelpCircle size={20} /></div>
                <span className="flex-1 font-medium text-on-surface text-sm">Help & Support</span>
                <ChevronRight 
                  size={18} 
                  className={`text-outline-variant transition-transform duration-300 ${isHelpExpanded ? 'rotate-90' : 'group-hover:translate-x-1'}`} 
                />
              </div>
              {isHelpExpanded && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="mt-3 ml-8 space-y-2 border-l-2 border-primary/20 pl-4 py-1"
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold opacity-70">Email</span>
                    <a href="mailto:zahranthe1@yahoo.com" className="text-sm font-semibold text-primary hover:underline">zahranthe1@yahoo.com</a>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold opacity-70">Mobile</span>
                    <a href="tel:+94720290280" className="text-sm font-semibold text-primary hover:underline">+94 720 290 280</a>
                  </div>
                </motion.div>
              )}
            </div>

            <div 
              onClick={() => setIsDisclaimerExpanded(!isDisclaimerExpanded)}
              className="flex flex-col p-4 hover:bg-surface-container-low transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="text-secondary"><Info size={20} /></div>
                <span className="flex-1 font-medium text-on-surface text-sm">Disclaimer</span>
                <ChevronRight 
                  size={18} 
                  className={`text-outline-variant transition-transform duration-300 ${isDisclaimerExpanded ? 'rotate-90' : 'group-hover:translate-x-1'}`} 
                />
              </div>
              {isDisclaimerExpanded && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="mt-3 ml-8 border-l-2 border-primary/20 pl-4 py-1"
                >
                  <p className="text-sm leading-relaxed text-on-surface-variant font-medium italic">
                    "Thank you for using the app. Please note that calculated prayer times may occasionally vary by a few minutes."
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
};
