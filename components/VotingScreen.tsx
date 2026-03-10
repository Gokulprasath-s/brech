import React from 'react';
import { Player } from '../types';

interface VotingScreenProps {
  players: Player[];
  onVote: (id: string | null) => void;
}

export const VotingScreen: React.FC<VotingScreenProps> = ({ players, onVote }) => {
  const alivePlayers = players.filter(p => p.isAlive);

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-red-600 p-8 rounded-lg max-w-2xl w-full shadow-[0_0_50px_rgba(255,0,0,0.2)]">
        <h2 className="text-3xl text-red-500 font-bold mb-2 uppercase text-center neon-red-text">Consensus Required</h2>
        <p className="text-gray-400 text-center mb-8">Identify the anomaly to prune from the network.</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {alivePlayers.map(p => (
            <button
              key={p.id}
              onClick={() => onVote(p.id)}
              className="p-4 bg-gray-800 border border-gray-600 hover:border-red-500 hover:bg-gray-700 rounded transition-all text-left group"
            >
              <div className="text-xs text-gray-500 mb-1">NODE_ID</div>
              <div className="text-lg font-bold text-white group-hover:text-red-400">{p.name}</div>
              {p.id === 'player-me' && <span className="text-[10px] text-green-500">(YOU)</span>}
            </button>
          ))}
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => onVote(null)}
            className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-6 py-3 rounded border border-gray-500"
          >
            SKIP VOTE (Maintain Status Quo)
          </button>
        </div>
      </div>
    </div>
  );
};