import { useState } from 'react'
import validateMovement from '../../utils/validateMovement'

const FIELD_LABELS = {
  'tipo de movimiento': 'tipo',
  monto: 'monto',
  cuenta: 'cuenta',
  categoría: 'categoría',
  'método de pago': 'método de pago',
}

function VoiceMovementReview({
  draft,
  categories,
  paymentMethods,
  accounts,
  onSubmit,
  onCancel,
  saving,
  error,
}) {
  const [formData, setFormData] = useState(draft.formData)
  const [validationError, setValidationError] = useState('')
  const activeAccounts = accounts.filter((account) => account.isActive)
  const availableCategories = categories.filter(
    (category) => category.type === formData.type,
  )

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((current) => {
      if (name === 'type') {
        const firstCategory = categories.find(
          (category) => category.type === value,
        )

        return {
          ...current,
          type: value,
          categoryId: firstCategory?.id || '',
        }
      }

      return {
        ...current,
        [name]: value,
      }
    })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setValidationError('')

    const message = validateMovement(formData)

    if (message) {
      setValidationError(message)
      return
    }

    onSubmit(formData)
  }

  const missingText = draft.missingFields
    .map((field) => FIELD_LABELS[field] || field)
    .join(', ')

  return (
    <section className="voice-review-section" aria-labelledby="voice-review-title">
      <div className="voice-review-header">
        <div>
          <p className="quick-entry-eyebrow">REVISIÓN POR VOZ</p>
          <h2 id="voice-review-title">Confirma el movimiento</h2>
          <p>La aplicación entendió lo siguiente:</p>
        </div>
        <button type="button" className="secondary-button" onClick={onCancel}>
          Cancelar
        </button>
      </div>

      <blockquote className="voice-transcript">“{draft.transcript}”</blockquote>

      {draft.dateWarning && <p className="form-error">{draft.dateWarning}</p>}
      {missingText && (
        <p className="voice-review-help">
          Completa o revisa estos datos: {missingText}.
        </p>
      )}

      <form className="voice-review-form" onSubmit={handleSubmit}>
        <label>
          Tipo
          <select name="type" value={formData.type} onChange={handleChange}>
            <option value="">Selecciona un tipo</option>
            <option value="EXPENSE">Gasto</option>
            <option value="INCOME">Ingreso</option>
          </select>
        </label>

        <label>
          Monto
          <input
            type="number"
            name="amount"
            min="0.01"
            max="99999999.99"
            step="0.01"
            value={formData.amount}
            onChange={handleChange}
            required
            inputMode="decimal"
          />
        </label>

        <label>
          Descripción
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            maxLength="255"
          />
        </label>

        <label>
          Cuenta
          <select
            name="accountId"
            value={formData.accountId}
            onChange={handleChange}
            required
          >
            <option value="">Selecciona una cuenta</option>
            {activeAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Categoría
          <select
            name="categoryId"
            value={formData.categoryId}
            onChange={handleChange}
            required
          >
            <option value="">Selecciona una categoría</option>
            {availableCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Método de pago
          <select
            name="paymentMethodId"
            value={formData.paymentMethodId}
            onChange={handleChange}
            required
          >
            <option value="">Selecciona un método</option>
            {paymentMethods.map((method) => (
              <option key={method.id} value={method.id}>
                {method.name}
              </option>
            ))}
          </select>
        </label>

        {(validationError || error) && (
          <p className="form-error">{validationError || error}</p>
        )}

        <div className="form-actions">
          <button
            type="submit"
            className="primary-button"
            disabled={saving || Boolean(draft.dateWarning)}
          >
            {saving ? 'Guardando...' : 'Confirmar movimiento'}
          </button>
          <button type="button" className="secondary-button" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </form>
    </section>
  )
}

export default VoiceMovementReview
