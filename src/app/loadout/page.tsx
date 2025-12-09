'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { loadGameConfig, getAllLoadouts } from '@/lib/gameEngine';
import { setSelectedLoadout, getSelectedLoadout, setGameMode } from '@/lib/storage';
import type { Loadout, GameConfig, WeaponType } from '@/types/game';

const WEAPON_ICONS: Record<WeaponType, string> = {
  laser: '&#128308;',
  kinetic: '&#128993;',
  missile: '&#128640;',
  plasma: '&#128995;',
};

const WEAPON_COLORS: Record<WeaponType, string> = {
  laser: 'text-cyan-400',
  kinetic: 'text-yellow-400',
  missile: 'text-orange-400',
  plasma: 'text-purple-400',
};

function LoadoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [loadouts, setLoadouts] = useState<Loadout[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const mode = searchParams.get('mode') || 'ai';
  const roomCode = searchParams.get('room');
  const isHost = searchParams.get('host') === 'true';
  const isAuto = searchParams.get('auto') === 'true';

  useEffect(() => {
    async function init() {
      const gameConfig = await loadGameConfig();
      setConfig(gameConfig);
      setLoadouts(getAllLoadouts(gameConfig));
      
      const savedLoadout = getSelectedLoadout();
      if (savedLoadout) {
        setSelectedId(savedLoadout);
      }
    }
    init();
  }, []);

  const handleSelectLoadout = (loadoutId: string) => {
    setSelectedId(loadoutId);
    setSelectedLoadout(loadoutId);
  };

  const handleReady = () => {
    if (!selectedId) return;
    
    setIsReady(true);
    setGameMode(mode as 'ai' | 'pvp');
    
    setTimeout(() => {
      if (mode === 'ai') {
        router.push(`/battle?mode=ai&loadout=${selectedId}`);
      } else {
        router.push(`/battle?mode=pvp&room=${roomCode}&loadout=${selectedId}&host=${isHost}&auto=${isAuto}`);
      }
    }, 500);
  };

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8">
      <div className="max-w-4xl mx-auto w-full">
        <Link 
          href={mode === 'ai' ? '/' : '/matchmaking'}
          className="inline-flex items-center text-cyan-400 hover:text-cyan-300 mb-6 transition-colors"
        >
          <span className="mr-2">&larr;</span> Back
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold text-center mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Select Your Loadout
        </h1>
        
        {roomCode && (
          <p className="text-center text-gray-400 mb-6">
            Room: <span className="text-cyan-400 font-mono">{roomCode}</span>
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
          {loadouts.map((loadout) => (
            <button
              key={loadout.id}
              onClick={() => handleSelectLoadout(loadout.id)}
              className={`
                p-4 md:p-6 rounded-xl text-left transition-all duration-300 card-hover
                ${selectedId === loadout.id 
                  ? 'bg-gradient-to-br from-cyan-600/30 to-blue-600/30 border-2 border-cyan-400 shadow-lg shadow-cyan-400/20' 
                  : 'bg-black/30 border border-cyan-400/20 hover:border-cyan-400/50'
                }
              `}
            >
              <h3 className="text-xl font-bold text-white mb-2">{loadout.name}</h3>
              <p className="text-gray-400 text-sm mb-4">{loadout.description}</p>
              
              <div className="flex flex-wrap gap-2">
                {loadout.weapons.map((weapon, idx) => (
                  <div 
                    key={idx}
                    className={`px-3 py-1 rounded-full bg-black/50 ${WEAPON_COLORS[weapon]} text-sm font-medium flex items-center gap-1`}
                  >
                    <span dangerouslySetInnerHTML={{ __html: WEAPON_ICONS[weapon] }} />
                    {config.weapons[weapon].name}
                  </div>
                ))}
              </div>

              {selectedId === loadout.id && (
                <div className="mt-4 flex items-center text-cyan-400">
                  <span className="text-lg mr-2">&#10003;</span>
                  <span className="font-bold">Selected</span>
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={handleReady}
            disabled={!selectedId || isReady}
            className={`
              px-12 py-4 text-xl font-bold rounded-xl transition-all duration-300
              ${selectedId && !isReady
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white btn-glow'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {isReady ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Starting Battle...
              </span>
            ) : (
              'Ready to Battle!'
            )}
          </button>
        </div>

        <div className="mt-8 p-4 bg-black/30 backdrop-blur-sm rounded-xl border border-cyan-400/20">
          <h3 className="text-lg font-bold text-white mb-3">Weapon Types</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-cyan-400" dangerouslySetInnerHTML={{ __html: WEAPON_ICONS.laser }} />
              <span className="text-gray-300">Laser - Shield Breaker</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-400" dangerouslySetInnerHTML={{ __html: WEAPON_ICONS.kinetic }} />
              <span className="text-gray-300">Kinetic - Armor Piercer</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-orange-400" dangerouslySetInnerHTML={{ __html: WEAPON_ICONS.missile }} />
              <span className="text-gray-300">Missile - Hull Damage</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-purple-400" dangerouslySetInnerHTML={{ __html: WEAPON_ICONS.plasma }} />
              <span className="text-gray-300">Plasma - Balanced</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoadoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    }>
      <LoadoutContent />
    </Suspense>
  );
}
