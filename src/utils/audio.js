let audioContext = null

export const initAudioContext = () => {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)()
    } catch (e) {
      console.log('Audio not available')
    }
  }
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume()
  }
  return audioContext
}

export const getAudioContext = () => audioContext

export const ensureAudioReady = () => {
  const ctx = initAudioContext()
  if (ctx && ctx.state === 'suspended') {
    ctx.resume()
  }
  return ctx
}

