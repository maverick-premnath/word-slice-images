import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'

const floatingEmojis = [
  { emoji: '🍎', top: '10%', left: '15%', delay: 0 },
  { emoji: '🥭', top: '20%', left: '80%', delay: -2 },
  { emoji: '💧', top: '60%', left: '10%', delay: -4 },
  { emoji: '☀️', top: '75%', left: '70%', delay: -1 },
  { emoji: '🧩', top: '40%', left: '45%', delay: -3 },
]

export default function HomeScreen() {
  const setScreen = useGameStore((state) => state.setScreen)

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center overflow-hidden"
         style={{ background: 'linear-gradient(135deg, #60a5fa, #f472b6, #fbbf24)' }}>
      {floatingEmojis.map((item, index) => (
        <motion.span
          key={index}
          className="absolute text-5xl md:text-6xl opacity-70 z-10"
          style={{ top: item.top, left: item.left }}
          animate={{
            y: [0, -30, 0],
            rotate: [0, 15, 0],
          }}
          transition={{
            duration: 6,
            delay: item.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {item.emoji}
        </motion.span>
      ))}

      <div className="text-center z-20 relative">
        <motion.h1
          className="text-7xl md:text-9xl font-bold text-white mb-4"
          style={{ textShadow: '4px 4px 0 rgba(0,0,0,0.15)' }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          WordSlice
        </motion.h1>
        <motion.p
          className="text-xl md:text-2xl text-white/90 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Learn phonetics by playing puzzles!
        </motion.p>
        <motion.button
          onClick={() => setScreen('levels')}
          className="text-3xl font-bold text-purple-700 bg-white rounded-full px-12 py-5 shadow-xl"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          Play!
        </motion.button>
      </div>
    </div>
  )
}

