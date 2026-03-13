import { useGame } from '../context/GameContext';
import './History.css';

export default function History() {
  const { state } = useGame();

  function formatDate(isoString) {
    return new Date(isoString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  return (
    <div className="history-page">
      <h1>📜 Historique des Parties</h1>

      {state.lastLosers.length > 0 && (
        <div className="last-losers-card">
          <h2>💀 Nullards de la dernière fois</h2>
          <div className="last-losers-list">
            {state.lastLosers.map((loser) => (
              <span key={loser} className="last-loser-badge">{loser}</span>
            ))}
          </div>
        </div>
      )}

      {state.history.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📜</span>
          <p>Aucune partie enregistrée pour l'instant. Jouez d'abord !</p>
        </div>
      ) : (
        <div className="history-list">
          {state.history.map((entry, index) => (
            <div key={index} className="history-card">
              <div className="history-header">
                <span className="history-date">{formatDate(entry.date)}</span>
                <span className="history-badge">Partie #{state.history.length - index}</span>
              </div>

              <div className="history-teams">
                {entry.teams.map((team) => (
                  <div key={team.name} className="history-team">
                    <span className="history-team-name">Équipe {team.name}</span>
                    <span className="history-team-players">{team.players.join(', ')}</span>
                    <span className="history-team-score">{team.score} coups</span>
                  </div>
                ))}
              </div>

              {entry.immunePlayer && (
                <div className="history-immune">⭐ Immunisé : {entry.immunePlayer}</div>
              )}

              <div className="history-gages">
                <h4>💀 Gages distribués :</h4>
                {entry.gages.map(({ player, gage }, i) => (
                  <div key={i} className="history-gage">
                    <span className="history-gage-player">{player}</span>
                    <span className="history-gage-arrow">→</span>
                    <span className="history-gage-text">{gage}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
