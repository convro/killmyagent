'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GameProvider, useGame } from '@/components/GameContext';
import GameMap from '@/components/Map/GameMap';
import ActionControls from '@/components/Controls/ActionControls';
import AgentThoughtsPanel from '@/components/AgentThoughts/AgentThoughtsPanel';
import PlayerHUD from '@/components/HUD/PlayerHUD';
import KillFeed from '@/components/KillFeed/KillFeed';
import MessageFeed from '@/components/MessageFeed/MessageFeed';
import { PlayerView, TurnResult } from '@/types/game';
import { AGENT_COLORS } from '@/utils/constants';

function VictoryScreen() {
  const { state } = useGame();
  const { playerView, turnResults } = state;
  const router = useRouter();

  if (!playerView || playerView.phase !== 'finished') return null;

  const winner = playerView.winner;
  const isHumanWinner = winner === playerView.yourPlayer.id;
  const winnerPlayer = isHumanWinner
    ? playerView.yourPlayer
    : playerView.visiblePlayers.find(p => p.id === winner) || null;

  const lastAgentThought = state.currentAgentThoughts[winner || ''];

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-6">
      <div className="text-center max-w-lg fade-in">
        <h1
          className="text-4xl md:text-6xl font-extrabold mb-4 tracking-wider"
          style={{
            fontFamily: 'Orbitron, sans-serif',
            color: isHumanWinner ? '#00A3FF' : '#FF3333',
            textShadow: `0 0 30px ${isHumanWinner ? 'rgba(0, 163, 255, 0.5)' : 'rgba(255, 51, 51, 0.5)'}`,
          }}
        >
          {isHumanWinner ? 'VICTORY' : 'ELIMINATED'}
        </h1>

        <p className="text-lg text-text-secondary mb-8">
          {isHumanWinner
            ? 'You outsmarted 5 AI reasoning models. They thought it was real. You knew it was a game.'
            : `${winnerPlayer?.name || 'An agent'} is the last one standing.`
          }
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-bg-secondary rounded-lg p-3">
            <span className="text-xs text-text-muted block">TURNS</span>
            <span className="text-2xl font-bold font-mono text-accent">{playerView.turn}</span>
          </div>
          <div className="bg-bg-secondary rounded-lg p-3">
            <span className="text-xs text-text-muted block">KILLS</span>
            <span className="text-2xl font-bold font-mono text-danger">{playerView.yourPlayer.kills}</span>
          </div>
          <div className="bg-bg-secondary rounded-lg p-3">
            <span className="text-xs text-text-muted block">DMG DEALT</span>
            <span className="text-2xl font-bold font-mono text-warning">{playerView.yourPlayer.damageDealt}</span>
          </div>
          <div className="bg-bg-secondary rounded-lg p-3">
            <span className="text-xs text-text-muted block">DMG TAKEN</span>
            <span className="text-2xl font-bold font-mono text-text-secondary">{playerView.yourPlayer.damageTaken}</span>
          </div>
        </div>

        {/* Agent victory speech */}
        {!isHumanWinner && lastAgentThought && (
          <div className="bg-bg-secondary border border-bg-tertiary rounded-lg p-4 mb-8 text-left">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              Winner&apos;s Final Thoughts
            </h3>
            <p className="text-sm text-text-secondary italic font-mono leading-relaxed">
              &quot;{lastAgentThought.reasoningChain.substring(0, 500)}&quot;
            </p>
          </div>
        )}

        <button
          onClick={() => router.push('/')}
          className="px-8 py-3 bg-accent text-black font-bold uppercase tracking-wider rounded btn-glow"
          style={{ fontFamily: 'Orbitron, sans-serif' }}
        >
          PLAY AGAIN
        </button>
      </div>
    </div>
  );
}

