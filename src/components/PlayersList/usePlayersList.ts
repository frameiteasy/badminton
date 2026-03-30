import { useState, useCallback, useEffect } from 'react';
import { Player } from '../../types';
import playersData from '../../data/players.json';

const STORAGE_KEY = 'badminton-players';

// Helper functions for localStorage
const savePlayersToStorage = (players: Player[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
  } catch (error) {
    console.warn('Failed to save players to localStorage:', error);
  }
};

const loadPlayersFromStorage = (): Player[] | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn('Failed to load players from localStorage:', error);
    return null;
  }
};

export interface UsePlayersListReturn {
  players: Player[];
  presentPlayers: Player[];
  handleTogglePresence: (playerId: string) => void;
  handleAddPlayer: (newPlayer: Omit<Player, 'id' | 'isPresent'>) => void;
  handleEditPlayer: (playerId: string, updatedData: Partial<Pick<Player, 'name' | 'level' | 'noSingles'>>) => void;
  handleDeletePlayer: (playerId: string) => void;
  handleExportPlayers: () => void;
  handleImportPlayers: (file: File) => Promise<void>;
  handleResetToDefaults: () => void;
  handleRefreshFromDefaults: () => void;
  // Google Drive function - Hidden but ready for future use:
  // handleLoadPlayersFromDrive: (players: Player[]) => void;
}

export const usePlayersList = (): UsePlayersListReturn => {
  const [players, setPlayers] = useState<Player[]>([]);

  // Initialize with stored data or default data
  useEffect(() => {
    const storedPlayers = loadPlayersFromStorage();
    if (storedPlayers && storedPlayers.length > 0) {
      setPlayers(storedPlayers);
    } else {
      // First time: load default players and save to localStorage
      const defaultPlayers = playersData as Player[];
      setPlayers(defaultPlayers);
      savePlayersToStorage(defaultPlayers);
    }
  }, []);

  // Save to localStorage whenever players change
  useEffect(() => {
    if (players.length > 0) {
      savePlayersToStorage(players);
    }
  }, [players]);

  const presentPlayers = players.filter(player => player.isPresent);

  const handleTogglePresence = useCallback((playerId: string) => {
    setPlayers(prevPlayers =>
      prevPlayers.map(player =>
        player.id === playerId
          ? { ...player, isPresent: !player.isPresent }
          : player
      )
    );
  }, []);

  const handleAddPlayer = useCallback((newPlayer: Omit<Player, 'id' | 'isPresent'>) => {
    const player: Player = {
      ...newPlayer,
      id: Date.now().toString(), // Simple ID generation
      isPresent: false,
    };
    setPlayers(prevPlayers => [...prevPlayers, player]);
  }, []);

  const handleEditPlayer = useCallback((playerId: string, updatedData: Partial<Pick<Player, 'name' | 'level' | 'noSingles'>>) => {
    setPlayers(prevPlayers =>
      prevPlayers.map(player =>
        player.id === playerId
          ? { ...player, ...updatedData }
          : player
      )
    );
  }, []);

  const handleDeletePlayer = useCallback((playerId: string) => {
    setPlayers(prevPlayers =>
      prevPlayers.filter(player => player.id !== playerId)
    );
  }, []);

  const handleExportPlayers = useCallback(() => {
    const dataStr = JSON.stringify(players, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `badminton-players-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [players]);

  const handleImportPlayers = useCallback(async (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const importedPlayers = JSON.parse(content) as Player[];
          
          // Validate the imported data
          if (!Array.isArray(importedPlayers)) {
            throw new Error('Invalid file format: expected an array of players');
          }
          
          // Basic validation for each player
          for (const player of importedPlayers) {
            if (!player.id || !player.name || typeof player.level !== 'number' || 
                player.level < 1 || player.level > 5 || typeof player.isPresent !== 'boolean') {
              throw new Error('Invalid player data structure');
            }
          }
          
          setPlayers(importedPlayers);
          resolve();
        } catch (error) {
          reject(new Error(`Failed to import players: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  }, []);

  const handleResetToDefaults = useCallback(() => {
    if (window.confirm('This will reset all players to the default list and remove any custom players. Are you sure?')) {
      const defaultPlayers = playersData as Player[];
      setPlayers(defaultPlayers);
      // Clear localStorage so it gets repopulated with defaults
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const handleRefreshFromDefaults = useCallback(() => {
    // Force refresh from the JSON file without confirmation
    const defaultPlayers = playersData as Player[];
    setPlayers(defaultPlayers);
    // Update localStorage with the new data
    savePlayersToStorage(defaultPlayers);
  }, []);

  // Google Drive function - Hidden but preserved for future use
  const handleLoadPlayersFromDrive = useCallback((loadedPlayers: Player[]) => {
    setPlayers(loadedPlayers);
  }, []);

  return {
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
  };
};
