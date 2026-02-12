'use client';

import React from 'react';
import { useGame } from '../GameContext';
import { AGENT_COLORS } from '@/utils/constants';

function getSenderColor(name: string): string {
  const lower = name.toLowerCase();
  if (lower === 'viper') return AGENT_COLORS.viper;
  if (lower === 'blaze') return AGENT_COLORS.blaze;
  if (lower === 'ghost') return AGENT_COLORS.ghost;
  if (lower === 'oracle') return AGENT_COLORS.oracle;
  if (lower === 'rook') return AGENT_COLORS.rook;
  return AGENT_COLORS.human;
}

export default function MessageFeed() {
  const { state } = useGame();
  const { playerView } = state;

  if (!playerView) return null;

  const { messages } = playerView;

  if (messages.length === 0) {
    return (
      <div className="bg-bg-secondary border border-bg-tertiary rounded-lg p-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          Messages
        </h3>
        <p className="text-xs text-text-muted italic">No messages yet. The silence is deafening.</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-secondary border border-bg-tertiary rounded-lg overflow-hidden">
      <div className="px-3 py-2 border-b border-bg-tertiary">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          Messages
        </h3>
      </div>
      <div className="max-h-48 overflow-y-auto">
        {messages.map((msg, i) => (
          <div
            key={i}
            className="px-3 py-2 border-b border-bg-tertiary/50 text-xs"
          >
            <div className="flex items-center gap-1 mb-0.5">
              <span className="font-bold" style={{ color: getSenderColor(msg.fromName) }}>
                {msg.fromName}
              </span>
              {msg.private && (
                <span className="text-warning text-[10px] uppercase font-bold">PRIVATE</span>
              )}
              <span className="text-text-muted">→</span>
              <span className="text-text-muted">
                {msg.to === 'all' ? 'ALL' : msg.to}
              </span>
              <span className="text-text-muted ml-auto text-[10px]">T{msg.turn}</span>
            </div>
            <p className="text-text-secondary italic">&quot;{msg.text}&quot;</p>
          </div>
        ))}
      </div>
    </div>
  );
}
