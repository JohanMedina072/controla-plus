import { useEffect, useRef, useState } from 'react'

function VoiceMovementButton({ onTranscript }) {
  const recognitionRef = useRef(null)
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState('')
  const [fallbackText, setFallbackText] = useState('')

  const SpeechRecognition =
    typeof window === 'undefined'
      ? null
      : window.SpeechRecognition || window.webkitSpeechRecognition

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
    }
  }, [])

  const startListening = () => {
    if (!SpeechRecognition) {
      setError('Tu navegador no permite entrada por voz. Usa el campo de texto.')
      return
    }

    if (isListening) return

    const recognition = new SpeechRecognition()

    recognition.lang = 'es-PE'
    recognition.interimResults = false
    recognition.continuous = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setError('')
      setIsListening(true)
    }

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim()

      setIsListening(false)

      if (!transcript) {
        setError('No se entendió ningún movimiento. Inténtalo nuevamente.')
        return
      }

      onTranscript(transcript)
    }

    recognition.onerror = (event) => {
      setIsListening(false)

      const errorMessages = {
        'audio-capture': 'No se encontró un micrófono disponible.',
        'not-allowed': 'Permite el acceso al micrófono para usar esta función.',
        'no-speech': 'No se detectó voz. Inténtalo nuevamente.',
        network:
          'El servicio de reconocimiento no respondió. Revisa tu conexión o usa texto.',
        'service-not-allowed':
          'El navegador bloqueó el servicio de voz. Usa texto o revisa los permisos.',
        aborted: 'El reconocimiento se canceló. Inténtalo nuevamente.',
      }

      setError(
        errorMessages[event.error] ||
          'No se pudo reconocer la voz. Puedes registrar el movimiento manualmente.',
      )
    }

    recognition.onend = () => {
      setIsListening(false)
      recognitionRef.current = null
    }

    recognitionRef.current = recognition

    try {
      recognition.start()
    } catch {
      setIsListening(false)
      recognitionRef.current = null
      setError('No se pudo iniciar el micrófono. Inténtalo nuevamente.')
    }
  }

  const stopListening = () => {
    if (!isListening) return
    recognitionRef.current?.stop()
  }

  const handlePointerDown = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return

    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    startListening()
  }

  const handlePointerUp = (event) => {
    event.preventDefault()
    stopListening()
  }

  const handleKeyDown = (event) => {
    if (!['Enter', ' '].includes(event.key) || event.repeat) return

    event.preventDefault()
    startListening()
  }

  const handleKeyUp = (event) => {
    if (!['Enter', ' '].includes(event.key)) return

    event.preventDefault()
    stopListening()
  }

  const handleFallbackSubmit = (event) => {
    event.preventDefault()

    if (!fallbackText.trim()) {
      setError('Escribe una frase para analizarla.')
      return
    }

    setError('')
    onTranscript(fallbackText.trim())
    setFallbackText('')
  }

  return (
    <div className="voice-entry voice-entry-floating">
      <button
        type="button"
        className={[
          'voice-button',
          'voice-button-floating',
          isListening ? 'listening' : '',
          !SpeechRecognition ? 'unavailable' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={stopListening}
        onBlur={stopListening}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onContextMenu={(event) => event.preventDefault()}
        aria-label={
          isListening
            ? 'Suelta para terminar la grabación'
            : 'Mantén presionado para registrar por voz'
        }
        aria-pressed={isListening}
        title="Registrar por voz"
      >
        <svg
          className="voice-button-icon"
          viewBox="0 0 24 24"
          role="img"
          aria-label="Micrófono"
        >
          <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z" />
          <path d="M5 11a7 7 0 0 0 14 0" />
          <path d="M12 18v3" />
          <path d="M8 21h8" />
        </svg>
        <span className="voice-button-label">
          {isListening
            ? 'Suelta para terminar'
            : SpeechRecognition
              ? 'Registrar por voz'
              : 'Voz no disponible'}
        </span>
      </button>

      <details className="voice-text-fallback voice-text-fallback-floating">
        <summary>Escribir la frase</summary>
        <form onSubmit={handleFallbackSubmit}>
          <input
            type="text"
            value={fallbackText}
            onChange={(event) => setFallbackText(event.target.value)}
            placeholder="Ej.: gasté 3.50 en pan con pollo"
            aria-label="Frase del movimiento"
          />
          <button type="submit" className="secondary-button">
            Analizar texto
          </button>
        </form>
      </details>

      {error && (
        <p className="voice-entry-error" role="status">
          {error}
        </p>
      )}
    </div>
  )
}

export default VoiceMovementButton
