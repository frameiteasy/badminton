import React, { useState } from 'react';
import { GameMatch, GameResult } from '../../types';
import './GameResults.css';

interface GameResultsProps {
  games: GameMatch[];
  gameResults: GameResult[];
  onAddResult: (gameId: string, result: Omit<GameResult, 'gameId'>) => void;
  onUpdateResult: (gameId: string, result: Partial<GameResult>) => void;
  onDeleteResult: (gameId: string) => void;
  roundNumber: number;
}

export const GameResults: React.FC<GameResultsProps> = ({
  games,
  gameResults,
  onAddResult,
  onUpdateResult,
  onDeleteResult,
  roundNumber,
}) => {
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [team1Score, setTeam1Score] = useState<number>(0);
  const [team2Score, setTeam2Score] = useState<number>(0);
  const [duration, setDuration] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState<string>('');

  const getGameResult = (gameId: string): GameResult | undefined => {
    return gameResults.find(result => result.gameId === gameId);
  };

  const getWinnerDisplay = (game: GameMatch, result: GameResult): string => {
    if (game.type === 'singles') {
      return result.winnerId === game.player1.id ? game.player1.name : game.player2.name;
    } else {
      return result.winnerId === 'team1' 
        ? `${game.team1[0].name} & ${game.team1[1].name}`
        : `${game.team2[0].name} & ${game.team2[1].name}`;
    }
  };

  const getTeamDisplay = (game: GameMatch, teamSide: 'team1' | 'team2'): string => {
    if (game.type === 'singles') {
      return teamSide === 'team1' ? game.player1.name : game.player2.name;
    } else {
      const team = teamSide === 'team1' ? game.team1 : game.team2;
      return `${team[0].name} & ${team[1].name}`;
    }
  };

  const handleStartAddResult = (game: GameMatch) => {
    setSelectedGameId(game.id);
    const existingResult = getGameResult(game.id);
    
    if (existingResult) {
      setTeam1Score(existingResult.team1Score);
      setTeam2Score(existingResult.team2Score);
      setDuration(existingResult.duration);
      setNotes(existingResult.notes || '');
    } else {
      setTeam1Score(0);
      setTeam2Score(0);
      setDuration(undefined);
      setNotes('');
    }
  };

  const handleSaveResult = () => {
    if (!selectedGameId) return;

    const game = games.find(g => g.id === selectedGameId);
    if (!game) return;

    // Determine winner
    let winnerId: string;
    if (team1Score > team2Score) {
      winnerId = game.type === 'singles' ? game.player1.id : 'team1';
    } else if (team2Score > team1Score) {
      winnerId = game.type === 'singles' ? game.player2.id : 'team2';
    } else {
      // Handle tie - for now, just pick team1/player1
      winnerId = game.type === 'singles' ? game.player1.id : 'team1';
    }

    const result: Omit<GameResult, 'gameId'> = {
      team1Score,
      team2Score,
      winnerId,
      duration: duration || undefined,
      notes: notes.trim() || undefined,
      completedAt: new Date(),
    };

    const existingResult = getGameResult(selectedGameId);
    if (existingResult) {
      onUpdateResult(selectedGameId, result);
    } else {
      onAddResult(selectedGameId, result);
    }

    handleCancelEdit();
  };

  const handleCancelEdit = () => {
    setSelectedGameId(null);
    setTeam1Score(0);
    setTeam2Score(0);
    setDuration(undefined);
    setNotes('');
  };

  const handleDeleteResult = (gameId: string) => {
    if (window.confirm('Are you sure you want to delete this game result?')) {
      onDeleteResult(gameId);
    }
  };

  const completedGames = games.filter(game => getGameResult(game.id));
  const pendingGames = games.filter(game => !getGameResult(game.id));

  if (games.length === 0) {
    return (
      <div className="game-results empty">
        <div className="empty-state">
          <h3>No Games to Record</h3>
          <p>Generate games first to record their results.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="game-results">
      <div className="results-header">
        <h3>🏆 Game Results - Round {roundNumber}</h3>
        <div className="results-summary">
          <span className="summary-item completed">
            Completed: {completedGames.length}
          </span>
          <span className="summary-item pending">
            Pending: {pendingGames.length}
          </span>
        </div>
      </div>

      {/* Pending Games */}
      {pendingGames.length > 0 && (
        <div className="games-section">
          <h4>⏳ Games in Progress</h4>
          <div className="games-grid">
            {pendingGames.map((game) => (
              <div key={game.id} className="game-result-card pending">
                <div className="game-header">
                  <span className="court-number">Court {game.court}</span>
                  <span className="game-type">{game.type}</span>
                </div>

                <div className="game-matchup">
                  <div className="team">
                    {getTeamDisplay(game, 'team1')}
                  </div>
                  <div className="vs">VS</div>
                  <div className="team">
                    {getTeamDisplay(game, 'team2')}
                  </div>
                </div>

                <div className="game-actions">
                  <button
                    className="add-result-btn"
                    onClick={() => handleStartAddResult(game)}
                  >
                    📝 Add Result
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Games */}
      {completedGames.length > 0 && (
        <div className="games-section">
          <h4>✅ Completed Games</h4>
          <div className="games-grid">
            {completedGames.map((game) => {
              const result = getGameResult(game.id)!;
              return (
                <div key={game.id} className="game-result-card completed">
                  <div className="game-header">
                    <span className="court-number">Court {game.court}</span>
                    <span className="game-type">{game.type}</span>
                  </div>

                  <div className="game-score">
                    <div className={`team ${result.winnerId === (game.type === 'singles' ? game.player1.id : 'team1') ? 'winner' : 'loser'}`}>
                      <div className="team-name">{getTeamDisplay(game, 'team1')}</div>
                      <div className="score">{result.team1Score}</div>
                    </div>
                    <div className="vs">-</div>
                    <div className={`team ${result.winnerId === (game.type === 'singles' ? game.player2.id : 'team2') ? 'winner' : 'loser'}`}>
                      <div className="team-name">{getTeamDisplay(game, 'team2')}</div>
                      <div className="score">{result.team2Score}</div>
                    </div>
                  </div>

                  <div className="result-info">
                    <div className="winner">
                      🏆 Winner: {getWinnerDisplay(game, result)}
                    </div>
                    {result.duration && (
                      <div className="duration">
                        ⏱️ {result.duration} min
                      </div>
                    )}
                    {result.notes && (
                      <div className="notes">
                        📝 {result.notes}
                      </div>
                    )}
                  </div>

                  <div className="game-actions">
                    <button
                      className="edit-result-btn"
                      onClick={() => handleStartAddResult(game)}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="delete-result-btn"
                      onClick={() => handleDeleteResult(game.id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Result Entry Modal */}
      {selectedGameId && (
        <div className="result-modal-overlay">
          <div className="result-modal">
            <div className="modal-header">
              <h4>
                {getGameResult(selectedGameId) ? 'Edit' : 'Add'} Game Result
              </h4>
              <button 
                className="close-btn"
                onClick={handleCancelEdit}
              >
                ✕
              </button>
            </div>

            {(() => {
              const game = games.find(g => g.id === selectedGameId);
              if (!game) return null;

              return (
                <div className="modal-content">
                  <div className="game-info">
                    <div className="court">Court {game.court}</div>
                    <div className="matchup">
                      {getTeamDisplay(game, 'team1')} vs {getTeamDisplay(game, 'team2')}
                    </div>
                  </div>

                  <div className="score-inputs">
                    <div className="score-group">
                      <label>{getTeamDisplay(game, 'team1')}</label>
                      <input
                        type="number"
                        min="0"
                        value={team1Score}
                        onChange={(e) => setTeam1Score(Number(e.target.value))}
                      />
                    </div>
                    <div className="score-divider">-</div>
                    <div className="score-group">
                      <label>{getTeamDisplay(game, 'team2')}</label>
                      <input
                        type="number"
                        min="0"
                        value={team2Score}
                        onChange={(e) => setTeam2Score(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="additional-fields">
                    <div className="field-group">
                      <label htmlFor="duration">Duration (minutes)</label>
                      <input
                        id="duration"
                        type="number"
                        min="1"
                        value={duration || ''}
                        onChange={(e) => setDuration(e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="Optional"
                      />
                    </div>

                    <div className="field-group">
                      <label htmlFor="notes">Notes</label>
                      <textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Optional notes about the game..."
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button
                      className="save-btn"
                      onClick={handleSaveResult}
                    >
                      Save Result
                    </button>
                    <button
                      className="cancel-btn"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
