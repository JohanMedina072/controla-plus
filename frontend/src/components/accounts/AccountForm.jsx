function AccountForm({
  formData,
  onChange,
  onSubmit,
  onCancel,
  saving,
  error,
}) {
  return (
    <section className="form-section account-form-section">
      <h2>Crear cuenta</h2>

      <form onSubmit={onSubmit}>
        <label>
          Nombre de la cuenta
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={onChange}
            placeholder="Ejemplo: Cuenta de emergencia"
            maxLength={80}
            required
          />
        </label>

        <label>
          Saldo inicial
          <input
            type="number"
            name="initialBalance"
            value={formData.initialBalance}
            onChange={onChange}
            min="0"
            max="99999999.99"
            step="0.01"
            placeholder="Ejemplo: 200"
            required
            inputMode="decimal"
          />
        </label>

        <div className="form-actions">
          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cuenta'}
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

export default AccountForm
