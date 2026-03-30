import { Player, Game, SinglesGame, GameMatch, GameRound } from '../types';

function pairKey(id1: string, id2: string): string {
  return [id1, id2].sort().join('-');
}

function buildPartnerHistory(gameHistory: GameRound[]): Set<string> {
  const pairs = new Set<string>();
  gameHistory.slice(-5).forEach(round => {
    round.games.forEach(game => {
      if (game.type === 'doubles') {
        pairs.add(pairKey(game.team1[0].id, game.team1[1].id));
        pairs.add(pairKey(game.team2[0].id, game.team2[1].id));
      }
    });
  });
  return pairs;
}

interface TeamBalance {
  team1Total: number;
  team2Total: number;
  difference: number;
}

interface PlayerHistory {
  playerId: string;
  singlesGamesPlayed: number;
  lastSinglesRound: number | null;
  timesWaited: number;
  lastWaitedRound: number | null;
}

export interface GameGenerationResult {
  games: GameMatch[];
  unpairedPlayers: Player[];
  totalGames: number;
  doublesGames: number;
  singlesGames: number;
}

/**
 * Analyzes player history to determine fair singles pairings and waiting assignments
 */
function analyzePlayerHistory(players: Player[], gameHistory: GameRound[] = []): Map<string, PlayerHistory> {
  const playerHistory = new Map<string, PlayerHistory>();
  
  // Initialize history for all players
  players.forEach(player => {
    playerHistory.set(player.id, {
      playerId: player.id,
      singlesGamesPlayed: 0,
      lastSinglesRound: null,
      timesWaited: 0,
      lastWaitedRound: null
    });
  });

  // Analyze game history (only look at recent rounds for fairness)
  const recentRounds = gameHistory.slice(-3); // Look at last 3 rounds for balance
  
  recentRounds.forEach(round => {
    // Track singles games
    round.games.forEach(game => {
      if (game.type === 'singles') {
        const player1History = playerHistory.get(game.player1.id);
        const player2History = playerHistory.get(game.player2.id);
        
        if (player1History) {
          player1History.singlesGamesPlayed++;
          player1History.lastSinglesRound = round.roundNumber;
        }
        
        if (player2History) {
          player2History.singlesGamesPlayed++;
          player2History.lastSinglesRound = round.roundNumber;
        }
      }
    });
    
    // Track waiting players
    round.unpairedPlayers?.forEach(player => {
      const playerHistoryEntry = playerHistory.get(player.id);
      if (playerHistoryEntry) {
        playerHistoryEntry.timesWaited++;
        playerHistoryEntry.lastWaitedRound = round.roundNumber;
      }
    });
  });

  return playerHistory;
}

/**
 * Determines fair waiting assignment based on history
 */
function selectWaitingPlayers(
  availablePlayers: Player[], 
  playerHistory: Map<string, PlayerHistory>,
  currentRoundNumber: number
): { waitingPlayers: Player[], playingPlayers: Player[] } {
  
  if (availablePlayers.length <= 1) {
    return { waitingPlayers: availablePlayers, playingPlayers: [] };
  }

  // If we have even number of players, no one needs to wait
  if (availablePlayers.length % 2 === 0) {
    return { waitingPlayers: [], playingPlayers: availablePlayers };
  }

  // We need 1 player to wait
  // Sort by: 1) times waited (ascending), 2) last waited round (ascending), 3) skill level preference
  const playersWithWaitHistory = availablePlayers.map(player => {
    const history = playerHistory.get(player.id) || {
      playerId: player.id,
      singlesGamesPlayed: 0,
      lastSinglesRound: null,
      timesWaited: 0,
      lastWaitedRound: null
    };
    return { player, history };
  });

  // Sort to find the fairest candidate to wait
  playersWithWaitHistory.sort((a, b) => {
    // Primary: whoever has waited fewer times should wait first
    if (a.history.timesWaited !== b.history.timesWaited) {
      return a.history.timesWaited - b.history.timesWaited;
    }
    
    // Secondary: if same wait count, whoever waited longer ago should wait
    const aLastWait = a.history.lastWaitedRound || -1;
    const bLastWait = b.history.lastWaitedRound || -1;
    if (aLastWait !== bLastWait) {
      return aLastWait - bLastWait;
    }
    
    // Tertiary: random selection to avoid always picking the same player
    return Math.random() - 0.5;
  });

  const waitingPlayer = playersWithWaitHistory[0].player;
  const playingPlayers = availablePlayers.filter(p => p.id !== waitingPlayer.id);

  return { waitingPlayers: [waitingPlayer], playingPlayers };
}

