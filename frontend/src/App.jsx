import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_URL = 'http://localhost:3000/api/movements'
const CATALOG_URL = 'http://localhost:3000/api/catalog'
const USER_ID = '74b90258-dcdd-47a7-ba59-55ebcca23df4'

const formatMoney = (value) =>
  new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(Number(value || 0))

function App() {
  const [movements, setMovements] = useState([])
  const [categories, setCategories] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({
    type: 'EXPENSE',
    amount: '',
    description: '',
    categoryId: '',
    paymentMethodId: '',
  })

  useEffect(() => {
  const loadData = async () => {
    try {
      const [movementsResponse, catalogResponse] = await Promise.all([
        fetch(API_URL),
        fetch(`${CATALOG_URL}?userId=${USER_ID}`),
      ])

      if (!movementsResponse.ok) {
        throw new Error('No se pudieron obtener los movimientos')
      }

      if (!catalogResponse.ok) {
        throw new Error('No se pudo obtener el catálogo')
      }

      const movementsResult = await movementsResponse.json()
      const catalogResult = await catalogResponse.json()

      setMovements(movementsResult.data)
      setCategories(catalogResult.data.categories)
      setPaymentMethods(catalogResult.data.paymentMethods)

      const firstExpenseCategory = catalogResult.data.categories.find(
        (category) => category.type === 'EXPENSE',
      )

      setFormData((current) => ({
        ...current,
        categoryId: firstExpenseCategory?.id || '',
        paymentMethodId: catalogResult.data.paymentMethods[0]?.id || '',
      }))
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

    loadData()
}, [])

  const totals = useMemo(() => {
    return movements.reduce(
      (accumulator, movement) => {
        const amount = Number(movement.amount)

        if (movement.type === 'INCOME') {
          accumulator.income += amount
        } else {
          accumulator.expenses += amount
        }

        return accumulator
      },
      { income: 0, expenses: 0 },
    )
  }, [movements])

  const balance = totals.income - totals.expenses

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

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')

    if (!formData.amount || Number(formData.amount) <= 0) {
      setMessage('Ingresa un monto mayor que cero.')
      return
    }

    try {
      setSaving(true)

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: formData.type,
          amount: Number(formData.amount),
          description: formData.description,
          userId: USER_ID,
          categoryId: formData.categoryId,
          paymentMethodId: formData.paymentMethodId,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'No se pudo guardar el movimiento')
      }

      setMovements((current) => [result.data, ...current])

      setFormData({
        type: 'EXPENSE',
        amount: '',
        description: '',
        categoryId:
          categories.find((category) => category.type === 'EXPENSE')?.id || '',
        paymentMethodId: paymentMethods[0]?.id || '',
      })
      
      setIsFormOpen(false)
      setMessage('Movimiento guardado correctamente.')
    } catch (submissionError) {
      setMessage(submissionError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (movementId) => {
    const confirmed = window.confirm(
      "¿Seguro que deseas eliminar este movimiento?",
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/${movementId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "No se pudo eliminar el movimiento");
      }

      setMovements((current) =>
        current.filter((movement) => movement.id !== movementId),
      );

      setMessage("Movimiento eliminado correctamente.");
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };  




  return (
    <main className="app">
      <header className="header">
        <div>
          <p className="eyebrow">CONTROL FINANCIERO PERSONAL</p>
          <h1>Controla+</h1>
          <p>Hola, Johan. Aquí tienes un resumen de tus movimientos.</p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => setIsFormOpen((current) => !current)}
        >
          + Nuevo movimiento
        </button>
      </header>

      {isFormOpen && (
        <section className="form-section">
          <h2>Registrar movimiento</h2>

          <form onSubmit={handleSubmit}>
            <label>
              Tipo
              <select name="type" value={formData.type} onChange={handleChange}>
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
                onChange={handleChange}
                placeholder="Ejemplo: 25"
              />
            </label>

            <label>
              Descripción
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Ejemplo: Pasaje"
              />
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
          
                

            <div className="form-actions">
              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar movimiento'}
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={() => setIsFormOpen(false)}
              >
                Cancelar
              </button>
            </div>

            {message && <p className="form-message">{message}</p>}
          </form>
        </section>
      )}

      <section className="summary-grid">
        <article className="summary-card">
          <span>Balance</span>
          <strong>{formatMoney(balance)}</strong>
        </article>

        <article className="summary-card">
          <span>Ingresos</span>
          <strong>{formatMoney(totals.income)}</strong>
        </article>

        <article className="summary-card">
          <span>Gastos</span>
          <strong>{formatMoney(totals.expenses)}</strong>
        </article>
      </section>

      <section className="movements-section">
        <div className="section-title">
          <h2>Movimientos recientes</h2>
          <p>Datos obtenidos desde PostgreSQL.</p>
        </div>

        {loading && <p>Cargando movimientos...</p>}

        {error && <p className="error">{error}</p>}

        {!loading && !error && movements.length === 0 && (
          <p>No hay movimientos registrados.</p>
        )}

        {!loading && !error && movements.length > 0 && (
          <div className="movement-list">
            {movements.map((movement) => (
              <article className="movement-item" key={movement.id}>
                <div>
                  <strong>{movement.description || 'Sin descripción'}</strong>
                  <span>{movement.category?.name || 'Comida'}</span>
                </div>

                <div className="movement-actions">
                  <strong
                    className={movement.type === "INCOME" ? "income" : "expense"}
                  >
                    {movement.type === "INCOME" ? "+" : "-"}
                    {formatMoney(movement.amount)}
                  </strong>

                  <button
                    type="button"
                    className="delete-button"
                    onClick={() => handleDelete(movement.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default App