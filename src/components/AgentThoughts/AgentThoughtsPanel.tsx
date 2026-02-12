'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../GameContext';
import { AGENT_COLORS } from '@/utils/constants';

export default function AgentThoughtsPanel() {
  const { state, dispatch } = useGame();
  const { currentAgentThoughts, showAgentThoughts, selectedAgent } = state;
  const [displayedText, setDisplayedText] = useState<Record<string, string>>({});
  const animationRef = useRef<Record<string, NodeJS.Timeout>>({});

  const thoughts = Object.values(currentAgentThoughts);

  // Typewriter animation for thoughts
  useEffect(() => {
    // Clear previous animations
    for (const timer of Object.values(animationRef.current)) {
      clearTimeout(timer);
    }
    animationRef.current = {};
    setDisplayedText({});

    if (!showAgentThoughts) return;

    for (const thought of thoughts) {
      const fullText = thought.reasoningChain;
      if (!fullText) continue;

      let charIdx = 0;
      const typeChar = () => {
        if (charIdx < fullText.length) {
          setDisplayedText(prev => ({
            ...prev,
            [thought.playerId]: fullText.substring(0, charIdx + 1),
          }));
          charIdx++;
          animationRef.current[thought.playerId] = setTimeout(typeChar, 15);
        }
      };
      // Stagger start times
      const delay = thoughts.indexOf(thought) * 500;
      animationRef.current[`start_${thought.playerId}`] = setTimeout(typeChar, delay);
    }

    return () => {
      for (const timer of Object.values(animationRef.current)) {
        clearTimeout(timer);
      }
    };
  }, [currentAgentThoughts, showAgentThoughts]);

  if (!showAgentThoughts || thoughts.length === 0) return null;

  const getAgentColor = (codename: string): string => {
    return AGENT_COLORS[codename] || '#00A3FF';
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 lg:static lg:w-80 lg:h-full">
      {/* Mobile: Bottom sheet */}
      <div className="bg-bg-primary border-t border-bg-tertiary lg:border-t-0 lg:border-l max-h-[70vh] lg:max-h-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-bg-tertiary">
          <h3 className="text-sm font-bold uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Agent Thoughts
          </h3>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_THOUGHTS' })}
            className="text-text-muted hover:text-text-primary text-lg"
          >
            ✕
          </button>
        </div>

        {/* Agent tabs */}
        <div className="flex gap-1 px-3 py-2 border-b border-bg-tertiary overflow-x-auto">
          {thoughts.map(thought => (
            <button
              key={thought.playerId}
              onClick={() => dispatch({ type: 'SELECT_AGENT', agentId: thought.playerId === selectedAgent ? null : thought.playerId })}
              className={`px-3 py-1 rounded text-xs font-bold uppercase whitespace-nowrap transition-all border ${
                selectedAgent === thought.playerId || (!selectedAgent && thoughts.indexOf(thought) === 0)
                  ? 'border-opacity-100 bg-opacity-20'
                  : 'border-opacity-30 bg-transparent'
              }`}
              style={{
                borderColor: getAgentColor(thought.codename),
                color: getAgentColor(thought.codename),
                backgroundColor: (selectedAgent === thought.playerId || (!selectedAgent && thoughts.indexOf(thought) === 0))
                  ? getAgentColor(thought.codename) + '20'
                  : 'transparent',
              }}
            >
              {thought.codename}
            </button>
          ))}
        </div>

        {/* Thought content */}
        <div className="flex-1 overflow-y-auto p-4">
          {thoughts
            .filter(t => !selectedAgent || t.playerId === selectedAgent || (!selectedAgent && thoughts.indexOf(t) === 0))
            .slice(0, selectedAgent ? 1 : undefined)
            .map(thought => (
              <div key={thought.playerId} className="mb-4">
                {!selectedAgent && (
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getAgentColor(thought.codename) }}
                    />
                    <span
                      className="text-xs font-bold uppercase"
                      style={{ color: getAgentColor(thought.codename), fontFamily: 'Orbitron, sans-serif' }}
                    >
                      {thought.codename}
                    </span>
                  </div>
                )}
                <div
                  className="text-xs leading-relaxed whitespace-pre-wrap typing-cursor"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: '#B0B0B0',
                  }}
                >
                  {displayedText[thought.playerId] || thought.reasoningChain.substring(0, 1)}
                </div>
                <div className="mt-2 text-xs font-mono text-text-muted">
                  Action: <span className="text-accent">{thought.actionTaken}</span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
