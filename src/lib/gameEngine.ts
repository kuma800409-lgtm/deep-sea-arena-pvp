import type { 
  ShipStats, 
  Player, 
  WeaponType, 
  TacticalCommand,
  BattleEvent,
  Loadout,
  GameConfig
} from '@/types/game';

let gameConfig: GameConfig | null = null;

export async function loadGameConfig(): Promise<GameConfig> {
  if (gameConfig) return gameConfig;
  
  const response = await fetch('/game-config.json');
  gameConfig = await response.json();
  return gameConfig!;
}

export function getGameConfig(): GameConfig | null {
  return gameConfig;
}

export function createShipStats(config: GameConfig): ShipStats {
  return {
    shield: config.ship.maxShield,
    armor: config.ship.maxArmor,
    hull: config.ship.maxHull,
    maxShield: config.ship.maxShield,
    maxArmor: config.ship.maxArmor,
    maxHull: config.ship.maxHull,
  };
}

export function createPlayer(
  id: string, 
  name: string, 
  loadout: Loadout, 
  config: GameConfig,
  isAI: boolean = false
): Player {
  return {
    id,
    name,
    ship: createShipStats(config),
    loadout,
    mana: 0,
    maxMana: 100,
    totalDamageDealt: 0,
    isAI,
  };
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function generatePlayerId(): string {
  return `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function calculateDamage(
  weaponType: WeaponType,
  targetShip: ShipStats,
  config: GameConfig,
  damageBonus: number = 1.0
): { damage: number; shieldDamage: number; armorDamage: number; hullDamage: number } {
  const weapon = config.weapons[weaponType];
  let baseDamage = weapon.damage * damageBonus;
  
  const rng = 0.95 + Math.random() * 0.1;
  baseDamage = Math.floor(baseDamage * rng);
  
  let remainingDamage = baseDamage;
  let shieldDamage = 0;
  let armorDamage = 0;
  let hullDamage = 0;
  
  if (targetShip.shield > 0) {
    const effectiveDamage = Math.floor(remainingDamage * weapon.shieldMultiplier);
    shieldDamage = Math.min(targetShip.shield, effectiveDamage);
    remainingDamage = Math.max(0, effectiveDamage - shieldDamage);
  }
  
  if (remainingDamage > 0 && targetShip.armor > 0) {
    const effectiveDamage = Math.floor(remainingDamage * weapon.armorMultiplier);
    armorDamage = Math.min(targetShip.armor, effectiveDamage);
    remainingDamage = Math.max(0, effectiveDamage - armorDamage);
  }
  
  if (remainingDamage > 0) {
    const effectiveDamage = Math.floor(remainingDamage * weapon.hullMultiplier);
    hullDamage = Math.min(targetShip.hull, effectiveDamage);
  }
  
  return {
    damage: shieldDamage + armorDamage + hullDamage,
    shieldDamage,
    armorDamage,
    hullDamage,
  };
}

export function applyDamage(ship: ShipStats, damage: { shieldDamage: number; armorDamage: number; hullDamage: number }): ShipStats {
  return {
    ...ship,
    shield: Math.max(0, ship.shield - damage.shieldDamage),
    armor: Math.max(0, ship.armor - damage.armorDamage),
    hull: Math.max(0, ship.hull - damage.hullDamage),
  };
}

export function regenerateShield(ship: ShipStats, config: GameConfig, energyShuntActive: boolean): ShipStats {
  if (ship.shield >= ship.maxShield) return ship;
  
  let regenRate = config.ship.shieldRegenRate;
  if (energyShuntActive) {
    regenRate *= config.tacticalCommands.energyShunt.shieldRegenBonus!;
  }
  
  return {
    ...ship,
    shield: Math.min(ship.maxShield, ship.shield + regenRate),
  };
}

export function isShipDestroyed(ship: ShipStats): boolean {
  return ship.hull <= 0;
}

export function getHealthPercentage(current: number, max: number): number {
  return Math.max(0, Math.min(100, (current / max) * 100));
}

export function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function createBattleEvent(
  type: BattleEvent['type'],
  playerId?: string,
  data?: Partial<BattleEvent>
): BattleEvent {
  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    timestamp: Date.now(),
    playerId,
    ...data,
  };
}

export class AIOpponent {
  private difficulty: number;
  private lastTacticalUse: number = 0;
  private tacticalCooldown: number = 2000;
  
  constructor(difficulty: number = 0.6) {
    this.difficulty = difficulty;
  }
  
  shouldUseTactical(currentTime: number): TacticalCommand | null {
    if (currentTime - this.lastTacticalUse < this.tacticalCooldown) {
      return null;
    }
    
    if (Math.random() > 0.3) {
      return null;
    }
    
    this.lastTacticalUse = currentTime;
    
    const commands: TacticalCommand[] = ['focusFire', 'evasive', 'energyShunt'];
    return commands[Math.floor(Math.random() * commands.length)];
  }
  
  shouldUseUltimate(mana: number): boolean {
    return mana >= 100;
  }
  
  selectWeapon(weapons: WeaponType[]): WeaponType {
    return weapons[Math.floor(Math.random() * weapons.length)];
  }
  
  getAttackDelay(): number {
    const baseDelay = 1000;
    const variation = 500;
    return baseDelay + Math.random() * variation * (2 - this.difficulty);
  }
}

export function getLoadoutById(loadoutId: string, config: GameConfig): Loadout {
  const loadoutConfig = config.loadouts[loadoutId];
  return {
    id: loadoutId,
    name: loadoutConfig.name,
    weapons: loadoutConfig.weapons,
    description: loadoutConfig.description,
  };
}

export function getAllLoadouts(config: GameConfig): Loadout[] {
  return Object.entries(config.loadouts).map(([id, loadout]) => ({
    id,
    name: loadout.name,
    weapons: loadout.weapons,
    description: loadout.description,
  }));
}
