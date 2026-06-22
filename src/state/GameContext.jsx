import { createContext, useContext, useReducer, useEffect } from 'react';
import { createInitialState, reducer } from './gameState.js';

const Ctx = createContext(null);
const KEY = 'imperio-mercante-save';

function init() {
  try { const raw = localStorage.getItem(KEY); if (raw) return { ...createInitialState(), ...JSON.parse(raw) }; }
  catch (e) { /* ignore */ }
  return createInitialState();
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, init);
  useEffect(() => {
    const id = setInterval(() => dispatch({ type: 'TICK', now: Date.now() }), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* quota */ }
  }, [state]);
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}
export function useGame() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useGame fuera de GameProvider');
  return c;
}
