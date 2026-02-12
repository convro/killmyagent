'use client';

import React from 'react';
import { useGame } from '../GameContext';

const WEAPON_ICONS: Record<string, string> = {
  knife: '🔪',
  pistol: '🔫',
  shotgun: '💥',
  rifle: '🎯',
  sniper: '🔭',
};

const ITEM_ICONS: Record<string, string> = {
  medkit: '💊',
  grenade: '💣',
  trap: '⚠️',
  armor_vest: '🛡',
  smoke_bomb: '💨',
};

export default function PlayerHUD() {
  const { state } = useGame();
  const { playerView } = state;

  if (!playerView) return null;

  const { yourPlayer, dangerZone, alivePlayers } = playerView;
  const hpPercent = (yourPlayer.hp / yourPlayer.maxHp) * 100;
  const hpColor = hpPercent > 60 ? '#33FF57' : hpPercent > 30 ? '#FFB800' : '#FF3333';

  const weapons = yourPlayer.inventory.filter(i => ['knife', 'pistol', 'shotgun', 'rifle', 'sniper'].includes(i));
  const items = yourPlayer.inventory.filter(i => ['medkit', 'grenade', 'trap', 'armor_vest', 'smoke_bomb'].includes(i));

  return (
    <div className="bg-bg-secondary border border-bg-tertiary rounded-lg p-3">
      {/* HP Bar */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">HP</span>
          <span className="text-sm font-bold font-mono" style={{ color: hpColor }}>
            {yourPlayer.hp}/{yourPlayer.maxHp}
          </span>
        </div>
        <div className="h-3 bg-bg-tertiary rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${hpPercent}%`,
              backgroundColor: hpColor,
              boxShadow: `0 0 8px ${hpColor}50`,
            }}
          />
        </div>
      </div>

      {/* Equipped Weapon */}
      <div className="flex items-center gap-2 mb-3 bg-bg-tertiary rounded px-3 py-2">
        <span className="text-lg">{WEAPON_ICONS[yourPlayer.equippedWeapon] || '🔪'}</span>
        <span className="text-sm font-bold uppercase text-accent">{yourPlayer.equippedWeapon}</span>
      </div>

      {/* Inventory */}
      <div className="mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-1">Inventory</span>
        <div className="flex flex-wrap gap-1">
          {weapons.map((w, i) => (
            <span key={`w-${i}`} className="bg-bg-tertiary px-2 py-1 rounded text-xs" title={w}>
              {WEAPON_ICONS[w] || w}
            </span>
          ))}
          {items.map((item, i) => (
            <span key={`i-${i}`} className="bg-bg-tertiary px-2 py-1 rounded text-xs" title={item}>
              {ITEM_ICONS[item] || item}
            </span>
          ))}
          {yourPlayer.inventory.length === 0 && (
            <span className="text-xs text-text-muted">Empty</span>
          )}
        </div>
      </div>

      {/* Position & Stats */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-bg-tertiary rounded px-2 py-1">
          <span className="text-text-muted">POS </span>
          <span className="font-mono text-text-primary">({yourPlayer.position.x},{yourPlayer.position.y})</span>
        </div>
        <div className="bg-bg-tertiary rounded px-2 py-1">
          <span className="text-text-muted">ALIVE </span>
          <span className="font-mono text-accent">{alivePlayers.length}/6</span>
        </div>
        <div className="bg-bg-tertiary rounded px-2 py-1">
          <span className="text-text-muted">KILLS </span>
          <span className="font-mono text-danger">{yourPlayer.kills}</span>
        </div>
        <div className="bg-bg-tertiary rounded px-2 py-1">
          <span className="text-text-muted">ZONE </span>
          <span className="font-mono text-warning">
            {dangerZone.active ? `${dangerZone.nextShrinkIn}t` : 'SAFE'}
          </span>
        </div>
      </div>
    </div>
  );
}
