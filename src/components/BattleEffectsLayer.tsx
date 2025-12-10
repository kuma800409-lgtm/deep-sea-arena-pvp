'use client';

import React, { useEffect, useState } from 'react';

// Types for effects
export type SkillEffectType = 'focusFire' | 'evasive' | 'energyShunt' | 'ultimate';
export type ProjectileType = 'laser' | 'missile' | 'ultimateBeam';

export interface SkillEffect {
  id: string;
  type: SkillEffectType;
  source: 'player' | 'enemy';
  createdAt: number;
}

export interface ProjectileEffect {
  id: string;
  kind: ProjectileType;
  from: 'player' | 'enemy';
  to: 'player' | 'enemy';
  createdAt: number;
  duration: number;
}

export interface ImpactEffect {
  id: string;
  target: 'player' | 'enemy';
  type: 'hit' | 'critical' | 'ultimate';
  createdAt: number;
}

export interface Position {
  x: number;
  y: number;
}

interface BattleEffectsLayerProps {
  playerPos: Position | null;
  enemyPos: Position | null;
  skillEffects: SkillEffect[];
  projectiles: ProjectileEffect[];
  impacts: ImpactEffect[];
  isHitFlashing?: boolean;
  isLowHealth?: boolean;
}

// Targeting reticle component
function TargetingReticle({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: x - 30,
        top: y - 30,
        width: 60,
        height: 60,
      }}
    >
      {/* Outer rotating ring */}
      <div
        className="absolute inset-0 border-2 rounded-full"
        style={{
          borderColor: color,
          animation: 'spin 0.5s linear infinite',
          boxShadow: `0 0 20px ${color}`,
        }}
      />
      {/* Inner crosshair */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-4 h-0.5" style={{ backgroundColor: color }} />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-0.5 h-4" style={{ backgroundColor: color }} />
      </div>
      {/* Corner brackets */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2" style={{ borderColor: color }} />
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2" style={{ borderColor: color }} />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2" style={{ borderColor: color }} />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2" style={{ borderColor: color }} />
    </div>
  );
}

// Laser beam projectile
function LaserBeam({ from, to, color }: { from: Position; to: Position; color: string }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return (
    <div
      className="absolute origin-left pointer-events-none"
      style={{
        left: from.x,
        top: from.y,
        width: distance,
        height: 4,
        transform: `rotate(${angle}deg)`,
        animation: 'laserBeamAnim 0.3s ease-out forwards',
      }}
    >
      {/* Core beam */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `linear-gradient(90deg, ${color}, white, ${color})`,
          boxShadow: `0 0 10px ${color}, 0 0 20px ${color}, 0 0 30px ${color}`,
        }}
      />
      {/* Glow trail */}
      <div
        className="absolute inset-0 rounded-full opacity-50"
        style={{
          background: color,
          filter: 'blur(4px)',
        }}
      />
    </div>
  );
}

// Ultimate beam (much larger and more dramatic)
function UltimateBeam({ from, to }: { from: Position; to: Position }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return (
    <div
      className="absolute origin-left pointer-events-none"
      style={{
        left: from.x,
        top: from.y - 10,
        width: distance,
        height: 20,
        transform: `rotate(${angle}deg)`,
        animation: 'ultimateBeamAnim 0.5s ease-out forwards',
      }}
    >
      {/* Core beam */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'linear-gradient(90deg, #9333ea, #ec4899, #f59e0b, #ec4899, #9333ea)',
          boxShadow: '0 0 20px #9333ea, 0 0 40px #ec4899, 0 0 60px #f59e0b',
        }}
      />
      {/* Outer glow */}
      <div
        className="absolute -inset-2 rounded-full opacity-60"
        style={{
          background: 'linear-gradient(90deg, #9333ea, #ec4899, #9333ea)',
          filter: 'blur(8px)',
        }}
      />
      {/* Particles along beam */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-white rounded-full"
          style={{
            left: `${(i + 1) * 12}%`,
            top: '50%',
            transform: 'translateY(-50%)',
            animation: `particlePulse 0.2s ease-out ${i * 0.05}s`,
            boxShadow: '0 0 10px white',
          }}
        />
      ))}
    </div>
  );
}

