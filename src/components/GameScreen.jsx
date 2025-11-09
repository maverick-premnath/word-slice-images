import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import WordSlice from './WordSlice'
import DropZone from './DropZone'
import Celebration from './Celebration'
import BubbleGame from './BubbleGame'
import { speak } from '../utils/speech'
import { ensureAudioReady } from '../utils/audio'
import { WORD_DATABASE } from '../data/words'
import gameBg from '../../game-bg.svg'
import speakerIconSvg from '../../Speaker_Icon.svg?raw'

const speakerIconMarkup = { __html: speakerIconSvg }

export default function GameScreen() {
  const { currentWord, correctSlices, setCorrectSlice } = useGameStore()
  const [shuffledSlices, setShuffledSlices] = useState([])
  const [showCelebration, setShowCelebration] = useState(false)
  const [showBubbles, setShowBubbles] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [hasPlayedWord, setHasPlayedWord] = useState(false)
  const [isSpeakingWord, setIsSpeakingWord] = useState(false)
  const advanceTimeoutRef = useRef(null)

  useEffect(() => {
    if (!currentWord) return

    let shuffled = [...currentWord.slices]
    do {
      shuffled.sort(() => Math.random() - 0.5)
    } while (shuffled.every((slice, i) => slice.id === currentWord.slices[i].id))
    
    setShuffledSlices(shuffled)
    setIsComplete(false)
    setShowCelebration(false)
    setShowBubbles(false)
    setHasPlayedWord(false)
    setIsSpeakingWord(false)
  }, [currentWord])

  useEffect(() => {
    if (correctSlices.every(slice => slice !== null) && !isComplete) {
      setIsComplete(true)
      setShowCelebration(true)
      setHasPlayedWord(false)
      setTimeout(() => setShowCelebration(false), 1600)
    }
  }, [correctSlices, currentWord, isComplete])

  if (!currentWord) return null

  const getSliceDimensions = (numSlices) => {
    const height = 'h-40 md:h-56'
    let width = ''
    switch (numSlices) {
      case 2: width = 'w-20 md:w-28'; break
      case 3: width = 'w-14 md:w-20'; break
      case 4: width = 'w-10 md:w-14'; break
      default: width = 'w-40 md:w-56'
    }
    return { height, width }
  }

  const { height, width } = getSliceDimensions(currentWord.slices.length)
  const placedSliceIds = correctSlices.filter(s => s !== null).map(s => s.id)
  const availableSlices = shuffledSlices.filter(slice => !placedSliceIds.includes(slice.id))

  const handleDrop = (dropZoneIndex, sliceId) => {
    const slice = currentWord.slices.find(s => s.id === sliceId)
    if (slice) {
      setCorrectSlice(dropZoneIndex, slice)
      const phonetic = slice.phonetic
      if (phonetic) {
        ensureAudioReady()
        speak(phonetic, {
          rate: 1.05,
          pitch: 1.22,
          voiceHint: 'child'
        })
      }
    }
  }

  const handleBackToLevels = useCallback(() => {
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current)
      advanceTimeoutRef.current = null
    }
    setShowBubbles(false)
    setShowCelebration(false)
    useGameStore.getState().goToLevels()
  }, [])

  const handleReset = useCallback(() => {
    if (!currentWord) return

    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current)
      advanceTimeoutRef.current = null
    }

    setShowCelebration(false)
    setShowBubbles(false)
    setIsComplete(false)
    setHasPlayedWord(false)
    setIsSpeakingWord(false)

    const freshSource = WORD_DATABASE.find((word) => word.name === currentWord.name)
    if (!freshSource) return

    const refreshedWord = {
      ...freshSource,
      slices: freshSource.slices.map((slice) => ({ ...slice }))
    }

    useGameStore.getState().startGame(refreshedWord)
  }, [currentWord])

  const handlePlayFullWord = useCallback(async () => {
    if (!currentWord || isSpeakingWord) return

    try {
      setIsSpeakingWord(true)
      ensureAudioReady()
      await speak(currentWord.name, {
        rate: 0.92,
        pitch: 1.05,
        lang: 'en-IN',
        voiceHint: 'child'
      })
      if (!hasPlayedWord) {
        setHasPlayedWord(true)
        setTimeout(() => {
          setShowCelebration(false)
          setShowBubbles(true)
        }, 450)
      }
    } finally {
      setIsSpeakingWord(false)
    }
  }, [currentWord, hasPlayedWord, isSpeakingWord])

  const handleBubblesComplete = () => {
    setShowBubbles(false)
    if (!currentWord) return

    const currentIndex = WORD_DATABASE.findIndex((w) => w.name === currentWord.name)
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % WORD_DATABASE.length
    const nextWord = WORD_DATABASE[nextIndex]

    // Allow the bubble overlay to fade out before advancing
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current)
    }
    advanceTimeoutRef.current = setTimeout(() => {
      useGameStore.getState().startGame(nextWord)
      advanceTimeoutRef.current = null
    }, 500)
  }

  useEffect(() => {
    return () => {
      if (advanceTimeoutRef.current) {
        clearTimeout(advanceTimeoutRef.current)
        advanceTimeoutRef.current = null
      }
    }
  }, [])

  const containerBackgroundStyle = {
    backgroundImage: `url(${gameBg})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between p-4 md:p-8 relative overflow-hidden"
      style={containerBackgroundStyle}
    >
      
      <AnimatePresence>
        {showCelebration && <Celebration />}
        {showBubbles && (
          <BubbleGame onComplete={handleBubblesComplete} />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentWord.name}
          className="w-full flex flex-col items-center"
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -40, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        >
          {!showBubbles && (
            <div className="w-full max-w-6xl flex justify-start mb-4">
              <motion.button
                onClick={handleBackToLevels}
                className="text-lg font-medium text-gray-700 bg-white rounded-lg px-5 py-2 shadow-md hover:bg-gray-100 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ← Back to Levels
              </motion.button>
            </div>
          )}

          <motion.h2
            className="text-4xl md:text-5xl font-bold text-center text-purple-700 my-4 md:my-0"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            Build the Word!
          </motion.h2>

          <AnimatePresence>
            {isComplete && (
              <motion.div
                className="text-center my-6 flex flex-col items-center gap-4"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <h2 className="text-5xl md:text-7xl font-bold text-green-600">
                  {currentWord.name}
                </h2>
                <p className="text-lg md:text-xl text-sky-700 max-w-md">
                  Press play to hear the whole word. The bubble party will begin right after!
                </p>
                <motion.button
                  whileHover={{ scale: isSpeakingWord ? 1 : 1.05 }}
                  whileTap={{ scale: isSpeakingWord ? 1 : 0.95 }}
                  disabled={isSpeakingWord}
                  onClick={handlePlayFullWord}
                  className={`flex items-center gap-3 px-6 py-3 rounded-full shadow-lg text-xl font-semibold transition-colors ${
                    isSpeakingWord ? 'bg-slate-300 text-slate-500' : 'bg-pink-500 hover:bg-pink-400 text-white'
                  }`}
                  style={{ touchAction: 'manipulation' }}
                >
                  <span
                    className="inline-flex items-center justify-center text-white"
                    style={{ width: 30, height: 30 }}
                    aria-hidden="true"
                    dangerouslySetInnerHTML={speakerIconMarkup}
                  />
                  {isSpeakingWord ? 'Playing...' : hasPlayedWord ? 'Play the word again' : 'Play the word'}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-row justify-center my-8 md:my-12 gap-2">
            {currentWord.slices.map((slice, index) => (
              <DropZone
                key={index}
                expectedId={slice.id}
                height={height}
                width={width}
                placedSlice={correctSlices[index]}
                word={currentWord}
                onDrop={(sliceId) => handleDrop(index, sliceId)}
              />
            ))}
          </div>

          <div className="w-full max-w-4xl flex flex-row flex-wrap justify-center items-center gap-4 md:gap-6 p-6 bg-white/50 rounded-2xl shadow-inner min-h-[150px]">
            {isComplete ? (
              <motion.h3
                className="text-2xl font-bold text-green-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Well Done!
              </motion.h3>
            ) : (
              availableSlices.map((slice) => (
                <WordSlice
                  key={slice.id}
                  slice={slice}
                  word={currentWord}
                  height={height}
                  width={width}
                  onDrop={(dropZoneId) => {
                    // Find the drop zone index
                    const dropZoneIndex = currentWord.slices.findIndex(s => s.id === dropZoneId)
                    if (dropZoneIndex !== -1) {
                      handleDrop(dropZoneIndex, slice.id)
                    }
                  }}
                />
              ))
            )}
          </div>

          <motion.button
            onClick={handleReset}
            className="text-xl font-semibold text-white bg-red-500 rounded-lg px-8 py-3 shadow-md hover:bg-red-600 transition-colors mt-8"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Reset
          </motion.button>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

