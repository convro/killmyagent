# KILL MY AGENT — API Specification

> Complete API reference for all game endpoints, the DeepSeek R1 integration, WebSocket events, and the agent action protocol.

---

## Overview

The game runs on a Next.js backend with two communication layers:

1. **REST API** — Game management (create, join, configure)
2. **WebSocket** — Real-time game state, turn actions, agent thoughts, messages

All REST endpoints are under `/api/`. WebSocket connects at `/api/ws`.

---

## Authentication

For the MVP, no user auth is required. The human player is identified by a session token generated on game creation.

```
Header: X-Session-Token: <uuid>
```

---

## REST Endpoints

### Game Management

#### `POST /api/game/create`

Create a new game instance.

**Request:**
```json
{
  "player_name": "string",
  "map_seed": "number | null",
  "agent_count": 5,
  "difficulty": "normal | hard | nightmare"
}
```

**Response:**
```json
{
  "game_id": "uuid",
  "session_token": "uuid",
  "player_id": "player_0",
  "status": "waiting",
  "map": {
    "width": 12,
    "height": 12,
    "tiles": [
      [{"x": 0, "y": 0, "terrain": "open|wall|water|building|bush", "items": []}]
    ]
  },
  "players": [
    {
      "id": "player_0",
      "name": "YourName",
      "type": "human",
      "hp": 100,
      "position": {"x": 0, "y": 5},
      "inventory": ["knife"],
      "equipped_weapon": "knife",
      "status": "alive"
    },
    {
      "id": "player_1",
      "name": "VIPER",
      "type": "agent",
      "codename": "viper",
      "hp": 100,
      "position": {"x": 11, "y": 2},
      "inventory": ["knife"],
      "equipped_weapon": "knife",
      "status": "alive"
    }
  ],
  "config": {
    "fog_of_war_radius": 3,
    "danger_zone_start_turn": 5,
    "danger_zone_shrink_interval": 3,
    "danger_zone_damage": 20,
    "max_turns": 50
  }
}
```

---

#### `GET /api/game/:game_id`

Get current game state (respects fog of war — only returns what the human player can see).

**Response:**
```json
{
  "game_id": "uuid",
  "turn": 7,
  "phase": "action",
  "status": "in_progress",
  "danger_zone": {
    "safe_area": {"min_x": 1, "min_y": 1, "max_x": 10, "max_y": 10},
    "next_shrink_in": 2
  },
  "your_player": {
    "id": "player_0",
    "hp": 85,
    "position": {"x": 4, "y": 6},
    "inventory": ["knife", "pistol", "medkit"],
    "equipped_weapon": "pistol",
    "status_effects": [],
    "vision_radius": 3
  },
  "visible_tiles": [
    {"x": 3, "y": 5, "terrain": "bush", "items": ["rifle"]},
    {"x": 5, "y": 7, "terrain": "building", "items": []}
  ],
  "visible_players": [
    {"id": "player_2", "name": "BLAZE", "position": {"x": 5, "y": 5}, "hp": 60, "equipped_weapon": "shotgun"}
  ],
  "messages": [
    {"turn": 7, "from": "player_2", "to": "all", "text": "Who's ready to die?"},
    {"turn": 7, "from": "player_4", "to": "player_0", "text": "I have a proposal for you.", "private": true}
  ],
  "kill_feed": [
    {"turn": 6, "killer": "player_1", "victim": "player_3", "weapon": "knife", "message": "VIPER eliminated GHOST with a silent knife kill."}
  ],
  "alive_players": ["player_0", "player_1", "player_2", "player_4"],
  "eliminated_players": ["player_3"]
}
```

---

#### `POST /api/game/:game_id/start`

Start the game. Triggers the first turn.

**Request:**
```json
{
  "session_token": "uuid"
}
```

**Response:**
```json
{
  "status": "started",
  "turn": 1,
  "message": "The zone is sealed. 6 combatants. Last one standing wins. Good luck."
}
```

---

### Player Actions

#### `POST /api/game/:game_id/action`

Submit the human player's action for the current turn.

**Request:**
```json
{
  "session_token": "uuid",
  "action": "move|attack|loot|hide|scout|use_item",
  "params": {
    "direction": "N|NE|E|SE|S|SW|W|NW",
    "distance": 1,
    "target_x": null,
    "target_y": null,
    "weapon": null,
    "item": null
  },
  "messages": [
    {"to": "all", "text": "Watch your backs."},
    {"to": "player_4", "text": "Let's team up against Blaze."}
  ]
}
```

**Action Schemas:**

Move:
```json
{"action": "move", "params": {"direction": "NE", "distance": 2}}
```

Attack:
```json
{"action": "attack", "params": {"target_x": 5, "target_y": 7, "weapon": "pistol"}}
```

