# Deep Sea Arena PVP Battle System

A real-time 1v1 battleship combat game set in the depths of the ocean. Engage in intense auto-battles with layered defense systems, tactical commands, and mana-powered ultimates.

## Features

- **1v1 Battleship Combat** - Fight against AI or other players
- **Layered Defense System** - Shield, Armor, and Hull protection layers
- **Tactical Commands** - Focus Fire, Evasive Maneuvers, and Energy Shunt abilities
- **Auto-Battle System** - Real-time combat with simultaneous attacks
- **Mana System** - Build mana with attacks, auto-trigger ultimates at 100%
- **4 Loadout Configurations** - Balanced Assault, Shield Breaker, Armor Piercer, Heavy Gunner
- **90-Second Battle Timer** - Win by destroying opponent or having highest hull at timeout
- **Mobile Responsive** - Works on desktop and mobile devices

## Technology Stack

- **Frontend Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Build:** Static Export for deployment
- **Backend (Optional):** Cloudflare Workers with Durable Objects (for PvP multiplayer)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install
```

### Run Locally

```bash
# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
# Create production build
npm run build
```

## Game Modes

### Play vs AI
Single-player mode against an AI opponent. Works immediately without any backend setup.

### Play vs Player
Multiplayer mode using room codes. Requires the Cloudflare Workers backend to be deployed.

## Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── page.tsx            # Landing page
│   ├── matchmaking/        # Room code / matchmaking
│   ├── loadout/            # Loadout selection
│   ├── battle/             # Battle scene
│   └── result/             # Victory/defeat screen
├── components/       # React components
│   ├── Battleship.tsx      # Ship graphics
│   ├── HealthBars.tsx      # HP/Shield/Armor bars
│   ├── TacticalButtons.tsx
│   └── BattleTimer.tsx
├── lib/              # Game logic
│   ├── gameEngine.ts       # Battle calculations
│   └── storage.ts          # Local storage helpers
└── types/            # TypeScript interfaces
```

## Deployment

### Deploy to Vercel

```bash
npm install
npm run build
npx vercel --prod
```

See `DEPLOYMENT_INSTRUCTIONS.md` for detailed steps.

## Game Configuration

Edit `public/game-config.json` to adjust game balance:
- Ship stats (shield, armor, hull)
- Weapon damage and fire rates
- Tactical command cooldowns
- Battle duration

## License

MIT License
