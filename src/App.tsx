import React from 'react';
import { PlayersList, usePlayersList } from './components/PlayersList';
import { GameGenerator } from './components/GameGenerator';
import { GameDisplay } from './components/GameDisplay';
import { useGameHistory } from './hooks';
import './App.css';

function App() {
  const {
    players,
    presentPlayers,
    handleTogglePresence,
    handleAddPlayer,
    handleEditPlayer,
    handleDeletePlayer,
    handleExportPlayers,
    handleImportPlayers,
    handleResetToDefaults,
    handleRefreshFromDefaults,
    // handleLoadPlayersFromDrive, // Hidden for future use
  } = usePlayersList();

  const {
    gameRounds,
    forceRegenerate,
    handleGamesGenerated,
    handleNewGeneration,
    handleNewArrangement,
    handleClearHistory,
  } = useGameHistory(presentPlayers);

  return (
    <div className="App">
      <header className="App-header">
        <h1>🏸 Badminton Court Manager</h1>
        <p>Organize players and create balanced games</p>
      </header>

      <main className="App-main">
        <PlayersList
          players={players}
          onTogglePresence={handleTogglePresence}
          onAddPlayer={handleAddPlayer}
          onEditPlayer={handleEditPlayer}
          onDeletePlayer={handleDeletePlayer}
          onExportPlayers={handleExportPlayers}
          onImportPlayers={handleImportPlayers}
          onResetToDefaults={handleResetToDefaults}
          onRefreshFromDefaults={handleRefreshFromDefaults}
          // onLoadPlayersFromDrive={handleLoadPlayersFromDrive} // Hidden for future use
        />

        {presentPlayers.length >= 2 && (
          <GameGenerator
            presentPlayers={presentPlayers}
            onGamesGenerated={handleGamesGenerated}
            forceRegenerate={forceRegenerate}
            gameHistory={gameRounds}
          />
        )}

        {gameRounds.length > 0 && (
          <div className="game-history">
            <div className="history-header">
              <h3>📋 Game History</h3>
              <div className="history-controls">
                <span className="round-count">{gameRounds.length} round{gameRounds.length !== 1 ? 's' : ''}</span>
                <button 
                  className="clear-history-btn"
                  onClick={handleClearHistory}
                  title="Clear all game history"
                >
                  🗑️ Clear History
                </button>
              </div>
            </div>
            
            {gameRounds.map((round, index) => (
              <GameDisplay
                key={round.id}
                gameResult={round}
                onNewGeneration={handleNewGeneration}
                onNewArrangement={handleNewArrangement}
                roundNumber={round.roundNumber}
                timestamp={round.timestamp}
                isLatestRound={index === gameRounds.length - 1}
              />
            ))}
          </div>
        )}

        {presentPlayers.length > 0 && presentPlayers.length < 2 && (
          <div className="insufficient-players">
            <p>Need at least 2 players to generate games</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
