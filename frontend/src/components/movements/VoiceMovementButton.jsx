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

  const handleToggle = () => {
    if (!SpeechRecognition) {
      setError('Tu navegador no permite entrada por voz. Usa el campo de texto.')
      return
    }

    if (isListening) {
      recognitionRef.current?.stop()
      return
    }

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

    recognition.onend = () => setIsListening(false)
    recognitionRef.current = recognition

    try {
      recognition.start()
    } catch {
      setIsListening(false)
      setError('No se pudo iniciar el micrófono. Inténtalo nuevamente.')
    }
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
    <div className="voice-entry">
      <button
        type="button"
        className={
          isListening
            ? 'voice-button listening'
            : SpeechRecognition
              ? 'voice-button'
              : 'voice-button unavailable'
        }
        onClick={handleToggle}
        aria-pressed={isListening}
      >
        <span aria-hidden="true">🎙️</span>
        {isListening
          ? 'Escuchando...'
          : SpeechRecognition
            ? 'Registrar por voz'
            : 'Voz no disponible'}
      </button>
      <details className="voice-text-fallback">
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
      {error && <p className="voice-entry-error">{error}</p>}
    </div>
  )
}

export default VoiceMovementButton
