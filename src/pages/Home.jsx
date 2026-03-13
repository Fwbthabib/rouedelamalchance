import { useGame } from '../context/GameContext';
import { Link } from 'react-router-dom';
import './Home.css';

export default function Home() {
  const { state, dispatch } = useGame();

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
            <p>Ajoute les pseudos de tout le monde</p>
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
            <p>Note les scores de la partie</p>
            <span className="step-status">
              {Object.keys(state.scores).length > 0 ? 'En cours' : 'À faire'}
            </span>
          </Link>
          <Link to="/malchance" className="step-card">
            <span className="step-number">4</span>
            <span className="step-icon">😈</span>
            <h3>Malchance</h3>
            <p>Les perdants tournent la roue des gages</p>
            <span className="step-status">
              {state.losingTeam !== null ? 'Perdants désignés' : 'À faire'}
            </span>
          </Link>
        </div>
      </div>

      <div className="home-actions">
        <button className="btn btn-new-game" onClick={() => dispatch({ type: 'RESET_GAME' })}>
          🔄 Nouvelle partie
        </button>
      </div>
    </div>
  );
}
