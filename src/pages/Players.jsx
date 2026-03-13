import { useState } from 'react';
import { useGame } from '../context/GameContext';
import './Players.css';

export default function Players() {
  const { state, dispatch } = useGame();
  const [newPlayer, setNewPlayer] = useState('');

  function handleAdd(e) {
    e.preventDefault();
    const name = newPlayer.trim();
    if (name && !state.players.includes(name)) {
      dispatch({ type: 'ADD_PLAYER', payload: name });
      setNewPlayer('');
    }
  }

  return (
    <div className="players-page">
      <h1>👥 Gestion des Joueurs</h1>
      <p className="page-desc">Ajoute les pseudos de tous les participants du dimanche !</p>

      <form onSubmit={handleAdd} className="player-form">
        <input
          type="text"
          value={newPlayer}
          onChange={(e) => setNewPlayer(e.target.value)}
          placeholder="Pseudo du joueur..."
          className="input"
          maxLength={30}
        />
        <button type="submit" className="btn btn-add" disabled={!newPlayer.trim()}>
          + Ajouter
        </button>
      </form>

      <div className="players-count">
        {state.players.length} joueur{state.players.length !== 1 ? 's' : ''}
        {state.players.length > 0 && state.players.length % 2 !== 0 && (
          <span className="odd-warning">
            ⚠️ Nombre impair — le 1er de la chauffe sera immunisé
          </span>
        )}
      </div>

      <div className="players-list">
        {state.players.map((player, i) => (
          <div key={player} className="player-card" style={{ animationDelay: `${i * 0.05}s` }}>
            <span className="player-name">{player}</span>
            <div className="player-score-section">
              <input
                type="number"
                min="0"
                value={state.scores[player] ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  const score = val === '' ? '' : parseInt(val, 10);
                  dispatch({
                    type: 'SET_SCORE',
                    payload: { player, score: isNaN(score) ? '' : score },
                  });
                }}
                placeholder="Score"
                className="input player-score-input"
              />
              <span className="score-label">coups</span>
            </div>
            <button
              className="btn-remove"
              onClick={() => dispatch({ type: 'REMOVE_PLAYER', payload: player })}
              title="Supprimer"
            >
              ✕
            </button>
          </div>
        ))}
        {state.players.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">🏌️</span>
            <p>Aucun joueur pour l'instant. Ajoute des pseudos !</p>
          </div>
        )}
      </div>
    </div>
  );
}
