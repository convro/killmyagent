'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Difficulty } from '@/types/game';
import { AGENT_COLORS } from '@/utils/constants';

const AGENTS = [
  { codename: 'VIPER', color: AGENT_COLORS.viper, personality: 'Cold, calculating sociopath', style: 'Stealth & ambush', passive: 'Shadow Step', special: 'Mark Target' },
  { codename: 'BLAZE', color: AGENT_COLORS.blaze, personality: 'Aggressive, impulsive hothead', style: 'Rush & overwhelm', passive: 'Adrenaline Rush', special: 'War Cry' },
  { codename: 'GHOST', color: AGENT_COLORS.ghost, personality: 'Paranoid, trust-nobody survivalist', style: 'Evasion & traps', passive: 'Trap Expert', special: 'Dead Signal' },
  { codename: 'ORACLE', color: AGENT_COLORS.oracle, personality: 'Manipulative political mastermind', style: 'Alliances & betrayal', passive: 'Silver Tongue', special: 'False Flag' },
  { codename: 'ROOK', color: AGENT_COLORS.rook, personality: 'Disciplined military tactician', style: 'Positioning & control', passive: 'Fortified Position', special: 'Overwatch' },
];

export default function LandingPage() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [isCreating, setIsCreating] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [error, setError] = useState('');

  const handleStartGame = async () => {
    if (!playerName.trim()) {
      setError('Enter your name, soldier.');
      return;
    }
    setIsCreating(true);
    setError('');

    try {
      const res = await fetch('/api/game/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: playerName.trim(), difficulty }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.message);

      // Store session info
      sessionStorage.setItem('gameId', data.gameId);
      sessionStorage.setItem('sessionToken', data.sessionToken);
      sessionStorage.setItem('playerId', data.playerId);

      router.push('/game');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main className="min-h-screen bg-bg-primary tactical-bg">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
        <div className="text-center max-w-2xl mx-auto">
          {/* Title */}
          <h1
            className="text-4xl md:text-6xl font-extrabold mb-4 glow-pulse tracking-wider"
            style={{ fontFamily: 'Orbitron, sans-serif', color: '#FFFFFF' }}
          >
            KILL MY AGENT
          </h1>

          {/* Tagline */}
          <p className="text-lg md:text-xl text-text-secondary mb-8">
            6 enter. 1 survives. The AI thinks it&apos;s real.
          </p>

          {/* Description */}
          <p className="text-sm text-text-muted mb-12 max-w-lg mx-auto leading-relaxed">
            A battle royale where 5 AI agents powered by DeepSeek R1 fight against you on a tactical grid.
            They reason, strategize, lie, and betray — and you can read every thought in their head while they do it.
          </p>

          {!showSetup ? (
            <button
              onClick={() => setShowSetup(true)}
              className="px-10 py-4 bg-accent text-black font-bold text-lg uppercase tracking-wider rounded btn-glow transition-all hover:scale-105"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              Enter the Arena
            </button>
          ) : (
            /* Setup Card */
            <div className="bg-bg-secondary border border-bg-tertiary rounded-xl p-6 max-w-md mx-auto slide-up">
              <h2
                className="text-lg font-bold mb-6 uppercase tracking-wider"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                Prepare for Battle
              </h2>

              {/* Name input */}
              <div className="mb-4">
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-2">Your Name</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  maxLength={16}
                  placeholder="Enter your callsign..."
                  className="w-full bg-bg-tertiary border border-bg-tertiary focus:border-accent text-text-primary px-4 py-3 rounded outline-none text-sm transition-colors"
                  autoFocus
                />
              </div>

              {/* Difficulty */}
              <div className="mb-6">
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-2">Difficulty</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: 'normal', label: 'NORMAL', desc: 'Creative & unpredictable' },
                    { value: 'hard', label: 'HARD', desc: 'Strategic & focused' },
                    { value: 'nightmare', label: 'NIGHTMARE', desc: 'Pure calculation' },
                  ] as const).map(d => (
                    <button
                      key={d.value}
                      onClick={() => setDifficulty(d.value)}
                      className={`px-3 py-3 rounded border text-xs font-bold uppercase transition-all ${
                        difficulty === d.value
                          ? 'bg-accent/20 border-accent text-accent'
                          : 'bg-bg-tertiary border-bg-tertiary text-text-secondary hover:border-accent/30'
                      }`}
                    >
                      {d.label}
                      <span className="block text-[10px] font-normal text-text-muted mt-1">{d.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-danger text-xs mb-4">{error}</p>
              )}

              <button
                onClick={handleStartGame}
                disabled={isCreating}
                className="w-full px-6 py-4 bg-accent text-black font-bold uppercase tracking-wider rounded btn-glow transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                {isCreating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    CREATING GAME...
                  </span>
                ) : (
                  'START GAME'
                )}
              </button>
            </div>
          )}
        </div>

        {/* How it works */}
        {!showSetup && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16 max-w-3xl mx-auto px-4">
            {[
              { icon: '🤖', title: '5 AI Agents', desc: 'Powered by DeepSeek R1 reasoning model. They plan, deceive, and fight.' },
              { icon: '🎮', title: '1 Human', desc: 'That\'s you. With one unfair advantage — you can read their minds.' },
              { icon: '🧠', title: 'Read Their Minds', desc: 'Watch their chain-of-thought reasoning in real-time as they plot your death.' },
            ].map((card, i) => (
              <div
                key={i}
                className="bg-bg-secondary border border-bg-tertiary rounded-lg p-5 text-center fade-in"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <span className="text-3xl mb-3 block">{card.icon}</span>
                <h3 className="text-sm font-bold uppercase mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  {card.title}
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* Agent Roster */}
        {!showSetup && (
          <div className="mt-16 max-w-4xl mx-auto px-4 w-full">
            <h2
              className="text-center text-sm font-bold uppercase tracking-widest text-text-muted mb-6"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              The Agents
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {AGENTS.map((agent, i) => (
                <div
                  key={agent.codename}
                  className="bg-bg-secondary border rounded-lg p-4 fade-in"
                  style={{
                    borderColor: agent.color + '40',
                    animationDelay: `${i * 100}ms`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: agent.color }} />
                    <span className="text-sm font-bold" style={{ color: agent.color, fontFamily: 'Orbitron, sans-serif' }}>
                      {agent.codename}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mb-1">{agent.personality}</p>
                  <p className="text-[10px] text-text-muted">{agent.style}</p>
                  <div className="mt-2 flex flex-col gap-0.5">
                    <span className="text-[10px] text-text-muted">⚡ {agent.passive}</span>
                    <span className="text-[10px] text-text-muted">★ {agent.special}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-text-muted text-xs mt-16">
          An AI experiment. They compute. You decide.
        </p>
      </section>
    </main>
  );
}
