'use client';

import React, { useRef, useEffect, useState } from 'react';

interface BattleshipProps {
  isPlayer: boolean;
  isEnemy?: boolean;
  damaged?: boolean;
  shieldActive?: boolean;
  className?: string;
}

export function Battleship({ isPlayer, isEnemy = false, damaged = false, shieldActive = false, className = '' }: BattleshipProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [frame, setFrame] = useState(0);
  
  // Animation loop for continuous effects
  useEffect(() => {
    const animate = () => {
      setFrame(f => (f + 1) % 60);
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, []);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Color schemes
    const baseColor = isEnemy ? '#4a0000' : '#001a4d';
    const accentColor = isEnemy ? '#ff4444' : '#00ffff';
    const glowColor = isEnemy ? 'rgba(255, 68, 68, 0.8)' : 'rgba(0, 255, 255, 0.8)';
    const engineColor = isEnemy ? '#ff6600' : '#00aaff';
    
    ctx.save();
    
    // Flip for enemy (top of screen)
    if (!isPlayer) {
      ctx.translate(width, height);
      ctx.rotate(Math.PI);
    }
    
    // Bobbing animation
    const bobOffset = Math.sin(frame * 0.1) * 3;
    ctx.translate(0, bobOffset);
    
    // Draw submarine body - more detailed shape
    const gradient = ctx.createLinearGradient(width * 0.2, 0, width * 0.8, height);
    gradient.addColorStop(0, isEnemy ? '#6a0000' : '#003366');
    gradient.addColorStop(0.3, baseColor);
    gradient.addColorStop(0.7, damaged ? '#222' : baseColor);
    gradient.addColorStop(1, '#000022');
    
    ctx.fillStyle = gradient;
    
    // Main hull - submarine shape
    ctx.beginPath();
    ctx.moveTo(width * 0.5, height * 0.08); // Nose
    ctx.bezierCurveTo(width * 0.65, height * 0.15, width * 0.75, height * 0.25, width * 0.78, height * 0.4);
    ctx.bezierCurveTo(width * 0.8, height * 0.55, width * 0.78, height * 0.7, width * 0.7, height * 0.8);
    ctx.lineTo(width * 0.6, height * 0.88);
    ctx.lineTo(width * 0.4, height * 0.88);
    ctx.lineTo(width * 0.3, height * 0.8);
    ctx.bezierCurveTo(width * 0.22, height * 0.7, width * 0.2, height * 0.55, width * 0.22, height * 0.4);
    ctx.bezierCurveTo(width * 0.25, height * 0.25, width * 0.35, height * 0.15, width * 0.5, height * 0.08);
    ctx.closePath();
    ctx.fill();
    
    // Hull outline glow
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 15;
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Conning tower (sail)
    const towerGradient = ctx.createLinearGradient(width * 0.4, height * 0.25, width * 0.6, height * 0.45);
    towerGradient.addColorStop(0, isEnemy ? '#5a0000' : '#002244');
    towerGradient.addColorStop(1, baseColor);
    ctx.fillStyle = towerGradient;
    ctx.beginPath();
    ctx.moveTo(width * 0.42, height * 0.35);
    ctx.lineTo(width * 0.45, height * 0.22);
    ctx.lineTo(width * 0.55, height * 0.22);
    ctx.lineTo(width * 0.58, height * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Periscope
    ctx.fillStyle = accentColor;
    ctx.fillRect(width * 0.48, height * 0.12, width * 0.04, height * 0.12);
    
    // Bridge window (glowing)
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 10;
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.ellipse(width * 0.5, height * 0.28, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Torpedo tubes (front)
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.ellipse(width * 0.38, height * 0.18, 4, 3, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(width * 0.62, height * 0.18, 4, 3, 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Side weapon ports
    ctx.fillStyle = damaged ? '#ff3300' : accentColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 8;
    for (let i = 0; i < 3; i++) {
      const y = height * (0.4 + i * 0.12);
      ctx.beginPath();
      ctx.arc(width * 0.25, y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(width * 0.75, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    
    // Engine glow (animated)
    const enginePulse = 0.5 + Math.sin(frame * 0.2) * 0.3;
    const engineGlow = ctx.createRadialGradient(
      width * 0.5, height * 0.9, 0,
      width * 0.5, height * 0.9, 25
    );
    engineGlow.addColorStop(0, engineColor);
    engineGlow.addColorStop(0.5, `rgba(${isEnemy ? '255, 100, 0' : '0, 170, 255'}, ${enginePulse})`);
    engineGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = engineGlow;
    ctx.beginPath();
    ctx.ellipse(width * 0.5, height * 0.88, 15, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Propeller effect
    ctx.strokeStyle = engineColor;
    ctx.lineWidth = 2;
    ctx.globalAlpha = enginePulse;
    for (let i = 0; i < 4; i++) {
      const angle = (frame * 0.3 + i * Math.PI / 2);
      const x1 = width * 0.5 + Math.cos(angle) * 8;
      const y1 = height * 0.88 + Math.sin(angle) * 4;
      const x2 = width * 0.5 + Math.cos(angle) * 18;
      const y2 = height * 0.88 + Math.sin(angle) * 9;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    
    // Damage effects
    if (damaged) {
      ctx.fillStyle = '#ff6600';
      ctx.shadowColor = '#ff3300';
      ctx.shadowBlur = 10;
      for (let i = 0; i < 6; i++) {
        const x = width * (0.3 + Math.random() * 0.4);
        const y = height * (0.25 + Math.random() * 0.5);
        const size = 2 + Math.random() * 4;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      // Smoke particles
      ctx.fillStyle = 'rgba(50, 50, 50, 0.6)';
      for (let i = 0; i < 4; i++) {
        const x = width * (0.35 + Math.random() * 0.3);
        const y = height * (0.2 + Math.random() * 0.3) - (frame % 30) * 0.5;
        ctx.beginPath();
        ctx.arc(x, y, 4 + Math.random() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }
    
    ctx.restore();
    
    // Shield effect (drawn without rotation)
    if (shieldActive) {
      const shieldPulse = 0.4 + Math.sin(frame * 0.15) * 0.2;
      
      // Outer shield ring
      ctx.strokeStyle = `rgba(0, 200, 255, ${shieldPulse + 0.2})`;
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(0, 200, 255, 0.9)';
      ctx.shadowBlur = 25;
      ctx.beginPath();
      ctx.ellipse(width / 2, height / 2, width * 0.46, height * 0.46, 0, 0, Math.PI * 2);
      ctx.stroke();
      
      // Inner shield glow
      ctx.strokeStyle = `rgba(0, 255, 255, ${shieldPulse})`;
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.ellipse(width / 2, height / 2, width * 0.42, height * 0.42, 0, 0, Math.PI * 2);
      ctx.stroke();
      
      // Hexagonal shield pattern
      ctx.strokeStyle = `rgba(0, 200, 255, ${shieldPulse * 0.5})`;
      ctx.lineWidth = 1;
      ctx.shadowBlur = 5;
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + frame * 0.02;
        const x1 = width / 2 + Math.cos(angle) * width * 0.3;
        const y1 = height / 2 + Math.sin(angle) * height * 0.3;
        const x2 = width / 2 + Math.cos(angle) * width * 0.46;
        const y2 = height / 2 + Math.sin(angle) * height * 0.46;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
    }
    
  }, [isPlayer, isEnemy, damaged, shieldActive, frame]);
  
  return (
    <canvas 
      ref={canvasRef} 
      width={200} 
      height={200} 
      className={`${className}`}
      style={{ imageRendering: 'auto' }}
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
