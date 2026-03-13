import { useState } from 'react';
import { useGame } from '../context/GameContext';
import Wheel from '../components/Wheel';
import './Malchance.css';

export default function Malchance() {
  const { state, dispatch } = useGame();
  const [newGage, setNewGage] = useState('');
  const [currentLoserIndex, setCurrentLoserIndex] = useState(0);
  const [assignedGages, setAssignedGages] = useState([]);
  const [allDone, setAllDone] = useState(false);
  const [managingGages, setManagingGages] = useState(false);

  const losingTeam = state.losingTeam !== null ? state.currentGameTeams[state.losingTeam] : [];

  function handleAddGage(e) {
    e.preventDefault();
    const gage = newGage.trim();
    if (gage) {
      dispatch({ type: 'ADD_GAGE', payload: gage });
      setNewGage('');
    }
  }

  function handleGageResult(gage) {
    const player = losingTeam[currentLoserIndex];
    const newAssigned = [...assignedGages, { player, gage }];
    setAssignedGages(newAssigned);

    if (currentLoserIndex + 1 >= losingTeam.length) {
      setAllDone(true);
      const historyEntry = {
        date: new Date().toISOString(),
        losers: [...losingTeam],
        gages: newAssigned,
        teams: state.currentGameTeams.map((t, i) => ({
          name: String.fromCharCode(65 + i),
          players: [...t],
          score: state.teamScores[i] || 0,
        })),
        scores: { ...state.scores },
        immunePlayer: state.immunePlayer,
      };
      dispatch({ type: 'ADD_HISTORY_ENTRY', payload: historyEntry });
    } else {
      setCurrentLoserIndex(currentLoserIndex + 1);
    }
  }

  function getTeamLabel(index) {
    return String.fromCharCode(65 + index);
  }

  return (
    <div className="malchance-page">
      <h1>😈 Roue de la Malchance</h1>

      <button
        className="btn btn-manage-gages"
        onClick={() => setManagingGages(!managingGages)}
      >
        {managingGages ? '✕ Fermer' : '⚙️ Gérer les gages'}
      </button>

      {managingGages && (
        <div className="gages-manager">
          <form onSubmit={handleAddGage} className="gage-form">
            <input
              type="text"
              value={newGage}
              onChange={(e) => setNewGage(e.target.value)}
              placeholder="Nouveau gage..."
              className="input"
            />
            <button type="submit" className="btn btn-add" disabled={!newGage.trim()}>
              + Ajouter
            </button>
          </form>
          <div className="gages-list">
            {state.gages.map((gage) => (
              <div key={gage} className="gage-item">
                <span>{gage}</span>
                <button className="btn-remove" onClick={() => dispatch({ type: 'REMOVE_GAGE', payload: gage })}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {state.losingTeam === null ? (
        <div className="empty-state">
          <span className="empty-icon">📊</span>
          <p>Il faut d'abord renseigner les scores et désigner les perdants !</p>
        </div>
      ) : state.gages.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📝</span>
          <p>Ajoute des gages dans la roue d'abord !</p>
        </div>
      ) : !allDone ? (
        <div className="malchance-active">
          <div className="losing-team-banner">
            <h2>💀 Équipe {getTeamLabel(state.losingTeam)} — Les Perdants</h2>
            <div className="loser-badges">
              {losingTeam.map((player, i) => (
                <span
                  key={player}
                  className={`loser-badge-mal ${i === currentLoserIndex ? 'current' : ''} ${i < currentLoserIndex ? 'done' : ''}`}
                >
                  {player}
                  {assignedGages.find((a) => a.player === player) && ' ✓'}
                </span>
              ))}
            </div>
          </div>

          <div className="current-spinner">
            <h3>🎰 C'est au tour de : <strong>{losingTeam[currentLoserIndex]}</strong></h3>
            <Wheel
              items={state.gages}
              onResult={handleGageResult}
              title={`Gage pour ${losingTeam[currentLoserIndex]}`}
            />
          </div>

          {assignedGages.length > 0 && (
            <div className="assigned-list">
              <h3>Gages attribués :</h3>
              {assignedGages.map(({ player, gage }, i) => (
                <div key={i} className="assigned-item">
                  <span className="assigned-player">{player}</span>
                  <span className="assigned-arrow">→</span>
                  <span className="assigned-gage">{gage}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="malchance-complete">
          <h2>🎉 Tous les gages sont distribués !</h2>
          <div className="final-gages">
            {assignedGages.map(({ player, gage }, i) => (
              <div key={i} className="final-gage-card">
                <span className="final-player">{player}</span>
                <span className="final-gage">{gage}</span>
              </div>
            ))}
          </div>
          <p className="good-luck">Bon courage les nullards ! 💀</p>
        </div>
      )}
    </div>
  );
}
