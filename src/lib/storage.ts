import type { BattleStats, GameMode } from '@/types/game';

const STORAGE_KEYS = {
  PLAYER_ID: 'deep-sea-arena-player-id',
  PLAYER_NAME: 'deep-sea-arena-player-name',
  SELECTED_LOADOUT: 'deep-sea-arena-loadout',
  GAME_MODE: 'deep-sea-arena-game-mode',
  ROOM_CODE: 'deep-sea-arena-room-code',
  BATTLE_STATS: 'deep-sea-arena-battle-stats',
};

export function getPlayerId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.PLAYER_ID);
}

export function setPlayerId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PLAYER_ID, id);
}

export function getPlayerName(): string {
  if (typeof window === 'undefined') return 'Player';
  return localStorage.getItem(STORAGE_KEYS.PLAYER_NAME) || 'Player';
}

export function setPlayerName(name: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, name);
}

export function getSelectedLoadout(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.SELECTED_LOADOUT);
}

export function setSelectedLoadout(loadoutId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.SELECTED_LOADOUT, loadoutId);
}

export function getGameMode(): GameMode | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.GAME_MODE) as GameMode | null;
}

export function setGameMode(mode: GameMode): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.GAME_MODE, mode);
}

export function getRoomCode(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.ROOM_CODE);
}

export function setRoomCode(code: string | null): void {
  if (typeof window === 'undefined') return;
  if (code) {
    localStorage.setItem(STORAGE_KEYS.ROOM_CODE, code);
  } else {
    localStorage.removeItem(STORAGE_KEYS.ROOM_CODE);
  }
}

export function getBattleStats(): BattleStats | null {
  if (typeof window === 'undefined') return null;
  const stats = localStorage.getItem(STORAGE_KEYS.BATTLE_STATS);
  return stats ? JSON.parse(stats) : null;
}

export function setBattleStats(stats: BattleStats): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.BATTLE_STATS, JSON.stringify(stats));
}

export function clearBattleData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.ROOM_CODE);
  localStorage.removeItem(STORAGE_KEYS.BATTLE_STATS);
}
