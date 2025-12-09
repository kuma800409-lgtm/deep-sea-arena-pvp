'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Battleship } from '@/components/Battleship';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {mounted && [...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-cyan-400/10"
            style={{
              left: `${Math.random() * 100}%`,
              width: `${5 + Math.random() * 15}px`,
              height: `${5 + Math.random() * 15}px`,
              animation: `rise ${8 + Math.random() * 10}s infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
          Deep Sea Arena
        </h1>
        <p className="text-lg md:text-xl text-gray-300 mb-8 md:mb-12">
          Engage in intense 1v1 battleship combat in the depths of the ocean
        </p>

        <div className="flex justify-center mb-8 md:mb-12">
          <div className="relative">
            <Battleship isPlayer={true} className="w-32 h-32 md:w-48 md:h-48" />
            <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-3xl -z-10" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center">
          <Link
            href="/matchmaking"
            className="w-full sm:w-auto px-8 py-4 md:px-12 md:py-5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-lg md:text-xl font-bold rounded-xl btn-glow transition-all duration-300 flex items-center justify-center gap-3"
          >
            <span className="text-2xl">&#9876;</span>
            Play vs Player
          </Link>
          
          <Link
            href="/loadout?mode=ai"
            className="w-full sm:w-auto px-8 py-4 md:px-12 md:py-5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-lg md:text-xl font-bold rounded-xl btn-glow transition-all duration-300 flex items-center justify-center gap-3"
          >
            <span className="text-2xl">&#129302;</span>
            Play vs AI
          </Link>
        </div>

        <div className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 text-center">
          <div className="p-4 md:p-6 bg-black/30 backdrop-blur-sm rounded-xl border border-cyan-400/20">
            <div className="text-3xl md:text-4xl mb-2">&#128737;</div>
            <h3 className="text-lg font-bold text-cyan-400 mb-2">Layered Defense</h3>
            <p className="text-sm text-gray-400">Shield, Armor, and Hull protection systems</p>
          </div>
          
          <div className="p-4 md:p-6 bg-black/30 backdrop-blur-sm rounded-xl border border-cyan-400/20">
            <div className="text-3xl md:text-4xl mb-2">&#9889;</div>
            <h3 className="text-lg font-bold text-cyan-400 mb-2">Tactical Commands</h3>
            <p className="text-sm text-gray-400">Focus Fire, Evasive, and Energy Shunt abilities</p>
          </div>
          
          <div className="p-4 md:p-6 bg-black/30 backdrop-blur-sm rounded-xl border border-cyan-400/20">
            <div className="text-3xl md:text-4xl mb-2">&#128640;</div>
            <h3 className="text-lg font-bold text-cyan-400 mb-2">Auto-Battle</h3>
            <p className="text-sm text-gray-400">Real-time combat with mana-powered ultimates</p>
          </div>
        </div>
      </div>

      <footer className="absolute bottom-4 text-center text-gray-500 text-sm">
        Deep Sea Arena v1.0 - Powered by Cloudflare Durable Objects
      </footer>
    </div>
  );
}
