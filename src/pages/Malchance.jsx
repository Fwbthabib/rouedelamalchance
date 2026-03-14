import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Link } from 'react-router-dom';
import Wheel from '../components/Wheel';
import './Malchance.css';

export default function Malchance() {
  const { state, dispatch } = useGame();
  const [newGage, setNewGage] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentLoserIndex, setCurrentLoserIndex] = useState(0);
  const [assignedGages, setAssignedGages] = useState([]);
  const [allDone, setAllDone] = useState(false);
  const [managingGages, setManagingGages] = useState(false);
  const [filterCategory, setFilterCategory] = useState('Toutes');

  const losingTeam = state.losingTeam !== null ? state.currentGameTeams[state.losingTeam] : [];
  const categories = state.gageCategories || ['Films', 'Spectacles', 'Exposés', 'Divers'];

  const filteredGages = filterCategory === 'Toutes'
    ? state.gages
    : state.gages.filter((g) => g.category === filterCategory);

  const gageTexts = state.gages.map((g) => g.text);

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

  function handleGageResult(gageText) {
    const player = losingTeam[currentLoserIndex];
    const newAssigned = [...assignedGages, { player, gage: gageText }];
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
                <button className="btn-remove" onClick={() => dispatch({ type: 'REMOVE_GAGE', payload: gage.text })}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {state.losingTeam === null ? (
        <div className="empty-state">
          <span className="empty-icon">📊</span>
          <p>Il faut d'abord renseigner les scores et désigner les perdants !</p>
          <Link to="/scores" className="btn btn-next">📊 Aller aux scores</Link>
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
              items={gageTexts}
              onResult={handleGageResult}
              title={`Gage pour ${losingTeam[currentLoserIndex]}`}
              type="gages"
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
          <Link to="/historique" className="btn btn-next">📜 Voir l'historique</Link>
        </div>
      )}
    </div>
  );
}
