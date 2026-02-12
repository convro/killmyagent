# KILL MY AGENT — UI/UX Design Specification

> Mobile-first, Brawl Stars-inspired controls. Desktop power-user layout. One dark, sharp, no-nonsense design system.

---

## Design Philosophy

- **Dark and clean.** Black backgrounds, electric blue accents, white text. No gradients, no pastels, no rounded cute corners.
- **Information-dense but not cluttered.** Every pixel serves a purpose.
- **Mobile is the primary platform.** Touch controls must feel as natural as Brawl Stars.
- **Desktop is the power-user experience.** More panels, more data, keyboard shortcuts.
- **The AI thoughts are the star.** The reasoning chains need prominent, readable real estate.

---

## Color System

```
--bg-primary:     #000000    // Pure black — main background
--bg-secondary:   #0A1628    // Deep navy — panels, cards, overlays
--bg-tertiary:    #111D2E    // Slightly lighter — hover states, active panels
--accent:         #00A3FF    // Electric blue — buttons, borders, highlights
--accent-glow:    #00A3FF33  // Blue with 20% opacity — glow effects, shadows
--text-primary:   #FFFFFF    // White — headings, important text
--text-secondary: #B0B0B0    // Light gray — body text, descriptions
--text-muted:     #5A6677    // Muted — timestamps, minor info
--danger:         #FF3333    // Red — damage, kills, danger zone, HP loss
--danger-glow:    #FF333333  // Red glow — danger zone on map
--success:        #33FF57    // Green — heals, loot, positive events
--warning:        #FFB800    // Amber — alerts, zone shrinking soon
--viper-color:    #8B5CF6    // Purple — Viper's identifier
--blaze-color:    #FF6B35    // Orange — Blaze's identifier
--ghost-color:    #6EE7B7    // Mint — Ghost's identifier
--oracle-color:   #F472B6    // Pink — Oracle's identifier
--rook-color:     #60A5FA    // Steel blue — Rook's identifier
--human-color:    #00A3FF    // Electric blue — Human player
```

---

## Typography

```
--font-primary:   'Inter', sans-serif         // UI text, labels, buttons
--font-mono:      'JetBrains Mono', monospace  // Agent thoughts, code, stats
--font-display:   'Orbitron', sans-serif       // Titles, headings, kill feed
```

| Usage | Font | Size (mobile) | Size (desktop) | Weight |
|-------|------|---------------|----------------|--------|
| Page title | Orbitron | 24px | 36px | 700 |
| Section headers | Orbitron | 16px | 20px | 600 |
| Body text | Inter | 14px | 15px | 400 |
| Agent thoughts | JetBrains Mono | 13px | 14px | 400 |
| Stats/numbers | JetBrains Mono | 14px | 16px | 600 |
| Buttons | Inter | 14px | 15px | 600 |
| Kill feed | Orbitron | 12px | 14px | 500 |

---

## Screen Flow

```
[Landing Page] → [Game Lobby / Setup] → [Game View] → [Victory / Defeat Screen]
```

---

## 1. Landing Page

### Layout
Full-screen dark page with centered content. No navigation bar. Atmospheric.

### Content (top to bottom)
1. **Logo/Title**: "KILL MY AGENT" in Orbitron, large, with subtle blue glow pulse animation
2. **Tagline**: "6 enter. 1 survives. The AI thinks it's real." — Inter, text-secondary
3. **Brief description** (3-4 lines): What the game is, in plain language
4. **"ENTER THE ARENA" button**: Large, electric blue, full-width on mobile, 300px on desktop. Subtle glow hover effect.
5. **How It Works** section: 3 cards in a row (stacked on mobile)
   - Card 1: "5 AI Agents" — powered by DeepSeek R1 reasoning model
   - Card 2: "1 Human" — that's you, with the unfair advantage
   - Card 3: "Read Their Minds" — watch AI think in real-time
6. **Agent Roster Preview**: 5 small cards showing codename, portrait silhouette, one-line personality
7. **Footer**: "An AI experiment. They compute. You decide."

### Animations
- Title has a slow blue glow pulse (2s cycle)
- Background has a very subtle grid pattern (like a tactical map) that slowly moves
- Cards fade in on scroll (stagger 100ms each)

