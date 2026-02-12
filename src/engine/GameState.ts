import { v4 as uuidv4 } from 'uuid';
import {
  GameState, Player, PlayerAction, TurnResult, PlayerView,
  Difficulty, AgentCodename, GamePhase,
} from '@/types/game';
import { generateMap } from './MapGenerator';
import { resolveActions } from './ActionResolver';
import { getVisibleTiles, getVisiblePlayers } from './FogOfWar';
import { initDangerZone } from './DangerZone';
import { STARTING_HP, MAX_HP } from '@/utils/constants';

const AGENT_CONFIGS: Array<{ codename: AgentCodename; name: string }> = [
  { codename: 'viper', name: 'VIPER' },
  { codename: 'blaze', name: 'BLAZE' },
  { codename: 'ghost', name: 'GHOST' },
  { codename: 'oracle', name: 'ORACLE' },
  { codename: 'rook', name: 'ROOK' },
];

// In-memory game store — use globalThis to survive Next.js dev hot-reloads
const globalAny = globalThis as Record<string, unknown>;
if (!globalAny.__kma_games) {
  globalAny.__kma_games = new Map<string, GameState>();
}
if (!globalAny.__kma_sessions) {
  globalAny.__kma_sessions = new Map<string, { gameId: string; playerId: string }>();
}
const games = globalAny.__kma_games as Map<string, GameState>;
const sessionToGame = globalAny.__kma_sessions as Map<string, { gameId: string; playerId: string }>;

function createPlayer(id: string, name: string, type: 'human' | 'agent', codename?: AgentCodename): Player {
  return {
    id,
    name,
    type,
    codename,
    hp: STARTING_HP,
    maxHp: MAX_HP,
    position: { x: 0, y: 0 },
    inventory: ['knife'],
    equippedWeapon: 'knife',
    statusEffects: [],
    alive: true,
    kills: 0,
    damageDealt: 0,
    damageTaken: 0,
    specialUsed: false,
    movedLastTurn: false,
  };
}

export function createGame(playerName: string, difficulty: Difficulty, mapSeed?: number): { gameId: string; sessionToken: string; playerId: string; state: GameState } {
  const gameId = uuidv4();
  const sessionToken = uuidv4();
  const { tiles, spawnPoints } = generateMap(mapSeed);

  const humanPlayer = createPlayer('player_0', playerName, 'human');
  humanPlayer.position = spawnPoints[0];

  const players: Record<string, Player> = {
    player_0: humanPlayer,
  };

  const playerOrder = ['player_0'];

  for (let i = 0; i < AGENT_CONFIGS.length; i++) {
    const config = AGENT_CONFIGS[i];
    const playerId = `player_${i + 1}`;
    const agent = createPlayer(playerId, config.name, 'agent', config.codename);
    agent.position = spawnPoints[i + 1] || spawnPoints[i % spawnPoints.length];
    players[playerId] = agent;
    playerOrder.push(playerId);
  }

  const state: GameState = {
    gameId,
    turn: 0,
    phase: 'lobby',
    difficulty,
    map: tiles,
    mapWidth: 12,
    mapHeight: 12,
    players,
    playerOrder,
    dangerZone: initDangerZone(),
    messages: [],
    killFeed: [],
    turnHistory: [],
    pendingActions: {},
  };

  games.set(gameId, state);
  sessionToGame.set(sessionToken, { gameId, playerId: 'player_0' });

  return { gameId, sessionToken, playerId: 'player_0', state };
}

export function getGame(gameId: string): GameState | undefined {
  return games.get(gameId);
}

export function getGameBySession(sessionToken: string): { game: GameState; playerId: string } | undefined {
  const info = sessionToGame.get(sessionToken);
  if (!info) return undefined;
  const game = games.get(info.gameId);
  if (!game) return undefined;
  return { game, playerId: info.playerId };
}

export function startGame(gameId: string): GameState | undefined {
  const state = games.get(gameId);
  if (!state) return undefined;
  state.turn = 1;
  state.phase = 'action';
  return state;
}

export function submitAction(gameId: string, playerId: string, action: PlayerAction): boolean {
  const state = games.get(gameId);
  if (!state || state.phase !== 'action') return false;

  const player = state.players[playerId];
  if (!player || !player.alive) return false;

  state.pendingActions[playerId] = action;
  return true;
}

export function allActionsSubmitted(gameId: string): boolean {
  const state = games.get(gameId);
  if (!state) return false;

  const alivePlayers = Object.values(state.players).filter(p => p.alive);
  return alivePlayers.every(p => state.pendingActions[p.id] !== undefined);
}

export function resolveTurn(gameId: string): TurnResult | undefined {
  const state = games.get(gameId);
  if (!state) return undefined;

  state.phase = 'resolving';

  const { events, eliminatedThisTurn } = resolveActions(state);

  // Build narration summary
  const narration = events
    .filter(e => e.type === 'attack' || e.type === 'elimination' || e.type === 'special_ability')
    .map(e => e.narration)
    .join(' ');

  const turnResult: TurnResult = {
    turn: state.turn,
    events,
    agentThoughts: {},
    eliminatedThisTurn,
    narrationSummary: narration || `Turn ${state.turn} passes quietly. The tension builds.`,
  };

  state.turnHistory.push(turnResult);
  state.pendingActions = {};

  // Check win condition
  const alive = Object.values(state.players).filter(p => p.alive);
  if (alive.length <= 1) {
    state.phase = 'finished';
    state.winner = alive[0]?.id;
  } else {
    state.turn++;
    state.phase = 'action';
  }

  return turnResult;
}

export function getPlayerView(gameId: string, playerId: string): PlayerView | undefined {
  const state = games.get(gameId);
  if (!state) return undefined;

  const player = state.players[playerId];
  if (!player) return undefined;

  const visibleTiles = getVisibleTiles(player, state.map);
  const visiblePlayersList = getVisiblePlayers(player, state.players, state.map);

  // Filter messages — only those addressed to player or 'all'
  const playerMessages = state.messages.filter(m =>
    m.to === 'all' || m.to === playerId || m.from === playerId
  );

  return {
    gameId: state.gameId,
    turn: state.turn,
    phase: state.phase,
    yourPlayer: player,
    visibleTiles,
    visiblePlayers: visiblePlayersList.map(p => ({
      id: p.id,
      name: p.name,
      codename: p.codename,
      position: p.position,
      hp: p.hp,
      equippedWeapon: p.equippedWeapon,
    })),
    dangerZone: state.dangerZone,
    messages: playerMessages,
    killFeed: state.killFeed,
    alivePlayers: Object.values(state.players).filter(p => p.alive).map(p => p.id),
    eliminatedPlayers: Object.values(state.players).filter(p => !p.alive).map(p => p.id),
    winner: state.winner,
  };
}

export function getAllGames(): Map<string, GameState> {
  return games;
}
