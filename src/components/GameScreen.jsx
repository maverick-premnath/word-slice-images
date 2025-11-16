import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import WordSlice from './WordSlice'
import DropZone from './DropZone'
import Celebration from './Celebration'
import BubbleGame from './BubbleGame'
import { speak } from '../utils/speech'
import { ensureAudioReady } from '../utils/audio'
import { WORD_DATABASE, getWordAssets } from '../data/words'
import gameBg from '../../game-bg.svg'

const speakerEmoji = '🔊'

export default function GameScreen() {
  const { currentWord, correctSlices, setCorrectSlice } = useGameStore()
  const [shuffledSlices, setShuffledSlices] = useState([])
  const [showCelebration, setShowCelebration] = useState(false)
  const [showBubbles, setShowBubbles] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [hasPlayedWord, setHasPlayedWord] = useState(false)
  const [isSpeakingWord, setIsSpeakingWord] = useState(false)
  const advanceTimeoutRef = useRef(null)
  const [isNavigatingBack, setIsNavigatingBack] = useState(false)
  const preloadedAudiosRef = useRef(new Map())
  const currentAudioRef = useRef(null)

  // Helper function to stop any currently playing audio
  const stopCurrentAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
      currentAudioRef.current = null
    }
  }

  // Helper function to play audio with interruption
  const playAudio = (audioUrl) => {
    stopCurrentAudio()
    
    const audio = getPreloadedAudio(audioUrl)
    currentAudioRef.current = audio
    
    audio.play().catch(e => {
      console.log('Audio play failed:', e)
      currentAudioRef.current = null
    })
    
    // Clear reference when audio ends
    audio.onended = () => {
      currentAudioRef.current = null
    }
  }

  // Preload all audio assets for the current word
  useEffect(() => {
    if (!currentWord) return

    const preloadAudios = async () => {
      const assets = getWordAssets(currentWord)
      
      // Preload full word audio
      if (assets.audio && !preloadedAudiosRef.current.has(assets.audio)) {
        try {
          const audio = new Audio(assets.audio)
          audio.preload = 'auto'
          audio.load()
          preloadedAudiosRef.current.set(assets.audio, audio)
        } catch (e) {
          console.log('Failed to preload word audio:', assets.audio, e)
        }
      }

      // Preload phonetic audios
      if (assets.phonetics) {
        for (const [sliceId, audioUrl] of Object.entries(assets.phonetics)) {
          if (audioUrl && !preloadedAudiosRef.current.has(audioUrl)) {
            try {
              const audio = new Audio(audioUrl)
              audio.preload = 'auto'
              audio.load()
              preloadedAudiosRef.current.set(audioUrl, audio)
            } catch (e) {
              console.log('Failed to preload phonetic audio:', audioUrl, e)
            }
          }
        }
      }
    }

    preloadAudios()
  }, [currentWord])

  // Helper function to get preloaded audio or create new one
  const getPreloadedAudio = (audioUrl) => {
    if (preloadedAudiosRef.current.has(audioUrl)) {
      return preloadedAudiosRef.current.get(audioUrl)
    }
    // Fallback to creating new audio if not preloaded
    const audio = new Audio(audioUrl)
    preloadedAudiosRef.current.set(audioUrl, audio)
    return audio
  }

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
      setIsSpeakingWord(false)
      
      // Store the timeout so it can be cleared if user navigates away
      advanceTimeoutRef.current = setTimeout(async () => {
        setShowCelebration(false)
        await handleAutoPlayWord()
        // Automatically show bubbles after playing the word
        setShowBubbles(true)
        advanceTimeoutRef.current = null
      }, 1600)
    }
  }, [correctSlices, currentWord, isComplete])

  // New function to automatically play the full word (doesn't show bubbles)
  const handleAutoPlayWord = useCallback(async () => {
    if (!currentWord || isSpeakingWord) return

    try {
      setIsSpeakingWord(true)
      // Try to play full word audio file first, fallback to speech synthesis
      const assets = getWordAssets(currentWord)
      if (assets.audio) {
        stopCurrentAudio()
        const audio = getPreloadedAudio(assets.audio)
        try {
          await audio.play()
        } catch (e) {
          console.log('Audio file failed, using speech synthesis:', e)
          ensureAudioReady()
          await speak(currentWord.name, {
            rate: 0.92,
            pitch: 1.05,
            lang: 'en-IN',
            voiceHint: 'child'
          })
        }
      } else {
        ensureAudioReady()
        await speak(currentWord.name, {
          rate: 0.92,
          pitch: 1.05,
          lang: 'en-IN',
          voiceHint: 'child'
        })
      }
      
      // Don't automatically show bubbles - wait for user to click buttons
      
    } finally {
      setIsSpeakingWord(false)
    }
  }, [currentWord, isSpeakingWord])

  // Function to replay the word when "Say Again" is clicked
  const handleSayAgain = useCallback(async () => {
    await handleAutoPlayWord()
  }, [handleAutoPlayWord])

  // Function to finish the puzzle and show bubbles
  const handleFinishPuzzle = useCallback(() => {
    setShowBubbles(true)
  }, [])

  if (!currentWord) return null

  const getSliceDimensions = (numSlices) => {
    const height = 'h-[12.5rem] md:h-[17.5rem]'
    let width = ''
    switch (numSlices) {
      case 2: width = 'w-[6.25rem] md:w-[8.75rem]'; break
      case 3: width = 'w-[4.375rem] md:w-[6.25rem]'; break
      case 4: width = 'w-[3.125rem] md:w-[4.375rem]'; break
      default: width = 'h-[12.5rem] md:h-[17.5rem]'
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
      // Play phonetic audio file instead of text-to-speech
      const assets = getWordAssets(currentWord)
      if (assets.phonetics[sliceId]) {
        playAudio(assets.phonetics[sliceId])
      }
    }
  }

  const handleBackToLevels = useCallback(() => {
    // Stop any ongoing speech synthesis
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current)
      advanceTimeoutRef.current = null
    }
    
    // Prevent completion UI from showing during navigation
    setIsNavigatingBack(true)
    
    // Reset all completion-related state
    setShowBubbles(false)
    setShowCelebration(false)
    setIsComplete(false)
    setHasPlayedWord(false)
    setIsSpeakingWord(false)
    
    // Navigate back to levels
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
      // Try to play full word audio file first, fallback to speech synthesis
      const assets = getWordAssets(currentWord)
      if (assets.audio) {
        const audio = getPreloadedAudio(assets.audio)
        try {
          await audio.play()
        } catch (e) {
          console.log('Audio file failed, using speech synthesis:', e)
          ensureAudioReady()
          await speak(currentWord.name, {
            rate: 0.92,
            pitch: 1.05,
            lang: 'en-IN',
            voiceHint: 'child'
          })
        }
      } else {
        ensureAudioReady()
        await speak(currentWord.name, {
          rate: 0.92,
          pitch: 1.05,
          lang: 'en-IN',
          voiceHint: 'child'
        })
      }
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
          style={{ pointerEvents: showBubbles ? 'none' : 'auto' }}
        >
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

          <motion.h2
            className="text-4xl md:text-5xl font-bold text-center text-purple-700 my-4 md:my-0"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            Build the Word!
          </motion.h2>

          <AnimatePresence>
            {isComplete && !showBubbles && !isNavigatingBack && (
              <motion.div
                className="text-center my-6 flex flex-col items-center gap-6"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <div className="relative">
                  {(() => {
                    const assets = getWordAssets(currentWord)
                    return assets.image ? (
                      <img
                        src={assets.image}
                        alt={currentWord.name}
                        className="w-[30rem] h-[30rem] md:w-[36rem] md:h-[36rem] object-cover rounded-2xl shadow-2xl"
                      />
                    ) : (
                      <div className="w-[30rem] h-[30rem] md:w-[36rem] md:h-[36rem] bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl shadow-2xl flex items-center justify-center">
                        <span className="text-6xl md:text-8xl font-bold text-white drop-shadow-lg">
                          {currentWord.name}
                        </span>
                      </div>
                    )
                  })()}
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-2 rounded-full shadow-lg">
                    <span className="text-2xl font-bold">Well Done! 🎉</span>
                  </div>
                </div>
                
              </motion.div>
            )}
          </AnimatePresence>

          {showBubbles ? (
            // Show full merged image during bubble celebration
            <div className="flex justify-center my-8 md:my-12">
              <div className="relative">
                {(() => {
                  const assets = getWordAssets(currentWord)
                  return assets.image ? (
                    <img
                      src={assets.image}
                      alt={currentWord.name}
                      className="w-[36rem] h-[36rem] md:w-[42rem] md:h-[42rem] object-cover rounded-2xl shadow-2xl"
                    />
                  ) : (
                    <div className="w-[36rem] h-[36rem] md:w-[42rem] md:h-[42rem] bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl shadow-2xl flex items-center justify-center">
                      <span className="text-6xl md:text-8xl font-bold text-white drop-shadow-lg">
                        {currentWord.name}
                      </span>
                    </div>
                  )
                })()}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-2 rounded-full shadow-lg">
                  <span className="text-4xl font-bold">{currentWord.name}</span>
                </div>
              </div>
            </div>
          ) : (
            // Show drop zones during gameplay
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
          )}

          <div className="w-full max-w-4xl flex flex-row flex-wrap justify-center items-center gap-4 md:gap-6 p-6 bg-white/50 rounded-2xl shadow-inner min-h-[150px]">
            {availableSlices.map((slice) => (
              <WordSlice
                key={slice.id}
                slice={slice}
                word={currentWord}
                height={height}
                width={width}
                playAudio={playAudio}
                stopCurrentAudio={stopCurrentAudio}
                onDrop={(dropZoneId) => {
                  // Find the drop zone index
                  const dropZoneIndex = currentWord.slices.findIndex(s => s.id === dropZoneId)
                  if (dropZoneIndex !== -1) {
                    handleDrop(dropZoneIndex, slice.id)
                  }
                }}
              />
            ))}
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