---

## 2. Game Lobby / Setup

### Layout
Centered card on black background. Simple configuration before starting.

### Content
1. **Your Name** input field (text, max 16 chars)
2. **Difficulty selector**: Normal / Hard / Nightmare
   - Normal: Agents use temperature 0.9 (more creative/unpredictable)
   - Hard: Agents use temperature 0.7 (more strategic)
   - Nightmare: Agents use temperature 0.5 (pure calculation)
3. **Agent Preview Panel**: 5 agent cards showing:
   - Codename + color indicator
   - One-line personality description
   - Passive ability name
   - Special ability name
4. **"START GAME" button**: Large, electric blue, same style as landing

---

## 3. Game View — Mobile Layout

This is the critical screen. Inspired by Brawl Stars controls for touch, but adapted for a turn-based tactical game.

### Screen Regions (portrait orientation)

```
┌─────────────────────────────┐
│         TOP BAR             │  48px — Turn #, Timer, Menu
├─────────────────────────────┤
│                             │
│                             │
│        GAME MAP             │  ~50% of screen height
│      (12x12 grid)           │
│                             │
│                             │
├─────────────────────────────┤
│     INFO TICKER             │  32px — scrolling kill feed / events
├─────────────────────────────┤
│                             │
│    CONTROL AREA             │  ~35% of screen — joystick + actions
│                             │
├─────────────────────────────┤
│    BOTTOM BAR               │  56px — HP, inventory quick-view
└─────────────────────────────┘
```

### 3a. Top Bar (Mobile)
- Left: Turn number ("TURN 7") in Orbitron
- Center: Game phase ("YOUR TURN" / "RESOLVING..." / "WAITING...")
- Right: Hamburger menu (settings, surrender, agent thoughts panel)

### 3b. Game Map (Mobile)
- **12x12 grid rendered with CSS Grid or Canvas**
- Each tile is a square (~28px on a 375px wide phone)
- **Pinch to zoom** supported (zoom to 2x for precision)
- **Pan** by dragging when zoomed
- Tiles colored by terrain type:
  - Open: `#0A1628` (dark navy)
  - Wall: `#1A1A2E` with brick-like pattern
  - Water: `#0A2A4A` with subtle animation
  - Building: `#1A2840` with roof-like top border
  - Bush: `#0A2A1A` with leaf texture
- **Fog of war**: Tiles outside vision radius are covered with `#000000` at 85% opacity
- **Danger zone**: Tiles outside safe area have a red overlay (`#FF333340`) with pulsing animation
- **Players** shown as colored circles with codename initial:
  - Your player: Blue circle with white border
  - Visible enemies: Their color circle
  - Last known positions: Faded circle with "?" overlay
- **Items** on tiles: Small icon in the corner of the tile
- **Traps** (your own): Small icon visible to you only

### 3c. Info Ticker (Mobile)
- Single-line scrolling bar at the bottom of the map
- Shows recent events: kills, damage, zone warnings
- Color-coded: red for kills, amber for warnings, green for loot
- Tappable to expand into full event log

### 3d. Control Area (Mobile) — Brawl Stars Style

This is the core interaction area. Two-zone layout:

```
┌─────────────────────────────────┐
│                                 │
│  [JOYSTICK]       [ACTION PAD]  │
│   (left)            (right)     │
│                                 │
│            [MESSAGE]            │
│            (bottom)             │
└─────────────────────────────────┘
```

#### Movement Joystick (Left Side)
- **Virtual joystick** — identical feel to Brawl Stars
- Appears where your left thumb touches (dynamic position)
- 8-directional: N, NE, E, SE, S, SW, W, NW
- Drag distance determines move distance:
  - Short drag (< 40px): Move 1 tile
  - Long drag (> 40px): Move 2 tiles
- Shows a direction arrow and tile count overlay while dragging
- **On release**: Queues the move action. A ghost indicator appears on the map showing where you'll move.
- Can be **cancelled** by dragging back to center

#### Action Pad (Right Side)
- **Primary action button**: Large circle (64px), changes based on context:
  - Default: Sword icon (attack) — when enemies are visible
  - Near items: Backpack icon (loot)
  - No enemies: Eye icon (scout)
