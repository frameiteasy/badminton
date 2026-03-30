# 🌐 Google Drive Integration Guide

## Overview

Integrating your Badminton Court Manager with Google Drive would provide cloud storage, automatic syncing, and team collaboration features. Here are the implementation options:

## 🎯 Integration Approaches

### 1. 📄 Google Drive API Integration (Recommended)

This approach allows direct read/write access to Google Drive files from your app.

#### **Setup Steps:**

1. **Enable Google Drive API**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google Drive API
   - Create credentials (OAuth 2.0)

2. **Install Dependencies**
```bash
npm install googleapis google-auth-library
```

3. **Implementation Example**
```javascript
// Google Drive service setup
import { GoogleAuth } from 'google-auth-library';
import { drive_v3 } from 'googleapis';

const auth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/drive.file'],
  credentials: {
    client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
    client_secret: process.env.REACT_APP_GOOGLE_CLIENT_SECRET,
  }
});

const drive = drive_v3({ version: 'v3', auth });

// Save players to Google Drive
const savePlayersToGoogleDrive = async (players) => {
  const fileContent = JSON.stringify(players, null, 2);
  
  try {
    // Check if file exists
    const existingFile = await findPlayerFile();
    
    if (existingFile) {
      // Update existing file
      await drive.files.update({
        fileId: existingFile.id,
        media: {
          mimeType: 'application/json',
          body: fileContent
        }
      });
    } else {
      // Create new file
      await drive.files.create({
        requestBody: {
          name: 'badminton-players.json',
          parents: ['your-folder-id'] // Optional: specific folder
        },
        media: {
          mimeType: 'application/json',
          body: fileContent
        }
      });
    }
  } catch (error) {
    console.error('Failed to save to Google Drive:', error);
  }
};

// Load players from Google Drive
const loadPlayersFromGoogleDrive = async () => {
  try {
    const file = await findPlayerFile();
    if (!file) return null;
    
    const response = await drive.files.get({
      fileId: file.id,
      alt: 'media'
    });
    
    return JSON.parse(response.data);
  } catch (error) {
    console.error('Failed to load from Google Drive:', error);
    return null;
  }
};
```

#### **Benefits:**
- ✅ Automatic cloud backup
- ✅ Real-time syncing across devices
- ✅ No manual file management
- ✅ Version history in Google Drive
- ✅ Team collaboration features

### 2. 📋 Google Sheets Integration (Alternative)

Store player data in a Google Sheet for easy editing and collaboration.

```javascript
// Google Sheets integration
import { GoogleAuth } from 'google-auth-library';
import { sheets_v4 } from 'googleapis';

const sheets = sheets_v4({ version: 'v4', auth });

// Save to Google Sheet
const savePlayersToSheet = async (players) => {
  const values = players.map(player => [
    player.id,
    player.name,
    player.level,
    player.isPresent
  ]);
  
  await sheets.spreadsheets.values.update({
    spreadsheetId: 'your-sheet-id',
    range: 'Players!A2:D',
    valueInputOption: 'RAW',
    requestBody: {
      values: values
    }
  });
};

// Load from Google Sheet
const loadPlayersFromSheet = async () => {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: 'your-sheet-id',
    range: 'Players!A2:D'
  });
  
  return response.data.values?.map(row => ({
    id: row[0],
    name: row[1],
    level: parseInt(row[2]),
    isPresent: row[3] === 'TRUE'
  })) || [];
};
```

#### **Benefits:**
- ✅ Easy manual editing in Google Sheets
- ✅ Familiar spreadsheet interface
- ✅ Built-in sharing and permissions
- ✅ Formula support for statistics
- ✅ Export to other formats

### 3. 🔗 Google Drive File Picker (Simple Approach)

Use Google's file picker for manual file operations.

```javascript
// Google Drive File Picker
const loadGooglePicker = () => {
  return new Promise((resolve) => {
    if (window.gapi) {
      resolve();
    } else {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = resolve;
      document.head.appendChild(script);
    }
  });
};

const openFilePicker = () => {
  const picker = new window.google.picker.PickerBuilder()
    .addView(window.google.picker.ViewId.DOCS)
    .setOAuthToken(accessToken)
    .setCallback(handleFileSelection)
    .build();
  
  picker.setVisible(true);
};
```

## 🛠️ Implementation Plan

### Phase 1: Basic Google Drive Integration

Let me implement a Google Drive hook for your existing app:

```javascript
// useGoogleDrive.ts
import { useState, useCallback } from 'react';

export const useGoogleDrive = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const connectToGoogleDrive = useCallback(async () => {
    setIsLoading(true);
    try {
      // Initialize Google Auth
      await window.gapi.load('auth2', () => {
        window.gapi.auth2.init({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID
        });
      });
      
      const authInstance = window.gapi.auth2.getAuthInstance();
      await authInstance.signIn();
      
      setIsConnected(true);
      setError(null);
    } catch (err) {
      setError('Failed to connect to Google Drive');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveToGoogleDrive = useCallback(async (players) => {
    if (!isConnected) return;
    
    setIsLoading(true);
    try {
      // Implementation for saving to Google Drive
      await savePlayersToGoogleDrive(players);
    } catch (err) {
      setError('Failed to save to Google Drive');
    } finally {
      setIsLoading(false);
    }
  }, [isConnected]);

  const loadFromGoogleDrive = useCallback(async () => {
    if (!isConnected) return null;
    
    setIsLoading(true);
    try {
      const players = await loadPlayersFromGoogleDrive();
      return players;
    } catch (err) {
      setError('Failed to load from Google Drive');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected]);

  return {
    isConnected,
    isLoading,
    error,
    connectToGoogleDrive,
    saveToGoogleDrive,
    loadFromGoogleDrive
  };
};
```

