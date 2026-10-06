import {
  REMINDER_NAMES,
  REMINDER_TYPES,
} from '../../utils/reminderOptions'

function ReminderForm({
  formData,
  onChange,
  onSubmit,
  onCancel,
  saving,
  error,
  isEditing,
}) {
  const names = REMINDER_NAMES[formData.type] || []

  return (
    <section className="form-section reminder-form-section">
      <h2>{isEditing ? 'Editar recordatorio' : 'Nuevo recordatorio'}</h2>

      <form onSubmit={onSubmit}>
        <label>
          Tipo
          <select name="type" value={formData.type} onChange={onChange}>
            {REMINDER_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Pago
          <select name="name" value={formData.name} onChange={onChange} required>
            <option value="">Selecciona una opción</option>

            {names.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Próximo pago
          <input
            type="date"
            name="nextDueDate"
            value={formData.nextDueDate}
            onChange={onChange}
            required
          />
        </label>

        <p className="form-help">
          Elige la fecha del próximo pago, incluido el mes. Después de marcarlo
          como pagado, avanzará automáticamente al siguiente mes.
        </p>

        <label>
          Monto opcional
          <input
            type="number"
            name="amount"
            min="0.01"
            max="99999999.99"
            step="0.01"
            value={formData.amount}
            onChange={onChange}
            placeholder="Ejemplo: 150"
            inputMode="decimal"
          />
        </label>

        <p className="form-help">
          Este recordatorio no modifica cuentas ni crea movimientos.
        </p>

        <div className="form-actions">
          <button type="submit" className="primary-button" disabled={saving}>
            {saving
              ? 'Guardando...'
              : isEditing
                ? 'Actualizar recordatorio'
                : 'Guardar recordatorio'}
          </button>

          <button type="button" className="secondary-button" onClick={onCancel}>
            Cancelar
          </button>
        </div>

        {error && <p className="form-error">{error}</p>}
      </form>
    </section>
  )
}

export default ReminderForm
