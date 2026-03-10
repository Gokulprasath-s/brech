import React from 'react';
import { useGameLogic } from './hooks/useGameLogic';
import { Lobby } from './components/Lobby';
import { GameScreen } from './components/GameScreen';
import { GamePhase } from './types';

function App() {
  const logic = useGameLogic();
  const { gameState, startGame } = logic;

  return (
    <div className="min-h-screen bg-black text-white">
      {gameState.phase === GamePhase.LOBBY ? (
        <Lobby onStart={startGame} />
      ) : (
        <GameScreen logic={logic} />
      )}
    </div>
  );
}

export default App;