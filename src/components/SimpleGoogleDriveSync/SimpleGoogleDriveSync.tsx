import React, { useState } from 'react';
import { Player } from '../../types';
import './SimpleGoogleDriveSync.css';

interface SimpleGoogleDriveSyncProps {
  players: Player[];
  onPlayersLoaded: (players: Player[]) => void;
}

export const SimpleGoogleDriveSync: React.FC<SimpleGoogleDriveSyncProps> = ({
  players,
  onPlayersLoaded
}) => {
  const [driveUrl, setDriveUrl] = useState(
    localStorage.getItem('badminton-drive-url') || ''
  );
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

  const handleExportToGoogleDrive = () => {
    // Create and download JSON file with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `badminton-players-${timestamp}.json`;
    const dataStr = JSON.stringify(players, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setMessage({ 
      type: 'success', 
      text: `📥 Downloaded ${fileName}. Now upload it to your Google Drive folder!` 
    });

    // Clear message after 5 seconds
    setTimeout(() => setMessage(null), 5000);
  };

  const handleLoadFromGoogleDrive = async () => {
    if (!driveUrl) {
      setMessage({ 
        type: 'error', 
        text: 'Please enter your Google Drive file URL first!' 
      });
      return;
    }

    setIsLoading(true);
    setMessage({ type: 'info', text: 'Loading from Google Drive...' });

    try {
      // Convert Google Drive view URL to direct download URL
      const fileId = extractFileIdFromUrl(driveUrl);
      if (!fileId) {
        throw new Error('Invalid Google Drive URL. Please use the sharing URL from Google Drive.');
      }

      const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      
      const response = await fetch(directUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch file from Google Drive. Make sure the file is publicly accessible.');
      }

      const data = await response.text();
      const players = JSON.parse(data);

      // Validate the data
      if (!Array.isArray(players)) {
        throw new Error('Invalid file format: expected an array of players');
      }

      // Basic validation for each player
      for (const player of players) {
        if (!player.id || !player.name || typeof player.level !== 'number' || 
            player.level < 1 || player.level > 5 || typeof player.isPresent !== 'boolean') {
          throw new Error('Invalid player data structure in the file');
        }
      }

      onPlayersLoaded(players);
      setMessage({ 
        type: 'success', 
        text: `✅ Successfully loaded ${players.length} players from Google Drive!` 
      });

      // Save the working URL for future use
      localStorage.setItem('badminton-drive-url', driveUrl);

    } catch (error) {
      console.error('Failed to load from Google Drive:', error);
      setMessage({ 
        type: 'error', 
        text: `❌ ${error instanceof Error ? error.message : 'Failed to load from Google Drive'}` 
      });
    } finally {
      setIsLoading(false);
      // Clear message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const extractFileIdFromUrl = (url: string): string | null => {
    // Handle various Google Drive URL formats
    const patterns = [
      /\/file\/d\/([a-zA-Z0-9-_]+)/,  // /file/d/FILE_ID/
      /id=([a-zA-Z0-9-_]+)/,          // ?id=FILE_ID
      /\/([a-zA-Z0-9-_]{25,})/        // Generic file ID pattern
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  };

  const saveDriveUrl = (url: string) => {
    setDriveUrl(url);
    if (url) {
      localStorage.setItem('badminton-drive-url', url);
    }
  };

  return (
    <div className="simple-google-drive-sync">
      <h4>☁️ Google Drive Sync (Simple)</h4>
      
      <div className="sync-explanation">
        <p>
          <strong>How it works:</strong>
        </p>
        <ol>
          <li>Click "📤 Export for Google Drive" to download your player data</li>
          <li>Upload the downloaded file to your Google Drive folder</li>
          <li>Make the file publicly shareable and copy the sharing URL</li>
          <li>Paste the URL below and click "📥 Load from Google Drive"</li>
        </ol>
      </div>

      <div className="export-section">
        <button 
          className="export-drive-btn"
          onClick={handleExportToGoogleDrive}
        >
          📤 Export for Google Drive
        </button>
        <small>Downloads a JSON file ready for Google Drive upload</small>
      </div>

      <div className="import-section">
        <div className="url-input-group">
          <label htmlFor="drive-url">Google Drive File URL:</label>
          <input
            id="drive-url"
            type="url"
            value={driveUrl}
            onChange={(e) => saveDriveUrl(e.target.value)}
            placeholder="https://drive.google.com/file/d/your-file-id/view?usp=sharing"
            className="drive-url-input"
          />
        </div>
        
        <button 
          className="load-drive-btn"
          onClick={handleLoadFromGoogleDrive}
          disabled={isLoading || !driveUrl}
        >
          {isLoading ? '🔄 Loading...' : '📥 Load from Google Drive'}
        </button>
      </div>

      {message && (
        <div className={`sync-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="help-section">
        <details>
          <summary>📖 How to get Google Drive URL</summary>
          <div className="help-content">
            <ol>
              <li>Upload your JSON file to Google Drive</li>
              <li>Right-click the file → Share</li>
              <li>Change to "Anyone with the link can view"</li>
              <li>Click "Copy link"</li>
              <li>Paste the link in the field above</li>
            </ol>
            <p><small>The URL should look like: https://drive.google.com/file/d/1A2B3C.../view?usp=sharing</small></p>
          </div>
        </details>
      </div>
    </div>
  );
};
