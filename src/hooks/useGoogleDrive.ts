import { useState, useCallback, useEffect } from 'react';
import { Player } from '../types';

// Google API type declarations
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

interface GoogleDriveConfig {
  clientId: string;
  apiKey: string;
  folderId?: string;
}

export interface UseGoogleDriveReturn {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  lastSync: Date | null;
  connectToGoogleDrive: () => Promise<void>;
  saveToGoogleDrive: (players: Player[]) => Promise<void>;
  loadFromGoogleDrive: () => Promise<Player[] | null>;
  disconnect: () => void;
  clearError: () => void;
}

export const useGoogleDrive = (config?: GoogleDriveConfig): UseGoogleDriveReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [gapi, setGapi] = useState<any>(null);

  // Load Google API
  useEffect(() => {
    const loadGoogleAPI = async () => {
      if (window.gapi) {
        setGapi(window.gapi);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('client:auth2:picker', () => {
          setGapi(window.gapi);
        });
      };
      document.head.appendChild(script);
    };

    loadGoogleAPI();
  }, []);

  const initializeGoogleAPI = useCallback(async () => {
    if (!gapi || !config?.clientId) return false;

    try {
      await gapi.client.init({
        apiKey: config.apiKey,
        clientId: config.clientId,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        scope: 'https://www.googleapis.com/auth/drive.file'
      });

      const authInstance = gapi.auth2.getAuthInstance();
      const isSignedIn = authInstance.isSignedIn.get();
      setIsConnected(isSignedIn);
      
      return true;
    } catch (err) {
      console.error('Failed to initialize Google API:', err);
      setError('Failed to initialize Google Drive connection');
      return false;
    }
  }, [gapi, config]);

  const connectToGoogleDrive = useCallback(async () => {
    if (!gapi) {
      setError('Google API not loaded');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const initialized = await initializeGoogleAPI();
      if (!initialized) return;

      const authInstance = gapi.auth2.getAuthInstance();
      
      if (!authInstance.isSignedIn.get()) {
        await authInstance.signIn();
      }

      setIsConnected(true);
      setError(null);
    } catch (err: any) {
      console.error('Google Drive connection failed:', err);
      setError(err.error || 'Failed to connect to Google Drive');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [gapi, initializeGoogleAPI]);

  const findOrCreatePlayerFile = useCallback(async () => {
    const fileName = 'badminton-players.json';
    
    // Search for existing file
    const response = await gapi.client.drive.files.list({
      q: `name='${fileName}' and trashed=false`,
      spaces: 'drive'
    });

    if (response.result.files && response.result.files.length > 0) {
      return response.result.files[0].id;
    }

    // Create new file if not found
    const fileMetadata = {
      name: fileName,
      parents: config?.folderId ? [config.folderId] : undefined
    };

    const createResponse = await gapi.client.drive.files.create({
      resource: fileMetadata
    });

    return createResponse.result.id;
  }, [gapi, config]);

  const saveToGoogleDrive = useCallback(async (players: Player[]) => {
    if (!isConnected || !gapi) {
      setError('Not connected to Google Drive');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fileId = await findOrCreatePlayerFile();
      const fileContent = JSON.stringify(players, null, 2);

      // Update file content
      await gapi.client.request({
        path: `https://www.googleapis.com/upload/drive/v3/files/${fileId}`,
        method: 'PATCH',
        params: {
          uploadType: 'media'
        },
        headers: {
          'Content-Type': 'application/json'
        },
        body: fileContent
      });

      setLastSync(new Date());
      setError(null);
    } catch (err: any) {
      console.error('Failed to save to Google Drive:', err);
      setError('Failed to save players to Google Drive');
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, gapi, findOrCreatePlayerFile]);

  const loadFromGoogleDrive = useCallback(async (): Promise<Player[] | null> => {
    if (!isConnected || !gapi) {
      setError('Not connected to Google Drive');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fileId = await findOrCreatePlayerFile();

      const response = await gapi.client.drive.files.get({
        fileId: fileId,
        alt: 'media'
      });

      const players = JSON.parse(response.body);
      
      // Validate the loaded data
      if (!Array.isArray(players)) {
        throw new Error('Invalid file format');
      }

      setLastSync(new Date());
      setError(null);
      return players;
    } catch (err: any) {
      console.error('Failed to load from Google Drive:', err);
      setError('Failed to load players from Google Drive');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, gapi, findOrCreatePlayerFile]);

  const disconnect = useCallback(() => {
    if (gapi && gapi.auth2) {
      const authInstance = gapi.auth2.getAuthInstance();
      authInstance.signOut();
    }
    setIsConnected(false);
    setLastSync(null);
    setError(null);
  }, [gapi]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isConnected,
    isLoading,
    error,
    lastSync,
    connectToGoogleDrive,
    saveToGoogleDrive,
    loadFromGoogleDrive,
    disconnect,
    clearError
  };
};
