'use client';

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import {
  PlayerView, TurnResult, PlayerAction, ActionType, Direction,
  WeaponType, ItemType, GameMessage, GamePhase, Position, AgentThought,
} from '@/types/game';

interface GameUIState {
  gameId: string | null;
  sessionToken: string | null;
  playerId: string | null;
  playerView: PlayerView | null;
  turnResults: TurnResult[];
  currentAgentThoughts: Record<string, AgentThought>;
  selectedAction: ActionType | null;
  targetTile: Position | null;
  pendingMessages: GameMessage[];
  isProcessing: boolean;
  error: string | null;
  showAgentThoughts: boolean;
  showMessages: boolean;
  selectedAgent: string | null;
}

type GameAction =
  | { type: 'SET_GAME'; gameId: string; sessionToken: string; playerId: string }
  | { type: 'UPDATE_VIEW'; view: PlayerView }
  | { type: 'ADD_TURN_RESULT'; result: TurnResult }
  | { type: 'SET_AGENT_THOUGHTS'; thoughts: Record<string, AgentThought> }
  | { type: 'SELECT_ACTION'; action: ActionType | null }
  | { type: 'SET_TARGET'; target: Position | null }
  | { type: 'ADD_MESSAGE'; message: GameMessage }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'SET_PROCESSING'; processing: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'TOGGLE_THOUGHTS' }
  | { type: 'TOGGLE_MESSAGES' }
  | { type: 'SELECT_AGENT'; agentId: string | null };

const initialState: GameUIState = {
  gameId: null,
  sessionToken: null,
  playerId: null,
  playerView: null,
  turnResults: [],
  currentAgentThoughts: {},
  selectedAction: null,
  targetTile: null,
  pendingMessages: [],
  isProcessing: false,
  error: null,
  showAgentThoughts: false,
  showMessages: false,
  selectedAgent: null,
};

function gameReducer(state: GameUIState, action: GameAction): GameUIState {
  switch (action.type) {
    case 'SET_GAME':
      return { ...state, gameId: action.gameId, sessionToken: action.sessionToken, playerId: action.playerId };
    case 'UPDATE_VIEW':
      return { ...state, playerView: action.view };
    case 'ADD_TURN_RESULT':
      return { ...state, turnResults: [...state.turnResults, action.result] };
    case 'SET_AGENT_THOUGHTS':
      return { ...state, currentAgentThoughts: action.thoughts };
    case 'SELECT_ACTION':
      return { ...state, selectedAction: action.action, targetTile: null };
    case 'SET_TARGET':
      return { ...state, targetTile: action.target };
    case 'ADD_MESSAGE':
      return { ...state, pendingMessages: [...state.pendingMessages, action.message] };
    case 'CLEAR_MESSAGES':
      return { ...state, pendingMessages: [] };
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.processing };
    case 'SET_ERROR':
      return { ...state, error: action.error };
    case 'TOGGLE_THOUGHTS':
      return { ...state, showAgentThoughts: !state.showAgentThoughts };
    case 'TOGGLE_MESSAGES':
      return { ...state, showMessages: !state.showMessages };
    case 'SELECT_AGENT':
      return { ...state, selectedAgent: action.agentId };
    default:
      return state;
  }
}

interface GameContextValue {
  state: GameUIState;
  dispatch: React.Dispatch<GameAction>;
  createGame: (playerName: string, difficulty: string) => Promise<void>;
  startGame: () => Promise<void>;
  submitAction: (action: ActionType, params: Record<string, unknown>, messages?: GameMessage[]) => Promise<void>;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const createGame = useCallback(async (playerName: string, difficulty: string) => {
    try {
      dispatch({ type: 'SET_PROCESSING', processing: true });
      dispatch({ type: 'SET_ERROR', error: null });

      const res = await fetch('/api/game/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName, difficulty }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.message);

      dispatch({ type: 'SET_GAME', gameId: data.gameId, sessionToken: data.sessionToken, playerId: data.playerId });
      dispatch({ type: 'UPDATE_VIEW', view: data.state });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: (err as Error).message });
    } finally {
      dispatch({ type: 'SET_PROCESSING', processing: false });
    }
  }, []);

  const startGame = useCallback(async () => {
    if (!state.gameId || !state.sessionToken) return;
    try {
      dispatch({ type: 'SET_PROCESSING', processing: true });
      const res = await fetch(`/api/game/${state.gameId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken: state.sessionToken }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.message);
      dispatch({ type: 'UPDATE_VIEW', view: data.state });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: (err as Error).message });
    } finally {
      dispatch({ type: 'SET_PROCESSING', processing: false });
    }
  }, [state.gameId, state.sessionToken]);

  const submitActionFn = useCallback(async (
    action: ActionType,
    params: Record<string, unknown>,
    messages?: GameMessage[]
  ) => {
    if (!state.gameId || !state.sessionToken) return;
    try {
      dispatch({ type: 'SET_PROCESSING', processing: true });
      dispatch({ type: 'SET_ERROR', error: null });

      const res = await fetch(`/api/game/${state.gameId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionToken: state.sessionToken,
          action,
          params,
          messages: messages || state.pendingMessages,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.message);

      dispatch({ type: 'ADD_TURN_RESULT', result: data.turnResult });
      dispatch({ type: 'SET_AGENT_THOUGHTS', thoughts: data.turnResult.agentThoughts });
      dispatch({ type: 'UPDATE_VIEW', view: data.state });
      dispatch({ type: 'CLEAR_MESSAGES' });
      dispatch({ type: 'SELECT_ACTION', action: null });
      dispatch({ type: 'SET_TARGET', target: null });

      // Auto-show agent thoughts after turn resolves
      if (Object.keys(data.turnResult.agentThoughts).length > 0) {
        if (!state.showAgentThoughts) {
          dispatch({ type: 'TOGGLE_THOUGHTS' });
        }
      }
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: (err as Error).message });
    } finally {
      dispatch({ type: 'SET_PROCESSING', processing: false });
    }
  }, [state.gameId, state.sessionToken, state.pendingMessages, state.showAgentThoughts]);

  return (
    <GameContext.Provider value={{ state, dispatch, createGame, startGame, submitAction: submitActionFn }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}