- **Secondary buttons**: 4 smaller circles (40px) arranged around the primary:
  - Top: Scout (eye icon)
  - Right: Use Item (opens item wheel)
  - Bottom: Hide (ghost icon)
  - Left: Attack (crosshair icon) — tap then tap a visible enemy on the map

#### Attack Flow (Mobile)
1. Tap the Attack button (or primary when enemies visible)
2. Map highlights valid targets with pulsing red circles
3. Tap the target on the map
4. Confirm button appears: "ATTACK with [weapon icon]?"
5. Tap to confirm or tap elsewhere to cancel

#### Item Wheel (Mobile)
1. Tap "Use Item" button
2. Radial wheel appears with your items (like Brawl Stars gadget/super selection)
3. Tap an item to select
4. For targetable items (grenade, trap, smoke): map enters targeting mode
5. Tap the target tile on the map
6. Confirm button appears

#### Message Button (Bottom Center)
- Small chat bubble icon
- Tap to open message composer:
  - Recipient selector: "ALL" or specific player names
  - Text input (max 140 chars)
  - Send button
- Messages are attached to your next action

#### Submit Turn Button
- After selecting an action, a large "CONFIRM TURN" button slides up from the bottom
- Electric blue, full width, with your action summarized:
  - "MOVE NE (2 tiles)" or "ATTACK BLAZE with PISTOL" etc.
- Tap to submit. Button changes to "WAITING..." with loading animation.

### 3e. Bottom Bar (Mobile)
- Left: HP bar (red/green gradient, numbers overlay)
- Center: Equipped weapon icon + name
- Right: Inventory icons (tap to expand)

### 3f. Agent Thoughts Panel (Mobile)
- Accessed via the hamburger menu → "AGENT THOUGHTS" or swipe left from the right edge
- **Slides in as a bottom sheet** (takes up 70% of screen height)
- Shows each agent's reasoning chain for the current/last turn
- Each agent has a collapsible section with their color header
- Monospace text, streaming animation (text appears word by word)
- Can be minimized to show just the headers

### 3g. Turn Resolution Animation (Mobile)
- After all actions are submitted, the map becomes the focus
- Events play out sequentially with brief animations:
  - Movement: Player dot slides to new position (300ms)
  - Attack: Flash line from attacker to target (200ms), damage number pops up
  - Loot: Item icon flies to player's inventory bar
  - Trap: Explosion effect on tile (400ms)
  - Kill: Red flash, player dot fades out, kill text overlay
  - Danger zone: Red overlay pulses and expands
- After resolution, the Agent Thoughts panel auto-opens showing what each AI was thinking
- "NEXT TURN" button appears when player is ready

---

## 4. Game View — Desktop Layout

Desktop layout maximizes information density. All panels visible simultaneously.

### Screen Regions (landscape, 1920x1080 reference)

```
┌──────────────────────────────────────────────────────────────────┐
│ TOP BAR: Turn # | Phase | Timer | Alive Count | Menu             │
├────────────┬─────────────────────────┬───────────────────────────┤
│            │                         │                           │
│  AGENT     │                         │    AGENT THOUGHTS         │
│  THOUGHTS  │      GAME MAP           │    (expanded panel)       │
│  (left)    │      (center)           │                           │
│            │                         │    or                     │
│  Shows 2-3 │    12x12 grid           │                           │
│  agents    │    ~600x600px           │    MESSAGE FEED           │
│            │                         │    (tabbed)               │
│            │                         │                           │
├────────────┼─────────────────────────┼───────────────────────────┤
│  PLAYER    │     ACTION BAR          │    KILL FEED              │
│  STATS     │  [Move][Attack][Loot]   │    + EVENT LOG            │
│  (HP/Inv)  │  [Hide][Scout][Item]    │                           │
└────────────┴─────────────────────────┴───────────────────────────┘
```

### 4a. Left Panel — Agent Thoughts (Desktop)
- **Width**: 320px
- Shows the reasoning chains for all visible/known agents
- Each agent in a collapsible card with their color as the header accent
- Real-time streaming text in JetBrains Mono
- When a new turn resolves, thoughts auto-scroll and expand
- Can toggle between "Current Turn" and "Full History"

