import { Link } from 'react-router-dom';
import Wheel from './Wheel';
import { getTeamLabel } from '../utils/gameHelpers';

export default function ScoresSummary({
  teamTotals,
  tiedTeamIndexes,
  hasTie,
  losingTeamIndex,
  tiebreakMode,
  setTiebreakMode,
  losingTeam,
  onDesignateLosers,
  onTiebreakResult,
  teams,
  playerGages,
}) {
  // Check if any losing team player has 0 gages
  const losingTeamPlayers = losingTeam !== null && teams ? teams[losingTeam] : [];
  const playersWithNoGages = losingTeamPlayers.filter(
    (p) => playerGages && (!playerGages[p] || playerGages[p].length === 0)
  );

  return (
    <div className="scores-summary">
      <div className="summary-card">
        <h3>🏆 Résumé</h3>
        {teamTotals.map((total, i) => (
          <div key={i} className={`summary-row ${i === losingTeamIndex ? 'loser' : ''} ${hasTie && tiedTeamIndexes.includes(i) ? 'tied' : ''}`}>
            <span>Équipe {getTeamLabel(i)}</span>
            <span className="summary-score">{total} coups</span>
            {i === losingTeamIndex && <span className="loser-tag">💀 PERDANTS</span>}
            {hasTie && tiedTeamIndexes.includes(i) && <span className="tie-tag">⚔️ ÉGALITÉ</span>}
          </div>
        ))}
      </div>

      {hasTie && !tiebreakMode && losingTeam === null && (
        <div className="tie-section">
          <p className="tie-message">⚔️ Égalité entre {tiedTeamIndexes.map((i) => `Équipe ${getTeamLabel(i)}`).join(' et ')} !</p>
          <button className="btn btn-tiebreak" onClick={() => setTiebreakMode(true)}>
            🎡 Départager à la roue !
          </button>
        </div>
      )}

      {tiebreakMode && (
        <div className="tiebreak-wheel">
          <h3>⚔️ Roue de départage</h3>
          <p>L'équipe tirée sera désignée perdante !</p>
          <Wheel
            items={tiedTeamIndexes.map((i) => `Équipe ${getTeamLabel(i)}`)}
            onResult={onTiebreakResult}
            title="Qui sont les perdants ?"
          />
        </div>
      )}

      {!hasTie && losingTeam === null && (
        <button className="btn btn-designate" onClick={() => onDesignateLosers(losingTeamIndex)}>
          😈 Désigner les perdants → Roue de la Malchance
        </button>
      )}

      {losingTeam !== null && (
        <div className="already-designated">
          💀 Équipe {getTeamLabel(losingTeam)} désignée perdante !
          {playersWithNoGages.length > 0 && (
            <div className="no-gages-alert">
              ⚠️ {playersWithNoGages.join(', ')} n'{playersWithNoGages.length > 1 ? 'ont' : 'a'} aucun gage dans sa roue ! Ajoute-en sur la page Malchance avant de tourner.
            </div>
          )}
          <Link to="/malchance" className="btn btn-next">😈 Aller à la Roue de la Malchance</Link>
        </div>
      )}
    </div>
  );
}
