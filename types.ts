export enum Role {
  CLIENT = 'CLIENT',
  INFILTRATOR = 'INFILTRATOR',
}

export enum GamePhase {
  LOBBY = 'LOBBY',
  PLAYING = 'PLAYING',
  VOTING = 'VOTING',
  GAMEOVER = 'GAMEOVER',
}

export enum TaskType {
  HASH_MATCH = 'HASH_MATCH',
  SEQUENCE = 'SEQUENCE',
}

export interface Player {
  id: string;
  name: string;
  role: Role;
  isAlive: boolean;
  isBot: boolean;
  avatarId: number;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  originalContent: string;
  timestamp: number;
  isTampered: boolean;
  isSystem?: boolean;
}

export interface PendingMessage extends Message {
  expiresAt: number; // Timestamp when it will auto-send
}

export interface VoteResult {
  targetName: string;
  targetRole: Role;
  wasCorrect: boolean;
  pruned: boolean; // false if skipped
  header: string;
  subtext: string;
}

export interface GameState {
  integrity: number;
  phase: GamePhase;
  players: Player[];
  messages: Message[];
  pendingMessages: PendingMessage[]; // For Infiltrator to intercept
  mitmActive: boolean;
  mitmEndsAt: number;
  dataCorruptionActive: boolean;
  dataCorruptionEndsAt: number;
  winner: Role | null;
  myPlayerId: string;
  voteResult: VoteResult | null;
}

export interface BotProfile {
  name: string;
  avatarId: number;
}