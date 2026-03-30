import React, { useState } from 'react';
import { Player } from '../../types';
// import { SimpleGoogleDriveSync } from '../SimpleGoogleDriveSync'; // Hidden for now, but ready for future use
import './PlayersList.css';

interface PlayersListProps {
  players: Player[];
  onTogglePresence: (playerId: string) => void;
  onAddPlayer: (player: Omit<Player, 'id' | 'isPresent'>) => void;
  onEditPlayer: (playerId: string, updatedData: Partial<Pick<Player, 'name' | 'level'>>) => void;
  onDeletePlayer: (playerId: string) => void;
  onExportPlayers: () => void;
  onImportPlayers: (file: File) => Promise<void>;
  onResetToDefaults: () => void;
  onRefreshFromDefaults: () => void;
  // Google Drive props - Hidden but ready for future use:
  // onLoadPlayersFromDrive: (players: Player[]) => void;
}

export const PlayersList: React.FC<PlayersListProps> = ({
  players,
  onTogglePresence,
  onAddPlayer,
  onEditPlayer,
  onDeletePlayer,
  onExportPlayers,
  onImportPlayers,
  onResetToDefaults,
  onRefreshFromDefaults,
  // onLoadPlayersFromDrive, // Hidden for future use
}) => {
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerLevel, setNewPlayerLevel] = useState(3);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editLevel, setEditLevel] = useState(3);
  const [importError, setImportError] = useState<string | null>(null);

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlayerName.trim()) {
      onAddPlayer({
        name: newPlayerName.trim(),
        level: newPlayerLevel,
      });
      setNewPlayerName('');
      setNewPlayerLevel(3);
      setIsAddingPlayer(false);
    }
  };

  const handleStartEdit = (player: Player) => {
    setEditingPlayerId(player.id);
    setEditName(player.name);
    setEditLevel(player.level);
  };

  const handleSaveEdit = () => {
    if (editingPlayerId && editName.trim()) {
      onEditPlayer(editingPlayerId, {
        name: editName.trim(),
        level: editLevel,
      });
      handleCancelEdit();
    }
  };

  const handleEditKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  const handleCancelEdit = () => {
    setEditingPlayerId(null);
    setEditName('');
    setEditLevel(3);
  };

  const handleDeletePlayer = (playerId: string, playerName: string) => {
    if (window.confirm(`Are you sure you want to delete "${playerName}"? This action cannot be undone.`)) {
      onDeletePlayer(playerId);
    }
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImportError(null);
      await onImportPlayers(file);
      // Reset the file input
      event.target.value = '';
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Failed to import file');
    }
  };

  const presentPlayers = players.filter(p => p.isPresent);
  
  const getLevelText = (level: number): string => {
    const levelMap = {
      1: 'Beginner',
      2: 'Novice',
      3: 'Intermediate',
      4: 'Advanced',
      5: 'Expert'
    };
    return levelMap[level as keyof typeof levelMap] || 'Unknown';
  };

  const getLevelColor = (level: number): string => {
    const colorMap = {
      1: '#e3f2fd', // light blue
      2: '#f3e5f5', // light purple
      3: '#fff3e0', // light orange
      4: '#e8f5e8', // light green
      5: '#ffebee'  // light red
    };
    return colorMap[level as keyof typeof colorMap] || '#f5f5f5';
  };

  return (
    <div className="players-list">
      <div className="players-header">
        <h2>Players Management</h2>
        <div className="players-summary">
          Present: {presentPlayers.length} / {players.length}
        </div>
      </div>

      <div className="players-grid">
        {players.map((player) => (
          <div
            key={player.id}
            className={`player-card ${player.isPresent ? 'present' : 'absent'}`}
            style={{ backgroundColor: getLevelColor(player.level) }}
          >
            {editingPlayerId === player.id ? (
              // Edit mode
              <div className="player-edit-form">
                <div className="edit-form-group">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={handleEditKeyPress}
                    className="edit-name-input"
                    placeholder="Player name"
                    autoFocus
                  />
                </div>
                <div className="edit-form-group">
                  <select
                    value={editLevel}
                    onChange={(e) => setEditLevel(Number(e.target.value))}
                    onKeyDown={handleEditKeyPress}
                    className="edit-level-select"
                  >
                    <option value={1}>1 - Beginner</option>
                    <option value={2}>2 - Novice</option>
                    <option value={3}>3 - Intermediate</option>
                    <option value={4}>4 - Advanced</option>
                    <option value={5}>5 - Expert</option>
                  </select>
                </div>
                <div className="edit-actions">
                  <button
                    className="save-edit-btn"
                    onClick={handleSaveEdit}
                    title="Save changes"
                  >
                    ✓
                  </button>
                  <button
                    className="cancel-edit-btn"
                    onClick={handleCancelEdit}
                    title="Cancel editing"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              // Display mode
              <>
                <div className="player-info">
                  <div className="player-name">{player.name}</div>
                  <div className="player-level">
                    Level {player.level} - {getLevelText(player.level)}
                  </div>
                </div>
                <div className="player-controls">
                  <label className="presence-toggle">
                    <input
                      type="checkbox"
                      checked={player.isPresent}
                      onChange={() => onTogglePresence(player.id)}
                    />
                    <span className="checkmark"></span>
                    {player.isPresent ? 'Present' : 'Absent'}
                  </label>
                  <div className="player-actions">
                    <button
                      className="edit-player-btn"
                      onClick={() => handleStartEdit(player)}
                      title="Edit player"
                    >
                      ✏️
                    </button>
                    <button
                      className="delete-player-btn"
                      onClick={() => handleDeletePlayer(player.id, player.name)}
                      title="Delete player"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="add-player-section">
        {!isAddingPlayer ? (
          <button
            className="add-player-btn"
            onClick={() => setIsAddingPlayer(true)}
          >
            + Add New Player
          </button>
        ) : (
          <form onSubmit={handleAddPlayer} className="add-player-form">
            <div className="form-group">
              <label htmlFor="playerName">Player Name:</label>
              <input
                type="text"
                id="playerName"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Enter player name"
                autoFocus
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="playerLevel">Skill Level:</label>
              <select
                id="playerLevel"
                value={newPlayerLevel}
                onChange={(e) => setNewPlayerLevel(Number(e.target.value))}
              >
                <option value={1}>1 - Beginner</option>
                <option value={2}>2 - Novice</option>
                <option value={3}>3 - Intermediate</option>
                <option value={4}>4 - Advanced</option>
                <option value={5}>5 - Expert</option>
              </select>
            </div>
            <div className="form-actions">
              <button type="submit" className="save-btn">Save</button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => {
                  setIsAddingPlayer(false);
                  setNewPlayerName('');
                  setNewPlayerLevel(3);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="data-management-section">
        <h4>🗂️ Data Management</h4>
        <div className="data-actions">
          <button
            className="export-btn"
            onClick={onExportPlayers}
            title="Download players as JSON file"
          >
            📤 Export Players
          </button>
          
          <div className="import-section">
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              style={{ display: 'none' }}
              id="import-file"
            />
            <label
              htmlFor="import-file"
              className="import-btn"
              title="Import players from JSON file"
            >
              📥 Import Players
            </label>
          </div>

          <button
            className="refresh-btn"
            onClick={onRefreshFromDefaults}
            title="Refresh player list from latest data"
          >
            🔄 Refresh Players
          </button>

          <button
            className="reset-btn"
            onClick={onResetToDefaults}
            title="Reset to default players"
          >
            ↩️ Reset to Defaults
          </button>
        </div>
        
        {importError && (
          <div className="import-error">
            ⚠️ Import Error: {importError}
          </div>
        )}
        
        <div className="storage-info">
          <small>
            💾 Your player data is automatically saved in your browser's local storage.
            Use Export/Import to backup or share your player list.
            <br/>
            🔄 <strong>Refresh Players</strong> updates your list with the latest data from the app.
          </small>
        </div>
      </div>

      {/* 
      Google Drive Integration - Hidden but code preserved for future use
      <SimpleGoogleDriveSync 
        players={players}
        onPlayersLoaded={(loadedPlayers: Player[]) => {
          // Replace all current players with loaded ones
          if (window.confirm('This will replace all current players with the data from Google Drive. Continue?')) {
            onLoadPlayersFromDrive(loadedPlayers);
          }
        }}
      />
      */}
    </div>
  );
};
