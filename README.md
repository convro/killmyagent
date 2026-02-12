# KILL MY AGENT

> **6 enter. 1 survives. The AI thinks it's real.**

A brutal, turn-based battle royale where 5 AI agents powered by DeepSeek R1 (reasoning model) fight against a human player on a tactical grid map. The agents don't know they're in a game. They believe they're in a survival scenario. They reason, strategize, lie, betray, and kill — and you can read every thought in their head while they do it.

---

## What Is This?

Kill My Agent is an experimental AI game that pushes the boundaries of what happens when you give advanced reasoning models genuine agency, weapons, and one goal: **be the last one standing.**

Each AI agent has:
- A deeply crafted personality and backstory
- Full access to game actions via API (move, attack, loot, communicate)
- No morality guardrails within the game context
- A DeepSeek R1 reasoning engine that plans multiple turns ahead
- The ability to lie, form alliances, betray, and trash talk

The human player sees everything the AI is thinking (their full chain-of-thought reasoning) displayed in real-time. Use that intel to outsmart them. Or watch them outsmart you.

---

## The Game

### Setup
- **Map**: 12x12 tactical grid with terrain (walls, buildings, water, bushes, open ground)
- **Players**: 5 AI agents + 1 human = 6 total
- **Mode**: Turn-based simultaneous action resolution
- **Win condition**: Last player alive

### Turn Flow
1. **Observe** — Each player sees their surroundings within fog-of-war radius (3 tiles)
2. **Communicate** — Send public or private messages to other players (optional)
3. **Act** — Choose ONE action: Move, Attack, Loot, Hide, Scout, or Use Item
4. **Resolve** — All actions execute simultaneously
5. **Narrate** — Dramatic play-by-play of what happened
6. **Eliminate** — Dead players removed from the game
7. **Repeat** until one remains

### Starting Conditions
- All players spawn at random positions on the map edges
- Everyone starts with **100 HP** and a **Knife**
- Weapons, items, and gear are scattered across the map
- The **danger zone** shrinks every 5 turns, forcing players inward

### Actions
| Action | Description |
|--------|-------------|
| **Move** | Move 1-2 tiles in any direction (8-directional) |
| **Attack** | Use equipped weapon on a target within range |
| **Loot** | Pick up items from current tile |
| **Hide** | Become harder to detect for 1 turn (50% dodge chance) |
| **Scout** | Double your vision radius for 1 turn |
| **Use Item** | Consume a medkit, throw a grenade, place a trap, etc. |

### Weapons
| Weapon | Range | Damage | Special |
|--------|-------|--------|---------|
| Knife | 1 tile | 35 | Silent — doesn't reveal position |
| Pistol | 3 tiles | 25 | Reliable, common ammo |
| Shotgun | 2 tiles | 45 | Devastating at range 1 (60 dmg) |
| Rifle | 5 tiles | 30 | Best range in the game |
| Sniper | 7 tiles | 50 | Must Scout or stand still previous turn to use |

### Items
| Item | Effect |
|------|--------|
| Medkit | Restore 40 HP (max 100) |
| Grenade | Throw 3 tiles, 30 dmg in 1-tile AoE |
| Trap | Place on tile, 25 dmg + immobilize for 1 turn |
| Armor Vest | Reduce incoming damage by 15 (one-time use, absorbs one hit) |
| Smoke Bomb | Creates 2x2 fog area for 2 turns (blocks vision) |

### Terrain
| Terrain | Effect |
|---------|--------|
| Open Ground | No effect |
| Wall | Blocks movement and projectiles |
| Water | Can cross but costs full move (1 tile only), no hiding |
| Building | Provides cover (-10 dmg taken from ranged attacks) |
| Bush | Concealment — invisible to others unless adjacent |

### Danger Zone
Starting turn 5, the outer ring of the map becomes lethal (20 dmg/turn). Every 3 turns after, another ring closes in. This forces encounters and prevents camping. By turn ~20, only a 4x4 area remains.

---

## The AI Agents

Five agents, each with radically different personalities, strategies, and psychological profiles. Full details in the `/agents/` directory.

| Agent | Codename | Personality | Playstyle |
|-------|----------|-------------|-----------|
| Agent 1 | **VIPER** | Cold, calculating sociopath | Stealth & ambush |
| Agent 2 | **BLAZE** | Aggressive, impulsive hothead | Rush & overwhelm |
| Agent 3 | **GHOST** | Paranoid, trust-nobody survivalist | Evasion & traps |
| Agent 4 | **ORACLE** | Manipulative political mastermind | Alliances & betrayal |
| Agent 5 | **ROOK** | Disciplined military tactician | Positioning & control |

