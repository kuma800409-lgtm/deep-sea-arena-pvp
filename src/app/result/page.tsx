'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getBattleStats, clearBattleData } from '@/lib/storage';
import type { BattleStats, BattleResult } from '@/types/game';
import { formatTime } from '@/lib/gameEngine';

function ResultContent() {
  const searchParams = useSearchParams();
  const [stats, setStats] = useState<BattleStats | null>(null);
  const [showStats, setShowStats] = useState(false);
  
  const outcome = (searchParams.get('outcome') || 'defeat') as BattleResult;

  useEffect(() => {
    const battleStats = getBattleStats();
    setStats(battleStats);
    
    setTimeout(() => setShowStats(true), 500);
  }, []);

  const handlePlayAgain = () => {
    clearBattleData();
  };

  const resultConfig = {
    victory: {
      title: 'VICTORY!',
      subtitle: 'You have defeated your opponent!',
      gradient: 'from-yellow-400 via-amber-500 to-orange-500',
      bgGlow: 'bg-yellow-500/20',
      icon: '&#127942;',
    },
    defeat: {
      title: 'DEFEATED',
      subtitle: 'Your ship has been destroyed',
      gradient: 'from-red-500 via-red-600 to-red-700',
      bgGlow: 'bg-red-500/20',
      icon: '&#128128;',
    },
    draw: {
      title: 'DRAW',
      subtitle: 'The battle ended in a stalemate',
      gradient: 'from-gray-400 via-gray-500 to-gray-600',
      bgGlow: 'bg-gray-500/20',
      icon: '&#9878;',
    },
  };

  const config = resultConfig[outcome];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
      <div className={`absolute inset-0 ${config.bgGlow} opacity-30 blur-3xl`} />
      
      <div className="relative z-10 text-center max-w-lg w-full">
        <div 
          className="text-6xl md:text-8xl mb-4 animate-bounce"
          dangerouslySetInnerHTML={{ __html: config.icon }}
        />
        
        <h1 className={`text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent animate-pulse`}>
          {config.title}
        </h1>
        
        <p className="text-xl text-gray-300 mb-8">{config.subtitle}</p>

        {showStats && stats && (
          <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 mb-8 border border-cyan-400/20">
            <h2 className="text-xl font-bold text-cyan-400 mb-4">Battle Statistics</h2>
            
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="p-3 bg-black/30 rounded-lg">
                <p className="text-gray-400 text-sm">Time Survived</p>
                <p className="text-white text-xl font-bold">{formatTime(stats.timeSurvived)}</p>
              </div>
              
              <div className="p-3 bg-black/30 rounded-lg">
                <p className="text-gray-400 text-sm">Damage Dealt</p>
                <p className="text-cyan-400 text-xl font-bold">{stats.damageDealt.toLocaleString()}</p>
              </div>
              
              <div className="p-3 bg-black/30 rounded-lg">
                <p className="text-gray-400 text-sm">Damage Taken</p>
                <p className="text-red-400 text-xl font-bold">{stats.damageTaken.toLocaleString()}</p>
              </div>
              
              <div className="p-3 bg-black/30 rounded-lg">
                <p className="text-gray-400 text-sm">Ultimates Used</p>
                <p className="text-purple-400 text-xl font-bold">{stats.ultimatesUsed}</p>
              </div>
              
              <div className="p-3 bg-black/30 rounded-lg col-span-2">
                <p className="text-gray-400 text-sm">Tactical Commands Used</p>
                <p className="text-yellow-400 text-xl font-bold">{stats.tacticalCommandsUsed}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/loadout?mode=ai"
            onClick={handlePlayAgain}
            className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-lg font-bold rounded-xl btn-glow transition-all duration-300"
          >
            Play Again
          </Link>
          
          <Link
            href="/"
            onClick={handlePlayAgain}
            className="px-8 py-4 bg-black/50 hover:bg-black/70 text-white text-lg font-bold rounded-xl border border-cyan-400/30 hover:border-cyan-400/50 transition-all duration-300"
          >
            Main Menu
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}
