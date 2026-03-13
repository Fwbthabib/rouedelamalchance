import { useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { Link } from 'react-router-dom';
import './Scores.css';

export default function Scores() {
  const { state, dispatch } = useGame();
  const teams = state.currentGameTeams;

  function handleScoreChange(player, value) {
    const score = value === '' ? '' : parseInt(value, 10);
    dispatch({
      type: 'SET_SCORE',
      payload: { player, score: isNaN(score) ? '' : score },
    });
  }

  const teamTotals = useMemo(() => {
    return teams.map((team) =>
      team.reduce((sum, player) => {
        const score = state.scores[player];
        return sum + (typeof score === 'number' ? score : 0);
      }, 0)
    );
  }, [teams, state.scores]);

  const allScoresFilled = teams.length > 0 && teams.every((team) =>
    team.every((player) => typeof state.scores[player] === 'number')
  );

  const maxScore = allScoresFilled ? Math.max(...teamTotals) : 0;
  const losingTeamIndex = allScoresFilled ? teamTotals.indexOf(maxScore) : -1;

  function handleDesignateLosers() {
    if (losingTeamIndex >= 0) {
      dispatch({ type: 'SET_LOSING_TEAM', payload: losingTeamIndex });
      dispatch({
        type: 'SET_TEAM_SCORES',
        payload: teamTotals.reduce((acc, total, i) => ({ ...acc, [i]: total }), {}),
      });
    }
  }

  function getTeamLabel(index) {
    return String.fromCharCode(65 + index);
  }

  if (teams.length === 0) {
    return (
      <div className="scores-page">
        <h1>📊 Scores de la Partie</h1>
        <div className="empty-state">
          <span className="empty-icon">🎡</span>
          <p>Fais d'abord le tirage des équipes !</p>
        </div>
      </div>
    );
  }

  return (
    <div className="scores-page">
      <h1>📊 Scores de la Partie</h1>
      <p className="page-desc">
        Entre les scores individuels — au golf, le plus de coups = les perdants !
      </p>

      {state.immunePlayer && (
        <div className="immune-reminder">
          ⭐ {state.immunePlayer} est immunisé — pas dans les équipes
        </div>
      )}

      <div className="scores-teams">
        {teams.map((team, teamIndex) => (
          <div
            key={teamIndex}
            className={`score-team-card ${allScoresFilled && teamIndex === losingTeamIndex ? 'losing' : ''}`}
          >
            <div className="score-team-header">
              <h3>Équipe {getTeamLabel(teamIndex)}</h3>
              <span className="team-total">Total : {teamTotals[teamIndex]} coups</span>
            </div>
            <div className="score-inputs">
              {team.map((player) => (
                <div key={player} className="score-input-row">
                  <span className="score-player-name">{player}</span>
                  <input
                    type="number"
                    min="0"
                    value={state.scores[player] ?? ''}
                    onChange={(e) => handleScoreChange(player, e.target.value)}
                    placeholder="Score"
                    className="input score-input"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {allScoresFilled && (
        <div className="scores-summary">
          <div className="summary-card">
            <h3>🏆 Résumé</h3>
            {teamTotals.map((total, i) => (
              <div key={i} className={`summary-row ${i === losingTeamIndex ? 'loser' : ''}`}>
                <span>Équipe {getTeamLabel(i)}</span>
                <span className="summary-score">{total} coups</span>
                {i === losingTeamIndex && <span className="loser-tag">💀 PERDANTS</span>}
              </div>
            ))}
          </div>

          {state.losingTeam === null ? (
            <button className="btn btn-designate" onClick={handleDesignateLosers}>
              😈 Désigner les perdants → Roue de la Malchance
            </button>
          ) : (
            <div className="already-designated">
              Les perdants sont désignés ! <Link to="/malchance">Direction la Roue de la Malchance 😈</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