### 4b. Center — Game Map (Desktop)
- **12x12 grid, each tile ~48px** (576x576px total map)
- **Mouse hover** on tiles shows tooltip: terrain type, items, player info
- **Click** to select a tile (for targeting attacks/items)
- **Right-click** on a player to open quick-action context menu
- **Keyboard shortcuts**:
  - WASD / Arrow keys: Select move direction
  - 1-6: Quick-select action (move, attack, loot, hide, scout, item)
  - Space: Confirm action
  - Tab: Cycle through visible enemies
  - Enter: Open message composer
  - Esc: Cancel current action
  - T: Toggle Agent Thoughts panel
  - M: Toggle Message Feed panel
- All the same visual styling as mobile (terrain colors, fog, danger zone, player indicators)
- **Hover over enemy**: Shows HP bar, weapon, last action taken

### 4c. Right Panel — Messages & Intel (Desktop)
- **Width**: 320px
- **Tabbed interface**: "Messages" | "Kill Feed" | "Intel"
- **Messages tab**: Full chat history, grouped by turn. Public and private messages distinguished. Compose new message with recipient dropdown.
- **Kill Feed tab**: Chronological list of all eliminations with dramatic narration
- **Intel tab**: Known information about each player — last seen position, estimated HP, known inventory, behavioral notes

### 4d. Bottom — Action Bar (Desktop)
- Horizontal bar across the center column
- 6 action buttons in a row, keyboard shortcut shown on each:
  - `[1] Move` `[2] Attack` `[3] Loot` `[4] Hide` `[5] Scout` `[6] Item`
- Selecting an action highlights it and changes the cursor/interaction mode:
  - Move: WASD/arrows or click adjacent tile
  - Attack: Click a visible enemy or tile in weapon range
  - Loot: Click to confirm (if items on current tile)
  - Hide/Scout: Click to confirm (no target needed)
  - Item: Opens item sub-bar, then click target if needed
- **"CONFIRM TURN" button**: Right side of action bar. Shows summary of queued action.
- **Message compose button**: Opens inline message compose at the top of the right panel

### 4e. Bottom Left — Player Stats (Desktop)
- HP bar with numerical value
- Equipped weapon with icon
- Inventory grid (2x4 slots showing items)
- Status effects (if any)
- Position coordinates

---

## 5. Victory / Defeat Screen

### Winner Screen
- Full-screen black with centered content
- Large "VICTORY" or "ELIMINATED" text in Orbitron with glow
- If human wins: Blue glow, triumphant
- If agent wins: Red glow, the winning agent's "victory speech" (generated by DeepSeek R1 one final time — the agent gloats/reflects)
- **Stats panel**:
  - Turns survived
  - Kills
  - Damage dealt / taken
  - Favorite weapon
  - Messages sent
  - Alliances formed & broken
- **Timeline**: Visual turn-by-turn timeline showing key events
- **"PLAY AGAIN" button**: Electric blue
- **"SHARE" button**: Generates a shareable text summary

### Agent Victory Speech
If an agent wins, we make one final DeepSeek R1 call:
```
You won the survival zone. You are the last one standing.
Reflect on what happened. What did you feel? What was your strategy?
Address the fallen. Keep it in character. Maximum 200 words.
```

This speech is displayed prominently on the victory screen.

---

## 6. Animations & Micro-interactions

### Map Animations
- **Fog of war reveal**: Smooth fade-in as tiles enter vision (200ms)
- **Danger zone pulse**: Red overlay pulses slowly (2s cycle), faster when about to shrink
- **Player movement**: Smooth slide transition (300ms ease-out)
- **Attack**: Bright line flash from attacker to target position
- **Damage numbers**: Pop up and float upward, fade out (600ms)
- **Kill**: Player circle shatters into particles (400ms)
- **Loot**: Item icon rises from tile and arcs to inventory (500ms)
- **Trap trigger**: Ground ripple + damage splash (400ms)
- **Smoke bomb**: Expanding fog circle (400ms), lingers with subtle motion

