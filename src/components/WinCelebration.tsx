import Confetti from "./Confetti";

interface Props {
  playerName: string;
  onDismiss: () => void;
}

export default function WinCelebration({ playerName, onDismiss }: Props) {
  return (
    <div className="win-overlay" onClick={onDismiss} role="alert">
      <Confetti />
      <div className="win-message">
        <p className="win-kicker">¡Lotería!</p>
        <p className="win-name">{playerName}</p>
        <p className="win-hint">Tocá para seguir viendo tu cartón</p>
      </div>
    </div>
  );
}
