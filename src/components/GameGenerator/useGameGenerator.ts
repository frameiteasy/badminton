import { useState, useRef, useCallback, useEffect } from 'react';
import { Player, GameRound } from '../../types';
import { generateOptimalGames, getGameStatistics, GameGenerationResult } from '../../utils/gameAlgorithm';

export interface UseGameGeneratorReturn {
  isGenerating: boolean;
  lastResult: GameGenerationResult | null;
  statistics: ReturnType<typeof getGameStatistics> | null;
  canGenerateGames: boolean;
  maxDoublesGames: number;
  maxSinglesGames: number;
  handleGenerateGames: () => void;
}

export const useGameGenerator = (
  presentPlayers: Player[],
  onGamesGenerated: (result: GameGenerationResult) => void,
  forceRegenerate?: number,
  gameHistory: GameRound[] = []
): UseGameGeneratorReturn => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastResult, setLastResult] = useState<GameGenerationResult | null>(null);
  const lastForceRef = useRef(0);

  const canGenerateGames = presentPlayers.length >= 2;
  const maxDoublesGames = Math.floor(presentPlayers.length / 4);
  const remainingForSingles = presentPlayers.length % 4;
  const maxSinglesGames = Math.floor(remainingForSingles / 2);

  const statistics = lastResult ? getGameStatistics(lastResult) : null;

  const handleGenerateGames = useCallback(() => {
    if (!canGenerateGames) return;

    setIsGenerating(true);
    
    // Add a small delay for better UX
    setTimeout(() => {
      const result = generateOptimalGames(presentPlayers, gameHistory);
      setLastResult(result);
      onGamesGenerated(result);
      setIsGenerating(false);
    }, 500);
  }, [presentPlayers, onGamesGenerated, canGenerateGames, gameHistory]);

  // Auto-generate when forceRegenerate changes
  useEffect(() => {
    if (forceRegenerate && forceRegenerate > lastForceRef.current) {
      lastForceRef.current = forceRegenerate;
      handleGenerateGames();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceRegenerate]);

  return {
    isGenerating,
    lastResult,
    statistics,
    canGenerateGames,
    maxDoublesGames,
    maxSinglesGames,
    handleGenerateGames,
  };
};
