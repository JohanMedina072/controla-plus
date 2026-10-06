import { useState } from 'react'
import { login, register } from '../../services/auth.service'

const INITIAL_FORM = {
  name: '',
  email: '',
  password: '',
}

function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const isRegistering = mode === 'register'

  const handleModeChange = (nextMode) => {
    setMode(nextMode)
    setFormData(INITIAL_FORM)
    setError('')
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    try {
      setSaving(true)

      const session = isRegistering
        ? await register({
            name: formData.name.trim(),
            email: formData.email.trim(),
            password: formData.password,
          })
        : await login({
            email: formData.email.trim(),
            password: formData.password,
          })

      onAuthenticated(session)
    } catch (authError) {
      setError(authError.message || 'No se pudo completar la operación.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-intro">
          <p className="eyebrow">CONTROL FINANCIERO PERSONAL</p>
          <h1 id="auth-title">Controla+</h1>
          <p>
            Organiza tus movimientos, cuentas y recordatorios desde un solo
            lugar.
          </p>
        </div>

        <div className="auth-tabs" role="tablist" aria-label="Acceso">
          <button
            type="button"
            className={mode === 'login' ? 'auth-tab active' : 'auth-tab'}
            onClick={() => handleModeChange('login')}
            role="tab"
            aria-selected={mode === 'login'}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'auth-tab active' : 'auth-tab'}
            onClick={() => handleModeChange('register')}
            role="tab"
            aria-selected={mode === 'register'}
          >
            Crear cuenta
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegistering && (
            <label>
              Nombre
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                autoComplete="name"
                maxLength="80"
                required
              />
            </label>
          )}

          <label>
            Correo electrónico
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </label>

          <label>
            Contraseña
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              autoComplete={isRegistering ? 'new-password' : 'current-password'}
              minLength="8"
              maxLength="128"
              required
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="primary-button" disabled={saving}>
            {saving
              ? 'Procesando...'
              : isRegistering
                ? 'Crear cuenta'
                : 'Entrar'}
          </button>
        </form>

        <p className="auth-note">
          Tus datos se guardan separados por usuario. No se solicitan datos de
          bancos ni se conectan cuentas externas.
        </p>
      </section>
    </main>
  )
}

export default AuthPage
