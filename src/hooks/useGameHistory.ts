import { useState, useCallback } from 'react';
import { GameRound, Player } from '../types';
import { GameGenerationResult } from '../utils/gameAlgorithm';

export interface UseGameHistoryReturn {
  gameRounds: GameRound[];
  nextRoundNumber: number;
  forceRegenerate: number;
  handleGamesGenerated: (result: GameGenerationResult) => void;
  handleNewGeneration: () => void;
  handleNewArrangement: () => void;
  handleClearHistory: () => void;
}

export const useGameHistory = (presentPlayers: Player[] = []): UseGameHistoryReturn => {
  const [gameRounds, setGameRounds] = useState<GameRound[]>([]);
  const [nextRoundNumber, setNextRoundNumber] = useState(1);
  const [forceRegenerate, setForceRegenerate] = useState(0);

  const handleGamesGenerated = useCallback((result: GameGenerationResult) => {
    const newRound: GameRound = {
      id: `round-${Date.now()}`,
      roundNumber: nextRoundNumber,
      timestamp: new Date(),
      games: result.games,
      unpairedPlayers: result.unpairedPlayers,
      totalGames: result.totalGames,
      doublesGames: result.doublesGames,
      singlesGames: result.singlesGames,
    };
    
    setGameRounds(prevRounds => [...prevRounds, newRound]);
    setNextRoundNumber(prev => prev + 1);
  }, [nextRoundNumber]);

  const handleNewGeneration = useCallback(() => {
    // Generate a new round (new round number)
    if (presentPlayers.length >= 2) {
      setForceRegenerate(prev => prev + 1);
    }
  }, [presentPlayers.length]);

  const handleNewArrangement = useCallback(() => {
    // Generate new arrangement for the current round (replace the latest round)
    if (presentPlayers.length >= 2 && gameRounds.length > 0) {
      // Remove the latest round and generate a new arrangement
      setGameRounds(prevRounds => prevRounds.slice(0, -1));
      setNextRoundNumber(prev => prev - 1);
      // Trigger new generation which will create a replacement round
      setTimeout(() => {
        setForceRegenerate(prev => prev + 1);
      }, 100);
    }
  }, [presentPlayers.length, gameRounds.length]);

  const handleClearHistory = useCallback(() => {
    setGameRounds([]);
    setNextRoundNumber(1);
  }, []);

  return {
    gameRounds,
    nextRoundNumber,
    forceRegenerate,
    handleGamesGenerated,
    handleNewGeneration,
    handleNewArrangement,
    handleClearHistory,
  };
};
