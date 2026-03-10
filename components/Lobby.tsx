import React, { useState } from 'react';
import { Role } from '../types';

interface LobbyProps {
  onStart: (name: string, role: Role | 'RANDOM') => void;
}

export const Lobby: React.FC<LobbyProps> = ({ onStart }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role | 'RANDOM'>('RANDOM');

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-green-500 p-4">
      <h1 className="text-6xl font-bold mb-4 neon-text tracking-tighter">CONSENSUS BREACH</h1>
      <p className="mb-8 text-gray-400 max-w-md text-center">
        A decentralized social deduction protocol. Verify transactions to secure the network, or infiltrate and corrupt the ledger.
      </p>

      <div className="bg-gray-900 border border-green-800 p-8 rounded-lg shadow-[0_0_20px_rgba(0,255,0,0.2)] w-full max-w-md">
        <div className="mb-6">
          <label className="block text-sm font-bold mb-2">NODE IDENTIFIER</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter alias..."
            className="w-full bg-black border border-green-700 p-3 rounded text-green-400 focus:outline-none focus:border-green-400 focus:shadow-[0_0_10px_rgba(0,255,0,0.5)] transition-all"
          />
        </div>

        <div className="mb-8">
          <label className="block text-sm font-bold mb-2">PREFERRED PROTOCOL (ROLE)</label>
          <div className="flex gap-2">
            {(['RANDOM', Role.CLIENT, Role.INFILTRATOR] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`flex-1 p-2 border rounded text-xs font-bold transition-all ${
                  role === r
                    ? r === Role.INFILTRATOR 
                        ? 'bg-red-900/50 border-red-500 text-red-100 neon-red-text' 
                        : 'bg-green-900/50 border-green-500 text-green-100 neon-text'
                    : 'border-gray-700 text-gray-500 hover:border-gray-500'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => onStart(name || 'Anonymous', role)}
          className="w-full bg-green-700 hover:bg-green-600 text-black font-bold py-4 rounded uppercase tracking-widest transition-all hover:shadow-[0_0_15px_rgba(0,255,0,0.6)]"
        >
          Initialize Link
        </button>
      </div>
    </div>
  );
};