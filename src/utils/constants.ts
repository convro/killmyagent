// ============================================================
// KILL MY AGENT — Game Constants
// ============================================================

export const MAP_WIDTH = 12;
export const MAP_HEIGHT = 12;

export const STARTING_HP = 100;
export const MAX_HP = 100;

export const FOG_OF_WAR_RADIUS = 3;
export const SCOUT_RADIUS = 6;

export const DANGER_ZONE_START_TURN = 5;
export const DANGER_ZONE_SHRINK_INTERVAL = 3;
export const DANGER_ZONE_DAMAGE = 20;

export const MAX_TURNS = 50;

export const HIDE_DODGE_CHANCE = 0.5;
export const VIPER_HIDE_DODGE_CHANCE = 0.65;

export const BUILDING_RANGED_REDUCTION = 10;
export const ROOK_BUILDING_RANGED_REDUCTION = 20;
export const ROOK_BUILDING_DAMAGE_BONUS = 5;

export const SHOTGUN_CLOSE_RANGE_DAMAGE = 60;

export const GHOST_TRAP_DAMAGE = 35;
export const GHOST_MAX_TRAPS = 4;
export const DEFAULT_MAX_TRAPS = 2;

export const BLAZE_ADRENALINE_THRESHOLD = 40;
export const BLAZE_ADRENALINE_MOVE_RANGE = 3;
export const DEFAULT_MOVE_RANGE = 2;

export const VIPER_MARK_DURATION = 3;
export const OVERWATCH_DURATION = 2;
export const DEAD_SIGNAL_DURATION = 2;
export const SMOKE_DURATION = 2;

export const AGENT_API_DELAY_MS = 500;
export const AGENT_TIMEOUT_MS = 30000;
export const AGENT_MAX_RETRIES = 1;

// Map generation percentages
export const TERRAIN_DISTRIBUTION = {
  wall: 0.20,
  building: 0.10,
  bush: 0.10,
  water: 0.05,
  open: 0.55,
};

// Item distribution on map
export const MAP_ITEM_DISTRIBUTION: Record<string, number> = {
  pistol: 3,
  shotgun: 2,
  rifle: 2,
  sniper: 1,
  medkit: 5,
  grenade: 4,
  trap: 3,
  armor_vest: 2,
  smoke_bomb: 2,
};

// Agent colors for UI
export const AGENT_COLORS: Record<string, string> = {
  viper: '#8B5CF6',
  blaze: '#FF6B35',
  ghost: '#6EE7B7',
  oracle: '#F472B6',
  rook: '#60A5FA',
  human: '#00A3FF',
};

// Difficulty to temperature mapping
export const DIFFICULTY_TEMPERATURE: Record<string, number> = {
  normal: 0.9,
  hard: 0.7,
  nightmare: 0.5,
};

// Direction vectors
export const DIRECTION_VECTORS: Record<string, { dx: number; dy: number }> = {
  N:  { dx: 0,  dy: -1 },
  NE: { dx: 1,  dy: -1 },
  E:  { dx: 1,  dy: 0 },
  SE: { dx: 1,  dy: 1 },
  S:  { dx: 0,  dy: 1 },
  SW: { dx: -1, dy: 1 },
  W:  { dx: -1, dy: 0 },
  NW: { dx: -1, dy: -1 },
};