/**
 * Creates singles games with fairness considerations and consecutive round prevention
 */
function createSinglesGamesWithHistory(
  players: Player[], 
  startingCourtNumber: number, 
  playerHistory: Map<string, PlayerHistory>,
  currentRoundNumber: number
): { games: SinglesGame[], waitingPlayers: Player[] } {
  
  if (players.length < 2) {
    return { games: [], waitingPlayers: players };
  }

  // Determine who should wait (if anyone)
  const { waitingPlayers, playingPlayers } = selectWaitingPlayers(players, playerHistory, currentRoundNumber);

  if (playingPlayers.length < 2) {
    return { games: [], waitingPlayers: players };
  }

  const games: SinglesGame[] = [];
  let courtNumber = startingCourtNumber;

  // Create player pairs prioritizing those who haven't played singles recently
  const playersWithHistory = playingPlayers.map(player => {
    const history = playerHistory.get(player.id) || {
      playerId: player.id,
      singlesGamesPlayed: 0,
      lastSinglesRound: null,
      timesWaited: 0,
      lastWaitedRound: null
    };
    return { player, history };
  });

  // Filter out players who played singles in the immediately previous round
  const eligiblePlayers = playersWithHistory.filter(({ history }) => {
    // If this is round 1, everyone is eligible
    if (currentRoundNumber <= 1) return true;
    
    // If they never played singles, they're eligible
    if (history.lastSinglesRound === null) return true;
    
    // They're only eligible if they didn't play singles in the previous round
    return history.lastSinglesRound < currentRoundNumber - 1;
  });

  // If we don't have enough eligible players (due to consecutive game prevention),
  // we need to include some players from the previous round, but prioritize others first
  let finalPlayers = eligiblePlayers;
  
  if (eligiblePlayers.length < 2 && playersWithHistory.length >= 2) {
    // Not enough eligible players, so we include previous round players but with lowest priority
    const previousRoundPlayers = playersWithHistory.filter(({ history }) => 
      history.lastSinglesRound === currentRoundNumber - 1
    );
    
    // Add them to the end (lowest priority)
    finalPlayers = [...eligiblePlayers, ...previousRoundPlayers];
  }

  // Sort by singles game priority
  finalPlayers.sort((a, b) => {
    // Primary: Players who played singles in the previous round get lowest priority
    const aPlayedLastRound = a.history.lastSinglesRound === currentRoundNumber - 1;
    const bPlayedLastRound = b.history.lastSinglesRound === currentRoundNumber - 1;
    
    if (aPlayedLastRound !== bPlayedLastRound) {
      return aPlayedLastRound ? 1 : -1; // Non-consecutive players first
    }
    
    // Secondary: Players who played singles more recently should have lower priority
    const aLastSingles = a.history.lastSinglesRound || -1;
    const bLastSingles = b.history.lastSinglesRound || -1;
    
    if (aLastSingles !== bLastSingles) {
      return aLastSingles - bLastSingles; // Earlier round = higher priority
    }
    
    // Tertiary: fewer total singles games = higher priority
    if (a.history.singlesGamesPlayed !== b.history.singlesGamesPlayed) {
      return a.history.singlesGamesPlayed - b.history.singlesGamesPlayed;
    }
    
    // Quaternary: sort by skill level for balanced matches
    return a.player.level - b.player.level;
  });

  // Sort by skill level so consecutive pairs have the closest possible levels
  const availablePlayers = finalPlayers.map(ph => ph.player)
    .sort((a, b) => a.level - b.level);

  // Create pairs with balanced skill levels
  for (let i = 0; i < availablePlayers.length - 1; i += 2) {
    games.push({
      id: `singles-${Date.now()}-${courtNumber}`,
      court: courtNumber++,
      player1: availablePlayers[i],
      player2: availablePlayers[i + 1],
      type: 'singles'
    });
  }

  // Handle any remaining unpaired player
  const remainingPlayers = availablePlayers.length % 2 === 1 
    ? [availablePlayers[availablePlayers.length - 1]] 
    : [];

  return { 
    games, 
    waitingPlayers: [...waitingPlayers, ...remainingPlayers] 
  };
}

