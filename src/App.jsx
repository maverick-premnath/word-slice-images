import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from './store/gameStore'
import HomeScreen from './components/HomeScreen'
import LevelsScreen from './components/LevelsScreen'
import GameScreen from './components/GameScreen'
import { initAudioContext } from './utils/audio'

function App() {
  const currentScreen = useGameStore((state) => state.currentScreen)

  useEffect(() => {
    // Initialize audio context on app load
    initAudioContext()
  }, [])

  return (
    <div className="w-full min-h-screen overflow-hidden bg-gray-100">
      <AnimatePresence mode="wait">
        {currentScreen === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <HomeScreen />
          </motion.div>
        )}
        {currentScreen === 'levels' && (
          <motion.div
            key="levels"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <LevelsScreen />
          </motion.div>
        )}
        {currentScreen === 'game' && (
          <motion.div
            key="game"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          >
            <GameScreen />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App