// Impact explosion effect
function ImpactExplosion({ x, y, type }: { x: number; y: number; type: 'hit' | 'critical' | 'ultimate' }) {
  const size = type === 'ultimate' ? 120 : type === 'critical' ? 80 : 50;
  const color = type === 'ultimate' ? '#f59e0b' : type === 'critical' ? '#ef4444' : '#00ffff';

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
      }}
    >
      {/* Central flash */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, white 0%, ${color} 40%, transparent 70%)`,
          animation: 'impactFlash 0.3s ease-out forwards',
        }}
      />
      {/* Expanding ring */}
      <div
        className="absolute inset-0 rounded-full border-4"
        style={{
          borderColor: color,
          animation: 'impactRing 0.4s ease-out forwards',
          boxShadow: `0 0 20px ${color}`,
        }}
      />
      {/* Particle burst */}
      {[...Array(type === 'ultimate' ? 12 : 6)].map((_, i) => {
        const angle = (i / (type === 'ultimate' ? 12 : 6)) * Math.PI * 2;
        return (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: '50%',
              top: '50%',
              backgroundColor: color,
              boxShadow: `0 0 8px ${color}`,
              animation: `particleBurst 0.4s ease-out forwards`,
              transform: `translate(-50%, -50%) rotate(${angle}rad)`,
              ['--burst-angle' as string]: `${angle}rad`,
            }}
          />
        );
      })}
    </div>
  );
}

// Evasive maneuver effect (afterimage trail)
function EvasiveEffect({ x, y }: { x: number; y: number }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: x - 50,
        top: y - 50,
        width: 100,
        height: 100,
      }}
    >
      {/* Speed lines */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute h-0.5 bg-cyan-400 rounded-full"
          style={{
            left: -20 - i * 10,
            top: 30 + i * 8,
            width: 30 + i * 5,
            opacity: 1 - i * 0.15,
            animation: `speedLine 0.5s ease-out ${i * 0.05}s forwards`,
            boxShadow: '0 0 5px #00ffff',
          }}
        />
      ))}
      {/* Afterimage */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(0, 255, 255, 0.3) 0%, transparent 70%)',
          animation: 'afterimage 0.6s ease-out forwards',
        }}
      />
    </div>
  );
}

// Energy shunt effect (energy particles flowing to shield)
function EnergyShuntEffect({ x, y }: { x: number; y: number }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: x - 60,
        top: y - 60,
        width: 120,
        height: 120,
      }}
    >
      {/* Hexagonal shield glow */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(0, 255, 200, 0.4) 0%, transparent 60%)',
          animation: 'shieldPulse 0.8s ease-out forwards',
        }}
      />
      {/* Energy particles flowing inward */}
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <div
            key={i}
            className="absolute w-3 h-3 rounded-full bg-green-400"
            style={{
              left: '50%',
              top: '50%',
              boxShadow: '0 0 10px #00ff88, 0 0 20px #00ff88',
              animation: `energyParticle 0.6s ease-in forwards`,
              animationDelay: `${i * 0.08}s`,
              transform: `translate(-50%, -50%) rotate(${angle}rad) translateX(60px)`,
            }}
          />
        );
      })}
    </div>
  );
}

// Ultimate charge-up effect
function UltimateChargeEffect({ x, y }: { x: number; y: number }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: x - 80,
        top: y - 80,
        width: 160,
        height: 160,
      }}
    >
      {/* Charging aura */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(147, 51, 234, 0.6) 0%, rgba(236, 72, 153, 0.3) 50%, transparent 70%)',
          animation: 'chargeAura 0.6s ease-in forwards',
        }}
      />
      {/* Spinning energy ring */}
      <div
        className="absolute inset-4 rounded-full border-4 border-purple-500"
        style={{
          animation: 'chargeRing 0.6s linear forwards',
          boxShadow: '0 0 30px #9333ea, inset 0 0 30px #9333ea',
        }}
      />
      {/* Energy particles spiraling in */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: '50%',
            top: '50%',
            background: i % 2 === 0 ? '#9333ea' : '#ec4899',
            boxShadow: `0 0 10px ${i % 2 === 0 ? '#9333ea' : '#ec4899'}`,
            animation: `spiralIn 0.6s ease-in forwards`,
            animationDelay: `${i * 0.05}s`,
            transform: `translate(-50%, -50%) rotate(${(i / 12) * 360}deg) translateX(70px)`,
          }}
        />
      ))}
    </div>
  );
}

// Muzzle flash effect
function MuzzleFlash({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: x - 20,
        top: y - 20,
        width: 40,
        height: 40,
      }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, white 0%, ${color} 50%, transparent 70%)`,
          animation: 'muzzleFlash 0.15s ease-out forwards',
          boxShadow: `0 0 20px ${color}`,
        }}
      />
    </div>
  );
}

