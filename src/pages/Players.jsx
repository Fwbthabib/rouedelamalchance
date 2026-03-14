import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Link } from 'react-router-dom';
import './Players.css';

export default function Players() {
  const { state, dispatch } = useGame();
  const [newPlayer, setNewPlayer] = useState('');
  const [newRegular, setNewRegular] = useState('');
  const [showAddRegular, setShowAddRegular] = useState(false);

  function handleAdd(e) {
    e.preventDefault();
    const name = newPlayer.trim();
    if (name && !state.players.includes(name)) {
      dispatch({ type: 'ADD_PLAYER', payload: name });
      // Also add as regular player if not already
      if (!state.regularPlayers.some((p) => p.toLowerCase() === name.toLowerCase())) {
        dispatch({ type: 'ADD_REGULAR_PLAYER', payload: name });
      }
      setNewPlayer('');
    }
  }

  function handleAddRegular(e) {
    e.preventDefault();
    const name = newRegular.trim();
    if (name) {
      dispatch({ type: 'ADD_REGULAR_PLAYER', payload: name });
      setNewRegular('');
    }
  }

  function togglePlayer(name) {
    if (state.players.includes(name)) {
      dispatch({ type: 'REMOVE_PLAYER', payload: name });
    } else {
      dispatch({ type: 'ADD_PLAYER', payload: name });
    }
  }

  return (
    <div className="players-page">
      <h1>👥 Gestion des Joueurs</h1>
      <p className="page-desc">Clique sur les vignettes pour ajouter/retirer des joueurs de la partie !</p>

      {state.regularPlayers.length > 0 && (
        <div className="regular-players-section">
          <h3 className="section-title">Joueurs habituels</h3>
          <div className="vignettes-grid">
            {state.regularPlayers.map((name) => {
              const isActive = state.players.includes(name);
              const gageCount = (state.playerGages[name] || []).length;
              return (
                <button
                  key={name}
                  className={`vignette ${isActive ? 'active' : ''}`}
                  onClick={() => togglePlayer(name)}
                >
                  <span className="vignette-name">{name}</span>
                  <span className="vignette-gages">{gageCount} gage{gageCount !== 1 ? 's' : ''}</span>
                  {isActive && <span className="vignette-check">✓</span>}
                </button>
              );
            })}
          </div>
          <div className="regular-actions">
            {!showAddRegular ? (
              <button className="btn btn-add-regular" onClick={() => setShowAddRegular(true)}>
                + Ajouter un joueur habituel
              </button>
            ) : (
              <form onSubmit={handleAddRegular} className="add-regular-form">
                <input
                  type="text"
                  value={newRegular}
                  onChange={(e) => setNewRegular(e.target.value)}
                  placeholder="Pseudo du nouveau joueur habituel..."
                  className="input"
                  maxLength={30}
                  autoFocus
                />
                <button type="submit" className="btn btn-add" disabled={!newRegular.trim()}>
                  +
                </button>
                <button type="button" className="btn btn-cancel-regular" onClick={() => { setShowAddRegular(false); setNewRegular(''); }}>
                  ✕
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="manual-add-section">
        <h3 className="section-title">Ajouter manuellement</h3>
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
      </div>

      <div className="players-count">
        {state.players.length} joueur{state.players.length !== 1 ? 's' : ''} dans la partie
        {state.players.length > 0 && state.players.length % 2 !== 0 && (
          <span className="odd-warning">
            ⚠️ Nombre impair — le 1er de la chauffe sera immunisé
          </span>
        )}
      </div>

      {state.players.length > 0 && (
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
                title="Retirer de la partie"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {state.players.length === 0 && state.regularPlayers.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">🏌️</span>
          <p>Aucun joueur pour l'instant. Ajoute des pseudos !</p>
        </div>
      )}

      {state.players.length >= 2 && (
        <div className="next-step">
          <Link to="/tirage" className="btn btn-next">
            🎡 Étape suivante : Tirage des équipes →
          </Link>
        </div>
      )}
    </div>
  );
}
