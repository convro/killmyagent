'use client';

import React from 'react';
import { useGame } from '../GameContext';
import { AGENT_COLORS } from '@/utils/constants';

function getPlayerColor(name: string): string {
  const lower = name.toLowerCase();
  if (lower === 'viper') return AGENT_COLORS.viper;
  if (lower === 'blaze') return AGENT_COLORS.blaze;
  if (lower === 'ghost') return AGENT_COLORS.ghost;
  if (lower === 'oracle') return AGENT_COLORS.oracle;
  if (lower === 'rook') return AGENT_COLORS.rook;
  if (lower === 'the zone') return '#FF3333';
  return AGENT_COLORS.human;
}

export default function KillFeed() {
  const { state } = useGame();
  const { playerView } = state;

  if (!playerView) return null;

  const { killFeed } = playerView;

  if (killFeed.length === 0) return null;

  return (
    <div className="bg-bg-secondary border border-bg-tertiary rounded-lg overflow-hidden">
      <div className="px-3 py-2 border-b border-bg-tertiary">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          Kill Feed
        </h3>
      </div>
      <div className="max-h-40 overflow-y-auto">
        {[...killFeed].reverse().map((kill, i) => (
          <div
            key={i}
            className="px-3 py-2 border-b border-bg-tertiary/50 slide-in-right text-xs"
          >
            <div className="flex items-center gap-1 flex-wrap">
              <span className="font-bold" style={{ color: getPlayerColor(kill.killerName) }}>
                {kill.killerName}
              </span>
              <span className="text-danger">✕</span>
              <span className="font-bold" style={{ color: getPlayerColor(kill.victimName) }}>
                {kill.victimName}
              </span>
              <span className="text-text-muted ml-1">
                [{kill.weapon}]
              </span>
            </div>
            <div className="text-text-muted mt-0.5 italic" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px' }}>
              {kill.narration}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
