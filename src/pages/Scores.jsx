import { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { Link } from 'react-router-dom';
import ScoresSummary from '../components/ScoresSummary';
import { getTeamLabel, computeTeamTotals, findTieBreakInfo } from '../utils/gameHelpers';
import './Scores.css';

export default function Scores() {
  const { state, dispatch } = useGame();
  const teams = state.currentGameTeams;
  const [tiebreakMode, setTiebreakMode] = useState(false);

  function handleScoreChange(player, value) {
    const score = value === '' ? '' : parseInt(value, 10);
    dispatch({
      type: 'SET_SCORE',
      payload: { player, score: isNaN(score) ? '' : score },
    });
  }

  const teamTotals = useMemo(() => computeTeamTotals(teams, state.scores), [teams, state.scores]);

  const allScoresFilled = teams.length > 0 && teams.every((team) =>
    team.every((player) => typeof state.scores[player] === 'number')
  );

  const { tiedTeamIndexes, hasTie, losingTeamIndex } = useMemo(
    () => findTieBreakInfo(teamTotals, allScoresFilled),
    [teamTotals, allScoresFilled]
  );

  function handleDesignateLosers(teamIndex) {
    dispatch({ type: 'SET_LOSING_TEAM', payload: teamIndex });
    dispatch({
      type: 'SET_TEAM_SCORES',
      payload: teamTotals.reduce((acc, total, i) => ({ ...acc, [i]: total }), {}),
    });
  }

  function handleTiebreakResult(teamName) {
    const teamIndex = teamName.charCodeAt(teamName.length - 1) - 65;
    handleDesignateLosers(teamIndex);
    setTiebreakMode(false);
  }

  if (teams.length === 0) {
    return (
      <div className="scores-page">
        <h1>📊 Scores de la Partie</h1>
        <div className="empty-state">
          <span className="empty-icon">🎡</span>
          <p>Fais d'abord le tirage des équipes !</p>
          <Link to="/tirage" className="btn btn-next">🎡 Aller au tirage</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="scores-page">
      <h1>📊 Scores de la Partie</h1>
      <Link to="/tirage" className="btn-back">← Tirage</Link>
      <p className="page-desc">
        Récap des scores par équipe — le plus de coups = les perdants !
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
            className={`score-team-card ${allScoresFilled && teamIndex === losingTeamIndex ? 'losing' : ''} ${allScoresFilled && hasTie && tiedTeamIndexes.includes(teamIndex) ? 'tied' : ''}`}
          >
            <div className="score-team-header">
              <h3>
                Équipe {getTeamLabel(teamIndex)}
                {allScoresFilled && teamIndex === losingTeamIndex && <span className="team-status-badge losing-badge">Perdants</span>}
                {allScoresFilled && hasTie && tiedTeamIndexes.includes(teamIndex) && <span className="team-status-badge tied-badge">Égalité</span>}
              </h3>
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
        <ScoresSummary
          teamTotals={teamTotals}
          tiedTeamIndexes={tiedTeamIndexes}
          hasTie={hasTie}
          losingTeamIndex={losingTeamIndex}
          tiebreakMode={tiebreakMode}
          setTiebreakMode={setTiebreakMode}
          losingTeam={state.losingTeam}
          onDesignateLosers={handleDesignateLosers}
          onTiebreakResult={handleTiebreakResult}
        />
      )}
    </div>
  );
}
