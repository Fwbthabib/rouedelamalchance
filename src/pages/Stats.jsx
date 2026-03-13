import { useMemo } from 'react';
import { useGame } from '../context/GameContext';
import './Stats.css';

export default function Stats() {
  const { state } = useGame();

  const playerStats = useMemo(() => {
    const stats = {};

    state.history.forEach((entry) => {
      // Tous les joueurs de cette partie
      const allPlayers = entry.teams.flatMap((t) => t.players);
      if (entry.immunePlayer) allPlayers.push(entry.immunePlayer);

      allPlayers.forEach((player) => {
        if (!stats[player]) {
          stats[player] = {
            name: player,
            gamesPlayed: 0,
            timesLost: 0,
            gagesReceived: [],
            totalScore: 0,
            scoreCount: 0,
            timesImmune: 0,
          };
        }
        stats[player].gamesPlayed++;

        if (entry.scores && typeof entry.scores[player] === 'number') {
          stats[player].totalScore += entry.scores[player];
          stats[player].scoreCount++;
        }
      });

      // Perdants
      entry.losers.forEach((loser) => {
        if (stats[loser]) stats[loser].timesLost++;
      });

      // Gages
      entry.gages.forEach(({ player, gage }) => {
        if (stats[player]) stats[player].gagesReceived.push(gage);
      });

      // Immunité
      if (entry.immunePlayer && stats[entry.immunePlayer]) {
        stats[entry.immunePlayer].timesImmune++;
      }
    });

    return Object.values(stats).sort((a, b) => b.gamesPlayed - a.gamesPlayed);
  }, [state.history]);

  const topLoser = playerStats.length > 0
    ? playerStats.reduce((a, b) => a.timesLost > b.timesLost ? a : b)
    : null;

  if (state.history.length === 0) {
    return (
      <div className="stats-page">
        <h1>📈 Statistiques</h1>
        <div className="empty-state">
          <span className="empty-icon">📊</span>
          <p>Pas encore de stats — jouez d'abord quelques parties !</p>
        </div>
      </div>
    );
  }

  return (
    <div className="stats-page">
      <h1>📈 Statistiques</h1>

      <div className="stats-overview">
        <div className="stat-card">
          <span className="stat-value">{state.history.length}</span>
          <span className="stat-label">Parties jouées</span>
        </div>
        {topLoser && topLoser.timesLost > 0 && (
          <div className="stat-card loser">
            <span className="stat-value">{topLoser.name}</span>
            <span className="stat-label">💀 Plus gros nullard ({topLoser.timesLost}x perdant)</span>
          </div>
        )}
      </div>

      <div className="stats-table">
        <div className="stats-header">
          <span className="col-name">Joueur</span>
          <span className="col-num">Parties</span>
          <span className="col-num">Défaites</span>
          <span className="col-num">Moy. score</span>
          <span className="col-num">Immunités</span>
          <span className="col-num">Gages</span>
        </div>
        {playerStats.map((p) => (
          <div key={p.name} className="stats-row">
            <span className="col-name">
              {p.name}
              {topLoser && p.name === topLoser.name && topLoser.timesLost > 0 && ' 💀'}
            </span>
            <span className="col-num">{p.gamesPlayed}</span>
            <span className="col-num col-losses">{p.timesLost}</span>
            <span className="col-num">
              {p.scoreCount > 0 ? Math.round(p.totalScore / p.scoreCount) : '-'}
            </span>
            <span className="col-num">{p.timesImmune || '-'}</span>
            <span className="col-num">{p.gagesReceived.length || '-'}</span>
          </div>
        ))}
      </div>

      <div className="gages-history">
        <h2>📝 Tous les gages reçus</h2>
        {playerStats
          .filter((p) => p.gagesReceived.length > 0)
          .map((p) => (
            <div key={p.name} className="player-gages">
              <h3>{p.name}</h3>
              <ul>
                {p.gagesReceived.map((gage, i) => (
                  <li key={i}>{gage}</li>
                ))}
              </ul>
            </div>
          ))}
      </div>
    </div>
  );
}
