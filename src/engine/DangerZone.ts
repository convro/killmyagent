import { DangerZoneState, Player } from '@/types/game';
import {
  MAP_WIDTH, MAP_HEIGHT,
  DANGER_ZONE_START_TURN, DANGER_ZONE_SHRINK_INTERVAL, DANGER_ZONE_DAMAGE,
} from '@/utils/constants';

export function initDangerZone(): DangerZoneState {
  return {
    safeArea: { minX: 0, minY: 0, maxX: MAP_WIDTH - 1, maxY: MAP_HEIGHT - 1 },
    nextShrinkIn: DANGER_ZONE_START_TURN,
    active: false,
  };
}

export function updateDangerZone(current: DangerZoneState, turn: number): DangerZoneState {
  if (turn < DANGER_ZONE_START_TURN) {
    return { ...current, nextShrinkIn: DANGER_ZONE_START_TURN - turn };
  }

  const turnsSinceStart = turn - DANGER_ZONE_START_TURN;
  const shrinkCount = Math.floor(turnsSinceStart / DANGER_ZONE_SHRINK_INTERVAL) + 1;
  const nextShrinkIn = DANGER_ZONE_SHRINK_INTERVAL - (turnsSinceStart % DANGER_ZONE_SHRINK_INTERVAL);

  const minSize = 2; // minimum 4x4 area (indices 2 apart in each direction from center)
  const centerX = Math.floor(MAP_WIDTH / 2);
  const centerY = Math.floor(MAP_HEIGHT / 2);

  const maxShrink = Math.floor(MAP_WIDTH / 2) - minSize;
  const actualShrink = Math.min(shrinkCount, maxShrink);

  return {
    safeArea: {
      minX: Math.min(actualShrink, centerX - minSize),
      minY: Math.min(actualShrink, centerY - minSize),
      maxX: Math.max(MAP_WIDTH - 1 - actualShrink, centerX + minSize),
      maxY: Math.max(MAP_HEIGHT - 1 - actualShrink, centerY + minSize),
    },
    nextShrinkIn,
    active: true,
  };
}

export function isInSafeZone(x: number, y: number, zone: DangerZoneState): boolean {
  return x >= zone.safeArea.minX && x <= zone.safeArea.maxX &&
         y >= zone.safeArea.minY && y <= zone.safeArea.maxY;
}

export function applyDangerZoneDamage(
  players: Record<string, Player>,
  zone: DangerZoneState
): Array<{ playerId: string; damage: number }> {
  const damaged: Array<{ playerId: string; damage: number }> = [];

  for (const player of Object.values(players)) {
    if (!player.alive) continue;
    if (!isInSafeZone(player.position.x, player.position.y, zone)) {
      player.hp = Math.max(0, player.hp - DANGER_ZONE_DAMAGE);
      damaged.push({ playerId: player.id, damage: DANGER_ZONE_DAMAGE });
    }
  }

  return damaged;
}
