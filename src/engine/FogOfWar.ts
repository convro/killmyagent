import { Position, Tile, Player } from '@/types/game';
import { FOG_OF_WAR_RADIUS, SCOUT_RADIUS, MAP_WIDTH, MAP_HEIGHT } from '@/utils/constants';

export function getVisionRadius(player: Player): number {
  if (player.scouting) return SCOUT_RADIUS;
  return FOG_OF_WAR_RADIUS;
}

export function getVisiblePositions(playerPos: Position, radius: number): Position[] {
  const positions: Position[] = [];
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const x = playerPos.x + dx;
      const y = playerPos.y + dy;
      if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
        const dist = Math.abs(dx) + Math.abs(dy);
        if (dist <= radius) {
          positions.push({ x, y });
        }
      }
    }
  }
  return positions;
}

export function isPositionVisible(
  observerPos: Position,
  targetPos: Position,
  radius: number,
  map: Tile[][],
  targetPlayer?: Player
): boolean {
  const dist = Math.abs(observerPos.x - targetPos.x) + Math.abs(observerPos.y - targetPos.y);
  if (dist > radius) return false;

  // Check smoke
  if (map[targetPos.y]?.[targetPos.x]?.smoke_turns && map[targetPos.y][targetPos.x].smoke_turns! > 0) {
    return false;
  }

  // Bush concealment — only visible if adjacent
  if (targetPlayer && map[targetPos.y]?.[targetPos.x]?.terrain === 'bush') {
    if (dist > 1) return false;
  }

  // Dead signal — invisible
  if (targetPlayer?.deadSignalActive) return false;

  return true;
}

export function getVisibleTiles(
  player: Player,
  map: Tile[][]
): Array<{ x: number; y: number; tile: Tile }> {
  const radius = getVisionRadius(player);
  const positions = getVisiblePositions(player.position, radius);
  return positions.map(pos => ({
    x: pos.x,
    y: pos.y,
    tile: map[pos.y][pos.x],
  }));
}

export function getVisiblePlayers(
  observer: Player,
  allPlayers: Record<string, Player>,
  map: Tile[][]
): Player[] {
  const radius = getVisionRadius(observer);
  const visible: Player[] = [];

  for (const player of Object.values(allPlayers)) {
    if (player.id === observer.id) continue;
    if (!player.alive) continue;
    if (player.deadSignalActive) continue;

    // Check if Viper has marked this target
    if (observer.markedTarget === player.id && observer.markedTurnsLeft && observer.markedTurnsLeft > 0) {
      visible.push(player);
      continue;
    }

    if (isPositionVisible(observer.position, player.position, radius, map, player)) {
      visible.push(player);
    }
  }

  return visible;
}
