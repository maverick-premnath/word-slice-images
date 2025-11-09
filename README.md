# WordSlice - Modern React Phonetic Learning Game

A beautiful, modern React web app for teaching phonetics through interactive word puzzles. Built with React, Vite, Framer Motion, and modern web technologies.

## Features

- 🎮 **Smooth Touch Support** - Optimized drag-and-drop for tablets and mobile devices
- ✨ **Beautiful Animations** - Powered by Framer Motion for silky-smooth transitions
- 🎉 **Celebration Effects** - Confetti and interactive bubble popping game
- 🔊 **Text-to-Speech** - Phonetic pronunciation for each word slice
- 🎨 **Modern UI** - Polished, kid-friendly interface with Fredoka font
- 📱 **Responsive Design** - Works beautifully on all screen sizes

## Tech Stack

- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Framer Motion** - Smooth animations and gestures
- **React Spring** - Physics-based animations for bubbles
- **React Confetti** - Celebration effects
- **Zustand** - Lightweight state management
- **Tailwind CSS** - Utility-first styling
- **Howler.js** - Audio support (for future enhancements)

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will open at `http://localhost:3000`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/       # React components
│   ├── HomeScreen.jsx
│   ├── LevelsScreen.jsx
│   ├── GameScreen.jsx
│   ├── WordSlice.jsx
│   ├── DropZone.jsx
│   ├── Celebration.jsx
│   └── BubbleGame.jsx
├── data/            # Game data
│   └── words.js
├── store/           # State management
│   └── gameStore.js
├── utils/           # Utilities
│   ├── speech.js
│   └── audio.js
├── App.jsx          # Main app component
├── main.jsx         # Entry point
└── index.css        # Global styles
```

## How It Works

1. **Home Screen** - Welcome screen with animated emojis
2. **Level Selection** - Choose from 16 different words
3. **Game Screen** - Drag word slices to build the complete word
4. **Celebration** - Confetti animation when word is completed
5. **Bubble Game** - Pop all bubbles to advance to next word

## Adding New Words

Edit `src/data/words.js` to add new words:

```javascript
{
  name: 'WORD',
  image: 'url-to-image.jpg',
  slices: [
    { id: 0, wordPart: 'WO', phonetic: 'wo' },
    { id: 1, wordPart: 'RD', phonetic: 'rd' }
  ]
}
```

## License

MIT
