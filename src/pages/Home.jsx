import { useState, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { Link } from 'react-router-dom';
import './Home.css';

export default function Home() {
  const { state, dispatch } = useGame();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showNukeConfirm, setShowNukeConfirm] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [importMessage, setImportMessage] = useState(null);
  const [pendingImportData, setPendingImportData] = useState(null);
  const fileInputRef = useRef(null);

  function handleResetGame() {
    dispatch({ type: 'RESET_GAME' });
    setShowResetConfirm(false);
  }

  function handleNukeData() {
    dispatch({ type: 'RESET_ALL_DATA' });
    setShowNukeConfirm(false);
  }

  function handleExport() {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rouedelamalchance_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        setPendingImportData(data);
        setShowImportConfirm(true);
      } catch {
        setImportMessage('Erreur : fichier invalide');
        setTimeout(() => setImportMessage(null), 3000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function confirmImport() {
    if (pendingImportData) {
      dispatch({ type: 'IMPORT_DATA', payload: pendingImportData });
      setImportMessage('Données importées avec succès !');
      setTimeout(() => setImportMessage(null), 3000);
    }
    setShowImportConfirm(false);
    setPendingImportData(null);
  }

  function cancelImport() {
    setShowImportConfirm(false);
    setPendingImportData(null);
  }

  return (
    <div className="home-page">
      <div className="home-hero">
        <h1>⛳ Roue de la Malchance</h1>
        <p className="home-subtitle">L'app ultime pour vos dimanches Golf It!</p>
      </div>

      {state.lastLosers.length > 0 && (
        <div className="home-losers-card">
          <h2>💀 Nullards de la dernière fois</h2>
          <div className="losers-list">
            {state.lastLosers.map((loser) => (
              <span key={loser} className="loser-badge">{loser}</span>
            ))}
          </div>
        </div>
      )}

      <div className="home-steps">
        <h2>Comment ça marche ?</h2>
        <div className="steps-grid">
          <Link to="/joueurs" className="step-card">
            <span className="step-number">1</span>
            <span className="step-icon">👥</span>
            <h3>Joueurs</h3>
            <p>Ajoute les pseudos + scores</p>
            <span className="step-status">
              {state.players.length > 0 ? `${state.players.length} joueurs` : 'À faire'}
            </span>
          </Link>
          <Link to="/tirage" className="step-card">
            <span className="step-number">2</span>
            <span className="step-icon">🎡</span>
            <h3>Tirage</h3>
            <p>Tire les équipes à la roue</p>
            <span className="step-status">
              {state.currentGameTeams.length > 0 ? 'Équipes formées' : 'À faire'}
            </span>
          </Link>
          <Link to="/scores" className="step-card">
            <span className="step-number">3</span>
            <span className="step-icon">📊</span>
            <h3>Scores</h3>
            <p>Vérifie les totaux par équipe</p>
            <span className="step-status">
              {state.losingTeam !== null ? 'Perdants désignés' : Object.keys(state.scores).length > 0 ? 'En cours' : 'À faire'}
            </span>
          </Link>
          <Link to="/malchance" className="step-card">
            <span className="step-number">4</span>
            <span className="step-icon">😈</span>
            <h3>Malchance</h3>
            <p>Les perdants tournent la roue des gages</p>
            <span className="step-status">
              {state.losingTeam !== null ? 'Go go go !' : 'À faire'}
            </span>
          </Link>
        </div>
      </div>

      <div className="home-actions">
        {!showResetConfirm ? (
          <button className="btn btn-new-game" onClick={() => setShowResetConfirm(true)}>
            🔄 Nouvelle partie
          </button>
        ) : (
          <div className="confirm-box">
            <p>Tu es sûr de vouloir reset la partie en cours ?</p>
            <div className="confirm-buttons">
              <button className="btn btn-confirm-yes" onClick={handleResetGame}>Oui, reset !</button>
              <button className="btn btn-confirm-no" onClick={() => setShowResetConfirm(false)}>Non, annuler</button>
            </div>
          </div>
        )}
      </div>

      <div className="home-bottom-section">
        <h2>⚙️ Données</h2>
        <div className="data-actions">
          <button className="btn btn-export" onClick={handleExport}>
            📤 Exporter les données
          </button>
          <button className="btn btn-import" onClick={() => fileInputRef.current?.click()}>
            📥 Importer des données
          </button>
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleImport}
            style={{ display: 'none' }}
          />
          {!showNukeConfirm ? (
            <button className="btn btn-nuke" onClick={() => setShowNukeConfirm(true)}>
              🗑️ Supprimer TOUTES les données (test)
            </button>
          ) : (
            <div className="confirm-box nuke">
              <p>⚠️ Ça va TOUT supprimer : joueurs, gages, historique, stats. Tu es sûr ?</p>
              <div className="confirm-buttons">
                <button className="btn btn-confirm-yes nuke" onClick={handleNukeData}>Oui, tout supprimer</button>
                <button className="btn btn-confirm-no" onClick={() => setShowNukeConfirm(false)}>Non, annuler</button>
              </div>
            </div>
          )}
        </div>
        {showImportConfirm && (
          <div className="confirm-box">
            <p>⚠️ L'import va remplacer TOUTES les données actuelles. Exporte d'abord si tu veux garder une copie !</p>
            <div className="confirm-buttons">
              <button className="btn btn-confirm-yes" onClick={confirmImport}>Oui, importer</button>
              <button className="btn btn-confirm-no" onClick={cancelImport}>Non, annuler</button>
            </div>
          </div>
        )}
        {importMessage && (
          <div className={`import-message ${importMessage.includes('Erreur') ? 'error' : 'success'}`}>
            {importMessage}
          </div>
        )}
      </div>
    </div>
  );
}