function TopBar() {
  const { state, dispatch } = useGame();
  const { playerView, isProcessing } = state;

  if (!playerView) return null;

  const phaseLabels: Record<string, string> = {
    lobby: 'LOBBY',
    action: 'YOUR TURN',
    resolving: 'RESOLVING...',
    resolved: 'RESOLVED',
    finished: 'GAME OVER',
  };

  return (
    <div className="h-12 bg-bg-secondary border-b border-bg-tertiary flex items-center justify-between px-4">
      <span className="text-sm font-bold uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
        TURN {playerView.turn}
      </span>

      <span className={`text-xs font-bold uppercase tracking-wider ${
        playerView.phase === 'action' ? 'text-accent' :
        playerView.phase === 'finished' ? 'text-danger' : 'text-warning'
      }`} style={{ fontFamily: 'Orbitron, sans-serif' }}>
        {isProcessing ? 'AI THINKING...' : phaseLabels[playerView.phase]}
      </span>

      <div className="flex gap-2">
        <button
          onClick={() => dispatch({ type: 'TOGGLE_THOUGHTS' })}
          className={`text-xs px-2 py-1 rounded border transition-all ${
            state.showAgentThoughts
              ? 'border-accent text-accent bg-accent/10'
              : 'border-bg-tertiary text-text-muted hover:border-accent/50'
          }`}
        >
          🧠
        </button>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_MESSAGES' })}
          className={`text-xs px-2 py-1 rounded border transition-all ${
            state.showMessages
              ? 'border-accent text-accent bg-accent/10'
              : 'border-bg-tertiary text-text-muted hover:border-accent/50'
          }`}
        >
          💬
        </button>
      </div>
    </div>
  );
}

function EventTicker() {
  const { state } = useGame();
  const { turnResults } = state;

  const lastResult = turnResults[turnResults.length - 1];
  if (!lastResult) return null;

  const events = lastResult.events.filter(e =>
    e.type === 'attack' || e.type === 'elimination' || e.type === 'special_ability' || e.type === 'danger_zone'
  );

  if (events.length === 0) return null;

  return (
    <div className="h-8 bg-bg-secondary/80 border-b border-bg-tertiary overflow-hidden flex items-center">
      <div className="animate-marquee whitespace-nowrap flex gap-8 px-4">
        {events.map((event, i) => (
          <span
            key={i}
            className={`text-xs font-mono ${
              event.type === 'elimination' ? 'text-danger' :
              event.type === 'danger_zone' ? 'text-warning' :
              'text-text-secondary'
            }`}
          >
            {event.narration}
          </span>
        ))}
      </div>
    </div>
  );
}

