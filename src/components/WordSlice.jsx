import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getWordAssets } from '../data/words'

const speakerEmoji = '🔊'

export default function WordSlice({ slice, word, height, width, playAudio, onDrop }) {
  const [isPlaced, setIsPlaced] = useState(false)
  const [isShaking, setIsShaking] = useState(false)
  const sliceRef = useRef(null)
  const dragOriginRef = useRef({ centerX: 0, centerY: 0, width: 0, height: 0 })
  const currentAudioRef = useRef(null)

  const handleDragStart = () => {
    const rect = sliceRef.current?.getBoundingClientRect()
    if (rect) {
      dragOriginRef.current = {
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2,
        width: rect.width,
        height: rect.height
      }
    }
  }

  const handleDragEnd = (event, info) => {
    if (isPlaced) return

    const dropZones = document.querySelectorAll('.drop-zone')
    if (!dropZones.length) return

    const { centerX: originX, centerY: originY, width, height } = dragOriginRef.current
    const offsetX = info?.offset?.x ?? 0
    const offsetY = info?.offset?.y ?? 0

    let finalCenterX = originX + offsetX
    let finalCenterY = originY + offsetY

    if (!Number.isFinite(finalCenterX) || !Number.isFinite(finalCenterY)) {
      const rect = sliceRef.current?.getBoundingClientRect()
      finalCenterX = rect ? rect.left + rect.width / 2 : 0
      finalCenterY = rect ? rect.top + rect.height / 2 : 0
    }

    const pointerX = info?.point?.x ?? event?.clientX ?? finalCenterX
    const pointerY = info?.point?.y ?? event?.clientY ?? finalCenterY

    let dropZoneMatch = null

    const sliceEl = sliceRef.current
    if (sliceEl) {
      const previousPointer = sliceEl.style.pointerEvents
      sliceEl.style.pointerEvents = 'none'
      const element = document.elementFromPoint(pointerX, pointerY)
      dropZoneMatch = element?.closest('.drop-zone') ?? null
      sliceEl.style.pointerEvents = previousPointer
    }

    const sliceWidth = width || sliceRef.current?.offsetWidth || dragOriginRef.current.width || 0
    const sliceHeight = height || sliceRef.current?.offsetHeight || dragOriginRef.current.height || 0

    const finalBounds = {
      left: finalCenterX - sliceWidth / 2,
      right: finalCenterX + sliceWidth / 2,
      top: finalCenterY - sliceHeight / 2,
      bottom: finalCenterY + sliceHeight / 2
    }

    if (!dropZoneMatch) {
      dropZones.forEach((candidate) => {
        if (dropZoneMatch) return
        const dropRect = candidate.getBoundingClientRect()
        const centerInside =
          finalCenterX >= dropRect.left &&
          finalCenterX <= dropRect.right &&
          finalCenterY >= dropRect.top &&
          finalCenterY <= dropRect.bottom

        const overlaps =
          finalBounds.left < dropRect.right &&
          finalBounds.right > dropRect.left &&
          finalBounds.top < dropRect.bottom &&
          finalBounds.bottom > dropRect.top

        if (centerInside || overlaps) {
          dropZoneMatch = candidate
        }
      })
    }

    if (!dropZoneMatch) return

    const expectedId = parseInt(dropZoneMatch.dataset.expectedId, 10)
    if (expectedId === slice.id) {
      const placed = onDrop(expectedId)
      if (placed !== false) {
        setIsPlaced(true)
      }
    } else {
      // Wrong drop zone - trigger shake animation and play sound
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 600)
      
      // Play no-no-no sound using global audio manager
      if (playAudio) {
        playAudio('./no-no-no.mp3')
      } else {
        // Fallback if playAudio not provided
        try {
          const audio = new Audio('./no-no-no.mp3')
          audio.play().catch(e => console.log('Audio play failed:', e))
        } catch (e) {
          console.log('Failed to play no-no-no audio:', e)
        }
      }
    }
  }

  useEffect(() => {
    setIsPlaced(false)
  }, [slice.id, slice.wordPart, word.name])

  if (isPlaced) return null

  const numSlices = word.slices.length
  const position = (numSlices > 1) ? (slice.id / (numSlices - 1)) * 100 : 0
  const assets = getWordAssets(word)

  return (
    <motion.div
      ref={sliceRef}
      className={`word-slice ${height} ${width} border-4 border-white rounded-lg shadow-lg cursor-grab relative`}
      style={{
        backgroundImage: `url('${assets.image}')`,
        backgroundSize: `${numSlices * 100}% 100%`,
        backgroundPosition: `${position}% 0`,
        backgroundRepeat: 'no-repeat',
        touchAction: 'none',
      }}
      drag
      onDragStart={handleDragStart}
      dragElastic={0.2}
      dragSnapToOrigin={!isPlaced}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      animate={isShaking ? {
        x: [0, -15, 15, -12, 12, -8, 8, 0],
        rotate: [0, -8, 8, -6, 6, -4, 4, 0],
        transition: { 
          duration: 0.4,
          ease: "easeInOut"
        }
      } : {}}
      whileDrag={{ 
        scale: 1.1, 
        rotate: 5, 
        zIndex: 2000,
        cursor: 'grabbing'
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/80 rounded-full px-3 py-1 shadow-md cursor-pointer hover:bg-white transition-colors flex items-center gap-2"
        onClick={(e) => {
          e.stopPropagation()
          // Play phonetic audio file
          if (assets.phonetics[slice.id]) {
            const audio = new Audio(assets.phonetics[slice.id])
            audio.play().catch(e => console.log('Audio play failed:', e))
          }
        }}
      >
        <span className="text-base font-medium text-gray-800">{slice.wordPart}</span>
        <button 
          className="text-xl"
          aria-label="Play sound"
        >
          {speakerEmoji}
        </button>
      </div>
    </motion.div>
  )
}
