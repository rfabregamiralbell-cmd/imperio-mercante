import { useGame } from '../../state/GameContext.jsx';

export default function Notifications() {
  const { state } = useGame();
  return (
    <div className="notifs">
      {state.notifications.slice(-3).map((n) => (
        <div key={n.id} className={`notif ${n.type}`}>{n.message}</div>
      ))}
    </div>
  );
}