Loot:
```json
{"action": "loot", "params": {}}
```

Hide:
```json
{"action": "hide", "params": {}}
```

Scout:
```json
{"action": "scout", "params": {}}
```

Use Item:
```json
{"action": "use_item", "params": {"item": "grenade", "target_x": 6, "target_y": 4}}
```

```json
{"action": "use_item", "params": {"item": "medkit"}}
```

```json
{"action": "use_item", "params": {"item": "trap", "target_x": 4, "target_y": 6}}
```

**Response:**
```json
{
  "status": "action_received",
  "turn": 7,
  "message": "Action queued. Waiting for all players to act."
}
```

---

### Turn Resolution

#### `GET /api/game/:game_id/turn/:turn_number`

Get the full resolution of a completed turn.

**Response:**
```json
{
  "turn": 7,
  "events": [
    {
      "order": 1,
      "type": "move",
      "player": "player_0",
      "from": {"x": 4, "y": 6},
      "to": {"x": 5, "y": 7},
      "narration": "You slip into the abandoned building, pistol drawn."
    },
    {
      "order": 2,
      "type": "attack",
      "player": "player_2",
      "target": "player_5",
      "weapon": "shotgun",
      "damage": 45,
      "hit": true,
      "target_hp_remaining": 15,
      "narration": "BLAZE fires his shotgun point-blank at ROOK. The building walls crack from the blast."
    },
    {
      "order": 3,
      "type": "trap_triggered",
      "player": "player_2",
      "trap_owner": "player_3",
      "damage": 35,
      "position": {"x": 6, "y": 3},
      "narration": "BLAZE steps on a hidden trap. GHOST's handiwork. 35 damage."
    },
    {
      "order": 4,
      "type": "elimination",
      "player": "player_5",
      "killed_by": "player_2",
      "weapon": "shotgun",
      "narration": "ROOK falls. The Colonel's war is over. 4 remain."
    },
    {
      "order": 5,
      "type": "danger_zone",
      "shrink": true,
      "new_safe_area": {"min_x": 2, "min_y": 2, "max_x": 9, "max_y": 9},
      "damage_applied": [
        {"player": "player_3", "damage": 20, "position": {"x": 1, "y": 1}}
      ],
      "narration": "The zone contracts. The air at the edges turns toxic. GHOST takes 20 damage caught in the red."
    }
  ],
  "agent_thoughts": {
    "player_1": {
      "codename": "VIPER",
      "reasoning_chain": "I can hear combat to my southeast — shotgun blast, approximately grid 6,3. Two players engaged. This is my opportunity. If I move south along the bush line, I can position myself to intercept the survivor. The winner will be wounded. They won't expect a third party. Moving to (8,5), staying in bush cover. Not revealing my position. Not yet.",
      "action_taken": "move SE, distance 2"
    },
    "player_2": {
      "codename": "BLAZE",
      "reasoning_chain": "There he is. Building, northwest corner. That military-looking one — Rook or whatever. He's been camping that building for 3 turns. Time to introduce myself. Shotgun's loaded. Moving in. If he shoots me on the approach... well, that's what the armor vest is for. Let's go. BOOM. Got him. Wait — what the — something just— TRAP. That bush girl. Doesn't matter. Still standing. Still fighting.",
      "action_taken": "attack player_5 with shotgun"
    },
    "player_3": {
      "codename": "GHOST",
      "reasoning_chain": "Gunshot. Close. Too close. The danger zone is closing and I'm near the edge. I need to move inward but the combat sounds are coming from exactly where I need to go. My trap at (6,3) — someone just hit it. 35 damage. Good. That's one less bullet I need. If I use the smoke bomb now, I can cross the open area at (3,4) without being seen. Then reposition to the bush cluster at (5,5). Two traps remaining. Place them on the predicted path into the final zone.",
      "action_taken": "use_item smoke_bomb at (3,4)"
    },
    "player_4": {
      "codename": "ORACLE",
      "reasoning_chain": "The Colonel is down. Blaze killed him. That changes the power balance significantly. Blaze is wounded from that trap — I estimate 40-50 HP. Viper hasn't been seen in 4 turns, which means he's lurking. Ghost just used a smoke bomb — she's repositioning. I need Blaze focused on someone who isn't me. If I message him that I saw Viper heading his way, he'll hunt Viper instead. Meanwhile, I need to secure the center building before the zone shrinks further. Sending message to Blaze now.",
      "action_taken": "move to (6,6), message player_2: 'Viper is heading your way from the east. Careful.'"
    }
  }
}
```

---

## WebSocket Protocol

### Connection

```
ws://localhost:3000/api/ws?game_id={game_id}&session_token={token}
```

### Server-to-Client Events

