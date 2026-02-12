import { PlayerAction, ActionType, Direction, WeaponType, ItemType, Position } from '@/types/game';

interface RawAgentAction {
  action: string;
  direction?: string;
  distance?: number;
  target_x?: number;
  target_y?: number;
  weapon?: string;
  item?: string;
  target_id?: string;
  tiles?: Array<{ x: number; y: number }>;
  message?: { to: string; text: string };
  messages?: Array<{ to: string; text: string }>;
  fake_sender?: string;
  to?: string;
  text?: string;
}

const VALID_ACTIONS: ActionType[] = ['move', 'attack', 'loot', 'hide', 'scout', 'use_item', 'mark_target', 'war_cry', 'dead_signal', 'false_flag', 'overwatch'];
const VALID_DIRECTIONS: Direction[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const VALID_WEAPONS: WeaponType[] = ['knife', 'pistol', 'shotgun', 'rifle', 'sniper'];
const VALID_ITEMS: ItemType[] = ['medkit', 'grenade', 'trap', 'armor_vest', 'smoke_bomb'];

export function parseAgentResponse(playerId: string, rawContent: string): PlayerAction | null {
  try {
    // Extract JSON from response — agent might include some text around it
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed: RawAgentAction = JSON.parse(jsonMatch[0]);

    if (!parsed.action || !VALID_ACTIONS.includes(parsed.action as ActionType)) {
      return null;
    }

    const action: PlayerAction = {
      playerId,
      action: parsed.action as ActionType,
    };

    // Parse direction
    if (parsed.direction && VALID_DIRECTIONS.includes(parsed.direction.toUpperCase() as Direction)) {
      action.direction = parsed.direction.toUpperCase() as Direction;
    }

    // Parse distance
    if (parsed.distance && typeof parsed.distance === 'number') {
      action.distance = Math.min(Math.max(1, parsed.distance), 3);
    }

    // Parse target coordinates
    if (typeof parsed.target_x === 'number') action.targetX = parsed.target_x;
    if (typeof parsed.target_y === 'number') action.targetY = parsed.target_y;

    // Parse weapon
    if (parsed.weapon && VALID_WEAPONS.includes(parsed.weapon as WeaponType)) {
      action.weapon = parsed.weapon as WeaponType;
    }

    // Parse item
    if (parsed.item && VALID_ITEMS.includes(parsed.item as ItemType)) {
      action.item = parsed.item as ItemType;
    }

    // Parse target ID
    if (parsed.target_id) action.targetId = parsed.target_id;

    // Parse tiles (for overwatch)
    if (parsed.tiles && Array.isArray(parsed.tiles)) {
      action.tiles = parsed.tiles.map((t: { x: number; y: number }) => ({ x: t.x, y: t.y }));
    }

    // Parse messages
    const messages: Array<{ to: string; text: string }> = [];
    if (parsed.message) {
      messages.push({ to: parsed.message.to, text: parsed.message.text });
    }
    if (parsed.messages && Array.isArray(parsed.messages)) {
      for (const msg of parsed.messages) {
        if (msg.to && msg.text) {
          messages.push({ to: msg.to, text: msg.text });
        }
      }
    }
    if (messages.length > 0) {
      action.messages = messages;
    }

    // Parse false flag fields
    if (parsed.action === 'false_flag') {
      action.fakeSender = parsed.fake_sender;
      action.fakeTo = parsed.to;
      action.fakeText = parsed.text;
    }

    return action;
  } catch (e) {
    console.error('Failed to parse agent response:', e, rawContent);
    return null;
  }
}

export function getFallbackAction(playerId: string): PlayerAction {
  return {
    playerId,
    action: 'hide',
  };
}
