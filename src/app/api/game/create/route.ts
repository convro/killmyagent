import { NextRequest, NextResponse } from 'next/server';
import { createGame, getPlayerView } from '@/engine/GameState';
import { CreateGameRequest } from '@/types/game';

export async function POST(request: NextRequest) {
  try {
    const body: CreateGameRequest = await request.json();
    const { playerName, difficulty, mapSeed } = body;

    if (!playerName || playerName.length > 16) {
      return NextResponse.json(
        { error: true, code: 'INVALID_NAME', message: 'Player name is required (max 16 chars).' },
        { status: 400 }
      );
    }

    const { gameId, sessionToken, playerId, state } = createGame(
      playerName,
      difficulty || 'normal',
      mapSeed
    );

    const view = getPlayerView(gameId, playerId);

    return NextResponse.json({
      gameId,
      sessionToken,
      playerId,
      state: view,
    });
  } catch (error) {
    console.error('Error creating game:', error);
    return NextResponse.json(
      { error: true, code: 'INTERNAL_ERROR', message: 'Failed to create game.' },
      { status: 500 }
    );
  }
}