/**
 * Validates that a game doesn't have any player playing against themselves
 */
function validateGame(game: Game): boolean {
  const team1Ids = [game.team1[0].id, game.team1[1].id];
  const team2Ids = [game.team2[0].id, game.team2[1].id];
  
  // Check for any overlap between teams
  const hasOverlap = team1Ids.some(id => team2Ids.includes(id));
  return !hasOverlap;
}

/**
 * Validates that all games in the result are valid
 */
function validateAllGames(games: Game[]): boolean {
  return games.every(game => validateGame(game));
}

/**
 * Calculates the balance score for a doubles game
 */
function calculateTeamBalance(team1: [Player, Player], team2: [Player, Player]): TeamBalance {
  const team1Total = team1[0].level + team1[1].level;
  const team2Total = team2[0].level + team2[1].level;
  const difference = Math.abs(team1Total - team2Total);
  
  return { team1Total, team2Total, difference };
}

/**
 * Generates all possible team combinations for doubles
 */
function generateTeamCombinations(players: Player[]): [Player, Player][] {
  const teams: [Player, Player][] = [];
  
  for (let i = 0; i < players.length - 1; i++) {
    for (let j = i + 1; j < players.length; j++) {
      teams.push([players[i], players[j]]);
    }
  }
  
  return teams;
}

/**
 * Generates all valid game combinations (no player plays against themselves)
 * Sorted by balance first, then by number of repeated partner pairs (from history)
 */
function generateValidGameCombinations(
  teams: [Player, Player][],
  pastPartners: Set<string>
): { team1: [Player, Player], team2: [Player, Player], balance: TeamBalance, repeatedPartnerships: number }[] {
  const validCombinations: { team1: [Player, Player], team2: [Player, Player], balance: TeamBalance, repeatedPartnerships: number }[] = [];

  for (let i = 0; i < teams.length - 1; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const team1 = teams[i];
      const team2 = teams[j];

      // Check if any player appears on both teams
      const team1Ids = [team1[0].id, team1[1].id];
      const team2Ids = [team2[0].id, team2[1].id];
      const hasOverlap = team1Ids.some(id => team2Ids.includes(id));

      if (!hasOverlap) {
        const balance = calculateTeamBalance(team1, team2);
        const repeatedPartnerships =
          (pastPartners.has(pairKey(team1[0].id, team1[1].id)) ? 1 : 0) +
          (pastPartners.has(pairKey(team2[0].id, team2[1].id)) ? 1 : 0);
        validCombinations.push({ team1, team2, balance, repeatedPartnerships });
      }
    }
  }

  // Sort by balance first, then by repeated partnerships (prefer fresh pairings)
  validCombinations.sort((a, b) => {
    if (a.balance.difference !== b.balance.difference) {
      return a.balance.difference - b.balance.difference;
    }
    return a.repeatedPartnerships - b.repeatedPartnerships;
  });

  return validCombinations;
}

/**
 * Finds the best pairing for doubles games using improved algorithm
 */
