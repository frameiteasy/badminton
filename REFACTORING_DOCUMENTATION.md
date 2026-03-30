# 🏗️ Refactoring Documentation: Component Organization & Custom Hooks

## Overview

This document describes the architectural refactoring of the Badminton Court Manager application, transforming it from a basic component structure to a well-organized, maintainable codebase with separated concerns using custom hooks and proper folder organization.

## 🎯 Refactoring Goals

1. **Separation of Concerns**: Separate UI logic from business logic
2. **Improved Maintainability**: Organized folder structure for better code navigation
3. **Reusability**: Custom hooks can be reused across components
4. **Testability**: Business logic in hooks is easier to unit test
5. **Scalability**: Better architecture for future feature additions

## 📁 New Project Structure

### Before Refactoring
```
src/
├── components/
│   ├── PlayersList.tsx
│   ├── PlayersList.css
│   ├── GameGenerator.tsx
│   ├── GameGenerator.css
│   ├── GameDisplay.tsx
│   └── GameDisplay.css
├── types/
├── utils/
└── App.tsx
```

### After Refactoring
```
src/
├── components/
│   ├── PlayersList/
│   │   ├── PlayersList.tsx
│   │   ├── PlayersList.css
│   │   ├── usePlayersList.ts      # Component-specific hook
│   │   └── index.ts
│   ├── GameGenerator/
│   │   ├── GameGenerator.tsx
│   │   ├── GameGenerator.css
│   │   ├── useGameGenerator.ts    # Component-specific hook
│   │   └── index.ts
│   └── GameDisplay/
│       ├── GameDisplay.tsx
│       ├── GameDisplay.css
│       └── index.ts
├── hooks/
│   ├── useGameHistory.ts          # Shared hook
│   └── index.ts
├── types/
├── utils/
└── App.tsx
```

## � Hook Organization Strategy

### Component-Specific Hooks
Hooks that are tightly coupled to a single component are placed within the component's folder:

```
src/components/PlayersList/
├── PlayersList.tsx          # Uses usePlayersList
├── usePlayersList.ts        # Player management logic
└── index.ts                 # Exports both component and hook
```

**When to use**: 
- Hook is only used by one component
- Business logic is specific to component's domain
- Hook manages component's internal state and operations

### Shared Hooks
Hooks used across multiple components remain in the global hooks folder:

```
src/hooks/
├── useGameHistory.ts        # Used by App.tsx and potentially other components
└── index.ts                 # Exports shared hooks
```

**When to use**:
- Hook is shared across multiple components
- Hook manages global/app-level state
- Hook provides cross-cutting functionality

## 🔧 Custom Hooks Implementation

### 1. `usePlayersList` Hook (Component-Specific)

**Purpose**: Manages player data and player-related operations

**Responsibilities**:
- Player state management
- Adding new players
- Toggling player presence
- Filtering present players

**Key Features**:
```typescript
export interface UsePlayersListReturn {
  players: Player[];
  presentPlayers: Player[];
  handleTogglePresence: (playerId: string) => void;
  handleAddPlayer: (newPlayer: Omit<Player, 'id' | 'isPresent'>) => void;
}
```

**Benefits**:
- ✅ Encapsulates all player-related logic
- ✅ Automatically initializes with sample data
- ✅ Provides derived state (presentPlayers)
- ✅ Handles player ID generation

### 2. `useGameGenerator` Hook (Component-Specific)

**Purpose**: Handles game generation logic and UI state

**Responsibilities**:
- Game generation process management
- Loading states
- Statistics calculation
- Validation logic

**Key Features**:
```typescript
export interface UseGameGeneratorReturn {
  isGenerating: boolean;
  lastResult: GameGenerationResult | null;
  statistics: ReturnType<typeof getGameStatistics> | null;
  canGenerateGames: boolean;
  maxDoublesGames: number;
  maxSinglesGames: number;
  handleGenerateGames: () => void;
}
```

**Benefits**:
- ✅ Separates generation logic from UI
- ✅ Handles async operations
- ✅ Provides pre-calculated values
- ✅ Manages force regeneration triggers

### 3. `useGameHistory` Hook (Shared)

**Purpose**: Manages game rounds and round-related operations

**Responsibilities**:
- Round history management
- New round creation
- Arrangement replacement
- History clearing

**Key Features**:
```typescript
export interface UseGameHistoryReturn {
  gameRounds: GameRound[];
  forceRegenerate: number;
  handleGamesGenerated: (result: GameGenerationResult) => void;
  handleNewGeneration: () => void;
  handleNewArrangement: () => void;
  handleClearHistory: () => void;
}
```

**Benefits**:
- ✅ Encapsulates complex round logic
- ✅ Handles both new rounds and arrangements
- ✅ Manages regeneration triggers
- ✅ Provides centralized history management

## 🏗️ Component Architecture

### Component Folder Structure

Each component now follows a consistent structure with co-located hooks:

