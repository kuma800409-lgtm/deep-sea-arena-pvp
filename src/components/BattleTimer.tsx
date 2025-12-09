'use client';

import React from 'react';
import { formatTime } from '@/lib/gameEngine';

interface BattleTimerProps {
  timeRemaining: number;
  isActive: boolean;
}

export function BattleTimer({ timeRemaining, isActive }: BattleTimerProps) {
  const isLowTime = timeRemaining < 15000;
  const isCriticalTime = timeRemaining < 5000;
  
  return (
    <div className={`
      flex items-center justify-center
      px-6 py-2 rounded-full
      ${isCriticalTime 
        ? 'bg-red-600 animate-pulse' 
        : isLowTime 
          ? 'bg-orange-600' 
          : 'bg-black/50 backdrop-blur-sm'
      }
      border-2 ${isCriticalTime ? 'border-red-400' : isLowTime ? 'border-orange-400' : 'border-cyan-400/50'}
      transition-all duration-300
    `}>
      <span className={`
        text-2xl md:text-3xl font-mono font-bold
        ${isCriticalTime ? 'text-white' : isLowTime ? 'text-white' : 'text-cyan-400'}
      `}>
        {formatTime(timeRemaining)}
      </span>
      {!isActive && (
        <span className="ml-2 text-yellow-400 text-sm animate-pulse">PAUSED</span>
      )}
    </div>
  );
}

export function BattleStatus({ status }: { status: 'waiting' | 'ready' | 'fighting' | 'ended' }) {
  const statusConfig = {
    waiting: { text: 'Waiting for opponent...', color: 'text-yellow-400', bg: 'bg-yellow-600/20' },
    ready: { text: 'Battle Starting!', color: 'text-green-400', bg: 'bg-green-600/20' },
    fighting: { text: 'BATTLE!', color: 'text-red-400', bg: 'bg-red-600/20' },
    ended: { text: 'Battle Ended', color: 'text-gray-400', bg: 'bg-gray-600/20' },
  };
  
  const config = statusConfig[status];
  
  return (
    <div className={`px-4 py-2 rounded-lg ${config.bg} ${config.color} font-bold text-center`}>
      {config.text}
    </div>
  );
}
