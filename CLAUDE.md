# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Start dev server
npm test           # Run tests (Jest + React Testing Library)
npm run build      # Production build
npm run deploy     # Build and deploy to GitHub Pages
```

To run a single test file: `npm test -- --testPathPattern=<filename>`

ESLint runs automatically via `react-scripts`; no separate lint command needed.

## Architecture

**React 18 + TypeScript SPA** — no client-side router. All UI is in a single page, state managed via React hooks.

**State is composed in `App.tsx`** from three custom hooks:
- `usePlayersList` (`components/PlayersList/`) — player CRUD, presence toggling, persists to `localStorage` under key `badminton-players`
- `useGameHistory` (`hooks/useGameHistory.ts`) — tracks game rounds (each round is a `GameRound` with arrays of doubles and singles games)
- `useGameResults` (`hooks/useGameResults.ts`) — stores scores/outcomes, persists to `localStorage` under key `badminton-game-results`

**Core algorithm** lives entirely in `src/utils/gameAlgorithm.ts` (`generateOptimalGames(presentPlayers, gameHistory)`). It:
1. Greedily generates balanced doubles games (minimises `|team1_level_sum - team2_level_sum|`)
2. Then pairs remaining players into singles, using history from the last 3 rounds to ensure fairness and rotation
3. Handles odd player counts by tracking wait turns

**Data model** (`src/types/index.ts`): `Player` (id, name, level 1–5, isPresent), `Game`/`SinglesGame`, `GameResult`, `GameRound`.

**Deployment:** GitHub Pages via `gh-pages`. The production build disables source maps (`.env.production`).

**`SimpleGoogleDriveSync`** component exists but is experimental; `GoogleDriveSync` is hidden in the UI.
