import { Tile, TerrainType, LootableType, Position } from '@/types/game';
import { MAP_WIDTH, MAP_HEIGHT, TERRAIN_DISTRIBUTION, MAP_ITEM_DISTRIBUTION } from '@/utils/constants';

// Simple seeded PRNG
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 16807 + 0) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  shuffle<T>(arr: T[]): T[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

export function generateMap(seed?: number): { tiles: Tile[][]; spawnPoints: Position[] } {
  const rng = new SeededRandom(seed ?? Date.now());
  const tiles: Tile[][] = [];

  // Step 1: Generate terrain
  const terrainPool: TerrainType[] = [];
  const totalTiles = MAP_WIDTH * MAP_HEIGHT;

  for (const [terrain, pct] of Object.entries(TERRAIN_DISTRIBUTION)) {
    const count = Math.round(totalTiles * pct);
    for (let i = 0; i < count; i++) {
      terrainPool.push(terrain as TerrainType);
    }
  }

  // Pad to exact total
  while (terrainPool.length < totalTiles) {
    terrainPool.push('open');
  }

  const shuffled = rng.shuffle(terrainPool);

  for (let y = 0; y < MAP_HEIGHT; y++) {
    tiles[y] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      tiles[y][x] = {
        terrain: shuffled[y * MAP_WIDTH + x],
        items: [],
      };
    }
  }

  // Step 2: Ensure edges are not walls (for spawn points)
  for (let x = 0; x < MAP_WIDTH; x++) {
    if (tiles[0][x].terrain === 'wall') tiles[0][x].terrain = 'open';
    if (tiles[MAP_HEIGHT - 1][x].terrain === 'wall') tiles[MAP_HEIGHT - 1][x].terrain = 'open';
  }
  for (let y = 0; y < MAP_HEIGHT; y++) {
    if (tiles[y][0].terrain === 'wall') tiles[y][0].terrain = 'open';
    if (tiles[y][MAP_WIDTH - 1].terrain === 'wall') tiles[y][MAP_WIDTH - 1].terrain = 'open';
  }

  // Step 3: Place items (weighted toward center)
  const placeable: Position[] = [];
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      if (tiles[y][x].terrain !== 'wall') {
        placeable.push({ x, y });
      }
    }
  }

  // Weight toward center
  const center = { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 };
  const weighted = placeable.sort((a, b) => {
    const distA = Math.abs(a.x - center.x) + Math.abs(a.y - center.y);
    const distB = Math.abs(b.x - center.x) + Math.abs(b.y - center.y);
    return distA - distB + (rng.next() - 0.5) * 4;
  });

  let itemIdx = 0;
  for (const [itemType, count] of Object.entries(MAP_ITEM_DISTRIBUTION)) {
    for (let i = 0; i < count; i++) {
      if (itemIdx < weighted.length) {
        const pos = weighted[itemIdx];
        tiles[pos.y][pos.x].items.push(itemType as LootableType);
        itemIdx++;
      }
    }
  }

  // Step 4: Generate spawn points (6 positions on map edges, min 4 apart)
  const edgePositions: Position[] = [];
  for (let x = 0; x < MAP_WIDTH; x++) {
    if (tiles[0][x].terrain !== 'wall') edgePositions.push({ x, y: 0 });
    if (tiles[MAP_HEIGHT - 1][x].terrain !== 'wall') edgePositions.push({ x, y: MAP_HEIGHT - 1 });
  }
  for (let y = 1; y < MAP_HEIGHT - 1; y++) {
    if (tiles[y][0].terrain !== 'wall') edgePositions.push({ x: 0, y });
    if (tiles[y][MAP_WIDTH - 1].terrain !== 'wall') edgePositions.push({ x: MAP_WIDTH - 1, y });
  }

  const shuffledEdges = rng.shuffle(edgePositions);
  const spawnPoints: Position[] = [];

  for (const pos of shuffledEdges) {
    if (spawnPoints.length >= 6) break;
    const tooClose = spawnPoints.some(sp =>
      Math.abs(sp.x - pos.x) + Math.abs(sp.y - pos.y) < 4
    );
    if (!tooClose) {
      spawnPoints.push(pos);
      // Remove items from spawn tiles
      tiles[pos.y][pos.x].items = [];
    }
  }

  // If we couldn't get 6 with min distance 4, relax constraint
  if (spawnPoints.length < 6) {
    for (const pos of shuffledEdges) {
      if (spawnPoints.length >= 6) break;
      if (!spawnPoints.some(sp => sp.x === pos.x && sp.y === pos.y)) {
        spawnPoints.push(pos);
        tiles[pos.y][pos.x].items = [];
      }
    }
  }

  return { tiles, spawnPoints };
}
