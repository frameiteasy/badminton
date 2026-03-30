# Badminton Game Generation Algorithm Documentation

## Overview

The badminton court manager uses an intelligent algorithm to create balanced and fair game assignments. The algorithm optimizes for team balance while ensuring variety in player partnerships and preventing logical impossibilities (like a player playing against themselves).

## Core Algorithm Components

### 1. Player Input Processing
- **Input**: List of present players with skill levels (1-5)
- **Validation**: Minimum 2 players required for any games
- **Randomization**: Players are shuffled to create variety in pairings

### 2. Team Formation Strategy

#### Doubles Games Priority
The algorithm prioritizes doubles games as they are the primary format for badminton:

```typescript
// Calculate maximum possible games
const maxDoublesGames = Math.floor(presentPlayers.length / 4);
const remainingPlayers = presentPlayers.length % 4;
const maxSinglesGames = Math.floor(remainingPlayers / 2);
```

#### Team Combination Generation
For doubles games, the algorithm generates all possible team combinations:

```typescript
function generateTeamCombinations(players: Player[]): [Player, Player][] {
  const teams: [Player, Player][] = [];
  
  for (let i = 0; i < players.length - 1; i++) {
    for (let j = i + 1; j < players.length; j++) {
      teams.push([players[i], players[j]]);
    }
  }
  
  return teams;
}
```

### 3. Game Balance Calculation

#### Team Strength Calculation
Each team's strength is the sum of both players' skill levels:
```typescript
const teamStrength = player1.level + player2.level;
```

#### Balance Score
Games are evaluated based on the difference between team strengths:
```typescript
interface TeamBalance {
  team1Total: number;
  team2Total: number;
  difference: number; // Lower is better
}
```

#### Balance Classification
- **Perfect Balance (0 points difference)**: 🎯 Both teams have identical total skill levels
- **Excellent Balance (1 point difference)**: ⭐ Minimal skill gap
- **Good Balance (2 points difference)**: ✅ Acceptable competitive balance
- **Fair Balance (3 points difference)**: ⚠️ Noticeable but playable gap
- **Unbalanced (4+ points difference)**: ❌ Significant skill mismatch

### 4. Constraint Validation

#### Self-Play Prevention
Critical validation ensures no player appears on both teams:
```typescript
function validateGame(game: Game): boolean {
  const team1Ids = [game.team1[0].id, game.team1[1].id];
  const team2Ids = [game.team2[0].id, game.team2[1].id];
  
  // Check for any overlap between teams
  const hasOverlap = team1Ids.some(id => team2Ids.includes(id));
  return !hasOverlap;
}
```

#### Player Usage Tracking
Each player can only be assigned to one game per round:
```typescript
const usedPlayers = new Set<string>();
// Track used players to prevent double-booking
```

### 5. Optimization Process

#### Step 1: Generate Valid Combinations
```typescript
function generateValidGameCombinations(teams: [Player, Player][]): ValidCombination[] {
  const validCombinations = [];
  
  for (let i = 0; i < teams.length - 1; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const team1 = teams[i];
      const team2 = teams[j];
      
      // Ensure no player overlap
      if (!hasPlayerOverlap(team1, team2)) {
        const balance = calculateTeamBalance(team1, team2);
        validCombinations.push({ team1, team2, balance });
      }
    }
  }
  
  // Sort by balance (most balanced first)
  return validCombinations.sort((a, b) => a.balance.difference - b.balance.difference);
}
```

#### Step 2: Greedy Selection
The algorithm uses a greedy approach to select the most balanced games:

1. **Sort** all valid combinations by balance score (ascending)
2. **Iterate** through sorted combinations
3. **Select** first combination where no players are already used
4. **Mark** all four players as used
5. **Repeat** until insufficient players remain

### 6. Singles Game Handling

When remaining players cannot form complete doubles games:

