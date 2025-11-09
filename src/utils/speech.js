let cachedVoices = []
let voicesPromise = null

const loadVoices = () => {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return Promise.resolve([])
  }

  if (voicesPromise) return voicesPromise

  voicesPromise = new Promise((resolve) => {
    const synth = window.speechSynthesis
    let resolved = false
    let handleVoicesChanged = null

    const finalize = (voices) => {
      if (resolved) return
      resolved = true
      cachedVoices = Array.isArray(voices) ? voices : []
      if (handleVoicesChanged) {
        synth.removeEventListener('voiceschanged', handleVoicesChanged)
      }
      resolve(cachedVoices)
    }

    handleVoicesChanged = () => {
      const voices = synth.getVoices()
      if (voices.length) {
        finalize(voices)
      }
    }

    // Try immediately in case voices are already available
    const immediate = synth.getVoices()
    if (immediate.length) {
      finalize(immediate)
      return
    }

    synth.addEventListener('voiceschanged', handleVoicesChanged)

    // Fallback timeout to prevent hanging forever
    setTimeout(() => finalize(synth.getVoices()), 1200)
  })

  return voicesPromise
}

const pickFriendlyVoice = (voices, { lang, voiceHint }) => {
  if (!voices?.length) return null

  const language = lang || 'en-IN'
  const langBase = language.split('-')[0]

  const normalizedHint = voiceHint?.toLowerCase()

  const matches = (
    predicate => voices.find(predicate)
  )

  const tryFind = (...predicates) => {
    for (const predicate of predicates) {
      const match = matches(predicate)
      if (match) return match
    }
    return null
  }

  if (normalizedHint) {
    const byHint = voices.find((voice) => voice.name.toLowerCase().includes(normalizedHint))
    if (byHint) return byHint
  }

  const byExactLang = tryFind((voice) => voice.lang === language)
  if (byExactLang) return byExactLang

  const byBaseLang = tryFind((voice) => voice.lang?.startsWith(langBase))
  if (byBaseLang) return byBaseLang

  const friendlyByName = tryFind(
    (voice) => /child|kid|girl|female/i.test(voice.name),
    (voice) => /female/i.test(voice.name)
  )
  if (friendlyByName) return friendlyByName

  return voices[0]
}

export const speak = (text, options = {}) => {
  if (!text) return Promise.resolve()

  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn('Speech synthesis not supported in this environment.')
    return Promise.resolve()
  }

  const {
    rate = 0.88,
    pitch = 1.12,
    lang = 'en-IN',
    voiceHint,
    volume = 1
  } = options

  return loadVoices().then((voices) => {
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = rate
    utterance.pitch = pitch
    utterance.volume = volume

    const voice = pickFriendlyVoice(voices, { lang, voiceHint })
    if (voice) {
      utterance.voice = voice
    }

    return new Promise((resolve) => {
      utterance.onend = resolve
      utterance.onerror = (event) => {
        console.warn('Speech synthesis error', event)
        resolve()
      }

      window.speechSynthesis.speak(utterance)
    })
  })
}

