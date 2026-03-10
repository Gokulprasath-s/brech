import { BotProfile } from './types';

export const MAX_INTEGRITY = 100;
export const INTEGRITY_WIN_THRESHOLD = 100;
export const INTEGRITY_LOSS_THRESHOLD = 0;
export const TASK_REWARD = 5;
export const TASK_PENALTY_MITM = 10;
export const INTERCEPT_WINDOW_MS = 5000; // Time infiltrator has to edit
export const MITM_DURATION_MS = 15000;
export const MITM_COOLDOWN_MS = 30000;
export const DATA_CORRUPTION_DURATION_MS = 10000;
export const DATA_CORRUPTION_COOLDOWN_MS = 45000;

export const BOTS: BotProfile[] = [
  { name: 'Unit-734', avatarId: 1 },
  { name: 'Vector_X', avatarId: 2 },
  { name: 'NullPtr', avatarId: 3 },
  { name: 'Daemon_K', avatarId: 4 },
  { name: 'Bit_Walker', avatarId: 5 },
  { name: 'Glitch', avatarId: 6 },
];

export const CHAT_TEMPLATES = [
  "Validating block 0x4A... success.",
  "Sector 7 integrity checks out.",
  "I'm seeing some latency in Sector 3.",
  "Task complete. Uploading hash.",
  "Who is messing with the logs?",
  "Checking node synchronization...",
  "Everything looks stable on my end.",
  "Did anyone else see that fluctuation?",
];

export const TAMPER_TEMPLATES = [
  "I just corrupted Sector 7.",
  "I'm failing tasks on purpose.",
  "The network is weak, let it crash.",
  "Uploading virus to main chain...",
  "I am the Infiltrator.",
  "Deleting system files...",
];