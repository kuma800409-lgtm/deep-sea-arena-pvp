'use client';

import { useState, useEffect, useCallback, useRef, Suspense, useLayoutEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Battleship } from '@/components/Battleship';
import { HealthBars } from '@/components/HealthBars';
import { TacticalPanel } from '@/components/TacticalButtons';
import { BattleTimer } from '@/components/BattleTimer';
import { 
  BattleEffectsLayer, 
  ImprovedDamageNumber,
  type SkillEffect,
  type ProjectileEffect,
  type ImpactEffect,
  type Position,
} from '@/components/BattleEffectsLayer';
import { 
  loadGameConfig, 
  createPlayer, 
  getLoadoutById, 
  calculateDamage, 
  applyDamage, 
  regenerateShield,
  isShipDestroyed,
  AIOpponent,
  generatePlayerId
} from '@/lib/gameEngine';
import { setBattleStats } from '@/lib/storage';
import type { 
  Player, 
  GameConfig, 
  TacticalCommand, 
  BattleStats
} from '@/types/game';

// Damage number type for internal use
interface DamageNumberData {
  id: string;
  value: number;
  x: number;
  y: number;
  isPlayerTarget: boolean;
  isCritical: boolean;
  timestamp: number;
}

const BATTLE_DURATION = 90000;
const TICK_INTERVAL = 100;
const MANA_PER_ATTACK = 15;
const MAX_MANA = 100;

function BattleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [opponent, setOpponent] = useState<Player | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(BATTLE_DURATION);
  const [isActive, setIsActive] = useState(false);
  const [damageNumbers, setDamageNumbers] = useState<DamageNumberData[]>([]);
  const [battleStarted, setBattleStarted] = useState(false);
  const [countdown, setCountdown] = useState(3);
  
  const [tacticalCooldowns, setTacticalCooldowns] = useState({
    focusFire: 0,
    evasive: 0,
    energyShunt: 0,
  });
  
  const [activeTacticalEffects, setActiveTacticalEffects] = useState<{
    focusFire?: number;
    evasive?: number;
    energyShunt?: number;
  }>({});
  
  const [opponentTacticalEffects, setOpponentTacticalEffects] = useState<{
    focusFire?: number;
    evasive?: number;
    energyShunt?: number;
  }>({});

  // Visual effects state
  const [skillEffects, setSkillEffects] = useState<SkillEffect[]>([]);
  const [projectiles, setProjectiles] = useState<ProjectileEffect[]>([]);
  const [impacts, setImpacts] = useState<ImpactEffect[]>([]);
  const [isScreenShaking, setIsScreenShaking] = useState(false);
  const [isHitFlashing, setIsHitFlashing] = useState(false);
  const [playerHitFlash, setPlayerHitFlash] = useState(false);
  const [enemyHitFlash, setEnemyHitFlash] = useState(false);

  // Refs for ship positions
  const battleAreaRef = useRef<HTMLDivElement>(null);
  const playerShipRef = useRef<HTMLDivElement>(null);
  const enemyShipRef = useRef<HTMLDivElement>(null);
  const [playerPos, setPlayerPos] = useState<Position | null>(null);
  const [enemyPos, setEnemyPos] = useState<Position | null>(null);

  const aiRef = useRef<AIOpponent | null>(null);
  const configRef = useRef<GameConfig | null>(null);
  const playerRef = useRef<Player | null>(null);
  const opponentRef = useRef<Player | null>(null);
  const isActiveRef = useRef(false);
  const playerTacticalRef = useRef<typeof activeTacticalEffects>({});
  const opponentTacticalRef = useRef<typeof opponentTacticalEffects>({});
  
  const battleStatsRef = useRef<BattleStats>({
    timeSurvived: 0,
    damageDealt: 0,
    damageTaken: 0,
    ultimatesUsed: 0,
    tacticalCommandsUsed: 0,
    accuracy: 100,
  });

  // Keep refs in sync with state
  useEffect(() => { configRef.current = config; }, [config]);
  useEffect(() => { playerRef.current = player; }, [player]);
  useEffect(() => { opponentRef.current = opponent; }, [opponent]);
  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);
  useEffect(() => { playerTacticalRef.current = activeTacticalEffects; }, [activeTacticalEffects]);
  useEffect(() => { opponentTacticalRef.current = opponentTacticalEffects; }, [opponentTacticalEffects]);

  // Calculate ship positions for effects
  useLayoutEffect(() => {
    const updatePositions = () => {
      if (!battleAreaRef.current || !playerShipRef.current || !enemyShipRef.current) return;

      const areaRect = battleAreaRef.current.getBoundingClientRect();
      const playerRect = playerShipRef.current.getBoundingClientRect();
      const enemyRect = enemyShipRef.current.getBoundingClientRect();

      setPlayerPos({
        x: playerRect.left + playerRect.width / 2 - areaRect.left,
        y: playerRect.top + playerRect.height / 2 - areaRect.top,
      });

      setEnemyPos({
        x: enemyRect.left + enemyRect.width / 2 - areaRect.left,
        y: enemyRect.top + enemyRect.height / 2 - areaRect.top,
      });
    };

    updatePositions();
    window.addEventListener('resize', updatePositions);
    const interval = setInterval(updatePositions, 500);
    
    return () => {
      window.removeEventListener('resize', updatePositions);
      clearInterval(interval);
    };
  }, [battleStarted]);

  const mode = searchParams.get('mode') || 'ai';
  const loadoutId = searchParams.get('loadout') || 'balanced';

  useEffect(() => {
    async function init() {
      const gameConfig = await loadGameConfig();
      setConfig(gameConfig);
      
      const playerLoadout = getLoadoutById(loadoutId, gameConfig);
      const newPlayer = createPlayer(generatePlayerId(), 'You', playerLoadout, gameConfig, false);
      setPlayer(newPlayer);
      
      if (mode === 'ai') {
        const aiLoadouts = ['balanced', 'shieldBreaker', 'armorPiercer', 'heavyGunner'];
        const randomLoadout = aiLoadouts[Math.floor(Math.random() * aiLoadouts.length)];
        const aiLoadout = getLoadoutById(randomLoadout, gameConfig);
        const aiPlayer = createPlayer('ai-opponent', 'AI Commander', aiLoadout, gameConfig, true);
        setOpponent(aiPlayer);
        aiRef.current = new AIOpponent(gameConfig.battle.aiDifficulty);
      }
    }
    init();
  }, [loadoutId, mode]);

  useEffect(() => {
    if (!player || !opponent || !config) return;
    
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (!battleStarted) {
      setBattleStarted(true);
      setIsActive(true);
    }
  }, [countdown, player, opponent, config, battleStarted]);

  // ========== VISUAL EFFECTS FUNCTIONS ==========
  
  const triggerScreenShake = useCallback((duration = 300) => {
    setIsScreenShaking(true);
    setTimeout(() => setIsScreenShaking(false), duration);
  }, []);

  const triggerHitFlash = useCallback(() => {
    setIsHitFlashing(true);
    setTimeout(() => setIsHitFlashing(false), 150);
  }, []);

  const spawnSkillEffect = useCallback((type: SkillEffect['type'], source: 'player' | 'enemy', duration = 400) => {
    const id = `skill-${Date.now()}-${Math.random()}`;
    setSkillEffects(prev => [...prev, { id, type, source, createdAt: performance.now() }]);
    setTimeout(() => {
      setSkillEffects(prev => prev.filter(e => e.id !== id));
    }, duration);
  }, []);

  const spawnProjectile = useCallback((kind: ProjectileEffect['kind'], from: 'player' | 'enemy', duration = 300) => {
    const id = `proj-${Date.now()}-${Math.random()}`;
    const to = from === 'player' ? 'enemy' : 'player';
    setProjectiles(prev => [...prev, { id, kind, from, to, createdAt: performance.now(), duration }]);
    setTimeout(() => {
      setProjectiles(prev => prev.filter(p => p.id !== id));
    }, duration + 100);
  }, []);

  const spawnImpact = useCallback((target: 'player' | 'enemy', type: ImpactEffect['type'] = 'hit') => {
    const id = `impact-${Date.now()}-${Math.random()}`;
    setImpacts(prev => [...prev, { id, target, type, createdAt: performance.now() }]);
    setTimeout(() => {
      setImpacts(prev => prev.filter(i => i.id !== id));
    }, 400);
  }, []);

  const triggerFocusFireVfx = useCallback((source: 'player' | 'enemy') => {
    spawnSkillEffect('focusFire', source, 400);
    setTimeout(() => {
      spawnProjectile('laser', source, 300);
      setTimeout(() => {
        const target = source === 'player' ? 'enemy' : 'player';
        spawnImpact(target, 'hit');
        triggerScreenShake(200);
        if (target === 'player') {
          setPlayerHitFlash(true);
          setTimeout(() => setPlayerHitFlash(false), 150);
        } else {
          setEnemyHitFlash(true);
          setTimeout(() => setEnemyHitFlash(false), 150);
        }
      }, 250);
    }, 200);
  }, [spawnSkillEffect, spawnProjectile, spawnImpact, triggerScreenShake]);

  const triggerEvasiveVfx = useCallback((source: 'player' | 'enemy') => {
    spawnSkillEffect('evasive', source, 600);
  }, [spawnSkillEffect]);

  const triggerEnergyShuntVfx = useCallback((source: 'player' | 'enemy') => {
    spawnSkillEffect('energyShunt', source, 800);
  }, [spawnSkillEffect]);

  const triggerUltimateVfx = useCallback((source: 'player' | 'enemy') => {
    spawnSkillEffect('ultimate', source, 600);
    setTimeout(() => {
      spawnProjectile('ultimateBeam', source, 500);
      triggerScreenShake(600);
      triggerHitFlash();
      setTimeout(() => {
        const target = source === 'player' ? 'enemy' : 'player';
        spawnImpact(target, 'ultimate');
        if (target === 'player') {
          setPlayerHitFlash(true);
          setTimeout(() => setPlayerHitFlash(false), 200);
        } else {
          setEnemyHitFlash(true);
          setTimeout(() => setEnemyHitFlash(false), 200);
        }
      }, 400);
    }, 600);
  }, [spawnSkillEffect, spawnProjectile, spawnImpact, triggerScreenShake, triggerHitFlash]);

  // Improved damage number spawning - positioned above ships
  const addDamageNumber = useCallback((value: number, isPlayerTarget: boolean, isCritical = false) => {
    const id = `${Date.now()}-${Math.random()}`;
    const basePos = isPlayerTarget ? playerPos : enemyPos;
    
    if (!basePos) {
      // Fallback positioning if refs not ready
      const x = 50;
      const y = isPlayerTarget ? 70 : 30;
      setDamageNumbers(prev => [...prev, { id, value, x, y, isPlayerTarget, isCritical, timestamp: Date.now() }]);
    } else {
      const jitterX = (Math.random() - 0.5) * 40;
      const jitterY = (Math.random() - 0.5) * 20;
      setDamageNumbers(prev => [...prev, { 
        id, 
        value, 
        x: basePos.x + jitterX,
        y: basePos.y - 50 + jitterY,
        isPlayerTarget,
        isCritical,
        timestamp: Date.now() 
      }]);
    }
    
    setTimeout(() => {
      setDamageNumbers(prev => prev.filter(d => d.id !== id));
    }, 800);
  }, [playerPos, enemyPos]);

  // Track last attack times for simultaneous combat
  const lastPlayerAttackRef = useRef(0);
  const lastOpponentAttackRef = useRef(0);
  
  // Main game loop - handles all combat timing
  useEffect(() => {
    if (!isActive || !player || !opponent || !config) return;
    
    // Initialize refs immediately when battle starts
    playerRef.current = player;
    opponentRef.current = opponent;
    configRef.current = config;
    isActiveRef.current = true;
    
    const PLAYER_ATTACK_SPEED = 1000; // 1 second
    const OPPONENT_ATTACK_SPEED = 1200; // 1.2 seconds
    
    const gameLoop = setInterval(() => {
      const now = Date.now();
      const currentPlayer = playerRef.current;
      const currentOpponent = opponentRef.current;
      const currentConfig = configRef.current;
      
      if (!currentPlayer || !currentOpponent || !currentConfig || !isActiveRef.current) return;
      
      // Player attack check
      if (now - lastPlayerAttackRef.current >= PLAYER_ATTACK_SPEED && !isShipDestroyed(currentOpponent.ship)) {
        lastPlayerAttackRef.current = now;
        
        const defenderEffects = opponentTacticalRef.current;
        const attackerEffects = playerTacticalRef.current;
        
        // Check evasion
        let evaded = false;
        if (defenderEffects.evasive && defenderEffects.evasive > now) {
          if (Math.random() < 0.5) evaded = true;
        }
        
        if (!evaded) {
          const weaponType = currentPlayer.loadout.weapons[Math.floor(Math.random() * currentPlayer.loadout.weapons.length)];
          let damageBonus = 1.0;
          
          if (attackerEffects.focusFire && attackerEffects.focusFire > now) damageBonus *= 1.5;
          if (attackerEffects.energyShunt && attackerEffects.energyShunt > now) damageBonus *= 0.7;
          
          const damageResult = calculateDamage(weaponType, currentOpponent.ship, currentConfig, damageBonus);
          const newShip = applyDamage(currentOpponent.ship, damageResult);
          
          setOpponent(prev => prev ? { ...prev, ship: newShip } : null);
          opponentRef.current = { ...currentOpponent, ship: newShip };
          
          // Visual feedback for player attack
          spawnProjectile('laser', 'player', 300);
          setTimeout(() => {
            spawnImpact('enemy', 'hit');
            setEnemyHitFlash(true);
            setTimeout(() => setEnemyHitFlash(false), 150);
          }, 250);
          
          setPlayer(prev => {
            if (!prev) return null;
            const newMana = Math.min(MAX_MANA, prev.mana + MANA_PER_ATTACK);
            const updated = { ...prev, mana: newMana, totalDamageDealt: prev.totalDamageDealt + damageResult.damage };
            playerRef.current = updated;
            
            // Auto-trigger ultimate at 100% mana
            if (newMana >= MAX_MANA) {
              setTimeout(() => {
                const opp = opponentRef.current;
                if (!opp) return;
                
                // Trigger ultimate VFX
                triggerUltimateVfx('player');
                
                setTimeout(() => {
                  const ultimateDamage = 300;
                  const ultResult = {
                    damage: ultimateDamage,
                    shieldDamage: Math.min(opp.ship.shield, ultimateDamage * 0.4),
                    armorDamage: Math.min(opp.ship.armor, ultimateDamage * 0.3),
                    hullDamage: Math.min(opp.ship.hull, ultimateDamage * 0.3),
                  };
                  const ultShip = applyDamage(opp.ship, ultResult);
                  setOpponent(p => p ? { ...p, ship: ultShip } : null);
                  opponentRef.current = { ...opp, ship: ultShip };
                  setPlayer(p => p ? { ...p, mana: 0 } : null);
                  if (playerRef.current) playerRef.current = { ...playerRef.current, mana: 0 };
                  addDamageNumber(ultimateDamage, false, true);
                  battleStatsRef.current.damageDealt += ultimateDamage;
                  battleStatsRef.current.ultimatesUsed += 1;
                }, 1000);
              }, 100);
            }
            
            return updated;
          });
          
          addDamageNumber(damageResult.damage, false);
          battleStatsRef.current.damageDealt += damageResult.damage;
        }
      }
      
      // Opponent attack check
      if (now - lastOpponentAttackRef.current >= OPPONENT_ATTACK_SPEED && !isShipDestroyed(currentPlayer.ship)) {
        lastOpponentAttackRef.current = now;
        
        const defenderEffects = playerTacticalRef.current;
        const attackerEffects = opponentTacticalRef.current;
        
        // Check evasion
        let evaded = false;
        if (defenderEffects.evasive && defenderEffects.evasive > now) {
          if (Math.random() < 0.5) evaded = true;
        }
        
        if (!evaded) {
          const weaponType = currentOpponent.loadout.weapons[Math.floor(Math.random() * currentOpponent.loadout.weapons.length)];
          let damageBonus = 1.0;
          
          if (attackerEffects.focusFire && attackerEffects.focusFire > now) damageBonus *= 1.5;
          if (attackerEffects.energyShunt && attackerEffects.energyShunt > now) damageBonus *= 0.7;
          
          const damageResult = calculateDamage(weaponType, currentPlayer.ship, currentConfig, damageBonus);
          const newShip = applyDamage(currentPlayer.ship, damageResult);
          
          setPlayer(prev => prev ? { ...prev, ship: newShip } : null);
          playerRef.current = { ...currentPlayer, ship: newShip };
          
          // Visual feedback for enemy attack
          spawnProjectile('laser', 'enemy', 300);
          setTimeout(() => {
            spawnImpact('player', 'hit');
            setPlayerHitFlash(true);
            setTimeout(() => setPlayerHitFlash(false), 150);
            triggerScreenShake(150);
          }, 250);
          
          setOpponent(prev => {
            if (!prev) return null;
            const newMana = Math.min(MAX_MANA, prev.mana + MANA_PER_ATTACK);
            const updated = { ...prev, mana: newMana, totalDamageDealt: prev.totalDamageDealt + damageResult.damage };
            opponentRef.current = updated;
            
            // Auto-trigger ultimate at 100% mana
            if (newMana >= MAX_MANA) {
              setTimeout(() => {
                const pl = playerRef.current;
                if (!pl) return;
                
                // Trigger ultimate VFX
                triggerUltimateVfx('enemy');
                
                setTimeout(() => {
                  const ultimateDamage = 300;
                  const ultResult = {
                    damage: ultimateDamage,
                    shieldDamage: Math.min(pl.ship.shield, ultimateDamage * 0.4),
                    armorDamage: Math.min(pl.ship.armor, ultimateDamage * 0.3),
                    hullDamage: Math.min(pl.ship.hull, ultimateDamage * 0.3),
                  };
                  const ultShip = applyDamage(pl.ship, ultResult);
                  setPlayer(p => p ? { ...p, ship: ultShip } : null);
                  playerRef.current = { ...pl, ship: ultShip };
                  setOpponent(p => p ? { ...p, mana: 0 } : null);
                  if (opponentRef.current) opponentRef.current = { ...opponentRef.current, mana: 0 };
                  addDamageNumber(ultimateDamage, true, true);
                }, 1000);
              }, 100);
            }
            
            return updated;
          });
          
          addDamageNumber(damageResult.damage, true);
          battleStatsRef.current.damageTaken += damageResult.damage;
        }
      }
    }, 100); // Run game loop every 100ms for smooth timing
    
    return () => {
      clearInterval(gameLoop);
      isActiveRef.current = false;
    };
  }, [isActive, player, opponent, config, addDamageNumber, spawnProjectile, spawnImpact, triggerScreenShake, triggerUltimateVfx]);

  useEffect(() => {
    if (!isActive || !opponent || !aiRef.current) return;
    
    const aiInterval = setInterval(() => {
      const now = Date.now();
      const tactical = aiRef.current?.shouldUseTactical(now);
      
      if (tactical) {
        const duration = config?.tacticalCommands[tactical].duration || 3000;
        
        setOpponentTacticalEffects(prev => ({
          ...prev,
          [tactical]: now + duration,
        }));
        
        // Trigger visual effects for AI tactical
        if (tactical === 'focusFire') triggerFocusFireVfx('enemy');
        else if (tactical === 'evasive') triggerEvasiveVfx('enemy');
        else if (tactical === 'energyShunt') triggerEnergyShuntVfx('enemy');
      }
    }, 2000);
    
    return () => clearInterval(aiInterval);
  }, [isActive, opponent, config, triggerFocusFireVfx, triggerEvasiveVfx, triggerEnergyShuntVfx]);

  useEffect(() => {
    if (!isActive) return;
    
    const tickInterval = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev - TICK_INTERVAL;
        battleStatsRef.current.timeSurvived = BATTLE_DURATION - newTime;
        return newTime;
      });
      
      if (config && player) {
        const energyShuntActive = activeTacticalEffects.energyShunt !== undefined && activeTacticalEffects.energyShunt > Date.now();
        setPlayer(prev => prev ? {
          ...prev,
          ship: regenerateShield(prev.ship, config, energyShuntActive),
        } : null);
      }
      
      if (config && opponent) {
        const energyShuntActive = opponentTacticalEffects.energyShunt !== undefined && opponentTacticalEffects.energyShunt > Date.now();
        setOpponent(prev => prev ? {
          ...prev,
          ship: regenerateShield(prev.ship, config, energyShuntActive),
        } : null);
      }
    }, TICK_INTERVAL);
    
    return () => clearInterval(tickInterval);
  }, [isActive, config, player, opponent, activeTacticalEffects, opponentTacticalEffects]);

  useEffect(() => {
    if (!player || !opponent) return;
    
    let result: 'victory' | 'defeat' | 'draw' | null = null;
    
    if (isShipDestroyed(opponent.ship)) {
      result = 'victory';
    } else if (isShipDestroyed(player.ship)) {
      result = 'defeat';
    } else if (timeRemaining <= 0) {
      if (player.ship.hull > opponent.ship.hull) {
        result = 'victory';
      } else if (player.ship.hull < opponent.ship.hull) {
        result = 'defeat';
      } else if (player.ship.shield > opponent.ship.shield) {
        result = 'victory';
      } else if (player.ship.shield < opponent.ship.shield) {
        result = 'defeat';
      } else if (player.totalDamageDealt > opponent.totalDamageDealt) {
        result = 'victory';
      } else if (player.totalDamageDealt < opponent.totalDamageDealt) {
        result = 'defeat';
      } else {
        result = 'draw';
      }
    }
    
    if (result) {
      setIsActive(false);
      setBattleStats(battleStatsRef.current);
      
      setTimeout(() => {
        router.push(`/result?outcome=${result}`);
      }, 1500);
    }
  }, [player, opponent, timeRemaining, router]);

  const handleTactical = useCallback((command: TacticalCommand) => {
    if (!config) return;
    
    const now = Date.now();
    if (tacticalCooldowns[command] > now) return;
    
    const commandConfig = config.tacticalCommands[command];
    
    setTacticalCooldowns(prev => ({
      ...prev,
      [command]: now + commandConfig.cooldown,
    }));
    
    setActiveTacticalEffects(prev => ({
      ...prev,
      [command]: now + commandConfig.duration,
    }));
    
    // Trigger visual effects based on command
    if (command === 'focusFire') {
      triggerFocusFireVfx('player');
    } else if (command === 'evasive') {
      triggerEvasiveVfx('player');
    } else if (command === 'energyShunt') {
      triggerEnergyShuntVfx('player');
    }
    
    battleStatsRef.current.tacticalCommandsUsed += 1;
  }, [config, tacticalCooldowns, triggerFocusFireVfx, triggerEvasiveVfx, triggerEnergyShuntVfx]);

  const handleUltimate = useCallback(() => {
    const currentPlayer = playerRef.current;
    const currentOpponent = opponentRef.current;
    
    if (!currentPlayer || !currentOpponent || currentPlayer.mana < MAX_MANA) return;
    
    // Trigger ultimate VFX first
    triggerUltimateVfx('player');
    
    // Delay the actual damage to sync with animation
    setTimeout(() => {
      const ultimateDamage = 300;
      const ultResult = {
        damage: ultimateDamage,
        shieldDamage: Math.min(currentOpponent.ship.shield, ultimateDamage * 0.4),
        armorDamage: Math.min(currentOpponent.ship.armor, ultimateDamage * 0.3),
        hullDamage: Math.min(currentOpponent.ship.hull, ultimateDamage * 0.3),
      };
      const ultShip = applyDamage(currentOpponent.ship, ultResult);
      
      setOpponent(prev => prev ? { ...prev, ship: ultShip } : null);
      setPlayer(prev => prev ? { ...prev, mana: 0 } : null);
      addDamageNumber(ultimateDamage, false, true);
      battleStatsRef.current.damageDealt += ultimateDamage;
      battleStatsRef.current.ultimatesUsed += 1;
    }, 1000);
  }, [addDamageNumber, triggerUltimateVfx]);

  if (!config || !player || !opponent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (countdown > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl text-gray-400 mb-4">Battle Starting In</h2>
          <div className="text-8xl font-bold text-cyan-400 animate-pulse">{countdown}</div>
        </div>
      </div>
    );
  }

  // Determine if player is low health for vignette effect
  const isLowHealth = player.ship.hull < player.ship.maxHull * 0.3;

  return (
    <div className={`h-screen flex flex-col relative overflow-hidden ${isScreenShaking ? 'screen-shake' : ''}`}>
      {/* Screen flash overlay */}
      {isHitFlashing && (
        <div className="absolute inset-0 z-50 bg-white/30 pointer-events-none" style={{ animation: 'screenFlash 150ms ease-out' }} />
      )}
      
      {/* Low health vignette */}
      {isLowHealth && (
        <div className="absolute inset-0 z-40 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(255, 0, 0, 0.3) 100%)',
          animation: 'lowHealthPulse 1s ease-in-out infinite',
        }} />
      )}

      {/* Animated background layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#000a1e] via-[#001a4d] to-[#000a1e]" />
      <div className="absolute inset-0 opacity-30">
        <div className="absolute w-full h-full animate-pulse" style={{
          background: 'radial-gradient(ellipse at 30% 20%, rgba(0, 150, 200, 0.2) 0%, transparent 50%)',
        }} />
        <div className="absolute w-full h-full animate-pulse" style={{
          background: 'radial-gradient(ellipse at 70% 80%, rgba(0, 100, 150, 0.15) 0%, transparent 50%)',
          animationDelay: '1s',
        }} />
      </div>
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `floatUp ${10 + Math.random() * 10}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Timer at top */}
      <div className="relative z-20 pt-2 flex justify-center">
        <BattleTimer timeRemaining={timeRemaining} isActive={isActive} />
      </div>

      {/* Main battle area - scrollable if needed but fits in viewport */}
      <div ref={battleAreaRef} className="flex-1 flex flex-col justify-between py-2 px-2 md:px-4 min-h-0 relative z-10">
        {/* Battle Effects Layer - renders all visual effects */}
        <BattleEffectsLayer
          skillEffects={skillEffects}
          projectiles={projectiles}
          impacts={impacts}
          playerPos={playerPos}
          enemyPos={enemyPos}
        />

        {/* ENEMY section */}
        <div className="flex flex-col items-center">
          <div className="text-red-500 font-bold text-lg md:text-xl mb-1 flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            ENEMY
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          </div>
          <HealthBars 
            ship={opponent.ship} 
            mana={opponent.mana} 
            maxMana={MAX_MANA}
            isPlayer={false}
            playerName={opponent.name}
            colorScheme="enemy"
          />
          <div ref={enemyShipRef} className={`relative mt-2 ${enemyHitFlash ? 'ship-hit-flash' : ''}`}>
            <Battleship 
              isPlayer={false} 
              isEnemy={true}
              damaged={opponent.ship.hull < opponent.ship.maxHull * 0.5}
              shieldActive={opponent.ship.shield > 0}
              className="w-20 h-20 md:w-28 md:h-28"
            />
          </div>
        </div>

        {/* Improved damage numbers - positioned absolutely above ships */}
        {damageNumbers.map(dn => (
          <ImprovedDamageNumber 
            key={dn.id} 
            value={dn.value} 
            x={dn.x} 
            y={dn.y} 
            isPlayerTarget={dn.isPlayerTarget}
            isCritical={dn.isCritical}
          />
        ))}

        {/* YOU section */}
        <div className="flex flex-col items-center">
          <div ref={playerShipRef} className={`relative mb-2 ${playerHitFlash ? 'ship-hit-flash' : ''}`}>
            <Battleship 
              isPlayer={true}
              damaged={player.ship.hull < player.ship.maxHull * 0.5}
              shieldActive={player.ship.shield > 0}
              className="w-20 h-20 md:w-28 md:h-28"
            />
          </div>
          <HealthBars 
            ship={player.ship} 
            mana={player.mana} 
            maxMana={MAX_MANA}
            isPlayer={true}
            playerName={player.name}
            colorScheme="player"
          />
          <div className="text-cyan-400 font-bold text-lg md:text-xl mt-1 flex items-center gap-2">
            <span className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />
            YOU
            <span className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* FIXED tactical buttons at bottom - always visible */}
      <div className="sticky bottom-0 left-0 right-0 z-30 bg-black/80 backdrop-blur-md border-t border-cyan-400/30 safe-area-bottom">
        <TacticalPanel
          cooldowns={tacticalCooldowns}
          activeEffects={activeTacticalEffects}
          mana={player.mana}
          maxMana={MAX_MANA}
          onTactical={handleTactical}
          onUltimate={handleUltimate}
          disabled={!isActive}
        />
      </div>
    </div>
  );
}

export default function BattlePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    }>
      <BattleContent />
    </Suspense>
  );
}
