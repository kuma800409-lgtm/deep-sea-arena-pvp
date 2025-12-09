'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Battleship, DamageNumber } from '@/components/Battleship';
import { HealthBars } from '@/components/HealthBars';
import { TacticalPanel } from '@/components/TacticalButtons';
import { BattleTimer } from '@/components/BattleTimer';
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
  DamageNumber as DamageNumberType,
  BattleStats
} from '@/types/game';

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
  const [damageNumbers, setDamageNumbers] = useState<DamageNumberType[]>([]);
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

  const addDamageNumber = useCallback((value: number, isPlayer: boolean) => {
    const id = `${Date.now()}-${Math.random()}`;
    const x = 30 + Math.random() * 40;
    const y = isPlayer ? 60 + Math.random() * 20 : 20 + Math.random() * 20;
    
    setDamageNumbers(prev => [...prev, { id, value, x, y, isPlayer, timestamp: Date.now() }]);
    
    setTimeout(() => {
      setDamageNumbers(prev => prev.filter(d => d.id !== id));
    }, 1000);
  }, []);

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
                addDamageNumber(ultimateDamage, false);
                battleStatsRef.current.damageDealt += ultimateDamage;
                battleStatsRef.current.ultimatesUsed += 1;
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
                addDamageNumber(ultimateDamage, true);
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
  }, [isActive, player, opponent, config, addDamageNumber]);

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
      }
    }, 2000);
    
    return () => clearInterval(aiInterval);
  }, [isActive, opponent, config]);

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
    
    battleStatsRef.current.tacticalCommandsUsed += 1;
  }, [config, tacticalCooldowns]);

  const handleUltimate = useCallback(() => {
    const currentPlayer = playerRef.current;
    const currentOpponent = opponentRef.current;
    
    if (!currentPlayer || !currentOpponent || currentPlayer.mana < MAX_MANA) return;
    
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
    addDamageNumber(ultimateDamage, false);
    battleStatsRef.current.damageDealt += ultimateDamage;
    battleStatsRef.current.ultimatesUsed += 1;
  }, [addDamageNumber]);

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

  return (
    <div className="h-screen flex flex-col relative overflow-hidden">
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
      <div className="flex-1 flex flex-col justify-between py-2 px-2 md:px-4 min-h-0 relative z-10">
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
          <div className="relative mt-2">
            <Battleship 
              isPlayer={false} 
              isEnemy={true}
              damaged={opponent.ship.hull < opponent.ship.maxHull * 0.5}
              shieldActive={opponent.ship.shield > 0}
              className="w-20 h-20 md:w-28 md:h-28"
            />
          </div>
        </div>

        {/* Damage numbers area */}
        <div className="relative h-20 md:h-32 flex-shrink-0">
          {damageNumbers.map(dn => (
            <DamageNumber key={dn.id} value={dn.value} x={dn.x} y={dn.y} isPlayer={dn.isPlayer} />
          ))}
        </div>

        {/* YOU section */}
        <div className="flex flex-col items-center">
          <div className="relative mb-2">
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
