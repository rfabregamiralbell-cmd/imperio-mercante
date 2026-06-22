// ============================================================
// GAME CONTEXT — provider, tick loop, autosave to localStorage
// ============================================================

import { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { gameReducer } from './gameReducer.js';
import { createInitialState } from './initialState.js';

const GameContext = createContext(null);
const SAVE_KEY = 'imperio-mercante-save';

function init() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return gameReducer(createInitialState(), { type: 'LOAD_STATE', state: JSON.parse(raw) });
  } catch (e) { /* ignore corrupt save */ }
  return createInitialState();
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, init);
  const saveRef = useRef(0);

  // Economy tick every second
  useEffect(() => {
    const id = setInterval(() => dispatch({ type: 'TICK', now: Date.now() }), 1000);
    return () => clearInterval(id);
  }, []);

  // Autosave (throttled)
  useEffect(() => {
    const now = Date.now();
    if (now - saveRef.current < 2000) return;
    saveRef.current = now;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { /* quota */ }
  }, [state]);

  return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
