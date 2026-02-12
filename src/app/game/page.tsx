'use client';

import React, { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { GameProvider, useGame } from '@/components/GameContext';
import ActionControls from '@/components/Controls/ActionControls';
import AgentThoughtsPanel from '@/components/AgentThoughts/AgentThoughtsPanel';
import PlayerHUD from '@/components/HUD/PlayerHUD';
import KillFeed from '@/components/KillFeed/KillFeed';
import MessageFeed from '@/components/MessageFeed/MessageFeed';
import { AGENT_COLORS } from '@/utils/constants';
import { Direction, ItemType } from '@/types/game';

// Dynamic import for Three.js (no SSR)
const GameMap3D = dynamic(() => import('@/components/Map/GameMap3D'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 bg-[#04060c] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-3 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-text-muted text-sm">Loading arena...</p>
      </div>
    </div>
  ),
});

// ── Victory Screen ────────────────────────────────────────────
function VictoryScreen() {
  const { state } = useGame();
  const { playerView } = state;
  const router = useRouter();

  if (!playerView || playerView.phase !== 'finished') return null;

  const winner = playerView.winner;
  const isHumanWinner = winner === playerView.yourPlayer.id;
  const winnerPlayer = isHumanWinner
    ? playerView.yourPlayer
    : playerView.visiblePlayers.find(p => p.id === winner) || null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="text-center max-w-lg fade-in">
        <h1
          className="text-4xl md:text-6xl font-extrabold mb-4 tracking-wider"
          style={{
            fontFamily: 'Orbitron, sans-serif',
            color: isHumanWinner ? '#00A3FF' : '#FF3333',
            textShadow: `0 0 30px ${isHumanWinner ? 'rgba(0,163,255,0.5)' : 'rgba(255,51,51,0.5)'}`,
          }}
        >
          {isHumanWinner ? 'VICTORY' : 'ELIMINATED'}
        </h1>
        <p className="text-lg text-text-secondary mb-8">
          {isHumanWinner
            ? 'You outsmarted 5 AI reasoning models.'
            : `${winnerPlayer?.name || 'An agent'} is the last one standing.`
          }
        </p>
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

// ── Top Bar (Overlay) ─────────────────────────────────────────
function TopBar() {
  const { state, dispatch } = useGame();
  const { playerView, isProcessing } = state;

  if (!playerView) return null;

  return (
    <div className="absolute top-0 left-0 right-0 z-20 h-10 flex items-center justify-between px-4"
      style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)' }}>
      <span className="text-sm font-bold uppercase tracking-wider text-text-secondary" style={{ fontFamily: 'Orbitron, sans-serif' }}>
        TURN {playerView.turn}
      </span>
      <span className={`text-xs font-bold uppercase tracking-wider ${
        playerView.phase === 'action' ? 'text-accent' :
        playerView.phase === 'finished' ? 'text-danger' : 'text-warning'
      }`} style={{ fontFamily: 'Orbitron, sans-serif' }}>
        {isProcessing ? 'AI THINKING...' : playerView.phase === 'action' ? 'YOUR TURN' : playerView.phase === 'finished' ? 'GAME OVER' : playerView.phase.toUpperCase()}
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => dispatch({ type: 'TOGGLE_THOUGHTS' })}
          className={`text-xs px-2 py-1 rounded border transition-all ${
            state.showAgentThoughts
              ? 'border-accent text-accent bg-accent/10'
              : 'border-white/10 text-text-muted hover:border-accent/50'
          }`}
        >
          🧠
        </button>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_MESSAGES' })}
          className={`text-xs px-2 py-1 rounded border transition-all ${
            state.showMessages
              ? 'border-accent text-accent bg-accent/10'
              : 'border-white/10 text-text-muted hover:border-accent/50'
          }`}
        >
          📋
        </button>
      </div>
    </div>
  );
}

