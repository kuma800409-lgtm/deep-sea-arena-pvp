'use client';

import React, { useRef, useEffect } from 'react';

interface BattleshipProps {
  isPlayer: boolean;
  isEnemy?: boolean;
  damaged?: boolean;
  shieldActive?: boolean;
  className?: string;
}

export function Battleship({ isPlayer, isEnemy = false, damaged = false, shieldActive = false, className = '' }: BattleshipProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    const baseColor = isEnemy ? '#8B0000' : '#001a4d';
    const accentColor = isEnemy ? '#ff4444' : '#00ffff';
    const glowColor = isEnemy ? 'rgba(255, 68, 68, 0.5)' : 'rgba(0, 255, 255, 0.5)';
    
    ctx.save();
    if (!isPlayer) {
      ctx.translate(width, height);
      ctx.rotate(Math.PI);
    }
    
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, baseColor);
    gradient.addColorStop(0.5, damaged ? '#333' : baseColor);
    gradient.addColorStop(1, '#000033');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(width * 0.5, height * 0.1);
    ctx.lineTo(width * 0.7, height * 0.3);
    ctx.lineTo(width * 0.8, height * 0.5);
    ctx.lineTo(width * 0.75, height * 0.7);
    ctx.lineTo(width * 0.6, height * 0.85);
    ctx.lineTo(width * 0.4, height * 0.85);
    ctx.lineTo(width * 0.25, height * 0.7);
    ctx.lineTo(width * 0.2, height * 0.5);
    ctx.lineTo(width * 0.3, height * 0.3);
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 10;
    ctx.fillStyle = accentColor;
    
    ctx.beginPath();
    ctx.arc(width * 0.5, height * 0.25, 8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(width * 0.35, height * 0.45, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(width * 0.65, height * 0.45, 5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = damaged ? '#ff0000' : accentColor;
    ctx.beginPath();
    ctx.arc(width * 0.5, height * 0.55, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width * 0.3, height * 0.6);
    ctx.lineTo(width * 0.7, height * 0.6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(width * 0.35, height * 0.7);
    ctx.lineTo(width * 0.65, height * 0.7);
    ctx.stroke();
    
    if (damaged) {
      ctx.fillStyle = '#ff6600';
      for (let i = 0; i < 5; i++) {
        const x = width * (0.3 + Math.random() * 0.4);
        const y = height * (0.3 + Math.random() * 0.4);
        ctx.beginPath();
        ctx.arc(x, y, 3 + Math.random() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    ctx.restore();
    
    if (shieldActive) {
      ctx.strokeStyle = 'rgba(0, 200, 255, 0.6)';
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(0, 200, 255, 0.8)';
      ctx.shadowBlur = 20;
      
      ctx.beginPath();
      ctx.ellipse(width / 2, height / 2, width * 0.45, height * 0.45, 0, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.strokeStyle = 'rgba(0, 200, 255, 0.3)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const x1 = width / 2 + Math.cos(angle) * width * 0.35;
        const y1 = height / 2 + Math.sin(angle) * height * 0.35;
        const x2 = width / 2 + Math.cos(angle) * width * 0.45;
        const y2 = height / 2 + Math.sin(angle) * height * 0.45;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }
    
  }, [isPlayer, isEnemy, damaged, shieldActive]);
  
  return (
    <canvas 
      ref={canvasRef} 
      width={200} 
      height={200} 
      className={`${className}`}
      style={{ imageRendering: 'crisp-edges' }}
    />
  );
}

export function WeaponEffect({ type, isActive }: { type: 'laser' | 'missile' | 'kinetic' | 'plasma'; isActive: boolean }) {
  if (!isActive) return null;
  
  const colors = {
    laser: 'bg-cyan-400',
    missile: 'bg-orange-500',
    kinetic: 'bg-yellow-300',
    plasma: 'bg-purple-500',
  };
  
  return (
    <div className={`absolute inset-0 pointer-events-none ${isActive ? 'animate-pulse' : ''}`}>
      <div className={`w-2 h-20 ${colors[type]} opacity-80 mx-auto rounded-full blur-sm animate-ping`} />
    </div>
  );
}

export function DamageNumber({ value, x, y, isPlayer }: { value: number; x: number; y: number; isPlayer: boolean }) {
  return (
    <div 
      className={`absolute text-2xl font-bold pointer-events-none animate-bounce ${isPlayer ? 'text-red-500' : 'text-cyan-400'}`}
      style={{ 
        left: `${x}%`, 
        top: `${y}%`,
        animation: 'floatUp 1s ease-out forwards',
        textShadow: '0 0 10px currentColor',
      }}
    >
      -{value}
    </div>
  );
}

export function ShieldBreakEffect({ isActive }: { isActive: boolean }) {
  if (!isActive) return null;
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0 bg-cyan-400 opacity-50 animate-ping rounded-full" />
    </div>
  );
}