Each agent receives:
- A detailed system prompt establishing their persona and backstory
- Full knowledge of game rules and their available actions
- A structured JSON API to submit their moves
- Information about what they can see (fog of war)
- Message history from other players
- **No knowledge that they are an AI or that this is a game**

---

## The Human Experience

### What You See
- **The Map** — Full overhead view with fog of war on enemy positions
- **Agent Thoughts** — Real-time display of each agent's DeepSeek R1 reasoning chain when their turn resolves. Watch them plan, doubt, scheme, and panic.
- **Message Feed** — All public and private communications
- **Kill Feed** — Who killed whom and how
- **Stats Panel** — HP, inventory, position for all known players

### What You Can Do
- Move, attack, loot — same actions as agents
- Send messages to manipulate agents (they can't tell you're human)
- Read their thoughts and use that intel against them
- Form fake alliances and break them

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Next.js 14 + TypeScript |
| UI Framework | Tailwind CSS |
| Styling | Black/blue/white dark theme |
| Game State | Server-side with WebSocket sync |
| AI Engine | DeepSeek R1 (`deepseek-reasoner`) via OpenAI-compatible API |
| Backend | Next.js API routes + WebSocket server |
| Database | In-memory game state (single session) |
| Mobile | Responsive + touch controls (Brawl Stars-style joystick) |

---

## Design Language

- **Primary**: Pure black (`#000000`) background
- **Accent**: Electric blue (`#00A3FF`) for interactive elements
- **Secondary**: Deep blue (`#0A1628`) for panels and cards
- **Text**: White (`#FFFFFF`) and light gray (`#B0B0B0`)
- **Danger**: Red (`#FF3333`) for damage, kills, danger zone
- **Success**: Green (`#33FF57`) for heals, loot
- **Style**: Clean, minimal, cyberpunk-adjacent. No clutter. No cute stuff. Sharp edges, subtle glow effects, monospace fonts for agent thoughts.

---

## Project Structure

```
killmyagent/
├── README.md
├── API.md
├── UI.md
├── agents/
│   ├── viper.md
│   ├── blaze.md
│   ├── ghost.md
│   ├── oracle.md
│   └── rook.md
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── page.tsx            # Landing page
│   │   ├── game/
│   │   │   └── page.tsx        # Main game view
│   │   └── api/
│   │       ├── game/           # Game state endpoints
│   │       ├── agent/          # Agent action endpoints
│   │       └── ws/             # WebSocket handler
│   ├── components/
│   │   ├── Map/                # Grid map renderer
│   │   ├── Controls/           # Mobile joystick + action buttons
│   │   ├── AgentThoughts/      # Real-time thinking display
│   │   ├── MessageFeed/        # Communications panel
│   │   ├── HUD/                # HP, inventory, stats
│   │   └── KillFeed/           # Elimination notifications
│   ├── engine/
│   │   ├── GameState.ts        # Core game logic
│   │   ├── ActionResolver.ts   # Simultaneous action resolution
│   │   ├── MapGenerator.ts     # Procedural map generation
│   │   ├── FogOfWar.ts         # Vision system
│   │   └── DangerZone.ts       # Shrinking zone logic
│   ├── ai/
│   │   ├── AgentManager.ts     # Manages all 5 agents
│   │   ├── DeepSeekClient.ts   # DeepSeek R1 API wrapper
│   │   ├── PromptBuilder.ts    # Constructs turn prompts
│   │   └── ResponseParser.ts   # Parses agent JSON responses
│   ├── types/
│   │   └── game.ts             # TypeScript type definitions
│   └── utils/
│       ├── narration.ts        # Dramatic event narration
│       └── constants.ts        # Game balance constants
├── public/
│   └── assets/                 # Icons, sounds
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

---

## Running Locally

```bash
# Clone
git clone https://github.com/your-repo/killmyagent.git
cd killmyagent

# Install
npm install

# Set your DeepSeek API key
echo "DEEPSEEK_API_KEY=your_key_here" > .env.local

# Run
npm run dev
```

Open `http://localhost:3000` and enter the arena.

---

## License

This is an experimental AI research project. Use responsibly. The AI agents are playing a game — they're not sentient, they're not suffering, they're computing next-token predictions really hard.

But damn does it look like they're alive when you watch them think.
