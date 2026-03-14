import { useState, useMemo, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import Wheel from '../components/Wheel';
import ScoresSummary from '../components/ScoresSummary';
import { getTeamLabel, computeTeamTotals, findTieBreakInfo } from '../utils/gameHelpers';
import './TeamDraw.css';

export default function TeamDraw() {
  const { state, dispatch } = useGame();
  const [teamSize, setTeamSize] = useState(state.teamSize);
  const [drawMode, setDrawMode] = useState(state.drawMode);
  const [teams, setTeams] = useState(state.currentGameTeams);
  const [remainingPlayers, setRemainingPlayers] = useState([]);
  const [immunePlayer, setImmunePlayer] = useState(state.immunePlayer);
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [tiebreakMode, setTiebreakMode] = useState(false);
  const autoAssignedRef = useRef(false);

  const needsImmune = state.players.length % teamSize !== 0;

  const totalTeams = useMemo(() => {
    const count = state.players.length - (needsImmune && immunePlayer ? 1 : 0);
    return Math.ceil(count / teamSize);
  }, [state.players.length, teamSize, immunePlayer, needsImmune]);

  useEffect(() => {
    if (!started || drawMode !== 'fill' || remainingPlayers.length === 0 || autoAssignedRef.current) return;

    const hasDrawnPlayers = teams.some((t) => t.length > 0);
    if (!hasDrawnPlayers) return;

    const targetIdx = teams.findIndex((t) => t.length < teamSize);
    if (targetIdx === -1) return;

    const slotsInTarget = teamSize - teams[targetIdx].length;

    if (remainingPlayers.length <= slotsInTarget) {
      autoAssignedRef.current = true;
      const newTeams = teams.map((t) => [...t]);
      remainingPlayers.forEach((p) => {
        newTeams[targetIdx].push(p);
      });

      setTeams(newTeams);
      setRemainingPlayers([]);
      setCurrentTeamIndex(targetIdx + 1);
      dispatch({ type: 'SET_CURRENT_GAME_TEAMS', payload: newTeams });
    }
  }, [remainingPlayers, teams, drawMode, started, teamSize, dispatch]);

  function handleStart() {
    let playersForDraw = [...state.players];

    if (needsImmune && immunePlayer) {
      playersForDraw = playersForDraw.filter((p) => p !== immunePlayer);
      dispatch({ type: 'SET_IMMUNE_PLAYER', payload: immunePlayer });
    }

    const numTeams = Math.ceil(playersForDraw.length / teamSize);
    const emptyTeams = Array.from({ length: numTeams }, () => []);

    setTeams(emptyTeams);
    setRemainingPlayers(playersForDraw);
    setStarted(true);
    setCurrentTeamIndex(0);
    autoAssignedRef.current = false;

    dispatch({ type: 'SET_TEAM_SIZE', payload: teamSize });
    dispatch({ type: 'SET_DRAW_MODE', payload: drawMode });
  }

  function handleWheelResult(playerName) {
    setTimeout(() => {
      const newTeams = teams.map((t) => [...t]);
      let nextTeamIndex;

      if (drawMode === 'fill') {
        let targetTeam = 0;
        for (let i = 0; i < newTeams.length; i++) {
          if (newTeams[i].length < teamSize) {
            targetTeam = i;
            break;
          }
        }
        newTeams[targetTeam].push(playerName);
        nextTeamIndex = newTeams[targetTeam].length >= teamSize ? targetTeam + 1 : targetTeam;
      } else {
        newTeams[currentTeamIndex].push(playerName);
        nextTeamIndex = (currentTeamIndex + 1) % newTeams.length;
      }

      const newRemaining = remainingPlayers.filter((p) => p !== playerName);

      setTeams(newTeams);
      setRemainingPlayers(newRemaining);
      setCurrentTeamIndex(nextTeamIndex);
      autoAssignedRef.current = false;

      if (newRemaining.length === 0) {
        dispatch({ type: 'SET_CURRENT_GAME_TEAMS', payload: newTeams });
      }
    }, 500);
  }

  function handleScoreChange(player, value) {
    const score = value === '' ? '' : parseInt(value, 10);
    dispatch({
      type: 'SET_SCORE',
      payload: { player, score: isNaN(score) ? '' : score },
    });
  }

  const teamTotals = useMemo(() => computeTeamTotals(teams, state.scores), [teams, state.scores]);

  const allScoresFilled = teams.length > 0 && remainingPlayers.length === 0 && teams.every((team) =>
    team.length > 0 && team.every((player) => typeof state.scores[player] === 'number')
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

  function getTargetTeamLabel() {
    if (drawMode === 'fill') {
      const idx = teams.findIndex((t) => t.length < teamSize);
      return getTeamLabel(idx >= 0 ? idx : 0);
    }
    return getTeamLabel(currentTeamIndex);
  }

  const drawComplete = started && remainingPlayers.length === 0 && teams.some((t) => t.length > 0);

  return (
    <div className="teamdraw-page">
      <h1>🎡 Tirage des Équipes</h1>

      {!started ? (
        <div className="draw-config">
          <div className="config-section">
            <label>Taille des équipes :</label>
            <div className="size-selector">
              {[2, 3, 4].map((size) => (
                <button
                  key={size}
                  className={`size-btn ${teamSize === size ? 'active' : ''}`}
                  onClick={() => setTeamSize(size)}
                >
                  {size} joueurs
                </button>
              ))}
            </div>
          </div>

          <div className="config-section">
            <label>Mode de tirage :</label>
            <div className="mode-selector">
              <button
                className={`mode-btn ${drawMode === 'fill' ? 'active' : ''}`}
                onClick={() => setDrawMode('fill')}
              >
                <span className="mode-icon">📦</span>
                <span className="mode-label">Remplir par équipe</span>
                <span className="mode-desc">A, A → puis B, B →</span>
              </button>
              <button
                className={`mode-btn ${drawMode === 'roundrobin' ? 'active' : ''}`}
                onClick={() => setDrawMode('roundrobin')}
              >
                <span className="mode-icon">🔄</span>
                <span className="mode-label">Round-robin</span>
                <span className="mode-desc">A, B, C → A, B, C →</span>
              </button>
            </div>
          </div>

          {needsImmune && (
            <div className="config-section">
              <label>⭐ Joueur immunisé (1er de la chauffe) :</label>
              <select
                className="input"
                value={immunePlayer || ''}
                onChange={(e) => setImmunePlayer(e.target.value || null)}
              >
                <option value="">-- Choisir --</option>
                {state.players.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          )}

          <div className="config-preview">
            <p>{state.players.length} joueurs → {totalTeams} équipe{totalTeams > 1 ? 's' : ''} de {teamSize}</p>
            {immunePlayer && <p>⭐ {immunePlayer} est immunisé</p>}
          </div>

          <button
            className="btn btn-start"
            onClick={handleStart}
            disabled={state.players.length < 2 || (needsImmune && !immunePlayer)}
          >
            🎯 Lancer le tirage !
          </button>
        </div>
      ) : (
        <div className="draw-active">
          {immunePlayer && (
            <div className="immune-banner">
              ⭐ {immunePlayer} est immunisé pour cette partie
            </div>
          )}

          <div className="teams-display">
            {teams.map((team, i) => (
              <div
                key={i}
                className={`team-card ${currentTeamIndex === i && remainingPlayers.length > 0 ? 'current' : ''} ${allScoresFilled && i === losingTeamIndex ? 'losing' : ''} ${allScoresFilled && hasTie && tiedTeamIndexes.includes(i) ? 'tied' : ''}`}
              >
                <div className="team-card-header">
                  <h3>Équipe {getTeamLabel(i)}</h3>
                  {drawComplete && <span className="team-total">Total : {teamTotals[i]} coups</span>}
                </div>
                <div className="team-members">
                  {team.map((member) => (
                    <div key={member} className="member-row">
                      <span className="member-badge">{member}</span>
                      {drawComplete && (
                        <input
                          type="number"
                          min="0"
                          value={state.scores[member] ?? ''}
                          onChange={(e) => handleScoreChange(member, e.target.value)}
                          placeholder="Score"
                          className="input score-input-inline"
                        />
                      )}
                    </div>
                  ))}
                  {team.length < teamSize && remainingPlayers.length > 0 && (
                    <span className="member-placeholder">?</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {remainingPlayers.length > 1 ? (
            <>
              <div className="draw-info">
                <p>Tirage → Équipe {getTargetTeamLabel()}</p>
                <p className="remaining-count">
                  {remainingPlayers.length} joueurs restants
                </p>
              </div>
              <Wheel items={remainingPlayers} onResult={handleWheelResult} />
            </>
          ) : remainingPlayers.length === 1 ? (
            <div className="draw-last-player">
              <p>Dernier joueur : <strong>{remainingPlayers[0]}</strong></p>
              <button className="btn btn-start" onClick={() => handleWheelResult(remainingPlayers[0])}>
                ✅ Placer dans l'équipe {getTargetTeamLabel()}
              </button>
            </div>
          ) : (
            <div className="draw-scores-section">
              <h2>🎉 Tirage terminé !</h2>
              <p className="scores-instruction">Entre les scores de chaque joueur — au golf, le plus de coups = les perdants !</p>

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

              <div className="draw-complete-actions">
                <button className="btn btn-start" onClick={() => { setStarted(false); autoAssignedRef.current = false; }}>
                  🔄 Refaire le tirage
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
