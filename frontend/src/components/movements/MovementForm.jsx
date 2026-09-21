function MovementForm({
  formData,
  categories,
  paymentMethods,
  onChange,
  onSubmit,
  onCancel,
  saving,
  message,
  isEditing,
}) {
  return (
    <section className="form-section">
      <h2>{isEditing ? 'Editar movimiento' : 'Registrar movimiento'}</h2>

      <form onSubmit={onSubmit}>
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
            step="0.01"
            value={formData.amount}
            onChange={onChange}
            placeholder="Ejemplo: 25"
          />
        </label>

        <label>
          Descripción
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={onChange}
            placeholder="Ejemplo: Pasaje"
          />
        </label>

        <label>
          Categoría
          <select
            name="categoryId"
            value={formData.categoryId}
            onChange={onChange}
            required
          >
            <option value="">Selecciona una categoría</option>

            {categories
              .filter((category) => category.type === formData.type)
              .map((category) => (
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

        <div className="form-actions">
          <button type="submit" className="primary-button" disabled={saving}>
            {saving
              ? 'Guardando...'
              : isEditing
                ? 'Actualizar movimiento'
                : 'Guardar movimiento'}
          </button>

          <button type="button" className="secondary-button" onClick={onCancel}>
            Cancelar
          </button>
        </div>

        {message && <p className="form-message">{message}</p>}
      </form>
    </section>
  )
}

export default MovementForm