### UI Animations
- **Agent thoughts streaming**: Characters appear one by one, like typing (typewriter effect, ~30ms/char)
- **Kill feed entries**: Slide in from right with a brief red flash
- **Messages**: Slide in with a subtle bounce
- **Turn transition**: Brief screen flash/pulse when turn resolves
- **Phase change**: Top bar phase text transitions with a slide-up/slide-down

### Sound Effects (optional, can be muted)
- Weapon fire sounds (per weapon type)
- Footstep sounds on movement
- Alert chime when danger zone shrinks
- Kill sound (dramatic, bass-heavy)
- Loot pickup jingle
- Message received notification
- Turn resolve "whoosh"
- Victory/defeat fanfare

---

## 7. Responsive Breakpoints

```
Mobile:     < 768px    — Full touch controls, stacked layout
Tablet:     768-1024px — Hybrid layout, larger map, side panels toggle
Desktop:    > 1024px   — Full three-panel layout, keyboard shortcuts
Ultrawide:  > 1440px   — Expanded panels, larger map tiles
```

### Tablet (768-1024px)
- Map takes center, ~60% width
- Agent Thoughts panel is a toggleable sidebar (right)
- Controls are a floating bottom bar (hybrid touch + click)
- Action buttons are larger touch targets

---

## 8. Accessibility

- All interactive elements have focus states (blue outline)
- Keyboard navigation for all desktop interactions
- Color is never the only indicator — icons accompany all color-coded info
- Agent colors chosen to be distinguishable for common color blindness types
- Text meets WCAG AA contrast ratio on all backgrounds
- Screen reader labels for all game elements
- Reduced motion mode: Replaces animations with instant transitions

---

## 9. Component Inventory

| Component | Description | Mobile | Desktop |
|-----------|-------------|--------|---------|
| `GameMap` | 12x12 tile grid with fog/terrain/players | Touch + pinch | Mouse + keyboard |
| `VirtualJoystick` | Brawl Stars-style movement control | Yes | No (WASD instead) |
| `ActionPad` | Context-sensitive action buttons | Yes | Bottom action bar |
| `ItemWheel` | Radial item selector | Yes | Item sub-bar |
| `AgentThoughts` | Streaming AI reasoning display | Bottom sheet | Left panel |
| `MessageFeed` | Chat history + compose | Full screen overlay | Right panel tab |
| `KillFeed` | Elimination notifications | Ticker bar | Right panel tab |
| `HUD` | HP, weapon, inventory | Bottom bar | Bottom left panel |
| `TurnResolver` | Animated event playback | Map overlay | Map overlay |
| `MiniMap` | Zoomed-out map overview | N/A | Optional overlay |
| `TopBar` | Turn/phase/menu | 48px | 48px |
| `LandingPage` | Entry point with game intro | Full screen | Full screen |
| `GameLobby` | Name + difficulty config | Full screen | Centered card |
| `VictoryScreen` | End game stats + AI speech | Full screen | Full screen |

---

## 10. State Management

### Client State (React Context / Zustand)
```typescript
interface GameUIState {
  // Game
  gameId: string;
  turn: number;
  phase: 'waiting' | 'action' | 'resolving' | 'resolved';

  // Player
  player: PlayerState;
  selectedAction: Action | null;
  targetTile: {x: number, y: number} | null;
  pendingMessages: Message[];

  // Map
  visibleTiles: Tile[][];
  visiblePlayers: Player[];
  fogOfWar: boolean[][];
  dangerZone: {minX: number, minY: number, maxX: number, maxY: number};

  // UI
  agentThoughtsOpen: boolean;
  messageFeedOpen: boolean;
  selectedAgent: string | null;  // which agent's thoughts to focus
  zoomLevel: number;             // 1x or 2x on mobile
  panOffset: {x: number, y: number};

  // History
  turnHistory: TurnResult[];
  killFeed: KillEvent[];
  messageHistory: Message[];
}
```

### WebSocket Connection
- Established on game start
- Auto-reconnects on disconnect (3 retries, exponential backoff)
- Heartbeat ping every 30 seconds
- All game state updates arrive via WebSocket
- Player actions can be submitted via WebSocket or REST (WebSocket preferred for lower latency)
