'use client';

import React from 'react';
import type { TacticalCommand } from '@/types/game';

interface TacticalButtonProps {
  command: TacticalCommand;
  cooldownRemaining: number;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const TACTICAL_INFO: Record<TacticalCommand, { name: string; icon: string; color: string; description: string }> = {
  focusFire: {
    name: 'Focus Fire',
    icon: '🎯',
    color: 'from-red-600 to-orange-500',
    description: '+50% Damage',
  },
  evasive: {
    name: 'Evasive',
    icon: '💨',
    color: 'from-blue-600 to-cyan-500',
    description: '50% Dodge',
  },
  energyShunt: {
    name: 'Energy Shunt',
    icon: '🛡️',
    color: 'from-green-600 to-emerald-500',
    description: '2x Shield Regen',
  },
};

export function TacticalButton({ command, cooldownRemaining, isActive, onClick, disabled }: TacticalButtonProps) {
  const info = TACTICAL_INFO[command];
  const isOnCooldown = cooldownRemaining > 0;
  const cooldownSeconds = Math.ceil(cooldownRemaining / 1000);
  
  return (
    <button
      onClick={onClick}
      disabled={disabled || isOnCooldown}
      className={`
        relative flex flex-col items-center justify-center
        w-20 h-20 md:w-24 md:h-24 rounded-xl
        transition-all duration-200 transform
        ${isActive 
          ? `bg-gradient-to-br ${info.color} scale-105 shadow-lg shadow-current/50` 
          : isOnCooldown 
            ? 'bg-gray-800 opacity-60' 
            : `bg-gradient-to-br ${info.color} hover:scale-105 hover:shadow-lg`
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        border-2 ${isActive ? 'border-white' : 'border-transparent'}
      `}
    >
      <span className="text-2xl md:text-3xl">{info.icon}</span>
      <span className="text-white text-xs md:text-sm font-bold mt-1">{info.name}</span>
      
      {isOnCooldown && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-xl">
          <span className="text-white text-2xl font-bold">{cooldownSeconds}s</span>
        </div>
      )}
      
      {isActive && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse" />
      )}
    </button>
  );
}

interface UltimateButtonProps {
  mana: number;
  maxMana: number;
  onClick: () => void;
  disabled?: boolean;
}

export function UltimateButton({ mana, maxMana, onClick, disabled }: UltimateButtonProps) {
  const isReady = mana >= maxMana;
  const manaPercent = Math.min(100, (mana / maxMana) * 100);
  
  return (
    <button
      onClick={onClick}
      disabled={disabled || !isReady}
      className={`
        relative flex flex-col items-center justify-center
        w-24 h-24 md:w-28 md:h-28 rounded-xl
        transition-all duration-200 transform
        ${isReady 
          ? 'bg-gradient-to-br from-purple-600 to-pink-500 hover:scale-105 shadow-lg shadow-purple-500/50 animate-pulse' 
          : 'bg-gray-800'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : isReady ? 'cursor-pointer' : 'cursor-not-allowed'}
        border-2 ${isReady ? 'border-yellow-400' : 'border-gray-600'}
        overflow-hidden
      `}
    >
      <div 
        className="absolute bottom-0 left-0 right-0 bg-purple-500/50 transition-all duration-300"
        style={{ height: `${manaPercent}%` }}
      />
      
      <div className="relative z-10 flex flex-col items-center">
        <span className="text-3xl md:text-4xl">⚡</span>
        <span className="text-white text-xs md:text-sm font-bold mt-1">ULTIMATE</span>
        <span className={`text-xs ${isReady ? 'text-yellow-400' : 'text-gray-400'}`}>
          {Math.round(mana)}%
        </span>
      </div>
      
      {isReady && (
        <div className="absolute inset-0 bg-gradient-to-t from-yellow-400/20 to-transparent animate-pulse" />
      )}
    </button>
  );
}

interface TacticalPanelProps {
  cooldowns: {
    focusFire: number;
    evasive: number;
    energyShunt: number;
  };
  activeEffects: {
    focusFire?: number;
    evasive?: number;
    energyShunt?: number;
  };
  mana: number;
  maxMana: number;
  onTactical: (command: TacticalCommand) => void;
  onUltimate: () => void;
  disabled?: boolean;
}

export function TacticalPanel({ 
  cooldowns, 
  activeEffects, 
  mana, 
  maxMana, 
  onTactical, 
  onUltimate, 
  disabled 
}: TacticalPanelProps) {
  const now = Date.now();
  
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 p-2 md:p-4 bg-black/30 backdrop-blur-sm rounded-xl">
      <TacticalButton
        command="focusFire"
        cooldownRemaining={Math.max(0, cooldowns.focusFire - now)}
        isActive={activeEffects.focusFire !== undefined && activeEffects.focusFire > now}
        onClick={() => onTactical('focusFire')}
        disabled={disabled}
      />
      <TacticalButton
        command="evasive"
        cooldownRemaining={Math.max(0, cooldowns.evasive - now)}
        isActive={activeEffects.evasive !== undefined && activeEffects.evasive > now}
        onClick={() => onTactical('evasive')}
        disabled={disabled}
      />
      <TacticalButton
        command="energyShunt"
        cooldownRemaining={Math.max(0, cooldowns.energyShunt - now)}
        isActive={activeEffects.energyShunt !== undefined && activeEffects.energyShunt > now}
        onClick={() => onTactical('energyShunt')}
        disabled={disabled}
      />
      <UltimateButton
        mana={mana}
        maxMana={maxMana}
        onClick={onUltimate}
        disabled={disabled}
      />
    </div>
  );
}
