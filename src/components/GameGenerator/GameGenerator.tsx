import React from 'react';
import { Player, GameRound } from '../../types';
import { useGameGenerator } from './useGameGenerator';
import { GameGenerationResult } from '../../utils/gameAlgorithm';
import './GameGenerator.css';

interface GameGeneratorProps {
  presentPlayers: Player[];
  onGamesGenerated: (result: GameGenerationResult) => void;
  forceRegenerate?: number;
  gameHistory?: GameRound[];
}

export const GameGenerator: React.FC<GameGeneratorProps> = ({
  presentPlayers,
  onGamesGenerated,
  forceRegenerate,
  gameHistory = []
}) => {
  const {
    isGenerating,
    lastResult,
    statistics,
    canGenerateGames,
    maxDoublesGames,
    maxSinglesGames,
    handleGenerateGames
  } = useGameGenerator(presentPlayers, onGamesGenerated, forceRegenerate, gameHistory);

  return (
    <div className="game-generator">
      <div className="generator-header">
        <h3>🎾 Game Generator</h3>
        <div className="game-possibilities">
          <div className="possibility-item">
            <span className="possibility-label">Possible Doubles:</span>
            <span className="possibility-value">{maxDoublesGames}</span>
          </div>
          {maxSinglesGames > 0 && (
            <div className="possibility-item">
              <span className="possibility-label">Possible Singles:</span>
              <span className="possibility-value">{maxSinglesGames}</span>
            </div>
          )}
          {presentPlayers.length % 2 === 1 && (
            <div className="possibility-item warning">
              <span className="possibility-label">Unpaired:</span>
              <span className="possibility-value">1 player</span>
            </div>
          )}
        </div>
      </div>

      <div className="generator-controls">
        <button
          className={`generate-btn ${isGenerating ? 'generating' : ''}`}
          onClick={handleGenerateGames}
          disabled={!canGenerateGames || isGenerating}
        >
          {isGenerating ? (
            <>
              <span className="spinner"></span>
              Generating...
            </>
          ) : (
            '🎯 Generate Optimal Games'
          )}
        </button>

        {!canGenerateGames && (
          <p className="error-message">
            Need at least 2 players to generate games
          </p>
        )}
      </div>

      {lastResult && statistics && (
        <div className="generation-summary">
          <h4>Last Generation Summary</h4>
          <div className="summary-stats">
            <div className="stat-item">
              <span className="stat-label">Total Games:</span>
              <span className="stat-value">{lastResult.totalGames}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Doubles:</span>
              <span className="stat-value">{lastResult.doublesGames}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Singles:</span>
              <span className="stat-value">{lastResult.singlesGames}</span>
            </div>
            {lastResult.unpairedPlayers.length > 0 && (
              <div className="stat-item warning">
                <span className="stat-label">Unpaired:</span>
                <span className="stat-value">{lastResult.unpairedPlayers.length}</span>
              </div>
            )}
          </div>
          
          {lastResult.doublesGames > 0 && (
            <div className="balance-info">
              <p>
                Average team balance: 
                <span className="balance-score">
                  {statistics.averageTeamBalance} points difference
                </span>
              </p>
            </div>
          )}

          {lastResult.unpairedPlayers.length > 0 && (
            <div className="unpaired-players">
              <h5>Unpaired Players:</h5>
              <div className="unpaired-list">
                {lastResult.unpairedPlayers.map((player: Player) => (
                  <span key={player.id} className="unpaired-player">
                    {player.name} (L{player.level})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
