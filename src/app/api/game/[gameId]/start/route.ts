import { NextRequest, NextResponse } from 'next/server';
import { getGameBySession, startGame, getPlayerView } from '@/engine/GameState';

export async function POST(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  const body = await request.json();
  const sessionToken = body.sessionToken;

  const result = getGameBySession(sessionToken);
  if (!result) {
    return NextResponse.json(
      { error: true, code: 'UNAUTHORIZED', message: 'Invalid session.' },
      { status: 401 }
    );
  }

  const state = startGame(result.game.gameId);
  if (!state) {
    return NextResponse.json(
      { error: true, code: 'GAME_NOT_FOUND', message: 'Could not start game.' },
      { status: 400 }
    );
  }

  const view = getPlayerView(result.game.gameId, result.playerId);

  return NextResponse.json({
    status: 'started',
    turn: state.turn,
    message: 'The zone is sealed. 6 combatants. Last one standing wins. Good luck.',
    state: view,
  });
}
