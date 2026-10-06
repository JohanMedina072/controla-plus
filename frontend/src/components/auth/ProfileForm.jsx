import { useState } from 'react'
import { updateProfile } from '../../services/auth.service'

function ProfileForm({ user, onCancel, onUpdated }) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    currentPassword: '',
    newPassword: '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

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

    if (!formData.name.trim()) {
      setError('El nombre es obligatorio.')
      return
    }

    if (!formData.email.trim()) {
      setError('El correo es obligatorio.')
      return
    }

    if (!formData.currentPassword) {
      setError('Escribe tu contraseña actual para guardar cambios.')
      return
    }

    if (formData.newPassword && formData.newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.')
      return
    }

    try {
      setSaving(true)

      const updatedUser = await updateProfile({
        name: formData.name.trim(),
        email: formData.email.trim(),
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword || undefined,
      })

      onUpdated(updatedUser)
    } catch (profileError) {
      setError(profileError.message || 'No se pudo actualizar el perfil.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="profile-section" aria-labelledby="profile-title">
      <div className="profile-header">
        <div>
          <p className="eyebrow">CONFIGURACIÓN DE USUARIO</p>
          <h2 id="profile-title">Mi perfil</h2>
          <p>Actualiza tus datos sin crear otra cuenta.</p>
        </div>
      </div>

      <form className="profile-form" onSubmit={handleSubmit}>
        <label>
          Nombre
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            maxLength="80"
            autoComplete="name"
            required
          />
        </label>

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
          Contraseña actual
          <input
            type="password"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            autoComplete="current-password"
            required
          />
        </label>

        <label>
          Nueva contraseña <span>(opcional)</span>
          <input
            type="password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            autoComplete="new-password"
            minLength="8"
            maxLength="128"
          />
        </label>

        <p className="profile-help">
          Para cambiar el correo o la contraseña, se verificará tu contraseña
          actual.
        </p>

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={onCancel}
            disabled={saving}
          >
            Cancelar
          </button>
        </div>
      </form>
    </section>
  )
}

export default ProfileForm
