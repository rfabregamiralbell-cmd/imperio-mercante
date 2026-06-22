// ============================================================
// BANK PANEL — credit: take loans for capital, repay with interest
// ============================================================

import { useGame } from '../../state/GameContext.jsx';
import BottomSheet from '../ui/BottomSheet.jsx';

const OFFERS = [
  { principal: 500, rate: 12, term: 10, label: 'Préstamo pequeño' },
  { principal: 1500, rate: 18, term: 12, label: 'Préstamo mediano' },
  { principal: 4000, rate: 25, term: 15, label: 'Préstamo mayor' },
];

export default function BankPanel() {
  const { state, dispatch } = useGame();
  const totalDebt = state.loans.reduce((sum, l) => sum + l.due, 0);

  return (
    <BottomSheet title="🏦 Banca" subtitle={totalDebt > 0 ? `Deuda total: ${totalDebt}🪙` : 'Sin deudas'} onClose={() => dispatch({ type: 'CLOSE_SHEET' })}>
      {state.loans.length > 0 && (
        <>
          <div className="section-label">Tus deudas</div>
          {state.loans.map((l) => (
            <div className="row" key={l.id}>
              <span>Préstamo de {l.principal}🪙 · {l.rate}%</span>
              <span>
                <span className="warn" style={{ marginRight: 8 }}>debes {l.due}🪙</span>
                <button className="btn small" disabled={state.resources.oro.amount < l.due}
                  onClick={() => dispatch({ type: 'REPAY_LOAN', loanId: l.id })}>Saldar</button>
              </span>
            </div>
          ))}
          <p className="muted small" style={{ marginTop: 6 }}>El interés se acumula cada ciclo si no saldas. Devuelve pronto.</p>
        </>
      )}

      <div className="section-label">Pedir crédito</div>
      <p className="muted small">El crédito te da capital ahora para invertir en barcos y rutas. Lo devuelves con interés.</p>
      <div className="card-grid">
        {OFFERS.map((o) => (
          <div key={o.principal} className="card">
            <div className="card-head">
              <span className="card-icon">💰</span>
              <div>
                <div className="card-name">{o.label}</div>
                <div className="card-desc">Recibes {o.principal}🪙 · interés {o.rate}% → devuelves {Math.round(o.principal * (1 + o.rate / 100))}🪙</div>
              </div>
            </div>
            <button className="btn primary block" disabled={totalDebt > 5000}
              onClick={() => dispatch({ type: 'TAKE_LOAN', principal: o.principal, rate: o.rate, term: o.term })}>
              Solicitar
            </button>
          </div>
        ))}
      </div>
    </BottomSheet>
  );
}
