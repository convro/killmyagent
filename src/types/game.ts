// ============================================================
// KILL MY AGENT — Core Type Definitions
// ============================================================

export type TerrainType = 'open' | 'wall' | 'water' | 'building' | 'bush';

export type WeaponType = 'knife' | 'pistol' | 'shotgun' | 'rifle' | 'sniper';

export type ItemType = 'medkit' | 'grenade' | 'trap' | 'armor_vest' | 'smoke_bomb';

export type LootableType = WeaponType | ItemType;

export type Direction = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

export type ActionType = 'move' | 'attack' | 'loot' | 'hide' | 'scout' | 'use_item' | 'mark_target' | 'war_cry' | 'dead_signal' | 'false_flag' | 'overwatch';

export type GamePhase = 'lobby' | 'action' | 'resolving' | 'resolved' | 'finished';

export type PlayerType = 'human' | 'agent';

export type AgentCodename = 'viper' | 'blaze' | 'ghost' | 'oracle' | 'rook';

export type Difficulty = 'normal' | 'hard' | 'nightmare';

// ---- Coordinates ----

export interface Position {
  x: number;
  y: number;
}

// ---- Tiles ----

export interface Tile {
  terrain: TerrainType;
  items: LootableType[];
  trap?: { owner_id: string; damage: number };
  smoke_turns?: number; // remaining turns of smoke
}

// ---- Weapons Config ----

export interface WeaponConfig {
  range: number;
  damage: number;
  special?: string;
}

export const WEAPONS: Record<WeaponType, WeaponConfig> = {
  knife:   { range: 1, damage: 35, special: 'silent' },
  pistol:  { range: 3, damage: 25 },
  shotgun: { range: 2, damage: 45, special: 'close_range_bonus' },
  rifle:   { range: 5, damage: 30 },
  sniper:  { range: 7, damage: 50, special: 'requires_setup' },
};

// ---- Items Config ----

export interface ItemConfig {
  targetable: boolean;
  range?: number;
  damage?: number;
  aoe?: number;
  heal?: number;
  description: string;
}

export const ITEMS: Record<ItemType, ItemConfig> = {
  medkit:      { targetable: false, heal: 40, description: 'Restore 40 HP' },
  grenade:     { targetable: true, range: 3, damage: 30, aoe: 1, description: 'Throw, 30 dmg in 1-tile AoE' },
  trap:        { targetable: true, range: 0, damage: 25, description: 'Place on tile, 25 dmg + immobilize' },
  armor_vest:  { targetable: false, description: 'Absorb 15 dmg from next hit' },
  smoke_bomb:  { targetable: true, range: 3, description: '2x2 fog for 2 turns' },
};

// ---- Player ----

export interface Player {
  id: string;
  name: string;
  type: PlayerType;
  codename?: AgentCodename;
  hp: number;
  maxHp: number;
  position: Position;
  inventory: LootableType[];
  equippedWeapon: WeaponType;
  statusEffects: StatusEffect[];
  alive: boolean;
  kills: number;
  damageDealt: number;
  damageTaken: number;
  // Special ability tracking
  specialUsed: boolean;
  // Viper: mark target
  markedTarget?: string;
  markedTurnsLeft?: number;
  // Ghost: dead signal
  deadSignalActive?: boolean;
  deadSignalTurnsLeft?: number;
  // Ghost: enhanced traps
  trapsPlaced?: number;
  // Rook: overwatch
  overwatchTiles?: Position[];
  overwatchTurnsLeft?: number;
  // Blaze: previous position for sniper check
  movedLastTurn?: boolean;
  // Hiding
  hiding?: boolean;
  // Scouting
  scouting?: boolean;
  // Armor active
  armorActive?: boolean;
  // Immobilized
  immobilized?: boolean;
}

export interface StatusEffect {
  type: 'hiding' | 'scouting' | 'armor' | 'immobilized' | 'dead_signal' | 'overwatch' | 'marked' | 'adrenaline';
  turnsLeft: number;
  data?: Record<string, unknown>;
}

// ---- Actions ----

export interface GameMessage {
  to: string; // 'all' or player_id
  text: string;
  fakeSender?: string; // for false_flag
}

export interface PlayerAction {
  playerId: string;
  action: ActionType;
  direction?: Direction;
  distance?: number;
  targetX?: number;
  targetY?: number;
  weapon?: WeaponType;
  item?: ItemType;
  targetId?: string;
  tiles?: Position[];
  messages?: GameMessage[];
  // false flag specific
  fakeSender?: string;
  fakeText?: string;
  fakeTo?: string;
}

