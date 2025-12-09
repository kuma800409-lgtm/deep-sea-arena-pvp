'use client';

import React from 'react';
import type { ShipStats } from '@/types/game';
import { getHealthPercentage } from '@/lib/gameEngine';

interface HealthBarsProps {
  ship: ShipStats;
  mana: number;
  maxMana: number;
  isPlayer?: boolean;
  playerName?: string;
  colorScheme?: 'player' | 'enemy';
}

export function HealthBars({ ship, mana, maxMana, isPlayer = true, playerName = 'Player', colorScheme = 'player' }: HealthBarsProps) {
  const shieldPercent = getHealthPercentage(ship.shield, ship.maxShield);
  const armorPercent = getHealthPercentage(ship.armor, ship.maxArmor);
  const hullPercent = getHealthPercentage(ship.hull, ship.maxHull);
  const manaPercent = getHealthPercentage(mana, maxMana);
  
  const isEnemy = colorScheme === 'enemy';
  const borderColor = isEnemy ? 'border-red-500/50' : 'border-cyan-400/50';
  const nameColor = isEnemy ? 'text-red-400' : 'text-cyan-400';
  const hpColor = isEnemy ? 'text-red-300' : 'text-cyan-300';
  
  return (
    <div className={`w-full max-w-sm mx-auto p-2 md:p-3 rounded-lg bg-black/60 backdrop-blur-sm border ${borderColor} ${isPlayer ? '' : 'order-first'}`}>
      <div className="flex justify-between items-center mb-1">
        <span className={`${nameColor} font-bold text-xs md:text-sm`}>{playerName}</span>
        <span className={`${hpColor} text-xs font-semibold`}>
          {Math.round(ship.hull)}/{ship.maxHull} HP
        </span>
      </div>
      
      <div className="space-y-1">
        {/* Shield bar */}
        <div className="flex items-center gap-1">
          <span className="text-cyan-400 text-[10px] w-10">Shield</span>
          <div className="flex-1 h-3 bg-gray-800/80 rounded-full overflow-hidden border border-cyan-400/30">
            <div 
              className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-300 relative"
              style={{ width: `${shieldPercent}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>
          <span className="text-cyan-400 text-[10px] w-8 text-right">{Math.round(ship.shield)}</span>
        </div>
        
        {/* Armor bar */}
        <div className="flex items-center gap-1">
          <span className="text-yellow-500 text-[10px] w-10">Armor</span>
          <div className="flex-1 h-3 bg-gray-800/80 rounded-full overflow-hidden border border-yellow-500/30">
            <div 
              className="h-full bg-gradient-to-r from-yellow-700 to-yellow-500 transition-all duration-300"
              style={{ width: `${armorPercent}%` }}
            />
          </div>
          <span className="text-yellow-500 text-[10px] w-8 text-right">{Math.round(ship.armor)}</span>
        </div>
        
        {/* Hull bar */}
        <div className="flex items-center gap-1">
          <span className="text-red-500 text-[10px] w-10">Hull</span>
          <div className="flex-1 h-3 bg-gray-800/80 rounded-full overflow-hidden border border-red-500/30">
            <div 
              className="h-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-300"
              style={{ width: `${hullPercent}%` }}
            />
          </div>
          <span className="text-red-500 text-[10px] w-8 text-right">{Math.round(ship.hull)}</span>
        </div>
        
        {/* Mana bar */}
        <div className="flex items-center gap-1">
          <span className="text-purple-400 text-[10px] w-10">Mana</span>
          <div className="flex-1 h-2 bg-gray-800/80 rounded-full overflow-hidden border border-purple-400/30">
            <div 
              className={`h-full transition-all duration-300 ${mana >= maxMana ? 'bg-gradient-to-r from-purple-600 to-pink-500 animate-pulse' : 'bg-gradient-to-r from-purple-700 to-purple-500'}`}
              style={{ width: `${manaPercent}%` }}
            />
          </div>
          <span className={`text-[10px] w-8 text-right ${mana >= maxMana ? 'text-pink-400 font-bold' : 'text-purple-400'}`}>
            {Math.round(mana)}%
          </span>
        </div>
      </div>
    </div>
  );
}

export function MiniHealthBar({ current, max, color }: { current: number; max: number; color: string }) {
  const percent = getHealthPercentage(current, max);
  
  return (
    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
      <div 
        className={`h-full ${color} transition-all duration-300`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
