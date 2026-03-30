import { useState, useCallback, useEffect } from 'react';
import { GameResult } from '../types';

const STORAGE_KEY = 'badminton-game-results';

// Helper functions for localStorage
const saveResultsToStorage = (results: GameResult[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
  } catch (error) {
    console.warn('Failed to save game results to localStorage:', error);
  }
};

const loadResultsFromStorage = (): GameResult[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('Failed to load game results from localStorage:', error);
    return [];
  }
};

export interface UseGameResultsReturn {
  gameResults: GameResult[];
  addGameResult: (gameId: string, result: Omit<GameResult, 'gameId'>) => void;
  updateGameResult: (gameId: string, result: Partial<GameResult>) => void;
  deleteGameResult: (gameId: string) => void;
  getGameResult: (gameId: string) => GameResult | undefined;
  getPlayerStats: (playerId: string) => {
    totalGames: number;
    wins: number;
    losses: number;
    winRate: number;
    averageScore: number;
  };
  clearAllResults: () => void;
  exportResults: () => void;
  importResults: (file: File) => Promise<void>;
}

export const useGameResults = (): UseGameResultsReturn => {
  const [gameResults, setGameResults] = useState<GameResult[]>([]);

  // Load results from localStorage on mount
  useEffect(() => {
    const storedResults = loadResultsFromStorage();
    setGameResults(storedResults);
  }, []);

  // Save to localStorage whenever results change
  useEffect(() => {
    saveResultsToStorage(gameResults);
  }, [gameResults]);

  const addGameResult = useCallback((gameId: string, result: Omit<GameResult, 'gameId'>) => {
    const newResult: GameResult = {
      ...result,
      gameId,
      completedAt: result.completedAt || new Date(),
    };

    setGameResults(prevResults => {
      // Remove any existing result for this game first
      const filteredResults = prevResults.filter(r => r.gameId !== gameId);
      return [...filteredResults, newResult];
    });
  }, []);

  const updateGameResult = useCallback((gameId: string, updates: Partial<GameResult>) => {
    setGameResults(prevResults =>
      prevResults.map(result =>
        result.gameId === gameId
          ? { ...result, ...updates }
          : result
      )
    );
  }, []);

  const deleteGameResult = useCallback((gameId: string) => {
    setGameResults(prevResults =>
      prevResults.filter(result => result.gameId !== gameId)
    );
  }, []);

  const getGameResult = useCallback((gameId: string): GameResult | undefined => {
    return gameResults.find(result => result.gameId === gameId);
  }, [gameResults]);

  const getPlayerStats = useCallback((playerId: string) => {
    const playerResults = gameResults.filter(result => {
      // For singles games, check if player is winner or if they're involved
      // For doubles games, check if player's team won
      return result.winnerId === playerId || 
             result.winnerId.includes(playerId); // This might need game context
    });

    const totalGames = playerResults.length;
    const wins = playerResults.filter(result => result.winnerId === playerId).length;
    const losses = totalGames - wins;
    const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;
    
    const totalPoints = playerResults.reduce((sum, result) => {
      // This is simplified - might need game context to determine which score belongs to the player
      return sum + Math.max(result.team1Score, result.team2Score);
    }, 0);
    
    const averageScore = totalGames > 0 ? totalPoints / totalGames : 0;

    return {
      totalGames,
      wins,
      losses,
      winRate: Math.round(winRate * 100) / 100,
      averageScore: Math.round(averageScore * 100) / 100,
    };
  }, [gameResults]);

  const clearAllResults = useCallback(() => {
    if (window.confirm('Are you sure you want to delete all game results? This action cannot be undone.')) {
      setGameResults([]);
    }
  }, []);

  const exportResults = useCallback(() => {
    const dataStr = JSON.stringify(gameResults, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `badminton-results-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [gameResults]);

  const importResults = useCallback(async (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const importedResults = JSON.parse(content) as GameResult[];
          
          // Validate the imported data
          if (!Array.isArray(importedResults)) {
            throw new Error('Invalid file format: expected an array of game results');
          }
          
          // Basic validation for each result
          for (const result of importedResults) {
            if (!result.gameId || typeof result.team1Score !== 'number' || 
                typeof result.team2Score !== 'number' || !result.winnerId) {
              throw new Error('Invalid game result data structure');
            }
          }
          
          setGameResults(importedResults);
          resolve();
        } catch (error) {
          reject(new Error(`Failed to import results: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  }, []);

  return {
    gameResults,
    addGameResult,
    updateGameResult,
    deleteGameResult,
    getGameResult,
    getPlayerStats,
    clearAllResults,
    exportResults,
    importResults,
  };
};
