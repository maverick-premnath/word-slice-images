import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { WORD_DATABASE, getWordAssets } from '../data/words'
import React from 'react'

export default function LevelsScreen() {
  const startGame = useGameStore((state) => state.startGame)

  // Preload bubble pop and no-no-no sounds
  React.useEffect(() => {
    const preloadAudios = () => {
      const audioFiles = ['/word-slice-images/sounds/bubble-pop.mp3', '/word-slice-images/sounds/no-no-no.mp3']
      
      audioFiles.forEach(audioPath => {
        try {
          const audio = new Audio(audioPath)
          audio.preload = 'auto'
          audio.load()
          // Optional: play a very short silent audio to unlock audio context on iOS
          audio.volume = 0.01
          audio.play().then(() => {
            audio.pause()
            audio.currentTime = 0
            audio.volume = 1
          }).catch(() => {
            // Ignore autoplay policy errors
          })
        } catch (e) {
          console.log(`Failed to preload ${audioPath}:`, e)
        }
      })
    }

    preloadAudios()
  }, [])

  return (
    <div className="min-h-screen p-6 md:p-12" style={{ backgroundColor: '#f0f9ff' }}>
      <motion.h2
        className="text-4xl md:text-5xl font-bold text-center text-blue-800 mb-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        Choose a Word
      </motion.h2>
      <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 md:gap-8">
        {WORD_DATABASE.map((word, index) => {
          const assets = getWordAssets(word)
          console.log(`${word.name}: ${assets.image}`)
          return (
            <motion.button
              key={word.name}
              onClick={() => startGame(word)}
              className="aspect-square bg-white rounded-2xl shadow-lg overflow-hidden relative group"
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              {assets.image ? (
                <img
                  src={assets.image}
                  alt={word.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className={`w-full h-full ${assets.image ? 'hidden' : 'flex'} bg-gradient-to-br from-blue-200 to-purple-200 items-center justify-center`}>
                <span className="text-4xl font-bold text-white drop-shadow-lg">{word.name.charAt(0)}</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50 text-center">
                <span className="text-white font-bold text-lg uppercase">{word.name}</span>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

