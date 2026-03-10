import React, { useState } from 'react';
import { useGameLogic } from '../hooks/useGameLogic';
import { GamePhase, Role, VoteResult } from '../types';
import { TaskPanel } from './TaskPanel';
import { ChatPanel } from './ChatPanel';
import { InfiltratorControls } from './InfiltratorControls';
import { VotingScreen } from './VotingScreen';

type MobileTab = 'OPS' | 'COMMS';

export const GameScreen: React.FC<{ logic: ReturnType<typeof useGameLogic> }> = ({ logic }) => {
  const { gameState, sendMessage, updateIntegrity, triggerMITM, triggerDataCorruption, interceptDecision, castVote, setGameState } = logic;
  const [showVote, setShowVote] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('OPS');

  const me = gameState.players.find(p => p.id === gameState.myPlayerId);
  const isInfiltrator = me?.role === Role.INFILTRATOR;

  const handleVoteRequest = () => {
      setGameState(prev => ({ ...prev, phase: GamePhase.VOTING }));
      setShowVote(true);
  };

  const handleVoteSubmit = (targetId: string | null) => {
      castVote(targetId);
      setShowVote(false);
  };

  // Game Over Screen
  if (gameState.phase === GamePhase.GAMEOVER) {
      return (
          <div className="h-screen flex flex-col items-center justify-center bg-black text-center p-4">
              <h1 className={`text-6xl font-bold mb-4 ${gameState.winner === Role.CLIENT ? 'text-green-500 neon-text' : 'text-red-600 neon-red-text'}`}>
                  {gameState.winner === Role.CLIENT ? 'INTEGRITY RESTORED' : 'NETWORK CRASHED'}
              </h1>
              <p className="text-2xl text-gray-300 mb-8">
                  {gameState.winner === Role.CLIENT 
                    ? 'The malicious node has been purged.' 
                    : 'The Infiltrator successfully corrupted the chain.'}
              </p>
              <button onClick={() => window.location.reload()} className="px-8 py-3 bg-white text-black font-bold rounded hover:bg-gray-200">
                  REBOOT SYSTEM
              </button>
          </div>
      );
  }

  return (
    <div className="h-screen flex flex-col bg-black overflow-hidden relative">
      {/* Header */}
      <header className="flex-none flex items-center justify-between bg-gray-900/50 p-3 md:p-4 border-b border-gray-800">
        <div className="flex flex-col">
            <span className="text-[10px] md:text-xs text-gray-500">PROJECT</span>
            <span className="font-bold text-sm md:text-lg text-white">CONSENSUS BREACH</span>
        </div>
        
        <div className="flex-1 mx-4 md:mx-8 max-w-xl">
             <div className="flex justify-between text-[10px] md:text-xs mb-1 text-gray-400">
                 <span>INTEGRITY</span>
                 <span>{gameState.integrity}%</span>
             </div>
             <div className="h-2 md:h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                 <div 
                    className={`h-full transition-all duration-500 ${gameState.integrity < 30 ? 'bg-red-600' : 'bg-green-500'}`}
                    style={{ width: `${gameState.integrity}%` }}
                 />
             </div>
        </div>

        <div className="text-right">
             <span className="text-[10px] md:text-xs text-gray-500 block">IDENTITY</span>
             <span className={`font-bold text-xs md:text-base ${isInfiltrator ? 'text-red-500' : 'text-green-500'}`}>
                 {isInfiltrator ? 'INFILTRATOR' : 'CLIENT NODE'}
             </span>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative pb-16 md:pb-0"> 
        <div className="h-full grid grid-cols-1 md:grid-cols-12 gap-4 p-2 md:p-4">
            
            {/* Left: Tasks & Controls (Visible on Desktop, or Mobile OPS tab) */}
            <div className={`md:col-span-8 flex flex-col gap-4 h-full min-h-0 ${mobileTab === 'OPS' ? 'block' : 'hidden md:flex'}`}>
                {/* Task Area */}
                <div className="flex-1 min-h-0">
                    <TaskPanel 
                        onComplete={updateIntegrity} 
                        isMITM={gameState.mitmActive} 
                        currentIntegrity={gameState.integrity}
                    />
                </div>

                {/* Bottom Controls */}
                <div className="flex-none grid grid-cols-2 gap-4">
                    <div className="bg-gray-900/50 border border-gray-700 p-3 md:p-4 rounded flex flex-col justify-center items-start">
                        <button 
                            onClick={handleVoteRequest}
                            className="w-full bg-yellow-600/20 text-yellow-500 border border-yellow-600 hover:bg-yellow-600 hover:text-black py-3 px-2 md:px-4 rounded font-bold transition-all uppercase text-xs md:text-base"
                        >
                            Initiate Vote
                        </button>
                    </div>

                    {isInfiltrator ? (
                        <InfiltratorControls 
                            onTriggerMITM={triggerMITM} 
                            isMITMActive={gameState.mitmActive} 
                            onTriggerDataCorruption={triggerDataCorruption}
                            isCorruptionActive={gameState.dataCorruptionActive}
                        />
                    ) : (
                        <div className="bg-gray-900/30 border border-gray-800 p-4 rounded flex items-center justify-center text-gray-600 text-xs italic">
                            No special privileges.
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Chat (Visible on Desktop, or Mobile COMMS tab) */}
            <div className={`md:col-span-4 h-full min-h-0 ${mobileTab === 'COMMS' ? 'block' : 'hidden md:block'}`}>
                <ChatPanel 
                    messages={gameState.messages} 
                    pendingMessages={gameState.pendingMessages}
                    role={me?.role || Role.CLIENT}
                    onSend={sendMessage}
                    onInterceptDecision={interceptDecision}
                />
            </div>
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 flex z-40">
        <button 
            onClick={() => setMobileTab('OPS')}
            className={`flex-1 py-4 text-center text-xs font-bold tracking-widest ${mobileTab === 'OPS' ? 'text-green-500 bg-gray-800' : 'text-gray-500'}`}
        >
            OPERATIONS
        </button>
        <button 
            onClick={() => setMobileTab('COMMS')}
            className={`flex-1 py-4 text-center text-xs font-bold tracking-widest relative ${mobileTab === 'COMMS' ? 'text-green-500 bg-gray-800' : 'text-gray-500'}`}
        >
            COMMS
            {gameState.messages.length > 0 && (
                <span className="absolute top-2 right-10 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            )}
        </button>
      </div>

      {/* Voting Overlay */}
      {(showVote || gameState.phase === GamePhase.VOTING) && (
          <VotingScreen players={gameState.players} onVote={handleVoteSubmit} />
      )}

      {/* Vote Result Overlay (Transient) */}
      {gameState.voteResult && (
          <VoteResultOverlay result={gameState.voteResult} />
      )}
    </div>
  );
};

const VoteResultOverlay: React.FC<{ result: VoteResult }> = ({ result }) => {
    const isBad = result.pruned && !result.wasCorrect; // Innocent pruned
    const isNeutral = !result.pruned; // Skipped

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className={`
                w-full max-w-lg p-8 rounded-lg border-2 text-center shadow-[0_0_50px_rgba(0,0,0,0.5)]
                ${isBad ? 'border-red-600 bg-red-950/80' : 'border-yellow-600 bg-yellow-950/80'}
            `}>
                <h2 className={`text-4xl font-bold mb-4 tracking-tighter ${isBad ? 'text-red-500 neon-red-text' : 'text-yellow-500'}`}>
                    {result.header}
                </h2>
                <div className="text-xl text-white mb-6 font-mono">
                    {result.subtext}
                </div>
                {result.pruned && (
                    <div className="inline-block px-4 py-2 bg-black/50 rounded border border-white/20">
                         ROLE: <span className="font-bold">{result.targetRole}</span>
                    </div>
                )}
            </div>
        </div>
    );
};