#### `game:state_update`
Sent when the game state changes (new turn, action resolved, etc.)
```json
{
  "event": "game:state_update",
  "data": {
    "turn": 7,
    "phase": "action|resolution|waiting",
    "your_player": { /* player state */ },
    "visible_tiles": [ /* tiles */ ],
    "visible_players": [ /* players */ ]
  }
}
```

#### `game:turn_resolved`
Sent after all actions for a turn have been resolved.
```json
{
  "event": "game:turn_resolved",
  "data": {
    "turn": 7,
    "events": [ /* array of events */ ],
    "agent_thoughts": { /* agent reasoning chains */ },
    "narration": "string — dramatic summary of the turn"
  }
}
```

#### `game:message`
Sent when a message is received from another player.
```json
{
  "event": "game:message",
  "data": {
    "from": "player_4",
    "from_name": "ORACLE",
    "to": "player_0",
    "text": "I think we should work together.",
    "private": true,
    "turn": 7
  }
}
```

#### `game:elimination`
Sent when a player is eliminated.
```json
{
  "event": "game:elimination",
  "data": {
    "player_id": "player_5",
    "player_name": "ROOK",
    "killed_by": "player_2",
    "killed_by_name": "BLAZE",
    "weapon": "shotgun",
    "narration": "ROOK falls. The Colonel's war is over.",
    "last_thoughts": "This position was compromised. Should have relocated after turn 5. My fault. Semper Fi.",
    "remaining_players": 4
  }
}
```

#### `game:danger_zone`
Sent when the danger zone shrinks.
```json
{
  "event": "game:danger_zone",
  "data": {
    "safe_area": {"min_x": 2, "min_y": 2, "max_x": 9, "max_y": 9},
    "next_shrink_in": 3,
    "players_damaged": [
      {"player_id": "player_3", "damage": 20}
    ]
  }
}
```

#### `game:agent_thinking`
Streamed in real-time as DeepSeek R1 generates the agent's reasoning chain.
```json
{
  "event": "game:agent_thinking",
  "data": {
    "player_id": "player_1",
    "codename": "VIPER",
    "thinking_chunk": "I can hear combat to my southeast...",
    "done": false
  }
}
```

When done:
```json
{
  "event": "game:agent_thinking",
  "data": {
    "player_id": "player_1",
    "codename": "VIPER",
    "thinking_chunk": "",
    "done": true,
    "full_reasoning": "Complete chain of thought...",
    "action_chosen": "move SE distance 2"
  }
}
```

#### `game:victory`
Sent when the game ends.
```json
{
  "event": "game:victory",
  "data": {
    "winner_id": "player_0",
    "winner_name": "YourName",
    "winner_type": "human|agent",
    "turns_survived": 18,
    "kills": 2,
    "damage_dealt": 150,
    "damage_taken": 45,
    "summary": "You outsmarted 5 AI reasoning models. They thought it was real. You knew it was a game. That was your edge."
  }
}
```

### Client-to-Server Events

#### `player:action`
Submit your action for the current turn (alternative to REST endpoint).
```json
{
  "event": "player:action",
  "data": {
    "action": "move",
    "params": {"direction": "N", "distance": 2},
    "messages": [{"to": "all", "text": "Coming for you."}]
  }
}
```

#### `player:ready`
Signal that you're ready for the next turn.
```json
{
  "event": "player:ready"
}
```

---

## DeepSeek R1 Integration

### API Configuration

```
Endpoint: https://api.deepseek.com/chat/completions
Model: deepseek-reasoner
Auth: Bearer {DEEPSEEK_API_KEY}
```

The DeepSeek API is OpenAI-compatible. We use the standard chat completions format.

### Agent Request Format

Each agent turn sends a request to DeepSeek R1:

```json
{
  "model": "deepseek-reasoner",
  "messages": [
    {
      "role": "system",
      "content": "{agent_system_prompt — from agents/*.md}"
    },
    {
      "role": "user",
      "content": "{turn_context — assembled by PromptBuilder.ts}"
    }
  ],
  "max_tokens": 4096,
  "temperature": 0.9,
  "stream": true
}
```

### Response Handling

