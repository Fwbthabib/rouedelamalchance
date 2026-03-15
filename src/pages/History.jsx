import { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { Link } from 'react-router-dom';
import './History.css';

const ITEMS_PER_PAGE = 5;

export default function History() {
  const { state } = useGame();
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(state.history.length / ITEMS_PER_PAGE));
  const paginatedHistory = useMemo(
    () => state.history.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE),
    [state.history, page]
  );

  function formatDate(isoString) {
    return new Date(isoString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  return (
    <div className="history-page">
      <h1>📜 Historique des Parties</h1>
      <Link to="/" className="btn-back">← Accueil</Link>

      {state.lastLosers.length > 0 && (
        <div className="last-losers-card">
          <h2>💀 Nullards de la dernière fois</h2>
          <div className="last-losers-list">
            {state.lastLosers.map((loser) => (
              <span key={loser} className="last-loser-badge">{loser}</span>
            ))}
          </div>
        </div>
      )}

      {state.history.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📜</span>
          <p>Aucune partie enregistrée pour l'instant.</p>
          <p className="empty-state-hint">Les parties sont enregistrées automatiquement après la Roue de la Malchance.</p>
          <Link to="/" className="btn btn-next" style={{ marginTop: '1rem' }}>⛳ Commencer une partie</Link>
        </div>
      ) : (
        <>
          <div className="history-list">
            {paginatedHistory.map((entry, index) => {
              const globalIndex = page * ITEMS_PER_PAGE + index;
              return (
                <div key={globalIndex} className="history-card">
                  <div className="history-header">
                    <span className="history-date">{formatDate(entry.date)}</span>
                    <span className="history-badge">Partie #{state.history.length - globalIndex}</span>
                  </div>

                  <div className="history-teams">
                    {entry.teams.map((team) => (
                      <div key={team.name} className="history-team">
                        <span className="history-team-name">Équipe {team.name}</span>
                        <span className="history-team-players">{team.players.join(', ')}</span>
                        <span className="history-team-score">{team.score} coups</span>
                      </div>
                    ))}
                  </div>

                  {entry.immunePlayer && (
                    <div className="history-immune">⭐ Immunisé : {entry.immunePlayer}</div>
                  )}

                  <div className="history-gages">
                    <h4>💀 Gages distribués :</h4>
                    {entry.gages.map(({ player, gage }, i) => (
                      <div key={i} className="history-gage">
                        <span className="history-gage-player">{player}</span>
                        <span className="history-gage-arrow">→</span>
                        <span className="history-gage-text">{gage}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="history-pagination">
              <button
                className="btn btn-pagination"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                ← Précédent
              </button>
              <span className="pagination-info">
                {page + 1} / {totalPages}
              </span>
              <button
                className="btn btn-pagination"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                Suivant →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
