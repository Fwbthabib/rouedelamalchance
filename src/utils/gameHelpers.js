/**
 * Convert team index to letter label (0 → "A", 1 → "B", etc.)
 */
export function getTeamLabel(index) {
  return String.fromCharCode(65 + index);
}

/**
 * Compute team totals from individual scores.
 * @param {string[][]} teams - Array of teams (each team is array of player names)
 * @param {Object} scores - Map of player name → score
 * @returns {number[]} Array of team totals
 */
export function computeTeamTotals(teams, scores) {
  return teams.map((team) =>
    team.reduce((sum, player) => {
      const score = scores[player];
      return sum + (typeof score === 'number' ? score : 0);
    }, 0)
  );
}

/**
 * Find tie-break info from team totals.
 * @param {number[]} teamTotals
 * @param {boolean} allScoresFilled
 * @returns {{ maxScore: number, tiedTeamIndexes: number[], hasTie: boolean, losingTeamIndex: number }}
 */
export function findTieBreakInfo(teamTotals, allScoresFilled) {
  if (!allScoresFilled) {
    return { maxScore: 0, tiedTeamIndexes: [], hasTie: false, losingTeamIndex: -1 };
  }

  const maxScore = Math.max(...teamTotals);
  const tiedTeamIndexes = teamTotals.reduce((acc, total, i) => {
    if (total === maxScore) acc.push(i);
    return acc;
  }, []);

  const hasTie = tiedTeamIndexes.length > 1;
  const losingTeamIndex = !hasTie && tiedTeamIndexes.length === 1 ? tiedTeamIndexes[0] : -1;

  return { maxScore, tiedTeamIndexes, hasTie, losingTeamIndex };
}