// ── Event Ticker ──────────────────────────────────────────────
function EventTicker() {
  const { state } = useGame();
  const lastResult = state.turnResults[state.turnResults.length - 1];
  if (!lastResult) return null;

  const events = lastResult.events.filter(e =>
    e.type === 'attack' || e.type === 'elimination' || e.type === 'special_ability' || e.type === 'danger_zone'
  );
  if (events.length === 0) return null;

  return (
    <div className="absolute top-10 left-0 right-0 z-20 h-7 overflow-hidden flex items-center"
      style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)' }}>
      <div className="whitespace-nowrap flex gap-8 px-4 animate-marquee">
        {events.map((event, i) => (
          <span
            key={i}
            className={`text-xs font-mono ${
              event.type === 'elimination' ? 'text-danger' :
              event.type === 'danger_zone' ? 'text-warning' : 'text-text-secondary'
            }`}
          >
            {event.narration}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── HUD Overlay ───────────────────────────────────────────────
function HUDOverlay() {
  const { state } = useGame();

  return (
    <>
      {/* Player HUD - top left */}
      <div className="absolute top-12 left-3 z-20 w-56 opacity-90 hover:opacity-100 transition-opacity">
        <PlayerHUD />
      </div>

      {/* Kill Feed + Messages - right side */}
      {state.showMessages && (
        <div className="absolute top-12 right-3 z-20 w-64 max-h-[60vh] overflow-y-auto opacity-90 hover:opacity-100 transition-opacity flex flex-col gap-2">
          <KillFeed />
          <MessageFeed />
        </div>
      )}

      {/* Agent Thoughts Panel */}
      {state.showAgentThoughts && (
        <div className="absolute top-12 left-3 lg:left-auto lg:right-[280px] z-30 w-80 max-h-[70vh] overflow-hidden">
          <AgentThoughtsPanel />
        </div>
      )}
    </>
  );
}

// ── Main Game Content ─────────────────────────────────────────
function GameContent() {
  const { state, dispatch, startGame: startGameAction, submitAction } = useGame();
  const router = useRouter();
  const [initialized, setInitialized] = useState(false);
  const [itemTargeting, setItemTargeting] = useState<ItemType | null>(null);

  useEffect(() => {
    const gameId = sessionStorage.getItem('gameId');
    const sessionToken = sessionStorage.getItem('sessionToken');
    const playerId = sessionStorage.getItem('playerId');

    if (!gameId || !sessionToken || !playerId) {
      router.push('/');
      return;
    }

    dispatch({ type: 'SET_GAME', gameId, sessionToken, playerId });

    fetch(`/api/game/${gameId}`, {
      headers: { 'x-session-token': sessionToken },
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) { router.push('/'); return; }
        dispatch({ type: 'UPDATE_VIEW', view: data });
        setInitialized(true);
      })
      .catch(() => router.push('/'));
  }, []);

  // ── 3D Map callbacks ──────────────────────────────────────
  const handleMoveAction = useCallback(async (direction: Direction, distance: number) => {
    if (state.isProcessing || !state.playerView || state.playerView.phase !== 'action') return;
    await submitAction('move', { direction, distance });
  }, [state.isProcessing, state.playerView, submitAction]);

  const handleAttackAction = useCallback(async (targetX: number, targetY: number) => {
    if (state.isProcessing || !state.playerView || state.playerView.phase !== 'action') return;
    const weapon = state.playerView.yourPlayer.equippedWeapon;
    await submitAction('attack', { targetX, targetY, weapon });
  }, [state.isProcessing, state.playerView, submitAction]);

  const handleItemTarget = useCallback(async (x: number, y: number) => {
    if (!itemTargeting || state.isProcessing) return;
    await submitAction('use_item', { item: itemTargeting, targetX: x, targetY: y });
    setItemTargeting(null);
  }, [itemTargeting, state.isProcessing, submitAction]);

  // ── Loading ───────────────────────────────────────────────
  if (!initialized || !state.playerView) {
    return (
      <div className="min-h-screen bg-[#04060c] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-muted text-sm">Loading arena...</p>
        </div>
      </div>
    );
  }

  const { playerView } = state;

  // ── Lobby ─────────────────────────────────────────────────
  if (playerView.phase === 'lobby') {
    return (
      <div className="min-h-screen bg-[#04060c] flex items-center justify-center p-6">
        <div className="text-center max-w-md fade-in">
          <h2 className="text-3xl font-bold mb-4 uppercase tracking-wider text-accent"
            style={{ fontFamily: 'Orbitron, sans-serif', textShadow: '0 0 20px rgba(0,163,255,0.4)' }}>
            Arena Ready
          </h2>
          <p className="text-sm text-text-secondary mb-2">
            6 combatants placed on a 12x12 tactical grid.
          </p>
          <p className="text-sm text-text-secondary mb-6">
            5 AI agents powered by DeepSeek R1 are waiting. They don&apos;t know you&apos;re human.
          </p>
          <div className="grid grid-cols-5 gap-2 mb-8">
            {['viper', 'blaze', 'ghost', 'oracle', 'rook'].map(agent => (
              <div key={agent} className="p-2 rounded border text-center"
                style={{ borderColor: AGENT_COLORS[agent] + '60', background: AGENT_COLORS[agent] + '10' }}>
                <div className="w-5 h-5 rounded-full mx-auto mb-1" style={{ backgroundColor: AGENT_COLORS[agent], boxShadow: `0 0 8px ${AGENT_COLORS[agent]}60` }} />
                <span className="text-[10px] font-bold uppercase" style={{ color: AGENT_COLORS[agent] }}>
                  {agent}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={() => startGameAction()}
            disabled={state.isProcessing}
            className="px-12 py-4 bg-accent text-black font-bold text-lg uppercase tracking-wider rounded btn-glow transition-all hover:scale-105 disabled:opacity-50"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            {state.isProcessing ? 'INITIALIZING...' : 'START GAME'}
          </button>
        </div>
      </div>
    );
  }

  // ── Active Game ───────────────────────────────────────────
  return (
    <div className="h-screen w-screen overflow-hidden relative bg-[#04060c]">
      {/* Full-screen 3D arena */}
      <div className="absolute inset-0">
        <GameMap3D
          playerView={playerView}
          isProcessing={state.isProcessing}
          itemTargeting={!!itemTargeting}
          onMoveAction={handleMoveAction}
          onAttackAction={handleAttackAction}
          onItemTarget={handleItemTarget}
        />
      </div>

      {/* Overlay UI */}
      <TopBar />
      <EventTicker />
      <HUDOverlay />

      {/* Bottom action bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <ActionControls
          onItemTargetMode={setItemTargeting}
          itemTargeting={itemTargeting}
          onCancelItemTarget={() => setItemTargeting(null)}
        />
      </div>

      {/* Victory screen */}
      <VictoryScreen />

      {/* Error display */}
      {state.error && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-danger/20 border border-danger text-danger px-4 py-2 rounded text-sm slide-up backdrop-blur-sm">
          {state.error}
          <button
            onClick={() => dispatch({ type: 'SET_ERROR', error: null })}
            className="ml-3 text-danger/60 hover:text-danger"
          >
            ✕
          </button>
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
