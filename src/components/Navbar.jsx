import { NavLink } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import './Navbar.css';

export default function Navbar() {
  const { state } = useGame();

  return (
    <nav className="navbar">
      <div className="navbar-top">
        <div className="navbar-brand">
          <span className="navbar-logo">⛳</span>
          <span className="navbar-title">Roue de la Malchance</span>
        </div>
        {state.lastLosers.length > 0 && (
          <div className="navbar-losers">
            <span className="losers-label">💀 Nullards de la dernière fois :</span>
            <span className="losers-names">{state.lastLosers.join(', ')}</span>
          </div>
        )}
      </div>
      <div className="navbar-links">
        <NavLink to="/" end>🏠 Accueil</NavLink>
        <NavLink to="/joueurs">👥 Joueurs</NavLink>
        <NavLink to="/tirage">🎡 Tirage</NavLink>
        <NavLink to="/scores">📊 Scores</NavLink>
        <NavLink to="/malchance">😈 Malchance</NavLink>
        <NavLink to="/historique">📜 Historique</NavLink>
        <NavLink to="/stats">📈 Stats</NavLink>
      </div>
    </nav>
  );
}
