'use client';

import React, { useMemo, useRef, useCallback } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrthographicCamera, Html, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { TerrainType, Position, PlayerView } from '@/types/game';
import { MAP_WIDTH, MAP_HEIGHT, AGENT_COLORS, DIRECTION_VECTORS } from '@/utils/constants';
import { Direction } from '@/types/game';

// ── 3D Color palette ──────────────────────────────────────────
const TERRAIN_COLOR: Record<TerrainType, string> = {
  open:     '#161c30',
  wall:     '#3a2030',
  water:    '#0a1848',
  building: '#202840',
  bush:     '#183020',
};
const TERRAIN_EMISSIVE: Record<TerrainType, string> = {
  open:     '#080c18',
  wall:     '#1a0810',
  water:    '#041030',
  building: '#101820',
  bush:     '#0c1810',
};
const TERRAIN_HEIGHT: Record<TerrainType, number> = {
  open:     0.08,
  wall:     1.4,
  water:    0.02,
  building: 0.8,
  bush:     0.15,
};

// ── Helper: reachable tile lookup ─────────────────────────────
function getReachableTiles(pos: Position): Map<string, { direction: Direction; distance: number }> {
  const m = new Map<string, { direction: Direction; distance: number }>();
  for (const [dir, vec] of Object.entries(DIRECTION_VECTORS)) {
    for (const dist of [1, 2]) {
      const x = pos.x + vec.dx * dist;
      const y = pos.y + vec.dy * dist;
      if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
        m.set(`${x},${y}`, { direction: dir as Direction, distance: dist });
      }
    }
  }
  return m;
}

// ── Camera controller ─────────────────────────────────────────
function CameraRig({ target }: { target: Position }) {
  const camRef = useRef<THREE.OrthographicCamera>(null);

  useFrame(() => {
    const cam = camRef.current;
    if (!cam) return;
    cam.position.x += (target.x - cam.position.x) * 0.06;
    cam.position.z += (target.y + 7 - cam.position.z) * 0.06;
    cam.lookAt(cam.position.x, 0, cam.position.z - 7);
  });

  return (
    <OrthographicCamera
      ref={camRef}
      makeDefault
      position={[target.x, 14, target.y + 7]}
      zoom={55}
      near={0.1}
      far={100}
    />
  );
}

// ── Single terrain tile ───────────────────────────────────────
function Tile({
  x, y, terrain, visible, inDanger, hasItems, isReachable, isTarget, onClick,
}: {
  x: number; y: number; terrain: TerrainType; visible: boolean;
  inDanger: boolean; hasItems: boolean; isReachable: boolean; isTarget: boolean;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
}) {
  const h = TERRAIN_HEIGHT[terrain];
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <group position={[x, 0, y]}>
      <mesh ref={meshRef} position={[0, h / 2, 0]} onClick={onClick}>
        <boxGeometry args={[0.94, h, 0.94]} />
        <meshStandardMaterial
          color={visible ? TERRAIN_COLOR[terrain] : '#06080e'}
          emissive={visible ? TERRAIN_EMISSIVE[terrain] : '#000000'}
          emissiveIntensity={visible ? 0.3 : 0}
          transparent
          opacity={visible ? 1 : 0.25}
          roughness={0.8}
        />
      </mesh>
      {/* Water shimmer */}
      {terrain === 'water' && visible && (
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.94, 0.94]} />
          <meshStandardMaterial color="#1040a0" emissive="#0830a0" emissiveIntensity={0.4} transparent opacity={0.5} />
        </mesh>
      )}
      {/* Building roof */}
      {terrain === 'building' && visible && (
        <mesh position={[0, h + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.94, 0.94]} />
          <meshStandardMaterial color="#2a3650" emissive="#1a2640" emissiveIntensity={0.2} />
        </mesh>
      )}
      {/* Danger zone overlay */}
      {inDanger && visible && (
        <mesh position={[0, h + 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.94, 0.94]} />
          <meshBasicMaterial color="#ff2020" transparent opacity={0.15} />
        </mesh>
      )}
      {/* Reachable indicator */}
      {isReachable && visible && (
        <mesh position={[0, h + 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.94, 0.94]} />
          <meshBasicMaterial color="#00a3ff" transparent opacity={0.12} />
        </mesh>
      )}
      {/* Target highlight */}
      {isTarget && (
        <mesh position={[0, h + 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.3, 0.45, 32]} />
          <meshBasicMaterial color="#00a3ff" transparent opacity={0.8} />
        </mesh>
      )}
      {/* Item glow */}
      {hasItems && visible && (
        <mesh position={[0, h + 0.15, 0]}>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshStandardMaterial color="#33ff57" emissive="#33ff57" emissiveIntensity={1} />
        </mesh>
      )}
    </group>
  );
}

