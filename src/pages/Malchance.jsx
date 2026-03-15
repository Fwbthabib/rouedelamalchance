import { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { useToast } from '../context/ToastContext';
import { Link } from 'react-router-dom';
import Wheel from '../components/Wheel';
import { playFiestaSound } from '../hooks/useSounds';
import { SPECIAL_RIEN, SPECIAL_X2 } from '../utils/constants';
import { getTeamLabel } from '../utils/gameHelpers';
import './Malchance.css';

const MAX_UNDO_STACK = 50;

export default function Malchance() {
  const { state, dispatch } = useGame();
  const addToast = useToast();
  const [newGage, setNewGage] = useState('');
  const [gageToDelete, setGageToDelete] = useState(null);
  const [newCategory, setNewCategory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentLoserIndex, setCurrentLoserIndex] = useState(0);
  const [assignedGages, setAssignedGages] = useState([]);
  const [allDone, setAllDone] = useState(false);
  const [managingGages, setManagingGages] = useState(false);
  const [managingPlayerGages, setManagingPlayerGages] = useState(null);
  const [filterCategory, setFilterCategory] = useState('Toutes');
  const [newPlayerGage, setNewPlayerGage] = useState('');
  const [newPlayerGageCategory, setNewPlayerGageCategory] = useState('');
  const [extraSpins, setExtraSpins] = useState(0);
  const [wheelKey, setWheelKey] = useState(0);
  // Undo stack: each entry is { assignedGages, currentLoserIndex, extraSpins, consumedGage? }
  const [undoStack, setUndoStack] = useState([]);

  const losingTeam = state.losingTeam !== null ? state.currentGameTeams[state.losingTeam] : [];
  const categories = state.gageCategories || ['Films', 'Spectacles', 'Exposés', 'Divers'];

  const filteredGages = useMemo(
    () => filterCategory === 'Toutes' ? state.gages : state.gages.filter((g) => g.category === filterCategory),
    [state.gages, filterCategory]
  );

  // Get current player's personal gages for the wheel + special items
  const currentPlayer = losingTeam[currentLoserIndex];
  const currentPlayerGages = currentPlayer ? (state.playerGages[currentPlayer] || []) : [];
  const currentPlayerGageTexts = currentPlayerGages.map((g) => g.text);

  // x2 mode: NO "Rien" and NO "x2" on the wheel — only real gages
  const wheelItems = extraSpins > 0
    ? [...currentPlayerGageTexts]
    : [...currentPlayerGageTexts, SPECIAL_RIEN, SPECIAL_X2];

  function handleAddGage(e) {
    e.preventDefault();
    const text = newGage.trim();
    const category = selectedCategory || 'Divers';
    if (text) {
      dispatch({ type: 'ADD_GAGE', payload: { text, category } });
      setNewGage('');
    }
  }

  function handleAddCategory(e) {
    e.preventDefault();
    const cat = newCategory.trim();
    if (cat) {
      dispatch({ type: 'ADD_GAGE_CATEGORY', payload: cat });
      setNewCategory('');
    }
  }

  function handleAddPlayerGage(e, playerName) {
    e.preventDefault();
    const text = newPlayerGage.trim();
    const category = newPlayerGageCategory || 'Divers';
    if (text) {
      dispatch({ type: 'ADD_PLAYER_GAGE', payload: { player: playerName, gage: { text, category } } });
      setNewPlayerGage('');
    }
  }

  function handleAddAllGlobalGages(playerName) {
    state.gages.forEach((gage) => {
      dispatch({ type: 'ADD_PLAYER_GAGE', payload: { player: playerName, gage } });
    });
  }

  function moveToNextPlayer(currentAssigned) {
    if (currentLoserIndex + 1 >= losingTeam.length) {
      setAllDone(true);
      const historyEntry = {
        date: new Date().toISOString(),
        losers: [...losingTeam],
        gages: currentAssigned,
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
      setExtraSpins(0);
    }
  }

  function handleGageResult(gageText) {
    const player = losingTeam[currentLoserIndex];

    // Save undo state before any changes
    const undoEntry = {
      assignedGages: [...assignedGages],
      currentLoserIndex,
      extraSpins,
      consumedGage: null,
    };

    if (gageText === SPECIAL_RIEN) {
      // Fiesta! No gage assigned
      setTimeout(() => playFiestaSound(), 100);
      const newAssigned = [...assignedGages, { player, gage: '🎉 Rien !' }];
      setUndoStack([...undoStack.slice(-MAX_UNDO_STACK + 1), { ...undoEntry }]);
      setAssignedGages(newAssigned);
      moveToNextPlayer(newAssigned);
      return;
    }

    if (gageText === SPECIAL_X2) {
      // x2: 2 tirages obligatoires avec uniquement des vrais gages
      setUndoStack([...undoStack.slice(-MAX_UNDO_STACK + 1), { ...undoEntry }]);
      setExtraSpins(2);
      setWheelKey((k) => k + 1);
      return;
    }

    // Normal gage
    const newAssigned = [...assignedGages, { player, gage: gageText }];
    setAssignedGages(newAssigned);

    // Consume this gage from the player's personal list
    dispatch({ type: 'CONSUME_PLAYER_GAGE', payload: { player, gageText } });
    setUndoStack([...undoStack.slice(-MAX_UNDO_STACK + 1), { ...undoEntry, consumedGage: { player, gageText } }]);

    if (extraSpins > 0) {
      const remaining = extraSpins - 1;
      setExtraSpins(remaining);
      if (remaining > 0) {
        setWheelKey((k) => k + 1);
      } else {
        // x2 terminé, on passe au joueur suivant
        moveToNextPlayer(newAssigned);
      }
    } else {
      moveToNextPlayer(newAssigned);
    }
  }

  function handleUndo() {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];

    // Restore consumed gage if any
    if (last.consumedGage) {
      const { player, gageText } = last.consumedGage;
      const gage = state.gages.find((g) => g.text === gageText) || { text: gageText, category: 'Divers' };
      dispatch({ type: 'ADD_PLAYER_GAGE', payload: { player, gage } });
    }

    setAssignedGages(last.assignedGages);
    setCurrentLoserIndex(last.currentLoserIndex);
    setExtraSpins(last.extraSpins);
    setUndoStack(undoStack.slice(0, -1));
    setWheelKey((k) => k + 1);
    setAllDone(false);
  }

  // Player gage management view
  const managedPlayerGages = managingPlayerGages ? (state.playerGages[managingPlayerGages] || []) : [];
  const managedFilteredGages = useMemo(
    () => filterCategory === 'Toutes' ? managedPlayerGages : managedPlayerGages.filter((g) => g.category === filterCategory),
    [managedPlayerGages, filterCategory]
  );

  // x2 status display
  const x2StatusText = extraSpins > 0
    ? `💀 x2 ACTIF — ${extraSpins} gage${extraSpins > 1 ? 's' : ''} obligatoire${extraSpins > 1 ? 's' : ''} (pas de Rien, pas de x2)`
    : null;

  return (
    <div className="malchance-page">
      <h1>😈 Roue de la Malchance</h1>
      <Link to="/scores" className="btn-back">← Scores</Link>

      <div className="manage-buttons">
        <button
          className="btn btn-manage-gages"
          onClick={() => { setManagingGages(!managingGages); setManagingPlayerGages(null); }}
        >
          {managingGages ? '✕ Fermer' : '⚙️ Gages globaux'}
        </button>
        {state.regularPlayers.length > 0 && (
          <div className="player-gage-buttons">
            {state.regularPlayers.map((p) => {
              const count = (state.playerGages[p] || []).length;
              return (
                <button
                  key={p}
                  className={`btn btn-player-gages ${managingPlayerGages === p ? 'active' : ''}`}
                  onClick={() => {
                    setManagingPlayerGages(managingPlayerGages === p ? null : p);
                    setManagingGages(false);
                    setFilterCategory('Toutes');
                  }}
                >
                  {p} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {managingGages && (
        <div className="gages-manager">
          <h3 className="manager-title">Gages globaux (bibliothèque)</h3>
          <p className="manager-desc">Ces gages servent de base. Ajoute-les ensuite aux joueurs.</p>
          <form onSubmit={handleAddGage} className="gage-form">
            <input
              type="text"
              value={newGage}
              onChange={(e) => setNewGage(e.target.value)}
              placeholder="Nouveau gage..."
              className="input"
            />
            <select
              className="input gage-category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Catégorie...</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <button type="submit" className="btn btn-add" disabled={!newGage.trim()}>
              +
            </button>
          </form>

          <form onSubmit={handleAddCategory} className="category-form">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Nouvelle catégorie..."
              className="input"
            />
            <button type="submit" className="btn btn-add" disabled={!newCategory.trim()}>
              + Catégorie
            </button>
          </form>

          <div className="category-filters">
            <button
              className={`category-chip ${filterCategory === 'Toutes' ? 'active' : ''}`}
              onClick={() => setFilterCategory('Toutes')}
            >
              Toutes ({state.gages.length})
            </button>
            {categories.map((cat) => {
              const count = state.gages.filter((g) => g.category === cat).length;
              return (
                <button
                  key={cat}
                  className={`category-chip ${filterCategory === cat ? 'active' : ''}`}
                  onClick={() => setFilterCategory(cat)}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          <div className="gages-list">
            {filteredGages.map((gage) => (
              <div key={gage.text} className="gage-item">
                <span className="gage-category-tag">{gage.category}</span>
                <span className="gage-text">{gage.text}</span>
                {gageToDelete === gage.text ? (
                  <span className="gage-confirm-delete">
                    <button className="btn-confirm-del" onClick={() => { dispatch({ type: 'REMOVE_GAGE', payload: gage.text }); setGageToDelete(null); addToast('Gage supprimé', 'info'); }}>Suppr</button>
                    <button className="btn-cancel-del" onClick={() => setGageToDelete(null)}>Non</button>
                  </span>
                ) : (
                  <button className="btn-remove" onClick={() => setGageToDelete(gage.text)}>✕</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {managingPlayerGages && (
        <div className="gages-manager player-gages-manager">
          <h3 className="manager-title">Roue de {managingPlayerGages}</h3>
          <p className="manager-desc">{managedPlayerGages.length} gage{managedPlayerGages.length !== 1 ? 's' : ''} restant{managedPlayerGages.length !== 1 ? 's' : ''} + "Rien" et "x2" (toujours présents)</p>

          <div className="player-gage-actions">
            <button className="btn btn-add-all-gages" onClick={() => handleAddAllGlobalGages(managingPlayerGages)}>
              + Ajouter tous les gages globaux
            </button>
          </div>

          <form onSubmit={(e) => handleAddPlayerGage(e, managingPlayerGages)} className="gage-form">
            <input
              type="text"
              value={newPlayerGage}
              onChange={(e) => setNewPlayerGage(e.target.value)}
              placeholder="Ajouter un gage..."
              className="input"
            />
            <select
              className="input gage-category-select"
              value={newPlayerGageCategory}
              onChange={(e) => setNewPlayerGageCategory(e.target.value)}
            >
              <option value="">Catégorie...</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <button type="submit" className="btn btn-add" disabled={!newPlayerGage.trim()}>
              +
            </button>
          </form>

          <div className="category-filters">
            <button
              className={`category-chip ${filterCategory === 'Toutes' ? 'active' : ''}`}
              onClick={() => setFilterCategory('Toutes')}
            >
              Toutes ({managedPlayerGages.length})
            </button>
            {categories.map((cat) => {
              const count = managedPlayerGages.filter((g) => g.category === cat).length;
              if (count === 0) return null;
              return (
                <button
                  key={cat}
                  className={`category-chip ${filterCategory === cat ? 'active' : ''}`}
                  onClick={() => setFilterCategory(cat)}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          <div className="gages-list">
            {managedFilteredGages.map((gage) => (
              <div key={gage.text} className="gage-item">
                <span className="gage-category-tag">{gage.category}</span>
                <span className="gage-text">{gage.text}</span>
                <button className="btn-remove" onClick={() => dispatch({ type: 'REMOVE_PLAYER_GAGE', payload: { player: managingPlayerGages, gageText: gage.text } })}>✕</button>
              </div>
            ))}
            {managedFilteredGages.length === 0 && (
              <p className="empty-gages">Aucun gage. Ajoute-en ou clique "Ajouter tous les gages globaux".</p>
            )}
          </div>
        </div>
      )}

      {state.losingTeam === null ? (
        <div className="empty-state">
          <span className="empty-icon">📊</span>
          <p>Il faut d'abord renseigner les scores et désigner les perdants !</p>
          <Link to="/tirage" className="btn btn-next">🎡 Aller au tirage</Link>
        </div>
      ) : !allDone ? (
        <div className="malchance-active">
          <div className="losing-team-banner">
            <h2>💀 Équipe {getTeamLabel(state.losingTeam)} — Les Perdants</h2>
            <div className="loser-badges">
              {losingTeam.map((player, i) => {
                const playerGageCount = (state.playerGages[player] || []).length;
                const isDone = i < currentLoserIndex;
                const isCurrent = i === currentLoserIndex;
                return (
                  <span
                    key={player}
                    className={`loser-badge-mal ${isCurrent ? 'current' : ''} ${isDone ? 'done' : ''}`}
                  >
                    {player}
                    <span className="loser-gage-count">{playerGageCount} gage{playerGageCount !== 1 ? 's' : ''}</span>
                    {isDone && <span className="loser-done-tag">Fait</span>}
                    {isCurrent && <span className="loser-current-tag">En cours</span>}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="current-spinner">
            <h3>🎰 C'est au tour de : <strong>{currentPlayer}</strong></h3>
            {x2StatusText && (
              <div className="x2-banner">{x2StatusText}</div>
            )}
            {wheelItems.length > 0 ? (
              <Wheel
                key={wheelKey}
                items={wheelItems}
                onResult={handleGageResult}
                title={`Gage pour ${currentPlayer}`}
                type="gages"
              />
            ) : (
              <div className="no-gages-warning">
                <p>⚠️ {currentPlayer} n'a plus de gages dans sa roue !</p>
                <p>Ajoute des gages via le bouton "{currentPlayer}" en haut.</p>
              </div>
            )}
          </div>

          {undoStack.length > 0 && (
            <button className="btn btn-undo" onClick={handleUndo}>
              ↩ Annuler le dernier tirage
            </button>
          )}

          {assignedGages.length > 0 && (
            <div className="assigned-list">
              <h3>Gages attribués :</h3>
              {assignedGages.map(({ player, gage }, i) => (
                <div key={i} className={`assigned-item ${gage === '🎉 Rien !' ? 'assigned-rien' : ''}`}>
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
              <div key={i} className={`final-gage-card ${gage === '🎉 Rien !' ? 'final-rien' : ''}`}>
                <span className="final-player">{player}</span>
                <span className="final-gage">{gage}</span>
              </div>
            ))}
          </div>
          <p className="good-luck">Bon courage les nullards ! 💀</p>
          <div className="malchance-final-actions">
            {undoStack.length > 0 && (
              <button className="btn btn-undo" onClick={handleUndo}>
                ↩ Annuler le dernier tirage
              </button>
            )}
            <Link to="/historique" className="btn btn-next">📜 Voir l'historique</Link>
          </div>
        </div>
      )}
    </div>
  );
}
