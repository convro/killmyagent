import { NextRequest, NextResponse } from 'next/server';
import {
  getGameBySession, submitAction, allActionsSubmitted,
  resolveTurn, getPlayerView, getGame,
} from '@/engine/GameState';
import { processAllAgents } from '@/ai/AgentManager';
import { PlayerAction, SubmitActionRequest } from '@/types/game';

export async function POST(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    const body: SubmitActionRequest = await request.json();
    const { sessionToken } = body;

    const result = getGameBySession(sessionToken);
    if (!result) {
      return NextResponse.json(
        { error: true, code: 'UNAUTHORIZED', message: 'Invalid session.' },
        { status: 401 }
      );
    }

    const { game, playerId } = result;

    if (game.phase !== 'action') {
      return NextResponse.json(
        { error: true, code: 'NOT_YOUR_TURN', message: 'Not in action phase.' },
        { status: 400 }
      );
    }

    const player = game.players[playerId];
    if (!player || !player.alive) {
      return NextResponse.json(
        { error: true, code: 'PLAYER_DEAD', message: 'You are eliminated.' },
        { status: 400 }
      );
    }

    // Build player action
    const action: PlayerAction = {
      playerId,
      action: body.action,
      direction: body.params?.direction,
      distance: body.params?.distance,
      targetX: body.params?.targetX,
      targetY: body.params?.targetY,
      weapon: body.params?.weapon,
      item: body.params?.item,
      targetId: body.params?.targetId,
      tiles: body.params?.tiles,
      messages: body.messages,
    };

    // Submit human action
    submitAction(game.gameId, playerId, action);

    // Process all AI agents
    const agentResults = await processAllAgents(game);

    // Submit agent actions
    for (const agentResult of agentResults) {
      submitAction(game.gameId, agentResult.playerId, agentResult.action);
    }

    // Resolve the turn
    const turnResult = resolveTurn(game.gameId);
    if (!turnResult) {
      return NextResponse.json(
        { error: true, code: 'INTERNAL_ERROR', message: 'Failed to resolve turn.' },
        { status: 500 }
      );
    }

    // Add agent thoughts to turn result
    for (const agentResult of agentResults) {
      turnResult.agentThoughts[agentResult.playerId] = {
        playerId: agentResult.playerId,
        codename: agentResult.codename,
        reasoningChain: agentResult.reasoning,
        actionTaken: JSON.stringify(agentResult.action),
      };
    }

    // Get updated player view
    const view = getPlayerView(game.gameId, playerId);

    return NextResponse.json({
      turnResult,
      state: view,
    });
  } catch (error) {
    console.error('Error processing action:', error);
    return NextResponse.json(
      { error: true, code: 'INTERNAL_ERROR', message: 'Failed to process action.' },
      { status: 500 }
    );
  }
}