// ── Player model ──────────────────────────────────────────────
function PlayerModel({
  position, color, name, hp, maxHp, isYou,
}: {
  position: Position; color: string; name: string; hp: number; maxHp: number; isYou: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const hpPct = hp / maxHp;
  const hpColor = hpPct > 0.6 ? '#33ff57' : hpPct > 0.3 ? '#ffb800' : '#ff3333';

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 2.5 + position.x) * 0.06;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.5;
    }
  });

  return (
    <group ref={groupRef} position={[position.x, 0.5, position.y]}>
      {/* Body capsule */}
      <mesh castShadow>
        <capsuleGeometry args={[0.16, 0.35, 8, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isYou ? 0.6 : 0.35}
          roughness={0.3}
          metalness={0.4}
        />
      </mesh>
      {/* Head sphere */}
      <mesh position={[0, 0.32, 0]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      {/* Ground ring */}
      <mesh ref={ringRef} position={[0, -0.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.22, 0.32, 24]} />
        <meshBasicMaterial color={color} transparent opacity={isYou ? 0.8 : 0.4} side={THREE.DoubleSide} />
      </mesh>
      {/* Glow point light for human player */}
      {isYou && <pointLight color={color} intensity={0.8} distance={3} />}
      {/* Label + HP */}
      <Html center position={[0, 0.65, 0]} style={{ pointerEvents: 'none' }} zIndexRange={[10, 0]}>
        <div style={{
          textAlign: 'center',
          whiteSpace: 'nowrap',
          userSelect: 'none',
        }}>
          <div style={{
            color: isYou ? '#00e5ff' : color,
            fontSize: '11px',
            fontWeight: 800,
            fontFamily: 'Orbitron, sans-serif',
            textShadow: '0 0 6px rgba(0,0,0,0.9), 0 0 12px rgba(0,0,0,0.7)',
            letterSpacing: '1px',
          }}>
            {isYou ? '► YOU ◄' : name}
          </div>
          <div style={{
            width: '44px',
            height: '4px',
            background: '#222',
            margin: '3px auto 0',
            borderRadius: '2px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${hpPct * 100}%`,
              height: '100%',
              background: hpColor,
              boxShadow: `0 0 4px ${hpColor}`,
              borderRadius: '2px',
              transition: 'width 0.5s',
            }} />
          </div>
        </div>
      </Html>
    </group>
  );
}

// ── Scene root ────────────────────────────────────────────────
interface SceneProps {
  playerView: PlayerView;
  isProcessing: boolean;
  itemTargeting: boolean;
  onMoveAction: (direction: Direction, distance: number) => void;
  onAttackAction: (targetX: number, targetY: number) => void;
  onItemTarget: (x: number, y: number) => void;
}

function Scene({ playerView, isProcessing, itemTargeting, onMoveAction, onAttackAction, onItemTarget }: SceneProps) {
  const { yourPlayer, visibleTiles, visiblePlayers, dangerZone } = playerView;

  const tileMap = useMemo(() => {
    const m: Record<string, { terrain: TerrainType; items: string[]; visible: boolean }> = {};
    for (const vt of visibleTiles) {
      m[`${vt.x},${vt.y}`] = { terrain: vt.tile.terrain, items: vt.tile.items, visible: true };
    }
    return m;
  }, [visibleTiles]);

  const reachable = useMemo(() => getReachableTiles(yourPlayer.position), [yourPlayer.position]);

  const enemyMap = useMemo(() => {
    const m: Record<string, (typeof visiblePlayers)[0]> = {};
    for (const p of visiblePlayers) {
      m[`${p.position.x},${p.position.y}`] = p;
    }
    return m;
  }, [visiblePlayers]);

  const handleTileClick = useCallback((x: number, y: number) => {
    if (isProcessing) return;
    const key = `${x},${y}`;

    // Item targeting mode
    if (itemTargeting) {
      onItemTarget(x, y);
      return;
    }

    // Click on enemy → attack
    const enemy = enemyMap[key];
    if (enemy) {
      onAttackAction(x, y);
      return;
    }

    // Click on reachable tile → move
    const moveInfo = reachable.get(key);
    if (moveInfo) {
      onMoveAction(moveInfo.direction, moveInfo.distance);
      return;
    }
  }, [isProcessing, itemTargeting, enemyMap, reachable, onMoveAction, onAttackAction, onItemTarget]);

  const isInSafeZone = (x: number, y: number) =>
    x >= dangerZone.safeArea.minX && x <= dangerZone.safeArea.maxX &&
    y >= dangerZone.safeArea.minY && y <= dangerZone.safeArea.maxY;

  return (
    <>
      <CameraRig target={yourPlayer.position} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[8, 15, 8]} intensity={0.6} color="#b0c0ff" />
      <directionalLight position={[-5, 10, -5]} intensity={0.2} color="#ff8060" />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[MAP_WIDTH / 2 - 0.5, -0.05, MAP_HEIGHT / 2 - 0.5]}>
        <planeGeometry args={[MAP_WIDTH + 4, MAP_HEIGHT + 4]} />
        <meshStandardMaterial color="#04060c" />
      </mesh>

      {/* Grid lines */}
      <Grid
        args={[MAP_WIDTH, MAP_HEIGHT]}
        position={[MAP_WIDTH / 2 - 0.5, 0.01, MAP_HEIGHT / 2 - 0.5]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#0a1428"
        sectionSize={3}
        sectionThickness={1}
        sectionColor="#0c1a35"
        fadeDistance={30}
        infiniteGrid={false}
      />

      {/* Terrain tiles */}
      {Array.from({ length: MAP_HEIGHT }).map((_, y) =>
        Array.from({ length: MAP_WIDTH }).map((_, x) => {
          const key = `${x},${y}`;
          const td = tileMap[key];
          const vis = !!td?.visible;
          const terrain = td?.terrain || 'open';
          const inDanger = dangerZone.active && !isInSafeZone(x, y);
          const hasItems = !!(td?.items && td.items.length > 0);
          const isReach = !isProcessing && reachable.has(key) && vis && !enemyMap[key];

          return (
            <Tile
              key={key}
              x={x} y={y}
              terrain={terrain}
              visible={vis}
              inDanger={inDanger}
              hasItems={hasItems}
              isReachable={isReach}
              isTarget={false}
              onClick={(e) => { e.stopPropagation(); handleTileClick(x, y); }}
            />
          );
        })
      )}

      {/* Human player */}
      <PlayerModel
        position={yourPlayer.position}
        color={AGENT_COLORS.human}
        name={yourPlayer.name}
        hp={yourPlayer.hp}
        maxHp={yourPlayer.maxHp}
        isYou
      />

      {/* Visible enemies */}
      {visiblePlayers.map(p => (
        <PlayerModel
          key={p.id}
          position={p.position}
          color={AGENT_COLORS[p.codename || 'human'] || '#ff4444'}
          name={p.name}
          hp={p.hp}
          maxHp={100}
          isYou={false}
        />
      ))}
    </>
  );
}

// ── Exported wrapper ──────────────────────────────────────────
interface GameMap3DProps {
  playerView: PlayerView;
  isProcessing: boolean;
  itemTargeting: boolean;
  onMoveAction: (direction: Direction, distance: number) => void;
  onAttackAction: (targetX: number, targetY: number) => void;
  onItemTarget: (x: number, y: number) => void;
}

export default function GameMap3D(props: GameMap3DProps) {
  return (
    <Canvas
      gl={{ antialias: true, alpha: false }}
      style={{ background: '#04060c' }}
      dpr={[1, 2]}
    >
      <fog attach="fog" args={['#04060c', 15, 35]} />
      <Scene {...props} />
    </Canvas>
  );
}
