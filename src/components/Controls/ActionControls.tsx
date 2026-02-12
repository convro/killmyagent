'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useGame } from '../GameContext';
import { ActionType, Direction, WeaponType, ItemType } from '@/types/game';
import { DIRECTION_VECTORS } from '@/utils/constants';

const ACTION_ICONS: Record<string, string> = {
  move: '↗',
  attack: '⚔',
  loot: '🎒',
  hide: '👻',
  scout: '👁',
  use_item: '💊',
};

const DIRECTION_LABELS: Record<Direction, string> = {
  N: '↑', NE: '↗', E: '→', SE: '↘',
  S: '↓', SW: '↙', W: '←', NW: '↖',
};

export default function ActionControls() {
  const { state, dispatch, submitAction } = useGame();
  const { playerView, selectedAction, targetTile, isProcessing, pendingMessages } = state;
  const [moveDirection, setMoveDirection] = useState<Direction | null>(null);
  const [moveDistance, setMoveDistance] = useState(1);
  const [selectedItem, setSelectedItem] = useState<ItemType | null>(null);
  const [messageText, setMessageText] = useState('');
  const [messageTo, setMessageTo] = useState('all');
  const [showMessageComposer, setShowMessageComposer] = useState(false);
  const joystickRef = useRef<HTMLDivElement>(null);
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickAngle, setJoystickAngle] = useState<{ x: number; y: number } | null>(null);

  if (!playerView || playerView.phase === 'finished') return null;

  const { yourPlayer, visiblePlayers } = playerView;
  if (!yourPlayer.alive) return null;

  const isActionPhase = playerView.phase === 'action';

  const getDirectionFromAngle = (dx: number, dy: number): Direction => {
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    if (angle > -22.5 && angle <= 22.5) return 'E';
    if (angle > 22.5 && angle <= 67.5) return 'SE';
    if (angle > 67.5 && angle <= 112.5) return 'S';
    if (angle > 112.5 && angle <= 157.5) return 'SW';
    if (angle > 157.5 || angle <= -157.5) return 'W';
    if (angle > -157.5 && angle <= -112.5) return 'NW';
    if (angle > -112.5 && angle <= -67.5) return 'N';
    return 'NE';
  };

  const handleJoystickStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isActionPhase) return;
    setJoystickActive(true);
    dispatch({ type: 'SELECT_ACTION', action: 'move' });
  };

  const handleJoystickMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!joystickActive || !joystickRef.current) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = rect.width / 2;

    const clampedDist = Math.min(dist, maxDist);
    const normalX = (dx / dist) * clampedDist || 0;
    const normalY = (dy / dist) * clampedDist || 0;

    setJoystickAngle({ x: normalX, y: normalY });
    setMoveDirection(getDirectionFromAngle(dx, dy));
    setMoveDistance(dist > 40 ? 2 : 1);
  };

  const handleJoystickEnd = () => {
    setJoystickActive(false);
    setJoystickAngle(null);
  };

  const handleActionSelect = (action: ActionType) => {
    if (!isActionPhase) return;
    dispatch({ type: 'SELECT_ACTION', action });
    if (action === 'loot' || action === 'hide' || action === 'scout') {
      // These don't need a target
    }
    setSelectedItem(null);
  };

  const handleSubmit = async () => {
    if (!selectedAction || isProcessing) return;

    const params: Record<string, unknown> = {};

    switch (selectedAction) {
      case 'move':
        if (!moveDirection) return;
        params.direction = moveDirection;
        params.distance = moveDistance;
        break;
      case 'attack':
        if (!targetTile) return;
        params.targetX = targetTile.x;
        params.targetY = targetTile.y;
        params.weapon = yourPlayer.equippedWeapon;
        break;
      case 'use_item':
        if (!selectedItem) return;
        params.item = selectedItem;
        if (targetTile) {
          params.targetX = targetTile.x;
          params.targetY = targetTile.y;
        }
        break;
      case 'loot':
      case 'hide':
      case 'scout':
        break;
      default:
        return;
    }

    const msgs = pendingMessages.length > 0 ? pendingMessages : undefined;
    await submitAction(selectedAction, params, msgs);
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    dispatch({
      type: 'ADD_MESSAGE',
      message: { to: messageTo, text: messageText.trim() },
    });
    setMessageText('');
    setShowMessageComposer(false);
  };

  const items = yourPlayer.inventory.filter(i =>
    ['medkit', 'grenade', 'trap', 'armor_vest', 'smoke_bomb'].includes(i)
  );

  const getActionSummary = (): string => {
    switch (selectedAction) {
      case 'move': return moveDirection ? `MOVE ${moveDirection} (${moveDistance} tile${moveDistance > 1 ? 's' : ''})` : 'SELECT DIRECTION';
      case 'attack': return targetTile ? `ATTACK (${targetTile.x}, ${targetTile.y}) with ${yourPlayer.equippedWeapon.toUpperCase()}` : 'SELECT TARGET ON MAP';
      case 'loot': return 'LOOT CURRENT TILE';
      case 'hide': return 'HIDE (50% dodge)';
      case 'scout': return 'SCOUT (double vision)';
      case 'use_item': return selectedItem ? `USE ${selectedItem.toUpperCase()}${targetTile ? ` at (${targetTile.x}, ${targetTile.y})` : ''}` : 'SELECT ITEM';
      default: return 'SELECT ACTION';
    }
  };

  const canSubmit = (): boolean => {
    if (!selectedAction || isProcessing || !isActionPhase) return false;
    switch (selectedAction) {
      case 'move': return !!moveDirection;
      case 'attack': return !!targetTile;
      case 'use_item': {
        if (!selectedItem) return false;
        const needsTarget = ['grenade', 'trap', 'smoke_bomb'].includes(selectedItem);
        return needsTarget ? !!targetTile : true;
      }
      case 'loot':
      case 'hide':
      case 'scout':
        return true;
      default: return false;
    }
  };

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Action Buttons Row */}
      <div className="flex gap-2 justify-center flex-wrap">
        {(['move', 'attack', 'loot', 'hide', 'scout', 'use_item'] as ActionType[]).map(action => (
          <button
            key={action}
            onClick={() => handleActionSelect(action)}
            disabled={!isActionPhase || isProcessing}
            className={`
              px-3 py-2 rounded text-sm font-semibold uppercase tracking-wider transition-all
              ${selectedAction === action
                ? 'bg-accent text-black border-accent'
                : 'bg-bg-secondary text-text-secondary border-bg-tertiary hover:border-accent/50'
              }
              border disabled:opacity-30 disabled:cursor-not-allowed
            `}
          >
            <span className="mr-1">{ACTION_ICONS[action]}</span>
            {action === 'use_item' ? 'ITEM' : action.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Joystick for Movement (Mobile) */}
      {selectedAction === 'move' && (
        <div className="flex gap-4 items-center justify-center">
          <div
            ref={joystickRef}
            className="joystick-area relative w-32 h-32 rounded-full border-2 border-bg-tertiary bg-bg-secondary flex items-center justify-center"
            onTouchStart={handleJoystickStart}
            onTouchMove={handleJoystickMove}
            onTouchEnd={handleJoystickEnd}
            onMouseDown={handleJoystickStart}
            onMouseMove={handleJoystickMove}
            onMouseUp={handleJoystickEnd}
            onMouseLeave={handleJoystickEnd}
          >
            {/* Direction indicators */}
            {(Object.entries(DIRECTION_LABELS) as [Direction, string][]).map(([dir, label]) => {
              const vec = DIRECTION_VECTORS[dir];
              return (
                <button
                  key={dir}
                  onClick={() => { setMoveDirection(dir); dispatch({ type: 'SELECT_ACTION', action: 'move' }); }}
                  className={`absolute w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                    ${moveDirection === dir ? 'bg-accent text-black' : 'bg-bg-tertiary text-text-secondary hover:bg-accent/30'}
                  `}
                  style={{
                    transform: `translate(${vec.dx * 40}px, ${vec.dy * 40}px)`,
                  }}
                >
                  {label}
                </button>
              );
            })}
            {/* Center dot */}
            <div className={`w-6 h-6 rounded-full ${joystickActive ? 'bg-accent' : 'bg-bg-tertiary'} transition-all`}
              style={joystickAngle ? { transform: `translate(${joystickAngle.x}px, ${joystickAngle.y}px)` } : {}}
            />
          </div>
          {/* Distance toggle */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setMoveDistance(1)}
              className={`px-3 py-1 rounded text-xs font-bold ${moveDistance === 1 ? 'bg-accent text-black' : 'bg-bg-secondary text-text-secondary'}`}
            >
              1 TILE
            </button>
            <button
              onClick={() => setMoveDistance(2)}
              className={`px-3 py-1 rounded text-xs font-bold ${moveDistance === 2 ? 'bg-accent text-black' : 'bg-bg-secondary text-text-secondary'}`}
            >
              2 TILES
            </button>
          </div>
        </div>
      )}

      {/* Item selector */}
      {selectedAction === 'use_item' && (
        <div className="flex gap-2 justify-center flex-wrap">
          {items.length === 0 ? (
            <p className="text-text-muted text-sm">No usable items in inventory.</p>
          ) : (
            items.map((item, idx) => (
              <button
                key={`${item}-${idx}`}
                onClick={() => setSelectedItem(item as ItemType)}
                className={`px-3 py-2 rounded text-xs font-semibold uppercase
                  ${selectedItem === item ? 'bg-success/30 text-success border-success' : 'bg-bg-secondary text-text-secondary border-bg-tertiary'}
                  border transition-all
                `}
              >
                {item.replace('_', ' ')}
              </button>
            ))
          )}
        </div>
      )}

      {/* Attack hint */}
      {selectedAction === 'attack' && !targetTile && (
        <p className="text-center text-text-muted text-sm">Tap an enemy on the map to target them.</p>
      )}

      {/* Message composer */}
      <div className="flex gap-2 items-center">
        <button
          onClick={() => setShowMessageComposer(!showMessageComposer)}
          className="px-3 py-1 rounded text-xs font-semibold bg-bg-secondary text-text-secondary border border-bg-tertiary hover:border-accent/50"
        >
          💬 MESSAGE {pendingMessages.length > 0 && `(${pendingMessages.length})`}
        </button>
      </div>

      {showMessageComposer && (
        <div className="flex gap-2 items-center bg-bg-secondary p-2 rounded border border-bg-tertiary">
          <select
            value={messageTo}
            onChange={e => setMessageTo(e.target.value)}
            className="bg-bg-tertiary text-text-primary text-xs px-2 py-1 rounded border border-bg-tertiary"
          >
            <option value="all">ALL</option>
            {visiblePlayers.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <input
            type="text"
            value={messageText}
            onChange={e => setMessageText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type message..."
            maxLength={140}
            className="flex-1 bg-bg-tertiary text-text-primary text-sm px-2 py-1 rounded border border-bg-tertiary focus:border-accent outline-none"
          />
          <button
            onClick={handleSendMessage}
            className="px-3 py-1 rounded text-xs font-bold bg-accent text-black"
          >
            SEND
          </button>
        </div>
      )}

      {/* Action summary + Submit */}
      <div className="flex gap-2 items-center">
        <div className="flex-1 text-sm text-text-secondary font-mono bg-bg-secondary px-3 py-2 rounded">
          {getActionSummary()}
        </div>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit()}
          className={`
            px-6 py-2 rounded font-bold uppercase tracking-wider transition-all
            ${canSubmit()
              ? 'bg-accent text-black btn-glow hover:bg-accent/90'
              : 'bg-bg-tertiary text-text-muted cursor-not-allowed'
            }
          `}
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              RESOLVING...
            </span>
          ) : (
            'CONFIRM'
          )}
        </button>
      </div>
    </div>
  );
}
