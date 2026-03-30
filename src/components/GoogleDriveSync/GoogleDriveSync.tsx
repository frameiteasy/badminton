import React, { useState } from 'react';
import { Player } from '../../types';
import { useGoogleDrive } from '../../hooks/useGoogleDrive';
import './GoogleDriveSync.css';

interface GoogleDriveSyncProps {
  players: Player[];
  onPlayersLoaded: (players: Player[]) => void;
}

export const GoogleDriveSync: React.FC<GoogleDriveSyncProps> = ({
  players,
  onPlayersLoaded
}) => {
  const [config, setConfig] = useState({
    clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || '',
    apiKey: process.env.REACT_APP_GOOGLE_API_KEY || '',
    folderId: process.env.REACT_APP_GOOGLE_FOLDER_ID || ''
  });

  const {
    isConnected,
    isLoading,
    error,
    lastSync,
    connectToGoogleDrive,
    saveToGoogleDrive,
    loadFromGoogleDrive,
    disconnect,
    clearError
  } = useGoogleDrive(config.clientId && config.apiKey ? config : undefined);

  const [showConfig, setShowConfig] = useState(!config.clientId || !config.apiKey);

  const handleConnect = async () => {
    if (!config.clientId || !config.apiKey) {
      alert('Please configure Google Drive API credentials first');
      setShowConfig(true);
      return;
    }
    
    await connectToGoogleDrive();
  };

  const handleSave = async () => {
    await saveToGoogleDrive(players);
  };

  const handleLoad = async () => {
    const loadedPlayers = await loadFromGoogleDrive();
    if (loadedPlayers) {
      onPlayersLoaded(loadedPlayers);
    }
  };

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Never';
    return date.toLocaleString();
  };

  return (
    <div className="google-drive-sync">
      <h4>☁️ Google Drive Sync</h4>
      
      {showConfig && (
        <div className="config-section">
          <h5>🔧 Configuration</h5>
          <p className="config-help">
            To use Google Drive sync, you need to set up Google API credentials:
          </p>
          <ol className="setup-steps">
            <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">Google Cloud Console</a></li>
            <li>Create a project and enable Google Drive API</li>
            <li>Create credentials (OAuth 2.0 Client ID)</li>
            <li>Add your domain to authorized origins</li>
            <li>Get your Client ID and API Key</li>
          </ol>
          
          <div className="config-inputs">
            <div className="input-group">
              <label>Google Client ID:</label>
              <input
                type="text"
                value={config.clientId}
                onChange={(e) => setConfig(prev => ({ ...prev, clientId: e.target.value }))}
                placeholder="Your Google Client ID"
              />
            </div>
            
            <div className="input-group">
              <label>Google API Key:</label>
              <input
                type="text"
                value={config.apiKey}
                onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="Your Google API Key"
              />
            </div>
            
            <div className="input-group">
              <label>Folder ID (optional):</label>
              <input
                type="text"
                value={config.folderId}
                onChange={(e) => setConfig(prev => ({ ...prev, folderId: e.target.value }))}
                placeholder="Google Drive Folder ID (optional)"
              />
            </div>
          </div>
          
          <button 
            className="hide-config-btn"
            onClick={() => setShowConfig(false)}
          >
            ✅ Done
          </button>
        </div>
      )}

      <div className="drive-status">
        {isConnected ? (
          <div className="connected-status">
            <span className="status-indicator connected">✅ Connected to Google Drive</span>
            <div className="sync-info">
              <small>Last sync: {formatLastSync(lastSync)}</small>
              <button className="disconnect-btn" onClick={disconnect}>
                🔌 Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="disconnected-status">
            <span className="status-indicator disconnected">⚠️ Not connected</span>
            <button 
              className="connect-btn" 
              onClick={handleConnect}
              disabled={isLoading}
            >
              {isLoading ? '🔄 Connecting...' : '🔗 Connect to Google Drive'}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          <span>❌ {error}</span>
          <button onClick={clearError} className="clear-error-btn">✕</button>
        </div>
      )}

      {isConnected && (
        <div className="drive-actions">
          <button
            className="save-btn"
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? '🔄 Saving...' : '☁️ Save to Google Drive'}
          </button>
          
          <button
            className="load-btn"
            onClick={handleLoad}
            disabled={isLoading}
          >
            {isLoading ? '🔄 Loading...' : '📥 Load from Google Drive'}
          </button>
        </div>
      )}

      {!showConfig && (
        <button 
          className="show-config-btn"
          onClick={() => setShowConfig(true)}
        >
          ⚙️ Configure
        </button>
      )}
    </div>
  );
};
