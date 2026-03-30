# 🏸 Badminton Court Manager

A React TypeScript application for organizing badminton players and creating optimal game pairings. Perfect for badminton clubs, recreational groups, and tournaments where you need to balance skill levels and create fair, competitive games.

![Badminton Court Manager](https://img.shields.io/badge/React-18.2.0-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-4.7.4-blue) ![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

### 🎯 Smart Game Generation
- **Intelligent Pairing Algorithm**: Automatically creates balanced teams based on player skill levels
- **Multiple Game Types**: Supports both doubles and singles games
- **Balance Optimization**: Minimizes skill level differences between opposing teams
- **Conflict Prevention**: Ensures no player plays against themselves

### 👥 Player Management
- **Dynamic Player List**: Add new players on-the-fly with skill levels 1-5
- **Player Editing**: Modify player names and skill levels inline
- **Player Deletion**: Remove players with confirmation dialog
- **Attendance Tracking**: Mark players as present/absent for each session
- **Skill Level Visualization**: Color-coded skill levels for quick identification
- **Persistent Storage**: Player data automatically saved in browser localStorage
- **Export/Import**: Backup and share player lists as JSON files
- **Reset Option**: Return to default players when needed

### 🎮 Game Organization
- **Round History**: Keep track of all game rounds with timestamps
- **Multiple Arrangements**: Generate different pairings for the same round
- **Court Assignments**: Automatic court numbering and organization
- **Game Statistics**: View balance metrics and player distribution

### 📱 User Experience
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Real-time Updates**: Instant feedback on game generation
- **Visual Balance Indicators**: See how balanced each game is at a glance
- **Intuitive Interface**: Clean, modern design with emoji indicators

## 🚀 Quick Start

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd badminton-court-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open in browser**
   Navigate to `http://localhost:3000`

## 🎯 How to Use

### Step 1: Set Up Players
1. The app comes with sample players pre-loaded
2. Mark players as "Present" by checking their boxes
3. Add new players using the "Add New Player" button
4. Set skill levels from 1 (Beginner) to 5 (Expert)
5. **Edit players**: Click the ✏️ button to edit name and skill level
6. **Delete players**: Click the 🗑️ button to remove a player (with confirmation)

### Step 2: Generate Games
1. Ensure at least 2 players are marked as present
2. Click "🎯 Generate Optimal Games"
3. View the generated court assignments with balance indicators

### Step 3: Manage Rounds
- **🔄 New Arrangement**: Generate different pairings for the current round
- **➕ New Round**: Start a completely new round (e.g., after games finish)
- **🗑️ Clear History**: Remove all game history

### Game Balance Indicators
- 🎯 **Perfect Balance**: Teams have identical skill totals
- ⭐ **Excellent Balance**: 1-point difference
- ✅ **Good Balance**: 2-point difference  
- ⚠️ **Fair Balance**: 3-point difference
- ❌ **Unbalanced**: 4+ point difference

## 🏗️ Project Structure

```
src/
├── components/              # React components
│   ├── PlayersList/         # Player management
│   │   ├── PlayersList.tsx  # Player list UI component
│   │   ├── usePlayersList.ts # Player management hook
│   │   └── index.ts         # Component exports
│   ├── GameGenerator/       # Game generation
│   │   ├── GameGenerator.tsx # Game generation UI
│   │   ├── useGameGenerator.ts # Generation logic hook
│   │   └── index.ts         # Component exports
│   └── GameDisplay/         # Game results display
│       ├── GameDisplay.tsx  # Display UI component
│       └── index.ts         # Component exports
├── hooks/                   # Shared hooks
│   ├── useGameHistory.ts    # Game history management
│   └── index.ts             # Hook exports
├── types/                   # TypeScript type definitions
│   └── index.ts             # Player, Game, and Round types
├── utils/                   # Utility functions
│   └── gameAlgorithm.ts     # Core game generation algorithm
├── data/                    # Static data files
│   └── players.json         # Sample player data
└── App.tsx                  # Main application component
```

## 🧮 Algorithm Overview

The game generation algorithm uses several sophisticated techniques:

### 1. **Balance Optimization**
- Calculates team strength as sum of player skill levels
- Minimizes differences between opposing teams
- Sorts potential matchups by balance quality

### 2. **Constraint Satisfaction**
- Prevents players from playing against themselves
- Ensures each player is assigned to only one game per round
- Validates all generated games for logical consistency

### 3. **Game Type Prioritization**
- Prioritizes doubles games (4 players per game)
- Creates singles games from remaining players
- Handles odd numbers of players gracefully

### 4. **Randomization for Variety**
- Shuffles player order to create variety
- Prevents predictable pairings across rounds
- Ensures different partnerships over time

For detailed algorithm documentation, see [ALGORITHM_DOCUMENTATION.md](./ALGORITHM_DOCUMENTATION.md).

## 🎨 Customization

### Adding New Players
Players are stored in `src/data/players.json`. You can modify this file to include your regular players:

```json
{
  "id": "unique-id",
  "name": "Player Name",
  "level": 3,
  "isPresent": false
}
```

### Styling Modifications
- Component-specific styles: `src/components/*.css`
- Global styles: `src/App.css`
- Skill level colors can be modified in the `getLevelColor()` functions

### Algorithm Tuning
The algorithm can be customized in `src/utils/gameAlgorithm.ts`:
- Modify balance calculation logic
- Adjust randomization levels
- Change game type prioritization

## 📊 Game Statistics

The app provides various statistics:
- **Average Team Balance**: How balanced games are on average
- **Level Distribution**: How many players of each skill level are playing
- **Round History**: Complete game history with timestamps
- **Player Participation**: Track who played in which rounds

## 🛠️ Development

### Available Scripts

- `npm start`: Start development server
- `npm build`: Build for production
- `npm test`: Run test suite
- `npm eject`: Eject from Create React App

### Technology Stack

- **Frontend**: React 18.2.0 with TypeScript
- **Styling**: CSS3 with Flexbox and Grid
- **State Management**: React Hooks (useState, useEffect)
- **Build Tool**: Create React App
- **Package Manager**: npm

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📋 Game Scenarios

### 8 Players (Perfect Doubles)
- **Output**: 2 courts with doubles games
- **Strategy**: Optimal team balance across both courts

### 6 Players (Mixed Format)
- **Output**: 1 doubles game + 1 singles game
- **Strategy**: Best balance for doubles, remaining players for singles

### 5 Players (With Rotation)
- **Output**: 2 singles games + 1 waiting player
- **Strategy**: Rotate waiting player in subsequent rounds

### 7 Players (Creative Mix)
- **Output**: 1 doubles + 1 singles + 1 waiting
- **Strategy**: Maximize participation while maintaining balance

## 🔮 Future Enhancements

### Planned Features
- **Partnership History**: Avoid repeated pairings across sessions
- **Tournament Mode**: Bracket-style elimination games
- **Player Ratings**: Dynamic skill level adjustments
- **Export Functionality**: Export game results to PDF/CSV
- **Mobile App**: React Native version for mobile devices

### Advanced Algorithm Features
- **Multi-objective Optimization**: Balance multiple criteria simultaneously
- **Machine Learning**: Learn player preferences and performance patterns
- **Real-time Adjustments**: Handle player arrivals/departures during events

## 🐛 Troubleshooting

### Common Issues

**Q: Games seem unbalanced despite algorithm optimization**
A: Check that player skill levels are set accurately. The algorithm optimizes based on these levels.

**Q: "New Arrangement" button not working**
A: Ensure you have at least 2 present players and that you're clicking on the latest round.

**Q: Players missing from game generation**
A: Verify players are marked as "Present" - only present players are included in games.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏸 About

Created for badminton enthusiasts who want to spend more time playing and less time figuring out fair team arrangements. Whether you're organizing casual games with friends or managing a club tournament, this tool helps create balanced, competitive, and fun matches for players of all skill levels.

---

**Happy Playing! 🏸**