```typescript
function createSinglesGames(players: Player[], startingCourtNumber: number): SinglesGame[] {
  // Sort by skill level for balanced singles matches
  const sortedPlayers = [...players].sort((a, b) => a.level - b.level);
  
  const games: SinglesGame[] = [];
  for (let i = 0; i < sortedPlayers.length - 1; i += 2) {
    games.push({
      court: startingCourtNumber++,
      player1: sortedPlayers[i],
      player2: sortedPlayers[i + 1],
      type: 'singles'
    });
  }
  
  return games;
}
```

## Algorithm Flow Diagram

```
Present Players (n players)
         ↓
    Shuffle Players (randomization)
         ↓
Generate All Team Combinations (n choose 2)
         ↓
Generate Valid Game Combinations
   (filter out self-play scenarios)
         ↓
Sort by Balance Score (ascending)
         ↓
Greedy Selection Process:
  ├─ Select most balanced unused combination
  ├─ Mark 4 players as used
  ├─ Assign court number
  └─ Repeat until <4 players remain
         ↓
Handle Remaining Players:
  ├─ 2-3 players → Singles games
  ├─ 1 player → Wait next round
  └─ 0 players → Complete
         ↓
    Final Result:
  ├─ Doubles Games (balanced teams)
  ├─ Singles Games (remaining pairs)
  └─ Unpaired Players (odd numbers)
```

## Example Scenarios

### Scenario 1: 8 Players (Perfect Doubles)
- **Input**: 8 players with levels [3,1,4,2,5,1,3,4]
- **Output**: 2 doubles games on 2 courts
- **Algorithm Focus**: Maximize balance between teams

### Scenario 2: 6 Players (Mixed Games)
- **Input**: 6 players
- **Output**: 1 doubles game (4 players) + 1 singles game (2 players)
- **Strategy**: Best 4 players for doubles, remaining 2 for singles

### Scenario 3: 5 Players (With Waiting)
- **Input**: 5 players
- **Output**: 2 singles games + 1 waiting player
- **Rotation**: Waiting player joins next round

## Performance Characteristics

### Time Complexity
- **Team Generation**: O(n²) where n = number of players
- **Valid Combinations**: O(n⁴) in worst case
- **Selection Process**: O(n²) average case
- **Overall**: O(n⁴) worst case, O(n²) typical case

### Space Complexity
- **Team Storage**: O(n²)
- **Combination Storage**: O(n⁴) worst case
- **Tracking Sets**: O(n)
- **Overall**: O(n⁴) worst case

### Optimization Considerations
- For large groups (>12 players), consider heuristic approaches
- Current implementation handles typical badminton groups (4-16 players) efficiently
- Randomization ensures variety across multiple rounds

## Quality Metrics

### Balance Quality
The algorithm provides statistics on generated games:
```typescript
interface GameStatistics {
  averageTeamBalance: number;      // Lower is better
  levelDistribution: {[level: number]: number};
  balanceDistribution: number[];   // Distribution of balance differences
}
```

### Success Criteria
- ✅ No player plays against themselves
- ✅ Each player assigned to maximum one game per round
- ✅ Prioritize balanced team matchups
- ✅ Maximize player participation
- ✅ Ensure variety through randomization

## Future Enhancements

### Potential Improvements
1. **Partnership History Tracking**: Avoid repeated partnerships across rounds
2. **Advanced Balancing**: Consider player combinations, not just individual levels
3. **Court Preferences**: Allow players to specify court preferences
4. **Skill Level Adjustment**: Dynamic skill level updates based on performance
5. **Tournament Mode**: Bracket-style elimination games

### Scalability Considerations
- **Large Groups**: Implement approximation algorithms for >16 players
- **Real-time Updates**: Handle player arrival/departure during event
- **Multiple Sessions**: Track partnerships across different playing sessions

## Configuration Options

The algorithm can be tuned with various parameters:

```typescript
interface AlgorithmConfig {
  prioritizeBalance: boolean;        // vs. prioritize variety
  maxBalanceDifference: number;      // Acceptable balance threshold
  randomizationLevel: 'low' | 'medium' | 'high';
  courtAllocation: 'sequential' | 'balanced';
}
```

This documentation provides a complete understanding of how the badminton game generation algorithm creates optimal, fair, and enjoyable game assignments for players of all skill levels.
