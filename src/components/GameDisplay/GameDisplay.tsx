import React from 'react';
import { GameMatch, Player, GameRound, GameResult } from '../../types';
import { GameResults } from '../GameResults';
import './GameDisplay.css';

interface GameDisplayProps {
  gameResult: GameRound;
  onNewGeneration: () => void;
  onNewArrangement: () => void;
  roundNumber: number;
  timestamp: Date;
  isLatestRound: boolean;
  // Game results props
  gameResults: GameResult[];
  onAddResult: (gameId: string, result: Omit<GameResult, 'gameId'>) => void;
  onUpdateResult: (gameId: string, result: Partial<GameResult>) => void;
  onDeleteResult: (gameId: string) => void;
}

export const GameDisplay: React.FC<GameDisplayProps> = ({
  gameResult,
  onNewGeneration,
  onNewArrangement,
  roundNumber,
  timestamp,
  isLatestRound,
  gameResults,
  onAddResult,
  onUpdateResult,
  onDeleteResult,
}) => {
  const { games, totalGames, doublesGames, singlesGames } = gameResult;

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

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

  const getTeamStrength = (team: [Player, Player]): number => {
    return team[0].level + team[1].level;
  };

  const getBalanceStatus = (game: GameMatch): string => {
    if (game.type === 'singles') return 'singles';
    
    const team1Strength = getTeamStrength(game.team1);
    const team2Strength = getTeamStrength(game.team2);
    const difference = Math.abs(team1Strength - team2Strength);
    
    if (difference === 0) return 'perfect';
    if (difference === 1) return 'excellent';
    if (difference === 2) return 'good';
    if (difference === 3) return 'fair';
    return 'unbalanced';
  };

  const getBalanceIcon = (status: string): string => {
    const iconMap = {
      'perfect': '🎯',
      'excellent': '⭐',
      'good': '✅',
      'fair': '⚠️',
      'unbalanced': '❌',
      'singles': '🎾'
    };
    return iconMap[status as keyof typeof iconMap] || '❓';
  };

  const getBalanceText = (status: string): string => {
    const textMap = {
      'perfect': 'Perfect Balance',
      'excellent': 'Excellent Balance',
      'good': 'Good Balance',
      'fair': 'Fair Balance',
      'unbalanced': 'Unbalanced',
      'singles': 'Singles Match'
    };
    return textMap[status as keyof typeof textMap] || 'Unknown';
  };

  if (totalGames === 0) {
    return (
      <div className="game-display empty">
        <div className="empty-state">
          <h3>No Games Generated Yet</h3>
          <p>Generate games to see the court assignments here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`game-display ${isLatestRound ? 'latest-round' : 'previous-round'}`}>
      <div className="display-header">
        <div className="round-info">
          <h3>🏸 Round {roundNumber}</h3>
          <span className="round-timestamp">{formatTime(timestamp)}</span>
        </div>
        <div className="games-summary">
          <span className="summary-item">
            Total: {totalGames} game{totalGames !== 1 ? 's' : ''}
          </span>
          {doublesGames > 0 && (
            <span className="summary-item doubles">
              {doublesGames} Doubles
            </span>
          )}
          {singlesGames > 0 && (
            <span className="summary-item singles">
              {singlesGames} Singles
            </span>
          )}
        </div>
        {isLatestRound && (
          <div className="round-buttons">
            <button 
              className="regenerate-btn"
              onClick={onNewArrangement}
              title="Generate new arrangement for this round"
            >
              🔄 New Arrangement
            </button>
            <button 
              className="new-round-btn"
              onClick={onNewGeneration}
              title="Start a new round"
            >
              ➕ New Round
            </button>
          </div>
        )}
      </div>

      <div className="games-grid">
        {games.map((game, index) => (
          <div key={index} className={`game-card ${game.type}`}>
            <div className="court-header">
              <span className="court-number">Court {game.court}</span>
              <div className="balance-indicator">
                <span className="balance-icon">
                  {getBalanceIcon(getBalanceStatus(game))}
                </span>
                <span className="balance-text">
                  {getBalanceText(getBalanceStatus(game))}
                </span>
              </div>
            </div>

            {game.type === 'doubles' ? (
              <div className="doubles-match">
                <div className="team team1">
                  <h4>Team 1 ({getTeamStrength(game.team1)})</h4>
                  <div className="players">
                    {game.team1.map((player, idx) => (
                      <div key={player.id} className="player">
                        <span className="player-name">{player.name}</span>
                        <span 
                          className="player-level"
                          style={{ backgroundColor: getLevelColor(player.level) }}
                        >
                          L{player.level}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="vs-divider">VS</div>

                <div className="team team2">
                  <h4>Team 2 ({getTeamStrength(game.team2)})</h4>
                  <div className="players">
                    {game.team2.map((player, idx) => (
                      <div key={player.id} className="player">
                        <span className="player-name">{player.name}</span>
                        <span 
                          className="player-level"
                          style={{ backgroundColor: getLevelColor(player.level) }}
                        >
                          L{player.level}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="singles-match">
                <div className="player-slot">
                  <div className="player">
                    <span className="player-name">{game.player1.name}</span>
                    <span 
                      className="player-level"
                      style={{ backgroundColor: getLevelColor(game.player1.level) }}
                    >
                      L{game.player1.level}
                    </span>
                  </div>
                </div>

                <div className="vs-divider">VS</div>

                <div className="player-slot">
                  <div className="player">
                    <span className="player-name">{game.player2.name}</span>
                    <span 
                      className="player-level"
                      style={{ backgroundColor: getLevelColor(game.player2.level) }}
                    >
                      L{game.player2.level}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {gameResult.unpairedPlayers.length > 0 && (
        <div className="unpaired-section">
          <h4>⏱️ Waiting Next Round</h4>
          <div className="unpaired-players">
            {gameResult.unpairedPlayers.map(player => (
              <div key={player.id} className="waiting-player">
                <span className="player-name">{player.name}</span>
                <span 
                  className="player-level"
                  style={{ backgroundColor: getLevelColor(player.level) }}
                >
                  L{player.level}
                </span>
              </div>
            ))}
          </div>
          <p className="waiting-note">
            {gameResult.unpairedPlayers.length === 1 
              ? 'This player will join the next round.' 
              : 'These players can form additional games or wait for the next round.'
            }
          </p>
        </div>
      )}

      {/* Game Results Section */}
      <GameResults
        games={games}
        gameResults={gameResults}
        onAddResult={onAddResult}
        onUpdateResult={onUpdateResult}
        onDeleteResult={onDeleteResult}
        roundNumber={roundNumber}
      />
    </div>
  );
};