function GameContent() {
  const { state, dispatch, startGame: startGameAction, submitAction } = useGame();
  const router = useRouter();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const gameId = sessionStorage.getItem('gameId');
    const sessionToken = sessionStorage.getItem('sessionToken');
    const playerId = sessionStorage.getItem('playerId');

    if (!gameId || !sessionToken || !playerId) {
      router.push('/');
      return;
    }

    dispatch({ type: 'SET_GAME', gameId, sessionToken, playerId });

    // Fetch initial game state
    fetch(`/api/game/${gameId}`, {
      headers: { 'x-session-token': sessionToken },
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          router.push('/');
          return;
        }
        dispatch({ type: 'UPDATE_VIEW', view: data });
        setInitialized(true);
      })
      .catch(() => router.push('/'));
  }, []);

  const handleStart = async () => {
    await startGameAction();
  };

  if (!initialized || !state.playerView) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-muted text-sm">Loading arena...</p>
        </div>
      </div>
    );
  }

  const { playerView } = state;

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      <TopBar />
      <EventTicker />

      {/* Lobby state — show start button */}
      {playerView.phase === 'lobby' && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <h2
              className="text-2xl font-bold mb-4 uppercase tracking-wider"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              Arena Ready
            </h2>
            <p className="text-sm text-text-secondary mb-2">
              6 combatants have been placed on a 12x12 tactical grid.
            </p>
            <p className="text-sm text-text-secondary mb-6">
              5 AI agents powered by DeepSeek R1 are waiting. They don&apos;t know you&apos;re human.
            </p>
            <div className="grid grid-cols-5 gap-2 mb-8">
              {['viper', 'blaze', 'ghost', 'oracle', 'rook'].map(agent => (
                <div
                  key={agent}
                  className="p-2 rounded border text-center"
                  style={{ borderColor: AGENT_COLORS[agent] + '60' }}
                >
                  <div className="w-4 h-4 rounded-full mx-auto mb-1" style={{ backgroundColor: AGENT_COLORS[agent] }} />
                  <span className="text-[10px] font-bold uppercase" style={{ color: AGENT_COLORS[agent] }}>
                    {agent}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={handleStart}
              disabled={state.isProcessing}
              className="px-10 py-4 bg-accent text-black font-bold text-lg uppercase tracking-wider rounded btn-glow transition-all hover:scale-105 disabled:opacity-50"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              {state.isProcessing ? 'INITIALIZING...' : 'START GAME'}
            </button>
          </div>
        </div>
      )}

      {/* Active game */}
      {(playerView.phase === 'action' || playerView.phase === 'resolving' || playerView.phase === 'resolved') && (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left panel - Desktop only: Agent Thoughts */}
          <div className="hidden lg:block w-80 border-r border-bg-tertiary overflow-y-auto">
            {Object.keys(state.currentAgentThoughts).length > 0 ? (
              <AgentThoughtsPanel />
            ) : (
              <div className="p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  Agent Thoughts
                </h3>
                <p className="text-xs text-text-muted italic">Agent reasoning will appear here after the first turn resolves.</p>
              </div>
            )}
          </div>

          {/* Center - Map + Controls */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Map */}
            <div className="flex-1 flex items-center justify-center p-2 overflow-auto">
              <GameMap />
            </div>

            {/* Controls */}
            <div className="border-t border-bg-tertiary bg-bg-secondary/50">
              <ActionControls />
            </div>
          </div>

          {/* Right panel - Desktop: HUD + Messages + KillFeed */}
          <div className="hidden lg:flex lg:flex-col w-72 border-l border-bg-tertiary overflow-y-auto p-3 gap-3">
            <PlayerHUD />
            <KillFeed />
            <MessageFeed />
          </div>

          {/* Mobile bottom panels */}
          <div className="lg:hidden">
            {state.showMessages && (
              <div className="fixed inset-x-0 bottom-0 z-40 max-h-[60vh] bg-bg-primary border-t border-bg-tertiary overflow-y-auto p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-muted" style={{ fontFamily: 'Orbitron, sans-serif' }}>Intel</span>
                  <button onClick={() => dispatch({ type: 'TOGGLE_MESSAGES' })} className="text-text-muted">✕</button>
                </div>
                <PlayerHUD />
                <div className="mt-3"><KillFeed /></div>
                <div className="mt-3"><MessageFeed /></div>
              </div>
            )}
            {state.showAgentThoughts && <AgentThoughtsPanel />}
          </div>
        </div>
      )}

      {/* Victory screen overlay */}
      <VictoryScreen />

      {/* Error display */}
      {state.error && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-danger/20 border border-danger text-danger px-4 py-2 rounded text-sm slide-up">
          {state.error}
          <button
            onClick={() => dispatch({ type: 'SET_ERROR', error: null })}
            className="ml-3 text-danger/60 hover:text-danger"
          >
            ✕
          </button>
        </div>
      )}

      {/* Processing overlay */}
      {state.isProcessing && (
        <div className="fixed inset-0 z-30 bg-black/50 flex items-center justify-center pointer-events-none">
          <div className="bg-bg-secondary border border-accent/30 rounded-lg p-6 text-center">
            <div className="w-10 h-10 border-3 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-accent font-bold uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              Agents Reasoning...
            </p>
            <p className="text-xs text-text-muted mt-1">DeepSeek R1 is thinking</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GamePage() {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
}
