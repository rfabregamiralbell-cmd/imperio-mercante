import { useGame } from '../../state/GameContext.jsx';
import BottomSheet from '../ui/BottomSheet.jsx';

export default function WorldPanel() {
  const { state, dispatch } = useGame();
  const myPorts = state.ports.filter((p) => p.owner === 'player').length;
  const rivalPorts = state.ports.filter((p) => p.owner && p.owner !== 'player').length;
  const myVias = state.nodes.filter((n) => n.owner === 'player' && (n.control || 0) >= 0.5).length;

  return (
    <BottomSheet title="🌍 Mundo" subtitle="Logística en dos capas" onClose={() => dispatch({ type: 'CLOSE_SHEET' })}>
      <div className="row"><span>⚓ Tus puertos</span><span className="good">{myPorts}</span></div>
      <div className="row"><span>🚉 Vías que controlas</span><span className="good">{myVias}</span></div>
      <div className="row"><span>⚑ Puertos rivales</span><span className="bad">{rivalPorts}</span></div>
      <div className="row"><span>🧭 Rutas marítimas</span><span>{state.seaRoutes.length}</span></div>

      <div className="section-label">Cómo se juega</div>
      <p className="muted small">
        <b>Tierra:</b> el interior produce materiales que llegan al puerto por <b>vías</b> (las líneas del mapa).
        Toca un nodo interior 🚉 y <b>trabaja su vía</b> hasta poseerla — se ilumina con tu color y su producción fluye a tu puerto.
        Mantén la vía pagando su coste o la perderás.
      </p>
      <p className="muted small" style={{ marginTop: 8 }}>
        <b>Mar:</b> toca un puerto ⚓ para ver su <b>mercado</b> y comerciar. Crea <b>rutas marítimas</b> 🧭 entre puertos,
        defiéndelas y <b>conquista</b> puertos rivales con tu <b>flota</b> 🚢. Usa la <b>banca</b> 🏦 para invertir.
      </p>
    </BottomSheet>
  );
}
