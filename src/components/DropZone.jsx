import { useState } from 'react'
import { motion } from 'framer-motion'
import { getWordAssets } from '../data/words'

export default function DropZone({ expectedId, height, width, placedSlice, word, onDrop }) {
  const [isDragOver, setIsDragOver] = useState(false)
  const isCorrect = placedSlice !== null

  const numSlices = word?.slices.length || 1
  const position = placedSlice ? (placedSlice.id / (numSlices - 1)) * 100 : 0
  const assets = getWordAssets(word)

  return (
    <motion.div
      className={`drop-zone ${height} ${width} border-4 rounded-lg flex justify-center items-center text-4xl font-bold relative overflow-hidden ${
        isCorrect
          ? 'border-green-500 bg-green-100'
          : 'border-dashed border-gray-400 bg-white/30'
      }`}
      data-expected-id={expectedId}
      onDragOver={(e) => {
        e.preventDefault()
        if (!isCorrect) setIsDragOver(true)
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragOver(false)
        // The drop is handled by WordSlice's onDragEnd
      }}
      animate={{
        backgroundColor: isCorrect
          ? 'rgba(34, 197, 94, 0.2)'
          : isDragOver
          ? 'rgba(139, 92, 246, 0.3)'
          : 'rgba(255, 255, 255, 0.3)',
        scale: isDragOver ? 1.05 : 1,
      }}
      transition={{ duration: 0.2 }}
    >
      {isCorrect && placedSlice ? (
        <div
          className="w-full h-full"
          style={{
            backgroundImage: assets.image ? `url('${assets.image}')` : 'none',
            backgroundSize: `${numSlices * 100}% 100%`,
            backgroundPosition: `${position}% 0`,
            backgroundRepeat: 'no-repeat',
          }}
        />
      ) : (
        <span className="text-gray-400 text-2xl">?</span>
      )}
    </motion.div>
  )
}

