'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { generateRoomCode, generatePlayerId } from '@/lib/gameEngine';
import { setPlayerId, getPlayerId, setRoomCode, setGameMode } from '@/lib/storage';

export default function MatchmakingPage() {
  const router = useRouter();
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'creating' | 'joining' | 'searching'>('idle');
  const [generatedRoomCode, setGeneratedRoomCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let playerId = getPlayerId();
    if (!playerId) {
      playerId = generatePlayerId();
      setPlayerId(playerId);
    }
  }, []);

  const handleCreateRoom = () => {
    setStatus('creating');
    setError(null);
    
    const newRoomCode = generateRoomCode();
    setGeneratedRoomCode(newRoomCode);
    setRoomCode(newRoomCode);
    setGameMode('pvp');
    
    setTimeout(() => {
      router.push(`/loadout?mode=pvp&room=${newRoomCode}&host=true`);
    }, 1000);
  };

  const handleJoinRoom = () => {
    if (!roomCodeInput.trim()) {
      setError('Please enter a room code');
      return;
    }
    
    const code = roomCodeInput.toUpperCase().trim();
    if (code.length !== 6) {
      setError('Room code must be 6 characters');
      return;
    }
    
    setStatus('joining');
    setError(null);
    setRoomCode(code);
    setGameMode('pvp');
    
    setTimeout(() => {
      router.push(`/loadout?mode=pvp&room=${code}&host=false`);
    }, 1000);
  };

  const handleAutoMatch = () => {
    setStatus('searching');
    setError(null);
    setGameMode('pvp');
    
    const autoRoomCode = generateRoomCode();
    setRoomCode(autoRoomCode);
    
    setTimeout(() => {
      router.push(`/loadout?mode=pvp&room=${autoRoomCode}&auto=true`);
    }, 2000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-md">
        <Link 
          href="/"
          className="inline-flex items-center text-cyan-400 hover:text-cyan-300 mb-8 transition-colors"
        >
          <span className="mr-2">&larr;</span> Back to Menu
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold text-center mb-8 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Find a Battle
        </h1>

        {status === 'idle' && (
          <div className="space-y-6">
            <div className="p-6 bg-black/30 backdrop-blur-sm rounded-xl border border-cyan-400/20">
              <h2 className="text-xl font-bold text-white mb-4">Join with Room Code</h2>
              <input
                type="text"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                placeholder="Enter 6-digit code (e.g., A3K9X2)"
                maxLength={6}
                className="w-full px-4 py-3 bg-black/50 border border-cyan-400/30 rounded-lg text-white text-center text-xl tracking-widest uppercase focus:outline-none focus:border-cyan-400 transition-colors"
              />
              {error && (
                <p className="text-red-400 text-sm mt-2 text-center">{error}</p>
              )}
              <button
                onClick={handleJoinRoom}
                className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg transition-all duration-300"
              >
                Join Room
              </button>
            </div>

            <div className="text-center text-gray-400">- OR -</div>

            <button
              onClick={handleCreateRoom}
              className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-xl transition-all duration-300"
            >
              Create New Room
            </button>

            <button
              onClick={handleAutoMatch}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all duration-300"
            >
              Auto-Matchmaking
            </button>
          </div>
        )}

        {status === 'creating' && (
          <div className="text-center p-8 bg-black/30 backdrop-blur-sm rounded-xl border border-cyan-400/20">
            <div className="spinner mx-auto mb-4" />
            <p className="text-xl text-white mb-4">Creating Room...</p>
            {generatedRoomCode && (
              <div className="mt-4">
                <p className="text-gray-400 mb-2">Share this code with your opponent:</p>
                <p className="text-4xl font-mono font-bold text-cyan-400 tracking-widest">
                  {generatedRoomCode}
                </p>
              </div>
            )}
          </div>
        )}

        {status === 'joining' && (
          <div className="text-center p-8 bg-black/30 backdrop-blur-sm rounded-xl border border-cyan-400/20">
            <div className="spinner mx-auto mb-4" />
            <p className="text-xl text-white">Joining Room...</p>
            <p className="text-cyan-400 text-2xl font-mono mt-2">{roomCodeInput}</p>
          </div>
        )}

        {status === 'searching' && (
          <div className="text-center p-8 bg-black/30 backdrop-blur-sm rounded-xl border border-cyan-400/20">
            <div className="spinner mx-auto mb-4" />
            <p className="text-xl text-white mb-2">Searching for opponent...</p>
            <p className="text-gray-400 text-sm">This may take a moment</p>
          </div>
        )}
      </div>
    </div>
  );
}
