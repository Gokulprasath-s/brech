import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TASK_REWARD } from '../constants';

interface TaskPanelProps {
  onComplete: (amount: number) => void;
  isMITM: boolean;
  currentIntegrity: number;
}

type TaskType = 'REFLEX' | 'FORENSICS';

export const TaskPanel: React.FC<TaskPanelProps> = ({ onComplete, isMITM, currentIntegrity }) => {
  const [currentTask, setCurrentTask] = useState<TaskType>('REFLEX');
  const [transitioning, setTransitioning] = useState(false);

  const handleTaskComplete = () => {
    onComplete(TASK_REWARD);
    setTransitioning(true);
    
    // Brief delay/animation before switching tasks
    setTimeout(() => {
      // Toggle between the two remaining tasks
      setCurrentTask(prev => prev === 'REFLEX' ? 'FORENSICS' : 'REFLEX');
      setTransitioning(false);
    }, 1000);
  };

  if (transitioning) {
    return (
      <div className="flex flex-col h-full bg-gray-900 border border-gray-700 rounded-lg items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-green-500 neon-text mb-2">TASK VERIFIED</h2>
        <div className="w-full bg-gray-800 h-1 rounded overflow-hidden">
          <div className="bg-green-500 h-full animate-[loading_1s_ease-in-out]"></div>
        </div>
        <p className="text-xs text-gray-500 mt-2 font-mono">INITIATING NEXT PROTOCOL...</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      {currentTask === 'REFLEX' && (
        <ReflexGame onComplete={handleTaskComplete} isMITM={isMITM} integrity={currentIntegrity} />
      )}
      {currentTask === 'FORENSICS' && (
        <ForensicsGame onComplete={handleTaskComplete} isMITM={isMITM} integrity={currentIntegrity} />
      )}
    </div>
  );
};

// --- GAME 1: REFLEX (Decryption) ---

const ReflexGame: React.FC<{ onComplete: () => void; isMITM: boolean; integrity: number }> = ({ onComplete, isMITM, integrity }) => {
  const [stage, setStage] = useState(0);
  const [status, setStatus] = useState<'ACTIVE' | 'FAIL'>('ACTIVE');
  const [targetPos, setTargetPos] = useState(Math.floor(Math.random() * 60) + 20);
  
  const cursorRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(0);
  const dirRef = useRef(1);
  const reqRef = useRef<number>(0);

  const targetWidth = Math.max(8, 25 - ((100 - integrity) * 0.15));
  const speed = 0.5 + ((100 - integrity) * 0.03);

  const animate = useCallback(() => {
    let currentSpeed = speed;
    if (isMITM && Math.random() < 0.1) posRef.current += (Math.random() * 10 - 5);
    
    posRef.current += currentSpeed * dirRef.current;
    if (posRef.current >= 100 || posRef.current <= 0) dirRef.current *= -1;
    
    const overlap = posRef.current >= targetPos && posRef.current <= targetPos + targetWidth;

    if (cursorRef.current) {
        cursorRef.current.style.left = `${Math.min(100, Math.max(0, posRef.current))}%`;
        
        // Visual cues for lock timing
        if (overlap) {
            cursorRef.current.style.backgroundColor = '#4ade80'; // green-400
            cursorRef.current.style.boxShadow = '0 0 15px #4ade80, 0 0 25px #4ade80';
            cursorRef.current.style.width = '4px';
        } else {
            cursorRef.current.style.backgroundColor = 'white';
            cursorRef.current.style.boxShadow = '0 0 10px white';
            cursorRef.current.style.width = '2px';
        }
    }

    if (targetRef.current) {
        if (overlap) {
             targetRef.current.style.backgroundColor = 'rgba(74, 222, 128, 0.5)'; // green with higher opacity
             targetRef.current.style.borderColor = '#4ade80';
        } else {
             targetRef.current.style.backgroundColor = isMITM ? 'rgba(74, 222, 128, 0.1)' : 'rgba(74, 222, 128, 0.3)';
             targetRef.current.style.borderColor = 'rgba(34, 197, 94, 1)';
        }
    }
    
    if (status === 'ACTIVE') reqRef.current = requestAnimationFrame(animate);
  }, [speed, isMITM, status, targetPos, targetWidth]);

  useEffect(() => {
    if (status === 'ACTIVE') reqRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(reqRef.current);
  }, [animate, status]);

  const handleLock = () => {
    if (status !== 'ACTIVE') return;
    const hit = posRef.current >= targetPos && posRef.current <= targetPos + targetWidth;
    
    if (hit) {
      if (stage >= 2) onComplete();
      else {
        setStage(s => s + 1);
        setTargetPos(Math.floor(Math.random() * 60) + 20);
      }
    } else {
      setStatus('FAIL');
      setTimeout(() => {
        setStage(0);
        setStatus('ACTIVE');
      }, 800);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black/50 border border-green-900/50 rounded-lg p-4 relative overflow-hidden">
      <h3 className="text-green-400 font-bold mb-4 flex justify-between">
        <span>SIGNAL DECRYPTION</span>
        <span className="text-xs font-mono opacity-70">SEQ: {stage}/3</span>
      </h3>
      
      <div className="flex-1 flex flex-col justify-center gap-6">
        <div className="relative w-full h-12 bg-gray-900 rounded border border-gray-700 overflow-hidden cursor-pointer" onClick={handleLock}>
          {/* Target */}
          <div 
            ref={targetRef}
            className={`absolute top-0 bottom-0 border-x transition-colors duration-75 ease-out ${isMITM ? 'opacity-30' : ''}`}
            style={{ 
                left: `${targetPos}%`, 
                width: `${targetWidth}%`,
                backgroundColor: 'rgba(74, 222, 128, 0.3)',
                borderColor: 'rgba(34, 197, 94, 1)'
            }}
          />
          {/* Cursor */}
          <div 
            ref={cursorRef} 
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_white] transition-all duration-75" 
          />
        </div>
        
        <button 
          onClick={handleLock}
          disabled={status === 'FAIL'}
          className={`py-4 rounded font-bold tracking-widest border transition-all ${
            status === 'FAIL' 
            ? 'bg-red-900/50 border-red-500 text-red-500' 
            : 'bg-green-900/20 border-green-500/50 text-green-400 hover:bg-green-500 hover:text-black'
          }`}
        >
          {status === 'FAIL' ? 'SIGNAL LOST' : 'LOCK FREQUENCY'}
        </button>
      </div>
    </div>
  );
};

// --- GAME 2: FORENSICS (Anomaly Detection) ---

const ForensicsGame: React.FC<{ onComplete: () => void; isMITM: boolean; integrity: number }> = ({ onComplete, isMITM, integrity }) => {
  const [grid, setGrid] = useState<number[]>(Array(16).fill(0));
  const [anomalyIndex, setAnomalyIndex] = useState<number>(-1);
  const [score, setScore] = useState(0);
  const [hitEffect, setHitEffect] = useState<number | null>(null);

  // Move anomaly randomly
  useEffect(() => {
    const moveSpeed = Math.max(400, 1000 - ((100 - integrity) * 8));
    
    const interval = setInterval(() => {
      setAnomalyIndex(Math.floor(Math.random() * 16));
    }, moveSpeed);
    
    return () => clearInterval(interval);
  }, [integrity]);

  const handleClick = (index: number) => {
    if (index === anomalyIndex) {
      // Visual feedback
      setHitEffect(index);
      setTimeout(() => setHitEffect(null), 300);

      const newScore = score + 1;
      if (newScore >= 3) {
        onComplete();
      } else {
        setScore(newScore);
        setAnomalyIndex(Math.floor(Math.random() * 16)); // Move immediately
      }
    } else {
      setScore(0); // Reset on miss
    }
  };

  return (
    <div className="flex flex-col h-full bg-black/50 border border-purple-900/50 rounded-lg p-4">
      <h3 className="text-purple-400 font-bold mb-4 flex justify-between">
        <span>DIGITAL FORENSICS</span>
        <span className="text-xs font-mono opacity-70">TRACE: {score}/3</span>
      </h3>

      <div className="flex-1 flex items-center justify-center">
        <div className="grid grid-cols-4 gap-2 w-full max-w-[300px] aspect-square">
          {grid.map((_, i) => (
            <button
              key={i}
              onClick={() => handleClick(i)}
              className={`
                relative rounded border transition-all duration-200 overflow-hidden
                ${i === anomalyIndex 
                  ? 'bg-red-500/20 border-red-500 shadow-[0_0_10px_red]' 
                  : 'bg-gray-900 border-gray-800 hover:border-gray-600'
                }
                ${hitEffect === i ? 'border-green-400 bg-green-500/30' : ''}
              `}
            >
              {/* Anomaly Indicator */}
              {i === anomalyIndex && (
                <div className="absolute inset-2 bg-red-500 rounded-sm animate-ping opacity-75" />
              )}
              
              {/* Hit Success Effect */}
              {hitEffect === i && (
                  <div className="absolute inset-0 bg-green-400 animate-pulse z-10 opacity-50" />
              )}

              {/* MITM Decoys */}
              {isMITM && i !== anomalyIndex && Math.random() < 0.1 && (
                 <div className="absolute inset-0 bg-red-900/20 animate-pulse pointer-events-none" />
              )}
            </button>
          ))}
        </div>
      </div>
      <p className="text-center text-xs text-gray-500 mt-4">ISOLATE THE CORRUPT NODE</p>
    </div>
  );
};