### Phase 2: Enhanced PlayersList Component

```javascript
// Enhanced PlayersList with Google Drive
const PlayersList = ({ /* existing props */ }) => {
  const {
    isConnected,
    connectToGoogleDrive,
    saveToGoogleDrive,
    loadFromGoogleDrive
  } = useGoogleDrive();

  return (
    <div className="players-list">
      {/* Existing player management UI */}
      
      <div className="google-drive-section">
        <h4>☁️ Google Drive Sync</h4>
        
        {!isConnected ? (
          <button onClick={connectToGoogleDrive}>
            🔗 Connect to Google Drive
          </button>
        ) : (
          <div className="drive-actions">
            <button onClick={() => saveToGoogleDrive(players)}>
              ☁️ Save to Google Drive
            </button>
            <button onClick={handleLoadFromDrive}>
              📥 Load from Google Drive
            </button>
            <span className="sync-status">✅ Connected</span>
          </div>
        )}
      </div>
    </div>
  );
};
```

## 🔧 Quick Implementation Options

### Option 1: Manual Google Drive Integration

**Right Now (5 minutes):**
1. Create a Google Drive folder for your badminton data
2. Manually upload exported JSON files
3. Share folder with team members
4. Download and import when needed

**Benefits:**
- ✅ Works immediately
- ✅ No coding required
- ✅ Team sharing
- ✅ Version control

### Option 2: Google Apps Script Bridge

Create a simple Google Apps Script to bridge your app with Google Drive:

```javascript
// Google Apps Script (run in Google Drive)
function savePlayersData(playersJson) {
  const folder = DriveApp.getFolderById('your-folder-id');
  const fileName = 'badminton-players-' + new Date().toISOString().split('T')[0] + '.json';
  
  // Delete old file if exists
  const existingFiles = folder.getFilesByName('badminton-players.json');
  while (existingFiles.hasNext()) {
    existingFiles.next().setTrashed(true);
  }
  
  // Create new file
  folder.createFile('badminton-players.json', playersJson);
  
  return { success: true, message: 'Players saved to Google Drive' };
}

function loadPlayersData() {
  const folder = DriveApp.getFolderById('your-folder-id');
  const files = folder.getFilesByName('badminton-players.json');
  
  if (files.hasNext()) {
    const file = files.next();
    return JSON.parse(file.getBlob().getDataAsString());
  }
  
  return null;
}
```

### Option 3: Full Google Drive API Integration

**Complete implementation with:**
- OAuth authentication
- Real-time syncing
- Conflict resolution
- Offline support
- Team collaboration

## 📱 User Experience with Google Drive

### Seamless Sync Flow

1. **First Time Setup:**
   ```
   User clicks "Connect to Google Drive" 
   → Google OAuth popup
   → Permission granted
   → Automatic sync enabled
   ```

2. **Daily Usage:**
   ```
   User adds/edits players 
   → Auto-save to localStorage (immediate)
   → Auto-sync to Google Drive (background)
   → Available on all devices
   ```

3. **Team Collaboration:**
   ```
   Manager updates players
   → Saves to shared Google Drive file
   → Team members get notification
   → Auto-sync updates their local data
   ```

### UI Enhancements

```javascript
// Sync status indicator
const SyncStatus = ({ isConnected, lastSync, isLoading }) => (
  <div className="sync-status">
    {isLoading && <span>🔄 Syncing...</span>}
    {isConnected && !isLoading && (
      <span>✅ Synced {formatTime(lastSync)}</span>
    )}
    {!isConnected && <span>⚠️ Not connected to Google Drive</span>}
  </div>
);
```

## 🚀 Implementation Recommendation

### Immediate (This Week):
1. **Manual Google Drive workflow**
   - Create shared Google Drive folder
   - Use existing export/import with Drive
   - Share with team members

### Short Term (Next Sprint):
2. **Google Apps Script bridge**
   - Simple API for save/load
   - Direct Google Drive integration
   - No complex auth setup

### Long Term (Future Enhancement):
3. **Full Google Drive API**
   - Real-time syncing
   - Conflict resolution
   - Multi-user collaboration

## 🎯 Benefits Summary

**For Your Team:**
- ✅ **Centralized Data**: One source of truth for player lists
- ✅ **Team Access**: Everyone has latest player information
- ✅ **Backup Security**: Never lose player data again
- ✅ **Cross-Device**: Access from any device, anywhere

**For Your App:**
- ✅ **Cloud Storage**: Reliable, scalable storage
- ✅ **Sync Capability**: Multi-device synchronization
- ✅ **Collaboration**: Team can update player lists
- ✅ **Version History**: Google Drive tracks changes

**Would you like me to implement any of these Google Drive integration approaches?** 

I can start with the manual workflow (immediate) or implement the Google Apps Script bridge for more automation. Let me know which approach interests you most! 🚀
