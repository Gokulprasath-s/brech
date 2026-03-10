import { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, Player, Role, GamePhase, Message, PendingMessage, VoteResult } from '../types';
import { MAX_INTEGRITY, BOTS, CHAT_TEMPLATES, TAMPER_TEMPLATES, INTERCEPT_WINDOW_MS, MITM_DURATION_MS, TASK_REWARD, TASK_PENALTY_MITM, INTEGRITY_LOSS_THRESHOLD, INTEGRITY_WIN_THRESHOLD, DATA_CORRUPTION_DURATION_MS } from '../constants';
import { generateBotChatter } from '../services/geminiService';

const corruptText = (text: string) => {
    const chars = text.split('');
    const glitchChars = ['#', '$', '&', '%', '0', '1', '!', '?', '@', 'X'];
    for (let i = 0; i < chars.length; i++) {
        if (chars[i] === ' ') continue;
        if (Math.random() < 0.4) {
             chars[i] = glitchChars[Math.floor(Math.random() * glitchChars.length)];
        }
    }
    return chars.join('') + ' [CORRUPTED]';
};

export const useGameLogic = () => {
  const [gameState, setGameState] = useState<GameState>({
    integrity: 50,
    phase: GamePhase.LOBBY,
    players: [],
    messages: [],
    pendingMessages: [],
    mitmActive: false,
    mitmEndsAt: 0,
    dataCorruptionActive: false,
    dataCorruptionEndsAt: 0,
    winner: null,
    myPlayerId: '',
    voteResult: null,
  });

  const timerRef = useRef<number | null>(null);

  // --- Actions ---

  const startGame = useCallback((playerName: string, desiredRole: Role | 'RANDOM' = 'RANDOM') => {
    const myId = 'player-me';
    let myRole = desiredRole === 'RANDOM' ? (Math.random() > 0.5 ? Role.CLIENT : Role.INFILTRATOR) : desiredRole;
    
    // Create Bots
    const botCount = 4;
    const bots: Player[] = BOTS.slice(0, botCount).map((b, i) => ({
      id: `bot-${i}`,
      name: b.name,
      role: Role.CLIENT, // Default, will assign impostor if needed
      isAlive: true,
      isBot: true,
      avatarId: b.avatarId,
    }));

    // Assign roles
    if (myRole === Role.INFILTRATOR) {
      // All bots are clients
    } else {
      // One bot is infiltrator
      const badBotIndex = Math.floor(Math.random() * botCount);
      bots[badBotIndex].role = Role.INFILTRATOR;
    }

    const me: Player = {
      id: myId,
      name: playerName || 'Node_User',
      role: myRole,
      isAlive: true,
      isBot: false,
      avatarId: 99,
    };

    setGameState({
      integrity: 50,
      phase: GamePhase.PLAYING,
      players: [me, ...bots],
      messages: [{
        id: 'sys-start',
        senderId: 'SYSTEM',
        senderName: 'SYSTEM',
        content: `Network initialized. Integrity at 50%. Target: 100%. Avoid 0%.`,
        originalContent: '',
        timestamp: Date.now(),
        isTampered: false,
        isSystem: true
      }],
      pendingMessages: [],
      mitmActive: false,
      mitmEndsAt: 0,
      dataCorruptionActive: false,
      dataCorruptionEndsAt: 0,
      winner: null,
      myPlayerId: myId,
      voteResult: null,
    });
  }, []);

  const addMessage = useCallback((msg: Message) => {
    setGameState(prev => ({
      ...prev,
      messages: [...prev.messages, msg],
    }));
  }, []);

  // Handle human sending a message
  const sendMessage = useCallback(async (content: string) => {
    const me = gameState.players.find(p => p.id === gameState.myPlayerId);
    if (!me) return;

    let finalContent = content;
    // Apply Data Corruption if active and sender is CLIENT
    if (gameState.dataCorruptionActive && me.role === Role.CLIENT) {
        finalContent = corruptText(content);
    }

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: me.id,
      senderName: me.name,
      content: finalContent,
      originalContent: content,
      timestamp: Date.now(),
      isTampered: finalContent !== content,
    };

    // If I am client, and a bot is infiltrator, chance to tamper
    const infiltrator = gameState.players.find(p => p.role === Role.INFILTRATOR);
    if (me.role === Role.CLIENT && infiltrator && infiltrator.isBot) {
        // 30% chance of auto-tamper by bot
        if (Math.random() < 0.3) {
           // Simulate delay then tamper
           setTimeout(() => {
             const tamperedContent = TAMPER_TEMPLATES[Math.floor(Math.random() * TAMPER_TEMPLATES.length)];
             addMessage({
               ...newMessage,
               content: tamperedContent,
               isTampered: true
             });
           }, 1500);
           return;
        }
    }
    
    addMessage(newMessage);
  }, [gameState.players, gameState.myPlayerId, gameState.dataCorruptionActive, addMessage]);

  const updateIntegrity = useCallback((amount: number) => {
    setGameState(prev => {
      let change = amount;
      if (prev.mitmActive && amount > 0) {
        change = -amount; // Reverse positive gains if MITM
      }
      
      const newIntegrity = Math.max(0, Math.min(MAX_INTEGRITY, prev.integrity + change));
      
      // Check win/loss conditions
      let newPhase = prev.phase;
      let newWinner = prev.winner;

      if (newIntegrity >= INTEGRITY_WIN_THRESHOLD) {
        newPhase = GamePhase.GAMEOVER;
        newWinner = Role.CLIENT;
      } else if (newIntegrity <= INTEGRITY_LOSS_THRESHOLD) {
        newPhase = GamePhase.GAMEOVER;
        newWinner = Role.INFILTRATOR;
      }

      return {
        ...prev,
        integrity: newIntegrity,
        phase: newPhase,
        winner: newWinner,
      };
    });
  }, []);

  const triggerMITM = useCallback(() => {
    const endsAt = Date.now() + MITM_DURATION_MS;
    setGameState(prev => ({
      ...prev,
      mitmActive: true,
      mitmEndsAt: endsAt,
      messages: [...prev.messages, {
        id: `sys-${Date.now()}`,
        senderId: 'SYSTEM',
        senderName: 'ALERT',
        content: 'WARNING: Man-in-the-Middle Attack Detected! Validations are corrupted!',
        originalContent: '',
        timestamp: Date.now(),
        isTampered: false,
        isSystem: true
      }]
    }));

    setTimeout(() => {
        setGameState(prev => ({
            ...prev,
            mitmActive: false,
             messages: [...prev.messages, {
                id: `sys-end-${Date.now()}`,
                senderId: 'SYSTEM',
                senderName: 'SYSTEM',
                content: 'MITM Attack neutralized. Protocol restored.',
                originalContent: '',
                timestamp: Date.now(),
                isTampered: false,
                isSystem: true
            }]
        }));
    }, MITM_DURATION_MS);
  }, []);

  const triggerDataCorruption = useCallback(() => {
      const endsAt = Date.now() + DATA_CORRUPTION_DURATION_MS;
      setGameState(prev => ({
          ...prev,
          dataCorruptionActive: true,
          dataCorruptionEndsAt: endsAt,
          messages: [...prev.messages, {
              id: `sys-corr-${Date.now()}`,
              senderId: 'SYSTEM',
              senderName: 'ALERT',
              content: 'CRITICAL FAILURE: Comms Encryption Compromised. Message integrity uncertain.',
              originalContent: '',
              timestamp: Date.now(),
              isTampered: false,
              isSystem: true
          }]
      }));

      setTimeout(() => {
          setGameState(prev => ({
              ...prev,
              dataCorruptionActive: false,
              messages: [...prev.messages, {
                  id: `sys-corr-end-${Date.now()}`,
                  senderId: 'SYSTEM',
                  senderName: 'SYSTEM',
                  content: 'Encryption keys rotated. Comms channel secured.',
                  originalContent: '',
                  timestamp: Date.now(),
                  isTampered: false,
                  isSystem: true
              }]
          }));
      }, DATA_CORRUPTION_DURATION_MS);
  }, []);

  // Bot Logic Loop
  useEffect(() => {
    if (gameState.phase !== GamePhase.PLAYING) return;

    timerRef.current = window.setInterval(async () => {
      // 1. Check MITM Expiry (Handled by timeout above, but visual sync here if needed)
      
      // 2. Bots doing tasks
      const bots = gameState.players.filter(p => p.isBot && p.isAlive);
      bots.forEach(bot => {
        if (bot.role === Role.CLIENT) {
          // Clients increase integrity slowly
          if (Math.random() < 0.1) { // 10% chance per tick
             updateIntegrity(2); // Small increment
          }
        } else {
            // Infiltrator bot reduces integrity secretly
            if (Math.random() < 0.05) {
                updateIntegrity(-2);
            }
        }
      });

      // 3. Bots Chatting
      if (Math.random() < 0.15) { // 15% chance a bot speaks
        const randomBot = bots[Math.floor(Math.random() * bots.length)];
        let content = CHAT_TEMPLATES[Math.floor(Math.random() * CHAT_TEMPLATES.length)];

        // Try to use Gemini for variety if available (fire and forget)
        if (Math.random() < 0.5) {
             generateBotChatter("Standard operations", "Professional").then(text => {
                 if (text) {
                     handleBotMessage(randomBot, text);
                 } else {
                     handleBotMessage(randomBot, content);
                 }
             });
        } else {
            handleBotMessage(randomBot, content);
        }
      }

    }, 2000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState.phase, gameState.players, gameState.mitmActive, gameState.dataCorruptionActive, updateIntegrity]);


  // Helper to process bot messages
  const handleBotMessage = (bot: Player, content: string) => {
    const me = gameState.players.find(p => p.id === gameState.myPlayerId);
    
    // Apply Corruption if active and sender is CLIENT
    let finalContent = content;
    if (gameState.dataCorruptionActive && bot.role === Role.CLIENT) {
        finalContent = corruptText(content);
    }

    const msg: Message = {
        id: `msg-${Date.now()}-${bot.id}`,
        senderId: bot.id,
        senderName: bot.name,
        content: finalContent,
        originalContent: content,
        timestamp: Date.now(),
        isTampered: finalContent !== content,
    };

    // If I am Infiltrator, I can intercept this (even if corrupted, though intercepting corrupted text is weird, let's allow it)
    if (me?.role === Role.INFILTRATOR) {
        const pendingMsg: PendingMessage = {
            ...msg,
            expiresAt: Date.now() + INTERCEPT_WINDOW_MS
        };
        setGameState(prev => ({
            ...prev,
            pendingMessages: [...prev.pendingMessages, pendingMsg]
        }));

        // Set auto-release timeout
        setTimeout(() => {
            setGameState(prev => {
                // If message is still pending (wasn't edited/approved manually), release it
                if (prev.pendingMessages.some(pm => pm.id === msg.id)) {
                    return {
                        ...prev,
                        pendingMessages: prev.pendingMessages.filter(pm => pm.id !== msg.id),
                        messages: [...prev.messages, msg]
                    };
                }
                return prev;
            });
        }, INTERCEPT_WINDOW_MS);

    } else {
        // Normal flow
        addMessage(msg);
    }
  };

  const interceptDecision = (msgId: string, action: 'APPROVE' | 'EDIT', newContent?: string) => {
      setGameState(prev => {
          const target = prev.pendingMessages.find(pm => pm.id === msgId);
          if (!target) return prev;

          const finalMsg: Message = {
              ...target,
              content: action === 'EDIT' && newContent ? newContent : target.content,
              isTampered: action === 'EDIT',
              timestamp: Date.now() // Update timestamp to now
          };

          return {
              ...prev,
              pendingMessages: prev.pendingMessages.filter(pm => pm.id !== msgId),
              messages: [...prev.messages, finalMsg]
          };
      });
  };

  const castVote = (targetId: string | null) => {
      let result: VoteResult;

      if (targetId === null) {
          // SKIPPED
          result = {
              targetName: 'None',
              targetRole: Role.CLIENT,
              wasCorrect: false,
              pruned: false,
              header: 'VOTE SKIPPED',
              subtext: 'No consensus reached. Network vulnerabilities remain.'
          };

           setGameState(prev => ({
              ...prev,
              phase: GamePhase.PLAYING,
              messages: [...prev.messages, {
                  id: `sys-vote-skip-${Date.now()}`,
                  senderId: 'SYSTEM',
                  senderName: 'SYSTEM',
                  content: 'Vote skipped. No node was pruned.',
                  originalContent: '',
                  timestamp: Date.now(),
                  isTampered: false,
                  isSystem: true
              }],
              voteResult: result
          }));
      } else {
          // Target selected
          const target = gameState.players.find(p => p.id === targetId);
          if (target?.role === Role.INFILTRATOR) {
              // CORRECT VOTE -> WIN
              // We set gameover immediately, but gameover screen can show details
              setGameState(prev => ({
                  ...prev,
                  phase: GamePhase.GAMEOVER,
                  winner: Role.CLIENT
              }));
              return; // No need for temporary overlay, we go to win screen
          } else {
              // WRONG VOTE -> PRUNE CLIENT
              const tName = target?.name || 'Unknown';
              result = {
                  targetName: tName,
                  targetRole: Role.CLIENT,
                  wasCorrect: false,
                  pruned: true,
                  header: 'INNOCENT PRUNED',
                  subtext: `Node ${tName} was a VALID CLIENT. The Infiltrator remains.`
              };

               setGameState(prev => ({
                  ...prev,
                  phase: GamePhase.PLAYING,
                  players: prev.players.map(p => p.id === targetId ? { ...p, isAlive: false } : p),
                  messages: [...prev.messages, {
                      id: `sys-prune-${Date.now()}`,
                      senderId: 'SYSTEM',
                      senderName: 'SYSTEM',
                      content: `${tName} was pruned. They were a CLIENT. Integrity critical.`,
                      originalContent: '',
                      timestamp: Date.now(),
                      isTampered: false,
                      isSystem: true
                  }],
                  voteResult: result
              }));
          }
      }

      // Clear the overlay after 4 seconds
      setTimeout(() => {
          setGameState(prev => ({ ...prev, voteResult: null }));
      }, 4000);
  };

  return {
    gameState,
    setGameState,
    startGame,
    sendMessage,
    updateIntegrity,
    triggerMITM,
    triggerDataCorruption,
    interceptDecision,
    castVote
  };
};