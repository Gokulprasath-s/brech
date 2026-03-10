import React, { useState, useEffect } from 'react';
import { MITM_COOLDOWN_MS, DATA_CORRUPTION_COOLDOWN_MS } from '../constants';

interface InfiltratorControlsProps {
  onTriggerMITM: () => void;
  isMITMActive: boolean;
  onTriggerDataCorruption: () => void;
  isCorruptionActive: boolean;
}

export const InfiltratorControls: React.FC<InfiltratorControlsProps> = ({ 
    onTriggerMITM, 
    isMITMActive,
    onTriggerDataCorruption,
    isCorruptionActive
}) => {
  const [mitmCooldown, setMitmCooldown] = useState(0);
  const [corrCooldown, setCorrCooldown] = useState(0);

  useEffect(() => {
    let interval: number;
    interval = window.setInterval(() => {
        setMitmCooldown(prev => Math.max(0, prev - 1000));
        setCorrCooldown(prev => Math.max(0, prev - 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleMITM = () => {
      if (mitmCooldown === 0 && !isMITMActive) {
          onTriggerMITM();
          setMitmCooldown(MITM_COOLDOWN_MS);
      }
  };

  const handleCorruption = () => {
      if (corrCooldown === 0 && !isCorruptionActive) {
          onTriggerDataCorruption();
          setCorrCooldown(DATA_CORRUPTION_COOLDOWN_MS);
      }
  };

  return (
    <div className="bg-red-950/30 border border-red-900/50 p-4 rounded-lg flex flex-col gap-4">
      <h3 className="text-red-500 font-bold text-sm tracking-widest uppercase border-b border-red-900 pb-2">Control Panel</h3>
      
      {/* MITM Ability */}
      <div className="flex items-center justify-between border-b border-red-900/30 pb-2">
          <div className="text-xs text-red-300">
              <span className="font-bold block text-sm">MITM ATTACK</span>
              <span className="opacity-70">Invert Validations</span>
          </div>
          <button
            onClick={handleMITM}
            disabled={mitmCooldown > 0 || isMITMActive}
            className={`
                px-3 py-2 rounded text-[10px] md:text-xs font-bold border transition-all min-w-[80px]
                ${mitmCooldown > 0 || isMITMActive
                    ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600 border-red-400 text-black hover:bg-red-500 hover:shadow-[0_0_10px_rgba(255,0,0,0.5)]'
                }
            `}
          >
            {isMITMActive ? 'ACTIVE' : mitmCooldown > 0 ? `${mitmCooldown / 1000}s` : 'EXECUTE'}
          </button>
      </div>

      {/* Data Corruption Ability */}
      <div className="flex items-center justify-between">
          <div className="text-xs text-red-300">
              <span className="font-bold block text-sm">DATA CORRUPTION</span>
              <span className="opacity-70">Scramble Chat</span>
          </div>
          <button
            onClick={handleCorruption}
            disabled={corrCooldown > 0 || isCorruptionActive}
            className={`
                px-3 py-2 rounded text-[10px] md:text-xs font-bold border transition-all min-w-[80px]
                ${corrCooldown > 0 || isCorruptionActive
                    ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600 border-red-400 text-black hover:bg-red-500 hover:shadow-[0_0_10px_rgba(255,0,0,0.5)]'
                }
            `}
          >
            {isCorruptionActive ? 'ACTIVE' : corrCooldown > 0 ? `${corrCooldown / 1000}s` : 'EXECUTE'}
          </button>
      </div>

      <div className="text-xs text-gray-500 mt-2 italic">
          PASSIVE: Intercept messages from chat panel.
      </div>
    </div>
  );
};