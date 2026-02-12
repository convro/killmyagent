import {
  GameState, PlayerAction, GameEvent, Player, Position,
  WEAPONS, ITEMS, WeaponType,
} from '@/types/game';
import {
  DIRECTION_VECTORS, MAP_WIDTH, MAP_HEIGHT,
  HIDE_DODGE_CHANCE, VIPER_HIDE_DODGE_CHANCE,
  BUILDING_RANGED_REDUCTION, ROOK_BUILDING_RANGED_REDUCTION, ROOK_BUILDING_DAMAGE_BONUS,
  SHOTGUN_CLOSE_RANGE_DAMAGE, GHOST_TRAP_DAMAGE,
  BLAZE_ADRENALINE_THRESHOLD, BLAZE_ADRENALINE_MOVE_RANGE, DEFAULT_MOVE_RANGE,
} from '@/utils/constants';
import { isInSafeZone, applyDangerZoneDamage, updateDangerZone } from './DangerZone';

function distance(a: Position, b: Position): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

function manhattanDistance(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function isWallBetween(from: Position, to: Position, map: GameState['map']): boolean {
  // Simple line-of-sight check using Bresenham-like steps
  const dx = Math.sign(to.x - from.x);
  const dy = Math.sign(to.y - from.y);
  let cx = from.x + dx;
  let cy = from.y + dy;

  while (cx !== to.x || cy !== to.y) {
    if (cx < 0 || cx >= MAP_WIDTH || cy < 0 || cy >= MAP_HEIGHT) return true;
    if (map[cy][cx].terrain === 'wall') return true;
    if (cx !== to.x) cx += dx;
    if (cy !== to.y) cy += dy;
  }
  return false;
}

export function resolveActions(state: GameState): { events: GameEvent[]; eliminatedThisTurn: string[] } {
  const events: GameEvent[] = [];
  const eliminatedThisTurn: string[] = [];
  let eventOrder = 0;

  const actions = { ...state.pendingActions };
  const players = state.players;

  // Helper to create events
  const addEvent = (type: GameEvent['type'], playerId: string | undefined, data: Record<string, unknown>, narration: string, targetId?: string) => {
    events.push({ order: ++eventOrder, type, playerId, targetId, data, narration });
  };

  // ============================
  // Phase 1: Overwatch triggers
  // ============================
  for (const player of Object.values(players)) {
    if (!player.alive || !player.overwatchTiles || !player.overwatchTurnsLeft || player.overwatchTurnsLeft <= 0) continue;

    for (const [actionPlayerId, action] of Object.entries(actions)) {
      if (actionPlayerId === player.id) continue;
      const targetPlayer = players[actionPlayerId];
      if (!targetPlayer?.alive) continue;

      if (action.action === 'move' && action.direction) {
        const vec = DIRECTION_VECTORS[action.direction];
        const dist = action.distance || 1;
        const newX = targetPlayer.position.x + vec.dx * dist;
        const newY = targetPlayer.position.y + vec.dy * dist;

        const movesThrough = player.overwatchTiles.some(t => t.x === newX && t.y === newY);
        if (movesThrough && player.equippedWeapon !== 'knife') {
          const weapon = WEAPONS[player.equippedWeapon];
          let damage = weapon.damage;
          if (player.codename === 'rook' && state.map[player.position.y][player.position.x].terrain === 'building') {
            damage += ROOK_BUILDING_DAMAGE_BONUS;
          }
          targetPlayer.hp = Math.max(0, targetPlayer.hp - damage);
          player.damageDealt += damage;
          targetPlayer.damageTaken += damage;

          addEvent('overwatch_fire', player.id, { damage, weapon: player.equippedWeapon, targetPos: { x: newX, y: newY } },
            `${player.name} fires from overwatch! ${targetPlayer.name} takes ${damage} damage moving through the kill zone.`, targetPlayer.id);
        }
      }
    }
    player.overwatchTurnsLeft--;
    if (player.overwatchTurnsLeft <= 0) {
      player.overwatchTiles = undefined;
    }
  }

  // ============================
  // Phase 2: Process Hide/Scout first (for dodge calculations)
  // ============================
  for (const [playerId, action] of Object.entries(actions)) {
    const player = players[playerId];
    if (!player?.alive) continue;

    player.hiding = false;
    player.scouting = false;

    if (action.action === 'hide') {
      player.hiding = true;
      addEvent('hide', playerId, {}, `${player.name} conceals themselves.`);
    } else if (action.action === 'scout') {
      player.scouting = true;
      addEvent('scout', playerId, {}, `${player.name} surveys the area, extending their vision.`);
    }
  }

  // ============================
  // Phase 3: Trap triggers (from movement)
  // ============================
  for (const [playerId, action] of Object.entries(actions)) {
    const player = players[playerId];
    if (!player?.alive) continue;
    if (player.immobilized) continue;

    if (action.action === 'move' && action.direction) {
      const vec = DIRECTION_VECTORS[action.direction];
      const maxDist = player.codename === 'blaze' && player.hp < BLAZE_ADRENALINE_THRESHOLD
        ? BLAZE_ADRENALINE_MOVE_RANGE
        : DEFAULT_MOVE_RANGE;
      const dist = Math.min(action.distance || 1, maxDist);
      const newX = Math.max(0, Math.min(MAP_WIDTH - 1, player.position.x + vec.dx * dist));
      const newY = Math.max(0, Math.min(MAP_HEIGHT - 1, player.position.y + vec.dy * dist));

      // Check wall collision
      if (state.map[newY][newX].terrain === 'wall') continue;

      // Check water movement restriction
      if (state.map[newY][newX].terrain === 'water' && dist > 1) {
        // Water limits to 1 tile movement — move only 1 step
        const waterX = Math.max(0, Math.min(MAP_WIDTH - 1, player.position.x + vec.dx));
        const waterY = Math.max(0, Math.min(MAP_HEIGHT - 1, player.position.y + vec.dy));
        if (state.map[waterY][waterX].terrain !== 'wall') {
          player.position = { x: waterX, y: waterY };
        }
      } else {
        player.position = { x: newX, y: newY };
      }
      player.movedLastTurn = true;

      // Check trap
      const tile = state.map[newY][newX];
      if (tile.trap && tile.trap.owner_id !== playerId) {
        const trapDmg = tile.trap.damage;
        const trapOwnerId = tile.trap.owner_id;
        player.hp = Math.max(0, player.hp - trapDmg);
        player.damageTaken += trapDmg;
        const trapOwner = players[trapOwnerId];
        if (trapOwner) trapOwner.damageDealt += trapDmg;
        player.immobilized = true;
        tile.trap = undefined;

        addEvent('trap_triggered', playerId, { damage: trapDmg, trapOwner: trapOwnerId },
          `${player.name} steps on a trap! ${trapDmg} damage and immobilized!`, trapOwnerId);
      }

      addEvent('move', playerId, { from: { x: player.position.x - vec.dx * dist, y: player.position.y - vec.dy * dist }, to: player.position },
        `${player.name} moves to (${player.position.x}, ${player.position.y}).`);
    }
  }

  // ============================
  // Phase 4: Attacks resolve simultaneously
  // ============================
  for (const [playerId, action] of Object.entries(actions)) {
    const player = players[playerId];
    if (!player?.alive) continue;

    if (action.action === 'attack' && action.targetX !== undefined && action.targetY !== undefined) {
      const weaponType = (action.weapon || player.equippedWeapon) as WeaponType;
      if (!player.inventory.includes(weaponType)) continue;

      const weapon = WEAPONS[weaponType];
      const targetPos: Position = { x: action.targetX, y: action.targetY };
      const attackDist = distance(player.position, targetPos);

      if (attackDist > weapon.range) {
        addEvent('attack', playerId, { missed: true, reason: 'out_of_range' },
          `${player.name} fires at (${targetPos.x}, ${targetPos.y}) but it's out of range.`);
        continue;
      }

      // Check wall blocking
      if (weaponType !== 'knife' && isWallBetween(player.position, targetPos, state.map)) {
        addEvent('attack', playerId, { missed: true, reason: 'wall_blocked' },
          `${player.name} fires but the shot hits a wall.`);
        continue;
      }

      // Sniper requires standing still previous turn
      if (weaponType === 'sniper' && player.movedLastTurn) {
        addEvent('attack', playerId, { missed: true, reason: 'sniper_not_setup' },
          `${player.name} tries to use the sniper but hasn't set up. Wasted turn.`);
        continue;
      }

      // Find target player at position
      const target = Object.values(players).find(p =>
        p.alive && p.position.x === targetPos.x && p.position.y === targetPos.y && p.id !== playerId
      );

      if (!target) {
        addEvent('attack', playerId, { missed: true, reason: 'no_target' },
          `${player.name} fires at empty ground.`);
        continue;
      }

      // Dodge check (hiding)
      if (target.hiding) {
        const dodgeChance = target.codename === 'viper' ? VIPER_HIDE_DODGE_CHANCE : HIDE_DODGE_CHANCE;
        if (Math.random() < dodgeChance) {
          addEvent('attack', playerId, { missed: true, reason: 'dodged', target: target.id },
            `${player.name} attacks ${target.name} but they dodge!`, target.id);
          continue;
        }
      }

      // Calculate damage
      let damage = weapon.damage;

      // Shotgun close range bonus
      if (weaponType === 'shotgun' && attackDist <= 1) {
        damage = SHOTGUN_CLOSE_RANGE_DAMAGE;
      }

      // Rook building bonus
      if (player.codename === 'rook' && state.map[player.position.y][player.position.x].terrain === 'building' && weaponType !== 'knife') {
        damage += ROOK_BUILDING_DAMAGE_BONUS;
      }

      // Building defense for target
      if (weaponType !== 'knife' && state.map[target.position.y][target.position.x].terrain === 'building') {
        const reduction = target.codename === 'rook' ? ROOK_BUILDING_RANGED_REDUCTION : BUILDING_RANGED_REDUCTION;
        damage = Math.max(5, damage - reduction);
      }

      // Armor vest
      if (target.armorActive) {
        damage = Math.max(0, damage - 15);
        target.armorActive = false;
        addEvent('damage', target.id, { armorAbsorbed: 15 },
          `${target.name}'s armor vest absorbs some of the blow!`);
      }

      target.hp = Math.max(0, target.hp - damage);
      player.damageDealt += damage;
      target.damageTaken += damage;

      // Knife is silent
      const reveal = weaponType !== 'knife';
      addEvent('attack', playerId, { damage, weapon: weaponType, hit: true, reveal, targetHp: target.hp },
        `${player.name} hits ${target.name} with ${weaponType} for ${damage} damage!${target.hp <= 0 ? ' LETHAL!' : ` (${target.hp} HP left)`}`, target.id);
    }
  }

  // ============================
  // Phase 5: Items
  // ============================
  for (const [playerId, action] of Object.entries(actions)) {
    const player = players[playerId];
    if (!player?.alive) continue;

    if (action.action === 'use_item' && action.item) {
      const itemIdx = player.inventory.indexOf(action.item);
      if (itemIdx === -1) continue;

      const config = ITEMS[action.item];

      switch (action.item) {
        case 'medkit': {
          const healAmount = Math.min(config.heal || 40, player.maxHp - player.hp);
          player.hp += healAmount;
          player.inventory.splice(itemIdx, 1);
          addEvent('use_item', playerId, { item: 'medkit', healed: healAmount },
            `${player.name} uses a medkit. +${healAmount} HP (now ${player.hp}).`);
          break;
        }
        case 'grenade': {
          if (action.targetX === undefined || action.targetY === undefined) break;
          const grenadePos = { x: action.targetX, y: action.targetY };
          const throwDist = manhattanDistance(player.position, grenadePos);
          if (throwDist > (config.range || 3)) break;

          player.inventory.splice(itemIdx, 1);
          // AoE damage
          for (const target of Object.values(players)) {
            if (!target.alive) continue;
            const d = manhattanDistance(target.position, grenadePos);
            if (d <= (config.aoe || 1)) {
              const dmg = config.damage || 30;
              if (target.armorActive) {
                target.hp = Math.max(0, target.hp - Math.max(0, dmg - 15));
                target.armorActive = false;
              } else {
                target.hp = Math.max(0, target.hp - dmg);
              }
              player.damageDealt += dmg;
              target.damageTaken += dmg;
              addEvent('damage', target.id, { damage: dmg, source: 'grenade', from: playerId },
                `${target.name} caught in ${player.name}'s grenade blast! ${dmg} damage.`);
            }
          }
          addEvent('use_item', playerId, { item: 'grenade', position: grenadePos },
            `${player.name} throws a grenade at (${grenadePos.x}, ${grenadePos.y})!`);
          break;
        }
        case 'trap': {
          const trapX = action.targetX ?? player.position.x;
          const trapY = action.targetY ?? player.position.y;
          const trapDamage = player.codename === 'ghost' ? GHOST_TRAP_DAMAGE : 25;
          state.map[trapY][trapX].trap = { owner_id: playerId, damage: trapDamage };
          player.inventory.splice(itemIdx, 1);
          player.trapsPlaced = (player.trapsPlaced || 0) + 1;
          addEvent('use_item', playerId, { item: 'trap', position: { x: trapX, y: trapY } },
            `${player.name} places a trap.`);
          break;
        }
        case 'armor_vest': {
          player.armorActive = true;
          player.inventory.splice(itemIdx, 1);
          addEvent('use_item', playerId, { item: 'armor_vest' },
            `${player.name} equips an armor vest.`);
          break;
        }
        case 'smoke_bomb': {
          if (action.targetX === undefined || action.targetY === undefined) break;
          const smokePos = { x: action.targetX, y: action.targetY };
          player.inventory.splice(itemIdx, 1);
          // Apply smoke to 2x2 area
          for (let dy = 0; dy <= 1; dy++) {
            for (let dx = 0; dx <= 1; dx++) {
              const sx = smokePos.x + dx;
              const sy = smokePos.y + dy;
              if (sx < MAP_WIDTH && sy < MAP_HEIGHT) {
                state.map[sy][sx].smoke_turns = 2;
              }
            }
          }
          addEvent('use_item', playerId, { item: 'smoke_bomb', position: smokePos },
            `${player.name} deploys a smoke bomb at (${smokePos.x}, ${smokePos.y}).`);
          break;
        }
      }
    }
  }

  // ============================
  // Phase 6: Loot
  // ============================
  for (const [playerId, action] of Object.entries(actions)) {
    const player = players[playerId];
    if (!player?.alive) continue;

    if (action.action === 'loot') {
      const tile = state.map[player.position.y][player.position.x];
      if (tile.items.length > 0) {
        const looted = [...tile.items];
        player.inventory.push(...looted);
        tile.items = [];

        // Auto-equip best weapon
        const weaponPriority: WeaponType[] = ['sniper', 'rifle', 'shotgun', 'pistol', 'knife'];
        for (const w of weaponPriority) {
          if (player.inventory.includes(w)) {
            player.equippedWeapon = w;
            break;
          }
        }

        addEvent('loot', playerId, { items: looted },
          `${player.name} loots: ${looted.join(', ')}.`);
      }
    }
  }

  // ============================
  // Phase 7: Special abilities
  // ============================
  for (const [playerId, action] of Object.entries(actions)) {
    const player = players[playerId];
    if (!player?.alive || player.specialUsed) continue;

    if (action.action === 'mark_target' && player.codename === 'viper' && action.targetId) {
      player.markedTarget = action.targetId;
      player.markedTurnsLeft = 3;
      player.specialUsed = true;
      addEvent('special_ability', playerId, { ability: 'mark_target', target: action.targetId },
        `VIPER marks a target. They can't hide from him now.`);
    }

    if (action.action === 'war_cry' && player.codename === 'blaze') {
      player.specialUsed = true;
      const revealed: string[] = [];
      const flinched: string[] = [];
      for (const target of Object.values(players)) {
        if (!target.alive || target.id === playerId) continue;
        const dist = manhattanDistance(player.position, target.position);
        if (dist <= 4) {
          revealed.push(target.id);
          if (dist <= 2 && Math.random() < 0.3) {
            flinched.push(target.id);
            // Remove their pending action
            delete actions[target.id];
          }
        }
      }
      addEvent('special_ability', playerId, { ability: 'war_cry', revealed, flinched },
        `BLAZE unleashes a WAR CRY! ${revealed.length} players revealed. ${flinched.length} flinched.`);
    }

    if (action.action === 'dead_signal' && player.codename === 'ghost') {
      player.deadSignalActive = true;
      player.deadSignalTurnsLeft = 2;
      player.specialUsed = true;
      addEvent('special_ability', playerId, { ability: 'dead_signal' },
        `A death notification broadcasts: GHOST has been eliminated. ...Or has she?`);
    }

    if (action.action === 'false_flag' && player.codename === 'oracle') {
      player.specialUsed = true;
      if (action.fakeSender && action.fakeTo && action.fakeText) {
        state.messages.push({
          turn: state.turn,
          from: action.fakeSender,
          fromName: players[action.fakeSender]?.name || 'Unknown',
          to: action.fakeTo,
          text: action.fakeText,
          private: action.fakeTo !== 'all',
        });
      }
      addEvent('special_ability', playerId, { ability: 'false_flag' },
        `ORACLE sends a false flag message. Deception at its finest.`);
    }

    if (action.action === 'overwatch' && player.codename === 'rook' && action.tiles) {
      player.overwatchTiles = action.tiles;
      player.overwatchTurnsLeft = 2;
      player.specialUsed = true;
      addEvent('special_ability', playerId, { ability: 'overwatch', tiles: action.tiles },
        `ROOK sets up overwatch on a corridor. Enter at your own risk.`);
    }
  }

  // ============================
  // Phase 8: Messages
  // ============================
  for (const [playerId, action] of Object.entries(actions)) {
    const player = players[playerId];
    if (!player?.alive) continue;

    if (action.messages) {
      for (const msg of action.messages) {
        state.messages.push({
          turn: state.turn,
          from: playerId,
          fromName: player.name,
          to: msg.to,
          text: msg.text,
          private: msg.to !== 'all',
        });
      }
    }
  }

  // ============================
  // Phase 9: Danger zone
  // ============================
  state.dangerZone = updateDangerZone(state.dangerZone, state.turn);
  if (state.dangerZone.active) {
    const damaged = applyDangerZoneDamage(players, state.dangerZone);
    if (damaged.length > 0) {
      for (const d of damaged) {
        const p = players[d.playerId];
        addEvent('danger_zone', d.playerId, { damage: d.damage },
          `${p.name} takes ${d.damage} damage from the danger zone!${p.hp <= 0 ? ' LETHAL!' : ''}`);
      }
    }
  }

  // ============================
  // Phase 10: Smoke decay
  // ============================
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      if (state.map[y][x].smoke_turns && state.map[y][x].smoke_turns! > 0) {
        state.map[y][x].smoke_turns!--;
      }
    }
  }

  // ============================
  // Phase 11: Status effect decay
  // ============================
  for (const player of Object.values(players)) {
    if (player.markedTurnsLeft && player.markedTurnsLeft > 0) {
      player.markedTurnsLeft--;
      if (player.markedTurnsLeft <= 0) player.markedTarget = undefined;
    }
    if (player.deadSignalTurnsLeft && player.deadSignalTurnsLeft > 0) {
      player.deadSignalTurnsLeft--;
      if (player.deadSignalTurnsLeft <= 0) player.deadSignalActive = false;
    }
    player.immobilized = false;
    // Reset move tracking for sniper
    if (!actions[player.id] || actions[player.id].action !== 'move') {
      player.movedLastTurn = false;
    }
  }

  // ============================
  // Phase 12: Eliminations
  // ============================
  for (const player of Object.values(players)) {
    if (player.alive && player.hp <= 0) {
      player.alive = false;
      eliminatedThisTurn.push(player.id);

      // Find killer (last person to deal damage)
      const damageEvents = events.filter(e =>
        (e.type === 'attack' || e.type === 'damage' || e.type === 'overwatch_fire' || e.type === 'trap_triggered' || e.type === 'danger_zone') &&
        (e.targetId === player.id || e.playerId === player.id)
      );
      const lastDamage = damageEvents[damageEvents.length - 1];
      const killerId = lastDamage?.type === 'danger_zone' ? 'danger_zone' : (lastDamage?.playerId || 'unknown');
      const killer = killerId !== 'danger_zone' ? players[killerId] : null;
      if (killer) killer.kills++;

      const killEntry = {
        turn: state.turn,
        killerId,
        killerName: killer?.name || 'The Zone',
        victimId: player.id,
        victimName: player.name,
        weapon: (lastDamage?.data?.weapon as string) || 'danger_zone',
        narration: killer
          ? `${killer.name} eliminated ${player.name}.`
          : `${player.name} was consumed by the danger zone.`,
      };
      state.killFeed.push(killEntry);

      addEvent('elimination', player.id, { killer: killerId, killerName: killer?.name || 'The Zone' },
        killEntry.narration, killerId);
    }
  }

  return { events, eliminatedThisTurn };
}
