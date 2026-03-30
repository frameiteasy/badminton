export interface Player {
  id: string;
  name: string;
  level: number; // 1-5 (1 = beginner, 5 = advanced)
  isPresent: boolean;
  noSingles?: boolean;
}

export interface GameResult {
  gameId: string;
  team1Score: number;
  team2Score: number;
  winnerId: string; // For singles: player1 or player2 id; For doubles: team1 or team2
  duration?: number; // Game duration in minutes
  notes?: string;
  completedAt: Date;
}

export interface Game {
  id: string;
  court: number;
  team1: [Player, Player];
  team2: [Player, Player];
  type: 'doubles';
  result?: GameResult;
}

export interface SinglesGame {
  id: string;
  court: number;
  player1: Player;
  player2: Player;
  type: 'singles';
  result?: GameResult;
}

export type GameMatch = Game | SinglesGame;

export interface GameRound {
  id: string;
  roundNumber: number;
  timestamp: Date;
  games: GameMatch[];
  unpairedPlayers: Player[];
  totalGames: number;
  doublesGames: number;
  singlesGames: number;
}
