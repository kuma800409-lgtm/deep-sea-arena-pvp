export type WeaponType = 'laser' | 'kinetic' | 'missile' | 'plasma';
export type TacticalCommand = 'focusFire' | 'evasive' | 'energyShunt';
export type GameMode = 'ai' | 'pvp';
export type BattleResult = 'victory' | 'defeat' | 'draw';

export interface ShipStats {
  shield: number;
  armor: number;
  hull: number;
  maxShield: number;
  maxArmor: number;
  maxHull: number;
}

export interface Weapon {
  name: string;
  type: WeaponType;
  damage: number;
  fireRate: number;
  shieldMultiplier: number;
  armorMultiplier: number;
  hullMultiplier: number;
}

export interface TacticalCommandConfig {
  cooldown: number;
  duration: number;
  damageBonus?: number;
  dodgeChance?: number;
  accuracyPenalty?: number;
  shieldRegenBonus?: number;
  weaponPenalty?: number;
  description: string;
}

export interface Loadout {
  id: string;
  name: string;
  weapons: WeaponType[];
  description: string;
}

export interface Player {
  id: string;
  name: string;
  ship: ShipStats;
  loadout: Loadout;
  mana: number;
  maxMana: number;
  totalDamageDealt: number;
  isAI?: boolean;
}

export interface BattleState {
  roomId: string;
  player: Player;
  opponent: Player;
  timeRemaining: number;
  isActive: boolean;
  winner: string | null;
  battleLog: BattleEvent[];
  tacticalCooldowns: {
    focusFire: number;
    evasive: number;
    energyShunt: number;
  };
  activeTacticalEffects: {
    focusFire?: number;
    evasive?: number;
    energyShunt?: number;
  };
}

export interface BattleEvent {
  id: string;
  type: 'attack' | 'damage' | 'tactical' | 'ultimate' | 'shield_regen' | 'shield_break' | 'armor_break' | 'victory' | 'defeat';
  timestamp: number;
  playerId?: string;
  targetId?: string;
  damage?: number;
  weapon?: string;
  command?: TacticalCommand;
}

export interface DamageNumber {
  id: string;
  value: number;
  x: number;
  y: number;
  isPlayer: boolean;
  timestamp: number;
}

export interface BattleStats {
  timeSurvived: number;
  damageDealt: number;
  damageTaken: number;
  ultimatesUsed: number;
  tacticalCommandsUsed: number;
  accuracy: number;
}

export interface MatchmakingState {
  status: 'idle' | 'searching' | 'found' | 'joining';
  roomCode?: string;
  opponentId?: string;
  error?: string;
}

export interface GameConfig {
  ship: {
    maxShield: number;
    maxArmor: number;
    maxHull: number;
    shieldRegenRate: number;
    shieldRegenDelay: number;
  };
  weapons: Record<WeaponType, {
    name: string;
    damage: number;
    fireRate: number;
    shieldMultiplier: number;
    armorMultiplier: number;
    hullMultiplier: number;
  }>;
  tacticalCommands: Record<TacticalCommand, TacticalCommandConfig>;
  battle: {
    duration: number;
    aiDifficulty: number;
  };
  loadouts: Record<string, {
    name: string;
    weapons: WeaponType[];
    description: string;
  }>;
}

export interface WebSocketMessage {
  type: 'state_update' | 'attack' | 'tactical' | 'ultimate' | 'ping' | 'pong' | 'error' | 'battle_end' | 'matchmaking_update';
  payload: unknown;
  timestamp: number;
  sequence?: number;
}