export function BattleEffectsLayer({
  playerPos,
  enemyPos,
  skillEffects,
  projectiles,
  impacts,
  isHitFlashing,
  isLowHealth,
}: BattleEffectsLayerProps) {
  const [muzzleFlashes, setMuzzleFlashes] = useState<{ id: string; x: number; y: number; color: string }[]>([]);

  // Add muzzle flash when projectile is created
  useEffect(() => {
    projectiles.forEach(p => {
      const pos = p.from === 'player' ? playerPos : enemyPos;
      if (!pos) return;
      
      const color = p.kind === 'ultimateBeam' ? '#9333ea' : p.from === 'player' ? '#00ffff' : '#ff4444';
      const flashId = `flash-${p.id}`;
      
      setMuzzleFlashes(prev => {
        if (prev.some(f => f.id === flashId)) return prev;
        return [...prev, { id: flashId, x: pos.x, y: pos.y, color }];
      });
      
      setTimeout(() => {
        setMuzzleFlashes(prev => prev.filter(f => f.id !== flashId));
      }, 150);
    });
  }, [projectiles, playerPos, enemyPos]);

  if (!playerPos || !enemyPos) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {/* Screen flash overlay */}
      {isHitFlashing && (
        <div
          className="absolute inset-0 bg-white"
          style={{ animation: 'screenFlash 0.15s ease-out forwards' }}
        />
      )}

      {/* Low health vignette */}
      {isLowHealth && (
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle, transparent 40%, rgba(255, 0, 0, 0.3) 100%)',
            animation: 'lowHealthPulse 1s ease-in-out infinite',
          }}
        />
      )}

      {/* Muzzle flashes */}
      {muzzleFlashes.map(flash => (
        <MuzzleFlash key={flash.id} x={flash.x} y={flash.y} color={flash.color} />
      ))}

      {/* Skill effects */}
      {skillEffects.map(effect => {
        const targetPos = effect.source === 'player' ? enemyPos : playerPos;
        const sourcePos = effect.source === 'player' ? playerPos : enemyPos;

        switch (effect.type) {
          case 'focusFire':
            return (
              <TargetingReticle
                key={effect.id}
                x={targetPos.x}
                y={targetPos.y}
                color={effect.source === 'player' ? '#00ffff' : '#ff4444'}
              />
            );
          case 'evasive':
            return <EvasiveEffect key={effect.id} x={sourcePos.x} y={sourcePos.y} />;
          case 'energyShunt':
            return <EnergyShuntEffect key={effect.id} x={sourcePos.x} y={sourcePos.y} />;
          case 'ultimate':
            return <UltimateChargeEffect key={effect.id} x={sourcePos.x} y={sourcePos.y} />;
          default:
            return null;
        }
      })}

      {/* Projectiles */}
      {projectiles.map(projectile => {
        const fromPos = projectile.from === 'player' ? playerPos : enemyPos;
        const toPos = projectile.to === 'player' ? playerPos : enemyPos;
        const color = projectile.from === 'player' ? '#00ffff' : '#ff4444';

        if (projectile.kind === 'ultimateBeam') {
          return <UltimateBeam key={projectile.id} from={fromPos} to={toPos} />;
        }

        return <LaserBeam key={projectile.id} from={fromPos} to={toPos} color={color} />;
      })}

      {/* Impact effects */}
      {impacts.map(impact => {
        const pos = impact.target === 'player' ? playerPos : enemyPos;
        return (
          <ImpactExplosion
            key={impact.id}
            x={pos.x}
            y={pos.y}
            type={impact.type}
          />
        );
      })}
    </div>
  );
}

// Improved damage number component with better positioning
export function ImprovedDamageNumber({ 
  value, 
  x, 
  y, 
  isPlayerTarget,
  isCritical = false,
}: { 
  value: number; 
  x: number; 
  y: number; 
  isPlayerTarget: boolean;
  isCritical?: boolean;
}) {
  const color = isPlayerTarget ? 'text-red-500' : 'text-cyan-400';
  const size = isCritical ? 'text-4xl' : 'text-2xl';
  
  return (
    <div 
      className={`absolute ${size} font-bold pointer-events-none ${color}`}
      style={{ 
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        animation: 'damageFloat 0.8s ease-out forwards',
        textShadow: `0 0 10px currentColor, 0 0 20px currentColor`,
        zIndex: 50,
      }}
    >
      {isCritical && <span className="text-yellow-400">CRIT! </span>}
      -{value}
    </div>
  );
}
