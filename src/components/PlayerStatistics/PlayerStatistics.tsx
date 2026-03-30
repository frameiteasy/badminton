import React, { useState } from 'react';
import { Player, GameResult, GameMatch } from '../../types';
import './PlayerStatistics.css';

interface PlayerStats {
  player: Player;
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  avgScoreFor: number;
  avgScoreAgainst: number;
  lastGameDate?: Date;
}

interface PlayerStatisticsProps {
  players: Player[];
  gameResults: GameResult[];
  gameRounds: any[]; // GameRound type with games
}

export const PlayerStatistics: React.FC<PlayerStatisticsProps> = ({
  players,
  gameResults,
  gameRounds,
}) => {
  const [sortBy, setSortBy] = useState<'winRate' | 'totalGames' | 'wins' | 'name'>('winRate');
  const [showOnlyPresent, setShowOnlyPresent] = useState(false);

  // Helper function to get all games for analysis
  const getAllGames = (): GameMatch[] => {
    return gameRounds.flatMap(round => round.games);
  };

  // Calculate comprehensive player statistics
  const calculatePlayerStats = (): PlayerStats[] => {
    const allGames = getAllGames();
    
    return players.map(player => {
      // Find all games this player participated in
      const playerGames = allGames.filter(game => {
        if (game.type === 'singles') {
          return game.player1.id === player.id || game.player2.id === player.id;
        } else {
          return game.team1.some(p => p.id === player.id) || 
                 game.team2.some(p => p.id === player.id);
        }
      });

      // Get results for these games
      const playerResults = playerGames
        .map(game => ({
          game,
          result: gameResults.find(r => r.gameId === game.id)
        }))
        .filter(pr => pr.result); // Only games with results

      let wins = 0;
      let losses = 0;
      let draws = 0;
      let totalScoreFor = 0;
      let totalScoreAgainst = 0;
      let lastGameDate: Date | undefined;

      playerResults.forEach(({ game, result }) => {
        if (!result) return;

        // Update last game date
        if (!lastGameDate || result.completedAt > lastGameDate) {
          lastGameDate = result.completedAt;
        }

        // Determine if player won, lost, or drew
        let playerWon = false;
        let playerScore = 0;
        let opponentScore = 0;

        if (game.type === 'singles') {
          const isPlayer1 = game.player1.id === player.id;
          playerWon = (isPlayer1 && result.winnerId === game.player1.id) ||
                     (!isPlayer1 && result.winnerId === game.player2.id);
          playerScore = isPlayer1 ? result.team1Score : result.team2Score;
          opponentScore = isPlayer1 ? result.team2Score : result.team1Score;
        } else {
          const isTeam1 = game.team1.some(p => p.id === player.id);
          playerWon = (isTeam1 && result.winnerId === 'team1') ||
                     (!isTeam1 && result.winnerId === 'team2');
          playerScore = isTeam1 ? result.team1Score : result.team2Score;
          opponentScore = isTeam1 ? result.team2Score : result.team1Score;
        }

        if (playerScore === opponentScore) {
          draws++;
        } else if (playerWon) {
          wins++;
        } else {
          losses++;
        }

        totalScoreFor += playerScore;
        totalScoreAgainst += opponentScore;
      });

      const totalGames = wins + losses + draws;
      const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;
      const avgScoreFor = totalGames > 0 ? totalScoreFor / totalGames : 0;
      const avgScoreAgainst = totalGames > 0 ? totalScoreAgainst / totalGames : 0;

      return {
        player,
        totalGames,
        wins,
        losses,
        draws,
        winRate,
        avgScoreFor,
        avgScoreAgainst,
        lastGameDate,
      };
    });
  };

  const playerStats = calculatePlayerStats();

  // Filter and sort statistics
  const filteredStats = playerStats
    .filter(stat => !showOnlyPresent || stat.player.isPresent)
    .sort((a, b) => {
      switch (sortBy) {
        case 'winRate':
          if (a.totalGames === 0 && b.totalGames === 0) return 0;
          if (a.totalGames === 0) return 1;
          if (b.totalGames === 0) return -1;
          return b.winRate - a.winRate;
        case 'totalGames':
          return b.totalGames - a.totalGames;
        case 'wins':
          return b.wins - a.wins;
        case 'name':
          return a.player.name.localeCompare(b.player.name);
        default:
          return 0;
      }
    });

  const getLevelColor = (level: number): string => {
    const colorMap = {
      1: '#2196f3', // blue
      2: '#9c27b0', // purple
      3: '#ff9800', // orange
      4: '#4caf50', // green
      5: '#f44336'  // red
    };
    return colorMap[level as keyof typeof colorMap] || '#757575';
  };

  const getWinRateColor = (winRate: number): string => {
    if (winRate >= 70) return '#28a745';
    if (winRate >= 50) return '#ffc107';
    return '#dc3545';
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (gameResults.length === 0) {
    return (
      <div className="player-statistics empty">
        <div className="empty-state">
          <h3>📊 Player Statistics</h3>
          <p>Play some games and record results to see player statistics here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="player-statistics">
      <div className="statistics-header">
        <h3>📊 Player Statistics</h3>
        <div className="statistics-controls">
          <div className="filter-controls">
            <label className="checkbox-filter">
              <input
                type="checkbox"
                checked={showOnlyPresent}
                onChange={(e) => setShowOnlyPresent(e.target.checked)}
              />
              Present players only
            </label>
          </div>
          <div className="sort-controls">
            <label htmlFor="sort-select">Sort by:</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="winRate">Win Rate</option>
              <option value="totalGames">Total Games</option>
              <option value="wins">Wins</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>
      </div>

      <div className="statistics-grid">
        {filteredStats.map((stat) => (
          <div key={stat.player.id} className="player-stat-card">
            <div className="player-header">
              <div className="player-info">
                <span className="player-name">{stat.player.name}</span>
                <span 
                  className="player-level"
                  style={{ backgroundColor: getLevelColor(stat.player.level) }}
                >
                  L{stat.player.level}
                </span>
              </div>
              {stat.player.isPresent && (
                <div className="presence-indicator">🟢</div>
              )}
            </div>

            <div className="stats-content">
              {stat.totalGames === 0 ? (
                <div className="no-games">
                  <span>No completed games</span>
                </div>
              ) : (
                <>
                  <div className="primary-stats">
                    <div className="stat-item">
                      <span className="stat-label">Games</span>
                      <span className="stat-value">{stat.totalGames}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Win Rate</span>
                      <span 
                        className="stat-value"
                        style={{ color: getWinRateColor(stat.winRate) }}
                      >
                        {stat.winRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="record-stats">
                    <div className="record-item wins">
                      <span className="record-label">W</span>
                      <span className="record-value">{stat.wins}</span>
                    </div>
                    <div className="record-item losses">
                      <span className="record-label">L</span>
                      <span className="record-value">{stat.losses}</span>
                    </div>
                    {stat.draws > 0 && (
                      <div className="record-item draws">
                        <span className="record-label">D</span>
                        <span className="record-value">{stat.draws}</span>
                      </div>
                    )}
                  </div>

                  <div className="score-stats">
                    <div className="score-item">
                      <span className="score-label">Avg Score</span>
                      <span className="score-value">
                        {stat.avgScoreFor.toFixed(1)} - {stat.avgScoreAgainst.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {stat.lastGameDate && (
                    <div className="last-game">
                      <span className="last-game-label">Last game:</span>
                      <span className="last-game-date">
                        {formatDate(stat.lastGameDate)}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredStats.length === 0 && (
        <div className="no-results">
          <p>No players match the current filters.</p>
        </div>
      )}
    </div>
  );
};
