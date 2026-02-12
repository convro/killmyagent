'use client';

import React, { useState } from 'react';
import { useGame } from '../GameContext';
import { ActionType, ItemType } from '@/types/game';

interface ActionControlsProps {
  onItemTargetMode: (item: ItemType) => void;
  itemTargeting: ItemType | null;
  onCancelItemTarget: () => void;
}

export default function ActionControls({ onItemTargetMode, itemTargeting, onCancelItemTarget }: ActionControlsProps) {
  const { state, dispatch, submitAction } = useGame();
  const { playerView, isProcessing } = state;
  const [showItems, setShowItems] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [msgText, setMsgText] = useState('');
  const [msgTo, setMsgTo] = useState('all');

  if (!playerView || playerView.phase === 'finished') return null;
  const { yourPlayer, visiblePlayers } = playerView;
  if (!yourPlayer.alive) return null;

  const isAction = playerView.phase === 'action';
  const disabled = !isAction || isProcessing;

  const items = yourPlayer.inventory.filter((i): i is ItemType =>
    ['medkit', 'grenade', 'trap', 'armor_vest', 'smoke_bomb'].includes(i)
  );

  const quickAction = async (action: ActionType) => {
    if (disabled) return;
    await submitAction(action, {});
  };

  const useItem = async (item: ItemType) => {
    if (disabled) return;
    const needsTarget = ['grenade', 'trap', 'smoke_bomb'].includes(item);
    if (needsTarget) {
      onItemTargetMode(item);
      setShowItems(false);
    } else {
      await submitAction('use_item', { item });
      setShowItems(false);
    }
  };

  const sendMessage = () => {
    if (!msgText.trim()) return;
    dispatch({
      type: 'ADD_MESSAGE',
      message: { to: msgTo, text: msgText.trim() },
    });
    setMsgText('');
    setShowMessage(false);
  };

  return (
    <div className="action-bar">
      {/* Item targeting banner */}
      {itemTargeting && (
        <div className="flex items-center justify-center gap-3 px-4 py-2 bg-warning/20 border-b border-warning/30">
          <span className="text-xs font-bold text-warning uppercase tracking-wider">
            Click a tile to use {itemTargeting.replace('_', ' ')}
          </span>
          <button
            onClick={onCancelItemTarget}
            className="text-xs px-2 py-0.5 rounded bg-warning/20 text-warning border border-warning/40 hover:bg-warning/30"
          >
            CANCEL
          </button>
        </div>
      )}

      {/* Hint text */}
      {!itemTargeting && isAction && !isProcessing && (
        <div className="text-center py-1.5 text-[10px] text-text-muted uppercase tracking-wider">
          Tap a tile to move &middot; Tap an enemy to attack
        </div>
      )}

      {/* Main action buttons */}
      <div className="flex items-center justify-center gap-2 px-3 py-2">
        <button
          onClick={() => quickAction('hide')}
          disabled={disabled}
          className="action-btn"
          title="Hide in place (50% dodge)"
        >
          <span className="action-icon">🫥</span>
          <span>HIDE</span>
        </button>

        <button
          onClick={() => quickAction('scout')}
          disabled={disabled}
          className="action-btn"
          title="Scout (2x vision)"
        >
          <span className="action-icon">👁</span>
          <span>SCOUT</span>
        </button>

        <button
          onClick={() => quickAction('loot')}
          disabled={disabled}
          className="action-btn"
          title="Loot current tile"
        >
          <span className="action-icon">📦</span>
          <span>LOOT</span>
        </button>

        {/* Items */}
        <div className="relative">
          <button
            onClick={() => setShowItems(!showItems)}
            disabled={disabled || items.length === 0}
            className={`action-btn ${showItems ? 'action-btn-active' : ''}`}
            title="Use an item"
          >
            <span className="action-icon">💊</span>
            <span>ITEM{items.length > 0 ? ` (${items.length})` : ''}</span>
          </button>
          {showItems && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-bg-secondary border border-bg-tertiary rounded-lg p-2 min-w-[140px] z-50">
              {items.map((item, i) => (
                <button
                  key={`${item}-${i}`}
                  onClick={() => useItem(item)}
                  className="w-full text-left px-3 py-2 text-xs font-bold uppercase hover:bg-accent/10 rounded transition-colors text-text-secondary hover:text-accent"
                >
                  {item.replace('_', ' ')}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Message toggle */}
        <button
          onClick={() => setShowMessage(!showMessage)}
          disabled={disabled}
          className={`action-btn ${showMessage ? 'action-btn-active' : ''}`}
        >
          <span className="action-icon">💬</span>
          <span>MSG</span>
        </button>

        {/* Weapon display */}
        <div className="ml-2 px-3 py-1.5 bg-bg-tertiary rounded border border-accent/20 text-xs font-bold text-accent uppercase">
          {yourPlayer.equippedWeapon}
        </div>
      </div>

      {/* Message composer */}
      {showMessage && (
        <div className="flex gap-2 items-center px-3 pb-2">
          <select
            value={msgTo}
            onChange={e => setMsgTo(e.target.value)}
            className="bg-bg-tertiary text-text-primary text-xs px-2 py-1.5 rounded border border-bg-tertiary"
          >
            <option value="all">ALL</option>
            {visiblePlayers.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <input
            type="text"
            value={msgText}
            onChange={e => setMsgText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Type message..."
            maxLength={140}
            className="flex-1 bg-bg-tertiary text-text-primary text-xs px-2 py-1.5 rounded border border-bg-tertiary focus:border-accent outline-none"
          />
          <button
            onClick={sendMessage}
            className="px-3 py-1.5 rounded text-xs font-bold bg-accent text-black"
          >
            SEND
          </button>
        </div>
      )}

      {/* Processing indicator */}
      {isProcessing && (
        <div className="flex items-center justify-center gap-2 px-4 py-2 border-t border-accent/20">
          <div className="w-3 h-3 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          <span className="text-xs font-bold text-accent uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Agents reasoning...
          </span>
        </div>
      )}
    </div>
  );
}