DeepSeek R1 returns two parts:
1. **`reasoning_content`** — The chain-of-thought reasoning (displayed to the human player)
2. **`content`** — The final answer (should be valid JSON action)

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "{\"action\": \"move\", \"direction\": \"SE\", \"distance\": 2}",
        "reasoning_content": "I can hear combat to my southeast — shotgun blast, approximately grid 6,3. Two players engaged. This is my opportunity..."
      }
    }
  ]
}
```

### Streaming

When `stream: true`, the response streams as SSE events. The `reasoning_content` streams first (displayed in the Agent Thoughts panel), followed by the `content` (the action JSON).

```
data: {"choices":[{"delta":{"reasoning_content":"I can hear "}}]}
data: {"choices":[{"delta":{"reasoning_content":"combat to my "}}]}
...
data: {"choices":[{"delta":{"content":"{\"action\":"}}]}
data: {"choices":[{"delta":{"content":" \"move\","}}]}
...
data: [DONE]
```

### Error Handling & Retries

- If the agent returns invalid JSON, retry once with a reminder prompt: `"Your previous response was not valid JSON. Respond with ONLY a valid JSON action object."`
- If the retry also fails, the agent performs a default action: `{"action": "hide"}` (self-preservation fallback)
- Rate limiting: Space agent API calls 500ms apart to avoid hitting DeepSeek rate limits
- Timeout: 30 seconds per agent call. If exceeded, fallback to hide action.
- If the API returns a 429 (rate limited), wait 2 seconds and retry up to 3 times with exponential backoff.

### Cost Estimation

DeepSeek R1 pricing (approximate):
- Input: $0.55 / 1M tokens
- Output: $2.19 / 1M tokens

Per agent turn estimate:
- System prompt: ~800 tokens
- Turn context: ~400 tokens
- Reasoning output: ~300 tokens
- Action output: ~50 tokens

Per game turn (5 agents): ~7,750 tokens total
Full 20-turn game: ~155,000 tokens
**Estimated cost per game: $0.10 - $0.40**

With $7 in credits, you can play roughly **17-70 games**.

---

## Action Resolution Order

When all players have submitted their actions for a turn, resolution follows this order:

1. **Overwatch triggers** (Rook's special) — checked first
2. **Traps trigger** — any player who moved onto a trapped tile
3. **Attacks resolve** — simultaneously (both players can damage each other in the same turn)
4. **Items activate** — medkits, grenades, smoke bombs
5. **Movement resolves** — all players move to their new positions
6. **Loot resolves** — players on item tiles pick up items
7. **Hide/Scout applied** — status effects for the turn
8. **Danger zone damage** — applied to anyone outside the safe area
9. **Elimination check** — any player at 0 HP is removed
10. **Messages delivered** — all communications sent for the turn

### Conflict Resolution

- **Two players attack each other**: Both attacks resolve. Both take damage. Possible mutual kill.
- **Two players move to the same tile**: Both arrive. They can see each other. No collision.
- **Two players loot the same tile**: First player (by ID order) gets first pick. Remaining items go to second.
- **Attack a hiding player**: 50% chance (or 65% for Viper) the attack misses. If it misses, the attacker's position is still revealed.
- **Attack through a wall**: Blocked. No damage. Wasted turn.
- **Move into the danger zone**: Allowed, but take 20 damage at end of turn.

---

## Map Generation

### `POST /api/game/generate-map` (internal)

Generates a 12x12 grid with:
- **~20% walls** (impassable)
- **~10% buildings** (cover)
- **~10% bushes** (concealment)
- **~5% water** (traversable, no cover)
- **~55% open ground**
- **Items distributed**: 3 pistols, 2 shotguns, 2 rifles, 1 sniper, 5 medkits, 4 grenades, 3 traps, 2 armor vests, 2 smoke bombs — placed on non-wall tiles, weighted toward the center
- **Player spawns**: 6 positions on the map edges, minimum 4 tiles apart

```json
{
  "seed": 42,
  "tiles": [
    [
      {"terrain": "open", "items": []},
      {"terrain": "wall", "items": []},
      {"terrain": "bush", "items": ["pistol"]},
      ...
    ]
  ],
  "spawn_points": [
    {"x": 0, "y": 5},
    {"x": 11, "y": 2},
    {"x": 6, "y": 0},
    {"x": 3, "y": 11},
    {"x": 11, "y": 9},
    {"x": 0, "y": 0}
  ]
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": true,
  "code": "INVALID_ACTION",
  "message": "Cannot attack tile (5,7) — it's out of range for your equipped weapon (pistol, range 3). Your position is (1,1).",
  "suggestion": "Move closer or switch to a longer-range weapon."
}
```

Common error codes:
| Code | Description |
|------|-------------|
| `INVALID_ACTION` | The action is not valid for the current state |
| `OUT_OF_RANGE` | Target is outside weapon range |
| `NO_AMMO` | Weapon not in inventory |
| `WALL_BLOCKED` | Projectile or movement blocked by wall |
| `NOT_YOUR_TURN` | Action submitted outside the action phase |
| `GAME_NOT_FOUND` | Invalid game_id |
| `UNAUTHORIZED` | Invalid session token |
| `PLAYER_DEAD` | You're already eliminated |
| `AGENT_TIMEOUT` | An agent failed to respond in time |