function findBestDoublesPairings(players: Player[], gameHistory: GameRound[]): Game[] {
  if (players.length < 4) return [];

  const pastPartners = buildPartnerHistory(gameHistory);
  const teams = generateTeamCombinations(players);
  const validCombinations = generateValidGameCombinations(teams, pastPartners);
  const games: Game[] = [];
  const usedPlayers = new Set<string>();
  
  let courtNumber = 1;
  
  // Greedily select the most balanced games that don't reuse players
  for (const combination of validCombinations) {
    const { team1, team2 } = combination;
    
    // Check if any player is already used
    const allPlayerIds = [team1[0].id, team1[1].id, team2[0].id, team2[1].id];
    const anyPlayerUsed = allPlayerIds.some(id => usedPlayers.has(id));
    
    if (!anyPlayerUsed) {
      const game: Game = {
        id: `doubles-${Date.now()}-${courtNumber}`,
        court: courtNumber++,
        team1: team1,
        team2: team2,
        type: 'doubles'
      };
      
      // Validate the game before adding it
      if (validateGame(game)) {
        games.push(game);
        
        // Mark all players as used
        allPlayerIds.forEach(id => usedPlayers.add(id));
      }
      
      // Stop if we don't have enough players left for another game
      if (players.length - usedPlayers.size < 4) {
        break;
      }
    }
  }
  
  // Final validation check
  if (!validateAllGames(games)) {
    console.error('Generated games failed validation!', games);
  }
  
  return games;
}

/**
 * Main function to generate optimal game arrangements with history awareness
 */
export function generateOptimalGames(
  presentPlayers: Player[], 
  gameHistory: GameRound[] = []
): GameGenerationResult {
  if (presentPlayers.length < 2) {
    return {
      games: [],
      unpairedPlayers: presentPlayers,
      totalGames: 0,
      doublesGames: 0,
      singlesGames: 0
    };
  }
  
  const shuffledPlayers = [...presentPlayers].sort(() => Math.random() - 0.5);
  const games: GameMatch[] = [];
  const playerHistory = analyzePlayerHistory(presentPlayers, gameHistory);
  const currentRoundNumber = gameHistory.length + 1;
  
  // Generate doubles games first
  const doublesGames = findBestDoublesPairings(shuffledPlayers, gameHistory);
  games.push(...doublesGames);
  
  // Find players not involved in doubles games
  const usedPlayerIds = new Set<string>();
  doublesGames.forEach(game => {
    usedPlayerIds.add(game.team1[0].id);
    usedPlayerIds.add(game.team1[1].id);
    usedPlayerIds.add(game.team2[0].id);
    usedPlayerIds.add(game.team2[1].id);
  });
  
  const remainingPlayers = shuffledPlayers.filter(player => !usedPlayerIds.has(player.id));

  // Players who prefer not to play singles wait instead
  const singlesPlayers = remainingPlayers.filter(player => !player.noSingles);
  const noSinglesWaiting = remainingPlayers.filter(player => player.noSingles);

  // Generate singles games with history awareness
  const singlesResult = createSinglesGamesWithHistory(
    singlesPlayers,
    doublesGames.length + 1,
    playerHistory,
    currentRoundNumber
  );

  games.push(...singlesResult.games);

  return {
    games,
    unpairedPlayers: [...singlesResult.waitingPlayers, ...noSinglesWaiting],
    totalGames: games.length,
    doublesGames: doublesGames.length,
    singlesGames: singlesResult.games.length
  };
}

/**
 * Gets statistics about the generated games
 */
export function getGameStatistics(result: GameGenerationResult): {
  averageTeamBalance: number;
  levelDistribution: { [key: number]: number };
  balanceDistribution: number[];
} {
  const balances: number[] = [];
  const levelDistribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  
  result.games.forEach(game => {
    if (game.type === 'doubles') {
      const balance = calculateTeamBalance(game.team1, game.team2);
      balances.push(balance.difference);
      
      [game.team1[0], game.team1[1], game.team2[0], game.team2[1]].forEach(player => {
        levelDistribution[player.level]++;
      });
    } else {
      levelDistribution[game.player1.level]++;
      levelDistribution[game.player2.level]++;
    }
  });
  
  const averageTeamBalance = balances.length > 0 
    ? balances.reduce((sum, balance) => sum + balance, 0) / balances.length 
    : 0;
  
  return {
    averageTeamBalance: Math.round(averageTeamBalance * 100) / 100,
    levelDistribution,
    balanceDistribution: balances
  };
}