// ---- Events ----

export interface GameEvent {
  order: number;
  type: 'move' | 'attack' | 'loot' | 'hide' | 'scout' | 'use_item' | 'trap_triggered' | 'elimination' | 'danger_zone' | 'overwatch_fire' | 'special_ability' | 'message' | 'damage';
  playerId?: string;
  targetId?: string;
  data: Record<string, unknown>;
  narration: string;
}

// ---- Agent Thoughts ----

export interface AgentThought {
  playerId: string;
  codename: AgentCodename;
  reasoningChain: string;
  actionTaken: string;
}

// ---- Turn Result ----

export interface TurnResult {
  turn: number;
  events: GameEvent[];
  agentThoughts: Record<string, AgentThought>;
  eliminatedThisTurn: string[];
  narrationSummary: string;
}

// ---- Kill Feed Entry ----

export interface KillFeedEntry {
  turn: number;
  killerId: string;
  killerName: string;
  victimId: string;
  victimName: string;
  weapon: string;
  narration: string;
}

// ---- Danger Zone ----

export interface DangerZoneState {
  safeArea: { minX: number; minY: number; maxX: number; maxY: number };
  nextShrinkIn: number;
  active: boolean;
}

// ---- Full Game State ----

export interface GameState {
  gameId: string;
  turn: number;
  phase: GamePhase;
  difficulty: Difficulty;
  map: Tile[][];
  mapWidth: number;
  mapHeight: number;
  players: Record<string, Player>;
  playerOrder: string[];
  dangerZone: DangerZoneState;
  messages: Array<{
    turn: number;
    from: string;
    fromName: string;
    to: string;
    text: string;
    private: boolean;
  }>;
  killFeed: KillFeedEntry[];
  turnHistory: TurnResult[];
  pendingActions: Record<string, PlayerAction>;
  winner?: string;
}

// ---- API Types ----

export interface CreateGameRequest {
  playerName: string;
  difficulty: Difficulty;
  mapSeed?: number;
}

export interface CreateGameResponse {
  gameId: string;
  sessionToken: string;
  playerId: string;
}

export interface SubmitActionRequest {
  sessionToken: string;
  action: ActionType;
  params: {
    direction?: Direction;
    distance?: number;
    targetX?: number;
    targetY?: number;
    weapon?: WeaponType;
    item?: ItemType;
    targetId?: string;
    tiles?: Position[];
  };
  messages?: GameMessage[];
}

// ---- Client-side view (fog of war applied) ----

export interface PlayerView {
  gameId: string;
  turn: number;
  phase: GamePhase;
  yourPlayer: Player;
  visibleTiles: Array<{ x: number; y: number; tile: Tile }>;
  visiblePlayers: Array<{ id: string; name: string; codename?: string; position: Position; hp: number; equippedWeapon: WeaponType }>;
  dangerZone: DangerZoneState;
  messages: Array<{
    turn: number;
    from: string;
    fromName: string;
    to: string;
    text: string;
    private: boolean;
  }>;
  killFeed: KillFeedEntry[];
  alivePlayers: string[];
  eliminatedPlayers: string[];
  winner?: string;
}

// ---- WebSocket Events ----

export type WSServerEvent =
  | { event: 'game:state_update'; data: PlayerView }
  | { event: 'game:turn_resolved'; data: TurnResult & { playerView: PlayerView } }
  | { event: 'game:message'; data: { from: string; fromName: string; to: string; text: string; private: boolean; turn: number } }
  | { event: 'game:elimination'; data: KillFeedEntry & { lastThoughts?: string; remainingPlayers: number } }
  | { event: 'game:danger_zone'; data: DangerZoneState & { playersDamaged: Array<{ playerId: string; damage: number }> } }
  | { event: 'game:agent_thinking'; data: { playerId: string; codename: string; thinkingChunk: string; done: boolean; fullReasoning?: string; actionChosen?: string } }
  | { event: 'game:victory'; data: { winnerId: string; winnerName: string; winnerType: PlayerType; turnsSurvived: number; kills: number; damageDealt: number; damageTaken: number; summary: string } }
  | { event: 'game:error'; data: { code: string; message: string } };

export type WSClientEvent =
  | { event: 'player:action'; data: SubmitActionRequest }
  | { event: 'player:ready' };