```
ComponentName/
├── ComponentName.tsx       # React component (UI only)
├── ComponentName.css      # Component-specific styles
├── useComponentName.ts    # Component-specific hook (optional)
└── index.ts              # Barrel export (component + hook)
```

**Benefits**:
- ✅ **Encapsulation**: Each component and its logic are self-contained
- ✅ **Co-location**: Hook is right next to the component that uses it
- ✅ **Clean Imports**: `import { Component, useComponent } from './components/Component'`
- ✅ **Discoverability**: Easy to find component-specific business logic
- ✅ **Scalability**: Easy to add more files per component

### Separation of Concerns

#### Before (Mixed Concerns)
```typescript
const GameGenerator = ({ presentPlayers, onGamesGenerated }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  
  // Business logic mixed with UI logic
  const handleGenerateGames = () => {
    setIsGenerating(true);
    // Complex game generation logic...
  };
  
  // UI rendering mixed with state management
  return <div>...</div>;
};
```

#### After (Separated Concerns)
```typescript
// Hook handles business logic
const useGameGenerator = (presentPlayers, onGamesGenerated) => {
  // All business logic here
  return { isGenerating, handleGenerateGames, ... };
};

// Component handles UI only
const GameGenerator = ({ presentPlayers, onGamesGenerated }) => {
  const { isGenerating, handleGenerateGames } = useGameGenerator(
    presentPlayers, 
    onGamesGenerated
  );
  
  // Pure UI rendering
  return <div>...</div>;
};
```

## 📊 Benefits Achieved

### 1. **Maintainability** ⬆️
- Clear separation between UI and business logic
- Easier to locate and modify specific functionality
- Reduced component complexity

### 2. **Testability** ⬆️
- Hooks can be tested independently of UI
- Business logic is isolated and pure
- Easier to mock dependencies

### 3. **Reusability** ⬆️
- Hooks can be shared across multiple components
- Common patterns are abstracted
- Less code duplication

### 4. **Developer Experience** ⬆️
- Better IntelliSense and type safety
- Clearer file organization
- Easier onboarding for new developers

### 5. **Performance** ⬆️
- Better memoization opportunities
- Reduced unnecessary re-renders
- Optimized dependency arrays

## 🧪 Testing Strategy

### Hook Testing
```typescript
// Example test for usePlayersList
import { renderHook, act } from '@testing-library/react-hooks';
import { usePlayersList } from '../usePlayersList';

test('should add new player', () => {
  const { result } = renderHook(() => usePlayersList());
  
  act(() => {
    result.current.handleAddPlayer({
      name: 'Test Player',
      level: 3
    });
  });
  
  expect(result.current.players).toHaveLength(11); // 10 initial + 1 new
});
```

### Component Testing
```typescript
// Example test for GameGenerator component
import { render, screen } from '@testing-library/react';
import { GameGenerator } from '../GameGenerator';

test('should display generate button when players available', () => {
  const mockPlayers = [/* test data */];
  render(
    <GameGenerator 
      presentPlayers={mockPlayers} 
      onGamesGenerated={jest.fn()} 
    />
  );
  
  expect(screen.getByText('Generate Optimal Games')).toBeInTheDocument();
});
```

## 🔮 Future Improvements

### 1. **Enhanced Hook Composition**
```typescript
// Combine multiple hooks for complex workflows
const useGameManager = () => {
  const playersList = usePlayersList();
  const gameGenerator = useGameGenerator(playersList.presentPlayers);
  const gameHistory = useGameHistory();
  
  return {
    ...playersList,
    ...gameGenerator,
    ...gameHistory,
  };
};
```

### 2. **Context Integration**
```typescript
// Global state management for complex scenarios
const GameContext = createContext();

export const useGameContext = () => {
  const context = useContext(GameContext);
  return context;
};
```

### 3. **Advanced State Management**
- Integration with Redux Toolkit for complex state
- Optimistic updates for better UX
- Persistence layer for data storage

### 4. **Performance Optimizations**
- React.memo for component memoization
- useMemo for expensive calculations
- useCallback for stable references

## ✅ Migration Checklist

- [x] Create new folder structure for components
- [x] Implement custom hooks for business logic
- [x] Extract UI components to pure components
- [x] Update imports across the application
- [x] Remove old component files
- [x] Test application functionality
- [x] Update documentation

## 📝 Best Practices Established

1. **Hook Naming**: Use `use` prefix for all custom hooks
2. **File Organization**: Group related files in component folders
3. **Index Exports**: Use barrel exports for clean imports
4. **Type Safety**: Define clear interfaces for hook returns
5. **Dependency Management**: Proper dependency arrays in useEffect
6. **Error Boundaries**: Consider error handling in hooks
7. **Loading States**: Always handle async operations properly

This refactoring establishes a solid foundation for the Badminton Court Manager application, making it easier to maintain, test, and extend with new features.
