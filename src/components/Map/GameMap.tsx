'use client';

import React, { useMemo } from 'react';
import { useGame } from '../GameContext';
import { TerrainType, Position } from '@/types/game';
import { MAP_WIDTH, MAP_HEIGHT } from '@/utils/constants';
import { AGENT_COLORS } from '@/utils/constants';

const TERRAIN_COLORS: Record<TerrainType, string> = {
  open: '#0A1628',
  wall: '#1A1A2E',
  water: '#0A2A4A',
  building: '#1A2840',
  bush: '#0A2A1A',
};

const TERRAIN_BORDERS: Record<TerrainType, string> = {
  open: '#151F30',
  wall: '#2A2A3E',
  water: '#1A3A5A',
  building: '#2A3850',
  bush: '#1A3A2A',
};

function getAgentColor(codename?: string): string {
  if (!codename) return AGENT_COLORS.human;
  return AGENT_COLORS[codename] || AGENT_COLORS.human;
}

export default function GameMap() {
  const { state, dispatch } = useGame();
  const { playerView, selectedAction, targetTile } = state;

  const visibleMap = useMemo(() => {
    if (!playerView) return null;

    const tileMap: Record<string, { terrain: TerrainType; items: string[]; visible: boolean }> = {};
    for (const vt of playerView.visibleTiles) {
      tileMap[`${vt.x},${vt.y}`] = { terrain: vt.tile.terrain, items: vt.tile.items, visible: true };
    }
    return tileMap;
  }, [playerView]);

  if (!playerView || !visibleMap) {
    return <div className="flex items-center justify-center h-full text-text-muted">Loading map...</div>;
  }

  const { yourPlayer, visiblePlayers, dangerZone } = playerView;

  const handleTileClick = (x: number, y: number) => {
    if (selectedAction === 'attack' || selectedAction === 'use_item') {
      dispatch({ type: 'SET_TARGET', target: { x, y } });
    }
  };

  const isInSafeZone = (x: number, y: number) => {
    return x >= dangerZone.safeArea.minX && x <= dangerZone.safeArea.maxX &&
           y >= dangerZone.safeArea.minY && y <= dangerZone.safeArea.maxY;
  };

  const tileSize = typeof window !== 'undefined'
    ? Math.min(Math.floor((window.innerWidth - 32) / MAP_WIDTH), 48)
    : 40;

  return (
    <div className="relative overflow-auto">
      <div
        className="grid mx-auto"
        style={{
          gridTemplateColumns: `repeat(${MAP_WIDTH}, ${tileSize}px)`,
          gridTemplateRows: `repeat(${MAP_HEIGHT}, ${tileSize}px)`,
          gap: '1px',
          width: MAP_WIDTH * (tileSize + 1) - 1,
        }}
      >
        {Array.from({ length: MAP_HEIGHT }).map((_, y) =>
          Array.from({ length: MAP_WIDTH }).map((_, x) => {
            const key = `${x},${y}`;
            const tileData = visibleMap[key];
            const isVisible = !!tileData?.visible;
            const terrain = tileData?.terrain || 'open';
            const inDanger = !isInSafeZone(x, y) && dangerZone.active;
            const isPlayer = yourPlayer.position.x === x && yourPlayer.position.y === y;
            const visibleEnemy = visiblePlayers.find(p => p.position.x === x && p.position.y === y);
            const hasItems = tileData?.items && tileData.items.length > 0;
            const isTarget = targetTile?.x === x && targetTile?.y === y;

            return (
              <div
                key={key}
                onClick={() => handleTileClick(x, y)}
                className="relative flex items-center justify-center cursor-pointer transition-all duration-100"
                style={{
                  width: tileSize,
                  height: tileSize,
                  backgroundColor: isVisible ? TERRAIN_COLORS[terrain] : '#050A12',
                  borderColor: isTarget ? '#00A3FF' : (isVisible ? TERRAIN_BORDERS[terrain] : '#0A0F1A'),
                  borderWidth: isTarget ? 2 : 1,
                  borderStyle: 'solid',
                  opacity: isVisible ? 1 : 0.3,
                }}
              >
                {/* Danger zone overlay */}
                {inDanger && isVisible && (
                  <div className="absolute inset-0 bg-danger/20 danger-pulse" />
                )}

                {/* Smoke overlay */}
                {tileData?.terrain === 'bush' && isVisible && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-800/50" />
                )}

                {/* Items indicator */}
                {hasItems && isVisible && !isPlayer && !visibleEnemy && (
                  <div className="w-2 h-2 rounded-full bg-success/80 animate-pulse" />
                )}

                {/* Player */}
                {isPlayer && (
                  <div
                    className="rounded-full border-2 flex items-center justify-center font-bold text-xs z-10"
                    style={{
                      width: tileSize * 0.7,
                      height: tileSize * 0.7,
                      backgroundColor: '#00A3FF33',
                      borderColor: '#00A3FF',
                      color: '#fff',
                      fontSize: tileSize < 35 ? 8 : 11,
                    }}
                  >
                    YOU
                  </div>
                )}

                {/* Visible enemies */}
                {visibleEnemy && (
                  <div
                    className="rounded-full border-2 flex items-center justify-center font-bold z-10"
                    style={{
                      width: tileSize * 0.7,
                      height: tileSize * 0.7,
                      backgroundColor: getAgentColor(visibleEnemy.codename) + '33',
                      borderColor: getAgentColor(visibleEnemy.codename),
                      color: '#fff',
                      fontSize: tileSize < 35 ? 7 : 10,
                    }}
                    title={`${visibleEnemy.name} (HP: ${visibleEnemy.hp})`}
                  >
                    {visibleEnemy.name.substring(0, 2)}
                  </div>
                )}

                {/* Wall pattern */}
                {terrain === 'wall' && isVisible && (
                  <div className="absolute inset-0 opacity-30"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 3px, #2A2A3E 3px, #2A2A3E 4px)',
                    }}
                  />
                )}

                {/* Water animation */}
                {terrain === 'water' && isVisible && (
                  <div className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: 'linear-gradient(180deg, transparent 40%, #1A4A6A 50%, transparent 60%)',
                      backgroundSize: '100% 8px',
                    }}
                  />
                )}

                {/* Building roof indicator */}
                {terrain === 'building' && isVisible && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-blue-800/50" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
