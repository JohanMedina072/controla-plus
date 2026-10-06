function QuickMovementForm({
  formData,
  categories,
  paymentMethods,
  accounts,
  onChange,
  onSubmit,
  onOpenDetailed,
  saving,
  error,
  message,
}) {
  const activeAccounts = accounts.filter((account) => account.isActive)
  const availableCategories = categories.filter(
    (category) => category.type === formData.type,
  )

  return (
    <section className="quick-entry-section">
      <div className="quick-entry-header">
        <div>
          <p className="quick-entry-eyebrow">REGISTRO RÁPIDO</p>
          <h2>¿Qué pasó hoy?</h2>
          <p>Guarda un gasto o ingreso con los datos esenciales.</p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={onOpenDetailed}
        >
          Registro detallado
        </button>
      </div>

      <form className="quick-entry-form" onSubmit={onSubmit}>
        <label>
          Tipo
          <select name="type" value={formData.type} onChange={onChange}>
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
            onChange={onChange}
            placeholder="Ejemplo: 2.50"
            required
            inputMode="decimal"
            autoFocus
          />
        </label>

        <label>
          ¿En qué fue?
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={onChange}
            placeholder="Ejemplo: Sprite"
            maxLength={255}
          />
        </label>

        <label>
          Cuenta
          <select
            name="accountId"
            value={formData.accountId}
            onChange={onChange}
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

        <details className="quick-entry-options">
          <summary>Ajustar clasificación</summary>

          <div className="quick-entry-options-grid">
            <label>
              Categoría
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={onChange}
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
                onChange={onChange}
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
          </div>
        </details>

        {activeAccounts.length === 0 && (
          <p className="form-error">
            Crea una cuenta activa antes de registrar un movimiento.
          </p>
        )}

        <div className="quick-entry-actions">
          <button
            type="submit"
            className="primary-button"
            disabled={saving || activeAccounts.length === 0}
          >
            {saving ? 'Guardando...' : 'Guardar movimiento'}
          </button>
        </div>

        {error && <p className="form-error">{error}</p>}
        {message && <p className="form-message">{message}</p>}
      </form>
    </section>
  )
}

export default QuickMovementForm
