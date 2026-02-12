import { NextRequest, NextResponse } from 'next/server';
import { getGameBySession, getPlayerView } from '@/engine/GameState';

export async function GET(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  const sessionToken = request.headers.get('x-session-token');
  if (!sessionToken) {
    return NextResponse.json(
      { error: true, code: 'UNAUTHORIZED', message: 'Session token required.' },
      { status: 401 }
    );
  }

  const result = getGameBySession(sessionToken);
  if (!result) {
    return NextResponse.json(
      { error: true, code: 'GAME_NOT_FOUND', message: 'Game not found.' },
      { status: 404 }
    );
  }

  const view = getPlayerView(result.game.gameId, result.playerId);
  if (!view) {
    return NextResponse.json(
      { error: true, code: 'GAME_NOT_FOUND', message: 'Game not found.' },
      { status: 404 }
    );
  }

  return NextResponse.json(view);
}
